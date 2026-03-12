import { Link } from 'react-router-dom';
import { FileText, Calendar, DollarSign, CheckCircle2, Clock, Send, Lock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Reporte606DB } from '@/types/database';

interface TarjetaReporteProps {
  reporte: Reporte606DB;
  totalFacturas: number;
  montoTotal: number;
}

export default function TarjetaReporte({ reporte, totalFacturas, montoTotal }: TarjetaReporteProps) {
  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return {
          label: 'Borrador',
          icon: Clock,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
      case 'listo':
        return {
          label: 'Listo',
          icon: CheckCircle2,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'enviado':
        return {
          label: 'Enviado',
          icon: Send,
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        };
      case 'cerrado':
        return {
          label: 'Cerrado',
          icon: Lock,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-100'
        };
      default:
        return {
          label: 'Desconocido',
          icon: FileText,
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const estadoConfig = getEstadoConfig(reporte.estado);
  const IconoEstado = estadoConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {reporte.nombre || reporte.periodo}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatearFecha(reporte.fecha_inicio)} - {formatearFecha(reporte.fecha_fin)}
              </span>
            </div>
          </div>
          <Badge variant={estadoConfig.variant} className={estadoConfig.className}>
            <IconoEstado className="h-3 w-3 mr-1" />
            {estadoConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Facturas
            </span>
            <span className="font-medium">{totalFacturas}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <DollarSign className="h-4 w-4" />
              Total
            </span>
            <span className="font-semibold text-lg">
              {formatearMoneda(montoTotal)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" variant={reporte.estado === 'enviado' || reporte.estado === 'cerrado' ? 'outline' : 'default'}>
          <Link to={`/reportes/${reporte.id}/escanear`}>
            {reporte.estado === 'enviado' || reporte.estado === 'cerrado' ? 'Ver Reporte' : 'Abrir Reporte'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
