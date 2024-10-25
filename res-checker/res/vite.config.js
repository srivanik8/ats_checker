import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Adjust this path if necessary
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'], // Exclude pdfjs-dist from optimization
  },
})
