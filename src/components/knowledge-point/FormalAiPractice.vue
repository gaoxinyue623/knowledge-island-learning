<script setup lang="ts">
import { createUuid } from '@/utils/uuid'
import ContentFeedbackLink from '@/components/account/ContentFeedbackLink.vue'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { z } from 'zod'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { arithmeticScope, type AiContext, type AiSession } from '@/services/formal-ai/contract'
import { AiApiError, aiRequest, parseAiSession } from '@/services/formal-ai/client'

import { supportsAiPractice } from '@/services/formal-ai/reviewedSources'
const props = defineProps<{
  textbookId: string
  knowledgePointId: string
  difficulty?: number
  initialSessionId?: string
  reviewing?: boolean
}>()
const emit = defineEmits<{ completed: [] }>()
const { profileId } = useLearningProfile()
const supported = computed(() => supportsAiPractice(props.textbookId, props.knowledgePointId))
const context = computed<AiContext>(() => ({
  profileId: profileId.value,
  textbookId: props.textbookId,
  knowledgePointId: props.knowledgePointId,
}))
const username = ref<string | null>(null)
const busy = ref(false),
  error = ref(''),
  enabled = ref(false)
const session = shallowRef<AiSession | null>(null),
  draft = ref(''),
  requestId = ref<string | null>(null)
let epoch = 0,
  controller: AbortController | undefined
const current = computed(() =>
  session.value?.questions.find((q) =>
    props.reviewing ? q.feedback && !q.feedback.correct && !q.review?.correct : !q.feedback,
  ),
)
const choices = ref<string[]>([])
const blanks = ref<string[]>([])
const isArithmetic = computed(() => Boolean(arithmeticScope(props.knowledgePointId)))
const reviewTotal = computed(
  () => session.value?.questions.filter((q) => q.feedback && !q.feedback.correct).length ?? 0,
)
const completed = computed(
  () =>
    session.value?.questions.filter((q) =>
      props.reviewing ? q.feedback && !q.feedback.correct && q.review?.correct : q.feedback,
    ).length ?? 0,
)
const correct = computed(
  () => session.value?.questions.filter((q) => q.feedback?.correct).length ?? 0,
)
const answer = computed(() =>
  current.value?.kind === 'multipleChoice'
    ? choices.value
    : current.value?.kind === 'fillBlank'
      ? current.value.blankCount === 1
        ? draft.value.trim()
        : blanks.value.map((v) => v.trim())
      : !current.value?.kind || current.value.kind === 'calculation'
        ? Number(draft.value)
        : draft.value.trim(),
)
const validAnswer = computed(() => {
  const q = current.value
  if (!q) return false
  if (!q.kind || q.kind === 'calculation')
    return (
      (q.kind ? /^-?\d{1,5}(\.\d+)?$/ : /^-?\d{1,5}$/).test(draft.value.trim()) &&
      Math.abs(Number(draft.value)) <= 10000
    )
  if (q.kind === 'multipleChoice') return choices.value.length > 0
  if (q.kind === 'fillBlank' && (q.blankCount ?? 1) > 1)
    return blanks.value.length === q.blankCount && blanks.value.every((v) => v.trim().length > 0)
  return draft.value.trim().length > 0
})
function resetDraft() {
  draft.value = ''
  choices.value = []
  blanks.value = Array(current.value?.blankCount ?? 0).fill('')
}
watch(() => current.value?.id, resetDraft)

