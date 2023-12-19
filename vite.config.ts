import million from 'million/compiler';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// million.vite({ auto: {skip: ['App']} })
// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "./public",
  plugins: [react()],
    optimizeDeps: {
    exclude: ['@matrix-org/olm', 'moment']
  }
})
