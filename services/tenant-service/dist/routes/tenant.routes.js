"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = tenantRoutes;
const auth_schema_1 = require("../schemas/auth.schema");
const tenant_service_1 = require("../services/tenant.service");
async function tenantRoutes(app) {
    // Apply verify JWT middleware for all routes in this plugin
    app.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
    app.post('/api/v1/tenants', async (request, reply) => {
        try {
            const data = auth_schema_1.CreateTenantSchema.parse(request.body);
            const claims = request.user;
            if (!claims.userId) {
                throw new Error('Usuario inválido en token');
            }
            const tenant = await (0, tenant_service_1.createTenant)(data, claims.userId);
            return reply.code(201).send({ message: 'Empresa creada exitosamente', tenant });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_CREACION', message: error.message });
        }
    });
    app.get('/api/v1/tenants', async (request, reply) => {
        try {
            const claims = request.user;
            const tenants = await (0, tenant_service_1.getTenantsForUser)(claims.userId);
            return reply.send({ data: tenants });
        }
        catch (error) {
            return reply.code(500).send({ error: 'ERROR_INTERNO', message: error.message });
        }
    });
}
//# sourceMappingURL=tenant.routes.js.map