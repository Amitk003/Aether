import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,png,ico}'],
      },
      manifest: {
        name: 'Aether',
        short_name: 'Aether',
        description: 'Offline messaging using sound and light',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
      },
    }),
  ],
  build: {
    target: 'esnext',
  },
});
