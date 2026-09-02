<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppShell from '@/layouts/AppShell.vue'
import CurriculumSummary from '@/components/curriculum/CurriculumSummary.vue'
import {
  getCurriculumPresentation,
  type CurriculumPresentation,
} from '@/composables/useCurriculumPresentation'
import { useCurriculumStore } from '@/stores/curriculumStore'

const curriculumStore = useCurriculumStore()
const presentation = ref<CurriculumPresentation | null>(null)
const error = ref<string | null>(null)

const contextLabel = computed(() =>
  presentation.value
    ? `${presentation.value.gradeName} · ${presentation.value.semesterName}`
    : '学习配置',
)

async function loadHome() {
  error.value = null
  if (!curriculumStore.curriculumProfile) {
    error.value = '还没有完成学习配置，请先完成地区、年级和教材选择。'
    return
  }
  try {
    presentation.value = await getCurriculumPresentation(curriculumStore.curriculumProfile)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '课程配置暂时无法读取'
  }
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
          <p class="curriculum-eyebrow">HOME · PHASE 8 LESSON PLAYER</p>
          <h1>准备好探索你的知识岛了吗？</h1>
          <p>你的地区、年级和三科教材已经准备好。现在可以从数学知识地图进入一段专注学习。</p>
        </header>
        <CurriculumSummary
          :region-name="presentation.regionName"
          :grade-name="presentation.gradeName"
          :semester-name="presentation.semesterName"
          :textbooks="presentation.textbooks"
        />
        <section class="curriculum-placeholder-panel">
          <h2>下一步学习入口</h2>
          <p>
            地图节点、学习步骤和可恢复的学习会话已经开放；正式题目与掌握度系统仍按后续阶段规划。
          </p>
          <div class="curriculum-actions">
            <AppButton icon-right="arrow-right" @click="$router.push('/learning-map')">
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
