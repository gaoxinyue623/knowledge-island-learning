import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { localLLMPlugin } from './scripts/llm/vitePlugin'
import { localTtsPlugin } from './scripts/tts/vitePlugin'
import { agentProxyTarget, loadAgentEnvironment } from './server/learningAgentConfig'

export default defineConfig(({ mode }) => {
  // VITE_* values are public. Refuse this unsafe spelling before dev/build can expose it.
  if (loadEnv(mode, process.cwd(), 'VITE_').VITE_LLM_API_KEY || process.env.VITE_LLM_API_KEY)
    throw new Error('VITE_LLM_API_KEY is unsafe; use server-only LLM_API_KEY in .env.local')
  return {
    plugins: [vue(), localTtsPlugin(), localLLMPlugin()],
    server: {
      proxy: {
        '/api/pet': 'http://127.0.0.1:8787',
        '/api/agent': {
          target: agentProxyTarget(loadAgentEnvironment()),
          // Keep the browser Host so the backend can verify Host === Origin.
          changeOrigin: false,
        },
      },
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
  }
})
