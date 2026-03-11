import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useFacturas606 } from '@/contexts/Facturas606Context';
import TablaConsolidada606 from '@/components/tabla606/TablaConsolidada606';
import { Registro606 } from '@/types/formato606';

export default function EscanearPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context para gestión de facturas
  const {
    facturaSeleccionada,
    indiceFacturaSeleccionada,
    agregarDesdeOCR,
    actualizarFactura,
    eliminarFactura,
    siguienteFactura,
    facturaAnterior,
  } = useFacturas606();

  // Estado de vista: 'tabla' (primaria 80%) o 'detalle' (secundaria 20%)
  const [vista, setVista] = useState<'tabla' | 'detalle'>('tabla');

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');

  // Estado para el zoom del visor (solo en vista detalle)
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Batch upload: procesar múltiples archivos
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setLoading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      // Temporalmente solo aceptar imágenes (PDFs requieren procesamiento especial)
      if (!file.type.startsWith('image/')) {
        if (file.type.includes('pdf')) {
          console.warn(`PDF omitido (soporte en desarrollo): ${file.name}`);
          setError(`PDF "${file.name}" omitido. Por ahora, solo se aceptan imágenes (JPG, PNG).`);
        } else {
          console.warn(`Archivo omitido (no es imagen): ${file.name}`);
        }
        continue;
      }

      try {
        await processImage(file);
      } catch (err) {
        console.error(`Error procesando ${file.name}:`, err);
      }
    }

    setLoading(false);
    setUploadProgress({ current: 0, total: 0 });

    // Reiniciar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImage = async (imageFile: File) => {
    // MODO DEMO: Si falla OCR o no está configurado, usar datos de ejemplo
    const DEMO_MODE = false; // ✅ OCR configurado - usando OpenAI Vision

    try {
      if (DEMO_MODE) {
        // Simular delay de procesamiento
        await new Promise(resolve => setTimeout(resolve, 800));

        // Crear URL local de la imagen para preview
        const localUrl = URL.createObjectURL(imageFile);

        // Datos de ejemplo para demostración
        const mockOcrData = {
          rnc_emisor: `${Math.floor(100000000 + Math.random() * 900000000)}`,
          razon_social_emisor: imageFile.name.includes('carrefour') ? 'CARREFOUR DOMINICANA SA' :
                              imageFile.name.includes('price') ? 'PRICESMART DOMINICANA SA' :
                              'COMERCIAL EJEMPLO SRL',
          ncf: `E${String(Math.floor(Math.random() * 10000000000)).padStart(11, '0')}`,
          fecha_comprobante: new Date().toISOString().split('T')[0],
          tipo_gasto: 'bienes',
          monto_facturado: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
          itbis_facturado: 0,
          total: 0,
          confidence: {
            rnc_emisor: 95,
            ncf: 92,
            total: 98,
          }
        };

        // Calcular ITBIS y total
        mockOcrData.itbis_facturado = parseFloat((mockOcrData.monto_facturado * 0.18).toFixed(2));
        mockOcrData.total = parseFloat((mockOcrData.monto_facturado + mockOcrData.itbis_facturado).toFixed(2));

        console.log('📍 MODO DEMO: Usando datos de ejemplo', mockOcrData);

        // Agregar al contexto global con URL local
        agregarDesdeOCR(mockOcrData, localUrl, `demo/${imageFile.name}`);
        return;
      }

      // MODO PRODUCCIÓN: OCR real con Supabase + OpenAI
      // 1. Subir la imagen a Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
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

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-scans')
        .getPublicUrl(uploadData.path);

      // 3. Llamar a la Edge Function con formato 606 expandido
      console.log('Invocando OCR Processor para:', uploadData.path);
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-processor', {
        body: { storagePath: uploadData.path }
      });

      if (ocrError) throw ocrError;

      console.log('Datos extraídos por IA:', ocrData);

      // 4. Agregar al contexto global
      agregarDesdeOCR(ocrData, publicUrl, uploadData.path);

    } catch (err: any) {
      console.error('Error procesando imagen:', err);
      setError(err.message || 'Error al procesar la imagen con OCR.');
      throw err;
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1; // Invertir para que scroll arriba = zoom in
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleVerDetalle = (indice: number) => {
    setVista('detalle');
    handleResetZoom();
  };

  const handleCerrarDetalle = () => {
    setVista('tabla');
    handleResetZoom();
  };

  const handleActualizarCampo = (campo: keyof Registro606, valor: any) => {
    if (facturaSeleccionada?.id) {
      actualizarFactura(facturaSeleccionada.id, { [campo]: valor });
    }
  };

  const handleEliminarDesdeDetalle = () => {
    if (!facturaSeleccionada) return;

    const confirmar = window.confirm(
      `¿Eliminar factura de ${facturaSeleccionada.razon_social_proveedor || 'Sin nombre'}?\n\n` +
      `NCF: ${facturaSeleccionada.ncf || 'Sin NCF'}\n` +
      `Monto: RD$ ${new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(facturaSeleccionada.total_monto_facturado || 0)}\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmar && facturaSeleccionada.id) {
      eliminarFactura(facturaSeleccionada.id);
      setVista('tabla'); // Volver a la tabla después de eliminar
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
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {vista === 'tabla' ? 'Reporte 606' : 'Detalle de Factura'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {vista === 'tabla' ? 'Reporte 606 - Compras' : 'Revisar Factura'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              {vista === 'tabla'
                ? 'Tabla consolidada de facturas del período'
                : 'Verificación y edición de datos extraídos'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {vista === 'detalle' && (
              <button
                className="btn-secondary"
                onClick={handleCerrarDetalle}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Volver a Tabla
              </button>
            )}

            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  </svg>
                  Procesando {uploadProgress.current}/{uploadProgress.total}...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Cargar Factura(s)
                </>
              )}
            </button>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              title="Solo imágenes JPG, PNG (soporte PDF próximamente)"
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '1rem',
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

      {/* Vista: Tabla o Detalle */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {vista === 'tabla' ? (
          <TablaConsolidada606 onVerDetalleFactura={handleVerDetalle} />
        ) : (
          <DetalleFactura
            factura={facturaSeleccionada}
            indice={indiceFacturaSeleccionada}
            onActualizarCampo={handleActualizarCampo}
            onSiguiente={siguienteFactura}
            onAnterior={facturaAnterior}
            onEliminar={handleEliminarDesdeDetalle}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onWheel={handleWheel}
            isDragging={isDragging}
            position={position}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        )}
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

// Componente: Vista de Detalle con Split Panel
interface DetalleFacturaProps {
  factura: Registro606 | null;
  indice: number;
  onActualizarCampo: (campo: keyof Registro606, valor: any) => void;
  onSiguiente: () => void;
  onAnterior: () => void;
  onEliminar?: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onWheel: (e: React.WheelEvent) => void;
  isDragging: boolean;
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

function DetalleFactura({
  factura,
  indice,
  onActualizarCampo,
  onSiguiente,
  onAnterior,
  onEliminar,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onWheel,
  isDragging,
  position,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: DetalleFacturaProps) {
  if (!factura) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1.5rem', opacity: 0.3 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
          Sin factura seleccionada
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Selecciona una factura de la tabla para ver sus detalles
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Navegación entre facturas */}
      <div style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--color-border)',
        background: '#F9FAFB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Factura #{indice + 1}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onAnterior}
            disabled={indice === 0}
            style={{
              padding: '0.4rem 0.8rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'white',
              cursor: indice === 0 ? 'not-allowed' : 'pointer',
              opacity: indice === 0 ? 0.5 : 1,
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Anterior
          </button>
          <button
            onClick={onSiguiente}
            style={{
              padding: '0.4rem 0.8rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            Siguiente
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          {onEliminar && (
            <button
              onClick={onEliminar}
              title="Eliminar factura"
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#EF4444',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Split Panel */}
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
                  <button onClick={onZoomOut} style={{
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', minWidth: '50px', textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={onZoomIn} style={{
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <button onClick={onResetZoom} style={{
                    padding: '0.4rem 0.8rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}>
                    Restablecer
                  </button>
                </div>
              </div>

              {/* Área del visor */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {factura.archivo_url ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      cursor: zoom > 1 ? 'grab' : 'default',
                      userSelect: 'none',
                    }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onWheel={onWheel}
                  >
                    <img
                      src={factura.archivo_url}
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
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.3 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      Imagen no disponible
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle style={{
            width: '4px',
            background: 'var(--color-border)',
            cursor: 'col-resize',
            transition: 'background 0.2s',
          }} />

          {/* Panel Derecho: Formulario 606 Editable */}
          <Panel defaultSize={50} minSize={30}>
            <div style={{
              height: '100%',
              overflow: 'auto',
              background: 'white',
              padding: '2rem',
            }}>
              <FormularioEdicion606 factura={factura} onActualizar={onActualizarCampo} />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

// Componente: Formulario de edición de campos 606
interface FormularioEdicion606Props {
  factura: Registro606;
  onActualizar: (campo: keyof Registro606, valor: any) => void;
}

function FormularioEdicion606({ factura, onActualizar }: FormularioEdicion606Props) {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
          Formato 606 - Compras
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Verifica y edita los datos extraídos por la IA
        </p>
      </div>

      {/* Estado de validación */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        borderRadius: '8px',
        background: factura.estado_validacion === 'valido' ? '#ECFDF5' : factura.estado_validacion === 'requiere_revision' ? '#FEF3C7' : '#FEE2E2',
        border: `1px solid ${factura.estado_validacion === 'valido' ? '#10B981' : factura.estado_validacion === 'requiere_revision' ? '#F59E0B' : '#EF4444'}`,
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: factura.estado_validacion === 'valido' ? '#065F46' : factura.estado_validacion === 'requiere_revision' ? '#92400E' : '#991B1B' }}>
          {factura.estado_validacion === 'valido' ? '✓ Validado' : factura.estado_validacion === 'requiere_revision' ? '⚠️ Requiere Revisión' : '❌ Con Errores'}
        </div>
        {factura.errores_validacion && factura.errores_validacion.length > 0 && (
          <ul style={{ margin: '0.5rem 0 0', padding: '0 0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
            {factura.errores_validacion.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Campos editables - Simplificado para ahora */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <CampoEditable
          label="RNC/Cédula Proveedor"
          value={factura.rnc_cedula || ''}
          onChange={(v) => onActualizar('rnc_cedula', v)}
        />
        <CampoEditable
          label="Razón Social Proveedor"
          value={factura.razon_social_proveedor || ''}
          onChange={(v) => onActualizar('razon_social_proveedor', v)}
        />
        <CampoEditable
          label="NCF"
          value={factura.ncf || ''}
          onChange={(v) => onActualizar('ncf', v)}
        />
        <CampoEditable
          label="Fecha Comprobante (YYYYMMDD)"
          value={factura.fecha_comprobante || ''}
          onChange={(v) => onActualizar('fecha_comprobante', v)}
        />
        <CampoEditable
          label="Monto Servicios (RD$)"
          value={factura.monto_facturado_servicios?.toString() || '0'}
          onChange={(v) => onActualizar('monto_facturado_servicios', parseFloat(v) || 0)}
          type="number"
        />
        <CampoEditable
          label="Monto Bienes (RD$)"
          value={factura.monto_facturado_bienes?.toString() || '0'}
          onChange={(v) => onActualizar('monto_facturado_bienes', parseFloat(v) || 0)}
          type="number"
        />
        <CampoEditable
          label="Total Monto Facturado (RD$)"
          value={factura.total_monto_facturado?.toString() || '0'}
          onChange={(v) => onActualizar('total_monto_facturado', parseFloat(v) || 0)}
          type="number"
          highlighted
        />
        <CampoEditable
          label="ITBIS Facturado (RD$)"
          value={factura.itbis_facturado?.toString() || '0'}
          onChange={(v) => onActualizar('itbis_facturado', parseFloat(v) || 0)}
          type="number"
        />
        <CampoEditable
          label="ITBIS Adelantar (RD$)"
          value={factura.itbis_adelantar?.toString() || '0'}
          onChange={(v) => onActualizar('itbis_adelantar', parseFloat(v) || 0)}
          type="number"
          highlighted
        />
      </div>
    </div>
  );
}

// Componente auxiliar: Campo editable
function CampoEditable({
  label,
  value,
  onChange,
  type = 'text',
  highlighted = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  highlighted?: boolean;
}) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
      }}>
        {label}
      </label>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontWeight: highlighted ? 600 : 400,
          fontSize: highlighted ? '1.125rem' : '0.875rem',
        }}
      />
    </div>
  );
}
