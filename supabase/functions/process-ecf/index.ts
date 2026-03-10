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
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { invoiceId } = await req.json();

        // 1. Obtener la data de la factura e ítems
        const { data: invoice, error: invError } = await supabase
            .from("invoices")
            .select("*, invoice_items(*)")
            .eq("id", invoiceId)
            .single();

        if (invError) throw invError;

        // 2. Generar el XML (Estructura DGII)
        // TODO: Implementar mapeo exacto a XSD de DGII
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<eCF xmlns="http://dgii.gov.do/sicfe/ecf">
  <Encabezado>
    <IdDoc>
      <TipoeCF>${invoice.tipo_ecf}</IdDoc>
      <eNCF>${invoice.e_ncf}</eNCF>
      <FechaEmis>${new Date(invoice.fecha_emision).toISOString().split('T')[0]}</FechaEmis>
    </IdDoc>
    <Emisor>
      <RNCEmisor>101672339</RNCEmisor>
      <RazonSocialEmisor>Consultablia SRL</RazonSocialEmisor>
    </Emisor>
    <Totales>
      <MontoTotal>${invoice.total_facturado}</MontoTotal>
    </Totales>
  </Encabezado>
</eCF>`;

        // 3. Firmar el XML (Requiere certificado P12)
        // TODO: Implementar lógica de firma con WebCrypto o librería Deno compatible
        console.log("XML Generado para:", invoice.e_ncf);

        // 4. Enviar a la DGII (Endpoint de Recepción)
        // const dgiiResponse = await fetch("https://statest.dgii.gov.do/recepcion/api/ecf", { ... });

        return new Response(
            JSON.stringify({
                message: "e-CF Procesado",
                e_ncf: invoice.e_ncf,
                xml_preview: xmlContent.substring(0, 100) + "..."
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
