import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    const tenantId = 'b0a8c2f1-9d3e-4f5a-8b1c-7e6d5f4a3b2c';

    try {
        // 1. Create a mock tenant
        const tenant = await prisma.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: {
                id: tenantId,
                rnc: '131652399', // Valid DGII test RNC
                razonSocial: 'Consultablia SRL Test',
                nombreComercial: 'Consultablia DevOps',
                tipoContribuyente: 'MEDIANO',
                direccion: 'Av. Winston Churchill',
                telefono: '809-555-5555',
                emailFiscal: 'test@consultablia.com',
            },
        });

        console.log('Tenant seeded:', tenant.razonSocial);

        // 2. Create sequences for E31 (Factura Credito Fiscal)
        await prisma.secuenciaNcf.upsert({
            where: {
                tenantId_tipoEcf_prefijo: {
                    tenantId: tenantId,
                    tipoEcf: 31,
                    prefijo: 'E31'
                }
            },
            update: {},
            create: {
                tenantId: tenantId,
                tipoEcf: 31,
                prefijo: 'E31',
                secuenciaActual: 1,
                secuenciaMax: 1000,
                activa: true,
                autorizadaEn: new Date('2023-01-01'),
                venceEn: new Date('2027-12-31')
            }
        });
        console.log('Secuencia E31 seeded');

        // 3. Create dummy Digital Certificate tracking entry
        await prisma.certificadoDigital.create({
            data: {
                tenantId: tenantId,
                nombreAlias: 'Dummy P12',
                entidadEmisora: 'Testing CA',
                numeroSerie: '1122334455',
                sha256Fingerprint: 'dummyfingerprint................................................',
                vaultSecretPath: 'secret/data/tenants/' + tenantId + '/certificates/dummy_p12',
                fechaEmision: new Date('2023-01-01'),
                fechaVencimiento: new Date('2027-12-31'),
                activo: true
            }
        });
        console.log('Certificado Digital metadata seeded');

    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
