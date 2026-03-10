import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ECF {
    id: string;
    eNcf: string;
    tipoEcf: number;
    fechaEmision: string;
    totalFacturado: number;
    estadoDgii: string;
}

const ECF_TYPE_LABELS: Record<number, string> = {
    31: 'Factura Crédito Fiscal',
    32: 'Factura de Consumo',
    33: 'Nota de Débito',
    34: 'Nota de Crédito',
};

const MOCK_INVOICES: ECF[] = [
    { id: '1', eNcf: 'E31000000001', tipoEcf: 31, fechaEmision: new Date().toISOString(), totalFacturado: 15400.50, estadoDgii: 'APROBADO' },
    { id: '2', eNcf: 'E32000000002', tipoEcf: 32, fechaEmision: new Date(Date.now() - 86400000).toISOString(), totalFacturado: 2350.00, estadoDgii: 'APROBADO' },
    { id: '3', eNcf: 'E31000000003', tipoEcf: 31, fechaEmision: new Date(Date.now() - 172800000).toISOString(), totalFacturado: 8900.25, estadoDgii: 'PENDIENTE' },
    { id: '4', eNcf: 'E34000000001', tipoEcf: 34, fechaEmision: new Date(Date.now() - 259200000).toISOString(), totalFacturado: 500.00, estadoDgii: 'RECHAZADO' },
    { id: '5', eNcf: 'E31000000004', tipoEcf: 31, fechaEmision: new Date(Date.now() - 345600000).toISOString(), totalFacturado: 45000.00, estadoDgii: 'PROCESANDO' },
];

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        PENDIENTE: { label: 'En Cola', className: 'badge badge-pending' },
        PROCESANDO: { label: 'Procesando', className: 'badge badge-warning' },
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
                    <div className="skeleton" style={{ height: '14px', width: i === 1 ? '100px' : i === 5 ? '70px' : '80px', background: '#E2E8F0', borderRadius: '4px' }} />
                </td>
            ))}
        </tr>
    );
}

export default function InvoicesTable() {
    const [invoices, setInvoices] = useState<ECF[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMockData = () => {
        setLoading(true);
        setTimeout(() => {
            setInvoices(MOCK_INVOICES);
            setLoading(false);
        }, 1500); // simulate network delay
    };

    useEffect(() => {
        loadMockData();
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
                    <Link to="/emitir" className="btn-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Nuevo e-CF
                    </Link>
                    <button className="btn-secondary" onClick={loadMockData} title="Actualizar">
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
                        {loading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}

                        {!loading && invoices.length === 0 && (
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
                                        <Link to="/emitir" className="btn-primary" style={{ marginTop: '0.25rem' }}>
                                            + Emitir e-CF
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!loading && invoices.map((invoice, i) => (
                            <tr key={invoice.id} style={{
                                borderBottom: i < invoices.length - 1 ? '1px solid var(--color-border)' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <td style={{ padding: '1rem 1.25rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-accent)' }}>
                                        {invoice.eNcf}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
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
