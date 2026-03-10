import { z } from 'zod';
export declare const ItemEcfSchema: z.ZodObject<{
    descripcion: z.ZodString;
    cantidad: z.ZodNumber;
    precioUnitario: z.ZodNumber;
    descuento: z.ZodDefault<z.ZodNumber>;
    tipoItbis: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    tipoItbis: number;
}, {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    tipoItbis: number;
    descuento?: number | undefined;
}>;
export declare const CreateEcfSchema: z.ZodObject<{
    tipoEcf: z.ZodNumber;
    rncComprador: z.ZodOptional<z.ZodString>;
    razonSocialComprador: z.ZodOptional<z.ZodString>;
    totalFacturado: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        descripcion: z.ZodString;
        cantidad: z.ZodNumber;
        precioUnitario: z.ZodNumber;
        descuento: z.ZodDefault<z.ZodNumber>;
        tipoItbis: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        descuento: number;
        tipoItbis: number;
    }, {
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        tipoItbis: number;
        descuento?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tipoEcf: number;
    totalFacturado: number;
    items: {
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        descuento: number;
        tipoItbis: number;
    }[];
    rncComprador?: string | undefined;
    razonSocialComprador?: string | undefined;
}, {
    tipoEcf: number;
    totalFacturado: number;
    items: {
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        tipoItbis: number;
        descuento?: number | undefined;
    }[];
    rncComprador?: string | undefined;
    razonSocialComprador?: string | undefined;
}>;
export interface ItemEcfInput {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    tipoItbis: number;
}
export interface CreateEcfInput {
    tipoEcf: number;
    rncComprador?: string;
    razonSocialComprador?: string;
    totalFacturado: number;
    items: ItemEcfInput[];
}
