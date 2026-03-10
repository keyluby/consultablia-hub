import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';

dotenv.config({ path: '../../.env' });

const app: FastifyInstance = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});

app.register(cors, { origin: true });

// JWT Registration
app.register(jwt, {
    secret: process.env.JWT_PRIVATE_KEY || 'supersecret',
    sign: { algorithm: 'HS256' }, // For local dev fallback; use HS256 in prod when keys are provided
});

app.get('/health', async () => {
    return { status: 'ok', service: 'tenant-service' };
});

import certificateRoutes from './routes/certificate.routes';

// Register routes
app.register(authRoutes);
app.register(tenantRoutes);
app.register(certificateRoutes);

const start = async () => {
    try {
        await app.listen({ port: 3001, host: '0.0.0.0' });
        app.log.info('Tenant Service started on port 3001');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
