import { z } from 'zod';

export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    nombre: z.string().min(2).max(255),
    apellido: z.string().min(2).max(255),
    telefono: z.string().optional()
});

export interface RegisterInput { email: string; password: string; nombre: string; apellido: string; telefono?: string; }

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export interface LoginInput { email: string; password: string; }

export const CreateTenantSchema = z.object({
    rnc: z.string().length(11, 'El RNC debe tener 11 caracteres'),
    razonSocial: z.string().min(3).max(255),
    tipoContribuyente: z.enum(['GRANDE_NACIONAL', 'GRANDE_LOCAL', 'MEDIANO', 'PEQUENO', 'MICRO', 'NO_CLASIFICADO']),
    emailFiscal: z.string().email()
});

export interface CreateTenantInput { rnc: string; razonSocial: string; tipoContribuyente: 'GRANDE_NACIONAL' | 'GRANDE_LOCAL' | 'MEDIANO' | 'PEQUENO' | 'MICRO' | 'NO_CLASIFICADO'; emailFiscal: string; }
