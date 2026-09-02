<script setup lang="ts">
import LessonBlockShell from './LessonBlockShell.vue'

interface Props {
  eyebrow: string
  title?: string
  content?: string
  paragraphs?: string[]
  bullets?: string[]
  highlights?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  content: undefined,
  paragraphs: () => [],
  bullets: () => [],
  highlights: () => [],
})
</script>

<template>
  <LessonBlockShell :eyebrow="props.eyebrow" :title="props.title">
    <p v-if="props.content" class="lesson-block__content">{{ props.content }}</p>
    <p v-for="paragraph in props.paragraphs" :key="paragraph" class="lesson-block__paragraph">
      {{ paragraph }}
    </p>
    <ul v-if="props.bullets.length" class="lesson-block__list">
      <li v-for="bullet in props.bullets" :key="bullet">{{ bullet }}</li>
    </ul>
    <div v-if="props.highlights.length" class="lesson-block__highlights" aria-label="重点提示">
      <span v-for="highlight in props.highlights" :key="highlight">{{ highlight }}</span>
    </div>
    <p
      v-if="
        !props.content &&
        !props.paragraphs.length &&
        !props.bullets.length &&
        !props.highlights.length
      "
      class="lesson-block__empty-copy"
    >
      这一步的内容正在整理中。
    </p>
  </LessonBlockShell>
</template>
