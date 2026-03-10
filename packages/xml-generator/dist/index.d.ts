export interface EcfData {
    encabezado: {
        version: string;
        idDoc: {
            tipoeCF: string;
            eNCF: string;
            fechaEmision: string;
        };
        emisor: {
            rnc: string;
            razonSocial: string;
            nombreComercial?: string;
            direccion: string;
            fechaEmision: string;
        };
        comprador: {
            rnc: string;
            razonSocial: string;
        };
        totales: {
            montoTotal: string;
            montoGravadoTotal: string;
            montoExentoTotal: string;
            totalITBIS: string;
        };
    };
    detalles: Array<{
        linea: string;
        descripcion: string;
        cantidad: string;
        precioUnitario: string;
        montoItem: string;
    }>;
}
export declare function generateEcfXml(data: EcfData): string;
export * from './signer';
