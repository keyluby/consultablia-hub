"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = certificateRoutes;
const zod_1 = require("zod");
const certificate_service_1 = require("../services/certificate.service");
const UploadCertSchema = zod_1.z.object({
    p12Base64: zod_1.z.string(),
    passwordP12: zod_1.z.string(),
    nombreAlias: zod_1.z.string(),
    entidadEmisora: zod_1.z.string(),
    numeroSerie: zod_1.z.string(),
    fechaEmision: zod_1.z.string().transform((str) => new Date(str)),
    fechaVencimiento: zod_1.z.string().transform((str) => new Date(str)),
    sha256Fingerprint: zod_1.z.string().length(64)
});
async function certificateRoutes(app) {
    app.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
    app.post('/api/v1/tenants/:id/certificates', async (request, reply) => {
        try {
            const { id: tenantId } = request.params;
            // TODO: Include tenant RBAC check
            const data = UploadCertSchema.parse(request.body);
            const certificado = await (0, certificate_service_1.uploadCertificate)({
                ...data,
                tenantId
            });
            return reply.code(201).send({ message: 'Certificado cargado exitosamente en Vault', certificado });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_CERTIFICADO', message: error.message });
        }
    });
    app.get('/api/v1/tenants/:id/certificates', async (request, reply) => {
        try {
            const { id: tenantId } = request.params;
            // TODO: Include tenant RBAC check
            const certificados = await (0, certificate_service_1.listCertificates)(tenantId);
            return reply.send({ data: certificados });
        }
        catch (error) {
            return reply.code(500).send({ error: 'ERROR_INTERNO', message: error.message });
        }
    });
}
//# sourceMappingURL=certificate.routes.js.map