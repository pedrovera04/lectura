import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, redirigimos /api al backend para evitar problemas de CORS
// y no tener que codificar la URL del backend en el frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
