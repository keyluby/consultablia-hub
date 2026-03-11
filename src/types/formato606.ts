/**
 * Tipos completos del Formato 606 - Reporte de Compras DGII
 * Basado en la Norma General 07-2018 de República Dominicana
 */

// Catálogo de tipos de identificación
export type TipoIdentificacion = '1' | '2'; // 1=RNC, 2=Cédula

// Catálogo de tipos de bienes y servicios (11 categorías según DGII)
export type TipoBienesServicios =
  | '01' // Gastos de personal
  | '02' // Gastos por trabajos, suministros y servicios
  | '03' // Arrendamientos
  | '04' // Gastos de activos fijos
  | '05' // Gastos de representación
  | '06' // Otras deducciones admitidas
  | '07' // Gastos financieros
  | '08' // Gastos extraordinarios
  | '09' // Compras y gastos que formarán parte del costo de venta
  | '10' // Adquisiciones de activos
  | '11'; // Gastos de seguros

// Catálogo de tipos de retención ISR (códigos 1-9)
export type TipoRetencionISR =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09';

// Catálogo de formas de pago
export type FormaPago =
  | '1' // Efectivo
  | '2' // Cheque/Transferencia
  | '3' // Tarjeta
  | '4' // Crédito
  | '5' // Permuta
  | '6' // Nota de Crédito
  | '7'; // Mixto

/**
 * Estructura completa del Formato 606 (23 columnas oficiales DGII)
 */
export interface Registro606 {
  // ========== IDENTIFICACIÓN ==========
  /** Col 1: RNC o Cédula del proveedor (9-11 dígitos sin guiones) */
  rnc_cedula: string;

  /** Col 2: Tipo de identificación (1=RNC, 2=Cédula) */
  tipo_identificacion: TipoIdentificacion;

  /** Col 3: Tipo de bienes/servicios comprados (códigos 01-11) */
  tipo_bienes_servicios: TipoBienesServicios;

  // ========== COMPROBANTE ==========
  /** Col 4: Número de Comprobante Fiscal (11-13 caracteres, e-NCF con E) */
  ncf: string;

  /** Col 5: NCF o Documento Modificado (para notas de crédito/débito) */
  ncf_modificado?: string | null;

  /** Col 6: Fecha del comprobante (YYYYMMDD) */
  fecha_comprobante: string;

  /** Col 7: Fecha de pago (YYYYMMDD, requerido si hay retenciones) */
  fecha_pago?: string | null;

  // ========== MONTOS FACTURADOS ==========
  /** Col 8: Monto facturado en servicios (antes de impuestos) */
  monto_facturado_servicios: number;

  /** Col 9: Monto facturado en bienes (antes de impuestos) */
  monto_facturado_bienes: number;

  /** Col 10: Total monto facturado (suma automática col 8 + col 9) */
  total_monto_facturado: number;

  // ========== ITBIS ==========
  /** Col 11: ITBIS facturado (18% o 16%) */
  itbis_facturado: number;

  /** Col 12: ITBIS retenido por el comprador */
  itbis_retenido: number;

  /** Col 13: ITBIS sujeto a proporcionalidad (Art. 349 Ley 11-92) */
  itbis_proporcionalidad: number;

  /** Col 14: ITBIS llevado al costo (no deducible como adelanto) */
  itbis_costo: number;

  /** Col 15: ITBIS por adelantar (col 11 - col 14, calculado automáticamente) */
  itbis_adelantar: number;

  /** Col 16: ITBIS percibido en compras (por terceros) */
  itbis_percibido: number;

  // ========== ISR ==========
  /** Col 17: Tipo de retención en ISR (códigos 01-09) */
  tipo_retencion_isr?: TipoRetencionISR | null;

  /** Col 18: Monto de retención de renta (ISR retenido) */
  monto_retencion_renta: number;

  /** Col 19: ISR percibido en compras */
  isr_percibido: number;

