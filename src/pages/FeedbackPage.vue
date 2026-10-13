<script setup lang="ts">
import { createUuid } from '@/utils/uuid'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import AppShell from '@/layouts/AppShell.vue'
import { accountRequest } from '@/services/account/securityService'
import {
  feedbackInput,
  feedbackCategories,
  feedbackStatuses,
  feedbackTicket,
  type FeedbackTicket,
} from '@/services/feedback/contract'
import '@/styles/account-tools.css'
const route = useRoute()
const candidate = typeof route.query.from === 'string' ? route.query.from : '/feedback'
const source = /^\/(?!\/)[a-zA-Z0-9_\-/]*$/.test(candidate) ? candidate.slice(0, 300) : '/feedback'
const sourceTitle = String(useRouter().resolve(source).meta.title ?? '刚才的页面')
const attachedContent =
  typeof route.query.contentId === 'string' && route.query.contentId.length > 0
const contentId = ref(
  typeof route.query.contentId === 'string' ? route.query.contentId.slice(0, 200) : '',
)
const category = ref<keyof typeof feedbackCategories>(
    typeof route.query.category === 'string' &&
      Object.hasOwn(feedbackCategories, route.query.category)
      ? (route.query.category as keyof typeof feedbackCategories)
      : 'content',
  ),
  message = ref(''),
  tickets = ref<FeedbackTicket[]>([]),
  canManage = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref('')
let requestId = createUuid()
let pending:
  | {
      id: string
      category: keyof typeof feedbackCategories
      message: string
      page: string
      contentId: string
    }
  | undefined
async function refresh() {
  const data = z
    .object({ tickets: z.array(feedbackTicket), canManage: z.boolean() })
    .parse(await accountRequest('feedback'))
  tickets.value = data.tickets
  canManage.value = data.canManage
}
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败，请重试。'
  } finally {
    busy.value = false
  }
}
async function submit() {
  notice.value = ''
  // Retain the submitted body after a timeout so retries cannot create duplicate tickets.
  const validation = feedbackInput.safeParse({
    id: requestId,
    category: category.value,
    message: message.value,
    page: source,
    contentId: contentId.value,
  })
  if (!pending && !validation.success) throw new Error('请填写 5～2000 字的问题描述。')
  pending ??= {
    id: requestId,
    category: category.value,
    message: message.value,
    page: source,
    contentId: contentId.value,
  }
  await accountRequest('feedback', 'POST', pending)
  requestId = createUuid()
  pending = undefined
  message.value = ''
  notice.value = '反馈已收到。处理进展和回复会显示在下方，可稍后回来查看。'
  await refresh()
}
function newDraft() {
  pending = undefined
  requestId = createUuid()
  error.value = ''
  notice.value = '已开始新反馈，先前提交是否成功可点击刷新查看。'
}
onMounted(() => run(refresh))
</script>
<template>
  <AppShell context="问题与建议" show-bottom-nav>
    <div class="account-tools content-container">
      <RouterLink to="/profile">← 我的知识岛</RouterLink>
      <h1>问题与建议</h1>
      <p>遇到题目、教材或使用问题，可以告诉我们。反馈记录跟随当前账号保存。</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <section>
        <h2>告诉我们遇到了什么</h2>
        <form @submit.prevent="run(submit)">
          <label
            >问题类型<select v-model="category" :disabled="busy || !!pending">
              <option v-for="(label, key) in feedbackCategories" :key="key" :value="key">
                {{ label }}
              </option>
            </select></label
          >
          <p>相关页面：{{ sourceTitle }}</p>
          <p v-if="attachedContent">已自动关联具体内容，无需再填写题目编号。</p>
          <label v-if="!attachedContent"
            >相关课文、题目或教材（选填）<input
              v-model="contentId"
              maxlength="200"
              :disabled="busy || !!pending"
              placeholder="例如：一年级下册数学，或题目名称"
          /></label>
          <label
            >具体问题<textarea
              v-model="message"
              minlength="5"
              maxlength="2000"
              required
              :disabled="busy || !!pending"
              placeholder="请描述遇到的问题、操作步骤或你的建议。请勿填写密码、恢复码等私密信息。"
            />
          </label>
          <small>{{ message.length }} / 2000 字 · 我们会保存此页面路径和你填写的内容。</small>
          <div class="actions">
            <button :disabled="busy">
              {{ busy ? '正在处理…' : pending ? '重试这份反馈' : '提交反馈' }}</button
            ><button v-if="pending" type="button" :disabled="busy" @click="newDraft">
              开始新的反馈
            </button>
          </div>
        </form>
      </section>
      <div class="actions">
        <h2>我的反馈（{{ tickets.length }}）</h2>
        <button :disabled="busy" @click="run(refresh)">刷新进展</button
        ><RouterLink v-if="canManage" to="/feedback/manage">处理用户反馈 →</RouterLink>
      </div>
      <p v-if="!tickets.length && !busy">还没有反馈记录。提交后可在这里查看进展。</p>
      <article v-for="ticket in tickets" :key="ticket.id">
        <h2>{{ feedbackCategories[ticket.category] }} · {{ feedbackStatuses[ticket.status] }}</h2>
        <small
          >编号 {{ ticket.id.slice(0, 8) }} ·
          {{ new Date(ticket.createdAt).toLocaleString('zh-CN') }}</small
        >
        <details v-if="ticket.contentId">
          <summary>查看关联内容</summary>
          <p class="feedback-copy">{{ ticket.contentId }}</p>
        </details>
        <p class="feedback-copy">{{ ticket.message }}</p>
        <p v-if="ticket.reply" class="feedback-copy">
          <strong>处理回复：</strong>{{ ticket.reply }}
        </p>
        <small v-if="ticket.reply"
          >更新于 {{ new Date(ticket.updatedAt).toLocaleString('zh-CN') }}</small
        >
      </article>
    </div>
  </AppShell>
</template>
