import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  Registro606,
  PeriodoContable,
  Resumen606,
  ocrToRegistro606,
  validarRegistro606,
  OCRExtractionResult,
} from '@/types/formato606';
import {
  obtenerOCrearReporte,
  obtenerReportePorId,
  listarFacturasDeReporte,
  guardarFactura,
  actualizarFactura as actualizarFacturaDB,
  eliminarFactura as eliminarFacturaDB,
  dbToRegistro606,
} from '@/services/reportes606Service';
import type { Reporte606DB } from '@/types/database';
import { toast } from 'sonner';

interface Facturas606ContextType {
  // Estado
  facturas: Registro606[];
  periodoActual: PeriodoContable;
  reporteActual: Reporte606DB | null;
  facturaSeleccionada: Registro606 | null;
  indiceFacturaSeleccionada: number;
  isLoading: boolean;

  // Acciones de facturas
  agregarFactura: (factura: Partial<Registro606>) => Promise<void>;
  actualizarFactura: (id: string, cambios: Partial<Registro606>) => Promise<void>;
  eliminarFactura: (id: string) => Promise<void>;
  limpiarTodasFacturas: () => void;

  // Navegación
  seleccionarFactura: (indice: number) => void;
  siguienteFactura: () => void;
  facturaAnterior: () => void;

  // Período y Reportes
  cambiarPeriodo: (año: number, mes: number) => void;
  cargarReportePorId: (reporteId: string) => Promise<void>;

  // Cálculos
  obtenerResumen: () => Resumen606;

  // Import/Export
  agregarDesdeOCR: (ocrResult: OCRExtractionResult, archivoUrl?: string, storagePath?: string) => Promise<void>;
  exportarA606: () => Registro606[];
}

const Facturas606Context = createContext<Facturas606ContextType | undefined>(undefined);

