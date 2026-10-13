import { defineConfig, devices } from '@playwright/test';

const PORT = 5179;

// Vaciamos las credenciales para que la app use el modo localStorage aunque
// existan en el entorno o en un .env (las variables de proceso tienen prioridad).
const sinBackend = {
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
  VITE_BASE_PATH: '/',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'America/Argentina/Buenos_Aires',
    locale: 'es-AR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Puerto dedicado y sin reutilizar: nunca nos enganchamos a un dev server con Firebase
    reuseExistingServer: false,
    env: sinBackend,
    timeout: 120_000,
  },
});
