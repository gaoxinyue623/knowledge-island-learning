<script setup lang="ts">
import {
  readExpressionReviews,
  saveExpression,
  type ExpressionReview,
} from '@/services/student-growth/expressionReviews'
import { computed, ref, watch } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Id } from '@/types'

interface Props {
  profileId?: string
  challengeId: Id
  title: string
  prompt: string
  hint?: string
  referenceAnswer?: string
  eyebrow?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  profileId: undefined,
  hint: '先说出你看到的对象，再说出你的理由。',
  referenceAnswer: '',
  eyebrow: '知识挑战',
  placeholder: '把你的想法写在这里……',
})

const response = ref('')
const submitted = ref(false)
const hintVisible = ref(false)
const savedRecord = ref<ExpressionReview | null>(null)
const saveMessage = ref('')
const writable = ref(true)
watch(
  () => [props.profileId, props.challengeId],
  () => {
    savedRecord.value = null
    response.value = ''
    submitted.value = false
    writable.value = true
    if (!props.profileId) return
    try {
      savedRecord.value =
        readExpressionReviews(props.profileId).find(
          (entry) => entry.contentId === props.challengeId,
        ) ?? null
      response.value = savedRecord.value?.response ?? ''
      submitted.value = Boolean(savedRecord.value?.submitted)
    } catch {
      writable.value = false
      saveMessage.value = '原表达记录暂时无法读取，请保留自己的文字。'
    }
  },
  { immediate: true },
)
function persistResponse(done: boolean): boolean {
  if (!props.profileId) return true
  if (!writable.value) return false
  try {
    saveExpression(props.profileId, {
      contentId: props.challengeId,
      title: props.title,
      prompt: props.prompt,
      response: response.value,
      submitted: done,
    })
    savedRecord.value =
      readExpressionReviews(props.profileId).find(
        (entry) => entry.contentId === props.challengeId,
      ) ?? null
    saveMessage.value = done ? '表达已保存，家长可以在学习报告中点评。' : '想法草稿已保存。'
    return true
  } catch {
    saveMessage.value = '表达暂时未能保存，请保留文字后重试。'
    return false
  }
}

const safeId = computed(() => {
  const normalized = props.challengeId.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `knowledge-challenge-${normalized || 'response'}`
})

function submitResponse(): void {
  if (!response.value.trim()) return
  response.value = response.value.trim()
  submitted.value = persistResponse(true)
}

function retryChallenge(): void {
  submitted.value = false
}
</script>

<template>
  <article class="knowledge-challenge-card" :aria-labelledby="`${safeId}-title`">
    <header class="knowledge-challenge-card__header">
      <span class="knowledge-challenge-card__stamp" aria-hidden="true">
        <AppIcon name="lightbulb" :size="24" decorative />
      </span>
      <div>
        <p class="knowledge-challenge-card__eyebrow">{{ props.eyebrow }}</p>
        <h3 :id="`${safeId}-title`">{{ props.title }}</h3>
      </div>
      <span v-if="submitted" class="knowledge-challenge-card__completed" aria-label="挑战已完成">
        <AppIcon name="check-circle" :size="18" decorative />
        已完成
      </span>
    </header>

    <p class="knowledge-challenge-card__prompt">{{ props.prompt }}</p>

    <div class="knowledge-challenge-card__field">
      <label :for="safeId">写下你的想法</label>
      <textarea
        :id="safeId"
        v-model="response"
        rows="4"
        :placeholder="props.placeholder"
        :aria-describedby="hintVisible ? `${safeId}-hint` : undefined"
      />
    </div>

    <div class="knowledge-challenge-card__actions">
      <AppButton
        :disabled="!response.trim() || submitted"
        icon-right="arrow-right"
        @click="submitResponse"
      >
        提交我的想法
      </AppButton>
      <AppButton
        v-if="profileId"
        variant="secondary"
        :disabled="!writable || submitted"
        @click="persistResponse(false)"
        >保存想法草稿</AppButton
      >
      <AppButton variant="soft" icon-left="lightbulb" @click="hintVisible = !hintVisible">
        {{ hintVisible ? '收起提示' : '查看提示' }}
      </AppButton>
    </div>

    <p
      v-if="hintVisible"
      :id="`${safeId}-hint`"
      class="knowledge-challenge-card__hint"
      role="status"
    >
      <AppIcon name="lightbulb" :size="18" decorative />
      {{ props.hint }}
    </p>
    <p v-if="submitted" class="knowledge-challenge-card__feedback" role="status">
      <AppIcon name="check" :size="18" decorative />
      {{
        profileId
          ? '表达已保存，等待家长点评；不自动评分。'
          : '挑战完成！这次只记录在本页，不改变掌握度。'
      }}
    </p>
    <p v-if="saveMessage" role="status">{{ saveMessage }}</p>
    <p v-if="savedRecord?.comment && submitted && savedRecord.response === response">
      <strong>家长的话：</strong>{{ savedRecord.comment }}
    </p>
    <p v-if="submitted && props.referenceAnswer" class="knowledge-challenge-card__answer">
      <strong>参考思路：</strong>{{ props.referenceAnswer }}
    </p>
    <AppButton v-if="submitted" variant="ghost" size="sm" @click="retryChallenge">
      再挑战一次
    </AppButton>
  </article>
</template>
