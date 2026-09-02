<script setup lang="ts">
import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

import QuestionContentRenderer from './QuestionContentRenderer.vue'

interface Props {
  question: QuestionViewModel
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()

function select(optionId: string) {
  if (props.question.submitted) return
  emit('update-draft', { type: 'singleChoice', optionId })
}
</script>

<template>
  <fieldset
    class="question-answer-group"
    :disabled="props.question.submitted"
    aria-describedby="question-answer-instruction"
  >
    <legend>请选择一个答案</legend>
    <p id="question-answer-instruction" class="question-answer-group__instruction">
      选择后仍可修改，提交后会锁定答案。
    </p>
    <label
      v-for="option in props.question.options"
      :key="option.id"
      class="question-option"
      :class="{
        'question-option--selected': option.isSelected,
        'question-option--correct': props.question.submitted && option.isCorrect,
      }"
      :for="option.id"
    >
      <input
        :id="option.id"
        type="radio"
        :name="`question-${props.question.id}`"
        :value="option.id"
        :checked="option.isSelected"
        :disabled="props.question.submitted"
        @change="select(option.id)"
      />
      <span class="question-option__key">{{ option.optionKey }}</span>
      <QuestionContentRenderer :blocks="option.content" />
    </label>
  </fieldset>
</template>
