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

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (iconos)
- PWA (Progressive Web App)

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

## Scripts

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## Despliegue en GitHub Pages

### Configuración Inicial

1. **Haz tu repositorio público** (necesario para GitHub Pages gratuito):
   - Ve a `Settings` → `General`
   - Desplázate hasta la sección "Danger Zone" al final
   - Haz clic en "Change repository visibility"
   - Selecciona "Make public" y confirma
   
   ⚠️ **Nota**: GitHub Pages gratuito solo funciona con repositorios públicos. Si necesitas mantenerlo privado, considera usar GitHub Enterprise (de pago) u otra plataforma como Vercel/Netlify.

2. **Habilita GitHub Pages**:
   - Ve a `Settings` → `Pages` en tu repositorio de GitHub
   - En `Source`, selecciona `GitHub Actions` (NO "Branch")
   - Guarda los cambios

3. **Haz push de tu código**:
   ```bash
   git add .
   git commit -m "Configurar para GitHub Pages"
   git push origin main
   ```

4. **El workflow se ejecutará automáticamente**:
   - Ve a la pestaña `Actions` en tu repositorio
   - Verás el workflow "Deploy to GitHub Pages" ejecutándose
   - Una vez completado, tu sitio estará disponible en:
     `https://[tu-usuario].github.io/[nombre-del-repo]/`

### Actualización Automática

Cada vez que hagas `git push` a la rama `main`, el sitio se actualizará automáticamente en 2-3 minutos.

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

## Almacenamiento

Los datos se guardan automáticamente en el localStorage de tu navegador, por lo que tus gastos persisten entre sesiones.

## Cotizaciones

Las cotizaciones se obtienen de la API gratuita [ExchangeRate.Host](https://exchangerate.host/). Las cotizaciones se almacenan en caché durante 1 hora para optimizar el rendimiento.

## Licencia

MIT
