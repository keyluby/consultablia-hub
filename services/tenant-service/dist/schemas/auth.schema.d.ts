import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    nombre: z.ZodString;
    apellido: z.ZodString;
    telefono: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string | undefined;
}, {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string | undefined;
}>;
export interface RegisterInput {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string;
}
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export interface LoginInput {
    email: string;
    password: string;
}
export declare const CreateTenantSchema: z.ZodObject<{
    rnc: z.ZodString;
    razonSocial: z.ZodString;
    tipoContribuyente: z.ZodEnum<["GRANDE_NACIONAL", "GRANDE_LOCAL", "MEDIANO", "PEQUENO", "MICRO", "NO_CLASIFICADO"]>;
    emailFiscal: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rnc: string;
    razonSocial: string;
    tipoContribuyente: "GRANDE_NACIONAL" | "GRANDE_LOCAL" | "MEDIANO" | "PEQUENO" | "MICRO" | "NO_CLASIFICADO";
    emailFiscal: string;
}, {
    rnc: string;
    razonSocial: string;
    tipoContribuyente: "GRANDE_NACIONAL" | "GRANDE_LOCAL" | "MEDIANO" | "PEQUENO" | "MICRO" | "NO_CLASIFICADO";
    emailFiscal: string;
}>;
export interface CreateTenantInput {
    rnc: string;
    razonSocial: string;
    tipoContribuyente: 'GRANDE_NACIONAL' | 'GRANDE_LOCAL' | 'MEDIANO' | 'PEQUENO' | 'MICRO' | 'NO_CLASIFICADO';
    emailFiscal: string;
}
