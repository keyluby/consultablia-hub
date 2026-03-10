import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InvoicesTable from '../components/InvoicesTable';
import { supabase } from '@/integrations/supabase/client';

export default function Panel() {
  const [stats, setStats] = useState({ total: 0, count: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from('invoices').select('total_facturado, estado_dgii');
      if (error) throw error;

      if (data) {
        const total = data.reduce((acc, inv) => acc + (inv.total_facturado || 0), 0);
        const pending = data.filter(inv => inv.estado_dgii === 'PENDIENTE').length;
        const approved = data.filter(inv => inv.estado_dgii === 'APROBADO').length;
        setStats({ total, count: data.length, pending, approved });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Real-time listener for stats update
    const channel = supabase
      .channel('panel-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Panel Principal
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>
            Resumen de comprobantes fiscales electrónicos
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/emitir" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo e-CF
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card shadow-sm border border-slate-200" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Facturado</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            RD$ {loading ? '...' : stats.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card shadow-sm border border-slate-200" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>e-CF Emitidos</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>{loading ? '...' : stats.count}</p>
            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Total</span>
          </div>
        </div>
        <div className="card shadow-sm border border-slate-200" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pendientes DGII</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', margin: 0 }}>{loading ? '...' : stats.pending}</p>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>En espera</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <InvoicesTable />
    </div>
  );
}
