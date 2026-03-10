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
                        content: "Eres un experto en extracción de datos de facturas dominicanas (e-CF). Responde únicamente con un objeto JSON válido."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analiza esta factura y extrae: rnc_emisor, rnc_comprador, ncf (o e-NCF), total (monto total), itbis (monto del itbis) y razon_social_comprador. Si no encuentras alguno, pon null. Formato: { \"rnc_emisor\": \"...\", \"rnc_comprador\": \"...\", \"ncf\": \"...\", \"total\": 0.0, \"itbis\": 0.0, \"razon_social_comprador\": \"...\" }"
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
