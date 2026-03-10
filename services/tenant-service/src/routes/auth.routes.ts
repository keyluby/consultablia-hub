import { FastifyInstance } from 'fastify';
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema';
import { registerUser, verifyLogin } from '../services/auth.service';

export default async function authRoutes(app: FastifyInstance) {

    app.post('/api/v1/auth/register', async (request, reply) => {
        try {
            const data = RegisterSchema.parse(request.body);
            const user = await registerUser(data);

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
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({ error: 'MALA_PETICION', details: error.errors });
            }
            return reply.code(400).send({ error: 'ERROR_REGISTRO', message: error.message });
        }
    });

    app.post('/api/v1/auth/login', async (request, reply) => {
        try {
            const data = LoginSchema.parse(request.body);
            const user = await verifyLogin(data);

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
        } catch (error: any) {
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
