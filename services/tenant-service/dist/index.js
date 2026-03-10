"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const tenant_routes_1 = __importDefault(require("./routes/tenant.routes"));
dotenv_1.default.config({ path: '../../.env' });
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});
app.register(cors_1.default, { origin: true });
// JWT Registration
app.register(jwt_1.default, {
    secret: process.env.JWT_PRIVATE_KEY || 'supersecret',
    sign: { algorithm: 'HS256' }, // For local dev fallback; use HS256 in prod when keys are provided
});
app.get('/health', async () => {
    return { status: 'ok', service: 'tenant-service' };
});
const certificate_routes_1 = __importDefault(require("./routes/certificate.routes"));
// Register routes
app.register(auth_routes_1.default);
app.register(tenant_routes_1.default);
app.register(certificate_routes_1.default);
const start = async () => {
    try {
        await app.listen({ port: 3001, host: '0.0.0.0' });
        app.log.info('Tenant Service started on port 3001');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map