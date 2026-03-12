# Instrucciones para Configurar Persistencia en Supabase

## ✅ Archivos Generados

1. **SQL Migration**: `supabase/migrations/20260311_create_reportes_606.sql`
2. **Tipos TypeScript**: `src/types/database.ts`
3. **Servicio de BD**: `src/services/reportes606Service.ts`

---

## 📋 Paso 1: Ejecutar SQL en Supabase Dashboard

### Opción A: Supabase Cloud (supabase.com)

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Consultablia** (o crea uno nuevo)
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **+ New Query**
5. Copia y pega **todo** el contenido del archivo:
   ```
   supabase/migrations/20260311_create_reportes_606.sql
   ```
6. Haz clic en **Run** (o presiona `Ctrl+Enter`)
7. Verifica que veas el mensaje: **Success. No rows returned**

### Opción B: Supabase Local/VPS

Si tienes Supabase instalado localmente o en VPS:

```bash
# Aplicar migración
supabase db push

# O ejecutar el archivo SQL directamente
psql -U postgres -d postgres -f supabase/migrations/20260311_create_reportes_606.sql
```

---

## ✅ Paso 2: Verificar que las Tablas se Crearon

En el **SQL Editor**, ejecuta:

```sql
-- Ver todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%606%';

-- Debería mostrar:
-- reportes_606
-- facturas_606
```

O en la pestaña **Table Editor**, deberías ver las dos tablas nuevas:
- `reportes_606`
- `facturas_606`

---

## ✅ Paso 3: Verificar Estructura de Tablas

```sql
-- Ver columnas de reportes_606
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reportes_606';

-- Ver columnas de facturas_606
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'facturas_606';
```

---

## 🔑 Paso 4: Obtener Credenciales de Supabase

Necesitarás estas dos claves para que la app se conecte:

1. En el Dashboard, ve a **Settings** (⚙️) → **API**
2. Copia estos valores:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (clave pública)

3. Verifica que exista el archivo `.env.local` en la raíz del proyecto:

```env
# .env.local (este archivo NO se sube a Git)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE:** Si usas Supabase en VPS, la URL será algo como `http://tu-vps-ip:8000`

---

## 🔍 Paso 5: Probar la Conexión

Ejecuta este SQL para insertar un reporte de prueba:

```sql
-- Insertar reporte de prueba
INSERT INTO reportes_606 (periodo, nombre)
VALUES ('2026-03', 'Marzo 2026 - Prueba');

-- Verificar que se insertó
SELECT * FROM reportes_606;

-- Limpiar (opcional)
DELETE FROM reportes_606 WHERE nombre LIKE '%Prueba%';
```

---

## 🚀 Siguiente Paso

Una vez completados estos pasos, el sistema de persistencia estará listo.

El próximo paso es **actualizar el Context** para que:
1. Al cambiar de período, cargue las facturas desde la BD
2. Al agregar/editar/eliminar facturas, se guarden automáticamente en la BD
3. El usuario pueda seleccionar períodos anteriores y ver su historial

**¿Están las tablas creadas y listas?** Avísame para continuar con la integración del Context.

---

## 📊 Esquema de las Tablas

### `reportes_606`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único del reporte |
| periodo | TEXT | Formato "YYYY-MM" (ej: "2026-03") |
| nombre | TEXT | Nombre legible (ej: "Marzo 2026 - Reporte 606") |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última actualización |

### `facturas_606`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único de la factura |
| reporte_id | UUID | FK → reportes_606(id) |
| **23 columnas del formato 606** | — | Todas las columnas oficiales de DGII |
| razon_social_proveedor | TEXT | Nombre del proveedor (metadato) |
| archivo_url | TEXT | URL de la imagen en Storage |
| storage_path | TEXT | Ruta en el bucket |
| confidence | JSONB | Scores de confianza del OCR |
| estado_validacion | TEXT | 'pendiente', 'valido', 'requiere_revision', 'error' |
| errores_validacion | JSONB | Array de errores |
| fecha_creacion | TIMESTAMPTZ | Fecha de creación |
| fecha_modificacion | TIMESTAMPTZ | Última actualización |

---

## ⚠️ Notas de Seguridad

- Las credenciales en `.env.local` **NO se suben a Git** (está en .gitignore)
- Por ahora, **Row Level Security (RLS) está deshabilitado** para desarrollo
- Cuando implementes autenticación de usuarios, activa RLS con:
  ```sql
  ALTER TABLE reportes_606 ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facturas_606 ENABLE ROW LEVEL SECURITY;
  ```
