import { onBeforeUnmount, onMounted, ref } from 'vue'

import { breakpoints } from '@/design-tokens'

export type BreakpointName = 'mobile' | 'tablet' | 'desktop'

function getBreakpoint(width: number): BreakpointName {
  if (width <= breakpoints.mobileMax) return 'mobile'
  if (width <= breakpoints.tabletMax) return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const current = ref<BreakpointName>('desktop')

  function update() {
    if (typeof window !== 'undefined') {
      current.value = getBreakpoint(window.innerWidth)
    }
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update, { passive: true })
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', update)
  })

  return { current, update }
}
