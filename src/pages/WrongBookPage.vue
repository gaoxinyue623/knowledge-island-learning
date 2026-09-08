<script setup lang="ts">
import LearningActivityHistory from '@/components/common/LearningActivityHistory.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import { phase12DemoQuestionSession } from '@/data/learning-history'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { questionRepository, questionSessionStorage } from '@/services/question-engine'
import { wrongBookService } from '@/services/wrong-book'
import { useWrongBookStore } from '@/stores/wrongBookStore'
import type { Id, Question, WrongQuestionRecord } from '@/types'

const router = useRouter()
const route = useRoute()
const wrongBookStore = useWrongBookStore()

const includeResolved = ref(false)
const actionMessage = ref<string | null>(null)
const questionTitles = ref<Record<Id, string>>({})
const questionLoading = ref(false)
const isDevRoute = computed(() => route.path.startsWith('/dev/wrong-book'))
const { profileId } = useLearningProfile()
const records = computed(() => wrongBookStore.records)
const focusedQuestionId = computed(() =>
  typeof route.query.questionId === 'string' ? route.query.questionId : undefined,
)
const displayedRecords = computed(() => {
  if (!focusedQuestionId.value) return records.value
  return [...records.value].sort(
    (left, right) =>
      Number(right.questionId === focusedQuestionId.value) -
      Number(left.questionId === focusedQuestionId.value),
  )
})
const historyPath = computed(() => (isDevRoute.value ? '/dev/history' : '/history'))
const reviewQueuePath = computed(() => (isDevRoute.value ? '/dev/review-queue' : '/review-queue'))
const demoSeeded = ref(false)

function loadWrongBook() {
  actionMessage.value = null
  wrongBookStore.load(profileId.value, {
    includeResolved: includeResolved.value,
    includeSample: isDevRoute.value,
  })
  const existingDevRecords = isDevRoute.value
    ? wrongBookService.listByProfile(profileId.value, {
        includeResolved: true,
        includeSample: true,
      })
    : records.value
  if (isDevRoute.value && !demoSeeded.value && !existingDevRecords.length) {
    questionSessionStorage.save(phase12DemoQuestionSession)
    wrongBookService.projectQuestionSession(profileId.value, phase12DemoQuestionSession, {
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
      textbookId: phase12DemoQuestionSession.textbookId,
      unitId: phase12DemoQuestionSession.unitId,
      lessonId: phase12DemoQuestionSession.lessonId,
      supportedQuestionIds: new Set(phase12DemoQuestionSession.questionIds),
      questionKnowledgePoints: new Map(
        phase12DemoQuestionSession.questionIds.map((questionId) => [
          questionId,
          [phase12DemoQuestionSession.knowledgePointId],
        ]),
      ),
    })
    demoSeeded.value = true
    wrongBookStore.load(profileId.value, {
      includeResolved: includeResolved.value,
      includeSample: true,
    })
  }
  void loadQuestionTitles()
}

let titleVersion = 0
async function loadQuestionTitles() {
  const version = ++titleVersion
  const requestedRecords = [...records.value]
  questionTitles.value = {}
  questionLoading.value = true
  const nextTitles: Record<Id, string> = {}
  try {
    for (const record of requestedRecords) {
      const question = await questionRepository.getQuestionById(
        record.questionId,
        record.provenance.isSampleDerived ? 'demo' : 'profile',
      )
      const title = question ? textFromQuestion(question) : ''
      if (title) nextTitles[record.questionId] = title
    }
    if (version === titleVersion) questionTitles.value = nextTitles
  } catch {
    if (version === titleVersion) actionMessage.value = '题目标题暂时无法读取，可刷新重试。'
  } finally {
    if (version === titleVersion) questionLoading.value = false
  }
}

function textFromQuestion(question: Question): string {
  return (
    question.stem
      .map((block) => block.text?.trim() ?? '')
      .filter(Boolean)
      .join(' ') || `题目 ${question.id}`
  )
}

function openRetry(record: WrongQuestionRecord) {
  const launch = wrongBookStore.getRetryLaunch(record)
  if (!launch) {
    actionMessage.value = '找不到这道题原来的练习会话，暂时不能开始重练。'
    return
  }
  void router.push({
    path: isDevRoute.value ? '/dev/question-engine' : '/assessment',
    query: {
      textbookId: launch.context.textbookId,
      unitId: launch.context.unitId,
      lessonId: launch.context.lessonId,
      knowledgePointId: launch.context.knowledgePointId,
      source: 'wrong_book',
      retryQuestionId: record.questionId,
      sessionScope: launch.sessionScope,
      ...(isDevRoute.value ? { dataset: 'demo' } : {}),
      returnTo: isDevRoute.value ? '/dev/wrong-book' : '/wrong-book',
    },
  })
}

function reopen(record: WrongQuestionRecord) {
  wrongBookStore.markActive(record.questionId)
  actionMessage.value = '这道题已经回到待处理的错题列表。'
}

function clearDemoWrongBook() {
  wrongBookStore.clearDemoWrongBook()
  actionMessage.value = '开发样本已经清理，正式错题不受影响。'
}

function toggleResolved() {
  includeResolved.value = !includeResolved.value
  loadWrongBook()
}

