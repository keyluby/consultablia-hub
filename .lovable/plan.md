

## Plan: Portar Consultablia desde el repositorio a este proyecto Lovable

He leído todo el código fuente de `apps/lovable-web` en tu repositorio. El código ya está adaptado para React + Vite + react-router-dom, por lo que la migración es directa.

### Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `index.html` | Agregar fuente Inter, cambiar título a "Consultablia" |
| `src/index.css` | Reemplazar con los estilos del repo (variables CSS custom, clases .card, .btn-primary, .badge, .sidebar-nav-item, animaciones) |
| `src/App.tsx` | Reemplazar con layout Sidebar + rutas (/, /emitir, /escanear, 404) |

### Archivos a crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/Sidebar.tsx` | Navegación lateral icónica (72px) con logo "ec", 3 items de nav + notificaciones/config/avatar |
| `src/components/InvoicesTable.tsx` | Tabla de comprobantes con datos mock, skeleton loading, badges de estado |
| `src/components/EmitirForm.tsx` | Formulario completo de emisión de e-CF con ítems, cálculo ITBIS, submit mock |
| `src/pages/Panel.tsx` | Página principal con header + InvoicesTable (corregir: el repo original no importa InvoicesTable, lo agregaré) |
| `src/pages/EmitirPage.tsx` | Página de emisión con breadcrumb + EmitirForm |
| `src/pages/EscanearPage.tsx` | Página OCR con drag-and-drop de imagen + datos extraídos mock |

### Detalles técnicos

- El CSS usa `@import "tailwindcss"` (Tailwind v4 syntax) pero este proyecto usa Tailwind v3 (`@tailwind base/components/utilities`). Adaptaré las directivas manteniendo los estilos custom con `@layer`.
- Agregaré las variables CSS custom del repo (--color-bg, --color-accent, etc.) preservando las variables HSL existentes de shadcn para no romper los componentes UI existentes.
- El Panel.tsx del repo solo tiene un placeholder "Cargando transacciones...", lo corregiré para que use el componente InvoicesTable.
- Se mantienen los providers existentes (QueryClient, Tooltip, Toaster) en App.tsx.

