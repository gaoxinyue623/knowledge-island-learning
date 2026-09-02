<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

interface Props {
  open: boolean
  title: string
  closeOnEsc?: boolean
  closeOnBackdrop?: boolean
  primaryLabel?: string
  secondaryLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  closeOnEsc: true,
  closeOnBackdrop: true,
  primaryLabel: undefined,
  secondaryLabel: undefined,
})

const emit = defineEmits<{
  close: []
  primary: []
  secondary: []
}>()

const sheetRef = ref<HTMLElement | null>(null)

function getFocusableElements(): HTMLElement[] {
  if (!sheetRef.value) return []
  return Array.from(
    sheetRef.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

async function focusSheet() {
  await nextTick()
  ;(getFocusableElements()[0] ?? sheetRef.value)?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape' && props.closeOnEsc) {
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) void focusSheet()
  },
)

onBeforeUnmount(() => {
  // The watcher is component-scoped; this hook keeps the lifecycle explicit for future body-lock behavior.
})
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="open"
        class="app-sheet__backdrop"
        @click.self="closeOnBackdrop ? emit('close') : undefined"
      >
        <section
          ref="sheetRef"
          class="app-bottom-sheet"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
          @keydown="onKeydown"
        >
          <div class="app-bottom-sheet__handle" aria-hidden="true" />
          <header class="app-bottom-sheet__header">
            <h2 class="app-bottom-sheet__title">{{ title }}</h2>
            <button
              class="app-bottom-sheet__close touch-target"
              type="button"
              aria-label="关闭"
              @click="emit('close')"
            >
              <AppIcon name="x" :size="20" decorative />
            </button>
          </header>
          <div class="app-bottom-sheet__content">
            <slot />
          </div>
          <footer
            v-if="$slots.actions || primaryLabel || secondaryLabel"
            class="app-bottom-sheet__actions"
          >
            <slot name="actions">
              <AppButton v-if="secondaryLabel" variant="secondary" @click="emit('secondary')">
                {{ secondaryLabel }}
              </AppButton>
              <AppButton v-if="primaryLabel" full-width @click="emit('primary')">{{
                primaryLabel
              }}</AppButton>
            </slot>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
