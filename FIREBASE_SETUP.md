# 🔥 Configuración de Firebase para FinanzApp

Esta guía te ayudará a configurar Firebase (Google) para que tu app tenga una base de datos real con **1 GB gratis** y sincronización entre dispositivos.

## 📋 Pasos para Configurar Firebase

### 1. Crear cuenta en Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en "Get Started" o "Iniciar"
3. Inicia sesión con tu cuenta de Google
4. Es **100% gratuito** con 1 GB de almacenamiento

### 2. Crear un nuevo proyecto

1. Haz clic en "Add project" o "Agregar proyecto"
2. Completa el formulario:
   - **Nombre del proyecto**: `finanzapp` (o el nombre que prefieras)
   - **Google Analytics**: Opcional (puedes desactivarlo)
3. Haz clic en "Create project"
4. Espera 1-2 minutos a que se configure

### 3. Agregar una app web

1. En el dashboard de Firebase, haz clic en el icono de **Web** (</>)
2. Completa el formulario:
   - **App nickname**: `FinanzApp` (o el nombre que prefieras)
   - **Firebase Hosting**: Opcional (no necesario si usas GitHub Pages)
3. Haz clic en "Register app"
4. **Copia las credenciales** que aparecen (las necesitarás después)

### 4. Configurar Firestore Database

1. En el menú lateral, ve a **Build** → **Firestore Database**
2. Haz clic en "Create database"
3. Selecciona **"Start in test mode"** (para desarrollo rápido)
4. Elige la ubicación (región) más cercana a tus usuarios
5. Haz clic en "Enable"

### 5. Configurar reglas de seguridad

1. Ve a la pestaña **Rules** en Firestore
2. Reemplaza las reglas con estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden leer/escribir sus propios gastos
    match /gastos/{gastoId} {
      // Permitir lectura individual (get) y queries (list)
      // Para queries, Firestore verifica cada documento individualmente
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      
      // Permitir escritura si el usuario está autenticado y el user_id coincide
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
      
      // Permitir creación si el usuario está autenticado y el user_id coincide
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
    }
  }
}
```

3. Haz clic en "Publish"

### 5.1. Crear índice compuesto (⚠️ MUY IMPORTANTE - REQUERIDO)

**Este paso es OBLIGATORIO** para que las consultas funcionen en producción (GitHub Pages). Sin este índice, verás errores 400.

1. Ve a **Firestore Database** → **Indexes**
2. Haz clic en **"Create Index"**
3. Configura:
   - **Collection ID**: `gastos`
   - **Fields to index**:
     - `user_id` (Ascending) - Primera columna
     - `fecha` (Descending) - Segunda columna
   - **Query scope**: Collection
4. Haz clic en **"Create"**
5. **Espera 1-5 minutos** a que se cree el índice (verás un estado "Building" → "Enabled")

**Nota:** Si ves un error de índice faltante en la consola del navegador, Firebase te dará un enlace directo para crear el índice. Haz clic en ese enlace.

### 6. Obtener las credenciales

1. Ve a **Project Settings** (icono de engranaje) → **General**
2. Desplázate hasta "Your apps"
3. Haz clic en tu app web
4. Encontrarás un objeto de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 7. Configurar variables de entorno

Este paso es **copiar las credenciales de Firebase** (que obtuviste en el paso 6) a un archivo especial en tu proyecto.

#### Paso 7.1: Crear el archivo `.env`

1. Abre tu proyecto en Visual Studio Code (o tu editor favorito)
2. En la **raíz del proyecto** (donde está el archivo `package.json`), crea un archivo nuevo llamado `.env`
   - **Nota**: El archivo debe llamarse exactamente `.env` (con el punto al inicio)
   - Si usas Windows y no puedes crear archivos que empiecen con punto, puedes:
     - Usar el comando: `echo. > .env` en la terminal
     - O crear `env` y luego renombrarlo a `.env`

#### Paso 7.2: Copiar las credenciales

1. Ve a Firebase Console → **Project Settings** → **General** → **Your apps**
2. Haz clic en tu app web
3. Verás un bloque de código que dice `firebaseConfig` con tus credenciales
4. Copia cada valor y pégalo en el archivo `.env` siguiendo este formato:

```env
VITE_FIREBASE_API_KEY=pega-aqui-el-apiKey
VITE_FIREBASE_AUTH_DOMAIN=pega-aqui-el-authDomain
VITE_FIREBASE_PROJECT_ID=pega-aqui-el-projectId
VITE_FIREBASE_STORAGE_BUCKET=pega-aqui-el-storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=pega-aqui-el-messagingSenderId
VITE_FIREBASE_APP_ID=pega-aqui-el-appId
```

#### Ejemplo completo:

Si en Firebase ves esto:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz",
  authDomain: "mi-finanzapp.firebaseapp.com",
  projectId: "mi-finanzapp",
  storageBucket: "mi-finanzapp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

Entonces tu archivo `.env` debe quedar así:
```env
VITE_FIREBASE_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=mi-finanzapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mi-finanzapp
VITE_FIREBASE_STORAGE_BUCKET=mi-finanzapp.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Importante:**
- ✅ No pongas comillas (`"`) alrededor de los valores
- ✅ No dejes espacios alrededor del `=`
- ✅ Copia los valores **exactamente** como aparecen en Firebase
- ✅ El archivo `.env` debe estar en la misma carpeta que `package.json`

