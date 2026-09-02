import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const appName = ref(import.meta.env.VITE_APP_NAME || '知识岛')
  const isReady = ref(false)
  const environment = computed(() => (import.meta.env.DEV ? 'development' : 'production'))

  function markReady() {
    isReady.value = true
  }

  return { appName, isReady, environment, markReady }
})
