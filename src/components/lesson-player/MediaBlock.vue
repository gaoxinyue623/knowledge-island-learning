<script setup lang="ts">
import type { LessonContentBlockViewModel } from '@/types'

import LessonBlockShell from './LessonBlockShell.vue'
import MediaRenderer from './MediaRenderer.vue'

interface Props {
  block: LessonContentBlockViewModel
}

const props = defineProps<Props>()
</script>

<template>
  <LessonBlockShell eyebrow="看图或听一听" :title="props.block.title">
    <p v-if="props.block.content" class="lesson-block__content">{{ props.block.content }}</p>
    <p v-for="paragraph in props.block.paragraphs" :key="paragraph" class="lesson-block__paragraph">
      {{ paragraph }}
    </p>
    <div v-if="props.block.media?.length" class="lesson-media-list" aria-label="课程媒体">
      <MediaRenderer v-for="media in props.block.media" :key="media.id" :media="media" />
    </div>
    <p v-else class="lesson-block__empty-copy">媒体内容暂时没有准备好，但你可以继续阅读这一步。</p>
  </LessonBlockShell>
</template>
