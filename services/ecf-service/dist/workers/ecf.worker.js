"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ecfWorker = void 0;
const bullmq_1 = require("bullmq");
const database_1 = require("@consultablia/database");
const xml_generator_1 = require("@consultablia/xml-generator");
const crypto_1 = __importDefault(require("crypto"));
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.ecfWorker = new bullmq_1.Worker('ecf-emission', async (job) => {
    const { ecfId, tenantId } = job.data;
    // 1. Obtener e-CF + items + tenant
    const ecf = await database_1.db.comprobanteFiscalElectronico.findUnique({
        where: { id: ecfId },
        include: { items: true, tenant: true }
    });
    if (!ecf)
        throw new Error(`e-CF ${ecfId} no encontrado`);
    // 2. Generar representación en XML
    const xmlContent = (0, xml_generator_1.generateEcfXml)({
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
    const cert = await database_1.db.certificadoDigital.findFirst({
        where: { tenantId, activo: true }
    });
    if (!cert) {
        await database_1.db.comprobanteFiscalElectronico.update({
            where: { id: ecfId },
            data: { estadoDgii: 'RECHAZADO', mensajeErrorDgii: 'No hay certificado digital activo' }
        });
        throw new Error('Certificado no encontrado');
    }
    // [SCENE MISSING] - Aquí iría la llamada a Vault para descargar el .p12 usando vaultClient
    // vaultClient.read(cert.vaultSecretPath)
    // 4. Firmar XML
    const xmlFirmado = (0, xml_generator_1.signXmlWithP12)(xmlContent, 'DUMMY_P12', 'DUMMY_PASSWORD');
    const xmlHash = crypto_1.default.createHash('sha256').update(xmlFirmado).digest('hex');
    // 5. Simular envío a la DGII (API proxy - Sandbox)
    // const response = await axios.post(process.env.DGII_API_BASE_URL + '/ecf', { xml: xmlFirmado });
    // 6. Actualizar base de datos con resultado
    await database_1.db.comprobanteFiscalElectronico.update({
        where: { id: ecfId },
        data: {
            estadoDgii: 'ENVIADO',
            xmlHash,
            xmlFirmadoS3Key: `${tenantId}/ecf/${ecf.eNcf}.xml` // Mock
        }
    });
    // 7. Lanzar evento WS (Implementado en la capa de aplicación principal luego de que el job termina)
    return { success: true, estado: 'ENVIADO' };
}, {
    // @ts-ignore
    connection: connection
});
//# sourceMappingURL=ecf.worker.js.map