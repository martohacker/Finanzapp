# 🔧 Configuración de Supabase para FinanzApp

Esta guía te ayudará a configurar Supabase para que tu app tenga una base de datos real y sincronización entre dispositivos.

## 📋 Pasos para Configurar Supabase

### 1. Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project" o "Sign up"
3. Regístrate con GitHub, Google o email
4. Es **100% gratuito** hasta 500 MB de base de datos

### 2. Crear un nuevo proyecto

1. En el dashboard de Supabase, haz clic en "New Project"
2. Completa el formulario:
   - **Name**: `finanzapp` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Elige la región más cercana a tus usuarios
   - **Pricing Plan**: Free (gratis)
3. Haz clic en "Create new project"
4. Espera 1-2 minutos a que se configure (verás el progreso)

### 3. Obtener las credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API** en el menú lateral
2. Encontrarás dos valores importantes:
   - **Project URL** (ejemplo: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ...`)

### 4. Crear las tablas en la base de datos

1. Ve a **SQL Editor** en el menú lateral
2. Haz clic en "New query"
3. Copia y pega este SQL:

```sql
-- Crear tabla de gastos
CREATE TABLE IF NOT EXISTS public.gastos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL,
  fecha DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Crear política: Los usuarios solo pueden ver sus propios gastos
CREATE POLICY "Users can view their own expenses"
  ON public.gastos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Crear política: Los usuarios solo pueden insertar sus propios gastos
CREATE POLICY "Users can insert their own expenses"
  ON public.gastos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Crear política: Los usuarios solo pueden actualizar sus propios gastos
CREATE POLICY "Users can update their own expenses"
  ON public.gastos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Crear política: Los usuarios solo pueden eliminar sus propios gastos
CREATE POLICY "Users can delete their own expenses"
  ON public.gastos
  FOR DELETE
  USING (auth.uid() = user_id);
```

4. Haz clic en "Run" o presiona `Ctrl+Enter`
5. Deberías ver un mensaje de éxito

### 5. Configurar variables de entorno

1. En la raíz de tu proyecto, crea un archivo `.env` (si no existe)
2. Agrega estas líneas:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

3. **Reemplaza** los valores con los de tu proyecto:
   - `VITE_SUPABASE_URL`: La URL de tu proyecto (Project URL)
   - `VITE_SUPABASE_ANON_KEY`: La clave anon public key

**Ejemplo:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1Njc4OSwiZXhwIjoxOTM5MDMxNzg5fQ.example...
```

### 6. Actualizar App.tsx para usar Supabase

La app ya está configurada para usar Supabase si detecta las variables de entorno. Solo necesitas:

1. Reiniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. La app detectará automáticamente si Supabase está configurado
   - Si está configurado → Usa Supabase (base de datos en la nube)
   - Si no está configurado → Usa localStorage (fallback)

## ✅ Verificar que Funciona

1. Abre la app en el navegador
2. Regístrate con un email y contraseña
3. Verifica en Supabase:
   - Ve a **Authentication** → **Users** → Deberías ver tu usuario
   - Ve a **Table Editor** → **gastos** → Deberías ver los gastos que agregues

## 🔒 Seguridad

- ✅ **Row Level Security (RLS)** está habilitado
- ✅ Cada usuario solo puede ver/editar sus propios datos
- ✅ Las contraseñas se hashean automáticamente
- ✅ La autenticación es segura (JWT tokens)

## 🌐 Sincronización Entre Dispositivos

Una vez configurado Supabase:

- ✅ Los usuarios pueden iniciar sesión desde cualquier dispositivo
- ✅ Los gastos se sincronizan automáticamente
- ✅ Los datos están respaldados en la nube
- ✅ Funciona offline (usa localStorage como caché) y sincroniza cuando hay conexión

## 🔄 Migrar Datos Existentes

Si ya tenías usuarios y gastos en localStorage, necesitarás migrarlos manualmente o los usuarios deberán volver a agregar sus gastos después de registrarse con Supabase.

## 📝 Configurar para GitHub Pages (Producción)

Para que Supabase funcione en producción:

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Agrega estos dos secrets:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: La URL de tu proyecto Supabase
   
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: La anon key de tu proyecto Supabase

5. Haz clic en "Add secret" para cada uno

El workflow ya está configurado para usar estos secrets automáticamente.

## 🎉 ¡Listo!

Una vez configurado:
- ✅ Los usuarios se guardan en la base de datos
- ✅ Los gastos se sincronizan entre dispositivos
- ✅ Todo funciona en producción (GitHub Pages)

