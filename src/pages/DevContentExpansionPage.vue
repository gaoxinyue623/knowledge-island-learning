<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppShell from '@/layouts/AppShell.vue'
import InteractiveActivityRenderer from '@/components/interactive-activity/InteractiveActivityRenderer.vue'
import { goldenContentExpansionBundles } from '@/data/content-expansion'
import {
  generateExerciseInstances,
  validateGeneratedExerciseInstances,
} from '@/services/exercise-template'
import { practiceModeLabel } from '@/services/content-expansion'
import type { ActivityResult, ContentExpansionBundle, ExerciseInstance } from '@/types'

const route = useRoute()
const router = useRouter()
const selectedKnowledgePointId = ref(
  typeof route.query.knowledgePointId === 'string'
    ? route.query.knowledgePointId
    : (goldenContentExpansionBundles[0]?.knowledgePointId ?? ''),
)
const selectedActivityId = ref<string | null>(null)
const previewInstances = ref<ExerciseInstance[]>([])
const previewMessage = ref('')
const lastResult = ref<ActivityResult | null>(null)

const bundles = goldenContentExpansionBundles
const selectedBundle = computed<ContentExpansionBundle | undefined>(() =>
  bundles.find((bundle) => bundle.knowledgePointId === selectedKnowledgePointId.value),
)
const selectedActivity = computed(
  () =>
    selectedBundle.value?.activities.find((activity) => activity.id === selectedActivityId.value) ??
    null,
)

function selectBundle(bundle: ContentExpansionBundle): void {
  selectedKnowledgePointId.value = bundle.knowledgePointId
  selectedActivityId.value = bundle.activities[0]?.id ?? null
  previewInstances.value = []
  previewMessage.value = ''
  void router.replace({ query: { knowledgePointId: bundle.knowledgePointId } })
}

function generatePreview(): void {
  const template = selectedBundle.value?.exerciseTemplates[0]
  if (!template) return
  const instances = generateExerciseInstances(template, 'content-expansion-preview', 3)
  const report = validateGeneratedExerciseInstances(template, instances)
  previewInstances.value = instances
  previewMessage.value = report.valid
    ? `已生成 ${instances.length} 个确定性实例。`
    : report.issues.join('；')
}

function selectActivity(activityId: string): void {
  selectedActivityId.value = activityId
  lastResult.value = null
}

function recordResult(result: ActivityResult): void {
  lastResult.value = result
}

