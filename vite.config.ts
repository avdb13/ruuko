import million from 'million/compiler';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "./public",
  plugins: [million.vite({ auto: {skip: ['DateMessage', 'MessageWindow']} }), react()],
    optimizeDeps: {
    exclude: ['@matrix-org/olm', 'moment', 'transition-hook']
  }
  
})
