import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  optimizeDeps: {
    exclude: ['lucide-react', 'pg', 'dotenv'],
  },
  envPrefix: 'VITE_',
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude Node.js specific modules from browser bundle
        if (id === 'pg' || id.startsWith('pg/')) {
          return true;
        }
        return false;
      },
    },
  },
  define: {
    // Define process.env for browser compatibility
    'process.env': {},
    // Mock process.cwd for browser compatibility
    'process.cwd': '"/"',
  },
});