#### Paso 7.3: Verificar que el archivo está bien

Tu archivo `.env` debe verse así (pero con tus propios valores):

```
Finanzapp/
├── package.json
├── .env          ← Este archivo (en la raíz)
├── src/
└── ...
```

**Comando rápido para crear el archivo (si tienes problemas):**

En Windows (PowerShell):
```powershell
New-Item -Path .env -ItemType File
```

En Mac/Linux:
```bash
touch .env
```

Luego abre el archivo `.env` con tu editor y pega las credenciales.

### 8. Habilitar autenticación por email

1. Ve a **Build** → **Authentication**
2. Haz clic en "Get started"
3. Ve a la pestaña **Sign-in method**
4. Haz clic en **Email/Password**
5. Activa el toggle "Enable"
6. Haz clic en "Save"

### 8.1. Autorizar dominio de GitHub Pages (IMPORTANTE para producción)

Para que Firebase funcione en GitHub Pages, necesitas autorizar el dominio:

1. Ve a **Build** → **Authentication** → **Settings**
2. Desplázate hasta **Authorized domains**
3. Haz clic en **"Add domain"**
4. Agrega tu dominio de GitHub Pages (ejemplo: `tu-usuario.github.io` o `tu-usuario.github.io/Finanzapp`)
5. Haz clic en **"Add"**

**Nota:** Si tu dominio es `https://tu-usuario.github.io/Finanzapp/`, agrega solo `tu-usuario.github.io` (sin el path `/Finanzapp`)

### 9. Reiniciar el servidor

Este paso lo haces en la **terminal** (donde ejecutaste `npm run dev` al principio).

#### Paso 9.1: Cerrar el servidor actual

1. Ve a la **terminal** donde está corriendo el servidor (debería decir algo como `VITE v5.4.21 ready...`)
2. Presiona `Ctrl + C` (o `Cmd + C` en Mac) para detener el servidor
3. Verás que el servidor se detiene y vuelves a tener el cursor disponible

#### Paso 9.2: Iniciar el servidor de nuevo

1. En la **misma terminal**, ejecuta:

```bash
npm run dev
```

2. El servidor se iniciará y ahora cargará las variables de entorno del archivo `.env`

#### Paso 9.3: Verificar que Firebase funciona

1. Abre tu navegador en `http://localhost:5173` (o el puerto que te indique la terminal)
2. Presiona **F12** (o clic derecho → "Inspeccionar") para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console** (Consola)
4. Busca mensajes:
   - ❌ Si ves: `⚠️ Firebase no está configurado` → Revisa tu archivo `.env` (paso 7)
   - ✅ Si **NO** ves ese mensaje → Firebase está configurado correctamente

#### 📍 Dónde hacer esto:

```
Terminal (PowerShell/CMD/Git Bash)
├── Detén el servidor: Ctrl + C
└── Inicia de nuevo: npm run dev

Navegador
└── Abre: http://localhost:5173
    └── Presiona F12 → Pestaña Console
```

**Nota:** Si ya tienes el servidor corriendo (como en tu terminal actual), solo necesitas:
1. Presionar `Ctrl + C` para detenerlo
2. Ejecutar `npm run dev` de nuevo
3. Abrir la consola del navegador (F12) para verificar

## ⚠️ Solución: Errores 400 en producción (GitHub Pages)

Si ves errores **400** o **"WebChannelConnection RPC 'Listen' stream transport errored"** en GitHub Pages pero funciona localmente:

### 1. Verificar el índice compuesto (MÁS COMÚN)

El error 400 suele indicar que falta el índice compuesto:

