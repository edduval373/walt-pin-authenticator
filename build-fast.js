import { build } from 'vite'
import react from '@vitejs/plugin-react'  
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('Starting optimized build for Railway deployment...')

try {
  await build({
    root: './client',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@assets': path.resolve(__dirname, './attached_assets')
      }
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      minify: 'terser',
      sourcemap: false,
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            query: ['@tanstack/react-query'],
            router: ['wouter']
          }
        }
      }
    }
  })
  
  console.log('Build completed successfully!')
  
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}