import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  root: './client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    }
  }
})