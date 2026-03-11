import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Registro606,
  PeriodoContable,
  Resumen606,
  ocrToRegistro606,
  validarRegistro606,
  OCRExtractionResult,
} from '@/types/formato606';

interface Facturas606ContextType {
  // Estado
  facturas: Registro606[];
  periodoActual: PeriodoContable;
  facturaSeleccionada: Registro606 | null;
  indiceFacturaSeleccionada: number;

  // Acciones de facturas
  agregarFactura: (factura: Partial<Registro606>) => void;
  actualizarFactura: (id: string, cambios: Partial<Registro606>) => void;
  eliminarFactura: (id: string) => void;
  limpiarTodasFacturas: () => void;

  // Navegación
  seleccionarFactura: (indice: number) => void;
  siguienteFactura: () => void;
  facturaAnterior: () => void;

  // Período
  cambiarPeriodo: (año: number, mes: number) => void;

  // Cálculos
  obtenerResumen: () => Resumen606;

  // Import/Export
  agregarDesdeOCR: (ocrResult: OCRExtractionResult, archivoUrl?: string, storagePath?: string) => void;
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

  const facturaSeleccionada = indiceFacturaSeleccionada >= 0 ? facturas[indiceFacturaSeleccionada] : null;

  // ========== CRUD DE FACTURAS ==========

  const agregarFactura = useCallback((factura: Partial<Registro606>) => {
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

    setFacturas((prev) => [...prev, nuevaFactura]);

    // Auto-seleccionar la nueva factura
    setIndiceFacturaSeleccionada((prev) => {
      if (prev === -1) return 0; // Si no había ninguna seleccionada, seleccionar la primera
      return prev; // Mantener la selección actual
    });
  }, []);

  const actualizarFactura = useCallback((id: string, cambios: Partial<Registro606>) => {
    setFacturas((prev) =>
      prev.map((factura) => {
        if (factura.id === id) {
          const actualizada = {
            ...factura,
            ...cambios,
            fecha_modificacion: new Date().toISOString(),
          };

          // Re-validar
          const { valido, errores } = validarRegistro606(actualizada);
          actualizada.estado_validacion = valido ? 'valido' : 'requiere_revision';
          actualizada.errores_validacion = errores;

          return actualizada;
        }
        return factura;
      })
    );
  }, []);

  const eliminarFactura = useCallback((id: string) => {
    setFacturas((prev) => {
      const nuevasFacturas = prev.filter((f) => f.id !== id);
      // Ajustar índice seleccionado si es necesario
      if (indiceFacturaSeleccionada >= nuevasFacturas.length) {
        setIndiceFacturaSeleccionada(Math.max(0, nuevasFacturas.length - 1));
      }
      return nuevasFacturas;
    });
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
    (ocrResult: OCRExtractionResult, archivoUrl?: string, storagePath?: string) => {
      const registro = ocrToRegistro606(ocrResult, {
        archivo_url: archivoUrl,
        storage_path: storagePath,
      });

      agregarFactura(registro);
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
    facturaSeleccionada,
    indiceFacturaSeleccionada,

    // Acciones
    agregarFactura,
    actualizarFactura,
    eliminarFactura,
    limpiarTodasFacturas,

    // Navegación
    seleccionarFactura,
    siguienteFactura,
    facturaAnterior,

    // Período
    cambiarPeriodo,

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
