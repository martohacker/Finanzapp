import { defineConfig } from 'vitest/config';

// Los tests de fechas dependen de la zona horaria: forzamos Argentina (UTC-3)
// antes de que arranquen los workers, que heredan esta variable.
process.env.TZ = 'America/Argentina/Buenos_Aires';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
