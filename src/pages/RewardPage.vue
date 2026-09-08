<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import { createPhase13DemoRewardFacts } from '@/data/reward'
import AppShell from '@/layouts/AppShell.vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useLearningProfile } from '@/composables/useLearningProfile'
import PetGarden from '@/components/pet/PetGarden.vue'
import { useGrowthStore } from '@/stores/growthStore'
import { useRewardStore } from '@/stores/rewardStore'
import type { AchievementProgress, RewardEvent, RewardEventType } from '@/types'

const route = useRoute()
const { profileId } = useLearningProfile()
const rewardStore = useRewardStore()
const growthStore = useGrowthStore()
const achievementStore = useAchievementStore()
const demoSeeded = ref(false)

const isDevRoute = computed(() => route.path.startsWith('/dev/reward'))
const events = computed(() => rewardStore.events)
const progress = computed(() => achievementStore.progress)
const growth = computed(() => growthStore.growth)
const energy = computed(() => growthStore.energy)

const typeLabels: Record<RewardEventType, string> = {
  lesson_completed: '完成课程',
  assessment_completed: '完成练习',
  knowledge_mastered: '掌握知识点',
  review_completed: '完成巩固',
  wrong_question_resolved: '解决错题',
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function loadData() {
  const currentProfileId = profileId.value
  rewardStore.load(currentProfileId, { includeSample: isDevRoute.value })
  if (
    isDevRoute.value &&
    !demoSeeded.value &&
    !events.value.some((event) => event.provenance.isSampleDerived)
  ) {
    rewardStore.processLearningFacts(createPhase13DemoRewardFacts(currentProfileId), {
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    demoSeeded.value = true
  }
  growthStore.load(currentProfileId, {
    dataset: isDevRoute.value ? 'demo' : 'profile',
    includeSample: isDevRoute.value,
  })
  achievementStore.load(currentProfileId, {
    dataset: isDevRoute.value ? 'demo' : 'profile',
    includeSample: isDevRoute.value,
  })
}

function clearDemoData() {
  rewardStore.resetDemoRewards()
  growthStore.clearDemoGrowth()
  achievementStore.clearDemoAchievements()
  demoSeeded.value = true
}

function progressLabel(item: AchievementProgress): string {
  return `${Math.min(item.current, item.target)} / ${item.target}`
}

function sourceLabel(event: RewardEvent): string {
  return event.provenance.isSampleDerived ? '开发样本' : '正式学习记录'
}

watch(() => [profileId.value, isDevRoute.value], loadData, { immediate: true })
</script>

<template>
  <AppShell :show-bottom-nav="!isDevRoute" :context="isDevRoute ? 'DEV / 成长反馈' : '成长反馈'">
    <div class="reward-page content-container">
      <header class="reward-page__header">
        <div>
          <p class="curriculum-eyebrow">和伙伴一起成长</p>
          <h1>我的成长与宠物</h1>
          <p>每一次真正完成的学习，都会留下可以回看的成长记录。</p>
        </div>
        <div class="reward-page__header-actions">
          <AppButton size="sm" variant="secondary" icon-left="refresh-cw" @click="loadData">
            重新读取
          </AppButton>
          <AppButton v-if="isDevRoute" size="sm" variant="ghost" @click="clearDemoData">
            清理开发样本
          </AppButton>
        </div>
      </header>

      <PetGarden v-if="!isDevRoute" />

      <div
        v-if="rewardStore.warning || growthStore.warning || achievementStore.warning"
        class="reward-page__notice"
        role="status"
      >
        <AppIcon name="alert-circle" :size="18" decorative />
        <span>{{ rewardStore.warning || growthStore.warning || achievementStore.warning }}</span>
      </div>

      <div v-if="isDevRoute" class="reward-page__source-note" role="note">
        <AppIcon name="info" :size="18" decorative />
        <span>开发页使用固定 SAMPLE 夹具；正式入口只显示正式学习事实。</span>
      </div>

      <AppLoading
        v-if="rewardStore.loading || growthStore.loading || achievementStore.loading"
        label="正在整理成长反馈"
      />
      <template v-else>
        <section class="reward-page__growth-card" aria-labelledby="growth-card-title">
          <div class="reward-page__growth-heading">
            <div>
              <p class="curriculum-eyebrow">KnowledgeEnergy</p>
              <h2 id="growth-card-title">教材成长能量</h2>
            </div>
            <AppIcon name="sparkles" :size="28" color="var(--color-primary)" decorative />
          </div>
          <div class="reward-page__energy-value">
            <strong>{{ energy?.current ?? 0 }}</strong>
            <span>累计能量</span>
          </div>
          <div class="reward-page__level-row">
            <span>成长等级 {{ growth?.growthLevel ?? 1 }}</span>
            <span>{{ growth?.progressToNextLevel ?? 0 }}% 到下一级</span>
          </div>
          <AppProgress
            :value="growth?.progressToNextLevel ?? 0"
            label="成长等级进度"
            :show-value="false"
            state="success"
          />
          <p class="reward-page__growth-caption">
            这里保留原有课程、练习与复习产生的成长能量，不是可消费积分。喂养不会减少它，也不会改变掌握度。
          </p>
        </section>

        <section class="reward-page__achievements" aria-labelledby="achievement-title">
          <div class="reward-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">Milestones</p>
              <h2 id="achievement-title">教材学习里程碑</h2>
            </div>
            <strong>{{ achievementStore.unlockedCount }} / {{ progress.length }} 已达成</strong>
          </div>
          <AppEmptyState
            v-if="!progress.length"
            title="里程碑正在准备中"
            description="完成学习后，这里会显示已经发生的成长里程碑。"
          />
          <ul v-else class="reward-page__achievement-grid">
            <li
              v-for="item in progress"
              :key="item.definition.id"
              class="reward-page__achievement-card"
            >
              <div
                class="reward-page__achievement-icon"
                :class="{ 'reward-page__achievement-icon--unlocked': item.status === 'unlocked' }"
              >
                <AppIcon :name="item.definition.iconKey" :size="22" decorative />
              </div>
              <div class="reward-page__achievement-copy">
                <div class="reward-page__achievement-title">
                  <h3>{{ item.definition.title }}</h3>
                  <span :class="`reward-page__status reward-page__status--${item.status}`">
                    {{ item.status === 'unlocked' ? '已达成' : '进行中' }}
                  </span>
                </div>
                <p>{{ item.definition.description }}</p>
                <div class="reward-page__achievement-meta">
                  <span>{{ progressLabel(item) }}</span>
                  <span>{{ item.percentage }}%</span>
                </div>
                <AppProgress
                  :value="item.percentage"
                  :label="`${item.definition.title}进度`"
                  :show-value="false"
                  :state="item.status === 'unlocked' ? 'success' : 'normal'"
                />
              </div>
            </li>
          </ul>
        </section>

        <section class="reward-page__history" aria-labelledby="reward-history-title">
          <div class="reward-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">Reward history</p>
              <h2 id="reward-history-title">教材成长记录</h2>
            </div>
            <strong>{{ events.length }} 条</strong>
          </div>
          <AppEmptyState
            v-if="!events.length"
            title="还没有教材成长记录"
            description="完成课程、练习或主动巩固后，这里会留下记录。"
          />
          <ol v-else class="reward-page__event-list">
            <li v-for="event in events" :key="event.id" class="reward-page__event">
              <span class="reward-page__event-icon" aria-hidden="true">
                <AppIcon
                  :name="event.type === 'knowledge_mastered' ? 'sparkles' : 'check-circle'"
                  :size="20"
                  decorative
                />
              </span>
              <div class="reward-page__event-copy">
                <div class="reward-page__event-heading">
                  <h3>{{ typeLabels[event.type] }}</h3>
                  <span v-if="event.provenance.isSampleDerived" class="reward-page__sample-badge"
                    >开发样本</span
                  >
                </div>
                <p>{{ sourceLabel(event) }} · {{ formatTime(event.occurredAt) }}</p>
              </div>
              <strong class="reward-page__event-value">+{{ event.reward.knowledgeEnergy }}</strong>
            </li>
          </ol>
        </section>
      </template>
    </div>
  </AppShell>
</template>
