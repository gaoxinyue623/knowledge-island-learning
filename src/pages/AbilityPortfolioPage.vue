<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppShell from '@/layouts/AppShell.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { learningHistoryService } from '@/services/learning-history/learningHistoryService'
import { resolveCurrentQuestRevision } from '@/services/student-growth/currentQuestResolver'
import { spacedReviewService, createReviewLaunchHref } from '@/services/student-growth/spacedReview'
import {
  projectAbilityPortfolio,
  type AbilityPortfolioItem,
} from '@/services/ability-portfolio/abilityPortfolio'
import type { SubjectCode } from '@/types'

const router = useRouter()
const { profileId } = useLearningProfile()
const loading = ref(false)
const error = ref('')
const items = ref<AbilityPortfolioItem[]>([])
const selectedSubject = ref<SubjectCode | 'ALL'>('ALL')
const expanded = ref<string | null>(null)
let requestToken = 0

const visibleItems = computed(() =>
  selectedSubject.value === 'ALL'
    ? items.value
    : items.value.filter((item) => item.subject === selectedSubject.value),
)

function statusLabel(status: AbilityPortfolioItem['status']): string {
  return { practiced: '练过了', consolidating: '正在巩固', mastered: '已掌握' }[status]
}

async function load(): Promise<void> {
  const token = ++requestToken
  const currentProfileId = profileId.value
  items.value = []
  expanded.value = null
  error.value = ''
  loading.value = true
  try {
    if (!currentProfileId) throw new Error('请选择学习档案。')
    const evidence = spacedReviewService.listEvidence(currentProfileId)
    const evidenceWarning = spacedReviewService.getLastWarning()
    if (evidenceWarning) throw new Error(evidenceWarning)
    const unique = new Map(evidence.map(item => [item.questId, item]))
    const current = await Promise.all(
      [...unique.values()].map(async (item) => [item.questId, await resolveCurrentQuestRevision(item.courseHref)] as const),
    )
    if (token !== requestToken || currentProfileId !== profileId.value) return
    const revisionByQuest: Record<string, string | null> = {}
    for (const [questId, resolved] of current)
      revisionByQuest[questId] = resolved?.questId === questId ? resolved.contentRevision : null
    const history = learningHistoryService.listByProfile(currentProfileId)
    const historyWarning = learningHistoryService.getLastWarning()
    if (historyWarning) throw new Error(historyWarning)
    items.value = projectAbilityPortfolio({
      profileId: currentProfileId,
      evidence,
      history,
      currentRevisionByQuest: revisionByQuest,
    })
  } catch (caught) {
    if (token === requestToken) {
      items.value = []
      error.value = caught instanceof Error ? caught.message : '本领册暂时无法读取，请稍后重试。'
    }
  } finally {
    if (token === requestToken) loading.value = false
  }
}

function review(item: AbilityPortfolioItem): void {
  if (!item.courseHref) return
  const href = createReviewLaunchHref(item.courseHref, crypto.randomUUID())
  if (href) void router.push(href)
}

watch(profileId, () => void load(), { immediate: true })
onBeforeUnmount(() => { requestToken++ })
</script>

<template>
  <AppShell context="我的本领册">
    <div class="content-container ability-portfolio">
      <header>
        <p class="curriculum-eyebrow">看见真实的练习痕迹</p>
        <h1>我的本领册</h1>
        <p>完成课程会记作“练过了”；同版本独立完成三轮（含首次完成，后续两轮须到期再练）会显示“已掌握”。这是本领册的记录规则，仍可继续巩固。</p>
      </header>
      <fieldset aria-label="按学科筛选">
        <legend>学科</legend>
        <button v-for="subject in ['ALL', 'CHINESE', 'MATH', 'ENGLISH']" :key="subject" type="button" :aria-pressed="selectedSubject === subject" @click="selectedSubject = subject as SubjectCode | 'ALL'">
          {{ subject === 'ALL' ? '全部' : subject === 'CHINESE' ? '语文' : subject === 'MATH' ? '数学' : '英语' }}
        </button>
      </fieldset>
      <AppLoading v-if="loading" label="正在整理你的本领册" />
      <AppErrorState v-else-if="error" :description="error" @retry="load" />
      <AppEmptyState v-else-if="!visibleItems.length" title="还没有可展示的本领" description="完成一节课程或一轮可读练习后，这里会展示真实的学习证据。" />
      <ol v-else class="ability-portfolio__list">
        <li v-for="item in visibleItems" :key="item.id">
          <div><span>{{ item.subject === 'CHINESE' ? '语文' : item.subject === 'MATH' ? '数学' : '英语' }}</span><strong>{{ item.title }}</strong><b>{{ statusLabel(item.status) }}</b></div>
          <p v-if="item.status === 'consolidating'">{{ item.usedHint || item.hadIncorrectAnswer ? '上次使用了提示或需要重试，继续巩固会更有把握。' : `已独立完成 ${item.completedIndependentRounds} 轮（含首次完成）。` }}</p>
          <p v-else-if="item.status === 'practiced'">已有课程学习记录；还没有可验证的独立复习证据。</p>
          <p v-else>已独立完成三轮（含首次完成），后续两轮均达到复习间隔。</p>
          <AppButton v-if="item.courseHref" size="sm" variant="secondary" @click="review(item)">去复习</AppButton>
          <button type="button" @click="expanded = expanded === item.id ? null : item.id">{{ expanded === item.id ? '收起证据' : '查看证据' }}</button>
          <div v-if="expanded === item.id" class="ability-portfolio__evidence"><p v-if="item.representativePrompt">代表题：{{ item.representativePrompt }}</p><p>最近练习：{{ item.latestAt.slice(0, 10) }}</p><p v-if="item.usedHint === null || item.hadIncorrectAnswer === null">课程完成记录未收集本轮提示与首次作答证据。</p><p v-else>{{ item.usedHint ? '使用过提示' : '未使用提示' }} · {{ item.hadIncorrectAnswer ? '有过重试' : '首次作答通过' }}</p><p v-if="item.history.length">课程记录 {{ item.history.length }} 条</p></div>
        </li>
      </ol>
    </div>
  </AppShell>
</template>

<style scoped>
.ability-portfolio { display: grid; gap: 1rem; padding-block: 1.5rem; }
.ability-portfolio header p, .ability-portfolio__list p { margin: .4rem 0 0; color: var(--color-text-secondary, #4b5563); }
fieldset { display: flex; flex-wrap: wrap; gap: .5rem; border: 0; padding: 0; }
fieldset button, .ability-portfolio li > button { min-height: 2.75rem; padding: .5rem .75rem; border: 1px solid var(--color-primary-300, #93c5fd); border-radius: .5rem; background: white; font: inherit; }
.ability-portfolio__list { display: grid; gap: .75rem; padding: 0; margin: 0; list-style: none; }
.ability-portfolio__list li { display: grid; gap: .6rem; padding: 1rem; border: 1px solid var(--color-border, #d1d5db); border-radius: .75rem; }
.ability-portfolio__list li > div:first-child { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.ability-portfolio__list b { color: var(--color-primary-700, #155e9a); }
.ability-portfolio__evidence { padding: .75rem; background: var(--color-primary-50, #f1f8ff); border-radius: .5rem; }
</style>
