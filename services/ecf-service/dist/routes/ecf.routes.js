"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ecfRoutes;
const ecf_schema_1 = require("../schemas/ecf.schema");
const ecf_service_1 = require("../services/ecf.service");
const database_1 = require("@consultablia/database");
async function ecfRoutes(app) {
    app.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
    app.post('/api/v1/ecf', async (request, reply) => {
        try {
            const tenantId = request.headers['x-tenant-id'] || '';
            if (!tenantId) {
                return reply.code(400).send({ error: 'Falta header x-tenant-id' });
            }
            // TODO: check if user has access to this tenantId via DB query
            const data = ecf_schema_1.CreateEcfSchema.parse(request.body);
            const ecf = await (0, ecf_service_1.emitirEcf)(data, tenantId);
            return reply.code(202).send({
                message: 'Emisión iniciada (En proceso)',
                ecfId: ecf.id,
                estado: ecf.estadoDgii
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_EMISION', message: error.message });
        }
    });
    app.get('/api/v1/ecf', async (request, reply) => {
        try {
            const tenantId = request.headers['x-tenant-id'] || '';
            if (!tenantId) {
                return reply.code(400).send({ error: 'Falta header x-tenant-id' });
            }
            const ecfs = await database_1.db.comprobanteFiscalElectronico.findMany({
                where: { tenantId },
                orderBy: { creadoEn: 'desc' },
                take: 50
            });
            return reply.send({ data: ecfs });
        }
        catch (error) {
            return reply.code(500).send({ error: 'ERROR_INTERNO', message: error.message });
        }
    });
    app.get('/api/v1/ecf/:id/status', async (request, reply) => {
        try {
            const tenantId = request.headers['x-tenant-id'] || '';
            const { id } = request.params;
            const status = await (0, ecf_service_1.getEcfStatus)(id, tenantId);
            return reply.send({ data: status });
        }
        catch (error) {
            return reply.code(404).send({ error: 'NO_ENCONTRADO', message: error.message });
        }
    });
}
//# sourceMappingURL=ecf.routes.js.map