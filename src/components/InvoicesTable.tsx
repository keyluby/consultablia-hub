import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ECF {
  id: string;
  e_ncf: string;
  tipo_ecf: number;
  fecha_emision: string;
  total_facturado: number;
  estado_dgii: string;
}

const ECF_TYPE_LABELS: Record<number, string> = {
  31: 'Factura Crédito Fiscal',
  32: 'Factura de Consumo',
  33: 'Nota de Débito',
  34: 'Nota de Crédito',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDIENTE: { label: 'En Cola', className: 'badge bg-slate-100 text-slate-600' },
    PROCESANDO: { label: 'Procesando', className: 'badge bg-amber-50 text-amber-600 border-amber-100' },
    APROBADO: { label: 'Aprobado', className: 'badge bg-emerald-50 text-emerald-600 border-emerald-100' },
    RECHAZADO: { label: 'Rechazado', className: 'badge bg-rose-50 text-rose-600 border-rose-100' },
  };
  const entry = map[status] ?? { label: status, className: 'badge font-medium' };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${entry.className}`}>{entry.label}</span>;
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} style={{ padding: '1rem 1.25rem' }}>
          <div className="animate-pulse" style={{ height: '14px', width: i === 1 ? '100px' : i === 5 ? '70px' : '80px', background: '#E2E8F0', borderRadius: '4px' }} />
        </td>
      ))}
    </tr>
  );
}

export default function InvoicesTable() {
  const [invoices, setInvoices] = useState<ECF[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRealData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();

    // Suscripción Real-time
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        () => {
          loadRealData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="card fade-in border border-slate-200 shadow-sm" style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            Comprobantes Emitidos
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
            {loading ? 'Sincronizando...' : `${invoices.length} comprobante${invoices.length !== 1 ? 's' : ''} registrado${invoices.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/emitir" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.375rem' }}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo e-CF
          </Link>
          <button className="btn-secondary" onClick={loadRealData} title="Cargar de nuevo" style={{ padding: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['No. Comprobante', 'Tipo', 'Monto (DOP)', 'Estado', 'Fecha Emisión'].map(h => (
                <th key={h} style={{
                  padding: '0.75rem 1.25rem', textAlign: 'left',
                  fontSize: '0.7rem', fontWeight: 700, color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #F1F5F9',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && invoices.length === 0 && [1, 2, 3].map(i => <SkeletonRow key={i} />)}

            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>Sin facturas reales</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Los comprobantes emitidos desde Supabase aparecerán aquí.</p>
                  </div>
                </td>
              </tr>
            )}

            {invoices.map((invoice, i) => (
              <tr key={invoice.id} style={{
                borderBottom: i < invoices.length - 1 ? '1px solid #F1F5F9' : 'none',
                transition: 'background 0.15s',
              }}
                className="hover:bg-slate-50"
              >
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: '#3A57E8' }}>
                    {invoice.e_ncf}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#64748B' }}>
                  {ECF_TYPE_LABELS[invoice.tipo_ecf] ?? `Tipo ${invoice.tipo_ecf}`}
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                  RD$ {invoice.total_facturado?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <StatusBadge status={invoice.estado_dgii} />
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#64748B' }}>
                  {new Date(invoice.fecha_emision).toLocaleDateString('es-DO', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