  // ========== OTROS IMPUESTOS ==========
  /** Col 20: Impuesto Selectivo al Consumo */
  impuesto_selectivo_consumo: number;

  /** Col 21: Otros impuestos o tasas */
  otros_impuestos: number;

  /** Col 22: Monto propina legal (Ley 54-32, 10%) */
  monto_propina_legal: number;

  // ========== FORMA DE PAGO ==========
  /** Col 23: Forma de pago (códigos 1-7) */
  forma_pago: FormaPago;

  // ========== METADATOS ADICIONALES (no parte del 606 oficial) ==========
  /** ID único interno de la factura */
  id?: string;

  /** Razón social del proveedor (para referencia interna, no se envía en 606) */
  razon_social_proveedor?: string;

  /** URL del archivo original (imagen/PDF) en storage */
  archivo_url?: string;

  /** Ruta del archivo en Supabase Storage */
  storage_path?: string;

  /** Niveles de confianza de la extracción por IA (0-100) */
  confidence?: {
    rnc_cedula?: number;
    ncf?: number;
    fecha_comprobante?: number;
    total_monto_facturado?: number;
    itbis_facturado?: number;
  };

  /** Estado de validación */
  estado_validacion?: 'pendiente' | 'valido' | 'requiere_revision' | 'error';

  /** Errores de validación encontrados */
  errores_validacion?: string[];

  /** Fecha de creación del registro */
  fecha_creacion?: string;

  /** Última modificación */
  fecha_modificacion?: string;
}

/**
 * Respuesta de la extracción OCR (formato intermedio antes de mapear a 606)
 */
export interface OCRExtractionResult {
  // Datos básicos extraídos
  rnc_emisor?: string;
  razon_social_emisor?: string;
  rnc_comprador?: string;
  razon_social_comprador?: string;
  ncf?: string;
  fecha_comprobante?: string;
  fecha_pago?: string;

  // Clasificación
  tipo_gasto?: 'servicios' | 'bienes' | 'mixto';

  // Montos
  monto_facturado?: number;
  monto_facturado_servicios?: number;
  monto_facturado_bienes?: number;
  itbis_facturado?: number;
  itbis_retenido?: number;
  isr_retenido?: number;
  propina_legal?: number;
  total?: number;

  // Confianza
  confidence?: {
    rnc_emisor?: number;
    rnc_comprador?: number;
    ncf?: number;
    total?: number;
    itbis_facturado?: number;
    fecha_comprobante?: number;
  };
}

/**
 * Período contable para agrupación de facturas 606
 */
export interface PeriodoContable {
  año: number;
  mes: number; // 1-12
  label: string; // ej: "Marzo 2026"
}

/**
 * Resumen de totales del reporte 606
 */
export interface Resumen606 {
  total_facturas: number;
  total_monto_facturado: number;
  total_itbis_facturado: number;
  total_itbis_adelantar: number;
  total_itbis_retenido: number;
  total_isr_retenido: number;
  facturas_con_errores: number;
  facturas_pendientes_revision: number;
}

/**
 * Helper function: Convertir extracción OCR a registro 606
 */
