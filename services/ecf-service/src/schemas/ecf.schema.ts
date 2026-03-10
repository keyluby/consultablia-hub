import { z } from 'zod';

export const ItemEcfSchema = z.object({
    descripcion: z.string().max(500),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    descuento: z.number().min(0).default(0),
    tipoItbis: z.number().int().min(1).max(3), // 1=18%, 2=16%, 3=Exento
});

export const CreateEcfSchema = z.object({
    tipoEcf: z.number().int().min(31).max(47),
    rncComprador: z.string().regex(/^\d{9,11}$/).optional(),
    razonSocialComprador: z.string().max(255).optional(),
    totalFacturado: z.number().positive().multipleOf(0.01),
    items: z.array(ItemEcfSchema).min(1),
});

export interface ItemEcfInput { descripcion: string; cantidad: number; precioUnitario: number; descuento?: number; tipoItbis: number; }
export interface CreateEcfInput { tipoEcf: number; rncComprador?: string; razonSocialComprador?: string; totalFacturado: number; items: ItemEcfInput[]; }
