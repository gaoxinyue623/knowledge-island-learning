<script setup lang="ts">
import { computed, type Component } from 'vue'

import type { LessonContentBlockViewModel } from '@/types'

import ConceptBlock from './ConceptBlock.vue'
import ExampleBlock from './ExampleBlock.vue'
import ExplanationBlock from './ExplanationBlock.vue'
import InteractiveBlock from './InteractiveBlock.vue'
import IntroBlock from './IntroBlock.vue'
import MediaBlock from './MediaBlock.vue'
import PracticeBlock from './PracticeBlock.vue'
import SummaryBlock from './SummaryBlock.vue'
import UnknownContentBlock from './UnknownContentBlock.vue'

interface Props {
  blocks: LessonContentBlockViewModel[]
  showDiagnostics?: boolean
  practiceAvailable?: boolean | null
}

const props = withDefaults(defineProps<Props>(), {
  showDiagnostics: false,
  practiceAvailable: null,
})
const emit = defineEmits<{ 'start-assessment': [] }>()

const componentByType: Record<string, Component> = {
  intro: IntroBlock,
  concept: ConceptBlock,
  explanation: ExplanationBlock,
  example: ExampleBlock,
  media: MediaBlock,
  interactive: InteractiveBlock,
  practice: PracticeBlock,
  summary: SummaryBlock,
}

function componentFor(block: LessonContentBlockViewModel): Component | null {
  return componentByType[block.type] ?? null
}

const sortedBlocks = computed(() =>
  [...props.blocks].sort(
    (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
  ),
)
</script>

<template>
  <div class="lesson-content-renderer" aria-live="polite">
    <template v-for="block in sortedBlocks" :key="block.id">
      <PracticeBlock
        v-if="block.type === 'practice'"
        :block="block"
        :assessment-available="props.practiceAvailable"
        @start-assessment="emit('start-assessment')"
      />
      <component :is="componentFor(block)" v-else-if="componentFor(block)" :block="block" />
      <UnknownContentBlock v-else :type="block.type" :show-diagnostics="props.showDiagnostics" />
    </template>
    <p v-if="!sortedBlocks.length" class="lesson-content-renderer__empty">
      这一步的内容正在准备中。
    </p>
  </div>
</template>
