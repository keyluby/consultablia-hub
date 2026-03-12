/**
 * Servicio de base de datos para Reportes 606
 * Maneja todas las operaciones CRUD con Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Reporte606DB,
  Reporte606Insert,
  Factura606DB,
  Factura606Insert,
  ReporteConFacturas,
  EstadoReporte,
} from '@/types/database';
import type { Registro606 } from '@/types/formato606';

// =====================================================
// FUNCIONES DE REPORTES
// =====================================================

/**
 * Obtener o crear un reporte para un período específico
 * @param periodo Formato "YYYY-MM" (ej: "2026-03")
 * @returns Reporte existente o recién creado
 */
export async function obtenerOCrearReporte(periodo: string): Promise<Reporte606DB> {
  // Intentar obtener reporte existente
  const { data: existente, error: errorBusqueda } = await supabase
    .from('reportes_606')
    .select('*')
    .eq('periodo', periodo)
    .maybeSingle();

  if (existente) return existente;

  // Si no existe, crear uno nuevo
  const nombreMes = formatearNombrePeriodo(periodo);
  const { data: nuevo, error: errorCreacion } = await supabase
    .from('reportes_606')
    .insert({
      periodo,
      nombre: nombreMes,
    })
    .select()
    .single();

  if (errorCreacion) throw new Error(`Error creando reporte: ${errorCreacion.message}`);
  if (!nuevo) throw new Error('No se pudo crear el reporte');

  return nuevo;
}

/**
 * Crear un nuevo reporte con fechas personalizadas
 */
export async function crearReporte(
  periodo: string,
  fechaInicio: string,
  fechaFin: string,
  nombre?: string
): Promise<Reporte606DB> {
  const nombreFinal = nombre || formatearNombrePeriodo(periodo);

  const { data, error } = await supabase
    .from('reportes_606')
    .insert({
      periodo,
      nombre: nombreFinal,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: 'borrador',
    })
    .select()
    .single();

  if (error) throw new Error(`Error creando reporte: ${error.message}`);
  if (!data) throw new Error('No se pudo crear el reporte');

  return data;
}

/**
 * Listar todos los reportes disponibles (ordenados por período descendente)
 */
