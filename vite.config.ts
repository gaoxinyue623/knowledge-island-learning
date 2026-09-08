import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { localTtsPlugin } from './scripts/tts/vitePlugin'

export default defineConfig({
  plugins: [vue(), localTtsPlugin()],
  server: {
    proxy: { '/api/pet': 'http://127.0.0.1:8787' },
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/.tts-cache/**',
        '**/.data/**',
        '**/*.sqlite',
        '**/*.sqlite-*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
