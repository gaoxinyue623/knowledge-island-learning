<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBottomSheet from '@/components/common/AppBottomSheet.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import TextbookVersionSelector from '@/components/curriculum/TextbookVersionSelector.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'
import { curriculumService } from '@/services'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { LOCAL_STUDENT_ID } from '@/stores/studentStore'
import type { SubjectCode, TextbookDisplay } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()

const subjects: Array<{
  code: SubjectCode
  key: 'chinese' | 'math' | 'english'
  label: string
  icon: 'book-open' | 'route' | 'navigation'
}> = [
  { code: 'CHINESE', key: 'chinese', label: '语文', icon: 'book-open' },
  { code: 'MATH', key: 'math', label: '数学', icon: 'route' },
  { code: 'ENGLISH', key: 'english', label: '英语', icon: 'navigation' },
]

const displays = ref<Record<SubjectCode, TextbookDisplay[]>>({
  CHINESE: [],
  MATH: [],
  ENGLISH: [],
})
const loading = ref(true)
const error = ref<string | null>(null)
const activeSubject = ref<SubjectCode | null>(null)
const helpOpen = ref(false)
const gradeName = ref('当前年级')
const semesterName = ref('当前学期')

const isSettingsEdit = computed(() => route.query.from === 'settings')
const backTo = computed(() => (isSettingsEdit.value ? '/curriculum-settings' : '/onboarding/grade'))
const profileReady = computed(() =>
  Boolean(
    curriculumStore.selectedRegionId &&
    curriculumStore.selectedGradeId &&
    curriculumStore.selectedSemesterId,
  ),
)
const hasNoTextbooks = computed(() =>
  subjects.every((subject) => curriculumStore.resolutionStatus[subject.code] === 'NOT_AVAILABLE'),
)
const canConfirm = computed(
  () =>
    !loading.value &&
    !error.value &&
    profileReady.value &&
    !hasNoTextbooks.value &&
    curriculumStore.draftIsComplete,
)

const activeOptions = computed(() =>
  activeSubject.value ? displays.value[activeSubject.value] : [],
)
const activeSelectedId = computed(() =>
  activeSubject.value ? curriculumStore.selectedTextbooks[activeSubject.value] : null,
)

function selectedDisplay(subjectCode: SubjectCode): TextbookDisplay | null {
  const selectedId = curriculumStore.selectedTextbooks[subjectCode]
  return (
    displays.value[subjectCode].find((display) => display.textbook.id === selectedId) ??
    displays.value[subjectCode][0] ??
    null
  )
}

async function loadTextbooks() {
  loading.value = true
  error.value = null
  if (!profileReady.value) {
    error.value = '请先完成地区、年级和学期选择'
    loading.value = false
    return
  }

  try {
    const [resolution, grades, semesters] = await Promise.all([
      curriculumStore.resolveTextbooks(),
      curriculumService.getGrades(),
      curriculumService.getSemesters(),
    ])
    if (!resolution) {
      error.value = curriculumStore.error ?? '教材暂时无法加载'
      return
    }
    gradeName.value =
      grades.find((grade) => grade.id === curriculumStore.selectedGradeId)?.name ?? gradeName.value
    semesterName.value =
      semesters.find((semester) => semester.id === curriculumStore.selectedSemesterId)?.name ??
      semesterName.value

    const nextDisplays = await Promise.all(
      subjects.map(async (subject) => {
        const result = await Promise.all(
          resolution[subject.key].availableTextbooks.map((textbook) =>
            curriculumService.getTextbookDisplay(textbook.id),
          ),
        )
        return [
          subject.code,
          result.filter((display): display is TextbookDisplay => Boolean(display)),
        ] as const
      }),
    )
    displays.value = Object.fromEntries(nextDisplays) as Record<SubjectCode, TextbookDisplay[]>
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '教材详情暂时无法加载'
  } finally {
    loading.value = false
  }
}

function openSelector(subjectCode: SubjectCode) {
  activeSubject.value = subjectCode
}

function selectTextbook(textbookId: string) {
  if (!activeSubject.value) return
  if (curriculumStore.selectTextbook(activeSubject.value, textbookId)) activeSubject.value = null
}

