import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { usePreferencesStore } from '@/stores/preferencesStore'

export function useReducedMotion() {
  const settings = usePreferencesStore()
  const prefersReducedMotion = ref(false)
  let mediaQuery: MediaQueryList | null = null

  function update() {
    prefersReducedMotion.value = mediaQuery?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mediaQuery.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', update)
  })

  return {
    prefersReducedMotion: computed(
      () => prefersReducedMotion.value || settings.preferences.reducedMotion,
    ),
  }
}
