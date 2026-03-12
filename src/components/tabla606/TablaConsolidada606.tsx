import { useFacturas606 } from '@/contexts/Facturas606Context';
import { Registro606 } from '@/types/formato606';

interface TablaConsolidada606Props {
  onVerDetalleFactura?: (indice: number) => void;
}

export default function TablaConsolidada606({ onVerDetalleFactura }: TablaConsolidada606Props) {
  const { facturas, seleccionarFactura, eliminarFactura, obtenerResumen } = useFacturas606();
  const resumen = obtenerResumen();

  const handleClickFila = (indice: number) => {
    seleccionarFactura(indice);
    if (onVerDetalleFactura) {
      onVerDetalleFactura(indice);
    }
  };

  const handleEliminar = async (e: React.MouseEvent, factura: Registro606) => {
    e.stopPropagation(); // Evitar que se abra el detalle

    const confirmar = window.confirm(
      `¿Eliminar factura de ${factura.razon_social_proveedor || 'Sin nombre'}?\n\n` +
      `NCF: ${factura.ncf || 'Sin NCF'}\n` +
      `Monto: RD$ ${formatearMoneda(factura.total_monto_facturado || 0)}\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmar && factura.id) {
      await eliminarFactura(factura.id);
    }
  };

  const getEstadoColor = (factura: Registro606) => {
    if (factura.estado_validacion === 'valido') return '#10B981'; // Verde
    if (factura.estado_validacion === 'requiere_revision') return '#F59E0B'; // Amarillo
    if (factura.estado_validacion === 'error') return '#EF4444'; // Rojo
    return '#9CA3AF'; // Gris (pendiente)
  };

  const getEstadoIcon = (factura: Registro606) => {
    if (factura.estado_validacion === 'valido') return '✓';
    if (factura.estado_validacion === 'requiere_revision') return '⚠️';
    if (factura.estado_validacion === 'error') return '❌';
    return '○';
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return '-';
    // Formato YYYYMMDD -> DD/MM/YYYY
    if (fecha.length === 8) {
      return `${fecha.substring(6, 8)}/${fecha.substring(4, 6)}/${fecha.substring(0, 4)}`;
    }
    return fecha;
  };

  if (facturas.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ marginBottom: '1.5rem', opacity: 0.3 }}
        >
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem',
          }}
        >
          No hay facturas cargadas
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Carga facturas para comenzar a generar el reporte 606 del período
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Resumen superior */}
      <div
        style={{
          padding: '1rem 1.5rem',
          background: '#F9FAFB',
          borderBottom: '2px solid var(--color-border)',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            TOTAL FACTURAS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {resumen.total_facturas}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            MONTO FACTURADO
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            RD$ {formatearMoneda(resumen.total_monto_facturado)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            ITBIS FACTURADO
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>
            RD$ {formatearMoneda(resumen.total_itbis_facturado)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            ITBIS POR ADELANTAR
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>
            RD$ {formatearMoneda(resumen.total_itbis_adelantar)}
          </div>
        </div>
        {resumen.facturas_pendientes_revision > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              REQUIEREN REVISIÓN
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>
              {resumen.facturas_pendientes_revision}
            </div>
          </div>
        )}
      </div>

      {/* Tabla con scroll horizontal */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8rem',
            minWidth: '3000px',
          }}
        >
          <thead>
            <tr style={{ background: '#F3F4F6', borderBottom: '2px solid var(--color-border)' }}>
              <th style={estiloHeader}>#</th>
              <th style={estiloHeader}>Estado</th>
              <th style={estiloHeader}>RNC/Céd</th>
              <th style={estiloHeader}>Razón Social</th>
              <th style={estiloHeader}>Tipo ID</th>
              <th style={estiloHeader}>Tipo B/S</th>
              <th style={estiloHeader}>NCF</th>
              <th style={estiloHeader}>NCF Modif</th>
              <th style={estiloHeader}>Fecha Comp.</th>
              <th style={estiloHeader}>Fecha Pago</th>
              <th style={estiloHeader}>Monto Servicios</th>
              <th style={estiloHeader}>Monto Bienes</th>
              <th style={estiloHeader}>Total Facturado</th>
              <th style={estiloHeader}>ITBIS Fact</th>
              <th style={estiloHeader}>ITBIS Ret</th>
              <th style={estiloHeader}>ITBIS Prop</th>
              <th style={estiloHeader}>ITBIS Costo</th>
              <th style={estiloHeader}>ITBIS Adel</th>
              <th style={estiloHeader}>ITBIS Perc</th>
              <th style={estiloHeader}>Tipo Ret ISR</th>
              <th style={estiloHeader}>ISR Ret</th>
              <th style={estiloHeader}>ISR Perc</th>
              <th style={estiloHeader}>ISC</th>
              <th style={estiloHeader}>Otros Imp</th>
              <th style={estiloHeader}>Propina</th>
              <th style={estiloHeader}>Forma Pago</th>
              <th style={{ ...estiloHeader, width: '60px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((factura, indice) => (
              <tr
                key={factura.id}
                onClick={() => handleClickFila(indice)}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid #E5E7EB',
                  background: 'white',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                <td style={estiloCelda}>{indice + 1}</td>
                <td style={estiloCelda}>
                  <span
                    style={{
                      fontSize: '1.2rem',
                      color: getEstadoColor(factura),
                    }}
                    title={factura.estado_validacion}
                  >
                    {getEstadoIcon(factura)}
                  </span>
                </td>
                <td style={estiloCelda}>{factura.rnc_cedula || '-'}</td>
                <td style={{ ...estiloCelda, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {factura.razon_social_proveedor || '-'}
                </td>
                <td style={estiloCelda}>{factura.tipo_identificacion || '-'}</td>
                <td style={estiloCelda}>{factura.tipo_bienes_servicios || '-'}</td>
                <td style={estiloCelda}>{factura.ncf || '-'}</td>
                <td style={estiloCelda}>{factura.ncf_modificado || '-'}</td>
                <td style={estiloCelda}>{formatearFecha(factura.fecha_comprobante)}</td>
                <td style={estiloCelda}>{formatearFecha(factura.fecha_pago)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.monto_facturado_servicios || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.monto_facturado_bienes || 0)}</td>
                <td style={{ ...estiloCeldaMonto, fontWeight: 600 }}>
                  {formatearMoneda(factura.total_monto_facturado || 0)}
                </td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.itbis_facturado || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.itbis_retenido || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.itbis_proporcionalidad || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.itbis_costo || 0)}</td>
                <td style={{ ...estiloCeldaMonto, color: '#10B981', fontWeight: 600 }}>
                  {formatearMoneda(factura.itbis_adelantar || 0)}
                </td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.itbis_percibido || 0)}</td>
                <td style={estiloCelda}>{factura.tipo_retencion_isr || '-'}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.monto_retencion_renta || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.isr_percibido || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.impuesto_selectivo_consumo || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.otros_impuestos || 0)}</td>
                <td style={estiloCeldaMonto}>{formatearMoneda(factura.monto_propina_legal || 0)}</td>
                <td style={estiloCelda}>{factura.forma_pago || '-'}</td>
                <td style={{ ...estiloCelda, textAlign: 'center' }}>
                  <button
                    onClick={(e) => handleEliminar(e, factura)}
                    title="Eliminar factura"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: '#EF4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F3F4F6', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
              <td colSpan={10} style={{ ...estiloCelda, textAlign: 'right' }}>
                TOTALES:
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(
                  facturas.reduce((sum, f) => sum + (f.monto_facturado_servicios || 0), 0)
                )}
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.monto_facturado_bienes || 0), 0))}
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.total_monto_facturado || 0), 0))}
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.itbis_facturado || 0), 0))}
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.itbis_retenido || 0), 0))}
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.itbis_proporcionalidad || 0), 0))}
              </td>
              <td style={estiloCeldaMonto}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.itbis_costo || 0), 0))}
              </td>
              <td style={{ ...estiloCeldaMonto, color: '#10B981' }}>
                {formatearMoneda(facturas.reduce((sum, f) => sum + (f.itbis_adelantar || 0), 0))}
              </td>
              <td colSpan={9}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const estiloHeader: React.CSSProperties = {
  padding: '0.75rem 0.5rem',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  textTransform: 'uppercase',
  borderRight: '1px solid #E5E7EB',
  position: 'sticky',
  top: 0,
  background: '#F3F4F6',
  zIndex: 10,
};

const estiloCelda: React.CSSProperties = {
  padding: '0.75rem 0.5rem',
  borderRight: '1px solid #E5E7EB',
  color: 'var(--color-text-primary)',
};

const estiloCeldaMonto: React.CSSProperties = {
  ...estiloCelda,
  textAlign: 'right',
  fontFamily: 'monospace',
};
