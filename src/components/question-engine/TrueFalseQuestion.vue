<script setup lang="ts">
import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'

interface Props {
  question: QuestionViewModel
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()

function select(value: boolean) {
  if (props.question.submitted) return
  emit('update-draft', { type: 'trueFalse', value })
}

function selected(value: boolean): boolean {
  return (
    props.question.answerDraft.type === 'trueFalse' && props.question.answerDraft.value === value
  )
}
</script>

<template>
  <fieldset
    class="question-answer-group question-answer-group--binary"
    :disabled="props.question.submitted"
    aria-describedby="question-answer-instruction"
  >
    <legend>请选择正确或错误</legend>
    <p id="question-answer-instruction" class="question-answer-group__instruction">
      选择一个判断，提交后会显示解析。
    </p>
    <label class="question-binary-option" for="true-false-true">
      <input
        id="true-false-true"
        type="radio"
        :name="`question-${props.question.id}`"
        :checked="selected(true)"
        :disabled="props.question.submitted"
        @change="select(true)"
      />
      <span>正确</span>
    </label>
    <label class="question-binary-option" for="true-false-false">
      <input
        id="true-false-false"
        type="radio"
        :name="`question-${props.question.id}`"
        :checked="selected(false)"
        :disabled="props.question.submitted"
        @change="select(false)"
      />
      <span>错误</span>
    </label>
  </fieldset>
</template>
