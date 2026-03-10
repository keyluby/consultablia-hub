import { create } from 'xmlbuilder2';

export interface EcfData {
    // Required fields for DGII e-CF
    encabezado: {
        version: string;
        idDoc: {
            tipoeCF: string;
            eNCF: string;
            fechaEmision: string; // YYYY-MM-DD
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

export function generateEcfXml(data: EcfData): string {
    // DGII XML format based on Aviso 24 (simplified version for the scaffold)
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('ECF')
        .ele('Encabezado')
        .ele('Version').txt(data.encabezado.version).up()
        .ele('IdDoc')
        .ele('TipoeCF').txt(data.encabezado.idDoc.tipoeCF).up()
        .ele('eNCF').txt(data.encabezado.idDoc.eNCF).up()
        .ele('FechaEmision').txt(data.encabezado.idDoc.fechaEmision).up()
        .up()
        .ele('Emisor')
        .ele('RNCEmisor').txt(data.encabezado.emisor.rnc).up()
        .ele('RazonSocialEmisor').txt(data.encabezado.emisor.razonSocial).up()
        .ele('DireccionEmisor').txt(data.encabezado.emisor.direccion).up()
        .up()
        .ele('Comprador')
        .ele('RNCComprador').txt(data.encabezado.comprador.rnc).up()
        .ele('RazonSocialComprador').txt(data.encabezado.comprador.razonSocial).up()
        .up()
        .ele('Totales')
        .ele('MontoTotal').txt(data.encabezado.totales.montoTotal).up()
        .ele('MontoGravadoTotal').txt(data.encabezado.totales.montoGravadoTotal).up()
        .ele('MontoExentoTotal').txt(data.encabezado.totales.montoExentoTotal).up()
        .ele('TotalITBIS').txt(data.encabezado.totales.totalITBIS).up()
        .up()
        .up()
        .ele('Detalles');

    data.detalles.forEach((item) => {
        doc.ele('Item')
            .ele('NumeroLinea').txt(item.linea).up()
            .ele('NombreItem').txt(item.descripcion).up()
            .ele('CantidadItem').txt(item.cantidad).up()
            .ele('PrecioUnitarioItem').txt(item.precioUnitario).up()
            .ele('MontoItem').txt(item.montoItem).up()
            .up();
    });

    return doc.end({ prettyPrint: true });
}

export * from './signer';

