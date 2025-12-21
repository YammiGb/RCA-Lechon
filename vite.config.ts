import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Ensure Service Worker is served correctly
  publicDir: 'public',
  build: {
    rollupOptions: {
      // Don't bundle the service worker
      external: [],
    },
  },
});
