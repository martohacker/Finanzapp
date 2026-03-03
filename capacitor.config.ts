import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finanzapp.app',
  appName: 'FinanzApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
