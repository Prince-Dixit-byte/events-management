import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  
server: {
  host: '0.0.0.0',
  port: 5173,
  allowedHosts: [
    'invite-wants-created-sandra.trycloudflare.com',
    'athens-colony-methodology-london.trycloudflare.com'
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    },
  },
},
});
