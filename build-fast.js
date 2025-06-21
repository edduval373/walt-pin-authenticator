import { build } from 'vite'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

console.log('Starting fast build for Railway deployment...')

try {
  await build({
    root: './client',
    plugins: [
      {
        name: 'react-minimal',
        config() {
          return {
            esbuild: {
              jsx: 'automatic'
            }
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': '/client/src',
        '@assets': '/attached_assets'
      }
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      minify: false,
      sourcemap: false,
      target: 'es2018',
      rollupOptions: {
        external: [],
        output: {
          manualChunks: undefined
        }
      }
    }
  })
  
  console.log('Build completed successfully!')
  
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}