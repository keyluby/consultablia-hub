import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Tipos para el formato 606 expandido
interface ExtractedData606 {
  // Datos básicos del emisor
  rnc_emisor?: string;
  razon_social_emisor?: string;

  // Datos del comprador
  rnc_comprador?: string;
  razon_social_comprador?: string;

  // Datos del comprobante
  ncf?: string;
  fecha_comprobante?: string;
  fecha_pago?: string;

  // Clasificación
  tipo_gasto?: 'servicios' | 'bienes' | 'mixto';

  // Montos desglosados
  monto_facturado?: number;
  itbis_facturado?: number;
  itbis_retenido?: number;
  isr_retenido?: number;
  propina_legal?: number;
  total?: number;

  // Niveles de confianza (0-100)
  confidence?: {
    rnc_emisor?: number;
    rnc_comprador?: number;
    ncf?: number;
    total?: number;
    itbis_facturado?: number;
    fecha_comprobante?: number;
  };
}

export default function EscanearPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para el zoom del visor
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [extracted, setExtracted] = useState<ExtractedData606 | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/') && !selected.type.includes('pdf')) {
      setError('Por favor sube una imagen (JPG, PNG) o PDF.');
      return;
    }

    setPreview(URL.createObjectURL(selected));
    setError('');
    setExtracted(null);

    await processImage(selected);
  };

  const processImage = async (imageFile: File) => {
    setLoading(true);
    setError('');

    try {
      // 1. Subir la imagen a Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `scans/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoice-scans')
        .upload(filePath, imageFile);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('El bucket "invoice-scans" no existe. Por favor créalo en tu Storage de Supabase.');
        }
        throw uploadError;
      }

      // 2. Llamar a la Edge Function con formato 606 expandido
      console.log('Invocando OCR Processor para:', uploadData.path);
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-processor', {
        body: { storagePath: uploadData.path }
      });

      if (ocrError) throw ocrError;

      console.log('Datos extraídos por IA:', ocrData);
      setExtracted(ocrData);

    } catch (err: any) {
      console.error('Error procesando imagen:', err);
      setError(err.message || 'Error al procesar la imagen con OCR.');
    } finally {
      setLoading(false);
    }
  };

  // Funciones del visor de imágenes con zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.type.startsWith('image/') || dropped.type.includes('pdf'))) {
      setPreview(URL.createObjectURL(dropped));
      setError('');
      setExtracted(null);
      await processImage(dropped);
    } else {
      setError('Solo se permiten imágenes o PDFs.');
    }
  };

  return (
    <div className="fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Link to="/" style={{
            fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Panel
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Revisión de Facturas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Interfaz de Revisión 606
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Doble panel profesional para verificación de comprobantes fiscales
            </p>
          </div>

          {/* Botón para subir nueva factura */}
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Cargar Factura
          </button>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Split Panel Layout */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PanelGroup direction="horizontal">
          {/* Panel Izquierdo: Visor de Factura */}
          <Panel defaultSize={50} minSize={30}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: '#F9FAFB',
              borderRight: '1px solid var(--color-border)',
            }}>
              {/* Toolbar del visor */}
              {preview && (
                <div style={{
                  padding: '0.75rem 1.5rem',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Factura Escaneada
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={handleZoomOut}
                      style={{
                        padding: '0.4rem 0.6rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', minWidth: '50px', textAlign: 'center' }}>
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      style={{
                        padding: '0.4rem 0.6rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </button>
                    <button
                      onClick={handleResetZoom}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              )}

              {/* Área del visor */}
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!preview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '20px',
                      background: 'var(--color-accent-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent)',
                      margin: '0 auto 1.5rem',
                    }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
                      Arrastra una factura aquí
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      o haz clic en "Cargar Factura" arriba
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                      Soporta: JPG, PNG, PDF
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      cursor: zoom > 1 ? 'grab' : 'default',
                      userSelect: 'none',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={preview}
                      alt="Factura"
                      draggable={false}
                      style={{
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                        transformOrigin: 'center',
                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'block',
                        margin: 'auto',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Error en el visor */}
              {error && (
                <div style={{
                  margin: '1rem',
                  background: 'var(--color-danger-soft)',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  fontSize: '0.875rem',
                  color: '#991B1B',
                }}>
                  {error}
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle style={{
            width: '4px',
            background: 'var(--color-border)',
            cursor: 'col-resize',
            transition: 'background 0.2s',
          }} />

          {/* Panel Derecho: Formulario 606 */}
          <Panel defaultSize={50} minSize={30}>
            <div style={{
              height: '100%',
              overflow: 'auto',
              background: 'white',
            }}>
              <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
                    Formato 606 - Compras
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Verifica y edita los datos extraídos por la IA
                  </p>
                </div>

                {loading ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                    </svg>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
                        Analizando factura con IA
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        Extrayendo datos del formato 606...
                      </p>
                    </div>
                  </div>
                ) : extracted ? (
                  <div className="fade-in">
                    {/* Sección: Datos del Emisor */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Datos del Emisor
                      </h3>
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <FieldWithConfidence
                          label="RNC Emisor"
                          value={extracted.rnc_emisor || ''}
                          onChange={(v) => setExtracted({ ...extracted, rnc_emisor: v })}
                          confidence={extracted.confidence?.rnc_emisor}
                        />
                        <FieldWithConfidence
                          label="Razón Social Emisor"
                          value={extracted.razon_social_emisor || ''}
                          onChange={(v) => setExtracted({ ...extracted, razon_social_emisor: v })}
                          confidence={undefined}
                        />
                      </div>
                    </div>

                    {/* Sección: Datos del Comprador */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Datos del Comprador
                      </h3>
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <FieldWithConfidence
                          label="RNC/Cédula Comprador"
                          value={extracted.rnc_comprador || ''}
                          onChange={(v) => setExtracted({ ...extracted, rnc_comprador: v })}
                          confidence={extracted.confidence?.rnc_comprador}
                        />
                        <FieldWithConfidence
                          label="Razón Social Comprador"
                          value={extracted.razon_social_comprador || ''}
                          onChange={(v) => setExtracted({ ...extracted, razon_social_comprador: v })}
                          confidence={undefined}
                        />
                      </div>
                    </div>

                    {/* Sección: Comprobante */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Datos del Comprobante
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FieldWithConfidence
                          label="NCF"
                          value={extracted.ncf || ''}
                          onChange={(v) => setExtracted({ ...extracted, ncf: v })}
                          confidence={extracted.confidence?.ncf}
                        />
                        <FieldWithConfidence
                          label="Fecha Comprobante"
                          value={extracted.fecha_comprobante || ''}
                          onChange={(v) => setExtracted({ ...extracted, fecha_comprobante: v })}
                          confidence={extracted.confidence?.fecha_comprobante}
                          type="date"
                        />
                        <FieldWithConfidence
                          label="Fecha de Pago"
                          value={extracted.fecha_pago || ''}
                          onChange={(v) => setExtracted({ ...extracted, fecha_pago: v })}
                          confidence={undefined}
                          type="date"
                        />
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                          }}>
                            Tipo de Gasto
                          </label>
                          <select
                            className="input-field"
                            value={extracted.tipo_gasto || 'servicios'}
                            onChange={(e) => setExtracted({ ...extracted, tipo_gasto: e.target.value as any })}
                          >
                            <option value="servicios">Servicios</option>
                            <option value="bienes">Bienes</option>
                            <option value="mixto">Mixto</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Sección: Montos */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Montos (RD$)
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FieldWithConfidence
                          label="Monto Facturado"
                          value={extracted.monto_facturado?.toString() || ''}
                          onChange={(v) => setExtracted({ ...extracted, monto_facturado: parseFloat(v) || 0 })}
                          confidence={undefined}
                          type="number"
                        />
                        <FieldWithConfidence
                          label="ITBIS Facturado"
                          value={extracted.itbis_facturado?.toString() || ''}
                          onChange={(v) => setExtracted({ ...extracted, itbis_facturado: parseFloat(v) || 0 })}
                          confidence={extracted.confidence?.itbis_facturado}
                          type="number"
                        />
                        <FieldWithConfidence
                          label="ITBIS Retenido"
                          value={extracted.itbis_retenido?.toString() || ''}
                          onChange={(v) => setExtracted({ ...extracted, itbis_retenido: parseFloat(v) || 0 })}
                          confidence={undefined}
                          type="number"
                        />
                        <FieldWithConfidence
                          label="ISR Retenido"
                          value={extracted.isr_retenido?.toString() || ''}
                          onChange={(v) => setExtracted({ ...extracted, isr_retenido: parseFloat(v) || 0 })}
                          confidence={undefined}
                          type="number"
                        />
                        <FieldWithConfidence
                          label="Propina Legal (10%)"
                          value={extracted.propina_legal?.toString() || ''}
                          onChange={(v) => setExtracted({ ...extracted, propina_legal: parseFloat(v) || 0 })}
                          confidence={undefined}
                          type="number"
                        />
                        <FieldWithConfidence
                          label="Total a Pagar"
                          value={extracted.total?.toString() || ''}
                          onChange={(v) => setExtracted({ ...extracted, total: parseFloat(v) || 0 })}
                          confidence={extracted.confidence?.total}
                          type="number"
                          highlighted
                        />
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      paddingTop: '2rem',
                      borderTop: '2px solid var(--color-border)',
                    }}>
                      <button
                        className="btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setPreview('');
                          setExtracted(null);
                          setZoom(1);
                          setPosition({ x: 0, y: 0 });
                        }}
                      >
                        Limpiar Todo
                      </button>
                      <button
                        className="btn-primary"
                        style={{ flex: 2 }}
                        onClick={() => {
                          navigate('/emitir', {
                            state: {
                              prefilledData: {
                                rncComprador: extracted.rnc_comprador || '',
                                razonSocialComprador: extracted.razon_social_comprador || '',
                                total: extracted.total || 0,
                                itbis: extracted.itbis_facturado || 0,
                              },
                            },
                          });
                        }}
                      >
                        Guardar y Generar e-CF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                  }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1.5rem', opacity: 0.3 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
                      Sin factura cargada
                    </h3>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      Carga una factura para comenzar a extraer los datos del formato 606
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Componente auxiliar para campos con indicador de confianza
function FieldWithConfidence({
  label,
  value,
  onChange,
  confidence,
  type = 'text',
  highlighted = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  confidence?: number;
  type?: 'text' | 'number' | 'date';
  highlighted?: boolean;
}) {
  const getConfidenceColor = (conf?: number): string => {
    if (!conf) return '#E5E7EB';
    if (conf >= 85) return '#10B981';
    if (conf >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getConfidenceLabel = (conf?: number): string => {
    if (!conf) return 'Sin validar';
    if (conf >= 85) return `Alta confianza (${conf}%)`;
    if (conf >= 60) return `Revisar (${conf}%)`;
    return `Verificar manualmente (${conf}%)`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
        {confidence !== undefined && (
          <span
            title={getConfidenceLabel(confidence)}
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: getConfidenceColor(confidence),
              background: `${getConfidenceColor(confidence)}15`,
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: getConfidenceColor(confidence),
              }}
            />
            {confidence >= 85 ? 'OK' : confidence >= 60 ? 'REVISAR' : 'VERIFICAR'}
          </span>
        )}
      </div>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={type === 'date' ? 'YYYY-MM-DD' : 'No detectado'}
        style={{
          borderColor: confidence !== undefined ? getConfidenceColor(confidence) : undefined,
          borderWidth: confidence !== undefined ? '2px' : '1px',
          fontWeight: highlighted ? 600 : 400,
          fontSize: highlighted ? '1.125rem' : '0.875rem',
        }}
      />
    </div>
  );
}
