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
export declare function uploadCertificate(input: UploadCertificateInput): Promise<{
    id: string;
    creadoEn: Date;
    tenantId: string;
    activo: boolean;
    nombreAlias: string;
    vaultSecretPath: string;
    entidadEmisora: string;
    numeroSerie: string;
    fechaEmision: Date;
    fechaVencimiento: Date;
    sha256Fingerprint: string;
}>;
export declare function listCertificates(tenantId: string): Promise<{
    id: string;
    creadoEn: Date;
    tenantId: string;
    activo: boolean;
    nombreAlias: string;
    vaultSecretPath: string;
    entidadEmisora: string;
    numeroSerie: string;
    fechaEmision: Date;
    fechaVencimiento: Date;
    sha256Fingerprint: string;
}[]>;
