<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  readExpressionReviews,
  saveParentComment,
  type ExpressionReview,
} from '@/services/student-growth/expressionReviews'
const props = defineProps<{ profileId: string }>()
const entries = ref<ExpressionReview[]>([]),
  drafts = ref<Record<string, string>>({}),
  message = ref('')
function load() {
  try {
    entries.value = readExpressionReviews(props.profileId).filter((entry) => entry.submitted)
    drafts.value = Object.fromEntries(
      entries.value.map((entry) => [entry.contentId, entry.comment]),
    )
    message.value = ''
  } catch {
    entries.value = []
    message.value = '表达记录暂时无法读取，原记录已保留。'
  }
}
watch(() => props.profileId, load, { immediate: true })
function save(id: string) {
  try {
    saveParentComment(props.profileId, id, drafts.value[id] ?? '')
    load()
    message.value = '点评已保存，孩子回到活动页面就能看到。'
  } catch (e) {
    message.value = e instanceof Error ? e.message : '点评暂时未能保存。'
  }
}
</script>
<template>
  <section class="parent-report-page__section" aria-label="孩子的开放表达">
    <h2>听听孩子怎么说</h2>
    <p>
      这里显示当前档案的全部表达记录，包括孩子自行记录的口头或书面表达。点评不计入自动评分或掌握度。
    </p>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="!entries.length">孩子提交开放表达后，可以在这里查看和点评。</p>
    <article
      v-for="entry in entries.slice(0, 20)"
      :key="entry.contentId"
      style="display: grid; gap: 12px; margin-block: 16px"
    >
      <h3>{{ entry.title }} · {{ entry.reviewedAt ? '已点评' : '等待点评' }}</h3>
      <p>{{ entry.prompt }}</p>
      <blockquote>
        {{ entry.response || '孩子标记已口头表达，可以请孩子当面再讲一遍。' }}
      </blockquote>
      <label
        >家长点评<textarea
          v-model="drafts[entry.contentId]"
          rows="2"
          maxlength="1000"
          placeholder="你讲清楚了……；下次可以试试……"
          style="width: 100%; padding: 12px; font: inherit"
        />
      </label>
      <button class="app-button app-button--secondary" @click="save(entry.contentId)">
        保存点评
      </button>
    </article>
  </section>
</template>
