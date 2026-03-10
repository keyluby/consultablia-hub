import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateEcfSchema } from '../schemas/ecf.schema';
import { emitirEcf, getEcfStatus } from '../services/ecf.service';
import { db } from '@consultablia/database';

export default async function ecfRoutes(app: FastifyInstance) {

    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        // try {
        //     await request.jwtVerify();
        // } catch (err) {
        //     reply.send(err);
        // }
    });

    app.post('/api/v1/ecf', async (request, reply) => {
        try {
            const tenantId = (request.headers['x-tenant-id'] as string) || '';
            if (!tenantId) {
                return reply.code(400).send({ error: 'Falta header x-tenant-id' });
            }

            // TODO: check if user has access to this tenantId via DB query

            const data = CreateEcfSchema.parse(request.body);
            const ecf = await emitirEcf(data, tenantId);

            return reply.code(202).send({
                message: 'Emisión iniciada (En proceso)',
                ecfId: ecf.id,
                estado: ecf.estadoDgii
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_EMISION', message: error.message });
        }
    });

    app.get('/api/v1/ecf', async (request, reply) => {
        try {
            const tenantId = (request.headers['x-tenant-id'] as string) || '';
            if (!tenantId) {
                return reply.code(400).send({ error: 'Falta header x-tenant-id' });
            }

            const ecfs = await db.comprobanteFiscalElectronico.findMany({
                where: { tenantId },
                orderBy: { creadoEn: 'desc' },
                take: 50
            });
            return reply.send({ data: ecfs });
        } catch (error: any) {
            return reply.code(500).send({ error: 'ERROR_INTERNO', message: error.message });
        }
    });

    app.get('/api/v1/ecf/:id/status', async (request, reply) => {
        try {
            const tenantId = (request.headers['x-tenant-id'] as string) || '';
            const { id } = request.params as { id: string };

            const status = await getEcfStatus(id, tenantId);
            return reply.send({ data: status });
        } catch (error: any) {
            return reply.code(404).send({ error: 'NO_ENCONTRADO', message: error.message });
        }
    });

}
