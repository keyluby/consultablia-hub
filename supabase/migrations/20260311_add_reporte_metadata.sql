-- =====================================================
-- MIGRACIÓN: Agregar metadatos a reportes_606
-- Descripción: Estado, fechas de período, fecha de envío
-- Fecha: 2026-03-11
-- =====================================================

-- Agregar columnas de fechas del período
ALTER TABLE reportes_606
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin DATE;

-- Agregar columna de estado
ALTER TABLE reportes_606
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'borrador'
  CHECK (estado IN ('borrador', 'listo', 'enviado', 'cerrado'));

-- Agregar columna de fecha de envío
ALTER TABLE reportes_606
  ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMPTZ;

-- Agregar descripción opcional
ALTER TABLE reportes_606
  ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_606(estado);

-- Actualizar reportes existentes con valores por defecto
-- Calcular fecha_inicio y fecha_fin a partir del período (YYYY-MM)
UPDATE reportes_606
SET
  fecha_inicio = (periodo || '-01')::DATE,
  fecha_fin = (DATE_TRUNC('month', (periodo || '-01')::DATE) + INTERVAL '1 month - 1 day')::DATE
WHERE fecha_inicio IS NULL;

-- Comentarios para documentación
COMMENT ON COLUMN reportes_606.estado IS 'borrador=En proceso, listo=Listo para enviar, enviado=Enviado a DGII, cerrado=Archivado';
COMMENT ON COLUMN reportes_606.fecha_inicio IS 'Fecha de inicio del período del reporte';
COMMENT ON COLUMN reportes_606.fecha_fin IS 'Fecha de fin del período del reporte';
COMMENT ON COLUMN reportes_606.fecha_envio IS 'Fecha en que se envió el reporte a la DGII';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
