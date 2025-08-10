import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {


    port: 80,
    allowedHosts: ['gameztorepremios.com'], // ✅ Agrega tu dominio aquí
  },
})