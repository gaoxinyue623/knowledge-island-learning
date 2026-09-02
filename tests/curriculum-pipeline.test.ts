import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { curriculumData } from '@/data/curriculum'
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
import { useCurriculumStore } from '@/stores/curriculumStore'
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

describe('resolveAvailableTextbooks', () => {
  it('auto-resolves a subject with exactly one DEFAULT', async () => {
    const service = new MockCurriculumService()
    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_A',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    expect(result.chinese.resolutionStatus).toBe('AUTO_RESOLVED')
    expect(result.chinese.recommendedTextbookId).toBe('SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A')
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
      data: { regionTextbookRelations: [...sampleRegionTextbookRelations, duplicateDefault] },
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

  it('returns NOT_AVAILABLE when a region has no textbook relations', async () => {
    const service = new MockCurriculumService()
    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_C',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    expect(result.chinese.resolutionStatus).toBe('NOT_AVAILABLE')
    expect(result.math.availableTextbooks).toEqual([])
    expect(result.english.resolutionStatus).toBe('NOT_AVAILABLE')
  })

  it('keeps three subject selections independent', async () => {
    const service = new MockCurriculumService()
    const result = await service.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_A',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })

    const selectedIds = [
      result.chinese.recommendedTextbookId,
      result.math.recommendedTextbookId,
      result.english.recommendedTextbookId,
    ]
    expect(new Set(selectedIds).size).toBe(3)
  })

  it('completes the minimum region-to-profile pipeline', async () => {
    curriculumProfileRepository.clear()
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.selectRegion('SAMPLE_REGION_A')
    store.selectGrade('SAMPLE_GRADE_3')
    store.selectSemester('SAMPLE_SEMESTER_UPPER')

    const resolution = await store.resolveTextbooks()
    expect(resolution?.chinese.resolutionStatus).toBe('AUTO_RESOLVED')
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
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.selectRegion('SAMPLE_REGION_B')
    store.selectGrade('SAMPLE_GRADE_3')
    store.selectSemester('SAMPLE_SEMESTER_UPPER')
    await store.resolveTextbooks()
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

  it('keeps every curriculum fixture sample-only and unverified', () => {
    const records = [
      ...curriculumData.regions,
      ...curriculumData.publishers,
      ...curriculumData.textbooks,
      ...curriculumData.regionTextbookRelations,
      ...curriculumData.units,
      ...curriculumData.lessons,
      ...curriculumData.knowledgePoints,
      ...curriculumData.lessonKnowledgePointRelations,
      ...curriculumData.knowledgePrerequisites,
      ...curriculumData.courseContents,
      ...curriculumData.questions,
      ...curriculumData.mediaAssets,
      ...curriculumData.learningMaps,
      ...curriculumData.mapNodes,
    ]

    for (const record of records) {
      expect((record as { isSample?: boolean }).isSample).toBe(true)
      expect((record as { needsVerification?: boolean }).needsVerification).toBe(true)
      expect((record as { status: string }).status).not.toBe('PUBLISHED')
    }
  })

  it('accepts the complete SAMPLE curriculum fixture graph', () => {
    const result = validateCurriculumData()
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
