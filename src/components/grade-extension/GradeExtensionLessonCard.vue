<script setup lang="ts">
import type { GradeExtensionLesson } from '@/data/grade-extension/gradeExtensionLessons'

defineProps<{ lesson: GradeExtensionLesson; selected: boolean }>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <button
    class="grade-extension-card"
    :class="{ 'grade-extension-card--selected': selected }"
    type="button"
    :aria-pressed="selected"
    @click="$emit('select', lesson.id)"
  >
    <span>{{ lesson.subject === 'CHINESE' ? '语文' : lesson.subject === 'MATH' ? '数学' : '英语' }}</span>
    <strong>{{ lesson.title }}</strong>
    <small>{{ lesson.objective }}</small>
  </button>
</template>

<style scoped>
.grade-extension-card { display: grid; gap: .45rem; width: 100%; min-height: 44px; padding: 1rem; text-align: left; border: 1px solid var(--color-border, #d8dee9); border-radius: .9rem; background: var(--color-surface, #fff); color: inherit; font: inherit; cursor: pointer; }
.grade-extension-card:hover, .grade-extension-card:focus-visible, .grade-extension-card--selected { border-color: var(--color-primary, #2463eb); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #2463eb) 18%, transparent); outline: none; }
.grade-extension-card > span { color: var(--color-primary, #2463eb); font-size: .85rem; font-weight: 700; }
.grade-extension-card > small { color: var(--color-text-secondary, #4b5563); line-height: 1.55; }
</style>
