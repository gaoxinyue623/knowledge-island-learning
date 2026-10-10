<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import TextbookCoverage from '@/components/curriculum/TextbookCoverage.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const selectionAvailable = ref(false)
const isSettingsEdit = computed(() => route.query.from === 'settings')
const backTo = computed(() => (isSettingsEdit.value ? '/curriculum-settings' : '/onboarding'))
function selectContext(selection: { gradeId: string; semesterId: string }) {
  curriculumStore.selectGrade(selection.gradeId)
  curriculumStore.selectSemester(selection.semesterId)
}
function continueToTextbooks() {
  if (selectionAvailable.value)
    router.push({
      path: '/onboarding/textbooks',
      query: isSettingsEdit.value ? { from: 'settings' } : undefined,
    })
}
</script>

<template>
  <CurriculumPageFrame
    title="选择年级和课本册次"
    description="先了解各年级的教材接入情况，再选择适合你的课本。有部分学科缺失时，仍可学习已接入的学科。"
    :step="1"
    :back-to="backTo"
  >
    <TextbookCoverage
      :grade-id="curriculumStore.selectedGradeId"
      :semester-id="curriculumStore.selectedSemesterId"
      @select="selectContext"
      @availability="selectionAvailable = $event"
    />
    <div class="curriculum-actions">
      <p v-if="!selectionAvailable" class="curriculum-hint">
        请在总览中选择一个已接入的年级和册次。
      </p>
      <AppButton
        size="lg"
        icon-right="arrow-right"
        :disabled="!selectionAvailable"
        @click="continueToTextbooks"
        >继续选择教材版本</AppButton
      >
    </div>
  </CurriculumPageFrame>
</template>
