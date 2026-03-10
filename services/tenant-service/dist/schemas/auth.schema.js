"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTenantSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    nombre: zod_1.z.string().min(2).max(255),
    apellido: zod_1.z.string().min(2).max(255),
    telefono: zod_1.z.string().optional()
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
exports.CreateTenantSchema = zod_1.z.object({
    rnc: zod_1.z.string().length(11, 'El RNC debe tener 11 caracteres'),
    razonSocial: zod_1.z.string().min(3).max(255),
    tipoContribuyente: zod_1.z.enum(['GRANDE_NACIONAL', 'GRANDE_LOCAL', 'MEDIANO', 'PEQUENO', 'MICRO', 'NO_CLASIFICADO']),
    emailFiscal: zod_1.z.string().email()
});
//# sourceMappingURL=auth.schema.js.map