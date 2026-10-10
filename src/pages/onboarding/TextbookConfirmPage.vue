<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBottomSheet from '@/components/common/AppBottomSheet.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import TextbookCoverage from '@/components/curriculum/TextbookCoverage.vue'
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
const selectedCount = computed(
  () => subjects.filter((subject) => curriculumStore.selectedTextbooks[subject.code]).length,
)

const isSettingsEdit = computed(() => route.query.from === 'settings')
const backTo = computed(() => (isSettingsEdit.value ? '/curriculum-settings' : '/onboarding/grade'))
const profileReady = computed(() =>
  Boolean(curriculumStore.selectedGradeId && curriculumStore.selectedSemesterId),
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
    curriculumStore.selectSingleTextbookDefaults()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '教材详情暂时无法加载'
  } finally {
    loading.value = false
  }
}

function openSelector(subjectCode: SubjectCode) {
  const options = displays.value[subjectCode]
  if (options.length === 1) {
    curriculumStore.selectTextbook(subjectCode, options[0]!.textbook.id)
    return
  }
  if (!options.length) return
  activeSubject.value = subjectCode
}

function selectContext(selection: { gradeId: string; semesterId: string }) {
  if (loading.value || curriculumStore.loading) return
  if (
    selection.gradeId === curriculumStore.selectedGradeId &&
    selection.semesterId === curriculumStore.selectedSemesterId
  )
    return
  activeSubject.value = null
  curriculumStore.selectGrade(selection.gradeId)
  curriculumStore.selectSemester(selection.semesterId)
  void loadTextbooks()
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
    title="选择教材版本"
    description="已导入教材对所有账号开放。按当前年级和课本册次，选择各科正在使用的教材版本。"
    :step="2"
    :back-to="backTo"
    :context="isSettingsEdit ? '我的学习设置' : '课程配置'"
  >
    <details class="textbook-coverage-toggle">
      <summary>查看各年级教材接入情况 / 切换年级与册次</summary>
      <TextbookCoverage
        :grade-id="curriculumStore.selectedGradeId"
        :semester-id="curriculumStore.selectedSemesterId"
        :disabled="loading || curriculumStore.loading"
        @select="selectContext"
      />
    </details>
    <AppLoading v-if="loading" label="正在准备可选教材" />
    <AppEmptyState
      v-else-if="!profileReady"
      title="先完成学习信息"
      description="请选择年级和课本册次，再选择各科教材版本。"
      action-label="继续设置"
      @action="
        router.replace({
          path: '/onboarding/grade',
          query: route.query,
        })
      "
    />
    <AppErrorState
      v-else-if="error"
      title="教材暂时打不开"
      :description="error"
      @retry="loadTextbooks"
    />
    <template v-else>
      <div class="curriculum-alert curriculum-alert--info">
        只有一个版本的学科已默认选中，可直接确认，也可取消。多个版本请先选择；尚未接入的学科不影响继续。
      </div>
      <div class="curriculum-section-heading" aria-live="polite">
        <h2>{{ gradeName }} · {{ semesterName }}</h2>
        <span>已选 {{ selectedCount }} 科 · 确认后保存到当前账号</span>
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
        description="可以检查年级和上下册是否选对，或等待后续教材接入。"
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
