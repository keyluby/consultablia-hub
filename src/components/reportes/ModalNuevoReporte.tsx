import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModalNuevoReporteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrear: (mes: number, año: number, fechaInicio: string, fechaFin: string, nombre?: string) => void;
}

export default function ModalNuevoReporte({ open, onOpenChange, onCrear }: ModalNuevoReporteProps) {
  const añoActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  const [mes, setMes] = useState(mesActual);
  const [año, setAño] = useState(añoActual);
  const [nombre, setNombre] = useState('');

  // Calcular fechas automáticamente
  const calcularFechas = (mesNum: number, añoNum: number) => {
    const primerDia = new Date(añoNum, mesNum - 1, 1);
    const ultimoDia = new Date(añoNum, mesNum, 0);

    const formatearFecha = (fecha: Date) => {
      return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    return {
      inicio: formatearFecha(primerDia),
      fin: formatearFecha(ultimoDia),
    };
  };

  const fechas = calcularFechas(mes, año);
  const [fechaInicio, setFechaInicio] = useState(fechas.inicio);
  const [fechaFin, setFechaFin] = useState(fechas.fin);

  const handleMesChange = (nuevoMes: string) => {
    const mesNum = parseInt(nuevoMes);
    setMes(mesNum);
    const nuevasFechas = calcularFechas(mesNum, año);
    setFechaInicio(nuevasFechas.inicio);
    setFechaFin(nuevasFechas.fin);
  };

  const handleAñoChange = (nuevoAño: string) => {
    const añoNum = parseInt(nuevoAño);
    setAño(añoNum);
    const nuevasFechas = calcularFechas(mes, añoNum);
    setFechaInicio(nuevasFechas.inicio);
    setFechaFin(nuevasFechas.fin);
  };

  const handleCrear = () => {
    onCrear(mes, año, fechaInicio, fechaFin, nombre || undefined);
    onOpenChange(false);
    // Reset form
    setNombre('');
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const años = Array.from({ length: 5 }, (_, i) => añoActual - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Crear Nuevo Reporte 606
          </DialogTitle>
          <DialogDescription>
            Completa los datos del período del reporte
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Período */}
          <div className="grid gap-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={mes.toString()} onValueChange={handleMesChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((nombreMes, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {nombreMes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={año.toString()} onValueChange={handleAñoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {años.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fechas del Reporte */}
          <div className="grid gap-2">
            <Label>Fechas del Reporte</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          {/* Nombre (opcional) */}
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre (opcional)</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`${meses[mes - 1]} ${año} - Reporte 606`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCrear}>Crear Reporte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
