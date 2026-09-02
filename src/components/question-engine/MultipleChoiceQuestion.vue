<script setup lang="ts">
import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

import QuestionContentRenderer from './QuestionContentRenderer.vue'

interface Props {
  question: QuestionViewModel
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()

function selectedIds(): string[] {
  if (props.question.answerDraft.type !== 'multipleChoice') return []
  return [...props.question.answerDraft.optionIds]
}

function toggle(optionId: string) {
  if (props.question.submitted) return
  const next = new Set(selectedIds())
  if (next.has(optionId)) next.delete(optionId)
  else next.add(optionId)
  emit('update-draft', { type: 'multipleChoice', optionIds: [...next] })
}
</script>

<template>
  <fieldset
    class="question-answer-group"
    :disabled="props.question.submitted"
    aria-describedby="question-answer-instruction"
  >
    <legend>请选择所有符合条件的答案</legend>
    <p id="question-answer-instruction" class="question-answer-group__instruction">
      可以选择多个答案，提交前可以取消选择。
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
        type="checkbox"
        :name="`question-${props.question.id}`"
        :value="option.id"
        :checked="option.isSelected"
        :disabled="props.question.submitted"
        @change="toggle(option.id)"
      />
      <span class="question-option__key">{{ option.optionKey }}</span>
      <QuestionContentRenderer :blocks="option.content" />
    </label>
  </fieldset>
</template>