export function Facturas606Provider({ children }: { children: ReactNode }) {
  const ahora = new Date();
  const [periodoActual, setPeriodoActual] = useState<PeriodoContable>({
    año: ahora.getFullYear(),
    mes: ahora.getMonth() + 1,
    label: `${ahora.toLocaleDateString('es-DO', { month: 'long' })} ${ahora.getFullYear()}`,
  });

  const [facturas, setFacturas] = useState<Registro606[]>([]);
  const [indiceFacturaSeleccionada, setIndiceFacturaSeleccionada] = useState<number>(-1);
  const [reporteActual, setReporteActual] = useState<Reporte606DB | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const facturaSeleccionada = indiceFacturaSeleccionada >= 0 ? facturas[indiceFacturaSeleccionada] : null;

  // ========== CARGAR FACTURAS AL CAMBIAR PERÍODO ==========

  useEffect(() => {
    cargarFacturasDelPeriodo();
  }, [periodoActual.año, periodoActual.mes]);

  const cargarFacturasDelPeriodo = async () => {
    setIsLoading(true);
    try {
      const periodo = `${periodoActual.año}-${String(periodoActual.mes).padStart(2, '0')}`;
      const reporte = await obtenerOCrearReporte(periodo);
      setReporteActual(reporte);

      const facturasDB = await listarFacturasDeReporte(reporte.id);
      const facturasConvertidas = facturasDB.map(dbToRegistro606);
      setFacturas(facturasConvertidas);
      setIndiceFacturaSeleccionada(facturasConvertidas.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Error cargando facturas del período:', error);
      toast.error('Error al cargar las facturas del período');
      setFacturas([]);
      setReporteActual(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cargar un reporte específico por ID
   * Se usa cuando se navega directamente a un reporte desde la lista
   */
  const cargarReportePorId = useCallback(async (reporteId: string) => {
    setIsLoading(true);
    try {
      const reporte = await obtenerReportePorId(reporteId);
      setReporteActual(reporte);

      // Actualizar periodoActual para que coincida con el reporte
      const [año, mes] = reporte.periodo.split('-');
      const fecha = new Date(parseInt(año), parseInt(mes) - 1);
      setPeriodoActual({
        año: parseInt(año),
        mes: parseInt(mes),
        label: `${fecha.toLocaleDateString('es-DO', { month: 'long' })} ${año}`,
      });

      const facturasDB = await listarFacturasDeReporte(reporte.id);
      const facturasConvertidas = facturasDB.map(dbToRegistro606);
      setFacturas(facturasConvertidas);
      setIndiceFacturaSeleccionada(facturasConvertidas.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte');
      setFacturas([]);
      setReporteActual(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== CRUD DE FACTURAS ==========

  const agregarFactura = useCallback(async (factura: Partial<Registro606>) => {
    if (!reporteActual) {
      toast.error('No hay un reporte activo');
      return;
    }

    const nuevaFactura: Registro606 = {
      id: `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString(),
      estado_validacion: 'pendiente',
      ...factura,
    } as Registro606;

    // Validar automáticamente
    const { valido, errores } = validarRegistro606(nuevaFactura);
    nuevaFactura.estado_validacion = valido ? 'valido' : 'requiere_revision';
    nuevaFactura.errores_validacion = errores;

    try {
      // Guardar en BD
      const facturaGuardada = await guardarFactura(reporteActual.id, nuevaFactura);
      const facturaConvertida = dbToRegistro606(facturaGuardada);

      // Actualizar estado local
      setFacturas((prev) => [...prev, facturaConvertida]);

      // Auto-seleccionar la nueva factura
      setIndiceFacturaSeleccionada((prev) => {
        if (prev === -1) return 0;
        return prev;
      });

      toast.success('Factura agregada correctamente');
    } catch (error) {
      console.error('Error guardando factura:', error);
      toast.error('Error al guardar la factura');
    }
  }, [reporteActual]);

  const actualizarFactura = useCallback(async (id: string, cambios: Partial<Registro606>) => {
    try {
      // Actualizar en BD
      const facturaActualizada = await actualizarFacturaDB(id, cambios);
      const facturaConvertida = dbToRegistro606(facturaActualizada);

      // Actualizar estado local
      setFacturas((prev) =>
        prev.map((factura) => (factura.id === id ? facturaConvertida : factura))
      );

      toast.success('Factura actualizada');
    } catch (error) {
      console.error('Error actualizando factura:', error);
      toast.error('Error al actualizar la factura');
    }
  }, []);

  const eliminarFactura = useCallback(async (id: string) => {
    try {
      // Eliminar de BD (también elimina imagen del storage)
      await eliminarFacturaDB(id);

      // Actualizar estado local
      setFacturas((prev) => {
        const nuevasFacturas = prev.filter((f) => f.id !== id);
        // Ajustar índice seleccionado si es necesario
        if (indiceFacturaSeleccionada >= nuevasFacturas.length) {
          setIndiceFacturaSeleccionada(Math.max(0, nuevasFacturas.length - 1));
        }
        return nuevasFacturas;
      });

      toast.success('Factura eliminada');
    } catch (error) {
      console.error('Error eliminando factura:', error);
      toast.error('Error al eliminar la factura');
    }
  }, [indiceFacturaSeleccionada]);

  const limpiarTodasFacturas = useCallback(() => {
    setFacturas([]);
    setIndiceFacturaSeleccionada(-1);
  }, []);

  // ========== NAVEGACIÓN ==========

  const seleccionarFactura = useCallback((indice: number) => {
    setIndiceFacturaSeleccionada(indice);
  }, []);

  const siguienteFactura = useCallback(() => {
    setIndiceFacturaSeleccionada((prev) => {
      if (prev < facturas.length - 1) return prev + 1;
      return prev; // Ya está en la última
    });
  }, [facturas.length]);

  const facturaAnterior = useCallback(() => {
    setIndiceFacturaSeleccionada((prev) => {
      if (prev > 0) return prev - 1;
      return prev; // Ya está en la primera
    });
  }, []);

  // ========== PERÍODO ==========

  const cambiarPeriodo = useCallback((año: number, mes: number) => {
    const fecha = new Date(año, mes - 1);
    setPeriodoActual({
      año,
      mes,
      label: `${fecha.toLocaleDateString('es-DO', { month: 'long' })} ${año}`,
    });
    // El useEffect detectará el cambio y cargará las facturas automáticamente
  }, []);

  // ========== CÁLCULOS ==========

  const obtenerResumen = useCallback((): Resumen606 => {
    const resumen: Resumen606 = {
      total_facturas: facturas.length,
      total_monto_facturado: 0,
      total_itbis_facturado: 0,
      total_itbis_adelantar: 0,
      total_itbis_retenido: 0,
      total_isr_retenido: 0,
      facturas_con_errores: 0,
      facturas_pendientes_revision: 0,
    };

    facturas.forEach((factura) => {
      resumen.total_monto_facturado += factura.total_monto_facturado || 0;
      resumen.total_itbis_facturado += factura.itbis_facturado || 0;
      resumen.total_itbis_adelantar += factura.itbis_adelantar || 0;
      resumen.total_itbis_retenido += factura.itbis_retenido || 0;
      resumen.total_isr_retenido += factura.monto_retencion_renta || 0;

      if (factura.estado_validacion === 'error') {
        resumen.facturas_con_errores++;
      }
      if (factura.estado_validacion === 'requiere_revision') {
        resumen.facturas_pendientes_revision++;
      }
    });

    return resumen;
  }, [facturas]);

  // ========== IMPORT/EXPORT ==========

  const agregarDesdeOCR = useCallback(
    async (ocrResult: OCRExtractionResult, archivoUrl?: string, storagePath?: string) => {
      const registro = ocrToRegistro606(ocrResult, {
        archivo_url: archivoUrl,
        storage_path: storagePath,
      });

      await agregarFactura(registro);
    },
    [agregarFactura]
  );

  const exportarA606 = useCallback((): Registro606[] => {
    // Retornar solo facturas válidas
    return facturas.filter((f) => f.estado_validacion === 'valido');
  }, [facturas]);

  const value: Facturas606ContextType = {
    // Estado
    facturas,
    periodoActual,
    reporteActual,
    facturaSeleccionada,
    indiceFacturaSeleccionada,
    isLoading,

    // Acciones
    agregarFactura,
    actualizarFactura,
    eliminarFactura,
    limpiarTodasFacturas,

    // Navegación
    seleccionarFactura,
    siguienteFactura,
    facturaAnterior,

    // Período y Reportes
    cambiarPeriodo,
    cargarReportePorId,

    // Cálculos
    obtenerResumen,

    // Import/Export
    agregarDesdeOCR,
    exportarA606,
  };

  return <Facturas606Context.Provider value={value}>{children}</Facturas606Context.Provider>;
}

export function useFacturas606() {
  const context = useContext(Facturas606Context);
  if (!context) {
    throw new Error('useFacturas606 must be used within a Facturas606Provider');
  }
  return context;
}