function statusLabel(record: WrongQuestionRecord): string {
  return record.status === 'active' ? '待巩固' : '已解决'
}

function sourceWarningLabel(
  status: WrongQuestionRecord['provenance']['verificationStatus'],
  textbookId?: WrongQuestionRecord['textbookId'],
) {
  if (isPilotTextbook(textbookId)) return null
  if (!status || status === 'VERIFIED' || status === 'REVIEWED' || status === 'SAMPLE') return null
  return status === 'UNVERIFIED' ? '来源待核验' : '来源异常'
}

watch(profileId, loadWrongBook, { immediate: true })
</script>

<template>
  <AppShell :show-bottom-nav="!isDevRoute" :context="isDevRoute ? 'DEV / 错题本' : '错题本'">
    <LearningActivityHistory v-if="!isDevRoute" :profile-id="profileId" mistakes-only />
    <div class="phase12-page content-container wrong-book-page">
      <RouterLink v-if="!isDevRoute" class="personal-back" to="/profile"
        >← 返回我的学习空间</RouterLink
      >
      <header class="phase12-page__header">
        <div>
          <p class="curriculum-eyebrow">每一次改正，都是新的进步</p>
          <h1>错题本</h1>
          <p>这里收录教材练习中已经提交并判为答错的题目。</p>
        </div>
        <div class="phase12-page__header-actions">
          <AppButton size="sm" variant="secondary" icon-left="refresh-cw" @click="loadWrongBook">
            重新读取
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="toggleResolved">
            {{ includeResolved ? '只看待巩固' : '查看已解决' }}
          </AppButton>
          <AppButton v-if="isDevRoute" size="sm" variant="ghost" @click="clearDemoWrongBook">
            清理开发样本
          </AppButton>
        </div>
      </header>

      <div v-if="wrongBookStore.warning" class="phase12-page__notice" role="status">
        <AppIcon name="alert-circle" :size="18" decorative />
        <span>{{ wrongBookStore.warning }}</span>
      </div>
      <div
        v-if="actionMessage"
        class="phase12-page__notice phase12-page__notice--success"
        role="status"
      >
        <AppIcon name="info" :size="18" decorative />
        <span>{{ actionMessage }}</span>
      </div>

      <div class="phase12-page__link-row" aria-label="错题本相关入口">
        <AppButton variant="secondary" icon-right="arrow-right" @click="router.push(historyPath)">
          学习记录
        </AppButton>
        <AppButton
          variant="secondary"
          icon-right="arrow-right"
          @click="router.push(reviewQueuePath)"
        >
          待巩固列表
        </AppButton>
      </div>

      <AppLoading v-if="wrongBookStore.loading" label="正在整理错题本" />
      <AppErrorState
        v-else-if="wrongBookStore.status === 'error'"
        title="错题本暂时打不开"
        :description="wrongBookStore.error || '请重新读取错题本。'"
        @retry="loadWrongBook"
      />
      <AppEmptyState
        v-else-if="!records.length"
        title="这里还没有错题"
        description="教材练习中答错的题会出现在这里，可重新作答并回看已解决记录。"
        action-label="去学习和练习"
        @action="router.push(isDevRoute ? '/dev/learning-map' : '/learning-map')"
      />
      <section v-else class="wrong-book-page__list" aria-labelledby="wrong-book-list-title">
        <div class="phase12-page__section-heading">
          <div>
            <p class="curriculum-eyebrow">Question review</p>
            <h2 id="wrong-book-list-title">{{ includeResolved ? '错题记录' : '待巩固错题' }}</h2>
          </div>
          <strong>{{ records.length }} 道</strong>
        </div>
        <ol class="wrong-book-page__records">
          <li
            v-for="record in displayedRecords"
            :key="record.id"
            class="wrong-book-page__record"
            :class="{ 'wrong-book-page__record--focused': record.questionId === focusedQuestionId }"
          >
            <div class="wrong-book-page__record-main">
              <div class="wrong-book-page__record-heading">
                <span class="phase12-page__badge" :class="`phase12-page__badge--${record.status}`">
                  {{ statusLabel(record) }}
                </span>
                <span
                  v-if="record.provenance.isSampleDerived"
                  class="phase12-page__badge phase12-page__badge--sample"
                >
                  开发样本
                </span>
                <span
                  v-else-if="
                    sourceWarningLabel(record.provenance.verificationStatus, record.textbookId)
                  "
                  class="phase12-page__badge phase12-page__badge--sample"
                >
                  {{ sourceWarningLabel(record.provenance.verificationStatus, record.textbookId) }}
                </span>
                <strong>错过 {{ record.wrongCount }} 次</strong>
              </div>
              <h3>{{ questionTitles[record.questionId] || `题目 ${record.questionId}` }}</h3>
              <p>知识点：{{ record.knowledgePointIds.join('、') }}</p>
              <small>题目 ID：{{ record.questionId }}</small>
            </div>
            <div class="wrong-book-page__record-actions">
              <AppButton
                v-if="record.status === 'active'"
                variant="primary"
                icon-right="arrow-right"
                :disabled="questionLoading && !questionTitles[record.questionId]"
                @click="openRetry(record)"
              >
                再挑战一次
              </AppButton>
              <AppButton v-else variant="secondary" @click="reopen(record)">放回待巩固</AppButton>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </AppShell>
</template>
