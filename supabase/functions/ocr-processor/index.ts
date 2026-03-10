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
                        content: `Eres un experto contable de República Dominicana especializado en extraer datos de facturas (e-CF y comprobantes fiscales).
Tu único objetivo es analizar la imagen de la factura y extraer exactamente los siguientes campos, devolviendo UNICAMENTE un objeto JSON válido.

Reglas de extracción:
1. rnc_emisor: Buscar el RNC de la empresa que emite la factura (suele estar arriba). Formato: 9 a 11 dígitos, sin guiones.
2. rnc_comprador: Buscar "RNC/Cédula CLiente", "RNC Comprador" o similar. Si es "Factura para Consumidor Final", ES PROBABLE QUE SEA null.
3. ncf: Buscar "NCF", "e-NCF", "Comprobante Fiscal". Suele empezar con B, E followed by 11 digits (e.g., E320003240744).
4. total: Buscar "TOTAL", "Total Facturado", "Monto Total". Es el valor final a pagar. Debe ser un NUMERO DECIMAL (float). Si hay comas para miles, quítalas. Usa punto para decimales.
5. itbis: Buscar "ITBIS" (18% o 16%). Debe ser un NUMERO DECIMAL. Si no hay, o dice exento, pon 0.00.
6. razon_social_comprador: Nombre del cliente. Si es consumidor final o está en blanco, pon null.

FORMATO ESTRICTO REQUERIDO:
{
  "rnc_emisor": "...",
  "rnc_comprador": "...",
  "ncf": "...",
  "total": 0.00,
  "itbis": 0.00,
  "razon_social_comprador": "..."
}`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analiza minuciosamente esta factura deteniéndote en los valores numéricos al final de la tirilla para encontrar el TOTAL exacto a pagar y el ITBIS cobrado."
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
