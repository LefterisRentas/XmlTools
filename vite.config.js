import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import dotenv from 'dotenv'
import topLevelAwait from 'vite-plugin-top-level-await'

// Load environment variables from .env file
dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ['xmllint-wasm']
  },
  ssr: {
    noExternal: ['xmllint-wasm']
  }
})