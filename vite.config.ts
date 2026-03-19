import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // This replaces the need for --host
    port: 5173,
    watch: {
      ignored: ['**/server/data/**'],
    },
  },
})
