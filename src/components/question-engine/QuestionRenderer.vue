<script setup lang="ts">
import { computed, type Component } from 'vue'

import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

import CalculationQuestion from './CalculationQuestion.vue'
import FillBlankQuestion from './FillBlankQuestion.vue'
import MultipleChoiceQuestion from './MultipleChoiceQuestion.vue'
import QuestionAnswerFeedback from './QuestionAnswerFeedback.vue'
import QuestionContentRenderer from './QuestionContentRenderer.vue'
import QuestionMediaRenderer from './QuestionMediaRenderer.vue'
import ShortAnswerQuestion from './ShortAnswerQuestion.vue'
import SingleChoiceQuestion from './SingleChoiceQuestion.vue'
import TrueFalseQuestion from './TrueFalseQuestion.vue'
import UnsupportedQuestion from './UnsupportedQuestion.vue'

interface Props {
  question: QuestionViewModel
  showDiagnostics?: boolean
}

const props = withDefaults(defineProps<Props>(), { showDiagnostics: false })
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()

const componentByType: Record<string, Component> = {
  singleChoice: SingleChoiceQuestion,
  multipleChoice: MultipleChoiceQuestion,
  trueFalse: TrueFalseQuestion,
  fillBlank: FillBlankQuestion,
  calculation: CalculationQuestion,
  shortAnswer: ShortAnswerQuestion,
}

const questionTypeLabel: Record<string, string> = {
  singleChoice: '单项选择',
  multipleChoice: '多项选择',
  trueFalse: '判断题',
  fillBlank: '填空题',
  calculation: '计算题',
  shortAnswer: '简答题',
}

const answerComponent = computed(() => componentByType[props.question.type] ?? null)
const typeLabel = computed(() => questionTypeLabel[props.question.type] ?? '题目')
</script>

<template>
  <article class="question-renderer" :aria-labelledby="`question-stem-${props.question.id}`">
    <header class="question-renderer__header">
      <span class="question-renderer__type">{{ typeLabel }}</span>
      <span v-if="props.question.submitted" class="question-renderer__locked">已提交 · 已锁定</span>
    </header>
    <div :id="`question-stem-${props.question.id}`" class="question-renderer__stem">
      <QuestionContentRenderer :blocks="props.question.stem" />
    </div>
    <QuestionMediaRenderer :media="props.question.media" />
    <component
      :is="answerComponent"
      v-if="answerComponent"
      :question="props.question"
      @update-draft="emit('update-draft', $event)"
    />
    <UnsupportedQuestion
      v-else
      :type="props.question.type"
      :show-diagnostics="props.showDiagnostics"
    />
    <QuestionAnswerFeedback
      v-if="props.question.submitted && props.question.result"
      :result="props.question.result"
      :correct-answer-text="props.question.correctAnswerText"
      :explanation="props.question.explanation"
    />
  </article>
</template>
