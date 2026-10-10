<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import AppShell from '@/layouts/AppShell.vue'
import { accountRequest } from '@/services/account/securityService'
import {
  feedbackCategories,
  feedbackStatuses,
  feedbackTicket,
  type FeedbackTicket,
} from '@/services/feedback/contract'
import '@/styles/account-tools.css'
const tickets = ref<FeedbackTicket[]>([]),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  more = ref(false)
const replies = ref<Record<string, string>>({}),
  statuses = ref<Record<string, FeedbackTicket['status']>>({})
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败，请重试。'
  } finally {
    busy.value = false
  }
}
async function refresh(append = false) {
  const before = append ? tickets.value.at(-1)?.sequence : undefined
  const data = z
    .object({ tickets: z.array(feedbackTicket) })
    .parse(await accountRequest(`feedback/manage${before ? `?before=${before}` : ''}`))
  tickets.value = append ? [...tickets.value, ...data.tickets] : data.tickets
  for (const ticket of data.tickets) {
    replies.value[ticket.id] = ticket.reply
    statuses.value[ticket.id] = ticket.status
  }
  more.value = data.tickets.length === 50
}
async function save(ticket: FeedbackTicket) {
  const data = z.object({ ticket: feedbackTicket }).parse(
    await accountRequest('feedback/manage', 'POST', {
      id: ticket.id,
      revision: ticket.revision,
      reply: replies.value[ticket.id],
      status: statuses.value[ticket.id],
    }),
  )
  tickets.value = tickets.value.map((item) => (item.id === ticket.id ? data.ticket : item))
  notice.value = '处理结果已保存，提交者可以在自己的反馈页查看。'
}
onMounted(() => run(() => refresh()))
</script>
<template>
  <AppShell context="反馈处理">
    <div class="account-tools">
      <RouterLink to="/feedback">← 我的反馈</RouterLink>
      <h1>反馈处理</h1>
      <p>仅开放给已配置的管理账号。处理回复会展示给提交者。</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <button :disabled="busy" @click="run(() => refresh())">刷新列表</button>
      <p v-if="!tickets.length && !busy && !error">暂无反馈。</p>
      <article v-for="ticket in tickets" :key="ticket.id">
        <h2>{{ feedbackCategories[ticket.category] }} · {{ feedbackStatuses[ticket.status] }}</h2>
        <small>{{ ticket.id }} · {{ new Date(ticket.createdAt).toLocaleString('zh-CN') }}</small>
        <p>页面：{{ ticket.page }}<br />内容：{{ ticket.contentId || '未填写' }}</p>
        <p class="feedback-copy">{{ ticket.message }}</p>
        <form @submit.prevent="run(() => save(ticket))">
          <label
            >处理状态<select v-model="statuses[ticket.id]" :disabled="busy">
              <option v-for="(label, key) in feedbackStatuses" :key="key" :value="key">
                {{ label }}
              </option>
            </select></label
          >
          <label
            >回复提交者<textarea
              v-model="replies[ticket.id]"
              required
              minlength="2"
              maxlength="2000"
              :disabled="busy"
            />
          </label>
          <button :disabled="busy">保存处理结果</button>
        </form>
      </article>
      <button v-if="more" :disabled="busy" @click="run(() => refresh(true))">加载更多</button>
    </div>
  </AppShell>
</template>
