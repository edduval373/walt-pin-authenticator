import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets')
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter']
  }
});