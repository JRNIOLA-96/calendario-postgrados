import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/reservas': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/recursos': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})