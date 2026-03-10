"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitirEcf = emitirEcf;
exports.getEcfStatus = getEcfStatus;
const database_1 = require("@consultablia/database");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
// Reuse a single full URL config that supports rediss:// protocol
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
const ecfQueue = new bullmq_1.Queue('ecf-emission', {
    connection
});
async function emitirEcf(input, tenantId) {
    // 1. Verificar secuencia disponible
    const secuencias = await database_1.db.secuenciaNcf.findMany({
        where: { tenantId, tipoEcf: input.tipoEcf, activa: true }
    });
    if (secuencias.length === 0) {
        throw new Error('No hay secuencias NCF activas para el tipo ' + input.tipoEcf);
    }
    const sec = secuencias[0];
    if (sec.secuenciaActual > sec.secuenciaMax) {
        throw new Error('Secuencia NCF agotada para el tipo ' + input.tipoEcf);
    }
    const secuenciaStr = sec.secuenciaActual.toString().padStart(10, '0');
    const eNcf = `${sec.prefijo}${secuenciaStr}`;
    return await database_1.db.$transaction(async (tx) => {
        // 2. Incrementar secuencia actual (Pessimistic lock se manejaría en un ambiente real avanzado)
        await tx.secuenciaNcf.update({
            where: { id: sec.id },
            data: { secuenciaActual: sec.secuenciaActual + 1 }
        });
        // 3. Crear el e-CF con estado PENDIENTE
        const ecf = await tx.comprobanteFiscalElectronico.create({
            data: {
                tenantId,
                tipoEcf: input.tipoEcf,
                eNcf,
                rncComprador: input.rncComprador,
                razonSocialComprador: input.razonSocialComprador,
                fechaEmision: new Date(),
                totalFacturado: input.totalFacturado,
                estadoDgii: 'PENDIENTE',
                items: {
                    create: input.items.map((item, index) => {
                        const descuento = item.descuento ?? 0;
                        const subtotal = item.cantidad * item.precioUnitario - descuento;
                        let montoItbis = 0;
                        if (item.tipoItbis === 1)
                            montoItbis = subtotal * 0.18;
                        if (item.tipoItbis === 2)
                            montoItbis = subtotal * 0.16;
                        return {
                            orden: index + 1,
                            descripcion: item.descripcion,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            descuento: descuento,
                            subtotal,
                            tipoItbis: item.tipoItbis,
                            montoItbis,
                            total: subtotal + montoItbis,
                        };
                    })
                }
            }
        });
        // 4. Encolar el job para procesar el XML y enviar a la DGII de manera asíncrona
        await ecfQueue.add('process-ecf', { ecfId: ecf.id, tenantId });
        return ecf;
    });
}
async function getEcfStatus(ecfId, tenantId) {
    const ecf = await database_1.db.comprobanteFiscalElectronico.findUnique({
        where: { id: ecfId, tenantId },
        select: { id: true, estadoDgii: true, codigoErrorDgii: true, mensajeErrorDgii: true, eNcf: true }
    });
    if (!ecf)
        throw new Error('e-CF no encontrado');
    return ecf;
}
//# sourceMappingURL=ecf.service.js.map