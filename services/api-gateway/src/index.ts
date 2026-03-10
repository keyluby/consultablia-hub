import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app: FastifyInstance = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});

app.register(cors, { origin: true });
app.register(helmet);

app.register(jwt, {
    secret: process.env.JWT_PRIVATE_KEY || 'supersecret',
    sign: { algorithm: 'HS256' },
});

// Middleware for token verification
app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

app.get('/health', async () => {
    return { status: 'ok', service: 'api-gateway' };
});

const start = async () => {
    try {
        await app.listen({ port: 3000, host: '0.0.0.0' });
        app.log.info('API Gateway started on port 3000');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
