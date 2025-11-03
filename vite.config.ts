import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
  // El base se configura en el workflow de GitHub Actions
  base: basePath,
})
