<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import type { LessonContentBlockViewModel } from '@/types'

import LessonContentRenderer from './LessonContentRenderer.vue'
import EnglishReadAloud from './EnglishReadAloud.vue'

const props = withDefaults(
  defineProps<{
    blocks: LessonContentBlockViewModel[]
    subject?: 'chinese' | 'english' | 'math'
    showDiagnostics?: boolean
    practiceAvailable?: boolean | null
    muted?: boolean
    heading?: string
    speechBlocks?: LessonContentBlockViewModel[]
  }>(),
  {
    subject: 'chinese',
    showDiagnostics: false,
    practiceAvailable: null,
    muted: false,
    heading: undefined,
    speechBlocks: undefined,
  },
)
const emit = defineEmits<{ 'start-assessment': [] }>()
const controlId = useId()
const textSize = ref<'standard' | 'large' | 'extra-large'>('standard')
const sizes = [
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大字' },
  { value: 'extra-large', label: '特大' },
] as const
const introduction = computed(() => {
  if (props.subject === 'math') return '带着好奇心，发现数学'
  if (props.subject === 'english') return '读一读，开口说英语'
  return '翻开书页，走进故事'
})
</script>

<template>
  <section
    id="knowledge-reading"
    class="lesson-reader"
    :class="`lesson-reader--${textSize}`"
    :data-subject="props.subject"
    aria-labelledby="knowledge-reading-title"
  >
    <header class="lesson-reader__header">
      <div class="lesson-reader__heading">
        <span class="lesson-reader__icon" aria-hidden="true">
          <AppIcon
            :name="props.subject === 'math' ? 'lightbulb' : 'book-open'"
            :size="26"
            decorative
          />
        </span>
        <div>
          <p class="lesson-reader__eyebrow">{{ introduction }}</p>
          <h2 id="knowledge-reading-title">
            {{ props.heading ?? (props.subject === 'math' ? '知识讲解' : '课文原文') }}
          </h2>
        </div>
      </div>
      <fieldset class="lesson-reader__sizes">
        <legend>正文字号</legend>
        <div class="lesson-reader__size-options">
          <label v-for="size in sizes" :key="size.value" class="lesson-reader__size-option">
            <input
              v-model="textSize"
              type="radio"
              :name="`${controlId}-reading-size`"
              :value="size.value"
              aria-controls="knowledge-reading-text"
            />
            <span>{{ size.label }}</span>
          </label>
        </div>
      </fieldset>
    </header>

    <p v-if="$slots.note" class="lesson-reader__note"><slot name="note" /></p>

    <EnglishReadAloud
      v-if="props.subject === 'english'"
      :blocks="props.speechBlocks ?? props.blocks"
      :muted="props.muted"
    />

    <div id="knowledge-reading-text" class="lesson-reader__paper">
      <span class="lesson-reader__bookmark" aria-hidden="true">
        <AppIcon name="book-open" :size="16" decorative />
      </span>
      <LessonContentRenderer
        :blocks="props.blocks"
        presentation="reading"
        :show-diagnostics="props.showDiagnostics"
        :practice-available="props.practiceAvailable"
        @start-assessment="emit('start-assessment')"
      />
      <div class="lesson-reader__end" aria-hidden="true">
        <span />
        <AppIcon name="book-open" :size="18" decorative />
        <span />
      </div>
    </div>
  </section>
</template>

<style src="../../styles/lesson-reader.css"></style>