export async function listarReportes(filtros?: {
  estado?: EstadoReporte;
  año?: number;
  mes?: number;
}): Promise<Reporte606DB[]> {
  let query = supabase.from('reportes_606').select('*');

  // Aplicar filtros
  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado);
  }

  if (filtros?.año) {
    const añoStr = String(filtros.año);
    query = query.like('periodo', `${añoStr}%`);
  }

  if (filtros?.mes) {
    const mesStr = String(filtros.mes).padStart(2, '0');
    if (filtros.año) {
      query = query.eq('periodo', `${filtros.año}-${mesStr}`);
    } else {
      query = query.like('periodo', `%-${mesStr}`);
    }
  }

  query = query.order('periodo', { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(`Error listando reportes: ${error.message}`);
  return data || [];
}

/**
 * Actualizar estado de un reporte
 */
export async function actualizarEstadoReporte(
  reporteId: string,
  estado: EstadoReporte
): Promise<Reporte606DB> {
  const updates: Partial<Reporte606DB> = { estado };

  // Si se marca como enviado, guardar fecha de envío
  if (estado === 'enviado') {
    updates.fecha_envio = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('reportes_606')
    .update(updates)
    .eq('id', reporteId)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando estado: ${error.message}`);
  if (!data) throw new Error('Reporte no encontrado');

  return data;
}

/**
 * Actualizar datos de un reporte
 */
export async function actualizarReporte(
  reporteId: string,
  cambios: Partial<Reporte606Insert>
): Promise<Reporte606DB> {
  const { data, error } = await supabase
    .from('reportes_606')
    .update(cambios)
    .eq('id', reporteId)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando reporte: ${error.message}`);
  if (!data) throw new Error('Reporte no encontrado');

  return data;
}

/**
 * Obtener un reporte por ID
 */
export async function obtenerReportePorId(reporteId: string): Promise<Reporte606DB> {
  const { data, error } = await supabase
    .from('reportes_606')
    .select('*')
    .eq('id', reporteId)
    .single();

  if (error) throw new Error(`Error obteniendo reporte: ${error.message}`);
  if (!data) throw new Error('Reporte no encontrado');

  return data;
}

/**
 * Obtener un reporte con todas sus facturas
 */
export async function obtenerReporteCompleto(reporteId: string): Promise<ReporteConFacturas> {
  const { data: reporte, error: errorReporte } = await supabase
    .from('reportes_606')
    .select('*')
    .eq('id', reporteId)
    .single();

  if (errorReporte) throw new Error(`Error obteniendo reporte: ${errorReporte.message}`);
  if (!reporte) throw new Error('Reporte no encontrado');

  const { data: facturas, error: errorFacturas } = await supabase
    .from('facturas_606')
    .select('*')
    .eq('reporte_id', reporteId)
    .order('fecha_creacion', { ascending: false });

  if (errorFacturas) throw new Error(`Error obteniendo facturas: ${errorFacturas.message}`);

  return {
    ...reporte,
    facturas: facturas || [],
  };
}

/**
 * Eliminar un reporte y todas sus facturas (CASCADE)
 */
export async function eliminarReporte(reporteId: string): Promise<void> {
  const { error } = await supabase
    .from('reportes_606')
    .delete()
    .eq('id', reporteId);

  if (error) throw new Error(`Error eliminando reporte: ${error.message}`);
}

// =====================================================
// FUNCIONES DE FACTURAS
// =====================================================

/**
 * Guardar una nueva factura en un reporte
 */
export async function guardarFactura(
  reporteId: string,
  factura: Registro606
): Promise<Factura606DB> {
  // Excluir campos autogenerados por la BD
  const { id, fecha_creacion, fecha_modificacion, ...facturaData } = factura;

  const insertData: Factura606Insert = {
    reporte_id: reporteId,
    ...facturaData,
  };

  const { data, error } = await supabase
    .from('facturas_606')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(`Error guardando factura: ${error.message}`);
  if (!data) throw new Error('No se pudo guardar la factura');

  return data;
}

/**
 * Actualizar una factura existente
 */
export async function actualizarFactura(
  facturaId: string,
  cambios: Partial<Registro606>
): Promise<Factura606DB> {
  const { data, error } = await supabase
    .from('facturas_606')
    .update(cambios)
    .eq('id', facturaId)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando factura: ${error.message}`);
  if (!data) throw new Error('Factura no encontrada');

  return data;
}

/**
 * Eliminar una factura (y su imagen del storage si existe)
 */
export async function eliminarFactura(facturaId: string): Promise<void> {
  // Obtener la factura para saber si tiene imagen en storage
  const { data: factura } = await supabase
    .from('facturas_606')
    .select('storage_path')
    .eq('id', facturaId)
    .single();

  // Eliminar imagen del storage si existe
  if (factura?.storage_path) {
    await supabase.storage
      .from('invoice-scans')
      .remove([factura.storage_path]);
  }

  // Eliminar factura de la base de datos
  const { error } = await supabase
    .from('facturas_606')
    .delete()
    .eq('id', facturaId);

  if (error) throw new Error(`Error eliminando factura: ${error.message}`);
}

/**
 * Listar todas las facturas de un reporte
 */
export async function listarFacturasDeReporte(reporteId: string): Promise<Factura606DB[]> {
  const { data, error } = await supabase
    .from('facturas_606')
    .select('*')
    .eq('reporte_id', reporteId)
    .order('fecha_creacion', { ascending: false });

  if (error) throw new Error(`Error listando facturas: ${error.message}`);
  return data || [];
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Formatear período YYYY-MM a nombre legible
 * @example "2026-03" → "Marzo 2026 - Reporte 606"
 */
function formatearNombrePeriodo(periodo: string): string {
  const [year, month] = periodo.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const nombreMes = meses[parseInt(month, 10) - 1];
  return `${nombreMes} ${year} - Reporte 606`;
}

/**
 * Convertir Factura606DB a Registro606
 * (simplemente omitir campos de DB como reporte_id, fecha_creacion, fecha_modificacion)
 */
export function dbToRegistro606(dbFactura: Factura606DB): Registro606 {
  const { reporte_id, fecha_creacion, fecha_modificacion, ...registro } = dbFactura;
  return registro;
}
