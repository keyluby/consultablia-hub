"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env' });
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});
app.register(cors_1.default, { origin: true });
app.register(helmet_1.default);
app.register(jwt_1.default, {
    secret: process.env.JWT_PRIVATE_KEY || 'supersecret',
    sign: { algorithm: 'HS256' },
});
// Middleware for token verification
app.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
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
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map