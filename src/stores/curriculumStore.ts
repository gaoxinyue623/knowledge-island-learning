import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_SHENZHEN_ENGLISH_SEMESTER_ID,
  G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
  G1_SHENZHEN_REGION_ID,
} from '@/data/curriculum/grade-1'
import { G2_PEP_CHINESE_GRADE_ID } from '@/data/curriculum/grade-2'
import { curriculumService } from '@/services'
import type { CurriculumService } from '@/services/contracts'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import type {
  Id,
  ResolveAvailableTextbooksOutput,
  StudentCurriculumProfile,
  SubjectCode,
  TextbookResolutionStatus,
} from '@/types'

const SUBJECT_CODES: SubjectCode[] = ['CHINESE', 'MATH', 'ENGLISH']
// This pilot intentionally covers only the two user-requested regions for the
// Grade 1 and Grade 2 PEP Chinese candidate datasets. The legacy three-subject contract is
// kept only for explicitly supplied development/test profiles.
const CHINESE_PILOT_REGION_IDS = new Set<Id>([
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
])
const CHINESE_PILOT_GRADE_IDS = new Set<Id>([G1_PEP_CHINESE_GRADE_ID, G2_PEP_CHINESE_GRADE_ID])
const ENGLISH_PILOT_REGION_IDS = new Set<Id>([G1_SHENZHEN_REGION_ID])
const ENGLISH_PILOT_GRADE_IDS = new Set<Id>([G1_PEP_CHINESE_GRADE_ID, G2_PEP_CHINESE_GRADE_ID])
const ENGLISH_PILOT_SEMESTER_IDS = new Set<Id>([
  G1_SHENZHEN_ENGLISH_SEMESTER_ID,
  G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
])

export interface CurriculumStoreDependencies {
  curriculumService: CurriculumService
}

const defaultDependencies: CurriculumStoreDependencies = { curriculumService }
let dependencies: CurriculumStoreDependencies = defaultDependencies

function isLegacySampleProfile(profile: StudentCurriculumProfile): boolean {
  return [
    profile.studentId,
    profile.regionId,
    profile.gradeId,
    profile.semesterId,
    profile.chineseTextbookVersionId,
    profile.mathTextbookVersionId,
    profile.englishTextbookVersionId,
  ].some((value) => value?.startsWith('SAMPLE_') === true)
}

function isEnglishPilotContext(
  regionId: Id | null,
  gradeId: Id | null,
  semesterId: Id | null,
): boolean {
  return (
    Boolean(regionId && ENGLISH_PILOT_REGION_IDS.has(regionId)) &&
    Boolean(gradeId && ENGLISH_PILOT_GRADE_IDS.has(gradeId)) &&
    Boolean(semesterId && ENGLISH_PILOT_SEMESTER_IDS.has(semesterId))
  )
}

function isMathPilotContext(
  regionId: Id | null,
  gradeId: Id | null,
  semesterId: Id | null,
): boolean {
  return (
    regionId === G1_SHENZHEN_REGION_ID &&
    gradeId === G2_PEP_CHINESE_GRADE_ID &&
    semesterId === G1_SHENZHEN_ENGLISH_SEMESTER_ID
  )
}

