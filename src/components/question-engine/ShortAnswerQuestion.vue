<script setup lang="ts">
import { computed } from 'vue'

import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

interface Props {
  question: QuestionViewModel
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()
const value = computed(() =>
  props.question.answerDraft.type === 'shortAnswer' ? props.question.answerDraft.value : '',
)

function updateValue(nextValue: string) {
  if (props.question.submitted) return
  emit('update-draft', { type: 'shortAnswer', value: nextValue })
}
</script>

<template>
  <fieldset class="question-answer-group" :disabled="props.question.submitted">
    <legend>请写下你的想法</legend>
    <label
      class="question-input-label question-input-label--wide"
      :for="`short-answer-${props.question.id}`"
    >
      <span>你的回答</span>
      <textarea
        :id="`short-answer-${props.question.id}`"
        rows="4"
        :value="value"
        :disabled="props.question.submitted"
        @input="updateValue(($event.target as HTMLTextAreaElement).value)"
      />
    </label>
    <p class="question-answer-group__instruction">
      写下自己的回答，提交后对照参考答案检查。这道开放题不计入自动评分成绩。
    </p>
  </fieldset>
</template>
