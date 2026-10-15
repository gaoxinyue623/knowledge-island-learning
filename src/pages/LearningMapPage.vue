<script setup lang="ts">
import { readSchoolProgress, saveSchoolProgress } from '@/services/student-growth/schoolProgress'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppToast from '@/components/common/AppToast.vue'
import ThinkingEntry from '@/components/thinking/ThinkingEntry.vue'
import ReadingEntry from '@/components/reading-islands/ReadingEntry.vue'
import ComprehensiveAssessments from '@/components/learning-map/ComprehensiveAssessments.vue'
import KnowledgeIslandMap from '@/components/learning-map/KnowledgeIslandMap.vue'
import LearningProgressBar from '@/components/learning-map/LearningProgressBar.vue'
import MapHeader from '@/components/learning-map/MapHeader.vue'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { findLearningMapNode, useLearningMapStore } from '@/stores/learningMapStore'
import { useMasteryStore } from '@/stores/masteryStore'
import { useLearningStrategyStore } from '@/stores/learningStrategyStore'
import { useReviewQueueStore } from '@/stores/reviewQueueStore'
import type { Id, KnowledgeMapNode, LearningMapViewModel, SubjectCode } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const learningMapStore = useLearningMapStore()
const masteryStore = useMasteryStore()
const learningStrategyStore = useLearningStrategyStore()
const reviewQueueStore = useReviewQueueStore()
const notice = ref<{
  type: 'success' | 'info' | 'warning'
  title: string
  message?: string
} | null>(null)

const viewModel = computed(() => learningMapStore.viewModel)
const isFormalPilot = computed(() => isPilotTextbook(viewModel.value?.textbook.id))
const profile = computed(() => curriculumStore.curriculumProfile)
const subjects: { code: SubjectCode; label: string }[] = [
  { code: 'CHINESE', label: '语文地图' },
  { code: 'MATH', label: '数学地图' },
  { code: 'ENGLISH', label: '英语地图' },
]
const explicitSubject = computed<SubjectCode | null>(() => {
  const requested = String(route.query.subject ?? '').toUpperCase()
  return requested === 'CHINESE' || requested === 'MATH' || requested === 'ENGLISH'
    ? requested
    : null
})
const requestedSubject = computed<SubjectCode>(() => {
  if (explicitSubject.value) return explicitSubject.value
  if (profile.value?.chineseTextbookVersionId) return 'CHINESE'
  if (profile.value?.mathTextbookVersionId) return 'MATH'
  return 'ENGLISH'
})
const selectedTextbookId = computed(() => {
  if (!explicitSubject.value && typeof route.query.textbookId === 'string') {
    return route.query.textbookId
  }
  if (!profile.value) return null
  return {
    CHINESE: profile.value.chineseTextbookVersionId,
    MATH: profile.value.mathTextbookVersionId,
    ENGLISH: profile.value.englishTextbookVersionId,
  }[requestedSubject.value]
})
const contextLabel = computed(() => {
  const model = viewModel.value
  return model
    ? `${model.textbook.grade}年级 · ${model.textbook.semester === 1 ? '上册' : '下册'}`
    : '学习地图'
})
const schoolNodeId = ref<string | null>(null)
const schoolNotice = ref('')
const recommendedNode = computed(() =>
  schoolNodeId.value && viewModel.value
    ? findLearningMapNode(viewModel.value, schoolNodeId.value)
    : learningMapStore.currentNode,
)
const schoolNodes = computed(
  () =>
    viewModel.value?.islands.flatMap((island) =>
      island.lessons.flatMap((lesson) => lesson.nodes),
    ) ?? [],
)
function updateSchoolProgress(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const studentId = profile.value?.studentId
  if (!studentId || !viewModel.value) return
  if (id && !schoolNodes.value.some((node) => node.id === id)) return
  try {
    saveSchoolProgress(studentId, viewModel.value.textbook.id, id)
    schoolNodeId.value = id || null
    schoolNotice.value = '学校进度已记住。这里只定位课程，不会标记已完成或已掌握。'
  } catch {
    schoolNotice.value = '学校进度暂时无法保存，原学习记录保留。'
  }
}
let mapLoadGeneration = 0

