import { afterEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { curriculumData } from '@/data/curriculum'
import { sampleCurriculumData } from '@/data/curriculum/sample'
import { sampleRegionTextbookRelations } from '@/data/curriculum/region-textbooks'
import { sampleQuestions } from '@/data/curriculum/questions'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import {
  createCurriculumProfileRepository,
  curriculumProfileRepository,
} from '@/services/storage/curriculumProfileRepository'
import {
  validateContentBlock,
  validateCurriculumData,
  validateKnowledgePrerequisiteGraph,
  validateQuestion,
  validateSamplePublishGuard,
} from '@/services/validation'
import { getOnboardingRedirect } from '@/router/guard'
import {
  configureCurriculumStore,
  resetCurriculumStoreDependencies,
  useCurriculumStore,
} from '@/stores/curriculumStore'
import type { KnowledgePrerequisite, StudentCurriculumProfile } from '@/types'

function createMemoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

const profile: StudentCurriculumProfile = {
  studentId: 'SAMPLE_STUDENT_01',
  regionId: 'SAMPLE_REGION_A',
  gradeId: 'SAMPLE_GRADE_3',
  semesterId: 'SAMPLE_SEMESTER_UPPER',
  chineseTextbookVersionId: 'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A',
  mathTextbookVersionId: 'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A',
  englishTextbookVersionId: 'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A',
  confirmedAt: '2026-09-02T00:00:00+08:00',
  source: 'USER_CONFIRMED',
}

afterEach(() => {
  resetCurriculumStoreDependencies()
})

describe('resolveAvailableTextbooks', () => {
  it('requires an explicit choice even when regional metadata has one DEFAULT', async () => {
    const service = new MockCurriculumService({ data: sampleCurriculumData })
    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_A',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    expect(result.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
    expect(result.chinese.recommendedTextbookId).toBeUndefined()
    expect(result.chinese.availableTextbooks.map((book) => book.id)).toContain(
      'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A',
    )
  })

  it('requires confirmation when multiple DEFAULT records exist and reports the anomaly', async () => {
    const duplicateDefault = {
      ...sampleRegionTextbookRelations.find(
        (relation) => relation.id === 'SAMPLE_REGION_TEXTBOOK_RELATION_B_MATH_OPTIONAL',
      ),
      id: 'SAMPLE_REGION_TEXTBOOK_RELATION_A_MATH_DUPLICATE_DEFAULT',
      regionId: 'SAMPLE_REGION_A',
      usageType: 'DEFAULT' as const,
    }
    if (!duplicateDefault) throw new Error('fixture missing')
    const service = new MockCurriculumService({
      data: {
        ...sampleCurriculumData,
        regionTextbookRelations: [...sampleRegionTextbookRelations, duplicateDefault],
      },
    })

    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_A',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    expect(result.math.resolutionStatus).toBe('NEEDS_CONFIRMATION')
    expect(result.math.recommendedTextbookId).toBeUndefined()
    expect(service.getLastResolutionAnomalies()).toHaveLength(1)
  })

  it('offers the same catalog when a region has no textbook relations', async () => {
    const service = new MockCurriculumService({ data: sampleCurriculumData })
    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_C',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    expect(result).toEqual(
      await service.resolveAvailableTextbooks({
        regionId: 'SAMPLE_REGION_A',
        gradeId: 'SAMPLE_GRADE_3',
        semesterId: 'SAMPLE_SEMESTER_UPPER',
      }),
    )
    expect(result.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
  })

  it('keeps three subject selections independent', async () => {
    const service = new MockCurriculumService({ data: sampleCurriculumData })
    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_A',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    const selectedIds = [
      result.chinese.availableTextbooks[0]?.id,
      result.math.availableTextbooks[0]?.id,
      result.english.availableTextbooks[0]?.id,
    ]
    expect(new Set(selectedIds).size).toBe(3)
  })

  it('completes the minimum region-to-profile pipeline', async () => {
    curriculumProfileRepository.clear()
    configureCurriculumStore({
      curriculumService: new MockCurriculumService({ data: sampleCurriculumData }),
    })
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.selectRegion('SAMPLE_REGION_A')
    store.selectGrade('SAMPLE_GRADE_3')
    store.selectSemester('SAMPLE_SEMESTER_UPPER')

    const resolution = await store.resolveTextbooks()
    expect(resolution?.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
    expect(store.draftIsComplete).toBe(false)
    store.selectTextbook('CHINESE', 'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A')
    store.selectTextbook('MATH', 'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A')
    store.selectTextbook('ENGLISH', 'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A')
    expect(store.draftIsComplete).toBe(true)

    const saved = await store.confirmCurriculum('SAMPLE_STUDENT_01')
    expect(saved?.regionId).toBe('SAMPLE_REGION_A')
    expect(saved?.chineseTextbookVersionId).toBe('SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A')
    expect(saved?.mathTextbookVersionId).toBe('SAMPLE_MATH_TEXTBOOK_G3_UPPER_A')
    expect(saved?.englishTextbookVersionId).toBe('SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A')
    expect(store.isComplete).toBe(true)
    curriculumProfileRepository.clear()
  })
})

describe('curriculumStore and profile persistence', () => {
  it('changing math keeps the Chinese and English draft choices', async () => {
    curriculumProfileRepository.clear()
    configureCurriculumStore({
      curriculumService: new MockCurriculumService({ data: sampleCurriculumData }),
    })
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.selectRegion('SAMPLE_REGION_B')
    store.selectGrade('SAMPLE_GRADE_3')
    store.selectSemester('SAMPLE_SEMESTER_UPPER')
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', 'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A')
    const chineseId = store.selectedTextbooks.CHINESE
    const englishId = 'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_B'
    store.selectTextbook('ENGLISH', englishId)
    store.selectTextbook('MATH', 'SAMPLE_MATH_TEXTBOOK_G3_UPPER_B')

    expect(store.selectedTextbooks.CHINESE).toBe(chineseId)
    expect(store.selectedTextbooks.ENGLISH).toBe(englishId)
    expect(store.selectedTextbooks.MATH).toBe('SAMPLE_MATH_TEXTBOOK_G3_UPPER_B')
  })

  it('serializes and restores a StudentCurriculumProfile', () => {
    const storage = createMemoryStorage()
    const repository = createCurriculumProfileRepository(storage)
    repository.save(profile)
    const restored = createCurriculumProfileRepository(storage).load()

    expect(restored).toEqual(profile)
  })

  it('clears corrupted storage and returns onboarding fallback', () => {
    const storage = createMemoryStorage()
    storage.setItem('knowledge-island.curriculum-profile', '{not-json')
    const repository = createCurriculumProfileRepository(storage)

    expect(repository.load()).toBeNull()
    expect(storage.getItem('knowledge-island.curriculum-profile')).toBeNull()
  })
})

describe('validation and route guard', () => {
  it('redirects protected pages to onboarding when no profile exists', () => {
    expect(getOnboardingRedirect('/home', true, false)).toBe('/onboarding')
    expect(getOnboardingRedirect('/onboarding/region', false, false)).toBeNull()
    expect(getOnboardingRedirect('/onboarding', false, true)).toBe('/home')
  })

  it('detects prerequisite cycles', () => {
    const relations: KnowledgePrerequisite[] = [
      {
        id: 'SAMPLE_CYCLE_A',
        prerequisiteKnowledgePointId: 'KP_A',
        dependentKnowledgePointId: 'KP_B',
        relationType: 'REQUIRED',
        sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
        status: 'DRAFT',
        needsVerification: true,
      },
      {
        id: 'SAMPLE_CYCLE_B',
        prerequisiteKnowledgePointId: 'KP_B',
        dependentKnowledgePointId: 'KP_A',
        relationType: 'REQUIRED',
        sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
        status: 'DRAFT',
        needsVerification: true,
      },
    ]
    const result = validateKnowledgePrerequisiteGraph(relations, new Set(['KP_A', 'KP_B']))

    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('cycle detected'))).toBe(true)
  })

  it('blocks a sample record from PUBLISHED', () => {
    expect(validateSamplePublishGuard({ isSample: true, status: 'PUBLISHED' })).toHaveLength(1)
    expect(validateSamplePublishGuard({ isSample: true, status: 'DRAFT' })).toEqual([])
  })

  it('keeps the SAMPLE curriculum fixtures sample-only and unverified', () => {
    const records = [
      ...sampleCurriculumData.regions,
      ...sampleCurriculumData.publishers,
      ...sampleCurriculumData.textbooks,
      ...sampleCurriculumData.regionTextbookRelations,
      ...sampleCurriculumData.units,
      ...sampleCurriculumData.lessons,
      ...sampleCurriculumData.knowledgePoints,
      ...sampleCurriculumData.lessonKnowledgePointRelations,
      ...sampleCurriculumData.knowledgePrerequisites,
      ...sampleCurriculumData.courseContents,
      ...sampleCurriculumData.questions,
      ...sampleCurriculumData.mediaAssets,
      ...sampleCurriculumData.learningMaps,
      ...sampleCurriculumData.mapNodes,
    ]

    const sampleRecords = records.filter(
      (record) => (record as { isSample?: boolean }).isSample === true,
    )

    expect(sampleRecords.length).toBeGreaterThan(0)
    for (const record of sampleRecords) {
      expect((record as { isSample?: boolean }).isSample).toBe(true)
      expect((record as { needsVerification?: boolean }).needsVerification).toBe(true)
      expect((record as { status: string }).status).not.toBe('PUBLISHED')
    }
  })

  it('keeps SAMPLE fixtures out of the current user-facing dataset', () => {
    expect(curriculumData.regions.map((region) => region.name)).toEqual([
      '广东省',
      '湖北省',
      '深圳市',
    ])
    expect(curriculumData.grades.map((grade) => grade.id)).toEqual(['GRADE_1', 'GRADE_2'])
    expect(curriculumData.semesters.map((semester) => semester.id)).toEqual([
      'SEMESTER_UPPER',
      'SEMESTER_LOWER',
    ])
    expect(curriculumData.subjects.map((subject) => subject.id)).toEqual([
      'SUBJECT_CHINESE',
      'SUBJECT_MATH',
      'SUBJECT_ENGLISH',
    ])
    expect(curriculumData.questions).toEqual([])
    expect(curriculumData.mediaAssets).toEqual([])
    expect(
      [
        ...curriculumData.regions,
        ...curriculumData.publishers,
        ...curriculumData.textbooks,
        ...curriculumData.units,
        ...curriculumData.lessons,
        ...curriculumData.knowledgePoints,
        ...curriculumData.courseContents,
      ].some((record) => record.id.startsWith('SAMPLE_')),
    ).toBe(false)
  })

  it('accepts the complete SAMPLE curriculum fixture graph', () => {
    const result = validateCurriculumData(sampleCurriculumData)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('validates question references and answer rules', () => {
    const valid = validateQuestion(sampleQuestions[0], {
      knowledgePointIds: new Set(['SAMPLE_MATH_KP_01']),
      sourceIds: new Set(['SAMPLE_SOURCE_UNVERIFIED']),
      mediaAssetIds: new Set(),
    })
    const invalid = validateQuestion({ ...sampleQuestions[0], stem: '题干字符串' })

    expect(valid.valid).toBe(true)
    expect(invalid.valid).toBe(false)
  })

  it('validates ContentBlock media and text requirements', () => {
    expect(validateContentBlock({ type: 'TEXT', text: '示例文本' }).valid).toBe(true)
    expect(validateContentBlock({ type: 'TEXT' }).valid).toBe(false)
    expect(validateContentBlock({ type: 'IMAGE', text: '没有媒体引用' }).valid).toBe(false)
    expect(
      validateContentBlock({
        type: 'IMAGE',
        mediaAssetId: 'SAMPLE_MEDIA_QUESTION',
        altText: '示例',
      }).valid,
    ).toBe(true)
  })
})
