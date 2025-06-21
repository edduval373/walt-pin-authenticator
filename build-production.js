import { build } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('Building Disney Pin Authenticator React app for production...')

try {
  await build({
    root: './client',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@shared': path.resolve(__dirname, './shared'),
        '@assets': path.resolve(__dirname, './attached_assets')
      }
    },
    build: {
      outDir: '../client/dist',
      emptyOutDir: true,
      minify: false,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    css: {
      postcss: {
        plugins: []
      }
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  })
  
  console.log('Production build completed successfully!')
  
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}