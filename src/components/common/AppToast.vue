<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from './AppIcon.vue'
import type { IconName } from '@/types'

type ToastType = 'success' | 'info' | 'warning' | 'error'

interface Props {
  open: boolean
  type?: ToastType
  title: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  message: undefined,
})

const iconByType: Record<ToastType, IconName> = {
  success: 'check-circle',
  info: 'info',
  warning: 'lightbulb',
  error: 'alert-circle',
}

const iconName = computed(() => iconByType[props.type])
</script>

<template>
  <Transition name="slide-up">
    <div v-if="open" class="app-toast" :class="`app-toast--${type}`" role="status">
      <AppIcon :name="iconName" :size="20" decorative />
      <div>
        <p class="app-toast__title">{{ title }}</p>
        <p v-if="message" class="app-toast__message">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>
