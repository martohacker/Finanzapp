# FinanzApp 💰

Una aplicación moderna para controlar tus finanzas personales, gestionar gastos y visualizar estadísticas.

## Características

- ✅ Agregar y gestionar gastos
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

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (iconos)

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

3. **El workflow se ejecutará automáticamente**:
   - Ve a la pestaña `Actions` en tu repositorio
   - Verás el workflow "Deploy to GitHub Pages" ejecutándose
   - Una vez completado, tu sitio estará disponible en:
     `https://[tu-usuario].github.io/[nombre-del-repo]/`

### Deploy Manual

Si necesitas desplegar manualmente, puedes:
- Ir a `Actions` → `Deploy to GitHub Pages` → `Run workflow`

### Nota sobre el Base Path

El workflow está configurado para detectar automáticamente el nombre del repositorio. Si tu repositorio se llama `Finanzapp`, la URL será:
`https://[usuario].github.io/Finanzapp/`

## Uso

1. **Agregar un gasto**: Completa el formulario con descripción, monto, fecha y categoría
2. **Seleccionar moneda**: Usa el selector en el header para cambiar la moneda
3. **Ver estadísticas**: Las tarjetas superiores muestran tus estadísticas principales
4. **Visualizar gráficos**: Los gráficos muestran la distribución de tus gastos por categoría
5. **Conversión a pesos**: Si usas otra moneda, verás automáticamente la conversión a pesos argentinos
6. **Eliminar gastos**: Haz clic en el icono de basura para eliminar un gasto

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
