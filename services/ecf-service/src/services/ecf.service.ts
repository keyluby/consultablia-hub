import { db, ComprobanteFiscalElectronico } from '@consultablia/database';
import { Queue } from 'bullmq';
import { CreateEcfInput } from '../schemas/ecf.schema';

import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import Redis from 'ioredis';

// Reuse a single full URL config that supports rediss:// protocol
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const ecfQueue = new Queue('ecf-emission', {
  connection
});

export async function emitirEcf(input: CreateEcfInput, tenantId: string): Promise<ComprobanteFiscalElectronico> {
  // 1. Verificar secuencia disponible
  const secuencias = await db.secuenciaNcf.findMany({
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

  return await db.$transaction(async (tx) => {
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
            if (item.tipoItbis === 1) montoItbis = subtotal * 0.18;
            if (item.tipoItbis === 2) montoItbis = subtotal * 0.16;

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

export async function getEcfStatus(ecfId: string, tenantId: string) {
  const ecf = await db.comprobanteFiscalElectronico.findUnique({
    where: { id: ecfId, tenantId },
    select: { id: true, estadoDgii: true, codigoErrorDgii: true, mensajeErrorDgii: true, eNcf: true }
  });
  if (!ecf) throw new Error('e-CF no encontrado');
  return ecf;
}
