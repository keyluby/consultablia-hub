import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Helper to generate a dummy e-NCF for the demo
const generateNCF = (tipo: number) => {
  const random = Math.floor(Math.random() * 90000000) + 10000000;
  return `E${tipo}${random}`;
};

interface Item {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoItbis: number;
}

const ECF_TYPES = [
  { value: 31, label: 'e-CF (31) Factura de Crédito Fiscal' },
  { value: 32, label: 'e-CF (32) Factura de Consumo' },
  { value: 34, label: 'e-CF (34) Nota de Crédito' },
];

export default function EmitirForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tipoEcf, setTipoEcf] = useState(31);
  const [rncComprador, setRncComprador] = useState('');
  const [razonSocialComprador, setRazonSocialComprador] = useState('');
  const [items, setItems] = useState<Item[]>([
    { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0, tipoItbis: 1 }
  ]);

  const addItem = () =>
    setItems([...items, { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0, tipoItbis: 1 }]);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getItemSubtotal = (item: Item) => {
    const base = (item.cantidad * item.precioUnitario) - item.descuento;
    const itbis = item.tipoItbis === 1 ? base * 0.18 : item.tipoItbis === 2 ? base * 0.16 : 0;
    return base + itbis;
  };

  const totalFacturado = items.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  const totalItbis = items.reduce((acc, item) => {
    const base = (item.cantidad * item.precioUnitario) - item.descuento;
    return acc + (item.tipoItbis === 1 ? base * 0.18 : item.tipoItbis === 2 ? base * 0.16 : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Iniciando emisión de e-CF...', { tipoEcf, rncComprador, itemsCount: items.length });

      // 1. Insertar Factura
      console.log('1. Insertando factura en tabla "invoices"...');
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          e_ncf: generateNCF(tipoEcf),
          tipo_ecf: tipoEcf,
          total_facturado: totalFacturado,
          rnc_comprador: rncComprador,
          razon_social_comprador: razonSocialComprador,
          estado_dgii: 'PENDIENTE'
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Error insertando factura:', invoiceError);
        throw invoiceError;
      }
      console.log('Factura insertada:', invoiceData);

      // 2. Insertar Ítems
      console.log('2. Insertando ítems...');
      const itemsToInsert = items.map(item => ({
        invoice_id: invoiceData.id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        descuento: item.descuento,
        tipo_itbis: item.tipoItbis
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error insertando ítems:', itemsError);
        throw itemsError;
      }
      console.log('Ítems insertados con éxito.');

      // 3. (Opcional) Llamar a la Edge Function
      console.log('3. Invocando Edge Function "process-ecf"...');
      try {
        const { error: funcInvokeError } = await supabase.functions.invoke('process-ecf', {
          body: { invoiceId: invoiceData.id }
        });
        if (funcInvokeError) {
          console.warn('La firma falló (pero la factura se guardó):', funcInvokeError);
        } else {
          console.log('Edge Function ejecutada correctamente.');
        }
      } catch (funcErr: any) {
        console.warn('Excepción al llamar a la Edge Function:', funcErr);
        // No lanzamos este error para no bloquear el éxito de la DB
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err: any) {
      console.error('Error crítico al emitir e-CF:', err);

      let friendlyMessage = err.message || 'Error inesperado al conectar con Supabase.';

      if (friendlyMessage.includes('Failed to fetch')) {
        friendlyMessage = 'ERROR DE CONEXIÓN: No se pudo conectar con Supabase. Verifica tu conexión a internet o que la URL de Supabase sea correcta.';
      }

      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--color-text-secondary)', marginBottom: '0.375rem',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <div style={{
            background: 'var(--color-danger-soft)', borderRadius: '10px',
            padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
            border: '1px solid #FECACA',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: '0.875rem', color: '#991B1B', margin: 0 }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="fade-in" style={{
            background: 'var(--color-success-soft)', borderRadius: '10px',
            padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
            border: '1px solid #A7F3D0',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p style={{ fontSize: '0.875rem', color: '#065F46', margin: 0 }}>¡Comprobante emitido con éxito! Redirigiendo al panel...</p>
          </div>
        )}

        {/* General Data */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Datos Generales
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Tipo de e-CF</label>
              <select
                value={tipoEcf}
                onChange={e => setTipoEcf(Number(e.target.value))}
                className="input-field"
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                {ECF_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>RNC/Cédula Comprador</label>
              <input
                type="text"
                value={rncComprador}
                onChange={e => setRncComprador(e.target.value)}
                placeholder="131652399"
                className="input-field"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Razón Social Comprador</label>
              <input
                type="text"
                value={razonSocialComprador}
                onChange={e => setRazonSocialComprador(e.target.value)}
                placeholder="Nombre de la empresa o persona"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              Ítems de Factura
            </h3>
            <button type="button" onClick={addItem} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Añadir Ítem
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr auto',
            gap: '0.75rem', marginBottom: '0.5rem', padding: '0 0.5rem',
          }}>
            {['Descripción', 'Cantidad', 'Precio Unit.', 'ITBIS', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {h}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((item, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1.5fr 1fr auto',
                gap: '0.75rem', alignItems: 'center',
                background: '#F9FAFB', borderRadius: '10px', padding: '0.625rem 0.75rem',
                border: '1px solid transparent',
                transition: 'border-color 0.15s',
              }}>
                <input
                  type="text"
                  required
                  value={item.descripcion}
                  onChange={e => updateItem(index, 'descripcion', e.target.value)}
                  placeholder="Ej. Servicio de consultoría"
                  className="input-field"
                  style={{ background: '#fff' }}
                />
                <input
                  type="number"
                  min="1"
                  required
                  value={item.cantidad}
                  onChange={e => updateItem(index, 'cantidad', parseFloat(e.target.value))}
                  className="input-field"
                  style={{ background: '#fff' }}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={item.precioUnitario}
                  onChange={e => updateItem(index, 'precioUnitario', parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="input-field"
                  style={{ background: '#fff' }}
                />
                <select
                  value={item.tipoItbis}
                  onChange={e => updateItem(index, 'tipoItbis', parseInt(e.target.value))}
                  className="input-field"
                  style={{ background: '#fff', cursor: 'pointer' }}
                >
                  <option value={1}>18%</option>
                  <option value={2}>16%</option>
                  <option value={3}>Exento</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: 'none', background: 'transparent', cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                    color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: items.length === 1 ? 0.3 : 1, transition: 'all 0.15s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + Actions */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>ITBIS Total</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  RD$ {totalItbis.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Total a Pagar</p>
                <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
                  RD$ {totalFacturado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => navigate('/')} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary" style={{ minWidth: '160px' }}>
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Emitiendo...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Emitir e-CF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
