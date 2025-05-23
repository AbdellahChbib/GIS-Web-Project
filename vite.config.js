import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/node_modules/cesium/Build/Cesium/')
  },
  optimizeDeps: {
    include: ['cesium']
  },
  server: {
    proxy: {
      '/geoserver': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Assurer que les fichiers statiques sont bien servis
  publicDir: 'public',
  assetsInclude: ['**/*.json']
})
/* import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
}) */
 