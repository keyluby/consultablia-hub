import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import ecfRoutes from './routes/ecf.routes';
import './workers/ecf.worker'; // Import worker to start it alongside the API

dotenv.config({ path: '../../.env' });

const app: FastifyInstance = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});

app.register(cors, { origin: true });
app.register(websocket);

// JWT Registration
app.register(jwt, {
    secret: process.env.JWT_PRIVATE_KEY || 'supersecret',
    sign: { algorithm: 'HS256' },
});

app.get('/health', async () => {
    return { status: 'ok', service: 'ecf-service' };
});

app.register(ecfRoutes);

// WebSocket endpoint for real-time tracking
app.register(async function (fastify) {
    fastify.get('/api/v1/ecf/stream', { websocket: true }, (connection, req) => {
        connection.socket.on('message', (message: any) => {
            // In a real application, you'd subscribe to Redis pub/sub from the BullMQ worker
            // and send status updates back to this connection
            connection.socket.send(JSON.stringify({ message: 'Conectado al stream de e-CF', received: message.toString() }));
        });
    });
});

const start = async () => {
    try {
        await app.listen({ port: 3002, host: '0.0.0.0' });
        app.log.info('ECF Service started on port 3002');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
