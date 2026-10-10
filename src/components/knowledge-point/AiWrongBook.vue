<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { readAiSignals, type AiLearningSignal } from '@/services/formal-ai/signals'
const props = defineProps<{ profileId: string; includeResolved: boolean; refresh: number }>()
const signals = ref<AiLearningSignal[]>([])
const error = ref('')
let version = 0
const records = computed(() => {
  const latest = new Map<string, AiLearningSignal>()
  for (const signal of signals.value) latest.set(`${signal.sessionId}:${signal.questionId}`, signal)
  const originallyWrong = new Set(
    signals.value.filter((s) => !s.correct).map((s) => `${s.sessionId}:${s.questionId}`),
  )
  return [...latest.values()]
    .filter(
      (s) =>
        originallyWrong.has(`${s.sessionId}:${s.questionId}`) &&
        (props.includeResolved || !s.resolved),
    )
    .reverse()
})
watch(
  () => [props.profileId, props.refresh],
  async () => {
    const current = ++version
    signals.value = []
    error.value = ''
    try {
      const data = await readAiSignals(props.profileId)
      if (current === version) signals.value = data
    } catch (caught) {
      if (current === version)
        error.value = caught instanceof Error ? caught.message : 'AI 错题暂时无法读取。'
    }
  },
  { immediate: true },
)
</script>
<template>
  <section aria-label="AI 练习错题" class="ai-wrong-book">
    <h2>
      AI 练习错题 <small>{{ records.length }} 道</small>
    </h2>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="!records.length">当前没有{{ includeResolved ? '' : '待巩固的' }} AI 错题。</p>
    <ol v-else>
      <li v-for="record in records" :key="record.questionId">
        <span>{{ record.resolved ? '已解决' : '待巩固' }}</span>
        <h3>{{ record.stem }}</h3>
        <RouterLink :to="`/ai-review/${record.sessionId}`">{{
          record.resolved ? '查看练习记录' : '再练这组错题'
        }}</RouterLink>
      </li>
    </ol>
  </section>
</template>
<style scoped>
.ai-wrong-book {
  margin: 24px 0;
  padding: 20px;
  background: #f3f8ee;
  border-radius: 20px;
}
ol {
  display: grid;
  gap: 16px;
  padding: 0;
  list-style: none;
}
li {
  padding: 16px;
  background: white;
  border-radius: 14px;
}
h3 {
  margin: 8px 0;
}
a {
  display: inline-block;
  padding: 12px 0;
  color: #486747;
}
small,
span {
  font-size: 13px;
}
</style>
