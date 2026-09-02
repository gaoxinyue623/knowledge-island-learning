<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from './AppIcon.vue'
import type { IconName } from '@/types'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'subject'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  iconLeft?: IconName
  iconRight?: IconName
  fullWidth?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  iconLeft: undefined,
  iconRight: undefined,
  fullWidth: false,
  ariaLabel: undefined,
})

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    class="app-button"
    :class="[
      `app-button--${variant}`,
      `app-button--${size}`,
      { 'app-button--full': fullWidth, 'app-button--loading': loading },
    ]"
    :type="type"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
  >
    <AppIcon
      v-if="loading"
      class="app-button__spinner"
      name="loader-circle"
      :size="18"
      decorative
    />
    <AppIcon v-else-if="iconLeft" :name="iconLeft" :size="18" decorative />
    <span class="app-button__label"><slot /></span>
    <AppIcon v-if="!loading && iconRight" :name="iconRight" :size="18" decorative />
  </button>
</template>
