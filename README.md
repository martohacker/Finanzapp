# FinanzApp 💰

Una aplicación moderna para controlar tus finanzas personales, gestionar gastos y visualizar estadísticas.

## Características

- ✅ Agregar y gestionar gastos
- ✅ **Editar gastos** - Modifica cualquier gasto existente
- ✅ Categorización de gastos (8 categorías predefinidas)
- ✅ Gráficos interactivos (pastel y barras)
- ✅ Estadísticas detalladas:
  - Total de gastos
  - Gasto del mes actual
  - Gasto del día actual
  - Promedio diario
  - Desglose por categoría
- ✅ Soporte para múltiples monedas (EUR, USD, ARS, MXN, GBP, CLP, COP, PEN, BRL)
- ✅ Conversión automática a pesos argentinos con cotizaciones en tiempo real
- ✅ Almacenamiento local (los datos se guardan en tu navegador)
- ✅ Interfaz moderna y completamente responsive
- ✅ **Instalable como PWA** - Puedes instalarla en tu dispositivo
- ✅ **App de escritorio** - Instalador para Windows (.exe), Mac (.dmg) y Linux (.AppImage)
- ✅ **App Store y Play Store** - Misma app empaquetada con Capacitor para publicar en tiendas
- ✅ **Base de datos en la nube (opcional)** - Configura Firebase o Supabase para sincronización entre dispositivos

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (iconos)
- PWA (Progressive Web App)
- Electron (App de escritorio)
- Capacitor (App Store y Play Store)

