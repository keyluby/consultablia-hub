from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pytesseract
import cv2
import numpy as np
import os

app = FastAPI(title="Consultablia OCR Service", version="1.0.0")

# Set paths for Windows
tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OcrResponse(BaseModel):
    raw_text: str
    rnc_comprador: Optional[str] = None
    ncf: Optional[str] = None
    total_facturado: Optional[float] = None
    itbis: Optional[float] = None
    success: bool

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Applies OpenCV transformations to make the receipt more legible for Tesseract."""
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Resize (upscale 2x for better text reading)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    # 3. Adaptive Thresholding (Binarization to remove shadows)
    # Using Gaussian adaptive thresholding is often best for receipts
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    return thresh

def extract_financial_data(text: str) -> dict:
    """Uses Regex and heuristics to parse Dominican billing data."""
    data = {"rnc_comprador": None, "ncf": None, "total_facturado": None, "itbis": None}
    
    # Normalize text
    lines = [line.strip().upper() for line in text.split('\n') if line.strip()]
    full_text = " ".join(lines)
    
    # 1. RNC (9 or 11 digits, often preceded by RNC or CEDULA)
    # Pattern: RNC followed by spaces/colons and 9/11 digits
    rnc_match = re.search(r'(?:RNC|CEDULA|CED|R\.N\.C\.?)[\s:.-]*([0-9]{9,11})', full_text)
    if not rnc_match:
        # Fallback: Just look for any isolated 9 or 11 digit number
        rnc_match = re.search(r'\b([0-9]{9}|[0-9]{11})\b', full_text)
    if rnc_match:
        data['rnc_comprador'] = rnc_match.group(1)

    # 2. NCF (11 or 13 alphanumeric chars starting with B or E)
    # Series B (older), Series E (new e-CF)
    ncf_match = re.search(r'\b([BE][0-9]{10,12})\b', full_text)
    if ncf_match:
        data['ncf'] = ncf_match.group(1)

    # 3. Total Facturado
    # Look for "TOTAL", "MONTO A PAGAR" followed by an amount (e.g. 1,200.50 or 1200.50)
    # Pattern explanation: (TOTAL|PAGAR)\s*[$RD]*\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))
    total_matches = re.finditer(r'(?:TOTAL|PAGAR|NETO|MONTO)[\s:$RD]*([0-9]{1,3}(?:[,.][0-9]{3})*[,.][0-9]{2})', full_text)
    totals = []
    for m in total_matches:
        raw_val = m.group(1).replace(',', '') # clean commas
        try:
            totals.append(float(raw_val))
        except:
            pass
    if totals:
        data['total_facturado'] = max(totals) # The total is usually the largest "total" labeled number

    # 4. ITBIS (Tax: 18% in DR)
    itbis_matches = re.finditer(r'(?:ITBIS|IMPUESTO|TAX)[\s:18%]*[$RD]*([0-9]{1,3}(?:[,.][0-9]{3})*[,.][0-9]{2})', full_text)
    itb_vals = []
    for m in itbis_matches:
        raw_val = m.group(1).replace(',', '')
        try:
            itb_vals.append(float(raw_val))
        except:
            pass
    if itb_vals:
        data['itbis'] = max(itb_vals)

    return data


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ocr"}

@app.post("/api/v1/ocr", response_model=OcrResponse)
async def process_invoice(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")
    
    try:
        image_bytes = await file.read()
        
        # 1. Pre-process image with OpenCV
        processed_img = preprocess_image(image_bytes)
        
        # 2. Run OCR with Tesseract
        # lang='spa' for Spanish
        # --psm 6 assumes a single uniform block of text
        tessdata_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tessdata')
        custom_config = rf'--tessdata-dir "{tessdata_dir}" --oem 3 --psm 6 -l spa'
        raw_text = pytesseract.image_to_string(processed_img, config=custom_config)
        
        # 3. Extract data via Regex
        extracted_data = extract_financial_data(raw_text)
        
        return OcrResponse(
            raw_text=raw_text,
            rnc_comprador=extracted_data['rnc_comprador'],
            ncf=extracted_data['ncf'],
            total_facturado=extracted_data['total_facturado'],
            itbis=extracted_data['itbis'],
            success=True
        )
        
    except Exception as e:
        return OcrResponse(
            raw_text=f"Error interno: {str(e)}",
            success=False
        )
