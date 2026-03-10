import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { uploadCertificate, listCertificates } from '../services/certificate.service';

const UploadCertSchema = z.object({
    p12Base64: z.string(),
    passwordP12: z.string(),
    nombreAlias: z.string(),
    entidadEmisora: z.string(),
    numeroSerie: z.string(),
    fechaEmision: z.string().transform((str) => new Date(str)),
    fechaVencimiento: z.string().transform((str) => new Date(str)),
    sha256Fingerprint: z.string().length(64)
});

export default async function certificateRoutes(app: FastifyInstance) {

    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    app.post('/api/v1/tenants/:id/certificates', async (request, reply) => {
        try {
            const { id: tenantId } = request.params as { id: string };
            // TODO: Include tenant RBAC check
            const data = UploadCertSchema.parse(request.body);

            const certificado = await uploadCertificate({
                ...data,
                tenantId
            });

            return reply.code(201).send({ message: 'Certificado cargado exitosamente en Vault', certificado });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_CERTIFICADO', message: error.message });
        }
    });

    app.get('/api/v1/tenants/:id/certificates', async (request, reply) => {
        try {
            const { id: tenantId } = request.params as { id: string };
            // TODO: Include tenant RBAC check
            const certificados = await listCertificates(tenantId);
            return reply.send({ data: certificados });
        } catch (error: any) {
            return reply.code(500).send({ error: 'ERROR_INTERNO', message: error.message });
        }
    });

}
