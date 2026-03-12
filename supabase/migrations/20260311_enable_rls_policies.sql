-- =====================================================
-- MIGRACIÓN: Políticas RLS para reportes_606 y facturas_606
-- Descripción: Habilitar RLS y crear políticas de acceso
-- Fecha: 2026-03-11
-- Nota: Por ahora permite acceso completo
--       Actualizar cuando se implemente autenticación
-- =====================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE reportes_606 ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_606 ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA reportes_606
-- =====================================================

-- Política: Permitir SELECT a todos
CREATE POLICY "Permitir lectura de reportes a todos"
ON reportes_606
FOR SELECT
TO public
USING (true);

-- Política: Permitir INSERT a todos
CREATE POLICY "Permitir creación de reportes a todos"
ON reportes_606
FOR INSERT
TO public
WITH CHECK (true);

-- Política: Permitir UPDATE a todos
CREATE POLICY "Permitir actualización de reportes a todos"
ON reportes_606
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE a todos
CREATE POLICY "Permitir eliminación de reportes a todos"
ON reportes_606
FOR DELETE
TO public
USING (true);

-- =====================================================
-- POLÍTICAS PARA facturas_606
-- =====================================================

-- Política: Permitir SELECT a todos
CREATE POLICY "Permitir lectura de facturas a todos"
ON facturas_606
FOR SELECT
TO public
USING (true);

-- Política: Permitir INSERT a todos
CREATE POLICY "Permitir creación de facturas a todos"
ON facturas_606
FOR INSERT
TO public
WITH CHECK (true);

-- Política: Permitir UPDATE a todos
CREATE POLICY "Permitir actualización de facturas a todos"
ON facturas_606
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE a todos
CREATE POLICY "Permitir eliminación de facturas a todos"
ON facturas_606
FOR DELETE
TO public
USING (true);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON POLICY "Permitir lectura de reportes a todos" ON reportes_606
IS 'Política temporal - actualizar cuando se implemente autenticación';

COMMENT ON POLICY "Permitir lectura de facturas a todos" ON facturas_606
IS 'Política temporal - actualizar cuando se implemente autenticación';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
