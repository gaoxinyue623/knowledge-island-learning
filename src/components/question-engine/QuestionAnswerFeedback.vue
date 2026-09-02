<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { QuestionAttemptResult, QuestionExplanation } from '@/types'

import QuestionContentRenderer from './QuestionContentRenderer.vue'

interface Props {
  result: QuestionAttemptResult
  correctAnswerText?: string
  explanation: QuestionExplanation
}

const props = defineProps<Props>()
</script>

<template>
  <section
    class="question-feedback"
    :class="`question-feedback--${props.result.status}`"
    role="status"
    aria-live="polite"
    :aria-label="props.result.feedback"
  >
    <div class="question-feedback__headline">
      <AppIcon
        :name="
          props.result.status === 'correct'
            ? 'check-circle'
            : props.result.status === 'incorrect'
              ? 'alert-circle'
              : 'info'
        "
        :size="24"
        decorative
      />
      <strong>{{ props.result.feedback }}</strong>
      <span v-if="props.result.status !== 'manual_review_required'">
        {{ props.result.score }} / {{ props.result.maxScore }} 分
      </span>
    </div>
    <p v-if="props.result.status === 'manual_review_required'" class="question-feedback__copy">
      你的回答已经保存。本阶段不会使用 AI 自动判分。
    </p>
    <p v-else-if="props.result.status === 'incorrect'" class="question-feedback__copy">
      先看看下面的解析，再带着方法继续前进。
    </p>
    <p v-if="props.correctAnswerText" class="question-feedback__answer">
      <strong>参考答案：</strong>{{ props.correctAnswerText }}
    </p>
    <div class="question-feedback__explanation">
      <h3>解析</h3>
      <QuestionContentRenderer :blocks="props.explanation.summary" />
      <ol v-if="props.explanation.steps.length" class="question-feedback__steps">
        <li v-for="(step, index) in props.explanation.steps" :key="index">
          <span>{{ index + 1 }}</span>
          <QuestionContentRenderer :blocks="step" />
        </li>
      </ol>
    </div>
  </section>
</template>