onMounted(() => {
  if (selectedBundle.value?.activities[0])
    selectedActivityId.value = selectedBundle.value.activities[0].id
})
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / Content Expansion">
    <div class="content-expansion-page content-container">
      <header class="content-expansion-page__header">
        <div>
          <p class="curriculum-eyebrow">DEVELOPMENT ONLY · CONTENT EXPANSION 01</p>
          <h1>一年级数学 Golden Content</h1>
          <p>只展示 4 个候选知识点的体验层：学习内容、互动活动、练习模板、拓展和挑战。</p>
        </div>
        <div class="content-expansion-page__header-actions">
          <AppButton size="sm" variant="secondary" @click="generatePreview">生成题实例</AppButton>
          <RouterLink class="content-expansion-page__engine-link" to="/dev/activity-engine"
            >打开活动引擎</RouterLink
          >
        </div>
      </header>

      <section class="content-expansion-page__notice" role="status">
        Golden 状态：SAMPLE / UNVERIFIED。正式 profile 数据集不会自动读取这些内容。
      </section>

      <div class="content-expansion-page__bundle-tabs" aria-label="Golden 知识点选择">
        <button
          v-for="bundle in bundles"
          :key="bundle.knowledgePointId"
          type="button"
          :class="{
            'content-expansion-page__bundle-tab--current':
              bundle.knowledgePointId === selectedBundle?.knowledgePointId,
          }"
          @click="selectBundle(bundle)"
        >
          {{ bundle.learningContent.title }}
        </button>
      </div>

      <template v-if="selectedBundle">
        <section class="content-expansion-page__learning" aria-labelledby="golden-learning-title">
          <div>
            <p class="curriculum-eyebrow">LearningContent · 2 blocks</p>
            <h2 id="golden-learning-title">{{ selectedBundle.learningContent.title }}</h2>
            <ul>
              <li v-for="goal in selectedBundle.learningContent.learningGoals" :key="goal">
                {{ goal }}
              </li>
            </ul>
          </div>
          <div class="content-expansion-page__learning-blocks">
            <article v-for="block in selectedBundle.learningContent.blocks" :key="block.id">
              <strong>{{ block.title }}</strong>
              <p>{{ block.block.text }}</p>
            </article>
          </div>
        </section>

        <div class="content-expansion-page__columns">
          <section class="content-expansion-page__panel" aria-labelledby="golden-activities-title">
            <div class="content-expansion-page__panel-heading">
              <div>
                <p class="curriculum-eyebrow">InteractiveActivity</p>
                <h2 id="golden-activities-title">互动活动</h2>
              </div>
              <strong>{{ selectedBundle.activities.length }}</strong>
            </div>
            <div class="content-expansion-page__activity-list">
              <button
                v-for="activity in selectedBundle.activities"
                :key="activity.id"
                type="button"
                :class="{
                  'content-expansion-page__activity-list-item--current':
                    activity.id === selectedActivityId,
                }"
                @click="selectActivity(activity.id)"
              >
                <span>{{ activity.title }}</span
                ><small>{{ activity.activityType }} · {{ activity.difficulty }}</small>
              </button>
            </div>
            <InteractiveActivityRenderer
              v-if="selectedActivity"
              :activity="selectedActivity"
              profile-id="dev-content-expansion"
              @result="recordResult"
            />
            <p v-if="lastResult" class="content-expansion-page__result" role="status">
              本次活动：{{ lastResult.status }}。
            </p>
          </section>

          <section class="content-expansion-page__panel" aria-labelledby="golden-practice-title">
            <div class="content-expansion-page__panel-heading">
              <div>
                <p class="curriculum-eyebrow">PracticeSet</p>
                <h2 id="golden-practice-title">练习集合</h2>
              </div>
              <strong>{{ selectedBundle.practiceSets.length }}</strong>
            </div>
            <ul class="content-expansion-page__practice-list">
              <li v-for="practice in selectedBundle.practiceSets" :key="practice.id">
                <span>{{ practiceModeLabel(practice.mode) }}</span>
                <strong>{{ practice.title }}</strong>
                <small
                  >{{ practice.targetCount }} 题 · {{ practice.templateIds.length }} 个模板</small
                >
              </li>
            </ul>
            <div class="content-expansion-page__extension-list">
              <p class="curriculum-eyebrow">Extension / Challenge</p>
              <p v-for="item in selectedBundle.extensionActivities" :key="item.id">
                <strong>拓展：</strong>{{ item.title }}
              </p>
              <p v-for="item in selectedBundle.challenges" :key="item.id">
                <strong>挑战：</strong>{{ item.title }}
              </p>
            </div>
          </section>
        </div>
      </template>

      <section
        v-if="previewInstances.length"
        class="content-expansion-page__preview"
        aria-labelledby="generated-preview-title"
      >
        <div class="content-expansion-page__panel-heading">
          <div>
            <p class="curriculum-eyebrow">ExerciseInstance · seed</p>
            <h2 id="generated-preview-title">确定性生成预览</h2>
          </div>
          <strong>{{ previewInstances.length }}</strong>
        </div>
        <p role="status">{{ previewMessage }}</p>
        <ol>
          <li v-for="instance in previewInstances" :key="instance.id">
            <code>{{ instance.id }}</code
            ><span>{{ instance.prompt.blocks[0]?.value }}</span>
          </li>
        </ol>
      </section>
    </div>
  </AppShell>
</template>