function findCurrentModelNode(model: LearningMapViewModel | null): KnowledgeMapNode | null {
  if (!model?.currentNodeId) return null
  return findLearningMapNode(model, model.currentNodeId)
}

async function loadMap() {
  const generation = ++mapLoadGeneration
  learningStrategyStore.clear()
  const textbookId = selectedTextbookId.value
  await masteryStore.load(profile.value?.studentId ?? 'local-profile')
  if (generation !== mapLoadGeneration) return
  const loaded = await learningMapStore.loadMap({
    profileId: profile.value?.studentId,
    dataset: 'profile',
    textbookId: textbookId ?? undefined,
    masteryRecords: masteryStore.records,
  })
  if (generation !== mapLoadGeneration) return
  if (loaded) {
    try {
      const id = readSchoolProgress(profile.value?.studentId ?? 'local-profile', loaded.textbook.id)
      schoolNodeId.value = id && findLearningMapNode(loaded, id) ? id : null
    } catch {
      schoolNodeId.value = null
      schoolNotice.value = '以前的学校进度暂时无法读取，可以重新选择。'
    }
    const resolved = await learningStrategyStore.resolveForMap(loaded, {
      studentProfileId: profile.value?.studentId ?? 'local-profile',
      masteryRecords: masteryStore.records,
      learningEvidence: masteryStore.evidence,
      learningMapProgress: learningMapStore.mapProgress,
      currentMapNodeId: loaded.currentNodeId,
      dataset: 'profile',
    })
    if (generation !== mapLoadGeneration) return
    if (resolved) {
      reviewQueueStore.project(resolved, {
        profileId: profile.value?.studentId ?? 'local-profile',
        textbookId: loaded.textbook.id,
        dataset: 'profile',
      })
    }
  }
  const focusNodeId = typeof route.query.focusNodeId === 'string' ? route.query.focusNodeId : null
  if (loaded && focusNodeId) learningMapStore.focusNode(focusNodeId)
  if (loaded && route.query.open === 'continue') focusCurrentNode()
}

function selectSubject(subject: SubjectCode) {
  if (subject === requestedSubject.value) return
  void router.push({ path: '/learning-map', query: { subject } })
}

function openNodeDetail(nodeId: Id) {
  const model = viewModel.value
  if (!model || !learningMapStore.selectNode(nodeId)) return
  const node = learningMapStore.selectedNode
  if (!node) return
  void router.push({
    path: `/knowledge-point/${encodeURIComponent(node.knowledgePointId)}`,
    query: {
      textbookId: model.textbook.id,
      unitId: node.unitId,
      lessonId: node.lessonId,
      knowledgePointId: node.knowledgePointId,
      dataset: 'profile',
      subject: model.textbook.subject,
      mapNodeId: node.id,
      nodeStatus: node.status,
      nodeProgress: String(node.progress),
      returnTo: '/learning-map',
    },
  })
}

function focusCurrentNode() {
  const node =
    schoolNodeId.value && viewModel.value
      ? findLearningMapNode(viewModel.value, schoolNodeId.value)
      : findCurrentModelNode(viewModel.value)
  if (!node) return
  if (node.status !== 'locked') openNodeDetail(node.id)
}

onMounted(() => void loadMap())
watch(
  () => [route.query.subject, profile.value?.studentId, selectedTextbookId.value],
  () => void loadMap(),
)
</script>

