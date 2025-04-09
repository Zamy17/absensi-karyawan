// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Ini membuat server bisa diakses dari perangkat lain
    port: 5173, // Port default dari Vite
  }
})