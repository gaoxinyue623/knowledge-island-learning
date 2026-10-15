<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import {
  readExpressionReviews,
  saveExpression,
  type ExpressionReview,
} from '@/services/student-growth/expressionReviews'
const props = defineProps<{ profileId: string; contentId: string; title: string; prompt: string }>()
const response = ref(''),
  record = ref<ExpressionReview | null>(null),
  message = ref(''),
  writable = ref(true)
watch(
  () => [props.profileId, props.contentId],
  () => {
    response.value = ''
    record.value = null
    message.value = ''
    writable.value = true
    try {
      record.value =
        readExpressionReviews(props.profileId).find(
          (entry) => entry.contentId === props.contentId,
        ) ?? null
      response.value = record.value?.response ?? ''
    } catch {
      writable.value = false
      message.value = '原表达记录暂时无法读取，仍可说给身边的人听。'
    }
  },
  { immediate: true },
)
function save(submitted: boolean) {
  if (!writable.value) return
  try {
    saveExpression(props.profileId, {
      contentId: props.contentId,
      title: props.title,
      prompt: props.prompt,
      response: response.value,
      submitted,
    })
    record.value =
      readExpressionReviews(props.profileId).find((entry) => entry.contentId === props.contentId) ??
      null
    message.value = submitted
      ? '已记下你的表达，请家长在学习报告中查看和点评。'
      : '想法草稿已保存，下次可以接着写。'
  } catch {
    message.value = '这次表达暂时未能保存，请保留文字后重试。'
  }
}
</script>
<template>
  <section class="expression-submission" aria-label="表达与家长点评">
    <h3>把你的发现分享给家人</h3>
    <p>可以先说出来，也可以写下几句话。这是表达记录，由家长点评，不自动判分。</p>
    <label
      >我的想法（选填）<textarea
        v-model="response"
        rows="3"
        maxlength="2000"
        placeholder="我发现了……，我的依据是……"
      />
    </label>
    <div>
      <AppButton variant="secondary" :disabled="!writable" @click="save(false)"
        >保存想法草稿</AppButton
      ><AppButton :disabled="!writable" @click="save(true)">{{
        record?.submitted ? '更新我的表达' : '我已经表达过，给家长看看'
      }}</AppButton>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="record?.comment && record.response === response">
      <strong>家长的话：</strong>{{ record.comment }}
    </p>
    <p v-else-if="record?.submitted">已提交，等待家长点评。</p>
  </section>
</template>
<style scoped>
.expression-submission {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  margin-top: 16px;
  background: #f7f9f0;
}
.expression-submission label {
  display: grid;
  gap: 8px;
}
.expression-submission textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font: inherit;
}
.expression-submission > div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