async function run(action: (version: number, signal: AbortSignal) => Promise<void>) {
  if (busy.value) return
  const version = epoch
  const active = new AbortController()
  controller = active
  busy.value = true
  error.value = ''
  try {
    await action(version, active.signal)
  } catch (caught) {
    if (version !== epoch) return
    error.value = caught instanceof Error ? caught.message : '暂时无法连接 AI 练习服务。'
    if (
      caught instanceof AiApiError &&
      ['AUTH_REQUIRED', 'SESSION_CHANGED'].includes(caught.code)
    ) {
      username.value = null
      session.value = null
    }
    if (
      caught instanceof AiApiError &&
      ['AI_GENERATION_FAILED', 'AI_VALIDATION_FAILED'].includes(caught.code)
    )
      requestId.value = null
  } finally {
    if (version === epoch) busy.value = false
  }
}
async function restore(version: number, signal: AbortSignal, account: string) {
  const currentContext = { ...context.value }
  const [status, saved] = await Promise.all([
    aiRequest('ai/status', { username: account, signal }),
    aiRequest(
      props.initialSessionId
        ? `ai/sessions/${encodeURIComponent(props.initialSessionId)}?${new URLSearchParams({ profileId: currentContext.profileId })}`
        : `ai/sessions?${new URLSearchParams(currentContext).toString()}`,
      {
        username: account,
        signal,
      },
    ),
  ])
  if (version !== epoch) return
  enabled.value = z.object({ enabled: z.boolean() }).parse(status).enabled
  const record = z.object({ session: z.unknown().nullable() }).parse(saved)
  session.value = record.session === null ? null : parseAiSession(saved, currentContext)
}
async function connect() {
  await run(async (version, signal) => {
    const raw = await aiRequest('session', { signal })
    if (version !== epoch) return
    const account = z.object({ username: z.string().nullable() }).parse(raw).username
    username.value = account
    if (account) await restore(version, signal, account)
  })
}
async function generate() {
  if (!username.value || !enabled.value) return
  await run(async (version, signal) => {
    const activeContext = { ...context.value }
    requestId.value ??= createUuid()
    const response = await aiRequest('ai/sessions', {
      username: username.value!,
      signal,
      body: {
        ...activeContext,
        requestId: requestId.value,
        ...(props.difficulty === undefined ? {} : { difficulty: props.difficulty }),
      },
    })
    if (version !== epoch) return
    session.value = parseAiSession(response, activeContext)
    requestId.value = null
    draft.value = ''
  })
}
async function submit() {
  if (!current.value || !session.value || !username.value || !validAnswer.value) return
  const questionId = current.value.id,
    sessionId = session.value.id,
    submittedAnswer = answer.value
  await run(async (version, signal) => {
    const activeContext = { ...context.value }
    const raw = await aiRequest(
      `ai/sessions/${sessionId}/${props.reviewing ? 'reviews' : 'answers'}`,
      {
        username: username.value!,
        signal,
        body: { questionId, answer: submittedAnswer, profileId: activeContext.profileId },
      },
    )
    if (version !== epoch) return
    const saved = parseAiSession(raw, activeContext)
    if (saved.id !== sessionId)
      throw new AiApiError('AI_SESSION_MISMATCH', '练习编号不一致，请刷新后重试。')
    session.value = saved
    resetDraft()
    if (!current.value) emit('completed')
  })
}
watch(
  () => [
    props.textbookId,
    props.knowledgePointId,
    profileId.value,
    props.initialSessionId,
    props.reviewing,
  ],
  () => {
    epoch++
    controller?.abort()
    busy.value = false
    error.value = ''
    session.value = null
    username.value = null
    enabled.value = false
    requestId.value = null
    draft.value = ''
    if (supported.value && profileId.value && props.textbookId) void connect()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  epoch++
  controller?.abort()
})
</script>

