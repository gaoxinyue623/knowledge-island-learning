<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppShell from '@/layouts/AppShell.vue'
import CurriculumProfileCard from '@/components/curriculum/CurriculumProfileCard.vue'
import CurriculumSwitchDialog from '@/components/curriculum/CurriculumSwitchDialog.vue'
import {
  getCurriculumPresentation,
  type CurriculumPresentation,
} from '@/composables/useCurriculumPresentation'
import { useCurriculumStore } from '@/stores/curriculumStore'
import type { SubjectCode } from '@/types'

const router = useRouter()
const curriculumStore = useCurriculumStore()
const presentation = ref<CurriculumPresentation | null>(null)
const error = ref<string | null>(null)
const switchDialogOpen = ref(false)

const subjectLabels: Record<SubjectCode, string> = {
  CHINESE: '语文',
  MATH: '数学',
  ENGLISH: '英语',
}
const profile = computed(() => curriculumStore.curriculumProfile)

async function loadSettings() {
  error.value = null
  if (!profile.value) {
    error.value = '还没有学习配置，请先完成首次设置。'
    return
  }
  try {
    presentation.value = await getCurriculumPresentation(profile.value)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '学习设置暂时无法读取'
  }
}

function requestSwitch() {
  switchDialogOpen.value = true
}

function confirmSwitch() {
  switchDialogOpen.value = false
  curriculumStore.beginEdit()
  router.push({
    path: '/onboarding/grade',
    query: { from: 'settings' },
  })
}

function editSubject(subjectCode: SubjectCode) {
  curriculumStore.beginEdit()
  router.push({ path: `/curriculum-settings/textbook/${subjectCode}`, query: { from: 'settings' } })
}

onMounted(() => void loadSettings())
</script>

<template>
  <AppShell :show-bottom-nav="true" context="我的学习设置">
    <div class="curriculum-page content-container">
      <RouterLink class="personal-back" to="/profile">← 返回我的</RouterLink>
      <header class="curriculum-page__header">
        <p class="curriculum-eyebrow">PROFILE / SETTINGS</p>
        <h1>我的学习设置</h1>
        <p>先选择年级和课本册次，再按版本选择各科教材。更换年级或教材后，历史学习记录会保留。</p>
      </header>
      <AppLoading v-if="curriculumStore.loading" label="正在读取学习设置" />
      <AppErrorState
        v-else-if="error"
        title="学习设置暂时打不开"
        :description="error"
        @retry="loadSettings"
      />
      <template v-else-if="presentation">
        <section class="curriculum-profile-grid" aria-label="课程基础设置">
          <CurriculumProfileCard
            label="当前年级"
            :value="presentation.gradeName"
            icon="book-open"
          />
          <CurriculumProfileCard
            label="课本册次"
            :value="presentation.semesterName"
            icon="book-open"
          />
        </section>
        <div class="curriculum-settings-actions">
          <AppButton variant="secondary" icon-left="book-open" @click="requestSwitch"
            >修改年级和册次</AppButton
          >
        </div>
        <section class="curriculum-settings-subjects" aria-labelledby="subject-settings-title">
          <div class="curriculum-section-heading">
            <div>
              <p class="curriculum-eyebrow">三科独立保存</p>
              <h2 id="subject-settings-title">当前教材</h2>
            </div>
            <span>切换数学不会影响语文和英语</span>
          </div>
          <div
            v-for="subjectCode in ['CHINESE', 'MATH', 'ENGLISH'] as SubjectCode[]"
            :key="subjectCode"
            class="curriculum-setting-row"
          >
            <div>
              <strong>{{ subjectLabels[subjectCode] }}</strong>
              <span>{{
                presentation.textbooks[subjectCode]?.textbook.versionName ?? '待确认'
              }}</span>
              <small>{{
                presentation.textbooks[subjectCode]?.publisher.name ?? '暂无出版社信息'
              }}</small>
            </div>
            <AppButton
              variant="ghost"
              size="sm"
              icon-right="chevron-right"
              @click="editSubject(subjectCode)"
              >更换{{ subjectLabels[subjectCode] }}教材</AppButton
            >
          </div>
        </section>
        <section class="personal-panel">
          <h2>历史学习</h2>
          <p>切换年级不会删除历史学习记录，可以随时回看已完成的学习。</p>
          <RouterLink class="personal-text-link" to="/history">查看学习记录 →</RouterLink>
        </section>
      </template>
      <CurriculumSwitchDialog
        :open="switchDialogOpen"
        title="要更换年级或册次吗？"
        description="更换后，会重新查询三科课本；历史学习记录不会删除。"
        @close="switchDialogOpen = false"
        @confirm="confirmSwitch"
      />
    </div>
  </AppShell>
</template>
