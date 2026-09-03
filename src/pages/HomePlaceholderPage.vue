<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppShell from '@/layouts/AppShell.vue'
import LearningRecommendationCard from '@/components/learning-strategy/LearningRecommendationCard.vue'
import CurriculumSummary from '@/components/curriculum/CurriculumSummary.vue'
import {
  getCurriculumPresentation,
  type CurriculumPresentation,
} from '@/composables/useCurriculumPresentation'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { useLearningStrategyStore } from '@/stores/learningStrategyStore'
import { useMasteryStore } from '@/stores/masteryStore'

const router = useRouter()
const curriculumStore = useCurriculumStore()
const learningMapStore = useLearningMapStore()
const learningStrategyStore = useLearningStrategyStore()
const masteryStore = useMasteryStore()
const presentation = ref<CurriculumPresentation | null>(null)
const error = ref<string | null>(null)

const contextLabel = computed(() =>
  presentation.value
    ? `${presentation.value.gradeName} · ${presentation.value.semesterName}`
    : '学习配置',
)

const recommendation = computed(() => learningStrategyStore.recommendation)

async function loadHome() {
  error.value = null
  learningStrategyStore.clear()
  if (!curriculumStore.curriculumProfile) {
    error.value = '还没有完成学习配置，请先完成地区、年级和教材选择。'
    return
  }
  try {
    presentation.value = await getCurriculumPresentation(curriculumStore.curriculumProfile)
    const profile = curriculumStore.curriculumProfile
    if (!profile?.mathTextbookVersionId) return
    const studentProfileId = profile.studentId || 'local-profile'
    await masteryStore.load(studentProfileId)
    const map = await learningMapStore.loadMap({
      dataset: 'profile',
      textbookId: profile.mathTextbookVersionId,
      masteryRecords: masteryStore.records,
    })
    if (map) {
      await learningStrategyStore.resolveForMap(map, {
        studentProfileId,
        masteryRecords: masteryStore.records,
        learningEvidence: masteryStore.evidence,
        learningMapProgress: learningMapStore.mapProgress,
        currentMapNodeId: map.currentNodeId,
        dataset: 'profile',
      })
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '课程配置暂时无法读取'
  }
}

function openRecommendation() {
  const mapNodeId = recommendation.value?.nextKnowledgePoint?.mapNodeId
  void router.push({
    path: '/learning-map',
    ...(mapNodeId ? { query: { focusNodeId: mapNodeId } } : {}),
  })
}

onMounted(() => void loadHome())
</script>

<template>
  <AppShell :show-bottom-nav="true" :context="contextLabel">
    <div class="curriculum-page content-container">
      <AppLoading v-if="curriculumStore.loading" label="正在准备你的学习配置" />
      <AppErrorState
        v-else-if="error"
        title="课程配置还没准备好"
        :description="error"
        @retry="loadHome"
      />
      <template v-else-if="presentation">
        <header class="home-placeholder__header">
          <p class="curriculum-eyebrow">HOME · PHASE 11 LEARNING STRATEGY</p>
          <h1>准备好探索你的知识岛了吗？</h1>
          <p>你的地区、年级和三科教材已经准备好。先看一眼当前学习建议，再进入知识岛。</p>
        </header>
        <CurriculumSummary
          :region-name="presentation.regionName"
          :grade-name="presentation.gradeName"
          :semester-name="presentation.semesterName"
          :textbooks="presentation.textbooks"
        />
        <LearningRecommendationCard
          v-if="recommendation"
          :recommendation="recommendation"
          @action="openRecommendation"
        />
        <section class="curriculum-placeholder-panel">
          <h2>下一步学习入口</h2>
          <p>地图完成度、作答证据和掌握度记录各自保持独立；策略只提供当前可以采取的学习动作。</p>
          <div class="curriculum-actions">
            <AppButton
              variant="secondary"
              icon-right="arrow-right"
              @click="router.push('/learning-map')"
            >
              进入知识岛地图
            </AppButton>
            <AppButton
              variant="secondary"
              icon-left="settings"
              @click="$router.push('/curriculum-settings')"
            >
              打开我的学习设置
            </AppButton>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>
