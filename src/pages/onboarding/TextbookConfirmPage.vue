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
import { G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID } from '@/data/curriculum/grade-1'
import { G2_PEP_CHINESE_GRADE_ID } from '@/data/curriculum/grade-2'
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
const isChinesePilot = computed(() => curriculumStore.isChinesePilot)
const isEnglishPilot = computed(() => curriculumStore.isEnglishPilot)
const isMathPilot = computed(() => curriculumStore.isMathPilot)
const englishGradeLabel = computed(() =>
  curriculumStore.selectedGradeId === G2_PEP_CHINESE_GRADE_ID ? '二年级' : '一年级',
)
const englishVolumeLabel = computed(() =>
  curriculumStore.selectedSemesterId === G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID ? '下册' : '上册',
)
const pilotSubject = computed<SubjectCode | null>(() =>
  isChinesePilot.value ? 'CHINESE' : isEnglishPilot.value ? 'ENGLISH' : null,
)
const pilotSubjectLabel = computed(() =>
  pilotSubject.value === 'CHINESE' ? '语文' : pilotSubject.value === 'ENGLISH' ? '英语' : '',
)
const requiredSubjects = computed<SubjectCode[]>(() =>
  pilotSubject.value ? [pilotSubject.value] : subjects.map((subject) => subject.code),
)
const hasUnavailableSubject = computed(() =>
  isMathPilot.value
    ? ['MATH', 'ENGLISH'].every(
        (code) => curriculumStore.resolutionStatus[code as SubjectCode] === 'NOT_AVAILABLE',
      )
    : requiredSubjects.value.some(
        (subjectCode) => curriculumStore.resolutionStatus[subjectCode] === 'NOT_AVAILABLE',
      ),
)
const canConfirm = computed(
  () =>
    !loading.value &&
    profileReady.value &&
    !hasUnavailableSubject.value &&
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
    :title="
      isMathPilot
        ? '确认你的数学和英语课本'
        : isChinesePilot
          ? '先确认你的语文课本'
          : isEnglishPilot
            ? '先确认你的英语课本'
            : '确认一下你的课本'
    "
    :description="
      isMathPilot
        ? '深圳二年级上册已接入北师大版数学和沪教版英语。选择正在使用的课本，可以只选其中一科。'
        : isChinesePilot
          ? '广东、湖北的一、二年级试点当前先开放人教版语文，数学和英语会在资料准备好后开放。'
          : isEnglishPilot
            ? `深圳地区当前先开放沪教版英语${englishGradeLabel}${englishVolumeLabel}，其他学科会在资料准备好后开放。`
            : '根据你选择的地区和年级，我们找到了这些学习版本。请分别确认三科课本。'
    "
    :step="3"
    :back-to="backTo"
    :context="isSettingsEdit ? '我的学习设置' : '课程配置'"
  >
    <AppLoading
      v-if="loading"
      :label="
        isMathPilot
          ? '正在准备数学和英语教材'
          : isChinesePilot
            ? '正在准备语文教材'
            : isEnglishPilot
              ? '正在准备英语教材'
              : '正在准备三科教材'
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
        <template v-if="isMathPilot">
          数学有知识讲解、看图闯关和动手探究；英语有单词拼写与句子练习。请选择要学习的科目课本，已有的英语配置可以继续使用。
        </template>
        <template v-else-if="isChinesePilot">
          当前已接入广东、湖北一、二年级人教版语文课程，数学和英语会在资料准备好后开放。
        </template>
        <template v-else-if="isEnglishPilot">
          当前已接入深圳地区沪教版（牛津上海版）{{ englishGradeLabel
          }}{{ englishVolumeLabel }}英语课程，其他学科会在资料准备好后开放。
        </template>
        <template v-else>
          地区只用来查找教材。出版社和教材版本来自课程数据层，不会由页面自行猜测。
        </template>
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
        />
      </div>
      <AppEmptyState
        v-if="hasUnavailableSubject"
        :title="pilotSubject ? `${pilotSubjectLabel}教材暂时无法使用` : '还有学科没有匹配课本'"
        :description="
          isChinesePilot
            ? '请确认当前选择的是广东或湖北。'
            : isEnglishPilot
              ? '请确认当前选择的是深圳市。'
              : '请返回修改地区或年级；没有匹配关系时，不会随机选择教材。'
        "
        action-label="修改地区"
        @action="router.push('/onboarding/region')"
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
        <p v-if="!canConfirm" class="curriculum-hint">
          {{
            isMathPilot
              ? '请先确认数学或英语教材后再继续。'
              : isChinesePilot
                ? '请先确认语文教材后再继续。'
                : isEnglishPilot
                  ? '请先确认英语教材后再继续。'
                  : '请先确认三科教材后再继续。'
          }}
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
        description="请返回修改地区或年级，或等待课程数据补充。"
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