## Instalación Local

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:5173`

## Instalar como App (PWA)

La aplicación es una PWA (Progressive Web App) que puedes instalar en tu dispositivo:

### En iPhone/iPad (iOS):
1. **Abre la aplicación en Safari** (no funciona en Chrome u otros navegadores)
2. Verás un **banner azul en la parte superior** con instrucciones
3. Toca el botón **Compartir** (⬆️) en la barra inferior de Safari
4. Desplázate y selecciona **"Agregar a pantalla principal"**
5. Toca **"Agregar"** para confirmar
6. ¡Listo! La app aparecerá en tu pantalla principal como una app nativa

**💡 Tip**: Si no ves el banner, simplemente sigue los pasos 3-5 directamente.

### En Android:
1. Abre la aplicación en Chrome
2. Verás un banner con la opción "Instalar" o "Agregar a la pantalla principal"
3. Toca "Instalar" y confirma

### En Desktop (Chrome/Edge):
1. Abre la aplicación en tu navegador
2. Haz clic en el icono de instalación (➕) en la barra de direcciones
3. O ve a Menú (⋮) → Instalar "FinanzApp"
4. Confirma la instalación

### Ventajas de instalarla:
- ✅ Funciona offline (una vez cargada)
- ✅ Se actualiza automáticamente
- ✅ Acceso rápido desde el escritorio/pantalla principal
- ✅ Experiencia similar a una app nativa
- ✅ No requiere descargar desde App Store

## App de Escritorio (Windows/Mac/Linux)

Puedes crear un instalador para tu sistema operativo:

### Windows:
```bash
npm run build:electron
```

**Nota**: Si aparece un error de permisos al final, el ejecutable ya se habrá generado en `release/win-unpacked/FinanzApp.exe`. Puedes usar ese ejecutable directamente.

Esto generará:
- **Portable**: `release/FinanzApp-1.0.1-portable.exe` (si se completa el empaquetado)
- **Carpeta completa**: `release/win-unpacked/FinanzApp.exe` (siempre disponible, ejecuta este si falla el empaquetado)

### Características de la app de escritorio:
- ✅ Ejecutable portable (no requiere instalación)
- ✅ Acceso directo - solo ejecuta el .exe
- ✅ Funciona offline (una vez cargada)
- ✅ No requiere navegador
- ✅ Experiencia de app nativa
- ✅ Todos los datos se guardan localmente en la carpeta del usuario

### Desarrollo:
```bash
npm run electron:dev
```
Ejecuta la app de escritorio en modo desarrollo, conectándose al servidor de desarrollo de Vite.

## Publicar en App Store y Play Store

Sí, es posible. La app está preparada para generar builds nativos con **Capacitor**: la misma app web se empaqueta como app para iOS y Android.

### Requisitos

| Tienda | Requisito | Coste |
|--------|-----------|--------|
| **Google Play** | Cuenta de [Google Play Console](https://play.google.com/console), Android Studio | 25 USD (una sola vez) |
| **App Store** | Cuenta de [Apple Developer](https://developer.apple.com), **Mac con Xcode** | 99 USD/año |

Para **iOS** necesitas sí o sí un Mac con Xcode; no se pueden generar builds de iOS en Windows.

### Pasos generales

1. **Instalar dependencias** (incluye Capacitor):
   ```bash
   npm install
   ```

2. **Generar la build web para móvil**:
   ```bash
   npm run build:capacitor
   ```

3. **Añadir las plataformas** (solo la primera vez):
   ```bash
   npx cap add android
   npx cap add ios
   ```
   Se crearán las carpetas `android/` e `ios/` con los proyectos nativos.

4. **Sincronizar el contenido** (cada vez que cambies la app web):
   ```bash
   npm run cap:sync
   ```

### Android (Play Store)

1. Instala [Android Studio](https://developer.android.com/studio).
2. Abre el proyecto Android:
   ```bash
   npm run cap:android
   ```
   (o abre la carpeta `android/` en Android Studio).
3. En Android Studio: **Build → Generate Signed Bundle / APK** y crea un AAB (Android App Bundle) para subir a Play Console.
4. En [Google Play Console](https://play.google.com/console) crea la app, sube el AAB, completa ficha, política de privacidad, etc., y envía a revisión.

### iOS (App Store)

1. Necesitas un **Mac** con [Xcode](https://developer.apple.com/xcode/) instalado.
2. Abre el proyecto iOS:
   ```bash
   npm run cap:ios
   ```
   (o abre `ios/App/App.xcworkspace` en Xcode).
3. En Xcode: configura tu **Team** (cuenta Apple Developer), **Bundle ID** (`com.finanzapp.app`), firma y dispositivos.
4. **Product → Archive** para generar el archivo para App Store Connect.
5. Sube el archivo desde Xcode a App Store Connect y completa la ficha de la app para enviar a revisión.

### Comandos útiles

- `npm run build:capacitor` — Build web con rutas para móvil.
- `npm run cap:sync` — Copia la build a `android` e `ios` y sincroniza.
- `npm run cap:android` — Abre el proyecto en Android Studio.
- `npm run cap:ios` — Abre el proyecto en Xcode (solo en Mac).

### Notas

- **Iconos y splash**: Puedes personalizar iconos y pantalla de carga en `android/app/src/main/res/` e `ios/App/App/Assets.xcassets/`. Capacitor puede usar los iconos PWA que ya tienes en `public/`.
- **Firebase**: La misma configuración de Firebase (variables de entorno o `google-services.json` / `GoogleService-Info.plist`) debe estar en los proyectos Android e iOS para que login y datos en la nube funcionen en las apps publicadas.
- **Política de privacidad**: Ambas tiendas suelen pedir una URL de política de privacidad; puedes usar una página en GitHub Pages o tu propio sitio.

## Scripts

- `npm run dev` - Inicia el servidor de desarrollo web
- `npm run electron:dev` - Inicia la app de escritorio en modo desarrollo
- `npm run build` - Construye la aplicación web para producción
- `npm run build:electron` - Construye e instala la app de escritorio (genera .exe)
- `npm run build:capacitor` - Construye la app web para móvil (App Store / Play Store)
- `npm run cap:sync` - Sincroniza la build con los proyectos Android e iOS
- `npm run cap:android` - Abre el proyecto en Android Studio
- `npm run cap:ios` - Abre el proyecto en Xcode (solo en Mac)
- `npm run preview` - Previsualiza la build de producción web
- `npm run lint` - Ejecuta el linter
- `npm run generate-icons` - Genera los iconos PWA

## Despliegue en GitHub Pages

**⚠️ IMPORTANTE**: Para que la app funcione en GitHub Pages (login y datos en la nube), debes configurar los **secrets de Firebase** en el repositorio.

### Secrets necesarios

En **Settings → Secrets and variables → Actions** del repo, crea estos secrets con los mismos valores que tenés en tu `.env` local:

| Secret | Descripción |
|--------|-------------|
| `VITE_FIREBASE_API_KEY` | API Key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (ej: `tu-proyecto.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

Sin estos secrets, la build se hace igual pero la app en GitHub Pages no podrá conectar con Firebase (los usuarios podrían usar solo modo local).

### Configuración inicial

1. **Haz tu repositorio público** (necesario para GitHub Pages gratuito):
   - Ve a `Settings` → `General`
   - Desplázate hasta "Danger Zone" y cambia la visibilidad a **Public**

2. **Habilita GitHub Pages**:
   - Ve a `Settings` → `Pages`
   - En **Source** elegí **GitHub Actions** (no "Branch")
   - Guarda

