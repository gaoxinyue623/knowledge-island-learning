<script setup lang="ts">
import type { LessonContentBlockViewModel } from '@/types'

import StructuredLessonBlock from './StructuredLessonBlock.vue'

interface Props {
  block: LessonContentBlockViewModel
}

const props = defineProps<Props>()
</script>

<template>
  <StructuredLessonBlock
    eyebrow="一步一步"
    :title="props.block.title"
    :content="props.block.content"
    :paragraphs="props.block.paragraphs"
    :bullets="props.block.bullets"
    :highlights="props.block.highlights"
  />
</template>
