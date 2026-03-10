import { RegisterInput, LoginInput } from '../schemas/auth.schema';
export declare function registerUser(input: RegisterInput): Promise<{
    email: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    id: string;
    avatarUrl: string | null;
    mfaEnabled: boolean;
    mfaSecret: string | null;
    ultimoLogin: Date | null;
    creadoEn: Date;
    actualizadoEn: Date;
    deletedAt: Date | null;
}>;
export declare function verifyLogin(input: LoginInput): Promise<{
    email: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    id: string;
    avatarUrl: string | null;
    mfaEnabled: boolean;
    ultimoLogin: Date | null;
    creadoEn: Date;
    actualizadoEn: Date;
    deletedAt: Date | null;
}>;
