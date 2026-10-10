<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLearningProfile } from '@/composables/useLearningProfile'
import AppShell from '@/layouts/AppShell.vue'
import FormalAiPractice from '@/components/knowledge-point/FormalAiPractice.vue'
import { aiRequest } from '@/services/formal-ai/client'
import { aiSessionSchema, type AiSession } from '@/services/formal-ai/contract'
import { accountOwner } from '@/services/account/storage'
import { readAiSignals } from '@/services/formal-ai/signals'
import { z } from 'zod'
const route = useRoute()
const { profileId } = useLearningProfile()
const session = ref<AiSession | null>(null)
const error = ref('')
let epoch = 0
watch(
  () => [route.params.sessionId, profileId.value],
  async () => {
    const version = ++epoch
    session.value = null
    error.value = ''
    try {
      const username = accountOwner()
      if (!username) throw new Error('请先登录账号。')
      const raw = await aiRequest(
        `ai/sessions/${encodeURIComponent(String(route.params.sessionId))}?${new URLSearchParams({ profileId: profileId.value })}`,
        { username },
      )
      const saved = z.object({ session: aiSessionSchema }).parse(raw).session
      if (saved.profileId !== profileId.value) throw new Error('练习不属于当前学习档案。')
      if (version === epoch) session.value = saved
    } catch (caught) {
      if (version === epoch)
        error.value = caught instanceof Error ? caught.message : '练习暂时无法读取。'
    }
  },
  { immediate: true },
)
async function refreshEvidence() {
  await readAiSignals(profileId.value).catch(() => {})
}
</script>
<template>
  <AppShell show-bottom-nav context="AI 错题再练">
    <main class="content-container ai-review-page">
      <RouterLink to="/wrong-book">← 返回错题本</RouterLink>
      <h1>AI 错题再练</h1>
      <p v-if="error" role="alert">{{ error }}</p>
      <FormalAiPractice
        v-else-if="session"
        :textbook-id="session.textbookId"
        :knowledge-point-id="session.knowledgePointId"
        :initial-session-id="session.id"
        reviewing
        @completed="refreshEvidence"
      />
      <p v-else role="status">正在恢复练习……</p>
    </main>
  </AppShell>
</template>
<style scoped>
.ai-review-page {
  max-width: 720px;
  padding: 24px 20px;
}
</style>
