'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ECF {
    id: string;
    eNcf: string;
    tipoEcf: number;
    fechaEmision: string;
    totalFacturado: number;
    estadoDgii: string;
    createdAt: string;
}

const ECF_TYPE_LABELS: Record<number, string> = {
    31: 'Factura Crédito Fiscal',
    32: 'Factura de Consumo',
    33: 'Nota de Débito',
    34: 'Nota de Crédito',
};

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        PENDIENTE: { label: 'En Cola', className: 'badge badge-pending' },
        PROCESANDO: { label: 'Procesando', className: 'badge badge-info' },
        APROBADO: { label: 'Aprobado', className: 'badge badge-success' },
        RECHAZADO: { label: 'Rechazado', className: 'badge badge-danger' },
    };
    const entry = map[status] ?? { label: status, className: 'badge' };
    return <span className={entry.className}>{entry.label}</span>;
}

function SkeletonRow() {
    return (
        <tr>
            {[1, 2, 3, 4, 5].map(i => (
                <td key={i} style={{ padding: '1rem 1.25rem' }}>
                    <div className="skeleton" style={{ height: '14px', width: i === 1 ? '100px' : i === 5 ? '70px' : '80px' }} />
                </td>
            ))}
        </tr>
    );
}

export default function InvoicesTable() {
    const [invoices, setInvoices] = useState<ECF[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInvoices = async () => {
        try {
            const res = await fetch('http://localhost:3002/api/v1/ecf?tenantId=b0a8c2f1-9d3e-4f5a-8b1c-7e6d5f4a3b2c', {
                headers: { 'x-tenant-id': 'b0a8c2f1-9d3e-4f5a-8b1c-7e6d5f4a3b2c' }
            });
            if (!res.ok) throw new Error('No se pudo cargar los comprobantes.');
            const data = await res.json();
            setInvoices(data.data ?? []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();

        const ws = new WebSocket('ws://localhost:3002/api/v1/ecf/stream');
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'ECF_STATUS_UPDATE' && message.data) {
                    const { ecfId, estadoDgii } = message.data;
                    setInvoices((prev) =>
                        prev.map(inv => inv.id === ecfId ? { ...inv, estadoDgii } : inv)
                    );
                }
            } catch (e) { /* ignore */ }
        };

        return () => ws.close();
    }, []);

    return (
        <div className="card fade-in" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                        Comprobantes Emitidos
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {loading ? '—' : `${invoices.length} comprobante${invoices.length !== 1 ? 's' : ''} registrado${invoices.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/emitir" className="btn-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Nuevo e-CF
                    </Link>
                    <button className="btn-ghost" onClick={fetchInvoices} title="Actualizar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F9FAFB' }}>
                            {['No. Comprobante', 'Tipo', 'Monto (DOP)', 'Estado', 'Fecha Emisión'].map(h => (
                                <th key={h} style={{
                                    padding: '0.75rem 1.25rem', textAlign: 'left',
                                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)',
                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                    borderBottom: '1px solid var(--color-border)',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && [1, 2, 3].map(i => <SkeletonRow key={i} />)}

                        {!loading && error && (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{
                                        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                        color: 'var(--color-danger)',
                                    }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span style={{ fontSize: '0.875rem' }}>{error}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Verifica que los servicios estén corriendo.</span>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!loading && !error && invoices.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-accent-soft)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)',
                                        }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                        </div>
                                        <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Sin comprobantes</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Emite tu primer e-CF para verlo aquí.</p>
                                        <Link href="/emitir" className="btn-primary" style={{ marginTop: '0.25rem' }}>
                                            + Emitir e-CF
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!loading && !error && invoices.map((invoice, i) => (
                            <tr key={invoice.id} style={{
                                borderBottom: i < invoices.length - 1 ? '1px solid var(--color-border)' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <td style={{ padding: '1rem 1.25rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-accent-hover)' }}>
                                        {invoice.eNcf}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {ECF_TYPE_LABELS[invoice.tipoEcf] ?? `Tipo ${invoice.tipoEcf}`}
                                </td>
                                <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    RD$ {invoice.totalFacturado?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '1rem 1.25rem' }}>
                                    <StatusBadge status={invoice.estadoDgii} />
                                </td>
                                <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {new Date(invoice.fechaEmision).toLocaleDateString('es-DO', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
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
