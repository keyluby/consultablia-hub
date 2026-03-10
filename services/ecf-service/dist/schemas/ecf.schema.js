"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEcfSchema = exports.ItemEcfSchema = void 0;
const zod_1 = require("zod");
exports.ItemEcfSchema = zod_1.z.object({
    descripcion: zod_1.z.string().max(500),
    cantidad: zod_1.z.number().positive(),
    precioUnitario: zod_1.z.number().positive(),
    descuento: zod_1.z.number().min(0).default(0),
    tipoItbis: zod_1.z.number().int().min(1).max(3), // 1=18%, 2=16%, 3=Exento
});
exports.CreateEcfSchema = zod_1.z.object({
    tipoEcf: zod_1.z.number().int().min(31).max(47),
    rncComprador: zod_1.z.string().regex(/^\d{9,11}$/).optional(),
    razonSocialComprador: zod_1.z.string().max(255).optional(),
    totalFacturado: zod_1.z.number().positive().multipleOf(0.01),
    items: zod_1.z.array(exports.ItemEcfSchema).min(1),
});
//# sourceMappingURL=ecf.schema.js.map