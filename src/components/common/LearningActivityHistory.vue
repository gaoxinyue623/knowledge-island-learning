<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ACTIVITY_HISTORY_CHANGED,
  readActivityHistory,
  type LearningActivity,
} from '@/services/learning-activity/activityHistory'
const props = defineProps<{
  profileId: string
  startDate?: string
  endDate?: string
  subject?: string
  mistakesOnly?: boolean
}>()
const records = ref<LearningActivity[]>([]),
  warning = ref('')
function load() {
  try {
    records.value = readActivityHistory(props.profileId)
    warning.value = ''
  } catch {
    records.value = []
    warning.value = '活动记录暂时无法读取，原记录已保留。'
  }
}
const visible = computed(() =>
  records.value.filter((record) => {
    const date = new Date(record.occurredAt)
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return (
      (!props.startDate || day >= props.startDate) &&
      (!props.endDate || day <= props.endDate) &&
      (!props.subject || props.subject === 'ALL' || record.subject === props.subject) &&
      (!props.mistakesOnly || record.mistakeCount > 0)
    )
  }),
)
watch(() => props.profileId, load, { immediate: true })
onMounted(() => {
  window.addEventListener(ACTIVITY_HISTORY_CHANGED, load)
  window.addEventListener('storage', load)
})
onBeforeUnmount(() => {
  window.removeEventListener(ACTIVITY_HISTORY_CHANGED, load)
  window.removeEventListener('storage', load)
})
</script>
<template>
  <section class="personal-panel" aria-label="阅读与思维活动记录">
    <h2>{{ mistakesOnly ? '闯关中需要回顾的练习' : '阅读与思维活动' }}</h2>
    <p>记录完成的闯关与思维练习，帮助回顾学习过程；不计作教材掌握度。</p>
    <p v-if="warning" role="alert">{{ warning }}</p>
    <p v-else-if="!visible.length">当前范围还没有这类活动记录。</p>
    <p v-else>共 {{ visible.length }} 次完成活动</p>
    <ol v-if="visible.length">
      <li v-for="record in visible.slice(0, 50)" :key="record.id" style="margin-block: 12px">
        <RouterLink :to="record.href">{{ record.title }}</RouterLink>
        <p>
          {{ new Date(record.occurredAt).toLocaleString('zh-CN') }} · 完成
          {{ record.completedCount }} 项<span v-if="record.mistakeCount">
            · {{ record.mistakeCount }} 项曾答错，可以回顾再练</span
          >
        </p>
      </li>
    </ol>
  </section>
</template>