<template>
  <section v-if="supported" class="formal-ai" aria-label="AI 专项练习" :aria-busy="busy">
    <header>
      <span class="formal-ai__tag">{{
        reviewing ? 'AI 错题再练' : isArithmetic ? 'AI 计算专项' : 'AI 教材练习'
      }}</span>
      <h2>{{ reviewing ? '把方法再巩固一次' : '再练一练' }}</h2>
      <p>
        {{
          isArithmetic
            ? '围绕当前知识点出 3 道新题，答案经独立验算后才会交给你。'
            : 'AI 围绕当前知识点编排最多 3 道已审核教材题，按原题规则判分。'
        }}
      </p>
    </header>
    <p v-if="error" role="alert" class="formal-ai__error">{{ error }}</p>
    <p v-if="busy" role="status">
      {{ requestId ? '正在出题和检查答案，可能需要约一分钟……' : '正在连接并保存练习……' }}
    </p>
    <template v-if="!username">
      <p>请家长登录或注册账号，练习记录会保存在账号中。</p>
      <RouterLink
        :to="{ path: '/login', query: { redirect: $route.fullPath } }"
        class="formal-ai__button"
        >前往登录</RouterLink
      >
      <button
        type="button"
        class="formal-ai__button formal-ai__button--light"
        :disabled="busy"
        @click="connect()"
      >
        重新连接
      </button>
    </template>
    <template v-else>
      <p class="formal-ai__account">已连接家长账号 {{ username }}</p>
      <p v-if="!enabled && !busy">AI 出题暂未开放，已有练习仍可继续。</p>
      <template v-if="session">
        <div class="formal-ai__progress">
          <strong>{{ session.title }}</strong
          ><span
            >已完成 {{ completed }} / {{ reviewing ? reviewTotal : session.questions.length }}</span
          >
        </div>
        <progress
          :value="completed"
          :max="reviewing ? reviewTotal : session.questions.length"
          aria-label="AI 练习完成进度"
        />
        <ol class="formal-ai__answers">
          <li v-for="question in session.questions.filter((q) => q.feedback)" :key="question.id">
            <strong
              >{{ question.stem }}
              {{
                question.review?.correct
                  ? '再练已答对'
                  : question.feedback!.correct
                    ? '答对了'
                    : '再看一下方法'
              }}</strong
            >
            <p>
              你的答案：{{ question.feedback!.answer }} · 正确答案：{{
                question.feedback!.expected
              }}
            </p>
            <p>{{ question.feedback!.explanation }}</p>
            <ContentFeedbackLink category="ai" :content-id="`AI:${session.id}:${question.id}`" />
          </li>
        </ol>
        <form v-if="current" class="formal-ai__question" @submit.prevent="submit">
          <label for="formal-ai-answer"
            ><small>第 {{ completed + 1 }} 题</small><strong>{{ current.stem }}</strong></label
          >
          <fieldset v-if="current.options?.length" :disabled="busy">
            <legend>选择答案{{ current.kind === 'multipleChoice' ? '（可多选）' : '' }}</legend>
            <label v-for="option in current.options" :key="option.value" class="formal-ai__option">
              <input
                v-if="current.kind === 'multipleChoice'"
                v-model="choices"
                type="checkbox"
                :value="option.value"
              />
              <input v-else v-model="draft" type="radio" :value="option.value" name="ai-option" />
              <span>{{ option.label }}</span>
            </label>
          </fieldset>
          <template v-else-if="current.kind === 'fillBlank' && (current.blankCount ?? 1) > 1">
            <label v-for="(_, i) in blanks" :key="i"
              >第 {{ i + 1 }} 空
              <input v-model="blanks[i]" type="text" maxlength="200" :disabled="busy" />
            </label>
          </template>
          <input
            v-else
            id="formal-ai-answer"
            v-model="draft"
            type="text"
            :inputmode="!current.kind || current.kind === 'calculation' ? 'decimal' : 'text'"
            autocomplete="off"
            maxlength="500"
            :aria-label="!current.kind || current.kind === 'calculation' ? '计算答案' : '填写答案'"
            :disabled="busy"
          />
          <button class="formal-ai__button" :disabled="busy || !validAnswer">提交答案</button
          ><ContentFeedbackLink category="ai" :content-id="`AI:${session.id}:${current.id}`" />
        </form>
        <p v-else role="status" class="formal-ai__result">
          {{
            reviewing
              ? '这组错题已巩固，记录已保存。'
              : `这组练习完成啦！答对 ${correct} / ${session.questions.length} 题，记录已保存。`
          }}
        </p>
        <p class="formal-ai__note">
          {{ isArithmetic ? 'AI 生成 · 已通过自动验算。' : 'AI 编排 · 使用已审核教材题。' }}
          答题结果会辅助调整下一步建议，错题可在错题本再练。课程通关仍以正式练习为准。
        </p>
      </template>
      <button
        v-if="!reviewing && !initialSessionId && enabled && (!session || session.completed)"
        type="button"
        class="formal-ai__button"
        :disabled="busy"
        @click="generate"
      >
        {{
          busy
            ? '正在出题…'
            : requestId
              ? '重试获取这组题目'
              : session
                ? isArithmetic
                  ? '再练 3 道新题'
                  : '再编排一组练习'
                : isArithmetic
                  ? '让 AI 出 3 道题'
                  : '让 AI 编排教材练习'
        }}
      </button>
      <button
        v-if="error && !busy"
        type="button"
        class="formal-ai__button formal-ai__button--light"
        @click="connect()"
      >
        重新连接并恢复记录
      </button>
    </template>
  </section>
