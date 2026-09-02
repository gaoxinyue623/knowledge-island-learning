<script setup lang="ts">
import { computed } from 'vue'

type CardVariant = 'surface' | 'elevated' | 'interactive' | 'soft' | 'subject'

interface Props {
  variant?: CardVariant
  clickable?: boolean
  selected?: boolean
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'surface',
  clickable: false,
  selected: false,
  disabled: false,
  loading: false,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  click: []
}>()

const isInteractive = computed(() => props.clickable && !props.disabled && !props.loading)

function handleClick() {
  if (isInteractive.value) {
    emit('click')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <article
    class="app-card"
    :class="[
      `app-card--${variant}`,
      {
        'app-card--clickable': isInteractive,
        'app-card--selected': selected,
        'app-card--disabled': disabled,
        'app-card--loading': loading,
      },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || loading || undefined"
    :aria-pressed="clickable ? selected : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div v-if="loading" class="app-card__skeleton" aria-hidden="true">
      <span class="app-card__skeleton-line app-card__skeleton-line--wide" />
      <span class="app-card__skeleton-line" />
      <span class="app-card__skeleton-line app-card__skeleton-line--short" />
    </div>
    <slot v-else />
  </article>
</template>
