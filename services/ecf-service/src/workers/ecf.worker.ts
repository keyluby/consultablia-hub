import { Worker, Job } from 'bullmq';
import { db } from '@consultablia/database';
import { generateEcfXml, signXmlWithP12 } from '@consultablia/xml-generator';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import Redis from 'ioredis';

interface EcfJobData {
  ecfId: string;
  tenantId: string;
}

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const ecfWorker = new Worker<EcfJobData>(
  'ecf-emission',
  async (job: Job<EcfJobData>) => {
    const { ecfId, tenantId } = job.data;

    // 1. Obtener e-CF + items + tenant
    const ecf = await db.comprobanteFiscalElectronico.findUnique({
      where: { id: ecfId },
      include: { items: true, tenant: true }
    });

    if (!ecf) throw new Error(`e-CF ${ecfId} no encontrado`);

    // 2. Generar representación en XML
    const xmlContent = generateEcfXml({
      encabezado: {
        version: '1.0',
        idDoc: {
          tipoeCF: ecf.tipoEcf.toString(),
          eNCF: ecf.eNcf,
          fechaEmision: ecf.fechaEmision.toISOString().split('T')[0]
        },
        emisor: {
          rnc: ecf.tenant.rnc,
          razonSocial: ecf.tenant.razonSocial,
          direccion: ecf.tenant.direccion || 'SD',
          fechaEmision: ecf.fechaEmision.toISOString().split('T')[0]
        },
        comprador: {
          rnc: ecf.rncComprador || '000000000',
          razonSocial: ecf.razonSocialComprador || 'Consumidor Final'
        },
        totales: {
          montoTotal: ecf.totalFacturado.toString(),
          montoGravadoTotal: (ecf.montoGravadoI1.toNumber() + ecf.montoGravadoI2.toNumber()).toString(),
          montoExentoTotal: ecf.montoExento.toString(),
          totalITBIS: ecf.itbisTotal.toString()
        }
      },
      detalles: ecf.items.map(item => ({
        linea: item.orden.toString(),
        descripcion: item.descripcion,
        cantidad: item.cantidad.toString(),
        precioUnitario: item.precioUnitario.toString(),
        montoItem: item.total.toString()
      }))
    });

    // 3. Obtener certificado desde base de datos (y luego del Vault)
    const cert = await db.certificadoDigital.findFirst({
      where: { tenantId, activo: true }
    });

    if (!cert) {
      await db.comprobanteFiscalElectronico.update({
        where: { id: ecfId },
        data: { estadoDgii: 'RECHAZADO', mensajeErrorDgii: 'No hay certificado digital activo' }
      });
      throw new Error('Certificado no encontrado');
    }

    // [SCENE MISSING] - Aquí iría la llamada a Vault para descargar el .p12 usando vaultClient
    // vaultClient.read(cert.vaultSecretPath)

    // 4. Firmar XML
    const xmlFirmado = signXmlWithP12(xmlContent, 'DUMMY_P12', 'DUMMY_PASSWORD');
    const xmlHash = crypto.createHash('sha256').update(xmlFirmado).digest('hex');

    // 5. Simular envío a la DGII (API proxy - Sandbox)
    // const response = await axios.post(process.env.DGII_API_BASE_URL + '/ecf', { xml: xmlFirmado });

    // 6. Actualizar base de datos con resultado
    await db.comprobanteFiscalElectronico.update({
      where: { id: ecfId },
      data: {
        estadoDgii: 'ENVIADO',
        xmlHash,
        xmlFirmadoS3Key: `${tenantId}/ecf/${ecf.eNcf}.xml` // Mock
      }
    });

    // 7. Lanzar evento WS (Implementado en la capa de aplicación principal luego de que el job termina)
    return { success: true, estado: 'ENVIADO' };
  },
  {
    // @ts-ignore
    connection: connection as any
  }
);
