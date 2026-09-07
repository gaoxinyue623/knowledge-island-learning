<script setup lang="ts">
import { computed } from 'vue'

import type { LessonContentBlockViewModel } from '@/types'

const props = defineProps<{ block: LessonContentBlockViewModel }>()

const paragraphs = computed(() => {
  const content = (props.block.content ?? '').replace(/\r\n?/g, '\n')
  const lines = content.split('\n')
  // The heading already presents this exact source title; leave the source record intact.
  if (props.block.title && lines[0]?.trim() === props.block.title.trim()) lines.shift()

  return [lines.join('\n'), ...(props.block.paragraphs ?? [])]
    .flatMap((text) => text.split(/\n[\t ]*\n/))
    .map((text) => text.trim())
    .filter(Boolean)
})

const hasShortLines = computed(() => {
  const lines = paragraphs.value.flatMap((paragraph) => paragraph.split('\n')).filter(Boolean)
  return lines.length >= 3 && lines.every((line) => [...line].length <= 28)
})
</script>

<template>
  <article class="reading-text-block" :class="{ 'reading-text-block--short-lines': hasShortLines }">
    <h3 v-if="props.block.title" class="reading-text-block__title">{{ props.block.title }}</h3>
    <div class="reading-text-block__body">
      <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
      <ul v-if="props.block.bullets?.length" class="reading-text-block__list">
        <li v-for="(bullet, index) in props.block.bullets" :key="index">{{ bullet }}</li>
      </ul>
      <aside
        v-if="props.block.highlights?.length"
        class="reading-text-block__highlights"
        aria-label="重点提示"
      >
        <p v-for="(highlight, index) in props.block.highlights" :key="index">{{ highlight }}</p>
      </aside>
      <p
        v-if="!paragraphs.length && !props.block.bullets?.length && !props.block.highlights?.length"
        class="lesson-block__empty-copy"
      >
        这一步的内容正在整理中。
      </p>
    </div>
  </article>
</template>