export function ocrToRegistro606(
  ocr: OCRExtractionResult,
  defaults?: Partial<Registro606>
): Partial<Registro606> {
  // Determinar tipo de identificación (asumimos RNC por defecto)
  const tipoId: TipoIdentificacion =
    ocr.rnc_emisor && ocr.rnc_emisor.length === 11 ? '2' : '1';

  // Distribuir monto facturado entre servicios y bienes
  let montoServicios = 0;
  let montoBienes = 0;

  if (ocr.monto_facturado_servicios !== undefined && ocr.monto_facturado_bienes !== undefined) {
    montoServicios = ocr.monto_facturado_servicios;
    montoBienes = ocr.monto_facturado_bienes;
  } else if (ocr.tipo_gasto) {
    if (ocr.tipo_gasto === 'servicios') {
      montoServicios = ocr.monto_facturado || 0;
      montoBienes = 0;
    } else if (ocr.tipo_gasto === 'bienes') {
      montoServicios = 0;
      montoBienes = ocr.monto_facturado || 0;
    } else {
      // Mixto: dividir 50/50 como estimación
      montoServicios = (ocr.monto_facturado || 0) / 2;
      montoBienes = (ocr.monto_facturado || 0) / 2;
    }
  }

  const totalMonto = montoServicios + montoBienes;
  const itbisFacturado = ocr.itbis_facturado || 0;
  const itbisCosto = 0; // Por defecto 0, usuario puede ajustar
  const itbisAdelantar = itbisFacturado - itbisCosto;

  return {
    // Identificación
    rnc_cedula: ocr.rnc_emisor || '',
    tipo_identificacion: tipoId,
    tipo_bienes_servicios: '02', // Por defecto "trabajos y servicios"
    razon_social_proveedor: ocr.razon_social_emisor,

    // Comprobante
    ncf: ocr.ncf || '',
    ncf_modificado: null,
    fecha_comprobante: ocr.fecha_comprobante?.replace(/-/g, '') || '', // YYYYMMDD
    fecha_pago: ocr.fecha_pago?.replace(/-/g, '') || null,

    // Montos facturados
    monto_facturado_servicios: montoServicios,
    monto_facturado_bienes: montoBienes,
    total_monto_facturado: totalMonto,

    // ITBIS
    itbis_facturado: itbisFacturado,
    itbis_retenido: ocr.itbis_retenido || 0,
    itbis_proporcionalidad: 0,
    itbis_costo: itbisCosto,
    itbis_adelantar: itbisAdelantar,
    itbis_percibido: 0,

    // ISR
    tipo_retencion_isr: null,
    monto_retencion_renta: ocr.isr_retenido || 0,
    isr_percibido: 0,

    // Otros impuestos
    impuesto_selectivo_consumo: 0,
    otros_impuestos: 0,
    monto_propina_legal: ocr.propina_legal || 0,

    // Forma de pago
    forma_pago: '1', // Por defecto efectivo

    // Metadatos
    confidence: ocr.confidence,
    estado_validacion: 'pendiente',

    // Sobrescribir con defaults si existen
    ...defaults,
  };
}

/**
 * Validar un registro 606
 */
export function validarRegistro606(registro: Partial<Registro606>): {
  valido: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  // Validaciones obligatorias
  if (!registro.rnc_cedula || registro.rnc_cedula.length < 9) {
    errores.push('RNC/Cédula inválido (mínimo 9 dígitos)');
  }

  if (!registro.ncf || registro.ncf.length < 11) {
    errores.push('NCF inválido (mínimo 11 caracteres)');
  }

  if (!registro.fecha_comprobante || registro.fecha_comprobante.length !== 8) {
    errores.push('Fecha de comprobante inválida (formato YYYYMMDD)');
  }

  // Si hay ITBIS retenido, debe haber fecha de pago
  if ((registro.itbis_retenido || 0) > 0 && !registro.fecha_pago) {
    errores.push('ITBIS retenido requiere fecha de pago');
  }

  // Si hay retención ISR, debe haber tipo de retención y fecha de pago
  if ((registro.monto_retencion_renta || 0) > 0) {
    if (!registro.tipo_retencion_isr) {
      errores.push('Retención ISR requiere tipo de retención');
    }
    if (!registro.fecha_pago) {
      errores.push('Retención ISR requiere fecha de pago');
    }
  }

  // Validar coherencia de montos
  const sumaMontos =
    (registro.monto_facturado_servicios || 0) + (registro.monto_facturado_bienes || 0);
  if (Math.abs(sumaMontos - (registro.total_monto_facturado || 0)) > 0.01) {
    errores.push('La suma de servicios + bienes no coincide con el total facturado');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}
