"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const dotenv_1 = __importDefault(require("dotenv"));
const ecf_routes_1 = __importDefault(require("./routes/ecf.routes"));
require("./workers/ecf.worker"); // Import worker to start it alongside the API
dotenv_1.default.config({ path: '../../.env' });
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});
app.register(cors_1.default, { origin: true });
app.register(websocket_1.default);
// JWT Registration
app.register(jwt_1.default, {
    secret: process.env.JWT_PRIVATE_KEY || 'supersecret',
    sign: { algorithm: 'HS256' },
});
app.get('/health', async () => {
    return { status: 'ok', service: 'ecf-service' };
});
app.register(ecf_routes_1.default);
// WebSocket endpoint for real-time tracking
app.register(async function (fastify) {
    fastify.get('/api/v1/ecf/stream', { websocket: true }, (connection, req) => {
        connection.socket.on('message', (message) => {
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
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map