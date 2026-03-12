import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EstadoReporte } from '@/types/database';

interface FiltrosReportesProps {
  estadoSeleccionado: EstadoReporte | 'todos';
  añoSeleccionado: number | 'todos';
  onCambiarEstado: (estado: EstadoReporte | 'todos') => void;
  onCambiarAño: (año: number | 'todos') => void;
}

export default function FiltrosReportes({
  estadoSeleccionado,
  añoSeleccionado,
  onCambiarEstado,
  onCambiarAño,
}: FiltrosReportesProps) {
  const añoActual = new Date().getFullYear();
  const años = [añoActual, añoActual - 1, añoActual - 2, añoActual - 3];

  return (
    <div className="flex gap-3 items-center mb-6 flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtros:
      </div>

      {/* Filtro por Estado */}
      <Select
        value={estadoSeleccionado}
        onValueChange={(value) => onCambiarEstado(value as EstadoReporte | 'todos')}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          <SelectItem value="borrador">Borradores</SelectItem>
          <SelectItem value="listo">Listos</SelectItem>
          <SelectItem value="enviado">Enviados</SelectItem>
          <SelectItem value="cerrado">Cerrados</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro por Año */}
      <Select
        value={añoSeleccionado.toString()}
        onValueChange={(value) => onCambiarAño(value === 'todos' ? 'todos' : parseInt(value))}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los años</SelectItem>
          {años.map((año) => (
            <SelectItem key={año} value={año.toString()}>
              {año}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