async function confirmCurriculum() {
  const profile = await curriculumStore.confirmCurriculum(LOCAL_STUDENT_ID)
  if (!profile) return
  router.push(isSettingsEdit.value ? '/curriculum-settings' : '/onboarding/character')
}

onMounted(() => void loadTextbooks())
</script>

<template>
  <CurriculumPageFrame
    title="选择你的课本"
    description="按年级和上下册选择正在使用的教材。所有已接入版本均可自主选择，不受地区限制。"
    :step="3"
    :back-to="backTo"
    :context="isSettingsEdit ? '我的学习设置' : '课程配置'"
  >
    <AppLoading v-if="loading" label="正在准备可选教材" />
    <AppErrorState
      v-else-if="error"
      title="教材暂时打不开"
      :description="error"
      @retry="loadTextbooks"
    />
    <template v-else>
      <div class="curriculum-alert curriculum-alert--info">
        可以只选一科，也可以分别选择多科。请对照课本封面的出版社、年级和上下册，选择适合自己的版本。
      </div>
      <div class="textbook-card-grid">
        <TextbookCard
          v-for="subject in subjects"
          :key="subject.code"
          :subject-code="subject.code"
          :subject-name="subject.label"
          :subject-icon="subject.icon"
          :textbook="selectedDisplay(subject.code)"
          :resolution-status="curriculumStore.resolutionStatus[subject.code]"
          :selected="Boolean(curriculumStore.selectedTextbooks[subject.code])"
          :candidate-count="displays[subject.code].length"
          :grade-name="gradeName"
          :semester-name="semesterName"
          @change="openSelector(subject.code)"
          @clear="curriculumStore.clearTextbookSelection(subject.code)"
        />
      </div>
      <AppEmptyState
        v-if="hasNoTextbooks"
        title="当前年级和学期还没有可选教材"
        description="可以检查年级和上下册是否选对，或等待后续教材接入。无需更换地区。"
        action-label="修改年级和学期"
        @action="
          router.push({
            path: '/onboarding/grade',
            query: isSettingsEdit ? { from: 'settings' } : {},
          })
        "
      />
      <section class="curriculum-helper" aria-label="教材确认帮助">
        <button class="curriculum-text-button" type="button" @click="helpOpen = true">
          <span>怎么看我的教材版本？</span>
        </button>
        <button class="curriculum-text-button" type="button" @click="helpOpen = true">
          <span>请家长帮我确认</span>
        </button>
      </section>
      <div class="curriculum-actions">
        <p v-if="curriculumStore.error" class="curriculum-alert" role="alert">
          {{ curriculumStore.error }}
        </p>
        <p v-if="!canConfirm" class="curriculum-hint">
          请至少选择一科教材后再继续，其他科目可以稍后在学习设置中添加。
        </p>
        <AppButton
          size="lg"
          :disabled="!canConfirm"
          :loading="curriculumStore.loading"
          @click="confirmCurriculum"
        >
          {{ isSettingsEdit ? '保存教材配置' : '确认教材并继续' }}
        </AppButton>
      </div>
    </template>
    <AppBottomSheet
      :open="Boolean(activeSubject)"
      :title="
        activeSubject
          ? `${subjects.find((subject) => subject.code === activeSubject)?.label ?? ''}教材版本`
          : '教材版本'
      "
      secondary-label="关闭"
      @close="activeSubject = null"
      @secondary="activeSubject = null"
    >
      <TextbookVersionSelector
        v-if="activeOptions.length"
        :options="activeOptions"
        :selected-id="activeSelectedId"
        :grade-name="gradeName"
        :semester-name="semesterName"
        @select="selectTextbook"
      />
      <AppEmptyState
        v-else
        title="暂时没有可选版本"
        description="当前年级和学期尚未接入这门学科的教材，其他学科可以正常选择。"
      />
    </AppBottomSheet>
    <AppBottomSheet
      :open="helpOpen"
      title="怎么看我的教材版本？"
      primary-label="知道了"
      @close="helpOpen = false"
      @primary="helpOpen = false"
    >
      <p>可以请家长查看课本封面上的出版社、年级和上册/下册信息，再回到这里选择完整版本。</p>
    </AppBottomSheet>
  </CurriculumPageFrame>
</template>
