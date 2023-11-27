import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "./public",
  plugins: [react()],
    optimizeDeps: {
    exclude: ['@matrix-org/olm']
  }
})
