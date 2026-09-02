<script setup lang="ts">
import { computed } from 'vue'

import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

interface Props {
  question: QuestionViewModel
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()
const values = computed(() =>
  props.question.answerDraft.type === 'fillBlank' ? props.question.answerDraft.values : [''],
)

function updateValue(index: number, value: string) {
  if (props.question.submitted) return
  const next = [...values.value]
  next[index] = value
  emit('update-draft', { type: 'fillBlank', values: next })
}
</script>

<template>
  <fieldset class="question-answer-group" :disabled="props.question.submitted">
    <legend>请填写答案</legend>
    <div class="question-fill-blank-list">
      <label
        v-for="(_, index) in values"
        :key="index"
        class="question-input-label"
        :for="`blank-${props.question.id}-${index}`"
      >
        <span>第 {{ index + 1 }} 空</span>
        <input
          :id="`blank-${props.question.id}-${index}`"
          type="text"
          :value="values[index]"
          :disabled="props.question.submitted"
          autocomplete="off"
          @input="updateValue(index, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </fieldset>
</template>
