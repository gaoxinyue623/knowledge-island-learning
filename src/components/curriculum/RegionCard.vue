<script setup lang="ts">
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
      <small>{{ props.region.level === 'PROVINCE' ? '示例省级地区' : '示例地区' }}</small>
    </span>
    <AppIcon name="chevron-right" :size="20" decorative />
  </button>
</template>
