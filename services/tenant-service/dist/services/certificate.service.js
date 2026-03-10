"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCertificate = uploadCertificate;
exports.listCertificates = listCertificates;
const database_1 = require("@consultablia/database");
const node_vault_1 = __importDefault(require("node-vault"));
// Vault setup
const vaultClient = (0, node_vault_1.default)({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN || 'root'
});
async function uploadCertificate(input) {
    const secretPath = `secret/data/tenants/${input.tenantId}/certificates/${input.numeroSerie}`;
    // 1. Store the actual P12 and its password in HashiCorp Vault
    await vaultClient.write(secretPath, {
        data: {
            p12Base64: input.p12Base64,
            password: input.passwordP12
        }
    });
    // 2. Store metadata in PostgreSQL
    const certificado = await database_1.db.certificadoDigital.create({
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
async function listCertificates(tenantId) {
    return await database_1.db.certificadoDigital.findMany({
        where: { tenantId }
    });
}
//# sourceMappingURL=certificate.service.js.map