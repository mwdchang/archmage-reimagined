import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // host: '0.0.0.0',
    host: true,
    port: 9000,
    strictPort: true,
    allowedHosts: ['archmage-reimagined.xyz'],
    proxy: {
      '/api': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         secure: false,      
         ws: true,
       }
    }
  }
})
