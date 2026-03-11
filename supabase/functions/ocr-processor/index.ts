import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { storagePath } = await req.json();

        if (!storagePath) {
            throw new Error("storagePath is required");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Obtener la URL pública o descargar la imagen
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("invoice-scans")
            .download(storagePath);

        if (downloadError) throw downloadError;

        // Convertir a Base64 para enviarlo a OpenAI (chunked to avoid stack overflow)
        const arrayBuffer = await fileData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        const base64Image = btoa(binary);

        // 2. Llamar a OpenAI Vision
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) throw new Error("OPENAI_API_KEY not set in Supabase Secrets");

        console.log("Enviando imagen a OpenAI...");
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Eres un experto contable de República Dominicana especializado en extraer datos de facturas para el reporte 606 (Compras) de la DGII.
Tu objetivo es analizar la imagen de la factura y extraer TODOS los campos del formato 606, devolviendo ÚNICAMENTE un objeto JSON válido.

CAMPOS A EXTRAER:

1. DATOS DEL EMISOR:
   - rnc_emisor: RNC de la empresa emisora (9-11 dígitos, sin guiones). Usualmente arriba de la factura.
   - razon_social_emisor: Nombre completo de la empresa emisora.

2. DATOS DEL COMPRADOR:
   - rnc_comprador: RNC/Cédula del comprador. Si dice "Consumidor Final" o está vacío, pon null.
   - razon_social_comprador: Nombre del comprador. Si es consumidor final, pon null.

3. DATOS DEL COMPROBANTE:
   - ncf: Número de Comprobante Fiscal. Suele empezar con B o E seguido de 11 dígitos (ej: E320003240744).
   - fecha_comprobante: Fecha de emisión en formato YYYY-MM-DD.
   - fecha_pago: Si está disponible, fecha de pago en formato YYYY-MM-DD. Si no, usar la misma fecha del comprobante.

4. CLASIFICACIÓN:
   - tipo_gasto: Clasificar como "servicios", "bienes" o "mixto" según lo que se vendió.

5. MONTOS (TODOS EN FORMATO DECIMAL, SIN COMAS):
   - monto_facturado: Subtotal antes de impuestos (monto gravado).
   - itbis_facturado: ITBIS cobrado (18% o 16% del monto gravado).
   - itbis_retenido: ITBIS retenido (si aplica). Usualmente 0.00.
   - isr_retenido: ISR retenido (si aplica). Usualmente 0.00.
   - propina_legal: Propina legal 10% (si aplica, principalmente restaurantes). Usualmente 0.00.
   - total: TOTAL FINAL a pagar (suma de todo).

6. NIVELES DE CONFIANZA (0-100):
   Para cada campo crítico, evalúa qué tan seguro estás de la extracción:
   - 85-100: Muy claro, perfectamente legible
   - 60-84: Legible pero con alguna ambigüedad
   - 0-59: Difícil de leer o muy borroso

FORMATO JSON ESTRICTO:
{
  "rnc_emisor": "...",
  "razon_social_emisor": "...",
  "rnc_comprador": "..." | null,
  "razon_social_comprador": "..." | null,
  "ncf": "...",
  "fecha_comprobante": "YYYY-MM-DD",
  "fecha_pago": "YYYY-MM-DD",
  "tipo_gasto": "servicios" | "bienes" | "mixto",
  "monto_facturado": 0.00,
  "itbis_facturado": 0.00,
  "itbis_retenido": 0.00,
  "isr_retenido": 0.00,
  "propina_legal": 0.00,
  "total": 0.00,
  "confidence": {
    "rnc_emisor": 0-100,
    "rnc_comprador": 0-100,
    "ncf": 0-100,
    "total": 0-100,
    "itbis_facturado": 0-100,
    "fecha_comprobante": 0-100
  }
}

IMPORTANTE:
- Todos los números deben ser DECIMALES (float), sin comas.
- Las fechas en formato YYYY-MM-DD.
- Si un campo no se encuentra, usa null para strings o 0.00 para números.
- Los niveles de confianza deben reflejar la claridad de lectura del campo en la imagen.`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analiza minuciosamente esta factura dominicana y extrae TODOS los campos del formato 606. Presta especial atención a: 1) RNC del emisor y comprador, 2) NCF completo, 3) Fechas, 4) Desglose de montos (subtotal, ITBIS, total), 5) Tipo de producto/servicio. Evalúa la claridad de cada campo para los niveles de confianza."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 500,
            }),
        });

        const aiResult = await response.json();
        const extractedData = JSON.parse(aiResult.choices[0].message.content);

        console.log("Datos extraídos:", extractedData);

        return new Response(JSON.stringify(extractedData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error en ocr-processor:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
