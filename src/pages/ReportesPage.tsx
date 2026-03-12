import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Plus } from 'lucide-react';
import TarjetaReporte from '@/components/reportes/TarjetaReporte';
import FiltrosReportes from '@/components/reportes/FiltrosReportes';
import ModalNuevoReporte from '@/components/reportes/ModalNuevoReporte';
import { Button } from '@/components/ui/button';
import {
  listarReportes,
  crearReporte,
  listarFacturasDeReporte,
} from '@/services/reportes606Service';
import type { Reporte606DB, EstadoReporte } from '@/types/database';

interface ReporteConEstadisticas extends Reporte606DB {
  totalFacturas: number;
  montoTotal: number;
}

export default function ReportesPage() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState<ReporteConEstadisticas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Filtros (estado por defecto: borrador, para ver reportes en proceso)
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoReporte | 'todos'>('borrador');
  const [añoSeleccionado, setAñoSeleccionado] = useState<number | 'todos'>('todos');

  useEffect(() => {
    cargarReportes();
  }, [estadoSeleccionado, añoSeleccionado]);

  const cargarReportes = async () => {
    setIsLoading(true);
    try {
      const filtros = {
        estado: estadoSeleccionado === 'todos' ? undefined : estadoSeleccionado,
        año: añoSeleccionado === 'todos' ? undefined : añoSeleccionado,
      };

      const reportesData = await listarReportes(filtros);

      // Obtener estadísticas de cada reporte
      const reportesConEstadisticas = await Promise.all(
        reportesData.map(async (reporte) => {
          try {
            const facturas = await listarFacturasDeReporte(reporte.id);
            const montoTotal = facturas.reduce((sum, f) => sum + (f.total_monto_facturado || 0), 0);

            return {
              ...reporte,
              totalFacturas: facturas.length,
              montoTotal,
            };
          } catch (error) {
            return {
              ...reporte,
              totalFacturas: 0,
              montoTotal: 0,
            };
          }
        })
      );

      setReportes(reportesConEstadisticas);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearReporte = async (
    mes: number,
    año: number,
    fechaInicio: string,
    fechaFin: string,
    nombre?: string
  ) => {
    try {
      const periodo = `${año}-${String(mes).padStart(2, '0')}`;
      const nuevoReporte = await crearReporte(periodo, fechaInicio, fechaFin, nombre);

      toast.success('Reporte creado correctamente');

      // Navegar al reporte recién creado
      navigate(`/reportes/${nuevoReporte.id}/escanear`);
    } catch (error: any) {
      console.error('Error creando reporte:', error);
      toast.error(error.message || 'Error al crear el reporte');
    }
  };

  return (
    <div className="fade-in min-h-screen p-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Mis Reportes 606
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus reportes de compras para la DGII
          </p>
        </div>

        <Button onClick={() => setMostrarModal(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {/* Filtros */}
      <FiltrosReportes
        estadoSeleccionado={estadoSeleccionado}
        añoSeleccionado={añoSeleccionado}
        onCambiarEstado={setEstadoSeleccionado}
        onCambiarAño={setAñoSeleccionado}
      />

      {/* Lista de Reportes */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          Cargando reportes...
        </div>
      ) : reportes.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            No hay reportes con estos filtros
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Crea tu primer reporte para comenzar
          </p>
          <Button onClick={() => setMostrarModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Reporte
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {reportes.map((reporte) => (
            <TarjetaReporte
              key={reporte.id}
              reporte={reporte}
              totalFacturas={reporte.totalFacturas}
              montoTotal={reporte.montoTotal}
            />
          ))}
        </div>
      )}

      {/* Modal Nuevo Reporte */}
      <ModalNuevoReporte
        open={mostrarModal}
        onOpenChange={setMostrarModal}
        onCrear={handleCrearReporte}
      />
    </div>
  );
}
