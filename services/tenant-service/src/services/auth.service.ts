import { db } from '@consultablia/database';
import bcrypt from 'bcrypt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export async function registerUser(input: RegisterInput) {
    const existingUser = await db.usuario.findUnique({
        where: { email: input.email }
    });

    if (existingUser) {
        throw new Error('El correo electrónico ya está en uso.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const newUser = await db.usuario.create({
        data: {
            email: input.email,
            passwordHash,
            nombre: input.nombre,
            apellido: input.apellido,
            telefono: input.telefono
        }
    });

    // Omit passwordHash from the return value
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

export async function verifyLogin(input: LoginInput) {
    const user = await db.usuario.findUnique({
        where: { email: input.email }
    });

    if (!user) {
        throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
    }

    // Actualizar último login de forma asíncrona sin bloquear
    db.usuario.update({
        where: { id: user.id },
        data: { ultimoLogin: new Date() }
    }).catch(console.error);

    const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
}
