import { describe, expect, it } from 'vitest'

import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_PEP_CHINESE_S2_SEMESTER_ID,
  G1_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeOneChineseLowerCourseContents,
  gradeOneChineseLowerCurriculum,
  gradeOneChineseLowerKnowledgePoints,
  gradeOneChineseLowerLessons,
  gradeOneChineseLowerRegionTextbookRelations,
} from '@/data/curriculum'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { validateCurriculumData } from '@/services/validation'

const candidateAccessPolicy = {
  allowSampleCurriculum: true,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: true,
  allowUnreviewedLearningContent: true,
}

describe('Grade 1 PEP Chinese lower-volume curriculum', () => {
  it('enters eight units, 38 lessons, textbook text, and the appendix', () => {
    expect(gradeOneChineseLowerCurriculum.units).toHaveLength(8)
    expect(gradeOneChineseLowerLessons).toHaveLength(38)
    expect(gradeOneChineseLowerKnowledgePoints).toHaveLength(38)
    expect(gradeOneChineseLowerCourseContents).toHaveLength(38)
    expect(gradeOneChineseLowerCurriculum.units.map((unit) => unit.title)).toEqual([
      '第一单元·识字',
      '第二单元·课文',
      '第三单元·课文',
      '第四单元·课文',
      '第五单元·识字',
      '第六单元·课文',
      '第七单元·课文',
      '第八单元·课文',
    ])
    expect(gradeOneChineseLowerLessons[0]).toMatchObject({ title: '1 春夏秋冬', sortOrder: 1 })
    expect(gradeOneChineseLowerLessons.at(-1)).toMatchObject({ title: '语文园地八', sortOrder: 4 })

    const firstContent = gradeOneChineseLowerCourseContents[0]
    expect(firstContent).toMatchObject({
      id: 'G1_PEP_CHINESE_S2_CONTENT_01',
      title: '《春夏秋冬》',
      contentType: 'TEXTBOOK',
      verificationStatus: 'UNVERIFIED',
    })
    expect(firstContent?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('春风吹，夏雨落。'),
        }),
      ]),
    )
    expect(gradeOneChineseLowerCourseContents[15]).toMatchObject({
      title: '《静夜思》',
    })
    expect(gradeOneChineseLowerCourseContents.at(-1)?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('识字表（会认，共400字）'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('常用偏旁名称表'),
        }),
      ]),
    )
  })

  it('supports only Guangdong and Hubei for the lower-volume textbook', () => {
    expect(gradeOneChineseLowerRegionTextbookRelations).toHaveLength(2)
    expect(gradeOneChineseLowerRegionTextbookRelations.map((item) => item.regionId)).toEqual([
      G1_PEP_CHINESE_GUANGDONG_REGION_ID,
      G1_PEP_CHINESE_HUBEI_REGION_ID,
    ])
    expect(
      gradeOneChineseLowerRegionTextbookRelations.every(
        (item) => item.textbookVersionId === G1_PEP_CHINESE_S2_TEXTBOOK_ID,
      ),
    ).toBe(true)
  })

  it.each([G1_PEP_CHINESE_GUANGDONG_REGION_ID, G1_PEP_CHINESE_HUBEI_REGION_ID])(
    'resolves the lower-volume Chinese textbook for %s',
    async (regionId) => {
      const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
      const result = await service.resolveAvailableTextbooks({
        regionId,
        gradeId: G1_PEP_CHINESE_GRADE_ID,
        semesterId: G1_PEP_CHINESE_S2_SEMESTER_ID,
      })

      expect(result.chinese.availableTextbooks.map((textbook) => textbook.id)).toEqual([
        G1_PEP_CHINESE_S2_TEXTBOOK_ID,
      ])
      expect(result.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
      expect(result.math.availableTextbooks).toEqual([])
      expect(result.english.availableTextbooks).toEqual([])
    },
  )

  it('builds the lower-volume knowledge island map from the domain data', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G1_PEP_CHINESE_S2_TEXTBOOK_ID)
    if (!source) throw new Error('lower-volume map source is unavailable')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.textbook.id).toBe(G1_PEP_CHINESE_S2_TEXTBOOK_ID)
    expect(source.textbook.semester).toBe(2)
    expect(source.units).toHaveLength(8)
    expect(source.lessons).toHaveLength(38)
    expect(viewModel.islands).toHaveLength(8)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(38)
  })

  it('keeps the combined curriculum graph valid', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
    expect(curriculumData.semesters.map((semester) => semester.id)).toEqual([
      'SEMESTER_UPPER',
      G1_PEP_CHINESE_S2_SEMESTER_ID,
    ])
    expect(curriculumData.textbooks.map((textbook) => textbook.id)).toEqual([
      'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      G1_PEP_CHINESE_S2_TEXTBOOK_ID,
      'G2_PEP_CHINESE_S1_2024_CANDIDATE',
      'G2_PEP_CHINESE_S2_2024_CANDIDATE',
      'G1_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE',
      'G1_SHENZHEN_SHANGHAI_ENGLISH_S2_2024_CANDIDATE',
      'G2_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE',
      'G2_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE',
    ])
  })
})
