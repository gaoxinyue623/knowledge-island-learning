<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import LearningRecommendationCard from '@/components/learning-strategy/LearningRecommendationCard.vue'
import ReviewRecommendationCard from '@/components/learning-strategy/ReviewRecommendationCard.vue'
import AppShell from '@/layouts/AppShell.vue'
import {
  strategyShowcaseFixtures,
  strategyShowcaseUnverifiedInput,
  type StrategyShowcaseFixture,
} from '@/data/learning-strategy'
import { useLearningStrategyStore } from '@/stores/learningStrategyStore'
import type { LearningStrategyInput } from '@/types'

type FixtureSelection = StrategyShowcaseFixture['id'] | 'UNVERIFIED'

const learningStrategyStore = useLearningStrategyStore()
const selectedFixtureId = ref<FixtureSelection>('SAMPLE_STRATEGY_WEAK')
const actionMessage = ref<string | null>(null)

const selectedFixture = computed(() =>
  strategyShowcaseFixtures.find((fixture) => fixture.id === selectedFixtureId.value),
)
const selectedInput = computed<LearningStrategyInput>(() =>
  selectedFixtureId.value === 'UNVERIFIED'
    ? strategyShowcaseUnverifiedInput
    : (selectedFixture.value?.input ?? strategyShowcaseFixtures[0].input),
)
const recommendation = computed(() => learningStrategyStore.recommendation)

async function resolveSelected() {
  actionMessage.value = null
  await learningStrategyStore.resolve(selectedInput.value, { limit: 3 })
}

function selectFixture(id: FixtureSelection) {
  selectedFixtureId.value = id
}

function acknowledgeAction() {
  actionMessage.value = '开发页面只验证当前建议输出，不会自动修改地图、掌握度或练习记录。'
}

onMounted(() => void resolveSelected())
watch(selectedFixtureId, () => void resolveSelected())
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / Strategy">
    <div class="strategy-page content-container">
      <header class="strategy-page__header">
        <div>
          <p class="curriculum-eyebrow">DEVELOPMENT ONLY · PHASE 11</p>
          <h1>Learning Strategy Debug View</h1>
          <p>用固定样本检查弱掌握、证据不足、当前节点、后续节点、锁定节点和安全空状态。</p>
        </div>
        <div class="strategy-page__disclaimer" role="note">
          <AppIcon name="info" :size="18" decorative />
          <span
            >本页面只验证确定性学习策略，不包含 AI 学习路径、复习日程、KnowledgeEnergy、WrongBook
            或奖励逻辑。</span
          >
        </div>
      </header>

      <section class="strategy-page__scenario-panel" aria-labelledby="strategy-scenario-title">
        <div>
          <p class="curriculum-eyebrow">Fixed showcase</p>
          <h2 id="strategy-scenario-title">选择一个学习情境</h2>
          <p>所有样本都标记为 SAMPLE；Golden 情境单独展示 UNVERIFIED 来源提醒。</p>
        </div>
        <div class="strategy-page__scenario-grid">
          <AppButton
            v-for="fixture in strategyShowcaseFixtures"
            :key="fixture.id"
            size="sm"
            :variant="selectedFixtureId === fixture.id ? 'primary' : 'secondary'"
            @click="selectFixture(fixture.id)"
          >
            {{ fixture.label }}
          </AppButton>
          <AppButton
            size="sm"
            :variant="selectedFixtureId === 'UNVERIFIED' ? 'primary' : 'secondary'"
            @click="selectFixture('UNVERIFIED')"
          >
            UNVERIFIED 来源
          </AppButton>
        </div>
      </section>

      <div
        v-if="selectedFixtureId === 'UNVERIFIED'"
        class="strategy-page__source-notice strategy-page__source-notice--warning"
        role="status"
      >
        <AppIcon name="alert-circle" :size="18" decorative />
        <span>来源未审核：当前结果仅用于开发验证，不代表正式课程建议。</span>
      </div>
      <div v-else class="strategy-page__source-notice" role="status">
        <AppIcon name="info" :size="18" decorative />
        <span>开发样本：{{ selectedFixture?.description }} 不代表真实学生学习记录。</span>
      </div>

      <LearningRecommendationCard
        v-if="recommendation"
        :recommendation="recommendation"
        @action="acknowledgeAction"
      />
      <p v-if="actionMessage" class="strategy-page__action-message" role="status">
        <AppIcon name="check-circle" :size="18" decorative />
        {{ actionMessage }}
      </p>

      <section
        v-if="recommendation?.reviewRecommendations.length"
        class="strategy-page__reviews"
        aria-labelledby="strategy-review-title"
      >
        <div>
          <p class="curriculum-eyebrow">Review / Reinforcement</p>
          <h2 id="strategy-review-title">当前优先巩固</h2>
          <p>这里表示现在可以做的学习动作，不是复习日程。</p>
        </div>
        <div class="strategy-page__review-list">
          <ReviewRecommendationCard
            v-for="review in recommendation.reviewRecommendations"
            :key="`${review.knowledgePointId}-${review.mapNodeId ?? 'none'}`"
            :recommendation="review"
          />
        </div>
      </section>

      <details v-if="recommendation" class="strategy-page__diagnostics">
        <summary>
          开发诊断：{{ recommendation.diagnostics.length }} 条 ·
          {{ recommendation.strategyVersion }}
        </summary>
        <p v-for="diagnostic in recommendation.diagnostics" :key="diagnostic">{{ diagnostic }}</p>
      </details>
    </div>
  </AppShell>
</template>
