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
const switchKind = ref<'region' | 'grade' | null>(null)

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

function requestSwitch(kind: 'region' | 'grade') {
  switchKind.value = kind
  switchDialogOpen.value = true
}

function confirmSwitch() {
  const kind = switchKind.value
  switchDialogOpen.value = false
  switchKind.value = null
  if (!kind) return
  curriculumStore.beginEdit()
  router.push({
    path: kind === 'region' ? '/onboarding/region' : '/onboarding/grade',
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
        <p>各科教材可自主选择，不受地区限制。更换年级或教材需要确认，历史学习记录会保留。</p>
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
          <CurriculumProfileCard label="学习地区" :value="presentation.regionName" icon="map-pin" />
          <CurriculumProfileCard
            label="当前年级"
            :value="presentation.gradeName"
            icon="book-open"
          />
          <CurriculumProfileCard
            label="当前学期"
            :value="presentation.semesterName"
            icon="book-open"
          />
        </section>
        <div class="curriculum-settings-actions">
          <AppButton variant="secondary" icon-left="map-pin" @click="requestSwitch('region')"
            >修改学习地区</AppButton
          >
          <AppButton variant="secondary" icon-left="book-open" @click="requestSwitch('grade')"
            >修改年级</AppButton
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
        :title="switchKind === 'region' ? '要更换学习地区吗？' : '要更换年级吗？'"
        :description="
          switchKind === 'region'
            ? '地区仅作为个人学习资料，更换地区不会清空已选教材，也不会限制可选版本。'
            : '更换年级后，会重新查询三科课本；历史学习记录不会删除。'
        "
        @close="switchDialogOpen = false"
        @confirm="confirmSwitch"
      />
    </div>
  </AppShell>
</template>
