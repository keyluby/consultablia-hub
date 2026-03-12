/**
 * Tipos TypeScript que coinciden con el esquema de Supabase
 * Alineados con Registro606 del formato606.ts
 */

import type { Registro606 } from './formato606';

// =====================================================
// TABLA: reportes_606
// =====================================================
export type EstadoReporte = 'borrador' | 'listo' | 'enviado' | 'cerrado';

export interface Reporte606DB {
  id: string; // UUID
  periodo: string; // "2026-03"
  nombre: string | null;
  fecha_inicio: string | null; // ISO date
  fecha_fin: string | null; // ISO date
  estado: EstadoReporte;
  fecha_envio: string | null; // ISO timestamp
  descripcion: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Reporte606Insert {
  periodo: string;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoReporte;
  descripcion?: string;
}

// =====================================================
// TABLA: facturas_606
// Los campos coinciden exactamente con Registro606
// más el reporte_id para la relación
// =====================================================
export interface Factura606DB extends Registro606 {
  reporte_id: string; // UUID del reporte al que pertenece
  fecha_creacion: string; // ISO timestamp
  fecha_modificacion: string; // ISO timestamp
}

export type Factura606Insert = Omit<Factura606DB, 'id' | 'fecha_creacion' | 'fecha_modificacion'> & {
  id?: string;
};

// =====================================================
// RESPUESTAS DE LA API
// =====================================================
export interface ReporteConFacturas extends Reporte606DB {
  facturas: Factura606DB[];
}