</template>

<style scoped>
.formal-ai {
  margin: 24px 0;
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid #cbded0;
  border-radius: 24px;
  background: linear-gradient(135deg, #f3f8ee, #fffdf6);
  color: #334837;
  display: grid;
  gap: 16px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.formal-ai h2 {
  font-size: 1.35rem;
  margin: 8px 0;
}
.formal-ai p {
  line-height: 1.7;
}
.formal-ai__tag {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #53724b;
}
.formal-ai__login {
  display: grid;
  gap: 12px;
  max-width: 440px;
}
.formal-ai__login label {
  display: grid;
  gap: 6px;
}
.formal-ai input {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #b5c9b6;
  border-radius: 12px;
  background: white;
  color: #263e2c;
  font: inherit;
  box-sizing: border-box;
}
.formal-ai__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.formal-ai__button {
  padding: 12px 18px;
  border: 1px solid #486747;
  border-radius: 14px;
  background: #486747;
  color: white;
  font-weight: 700;
  min-height: 44px;
  cursor: pointer;
  justify-self: start;
}
.formal-ai__button--light {
  background: white;
  color: #486747;
}
.formal-ai__button:disabled {
  opacity: 0.5;
  cursor: default;
}
.formal-ai input:focus-visible,
.formal-ai button:focus-visible {
  outline: 3px solid #b97829;
  outline-offset: 3px;
}
.formal-ai__question {
  display: grid;
  gap: 14px;
  max-width: 600px;
}
.formal-ai__question label {
  display: grid;
  gap: 10px;
}
.formal-ai__question strong {
  font-size: clamp(1.1rem, 3vw, 1.5rem);
}
.formal-ai__progress {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
}
.formal-ai progress {
  width: 100%;
  accent-color: #63864c;
  height: 12px;
}
.formal-ai__answers {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.formal-ai__answers li {
  background: #ffffffb3;
  border: 1px solid #d9e5d9;
  border-radius: 14px;
  padding: 14px;
}
.formal-ai__note,
.formal-ai__account,
.formal-ai small {
  font-size: 0.8rem;
  color: #526750;
}
.formal-ai__error {
  padding: 12px;
  border-radius: 12px;
  background: #fff0dc;
  color: #744c29;
}
.formal-ai__result {
  font-weight: 700;
}
.formal-ai__option {
  display: flex !important;
  align-items: center;
  gap: 12px;
  padding: 8px;
}
.formal-ai__option input {
  width: 20px;
  min-height: 20px;
}
.formal-ai fieldset {
  border: 1px solid #b5c9b6;
  border-radius: 12px;
  padding: 12px;
}
</style>
