<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import GradeSelector from '@/components/curriculum/GradeSelector.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'
import { curriculumService } from '@/services'
import { useCurriculumStore } from '@/stores/curriculumStore'
import type { Grade, Semester } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const grades = ref<Grade[]>([])
const semesters = ref<Semester[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const supportedGradeIds = ['SAMPLE_GRADE_3']
const isSettingsEdit = computed(() => route.query.from === 'settings')
const backTo = computed(() =>
  isSettingsEdit.value ? '/curriculum-settings' : '/onboarding/region',
)

const selectedSemesterId = computed(() => curriculumStore.selectedSemesterId)
const canContinue = computed(
  () =>
    Boolean(curriculumStore.selectedGradeId && curriculumStore.selectedSemesterId) &&
    supportedGradeIds.includes(curriculumStore.selectedGradeId ?? ''),
)

async function loadOptions() {
  loading.value = true
  error.value = null
  try {
    const [loadedGrades, loadedSemesters] = await Promise.all([
      curriculumService.getGrades(),
      curriculumService.getSemesters(),
    ])
    grades.value = loadedGrades
    semesters.value = loadedSemesters
    if (!curriculumStore.selectedSemesterId) {
      const upperSemester = loadedSemesters.find((semester) => semester.code === 'UPPER')
      if (upperSemester) curriculumStore.selectSemester(upperSemester.id)
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '年级暂时无法加载'
  } finally {
    loading.value = false
  }
}

function selectGrade(grade: Grade) {
  curriculumStore.selectGrade(grade.id)
}

function continueToTextbooks() {
  if (canContinue.value) {
    router.push({
      path: '/onboarding/textbooks',
      query: isSettingsEdit.value ? { from: 'settings' } : undefined,
    })
  }
}

onMounted(() => void loadOptions())
</script>

<template>
  <CurriculumPageFrame
    title="你现在几年级？"
    description="选择一个年级。当前 MVP 先开放三年级，其他年级会逐步准备。"
    :step="2"
    :back-to="backTo"
  >
    <AppLoading v-if="loading" label="正在准备年级选择" />
    <AppErrorState
      v-else-if="error"
      title="年级列表暂时打不开"
      :description="error"
      @retry="loadOptions"
    />
    <AppEmptyState
      v-else-if="!grades.length"
      title="这个年级列表正在准备中"
      description="请稍后再试，或返回重新选择地区。"
      action-label="返回地区"
      @action="router.push('/onboarding/region')"
    />
    <template v-else>
      <GradeSelector
        :grades="grades"
        :selected-grade-id="curriculumStore.selectedGradeId"
        :available-grade-ids="supportedGradeIds"
        @select="selectGrade"
      />
      <section class="semester-choice" aria-labelledby="semester-title">
        <div>
          <p class="curriculum-eyebrow">学习学期</p>
          <h2 id="semester-title">先从哪一册开始？</h2>
        </div>
        <div class="semester-choice__options">
          <button
            v-for="semester in semesters"
            :key="semester.id"
            class="semester-choice__option"
            :class="{ 'semester-choice__option--selected': selectedSemesterId === semester.id }"
            type="button"
            :aria-pressed="selectedSemesterId === semester.id"
            @click="curriculumStore.selectSemester(semester.id)"
          >
            {{ semester.name }}
          </button>
        </div>
        <p class="curriculum-hint">当前默认选择上册，你也可以在这里明确切换。</p>
      </section>
      <div class="curriculum-actions">
        <AppButton
          size="lg"
          icon-right="arrow-right"
          :disabled="!canContinue"
          @click="continueToTextbooks"
        >
          继续确认课本
        </AppButton>
      </div>
    </template>
  </CurriculumPageFrame>
</template>