/** Test/dev seam; the application uses the runtime curriculum boundary. */
export function configureCurriculumStore(overrides: Partial<CurriculumStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetCurriculumStoreDependencies(): void {
  dependencies = defaultDependencies
}

type SubjectTextbookSelection = Record<SubjectCode, Id | null>
type SubjectResolutionStatus = Record<SubjectCode, TextbookResolutionStatus>

const emptySelections = (): SubjectTextbookSelection => ({
  CHINESE: null,
  MATH: null,
  ENGLISH: null,
})

const emptyResolutionStatus = (): SubjectResolutionStatus => ({
  CHINESE: 'NOT_AVAILABLE',
  MATH: 'NOT_AVAILABLE',
  ENGLISH: 'NOT_AVAILABLE',
})

export const useCurriculumStore = defineStore('curriculum', () => {
  const storedProfile = curriculumProfileRepository.load()
  const persistedProfile =
    storedProfile && !isLegacySampleProfile(storedProfile) ? storedProfile : null
  if (storedProfile && !persistedProfile) curriculumProfileRepository.clear()
  const selectedRegionId = ref<Id | null>(persistedProfile?.regionId ?? null)
  const selectedGradeId = ref<Id | null>(persistedProfile?.gradeId ?? null)
  const selectedSemesterId = ref<Id | null>(persistedProfile?.semesterId ?? null)
  const selectedTextbooks = ref<SubjectTextbookSelection>({
    CHINESE: persistedProfile?.chineseTextbookVersionId ?? null,
    MATH: persistedProfile?.mathTextbookVersionId ?? null,
    ENGLISH: persistedProfile?.englishTextbookVersionId ?? null,
  })
  const curriculumProfile = ref<StudentCurriculumProfile | null>(persistedProfile)
  const availableTextbooks = ref<ResolveAvailableTextbooksOutput | null>(null)
  const resolutionStatus = ref<SubjectResolutionStatus>(emptyResolutionStatus())
  const confirmedAt = ref<string | null>(persistedProfile?.confirmedAt ?? null)
  const source = ref<StudentCurriculumProfile['source']>(
    persistedProfile?.source ?? 'USER_CONFIRMED',
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isChinesePilot = computed(
    () =>
      Boolean(selectedGradeId.value && CHINESE_PILOT_GRADE_IDS.has(selectedGradeId.value)) &&
      Boolean(selectedRegionId.value && CHINESE_PILOT_REGION_IDS.has(selectedRegionId.value)),
  )
  const isEnglishPilot = computed(() =>
    isEnglishPilotContext(selectedRegionId.value, selectedGradeId.value, selectedSemesterId.value),
  )
  const isCurriculumPilot = computed(() => isChinesePilot.value || isEnglishPilot.value)
  const isMathPilot = computed(() =>
    isMathPilotContext(selectedRegionId.value, selectedGradeId.value, selectedSemesterId.value),
  )

  function hasRequiredTextbooks(
    selection: SubjectTextbookSelection,
    regionId: Id | null,
    gradeId: Id | null,
    semesterId: Id | null,
  ): boolean {
    const isChinesePilotContext =
      Boolean(gradeId && CHINESE_PILOT_GRADE_IDS.has(gradeId)) &&
      Boolean(regionId && CHINESE_PILOT_REGION_IDS.has(regionId))
    return isChinesePilotContext
      ? Boolean(selection.CHINESE)
      : isMathPilotContext(regionId, gradeId, semesterId)
        ? Boolean(selection.MATH || selection.ENGLISH)
        : isEnglishPilotContext(regionId, gradeId, semesterId)
          ? Boolean(selection.ENGLISH)
          : SUBJECT_CODES.every((subjectCode) => selection[subjectCode])
  }

  const isComplete = computed(() => {
    const profile = curriculumProfile.value
    return Boolean(
      profile?.regionId &&
      profile.gradeId &&
      profile.semesterId &&
      hasRequiredTextbooks(
        {
          CHINESE: profile.chineseTextbookVersionId,
          MATH: profile.mathTextbookVersionId,
          ENGLISH: profile.englishTextbookVersionId,
        },
        profile.regionId,
        profile.gradeId,
        profile.semesterId,
      ) &&
      profile.confirmedAt,
    )
  })

  const draftIsComplete = computed(() =>
    Boolean(
      selectedRegionId.value &&
      selectedGradeId.value &&
      selectedSemesterId.value &&
      hasRequiredTextbooks(
        selectedTextbooks.value,
        selectedRegionId.value,
        selectedGradeId.value,
        selectedSemesterId.value,
      ),
    ),
  )

  const chineseTextbookVersionId = computed(() => selectedTextbooks.value.CHINESE)
  const mathTextbookVersionId = computed(() => selectedTextbooks.value.MATH)
  const englishTextbookVersionId = computed(() => selectedTextbooks.value.ENGLISH)

  function clearResolution() {
    availableTextbooks.value = null
    resolutionStatus.value = emptyResolutionStatus()
  }

  function clearDraft() {
    selectedRegionId.value = null
    selectedGradeId.value = null
    selectedSemesterId.value = null
    selectedTextbooks.value = emptySelections()
    confirmedAt.value = null
    clearResolution()
  }

  function setProfile(profile: StudentCurriculumProfile) {
    curriculumProfile.value = profile
    selectedRegionId.value = profile.regionId
    selectedGradeId.value = profile.gradeId
    selectedSemesterId.value = profile.semesterId
    selectedTextbooks.value = {
      CHINESE: profile.chineseTextbookVersionId,
      MATH: profile.mathTextbookVersionId,
      ENGLISH: profile.englishTextbookVersionId,
    }
    confirmedAt.value = profile.confirmedAt
    source.value = profile.source
    error.value = null
  }

  function setContext(
    context: Pick<StudentCurriculumProfile, 'regionId' | 'gradeId' | 'semesterId'>,
  ) {
    selectedRegionId.value = context.regionId
    selectedGradeId.value = context.gradeId
    selectedSemesterId.value = context.semesterId
    selectedTextbooks.value = emptySelections()
    confirmedAt.value = null
    clearResolution()
  }

  function beginEdit() {
    const profile = curriculumProfile.value
    if (!profile) return
    selectedRegionId.value = profile.regionId
    selectedGradeId.value = profile.gradeId
    selectedSemesterId.value = profile.semesterId
    selectedTextbooks.value = {
      CHINESE: profile.chineseTextbookVersionId,
      MATH: profile.mathTextbookVersionId,
      ENGLISH: profile.englishTextbookVersionId,
    }
    confirmedAt.value = profile.confirmedAt
    clearResolution()
    error.value = null
  }

  function resetDraft() {
    clearDraft()
    error.value = null
  }

  function selectRegion(regionId: Id) {
    if (selectedRegionId.value !== regionId) selectedTextbooks.value = emptySelections()
    selectedRegionId.value = regionId
    confirmedAt.value = null
    clearResolution()
    error.value = null
  }

  function selectGrade(gradeId: Id) {
    if (selectedGradeId.value !== gradeId) selectedTextbooks.value = emptySelections()
    selectedGradeId.value = gradeId
    confirmedAt.value = null
    clearResolution()
    error.value = null
  }

  function selectSemester(semesterId: Id) {
    if (selectedSemesterId.value !== semesterId) selectedTextbooks.value = emptySelections()
    selectedSemesterId.value = semesterId
    confirmedAt.value = null
    clearResolution()
    error.value = null
  }

  async function resolveTextbooks(): Promise<ResolveAvailableTextbooksOutput | null> {
    if (!selectedRegionId.value || !selectedGradeId.value || !selectedSemesterId.value) {
      error.value = '请先完成地区、年级和学期选择'
      return null
    }

    loading.value = true
    error.value = null
    try {
      const result = await dependencies.curriculumService.resolveAvailableTextbooks({
        regionId: selectedRegionId.value,
        gradeId: selectedGradeId.value,
        semesterId: selectedSemesterId.value,
      })
      availableTextbooks.value = result
      const nextSelections = { ...selectedTextbooks.value }
      const resolutions = {
        CHINESE: result.chinese,
        MATH: result.math,
        ENGLISH: result.english,
      } as const
      for (const subjectCode of SUBJECT_CODES) {
        const resolution = resolutions[subjectCode]
        const selectedId = nextSelections[subjectCode]
        const stillAvailable = resolution.availableTextbooks.some((book) => book.id === selectedId)
        nextSelections[subjectCode] =
          resolution.resolutionStatus === 'AUTO_RESOLVED' && resolution.recommendedTextbookId
            ? resolution.recommendedTextbookId
            : stillAvailable
              ? selectedId
              : null
      }
      selectedTextbooks.value = nextSelections
      resolutionStatus.value = {
        CHINESE: result.chinese.resolutionStatus,
        MATH: result.math.resolutionStatus,
        ENGLISH: result.english.resolutionStatus,
      }
      return result
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : '教材暂时无法加载'
      return null
    } finally {
      loading.value = false
    }
  }

  function selectTextbook(subjectCode: SubjectCode, textbookVersionId: Id): boolean {
    const resolution =
      availableTextbooks.value?.[
        subjectCode === 'CHINESE' ? 'chinese' : subjectCode === 'MATH' ? 'math' : 'english'
      ]
    if (!resolution?.availableTextbooks.some((book) => book.id === textbookVersionId)) {
      error.value = '这个教材版本不在当前地区和年级的可选范围内'
      return false
    }
    selectedTextbooks.value = { ...selectedTextbooks.value, [subjectCode]: textbookVersionId }
    error.value = null
    return true
  }

  async function confirmCurriculum(
    studentId: Id,
    profileSource: StudentCurriculumProfile['source'] = 'USER_CONFIRMED',
  ): Promise<StudentCurriculumProfile | null> {
    if (
      !selectedRegionId.value ||
      !selectedGradeId.value ||
      !selectedSemesterId.value ||
      !draftIsComplete.value
    ) {
      error.value = isChinesePilot.value
        ? '请先确认语文教材'
        : isMathPilot.value
          ? '请先确认数学或英语教材'
          : isEnglishPilot.value
            ? '请先确认英语教材'
            : '请先确认语文、数学和英语教材'
      return null
    }

    loading.value = true
    error.value = null
    const profile: StudentCurriculumProfile = {
      studentId,
      regionId: selectedRegionId.value,
      gradeId: selectedGradeId.value,
      semesterId: selectedSemesterId.value,
      chineseTextbookVersionId: selectedTextbooks.value.CHINESE,
      mathTextbookVersionId: selectedTextbooks.value.MATH,
      englishTextbookVersionId: selectedTextbooks.value.ENGLISH,
      confirmedAt: new Date().toISOString(),
      source: profileSource,
    }
    try {
      const saved = await dependencies.curriculumService.saveCurriculumProfile(profile)
      setProfile(saved)
      return saved
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : '学习配置保存失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadCurriculumProfile(studentId: Id): Promise<StudentCurriculumProfile | null> {
    loading.value = true
    error.value = null
    try {
      const profile = await dependencies.curriculumService.getCurriculumProfile(studentId)
      if (profile) setProfile(profile)
      else {
        curriculumProfile.value = null
        clearDraft()
      }
      return profile
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : '学习配置暂时无法读取'
      return null
    } finally {
      loading.value = false
    }
  }

  function resetCurriculum() {
    curriculumProfileRepository.clear()
    curriculumProfile.value = null
    clearDraft()
    source.value = 'USER_CONFIRMED'
    error.value = null
  }

  return {
    selectedRegionId,
    selectedGradeId,
    selectedSemesterId,
    availableTextbooks,
    selectedTextbooks,
    curriculumProfile,
    resolutionStatus,
    loading,
    error,
    regionId: selectedRegionId,
    gradeId: selectedGradeId,
    semesterId: selectedSemesterId,
    chineseTextbookVersionId,
    mathTextbookVersionId,
    englishTextbookVersionId,
    confirmedAt,
    source,
    isChinesePilot,
    isEnglishPilot,
    isMathPilot,
    isCurriculumPilot,
    isComplete,
    draftIsComplete,
    setProfile,
    setContext,
    beginEdit,
    resetDraft,
    selectRegion,
    selectGrade,
    selectSemester,
    resolveTextbooks,
    selectTextbook,
    confirmCurriculum,
    loadCurriculumProfile,
    resetCurriculum,
    clear: resetCurriculum,
  }
})
