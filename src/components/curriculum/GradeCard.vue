<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { Grade } from '@/types'

interface Props {
  grade: Grade
  selected?: boolean
  available?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  available: false,
})

const emit = defineEmits<{ select: [grade: Grade] }>()
</script>

<template>
  <button
    class="grade-card"
    :class="{ 'grade-card--selected': props.selected, 'grade-card--disabled': !props.available }"
    type="button"
    :disabled="!props.available"
    :aria-pressed="props.selected"
    @click="emit('select', props.grade)"
  >
    <span class="grade-card__number">{{ props.grade.code.slice(1) }}</span>
    <strong>{{ props.grade.name }}</strong>
    <span v-if="props.available" class="grade-card__status">当前支持</span>
    <span v-else class="grade-card__status"
      ><AppIcon name="lock" :size="14" decorative /> 即将开放</span
    >
  </button>
</template>
