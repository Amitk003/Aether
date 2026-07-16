import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,svg}'],
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
    target: 'es2020',
  },
});
