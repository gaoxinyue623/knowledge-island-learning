<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Id } from '@/types'

interface Props {
  challengeId: Id
  title: string
  prompt: string
  hint?: string
  referenceAnswer?: string
  eyebrow?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  hint: '先说出你看到的对象，再说出你的理由。',
  referenceAnswer: '',
  eyebrow: '知识挑战',
  placeholder: '把你的想法写在这里……',
})

const response = ref('')
const submitted = ref(false)
const hintVisible = ref(false)

const safeId = computed(() => {
  const normalized = props.challengeId.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `knowledge-challenge-${normalized || 'response'}`
})

function submitResponse(): void {
  if (!response.value.trim()) return
  response.value = response.value.trim()
  submitted.value = true
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
      挑战完成！这次只记录在本页，不改变掌握度。
    </p>
    <p v-if="submitted && props.referenceAnswer" class="knowledge-challenge-card__answer">
      <strong>参考思路：</strong>{{ props.referenceAnswer }}
    </p>
    <AppButton v-if="submitted" variant="ghost" size="sm" @click="retryChallenge">
      再挑战一次
    </AppButton>
  </article>
</template>
