<script setup lang="ts">
import { computed } from 'vue'

import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

interface Props {
  question: QuestionViewModel
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()
const value = computed(() =>
  props.question.answerDraft.type === 'calculation' ? props.question.answerDraft.value : '',
)

function updateValue(nextValue: string) {
  if (props.question.submitted) return
  emit('update-draft', { type: 'calculation', value: nextValue })
}
</script>

<template>
  <fieldset class="question-answer-group" :disabled="props.question.submitted">
    <legend>请输入计算结果</legend>
    <label
      class="question-input-label question-input-label--wide"
      :for="`calculation-${props.question.id}`"
    >
      <span>答案</span>
      <input
        :id="`calculation-${props.question.id}`"
        type="text"
        inputmode="decimal"
        :value="value"
        :disabled="props.question.submitted"
        autocomplete="off"
        @input="updateValue(($event.target as HTMLInputElement).value)"
      />
    </label>
    <p class="question-answer-group__instruction">可以输入负号或小数点，请直接填写计算结果。</p>
  </fieldset>
</template>
