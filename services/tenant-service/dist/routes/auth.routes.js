"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const auth_schema_1 = require("../schemas/auth.schema");
const auth_service_1 = require("../services/auth.service");
async function authRoutes(app) {
    app.post('/api/v1/auth/register', async (request, reply) => {
        try {
            const data = auth_schema_1.RegisterSchema.parse(request.body);
            const user = await (0, auth_service_1.registerUser)(data);
            const token = app.jwt.sign({
                userId: user.id,
                email: user.email
            }, { expiresIn: process.env.JWT_EXPIRY || '15m' });
            const refreshToken = app.jwt.sign({
                userId: user.id,
                type: 'refresh'
            }, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
            return reply.code(201).send({
                message: 'Usuario registrado exitosamente',
                user,
                token,
                refreshToken
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_REGISTRO', message: error.message });
        }
    });
    app.post('/api/v1/auth/login', async (request, reply) => {
        try {
            const data = auth_schema_1.LoginSchema.parse(request.body);
            const user = await (0, auth_service_1.verifyLogin)(data);
            const token = app.jwt.sign({
                userId: user.id,
                email: user.email
            }, { expiresIn: process.env.JWT_EXPIRY || '15m' });
            const refreshToken = app.jwt.sign({
                userId: user.id,
                type: 'refresh'
            }, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
            return reply.send({
                user,
                token,
                refreshToken
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(401).send({ error: 'NO_AUTORIZADO', message: error.message });
        }
    });
    app.post('/api/v1/auth/logout', async (request, reply) => {
        // Para stateless JWT, el logout real es descartar el token del lado cliente.
        // Opcionalmente se podría implementar una blacklist en Redis.
        return reply.send({ message: 'Sesión cerrada exitosamente. Elimine su token localmente.' });
    });
}
//# sourceMappingURL=auth.routes.js.map