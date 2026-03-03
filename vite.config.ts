import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
// Para Electron o Capacitor (móvil), usar rutas relativas. Para web, usar el basePath configurado
const isElectron = process.env.ELECTRON === 'true';
const isCapacitor = process.env.CAPACITOR === 'true';
const basePath = isElectron || isCapacitor ? './' : (process.env.VITE_BASE_PATH || '/');

export default defineConfig({
  plugins: [
    react(),
      VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      injectRegister: 'auto',
      strategies: 'generateSW',
      manifest: {
        name: 'FinanzApp - Control de Finanzas',
        short_name: 'FinanzApp',
        description: 'Control total de tus finanzas personales',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: basePath,
        start_url: basePath,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.exchangerate\.host\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchange-rates-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  // El base se configura en el workflow de GitHub Actions
  base: basePath,
})
