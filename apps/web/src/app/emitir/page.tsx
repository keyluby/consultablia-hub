'use client';

import EmitirForm from "@/components/EmitirForm";
import Link from "next/link";

export default function EmitirPage() {
    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Link href="/" style={{
                            fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            transition: 'color 0.15s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Panel
                        </Link>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nuevo e-CF</span>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        Emitir Nuevo e-CF
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Complete los detalles. El XML será generado y firmado automáticamente.
                    </p>
                </div>
            </div>

            <EmitirForm />
        </div>
    );
}
