<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppShell from '@/layouts/AppShell.vue'
import { goldenContentExpansionBundles, unsupportedGoldenActivity } from '@/data/content-expansion'
import { activityRegistry } from '@/services/interactive-activity'
import InteractiveActivityRenderer from '@/components/interactive-activity/InteractiveActivityRenderer.vue'
import type { ActivityResult, InteractiveActivity } from '@/types'

const activities: InteractiveActivity[] = [
  ...goldenContentExpansionBundles.flatMap((bundle) => bundle.activities),
  unsupportedGoldenActivity,
]
const selectedId = ref(activities[0]?.id ?? '')
const lastResult = ref<ActivityResult | null>(null)
const selectedActivity = computed(
  () => activities.find((activity) => activity.id === selectedId.value) ?? activities[0],
)
const supportedCount = computed(
  () => Object.values(activityRegistry).filter((item) => item.supported).length,
)

function recordResult(result: ActivityResult): void {
  lastResult.value = result
}
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / Activity Engine">
    <div class="content-expansion-page content-container">
      <header class="content-expansion-page__header">
        <div>
          <p class="curriculum-eyebrow">DEVELOPMENT ONLY · CONTENT EXPANSION 01.2</p>
          <h1>Interactive Activity Engine</h1>
          <p>验证活动注册表、触摸操作、键盘替代方式和未支持类型的安全回退。</p>
        </div>
        <div class="content-expansion-page__metrics" aria-label="活动引擎概览">
          <strong>{{ supportedCount }}</strong
          ><span>种已实现渲染器</span>
        </div>
      </header>

      <section class="content-expansion-page__notice" role="status">
        所有内容都是 Golden 开发样本，不代表正式教材；完成活动只记录
        ActivityResult，不改变掌握度或地图解锁。
      </section>

      <div class="content-expansion-page__layout">
        <nav class="content-expansion-page__activity-nav" aria-label="活动类型选择">
          <button
            v-for="activity in activities"
            :key="activity.id"
            type="button"
            :class="{
              'content-expansion-page__activity-nav-item--current':
                activity.id === selectedActivity?.id,
            }"
            @click="selectedId = activity.id"
          >
            <span>{{ activityRegistry[activity.activityType].label }}</span>
            <small>{{ activity.title }}</small>
          </button>
        </nav>

        <section
          v-if="selectedActivity"
          class="content-expansion-page__stage"
          aria-labelledby="activity-stage-title"
        >
          <div class="content-expansion-page__stage-heading">
            <div>
              <p class="curriculum-eyebrow">{{ selectedActivity.activityType }}</p>
              <h2 id="activity-stage-title">{{ selectedActivity.title }}</h2>
            </div>
            <AppButton size="sm" variant="ghost" @click="lastResult = null">清除结果提示</AppButton>
          </div>
          <InteractiveActivityRenderer
            :activity="selectedActivity"
            profile-id="dev-activity-engine"
            @result="recordResult"
          />
          <p v-if="lastResult" class="content-expansion-page__result" role="status">
            ActivityResult：{{ lastResult.status }} · 尝试 {{ lastResult.attempts }} 次
          </p>
        </section>
      </div>
    </div>
  </AppShell>
</template>
