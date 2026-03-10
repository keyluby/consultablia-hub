import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No se incluyó archivo' }, { status: 400 });
        }

        // 1. Forward the multipart form data directly to the Python OCR service
        const pythonResponse = await fetch('http://localhost:3003/api/v1/ocr', {
            method: 'POST',
            body: formData,
        });

        if (!pythonResponse.ok) {
            throw new Error('Fallo al procesar en el motor OCR');
        }

        const data = await pythonResponse.json();

        // 2. Return the extracted data to the frontend
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Error in OCR upload:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
