<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import type { Region } from '@/types'

interface Props {
  region: Region
  selected?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
})

const emit = defineEmits<{ select: [region: Region] }>()

const regionLabel = computed(() =>
  props.region.level === 'PROVINCE' ? '省级地区 · 教材自由选择' : '城市地区 · 教材自由选择',
)
</script>

<template>
  <button
    class="curriculum-choice"
    :class="{ 'curriculum-choice--selected': props.selected }"
    type="button"
    :disabled="props.disabled"
    :aria-pressed="props.selected"
    @click="emit('select', props.region)"
  >
    <span class="curriculum-choice__icon" aria-hidden="true"><AppIcon name="map-pin" /></span>
    <span class="curriculum-choice__content">
      <strong>{{ props.region.name }}</strong>
      <small>{{ regionLabel }}</small>
    </span>
    <AppIcon name="chevron-right" :size="20" decorative />
  </button>
</template>
