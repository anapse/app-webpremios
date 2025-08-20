import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones de build
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync('C:/nginx/ssl/gameztorepremios_com.key'),
      cert: fs.readFileSync('C:/nginx/ssl/gameztorepremios_com.crt'),
    },
    hmr: {
      protocol: 'wss',
      host: 'gameztorepremios.com',
      clientPort: 443
    },
    // Proxy de desarrollo para evitar CORS cuando se llama a /api desde Vite
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // opcional: reescritura si sirves backend bajo otro prefijo
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  }
})
