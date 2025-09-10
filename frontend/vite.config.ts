import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  envPrefix: 'VITE_',
  build: {
    // Enable build caching
    watch: null,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'recharts'],
          three: ['three', 'three-stdlib'],
        },
      },
    },
    // Enable source maps only in development
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize build performance
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
  },
  define: {
    // Define process.env for browser compatibility
    'process.env': {},
    // Mock process.cwd for browser compatibility
    'process.cwd': '"/"',
  },
  // Enable build caching
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
