-- =====================================================
-- MIGRACIÓN: Sistema de Reportes 606
-- Descripción: Tablas para persistir reportes mensuales
--              y facturas escaneadas del formato 606 DGII
-- Fecha: 2026-03-11
-- Alineado con el tipo Registro606 de TypeScript
-- =====================================================

-- =====================================================
-- TABLA: reportes_606
-- Almacena períodos de reporte (mes/año)
-- =====================================================
CREATE TABLE IF NOT EXISTS reportes_606 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo TEXT NOT NULL, -- Formato: "2026-03" (YYYY-MM)
    nombre TEXT, -- Opcional: "Marzo 2026 - Compras"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar duplicados de período
    CONSTRAINT unique_periodo UNIQUE (periodo)
);

-- Índice para búsquedas por período
CREATE INDEX idx_reportes_periodo ON reportes_606(periodo DESC);

-- =====================================================
-- TABLA: facturas_606
-- Almacena cada factura escaneada con sus 23 columnas
-- Estructura alineada exactamente con Registro606
-- =====================================================
CREATE TABLE IF NOT EXISTS facturas_606 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id UUID NOT NULL REFERENCES reportes_606(id) ON DELETE CASCADE,

    -- ========== IDENTIFICACIÓN ==========
    -- COLUMNA 1: RNC/Cédula del Proveedor
    rnc_cedula TEXT NOT NULL,

    -- COLUMNA 2: Tipo de Identificación (1=RNC, 2=Cédula)
    tipo_identificacion TEXT NOT NULL CHECK (tipo_identificacion IN ('1', '2')),

    -- COLUMNA 3: Tipo de Bienes/Servicios Comprados (códigos 01-11)
    tipo_bienes_servicios TEXT NOT NULL CHECK (tipo_bienes_servicios IN (
        '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'
    )),

    -- ========== COMPROBANTE ==========
    -- COLUMNA 4: Número de Comprobante Fiscal (NCF)
    ncf TEXT NOT NULL,

    -- COLUMNA 5: NCF Modificado (para notas de crédito/débito)
    ncf_modificado TEXT,

    -- COLUMNA 6: Fecha del Comprobante (YYYYMMDD)
    fecha_comprobante TEXT NOT NULL,

    -- COLUMNA 7: Fecha de Pago (YYYYMMDD, requerido si hay retenciones)
    fecha_pago TEXT,

    -- ========== MONTOS FACTURADOS ==========
    -- COLUMNA 8: Monto Facturado en Servicios
    monto_facturado_servicios DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 9: Monto Facturado en Bienes
    monto_facturado_bienes DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 10: Total Monto Facturado
    total_monto_facturado DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- ========== ITBIS ==========
    -- COLUMNA 11: ITBIS Facturado
    itbis_facturado DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 12: ITBIS Retenido por el Comprador
    itbis_retenido DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 13: ITBIS sujeto a Proporcionalidad (Art. 349)
    itbis_proporcionalidad DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 14: ITBIS llevado al Costo
    itbis_costo DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 15: ITBIS por Adelantar (calculado: col 11 - col 14)
    itbis_adelantar DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 16: ITBIS Percibido en Compras
    itbis_percibido DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- ========== ISR ==========
    -- COLUMNA 17: Tipo de Retención en ISR (códigos 01-09)
    tipo_retencion_isr TEXT CHECK (tipo_retencion_isr IN (
        '01', '02', '03', '04', '05', '06', '07', '08', '09'
    )),

    -- COLUMNA 18: Monto de Retención de Renta (ISR retenido)
    monto_retencion_renta DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 19: ISR Percibido en Compras
    isr_percibido DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- ========== OTROS IMPUESTOS ==========
    -- COLUMNA 20: Impuesto Selectivo al Consumo
    impuesto_selectivo_consumo DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 21: Otros Impuestos o Tasas
    otros_impuestos DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- COLUMNA 22: Monto Propina Legal (10%)
    monto_propina_legal DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,

    -- ========== FORMA DE PAGO ==========
    -- COLUMNA 23: Forma de Pago (códigos 1-7)
    forma_pago TEXT NOT NULL CHECK (forma_pago IN ('1', '2', '3', '4', '5', '6', '7')),

    -- ========== METADATOS ADICIONALES (no parte del 606 oficial) ==========
    razon_social_proveedor TEXT, -- Nombre del proveedor (referencia)
    archivo_url TEXT, -- URL de la imagen en Supabase Storage
    storage_path TEXT, -- Ruta en el bucket
    confidence JSONB, -- Niveles de confianza del OCR
    estado_validacion TEXT DEFAULT 'pendiente' CHECK (estado_validacion IN (
        'pendiente', 'valido', 'requiere_revision', 'error'
    )),
    errores_validacion JSONB, -- Array de strings con errores

    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_facturas_reporte ON facturas_606(reporte_id);
CREATE INDEX idx_facturas_fecha ON facturas_606(fecha_comprobante DESC);
CREATE INDEX idx_facturas_proveedor ON facturas_606(rnc_cedula);
CREATE INDEX idx_facturas_ncf ON facturas_606(ncf);

-- =====================================================
-- TRIGGER: Actualizar fecha_modificacion automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reportes_606_updated_at
    BEFORE UPDATE ON reportes_606
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_fecha_modificacion_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_facturas_606_fecha_modificacion
    BEFORE UPDATE ON facturas_606
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_modificacion_column();

-- =====================================================
-- RLS (Row Level Security)
-- Por ahora deshabilitado para desarrollo
-- Activar cuando se implemente autenticación
-- =====================================================
-- ALTER TABLE reportes_606 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE facturas_606 ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE reportes_606 IS 'Períodos de reportes mensuales del formato 606';
COMMENT ON TABLE facturas_606 IS 'Facturas escaneadas con las 23 columnas del formato 606 DGII';
COMMENT ON COLUMN facturas_606.tipo_identificacion IS '1=RNC, 2=Cédula';
COMMENT ON COLUMN facturas_606.tipo_bienes_servicios IS '01=Personal, 02=Trabajos/Servicios, 03=Arrendamientos, 04=Activos Fijos, 05=Representación, 06=Otras Deducciones, 07=Financieros, 08=Extraordinarios, 09=Costo de Venta, 10=Adq. Activos, 11=Seguros';
COMMENT ON COLUMN facturas_606.forma_pago IS '1=Efectivo, 2=Cheque/Transferencia, 3=Tarjeta, 4=Crédito, 5=Permuta, 6=Nota Crédito, 7=Mixto';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
