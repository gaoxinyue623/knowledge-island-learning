import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_PEP_CHINESE_SEMESTER_ID,
  G1_PEP_CHINESE_S1_TEXTBOOK_ID,
  G1_PEP_CHINESE_SUBJECT_ID,
  gradeOneChineseUpperCourseContents,
  gradeOneChineseUpperCurriculum,
  gradeOneChineseUpperKnowledgePoints,
  gradeOneChineseUpperLessons,
  gradeOneChineseUpperLessonKnowledgePointRelations,
  gradeOneChineseUpperRegions,
  gradeOneChineseUpperRegionTextbookRelations,
  gradeOneChineseUpperTextbooks,
} from '@/data/curriculum'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import {
  buildLearningMapSourceFromDomain,
  buildLearningMapViewModel,
  flattenKnowledgeNodes,
} from '@/services/learning-map'
import { validateCurriculumData } from '@/services/validation'
import { useCurriculumStore } from '@/stores/curriculumStore'

const candidateAccessPolicy = {
  allowSampleCurriculum: true,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: true,
  allowUnreviewedLearningContent: true,
}

describe('Grade 1 PEP Chinese upper-volume candidate curriculum', () => {
  it('matches the user-provided directory structure', () => {
    expect(gradeOneChineseUpperCurriculum.units).toHaveLength(9)
    expect(gradeOneChineseUpperLessons).toHaveLength(45)
    expect(gradeOneChineseUpperKnowledgePoints).toHaveLength(45)
    expect(gradeOneChineseUpperLessonKnowledgePointRelations).toHaveLength(45)
    expect(gradeOneChineseUpperCourseContents).toHaveLength(45)

    expect(gradeOneChineseUpperCurriculum.units.map((unit) => unit.title)).toEqual([
      '我上学了',
      '第一单元·识字',
      '第二单元·汉语拼音',
      '第三单元·汉语拼音',
      '第四单元·汉语拼音',
      '第五单元·阅读',
      '第六单元·识字',
      '第七单元·阅读',
      '第八单元·阅读',
    ])
    expect(gradeOneChineseUpperLessons[0]).toMatchObject({ title: '我是中国人', sortOrder: 1 })
    expect(gradeOneChineseUpperLessons.at(-1)).toMatchObject({ title: '语文园地八', sortOrder: 4 })
    expect(
      gradeOneChineseUpperCourseContents.find(
        (content) => content.id === 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_01',
      )?.body,
    ).toMatchObject({
      directoryPage: 2,
      lessonId: gradeOneChineseUpperLessons[0]?.id,
    })
    expect(
      gradeOneChineseUpperCourseContents.find(
        (content) => content.id === 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_45',
      )?.body,
    ).toMatchObject({
      directoryPage: 101,
      lessonId: gradeOneChineseUpperLessons.at(-1)?.id,
    })
    expect(
      gradeOneChineseUpperCourseContents.every(
        (content) => content.sourceId === 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      ),
    ).toBe(true)
  })

  it('contains only Guangdong and Hubei mappings for the candidate textbook', () => {
    expect(gradeOneChineseUpperRegions.map((region) => region.name)).toEqual(['广东省', '湖北省'])
    expect(gradeOneChineseUpperTextbooks).toHaveLength(1)
    expect(gradeOneChineseUpperTextbooks[0]).toMatchObject({
      id: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
      subjectId: G1_PEP_CHINESE_SUBJECT_ID,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
      semesterId: G1_PEP_CHINESE_SEMESTER_ID,
      versionName: '人教版（统编版）语文一年级上册（2024 修订版）',
      verificationStatus: 'UNVERIFIED',
    })
    expect(gradeOneChineseUpperRegionTextbookRelations).toHaveLength(2)
    expect(gradeOneChineseUpperRegionTextbookRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
          textbookVersionId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
          usageType: 'SUPPORTED',
          verificationStatus: 'UNVERIFIED',
        }),
        expect.objectContaining({
          regionId: G1_PEP_CHINESE_HUBEI_REGION_ID,
          textbookVersionId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
          usageType: 'SUPPORTED',
          verificationStatus: 'UNVERIFIED',
        }),
      ]),
    )
  })

  it('keeps candidate learning records unverified and non-sample', () => {
    const records = [
      ...gradeOneChineseUpperCurriculum.units,
      ...gradeOneChineseUpperLessons,
      ...gradeOneChineseUpperKnowledgePoints,
      ...gradeOneChineseUpperLessonKnowledgePointRelations,
      ...gradeOneChineseUpperCourseContents,
    ]

    expect(records.every((record) => record.verificationStatus === 'UNVERIFIED')).toBe(true)
    expect(records.every((record) => (record as { isSample?: boolean }).isSample !== true)).toBe(
      true,
    )
    expect(
      gradeOneChineseUpperCourseContents.every((content) => content.contentType === 'TEXTBOOK'),
    ).toBe(true)
    expect(
      gradeOneChineseUpperCourseContents.every(
        (content) =>
          Array.isArray(content.body['blocks']) &&
          typeof content.body['summary'] === 'string' &&
          Array.isArray(content.body['learningGoals']),
      ),
    ).toBe(true)
  })

  it.each([G1_PEP_CHINESE_GUANGDONG_REGION_ID, G1_PEP_CHINESE_HUBEI_REGION_ID])(
    'resolves all three subjects independently for %s',
    async (regionId) => {
      const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
      const result = await service.resolveAvailableTextbooks({
        regionId,
        gradeId: G1_PEP_CHINESE_GRADE_ID,
        semesterId: G1_PEP_CHINESE_SEMESTER_ID,
      })

      expect(result.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
      expect(result.chinese.availableTextbooks.map((textbook) => textbook.id)).toEqual([
        G1_PEP_CHINESE_S1_TEXTBOOK_ID,
      ])
      expect(result.math).toMatchObject({
        availableTextbooks: [
          expect.objectContaining({ id: 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE' }),
        ],
        resolutionStatus: 'NEEDS_CONFIRMATION',
      })
      expect(result.english).toMatchObject({
        availableTextbooks: [
          expect.objectContaining({ id: 'G1_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE' }),
        ],
        resolutionStatus: 'NEEDS_CONFIRMATION',
      })
    },
  )

  it('builds nine knowledge islands and 45 nodes from the domain data', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G1_PEP_CHINESE_S1_TEXTBOOK_ID)
    if (!source) throw new Error('candidate map source is unavailable')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.verificationStatus).toBe('UNVERIFIED')
    expect(source.isSample).toBe(false)
    expect(source.units).toHaveLength(9)
    expect(source.lessons).toHaveLength(45)
    expect(source.lessonKnowledgePoints).toHaveLength(45)
    expect(viewModel.islands).toHaveLength(9)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(45)
    expect(viewModel.flags.isUnverified).toBe(true)
    expect(viewModel.flags.isDemo).toBe(false)
    expect(flattenKnowledgeNodes(viewModel.islands)[0]?.status).toBe('available')
  })

  it('reads the latest local textbook content when unreviewed content is explicitly enabled', async () => {
    const repository = new MockLearningContentRepository({ accessPolicy: candidateAccessPolicy })
    const content = await repository.getByKnowledgePoint(
      gradeOneChineseUpperKnowledgePoints[0]?.id ?? '',
    )

    expect(content).toMatchObject({
      id: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_01',
      lessonId: gradeOneChineseUpperLessons[0]?.id,
      verificationStatus: 'UNVERIFIED',
    })
    expect(content?.blocks).toHaveLength(2)
    expect(content?.learningGoals.length).toBeGreaterThan(0)
  })

  it('allows the Grade 1 Guangdong/Hubei pilot profile to complete with Chinese only', () => {
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.setProfile({
      studentId: 'G1_CHINESE_PILOT_STUDENT',
      regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
      semesterId: G1_PEP_CHINESE_SEMESTER_ID,
      chineseTextbookVersionId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
      mathTextbookVersionId: null,
      englishTextbookVersionId: null,
      confirmedAt: '2026-09-04T00:00:00+08:00',
      source: 'USER_CONFIRMED',
    })

    expect(store.chineseTextbookVersionId).toBe(G1_PEP_CHINESE_S1_TEXTBOOK_ID)
    expect(store.isComplete).toBe(true)
  })

  it('validates the current user-facing curriculum graph', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid).toBe(true)
    expect(report.errors).toEqual([])
  })

  it('can build the same map source directly from the candidate domain slice', () => {
    const source = buildLearningMapSourceFromDomain({
      textbook: gradeOneChineseUpperCurriculum.textbooks[0]!,
      grade: curriculumData.grades.find((grade) => grade.id === G1_PEP_CHINESE_GRADE_ID)!,
      semester: curriculumData.semesters.find(
        (semester) => semester.id === G1_PEP_CHINESE_SEMESTER_ID,
      )!,
      subject: curriculumData.subjects.find((subject) => subject.code === 'CHINESE')!,
      publisher: gradeOneChineseUpperCurriculum.publishers[0],
      units: gradeOneChineseUpperCurriculum.units,
      lessons: gradeOneChineseUpperLessons,
      knowledgePoints: gradeOneChineseUpperKnowledgePoints,
      lessonKnowledgePoints: gradeOneChineseUpperLessonKnowledgePointRelations,
      knowledgePrerequisites: gradeOneChineseUpperCurriculum.knowledgePrerequisites,
    })

    expect(source.textbook.subject).toBe('CHINESE')
    expect(source.units).toHaveLength(9)
    expect(source.lessons).toHaveLength(45)
  })
})
