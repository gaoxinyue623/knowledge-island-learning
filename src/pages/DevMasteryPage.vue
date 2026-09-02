<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import AppShell from '@/layouts/AppShell.vue'
import {
  masteryShowcaseKnowledgePoint,
  masteryShowcaseScenarios,
  type MasteryShowcaseScenarioKey,
} from '@/data/mastery'
import { masteryService } from '@/services/mastery'
import { useMasteryStore } from '@/stores/masteryStore'

const masteryStore = useMasteryStore()
const selectedScenarioKey = ref<MasteryShowcaseScenarioKey>('mastered')
const displayMode = ref<'showcase' | 'stored'>('showcase')
const actionMessage = ref<string | null>(null)

const selectedScenario = computed(
  () =>
    masteryShowcaseScenarios.find((scenario) => scenario.key === selectedScenarioKey.value) ??
    masteryShowcaseScenarios[0],
)
const displayedRecord = computed(() =>
  displayMode.value === 'stored'
    ? masteryStore.getByKnowledgePoint(masteryShowcaseKnowledgePoint.id)
    : selectedScenario.value?.record,
)
const displayedEvidence = computed(() =>
  displayMode.value === 'stored'
    ? masteryStore.evidence.filter(
        (item) => item.knowledgePointId === masteryShowcaseKnowledgePoint.id,
      )
    : (selectedScenario.value?.evidence ?? []),
)

function selectScenario(key: MasteryShowcaseScenarioKey) {
  selectedScenarioKey.value = key
  displayMode.value = 'showcase'
  actionMessage.value = null
}

async function loadStoredMastery() {
  await masteryStore.load('local-profile')
  displayMode.value = 'stored'
  actionMessage.value = masteryStore.warning || '已读取当前保存的学习证据与掌握度记录。'
}

async function rebuildStoredMastery() {
  displayMode.value = 'stored'
  const record = masteryService.rebuildKnowledgePoint(
    'local-profile',
    masteryShowcaseKnowledgePoint.id,
  )
  await masteryStore.refresh()
  actionMessage.value = `已从 ${record.evidenceCount} 条证据确定性重算。`
}

function resetSampleMastery() {
  masteryStore.resetDemoMastery()
  displayMode.value = 'stored'
  actionMessage.value = '已清理当前学生的开发样本掌握度；正式内容不受影响。'
}

function clearStoredMastery() {
  masteryStore.clearStudentMastery()
  displayMode.value = 'stored'
  actionMessage.value = '已清理当前学生的掌握度与学习证据。'
}

onMounted(() => void masteryStore.load('local-profile'))
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / Mastery">
    <div class="mastery-page content-container">
      <header class="mastery-page__header">
        <div>
          <p class="curriculum-eyebrow">DEVELOPMENT ONLY · PHASE 10</p>
          <h1>Mastery Debug View</h1>
          <p>
            只验证 LearningEvidence → MasteryScore →
            KnowledgeLearningState。这里不包含自适应选题、复习排程、错题本或奖励逻辑。
          </p>
        </div>
        <div class="mastery-page__header-actions">
          <AppButton size="sm" variant="secondary" @click="loadStoredMastery"
            >读取已保存记录</AppButton
          >
          <AppButton size="sm" variant="ghost" @click="resetSampleMastery">重置开发样本</AppButton>
          <AppButton size="sm" variant="ghost" @click="clearStoredMastery">清理当前学生</AppButton>
        </div>
      </header>

      <div v-if="actionMessage" class="mastery-page__notice" role="status">
        <AppIcon name="info" :size="18" decorative />
        <span>{{ actionMessage }}</span>
      </div>

      <section class="mastery-page__scenario-panel" aria-labelledby="mastery-scenario-title">
        <div>
          <p class="curriculum-eyebrow">Deterministic scenarios</p>
          <h2 id="mastery-scenario-title">掌握度状态 Showcase</h2>
          <p>选择状态查看对应证据；这些是开发夹具，不会自动写入学生正式记录。</p>
        </div>
        <div class="mastery-page__scenario-grid">
          <AppButton
            v-for="scenario in masteryShowcaseScenarios"
            :key="scenario.key"
            size="sm"
            :variant="
              selectedScenarioKey === scenario.key && displayMode === 'showcase'
                ? 'primary'
                : 'secondary'
            "
            @click="selectScenario(scenario.key)"
          >
            {{ scenario.label }}
          </AppButton>
        </div>
      </section>

      <section class="mastery-page__record-grid" aria-label="掌握度记录概览">
        <article class="mastery-page__record-card">
          <div class="mastery-page__record-heading">
            <div>
              <p class="curriculum-eyebrow">KnowledgePoint</p>
              <h2>{{ masteryShowcaseKnowledgePoint.name }}</h2>
            </div>
            <span class="mastery-page__source-badge">{{
              displayMode === 'stored' ? '已保存' : '开发夹具'
            }}</span>
          </div>
          <template v-if="displayedRecord">
            <div class="mastery-page__score-row">
              <strong>{{ Math.round(displayedRecord.masteryScore) }}%</strong>
              <span>{{ displayedRecord.state }}</span>
            </div>
            <AppProgress
              :value="displayedRecord.masteryScore"
              label="MasteryScore"
              :show-value="false"
            />
            <dl class="mastery-page__facts">
              <div>
                <dt>置信度</dt>
                <dd>{{ Math.round(displayedRecord.confidence * 100) }}%</dd>
              </div>
              <div>
                <dt>有效证据</dt>
                <dd>{{ displayedRecord.evidenceCount }} 条</dd>
              </div>
              <div>
                <dt>答对 / 答错</dt>
                <dd>
                  {{ displayedRecord.correctEvidenceCount }} /
                  {{ displayedRecord.incorrectEvidenceCount }}
                </dd>
              </div>
              <div>
                <dt>来源状态</dt>
                <dd>{{ displayedRecord.evidenceSourceStatus }}</dd>
              </div>
              <div>
                <dt>算法版本</dt>
                <dd>{{ displayedRecord.algorithmVersion }}</dd>
              </div>
            </dl>
            <p v-if="displayedRecord.isSampleDerived" class="mastery-page__sample-note">
              <AppIcon name="info" :size="16" decorative /> 该记录由开发样本证据产生。
            </p>
          </template>
          <AppEmptyState
            v-else
            title="还没有掌握度记录"
            description="当前学生还没有保存这个知识点的记录。"
          />
          <AppButton
            v-if="displayMode === 'stored'"
            variant="secondary"
            @click="rebuildStoredMastery"
          >
            从证据重算
          </AppButton>
        </article>

        <article class="mastery-page__evidence-card">
          <div class="mastery-page__record-heading">
            <div>
              <p class="curriculum-eyebrow">LearningEvidence</p>
              <h2>作答证据</h2>
            </div>
            <strong>{{ displayedEvidence.length }}</strong>
          </div>
          <ul v-if="displayedEvidence.length" class="mastery-page__evidence-list">
            <li v-for="item in displayedEvidence" :key="item.id">
              <span :class="`mastery-page__outcome mastery-page__outcome--${item.outcome}`">
                {{ item.outcome === 'correct' ? '答对' : '答错' }}
              </span>
              <span>{{ item.source.questionId }}</span>
              <small
                >难度 {{ item.questionDifficulty }} · 权重
                {{ item.evidenceWeight.toFixed(2) }}</small
              >
            </li>
          </ul>
          <p v-else class="mastery-page__empty-copy">
            暂无作答证据。人工判断题不会在未完成人工审核前进入正确/错误统计。
          </p>
        </article>
      </section>
    </div>
  </AppShell>
</template>
