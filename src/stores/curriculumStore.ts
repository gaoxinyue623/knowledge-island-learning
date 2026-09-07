import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

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
  let resolutionRequestId = 0

  function hasSelectedTextbook(selection: SubjectTextbookSelection): boolean {
    return SUBJECT_CODES.some((subjectCode) => Boolean(selection[subjectCode]))
  }

  const isComplete = computed(() => {
    const profile = curriculumProfile.value
    return Boolean(
      profile?.regionId &&
      profile.gradeId &&
      profile.semesterId &&
      hasSelectedTextbook({
        CHINESE: profile.chineseTextbookVersionId,
        MATH: profile.mathTextbookVersionId,
        ENGLISH: profile.englishTextbookVersionId,
      }) &&
      profile.confirmedAt,
    )
  })

  const draftIsComplete = computed(() =>
    Boolean(
      selectedRegionId.value &&
      selectedGradeId.value &&
      selectedSemesterId.value &&
      hasSelectedTextbook(selectedTextbooks.value),
    ),
  )

  const chineseTextbookVersionId = computed(() => selectedTextbooks.value.CHINESE)
  const mathTextbookVersionId = computed(() => selectedTextbooks.value.MATH)
  const englishTextbookVersionId = computed(() => selectedTextbooks.value.ENGLISH)

  function clearResolution() {
    resolutionRequestId += 1
    loading.value = false
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
    clearResolution()
    if (!selectedRegionId.value || !selectedGradeId.value || !selectedSemesterId.value) {
      error.value = '请先完成地区、年级和学期选择'
      return null
    }

    loading.value = true
    error.value = null
    const requestId = resolutionRequestId
    try {
      const result = await dependencies.curriculumService.resolveAvailableTextbooks({
        regionId: selectedRegionId.value,
        gradeId: selectedGradeId.value,
        semesterId: selectedSemesterId.value,
      })
      if (requestId !== resolutionRequestId) return null
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
        nextSelections[subjectCode] = stillAvailable ? selectedId : null
      }
      selectedTextbooks.value = nextSelections
      resolutionStatus.value = {
        CHINESE: result.chinese.resolutionStatus,
        MATH: result.math.resolutionStatus,
        ENGLISH: result.english.resolutionStatus,
      }
      return result
    } catch (caught) {
      if (requestId !== resolutionRequestId) return null
      error.value = caught instanceof Error ? caught.message : '教材暂时无法加载'
      return null
    } finally {
      if (requestId === resolutionRequestId) loading.value = false
    }
  }

  function selectTextbook(subjectCode: SubjectCode, textbookVersionId: Id): boolean {
    const resolution =
      availableTextbooks.value?.[
        subjectCode === 'CHINESE' ? 'chinese' : subjectCode === 'MATH' ? 'math' : 'english'
      ]
    if (!resolution?.availableTextbooks.some((book) => book.id === textbookVersionId)) {
      error.value = '这个教材版本不在当前年级、学期和学科的可选范围内'
      return false
    }
    selectedTextbooks.value = { ...selectedTextbooks.value, [subjectCode]: textbookVersionId }
    error.value = null
    return true
  }

  function clearTextbookSelection(subjectCode: SubjectCode) {
    selectedTextbooks.value = { ...selectedTextbooks.value, [subjectCode]: null }
    error.value = null
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
      error.value = '请选择年级和学期，并至少确认一科教材'
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
    clearTextbookSelection,
    confirmCurriculum,
    loadCurriculumProfile,
    resetCurriculum,
    clear: resetCurriculum,
  }
})
