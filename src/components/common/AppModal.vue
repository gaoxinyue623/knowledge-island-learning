<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

interface Props {
  open: boolean
  title: string
  description?: string
  closeOnEsc?: boolean
  closeOnBackdrop?: boolean
  showClose?: boolean
  primaryLabel?: string
  secondaryLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: undefined,
  closeOnEsc: true,
  closeOnBackdrop: true,
  showClose: true,
  primaryLabel: undefined,
  secondaryLabel: undefined,
})

const emit = defineEmits<{
  close: []
  primary: []
  secondary: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)

function getFocusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []

  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

async function focusDialog() {
  await nextTick()
  const firstFocusable = getFocusableElements()[0]
  ;(firstFocusable ?? dialogRef.value)?.focus()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (!props.open) return

  if (event.key === 'Escape' && props.closeOnEsc) {
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()
  if (focusable.length === 0) {
    event.preventDefault()
    return
  }

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

function setOpenListeners(open: boolean) {
  if (open) {
    lastFocusedElement.value =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onDocumentKeydown)
    void focusDialog()
  } else {
    document.removeEventListener('keydown', onDocumentKeydown)
    lastFocusedElement.value?.focus()
    lastFocusedElement.value = null
  }
}

function onBackdrop() {
  if (props.closeOnBackdrop) emit('close')
}

watch(() => props.open, setOpenListeners)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="app-modal__backdrop" @click.self="onBackdrop">
        <section
          ref="dialogRef"
          class="app-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <header class="app-modal__header">
            <div>
              <h2 class="app-modal__title">{{ title }}</h2>
              <p v-if="description" class="app-modal__description">{{ description }}</p>
            </div>
            <button
              v-if="showClose"
              class="app-modal__close touch-target"
              type="button"
              aria-label="关闭"
              @click="emit('close')"
            >
              <AppIcon name="x" :size="20" decorative />
            </button>
          </header>
          <div class="app-modal__content">
            <slot />
          </div>
          <footer
            v-if="$slots.actions || primaryLabel || secondaryLabel"
            class="app-modal__actions"
          >
            <slot name="actions">
              <AppButton v-if="secondaryLabel" variant="secondary" @click="emit('secondary')">
                {{ secondaryLabel }}
              </AppButton>
              <AppButton v-if="primaryLabel" @click="emit('primary')">{{ primaryLabel }}</AppButton>
            </slot>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
