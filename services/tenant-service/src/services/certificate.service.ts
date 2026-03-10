import { db } from '@consultablia/database';
import vault from 'node-vault';

// Vault setup
const vaultClient = vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN || 'root'
});

export interface UploadCertificateInput {
    tenantId: string;
    p12Base64: string;
    passwordP12: string;
    nombreAlias: string;
    entidadEmisora: string;
    numeroSerie: string;
    fechaEmision: Date;
    fechaVencimiento: Date;
    sha256Fingerprint: string;
}

export async function uploadCertificate(input: UploadCertificateInput) {
    const secretPath = `secret/data/tenants/${input.tenantId}/certificates/${input.numeroSerie}`;

    // 1. Store the actual P12 and its password in HashiCorp Vault
    await vaultClient.write(secretPath, {
        data: {
            p12Base64: input.p12Base64,
            password: input.passwordP12
        }
    });

    // 2. Store metadata in PostgreSQL
    const certificado = await db.certificadoDigital.create({
        data: {
            tenantId: input.tenantId,
            nombreAlias: input.nombreAlias,
            vaultSecretPath: secretPath, // Store PATH, not the secret
            entidadEmisora: input.entidadEmisora,
            numeroSerie: input.numeroSerie,
            fechaEmision: input.fechaEmision,
            fechaVencimiento: input.fechaVencimiento,
            sha256Fingerprint: input.sha256Fingerprint,
            activo: true
        }
    });

    return certificado;
}

export async function listCertificates(tenantId: string) {
    return await db.certificadoDigital.findMany({
        where: { tenantId }
    });
}
