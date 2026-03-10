"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.verifyLogin = verifyLogin;
const database_1 = require("@consultablia/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function registerUser(input) {
    const existingUser = await database_1.db.usuario.findUnique({
        where: { email: input.email }
    });
    if (existingUser) {
        throw new Error('El correo electrónico ya está en uso.');
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt_1.default.hash(input.password, saltRounds);
    const newUser = await database_1.db.usuario.create({
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
async function verifyLogin(input) {
    const user = await database_1.db.usuario.findUnique({
        where: { email: input.email }
    });
    if (!user) {
        throw new Error('Credenciales inválidas');
    }
    const isValidPassword = await bcrypt_1.default.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
    }
    // Actualizar último login de forma asíncrona sin bloquear
    database_1.db.usuario.update({
        where: { id: user.id },
        data: { ultimoLogin: new Date() }
    }).catch(console.error);
    const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
}
//# sourceMappingURL=auth.service.js.map