1. Ve a [Firebase Console](https://console.firebase.google.com) → Tu proyecto
2. Ve a **Firestore Database** → **Indexes**
3. Verifica que exista un índice con:
   - Collection: `gastos`
   - Fields: `user_id` (Ascending), `fecha` (Descending)
   - Estado: **Enabled** (no "Building")
4. Si no existe o está "Building", créalo o espera a que termine (ver paso 5.1)

### 2. Verificar dominios autorizados

1. Ve a **Authentication** → **Settings**
2. En **Authorized domains**, verifica que esté tu dominio de GitHub Pages
3. Si no está, agrégalo (ver paso 8.1)

### 3. Verificar reglas de seguridad

1. Ve a **Firestore Database** → **Rules**
2. Verifica que las reglas sean exactamente como en el paso 5
3. Haz clic en **"Publish"** si hiciste cambios

### 4. Verificar variables de entorno en GitHub

1. Ve a tu repositorio en GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Verifica que todos los secrets de Firebase estén configurados correctamente
3. Los nombres deben ser exactamente:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 5. Forzar nuevo despliegue

Después de hacer cambios, fuerza un nuevo despliegue:

1. En GitHub, ve a **Actions**
2. Haz clic en **"Run workflow"** → **"Run workflow"**
3. Espera a que termine el despliegue

## ⚠️ Solución: Error "API key not valid"

Si ves el error **"API key not valid. Please pass a valid API key"**, necesitas habilitar las APIs en Google Cloud Console:

### Pasos para solucionar:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto Firebase (`finanzapp-7f5fd` o el nombre de tu proyecto)
3. Ve a **APIs & Services** → **Enabled APIs** (o "APIs habilitadas")
4. Haz clic en **"+ ENABLE APIS AND SERVICES"** (o "+ HABILITAR API Y SERVICIOS")
5. Busca y habilita estas APIs:
   - ✅ **Identity Toolkit API** (Firebase Authentication)
   - ✅ **Cloud Firestore API**
6. Espera 1-2 minutos a que se activen
7. Recarga tu navegador (F5)

**Si las APIs ya están habilitadas pero sigues viendo el error:**

1. **Verifica que no haya restricciones en la API key:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/) → Tu proyecto
   - Ve a **APIs & Services** → **Credentials**
   - Busca tu API key (empieza con `AIza...`)
   - Haz clic en ella
   - En "API restrictions", asegúrate de que esté en **"Don't restrict key"** o que incluya:
     - Identity Toolkit API
     - Cloud Firestore API
   - Haz clic en **"Save"**

2. **Limpia la caché del navegador:**
   - Presiona `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac) para recargar sin caché
   - O cierra completamente el navegador y vuelve a abrirlo

3. **Reinicia el servidor de desarrollo:**
   - En la terminal, presiona `Ctrl + C`
   - Ejecuta `npm run dev` de nuevo

## ✅ Verificar que Funciona

1. Abre la app en el navegador
2. Regístrate con un email y contraseña
3. Verifica en Firebase:
   - Ve a **Authentication** → **Users** → Deberías ver tu usuario
   - Ve a **Firestore Database** → **Data** → Deberías ver una colección `gastos` con tus gastos

## 🔒 Seguridad

- ✅ **Reglas de seguridad** configuradas
- ✅ Cada usuario solo puede ver/editar sus propios datos
- ✅ Las contraseñas se hashean automáticamente (bcrypt)
- ✅ La autenticación es segura (tokens JWT)

## 🌐 Sincronización Entre Dispositivos

Una vez configurado Firebase:

- ✅ Los usuarios pueden iniciar sesión desde cualquier dispositivo
- ✅ Los gastos se sincronizan automáticamente
- ✅ Los datos están respaldados en la nube
- ✅ Funciona offline (usa localStorage como caché) y sincroniza cuando hay conexión

## 📊 Límites del Plan Gratuito

- ✅ **1 GB de almacenamiento** (suficiente para ~500,000 gastos)
- ✅ **10 GB de transferencia/mes**
- ✅ **50,000 lecturas/día**
- ✅ **20,000 escrituras/día**
- ✅ **20,000 eliminaciones/día**

**Para uso personal, estos límites son más que suficientes.**

## 📝 Configurar para GitHub Pages (Producción)

Para que Firebase funcione en producción:

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Agrega estos secrets (uno por uno):
   - **Name**: `VITE_FIREBASE_API_KEY`
   - **Value**: Tu API key de Firebase
   
   - **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
   - **Value**: Tu auth domain
   
   - **Name**: `VITE_FIREBASE_PROJECT_ID`
   - **Value**: Tu project ID
   
   - **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
   - **Value**: Tu storage bucket
   
   - **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - **Value**: Tu messaging sender ID
   
   - **Name**: `VITE_FIREBASE_APP_ID`
   - **Value**: Tu app ID

5. Haz clic en "Add secret" para cada uno

El workflow ya está configurado para usar estos secrets automáticamente (necesitarás actualizar el workflow).

## 🎉 ¡Listo!

Una vez configurado:
- ✅ Los usuarios se guardan en Firebase Authentication
- ✅ Los gastos se guardan en Firestore
- ✅ Todo se sincroniza entre dispositivos
- ✅ 1 GB de espacio gratis (más que suficiente)
- ✅ Todo funciona en producción (GitHub Pages)

## 💡 Ventajas de Firebase sobre Supabase

- ✅ **Más espacio**: 1 GB vs 500 MB
- ✅ **Más transferencia**: 10 GB/mes vs límites más estrictos
- ✅ **De Google**: Infraestructura muy confiable
- ✅ **Mejor para apps pequeñas**: Plan gratuito más generoso

