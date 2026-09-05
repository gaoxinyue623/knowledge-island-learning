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

const regionLabel = computed(() => {
  if (props.region.code === 'CN-GD' || props.region.code === 'CN-HB') {
    return '省级范围 · 人教版语文'
  }
  if (props.region.code === 'CN-GD-SZ') return '沪教版英语 · 北师大版二年级上册数学'
  return props.region.level === 'PROVINCE' ? '省级学习范围' : '学习地区'
})
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