<template>
  <AppShell :show-bottom-nav="true" :context="contextLabel">
    <div class="learning-map-page content-container">
      <nav class="learning-map-subject-switcher" aria-label="切换学科地图">
        <AppButton
          v-for="subject in subjects"
          :key="subject.code"
          size="sm"
          :variant="requestedSubject === subject.code ? 'primary' : 'secondary'"
          :aria-pressed="requestedSubject === subject.code"
          @click="selectSubject(subject.code)"
        >
          {{ subject.label }}
        </AppButton>
      </nav>
      <p v-if="learningMapStore.error && learningMapStore.status !== 'error'" role="alert">
        {{ learningMapStore.error }}
      </p>
      <AppLoading v-if="learningMapStore.loading" label="正在准备知识岛地图" />
      <AppErrorState
        v-else-if="learningMapStore.status === 'error'"
        title="知识岛地图暂时打不开"
        :description="learningMapStore.error ?? '请重新试一次。'"
        @retry="loadMap"
      />
      <AppEmptyState
        v-else-if="learningMapStore.status === 'not_available' || !selectedTextbookId"
        title="课程内容正在准备中"
        description="当前学科还没有可开放的知识地图，请先确认教材版本，或等待课程完成审核。"
        action-label="查看学习设置"
        @action="router.push('/curriculum-settings')"
      />
      <AppEmptyState
        v-else-if="learningMapStore.status === 'empty'"
        title="这片知识海域还在准备中"
        description="当前教材暂时没有可以展示的单元或知识点。"
        action-label="返回首页"
        @action="router.push('/home')"
      />
      <template v-else-if="viewModel">
        <MapHeader :view-model="viewModel" :show-unverified="!isFormalPilot" />
        <section class="learning-map-overview" aria-label="地图进度概览">
          <div class="learning-map-overview__copy">
            <p class="curriculum-eyebrow">继续学习</p>
            <h2>
              {{
                learningMapStore.currentNode
                  ? learningMapStore.currentNode.title
                  : '从一座知识岛开始'
              }}
            </h2>
            <p>地图完成度只表示走过的学习节点，不代表掌握度或能力评分。</p>
          </div>
          <LearningProgressBar
            :completed="viewModel.progress.completedNodes"
            :total="viewModel.progress.totalNodes"
          />
          <AppButton
            class="learning-map-overview__cta"
            size="lg"
            icon-right="navigation"
            :disabled="!recommendedNode"
            @click="focusCurrentNode"
          >
            {{ schoolNodeId ? '接着学校进度' : '继续探索' }}
          </AppButton>
          <AppButton
            class="learning-map-overview__growth-cta"
            variant="secondary"
            icon-left="sparkles"
            @click="router.push('/achievements')"
          >
            查看成长反馈
          </AppButton>
        </section>
        <div v-if="viewModel.flags.isDemo" class="map-notice map-notice--sample" role="status">
          开发样本：多岛数据只用于验证地图布局与状态，不代表真实教材结构。
        </div>
        <div
          v-else-if="viewModel.flags.isUnverified && !isFormalPilot"
          class="map-notice map-notice--warning"
          role="status"
        >
          未审核数据：当前内容仅用于开发验证，不代表已发布的正式课程。
        </div>
        <ReadingEntry
          v-if="requestedSubject !== 'MATH'"
          compact
          :language="requestedSubject === 'ENGLISH' ? 'english' : 'chinese'"
        />
        <section class="learning-map-overview" aria-label="学校学习进度">
          <label
            >学校正在学哪一课？<select
              :value="schoolNodeId ?? ''"
              style="max-width: 100%; min-height: 44px; width: 100%"
              @change="updateSchoolProgress"
            >
              <option value="">暂不标记</option>
              <option v-for="node in schoolNodes" :key="node.id" :value="node.id">
                {{ node.title }}
              </option>
            </select></label
          >
          <p>按学校进度定位课程。已学过的单元可直接测一测，不需要重复完成所有节点。</p>
          <p v-if="schoolNotice" role="status">{{ schoolNotice }}</p>
        </section>
        <KnowledgeIslandMap
          :view-model="viewModel"
          compact
          :school-node-id="schoolNodeId"
          show-unit-assessments
          :selected-node-id="learningMapStore.selectedNodeId"
          @select-node="openNodeDetail"
        />
        <ComprehensiveAssessments :model="viewModel" unit-assessments-on-map />
        <ThinkingEntry compact />
        <details v-if="viewModel.diagnostics.length" class="learning-map-diagnostics">
          <summary>开发诊断：{{ viewModel.diagnostics.length }} 条提示</summary>
          <p
            v-for="diagnostic in viewModel.diagnostics"
            :key="`${diagnostic.code}-${diagnostic.entityId}`"
          >
            {{ diagnostic.message }}
          </p>
        </details>
        <AppToast
          :open="Boolean(notice)"
          :type="notice?.type"
          :title="notice?.title ?? ''"
          :message="notice?.message"
        />
      </template>
    </div>
  </AppShell>
</template>
