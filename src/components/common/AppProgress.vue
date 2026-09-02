<script setup lang="ts">
import { computed } from 'vue'

type ProgressState = 'normal' | 'success' | 'warning'

interface Props {
  value: number
  state?: ProgressState
  label?: string
  showValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  state: 'normal',
  label: '完成进度',
  showValue: false,
})

const safeValue = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
  <div class="app-progress">
    <div v-if="showValue" class="app-progress__meta">
      <span>{{ label }}</span>
      <span class="app-progress__value">{{ Math.round(safeValue) }}%</span>
    </div>
    <div
      class="app-progress__track"
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="safeValue"
    >
      <div
        class="app-progress__bar"
        :class="`app-progress__bar--${state}`"
        :style="{ width: `${safeValue}%` }"
      />
    </div>
  </div>
</template>
