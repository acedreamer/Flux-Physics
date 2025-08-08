import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Flux-Physics/' : '/',
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  server: {
    fs: {
      allow: ['..', '../engine']
    }
  },
  optimizeDeps: {
    exclude: ['engine']
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})