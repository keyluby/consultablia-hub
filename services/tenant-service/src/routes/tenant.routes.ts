import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateTenantSchema } from '../schemas/auth.schema';
import { createTenant, getTenantsForUser } from '../services/tenant.service';

export default async function tenantRoutes(app: FastifyInstance) {

    // Apply verify JWT middleware for all routes in this plugin
    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    app.post('/api/v1/tenants', async (request, reply) => {
        try {
            const data = CreateTenantSchema.parse(request.body);
            const claims = request.user as { userId: string };

            if (!claims.userId) {
                throw new Error('Usuario inválido en token');
            }

            const tenant = await createTenant(data, claims.userId);
            return reply.code(201).send({ message: 'Empresa creada exitosamente', tenant });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_CREACION', message: error.message });
        }
    });

    app.get('/api/v1/tenants', async (request, reply) => {
        try {
            const claims = request.user as { userId: string };
            const tenants = await getTenantsForUser(claims.userId);
            return reply.send({ data: tenants });
        } catch (error: any) {
            return reply.code(500).send({ error: 'ERROR_INTERNO', message: error.message });
        }
    });

}
