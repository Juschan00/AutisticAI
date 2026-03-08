import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/locations': 'http://localhost:3000',
      '/discover': 'http://localhost:3000',
      '/reviews': 'http://localhost:3000',
      '/rankings': 'http://localhost:3000',
      '/profiles': 'http://localhost:3000',
      '/ai': 'http://localhost:3000',
      '/saved-places': 'http://localhost:3000',
      '/upload': 'http://localhost:3000',
    },
  },
})
