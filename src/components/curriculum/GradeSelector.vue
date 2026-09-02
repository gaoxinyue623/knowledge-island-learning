<script setup lang="ts">
import type { Grade } from '@/types'
import GradeCard from './GradeCard.vue'

interface Props {
  grades: Grade[]
  selectedGradeId?: string | null
  availableGradeIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedGradeId: null,
  availableGradeIds: () => [],
})

const emit = defineEmits<{ select: [grade: Grade] }>()
</script>

<template>
  <div class="grade-grid">
    <GradeCard
      v-for="grade in props.grades"
      :key="grade.id"
      :grade="grade"
      :selected="props.selectedGradeId === grade.id"
      :available="props.availableGradeIds.includes(grade.id)"
      @select="emit('select', $event)"
    />
  </div>
</template>
