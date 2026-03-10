"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEcfXml = generateEcfXml;
const xmlbuilder2_1 = require("xmlbuilder2");
function generateEcfXml(data) {
    // DGII XML format based on Aviso 24 (simplified version for the scaffold)
    const doc = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
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
__exportStar(require("./signer"), exports);
//# sourceMappingURL=index.js.map