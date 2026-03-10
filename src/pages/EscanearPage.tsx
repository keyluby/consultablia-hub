import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function EscanearPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [extracted, setExtracted] = useState<{
    rnc_comprador?: string;
    ncf?: string;
    total_facturado?: number;
    itbis?: number;
    raw_text?: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Por favor sube una imagen (JPG, PNG).');
      return;
    }

    setFile(selected);
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

      // 2. Llamar a la Edge Function (Simulado por ahora hasta que el usuario le inyecte el API Key de GPT-4o o Vision)
      // Nota: Aquí invocaríamos la función 'ocr-processor'
      // const { data, error: functionError } = await supabase.functions.invoke('ocr-processor', { body: { path: filePath } });

      console.log('Invocando OCR Processor para:', uploadData.path);
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-processor', {
        body: { storagePath: uploadData.path }
      });

      if (ocrError) throw ocrError;

      console.log('Datos extraídos por IA:', ocrData);
      setExtracted(ocrData);
      // setStep(3); // No 'step' state in original code

    } catch (err: any) {
      console.error('Error procesando imagen:', err);
      setError(err.message || 'Error al procesar la imagen con OCR.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
      setError('');
      setExtracted(null);
      await processImage(dropped);
    } else {
      setError('Solo se permiten imágenes.');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Escanear e-CF</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Escanear Factura con OCR
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Sube una foto de una factura física. La IA extraerá los datos y generará el e-CF.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Left Col: Upload Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            className="card"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '3rem 2rem',
              border: '2px dashed var(--color-border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', textAlign: 'center',
              background: '#FAFAFA',
              transition: 'all 0.2s',
              minHeight: '300px'
            }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {!preview ? (
              <>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)',
                  marginBottom: '1rem'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
                  Sube o arrastra una imagen
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  PNG, JPG. Máx 5MB.
                </p>
              </>
            ) : (
              <img src={preview} alt="Factura a escanear" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'contain' }} />
            )}
          </div>

          {error && (
            <div style={{
              background: 'var(--color-danger-soft)', borderRadius: '10px',
              padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              border: '1px solid #FECACA',
            }}>
              <span style={{ fontSize: '0.875rem', color: '#991B1B' }}>{error}</span>
            </div>
          )}
        </div>

        {/* Right Col: Extracted Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1.5rem' }}>
              Datos Extraídos (IA Vision)
            </h3>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>Analizando factura...</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Procesando con GPT-4o Vision API...</p>
                </div>
              </div>
            ) : extracted ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      RNC Comprador
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={extracted.rnc_comprador || ''}
                      onChange={e => setExtracted({ ...extracted, rnc_comprador: e.target.value })}
                      placeholder="No detectado"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      NCF Original (Si aplica)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={extracted.ncf || ''}
                      onChange={e => setExtracted({ ...extracted, ncf: e.target.value })}
                      placeholder="No detectado"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      ITBIS (RD$)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={extracted.itbis || ''}
                      onChange={e => setExtracted({ ...extracted, itbis: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Total Facturado (RD$)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}
                      value={extracted.total_facturado || ''}
                      onChange={e => setExtracted({ ...extracted, total_facturado: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setFile(null); setPreview(''); setExtracted(null); }}>
                    Reintentar
                  </button>
                  <button className="btn-primary" style={{ flex: 2 }} onClick={() => {
                    navigate('/emitir', {
                      state: {
                        prefilledData: {
                          rncComprador: extracted.rnc_comprador || '',
                          razonSocialComprador: extracted.raw_text?.substring(0, 50) || '', // Usar parte del texto extraído como nombre si no hay razón social
                          total: extracted.total_facturado || 0,
                          itbis: extracted.itbis || 0
                        }
                      }
                    });
                  }}>
                    Generar e-CF con estos datos
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Sube la imagen para extraer los datos de RNC, totales e ITBIS usando Inteligencia Artificial.
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