3. **Subí el código y hacé push**:
   ```bash
   git add .
   git commit -m "Subir a GitHub Pages"
   git push origin main
   ```

4. **Revisá el despliegue**:
   - En la pestaña **Actions** se ejecuta el workflow "Deploy to GitHub Pages"
   - Cuando termine, la app queda en:  
     **`https://[tu-usuario].github.io/[nombre-del-repo]/`**  
     (ej: si el repo se llama `Finanzapp`, la URL es `https://tuusuario.github.io/Finanzapp/`)

### Actualizaciones

Cada vez que hagas `git push` a `main`, el sitio se vuelve a construir y se actualiza en 1–2 minutos.

## Uso

1. **Agregar un gasto**: Completa el formulario con descripción, monto, fecha y categoría
2. **Editar un gasto**: Haz clic en el icono de lápiz (azul) junto a cualquier gasto
3. **Seleccionar moneda**: Usa el selector en el header para cambiar la moneda
4. **Ver estadísticas**: Las tarjetas superiores muestran tus estadísticas principales
5. **Visualizar gráficos**: Los gráficos muestran la distribución de tus gastos por categoría
6. **Conversión a pesos**: Si usas otra moneda, verás automáticamente la conversión a pesos argentinos
7. **Eliminar gastos**: Haz clic en el icono de basura para eliminar un gasto

## Categorías

- 🍔 Alimentación
- 🚗 Transporte
- 🎬 Entretenimiento
- 🏥 Salud
- 🛍️ Compras
- 💡 Servicios
- 📚 Educación
- 📦 Otros

## Monedas Soportadas

- 💶 EUR (Euro)
- 💵 USD (Dólar Estadounidense)
- 💰 ARS (Peso Argentino) - Moneda por defecto
- 💵 MXN (Peso Mexicano)
- 💷 GBP (Libra Esterlina)
- 💵 CLP (Peso Chileno)
- 💵 COP (Peso Colombiano)
- 💰 PEN (Sol Peruano)
- 💵 BRL (Real Brasileño)

## Sistema de Usuarios

FinanzApp incluye un sistema de autenticación que permite que cada usuario tenga sus propios datos de forma segura:

- ✅ **Registro de usuarios**: Crea tu cuenta con email, contraseña y nombre
- ✅ **Inicio de sesión**: Accede a tus datos con tu cuenta
- ✅ **Datos privados**: Cada usuario solo ve sus propios gastos y estadísticas
- ✅ **Múltiples usuarios**: Varias personas pueden usar la misma app en el mismo dispositivo

### 🚀 Base de Datos en la Nube - Opcional

Puedes configurar **Firebase** (recomendado) o **Supabase** para tener:
- ✅ **Sincronización entre dispositivos**: Tus datos están en la nube
- ✅ **Autenticación real**: Sistema seguro con tokens JWT
- ✅ **Backup automático**: Tus datos están respaldados
- ✅ **1 GB gratis** (Firebase) o 500 MB (Supabase)

#### 🔥 Firebase (Recomendado)
- ✅ **1 GB de almacenamiento gratis** (más generoso)
- ✅ **10 GB de transferencia/mes**
- ✅ **50,000 lecturas/día**
- ✅ Infraestructura de Google

**Configuración**: Ver [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para instrucciones detalladas.

#### 🗄️ Supabase (Alternativa)
- ✅ Base de datos PostgreSQL
- ✅ 500 MB de almacenamiento gratis
- ✅ Open source

**Configuración**: Ver [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para instrucciones detalladas.

**Sin base de datos**: Si no configuras ninguna, la app usa localStorage como fallback (datos locales en el navegador).

**Otras opciones**: Ver [OPCIONES_BASE_DATOS.md](./OPCIONES_BASE_DATOS.md) para más alternativas gratuitas.

### Características de seguridad:
- Las contraseñas se hashean (SHA-256 local o bcrypt en Supabase)
- Cada usuario tiene sus propios datos aislados
- Row Level Security (RLS) en Supabase
- La sesión persiste entre recargas de página

## Almacenamiento

Los datos se guardan automáticamente en el localStorage de tu navegador, separados por usuario. Cada usuario tiene:
- Sus propios gastos (`finanzapp-gastos-{userId}`)
- Su moneda preferida (`finanzapp-moneda-{userId}`)
- Sus preferencias de usuario

## Cotizaciones

Las cotizaciones se obtienen de la API gratuita [ExchangeRate.Host](https://exchangerate.host/). Las cotizaciones se almacenan en caché durante 1 hora para optimizar el rendimiento.

## Licencia

MIT
