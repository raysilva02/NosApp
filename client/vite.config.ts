import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// As chamadas /api, /chatHub e /health são encaminhadas para o backend .NET
// (http://localhost:5076). Vale tanto no dev (server) quanto no preview da
// versão de produção (usado para testar no celular como PWA).
const proxy = {
  '/api': { target: 'http://localhost:5076', changeOrigin: true },
  '/chatHub': { target: 'http://localhost:5076', ws: true, changeOrigin: true },
  '/health': { target: 'http://localhost:5076', changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
  build: { outDir: 'dist' },
});
