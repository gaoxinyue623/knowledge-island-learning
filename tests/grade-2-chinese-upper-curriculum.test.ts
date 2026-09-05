import { describe, expect, it } from 'vitest'

import {
  curriculumData,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G2_PEP_CHINESE_GRADE_ID,
  G2_PEP_CHINESE_S1_SEMESTER_ID,
  G2_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeTwoChineseUpperCourseContents,
  gradeTwoChineseUpperCurriculum,
  gradeTwoChineseUpperKnowledgePoints,
  gradeTwoChineseUpperLessons,
  gradeTwoChineseUpperRegionTextbookRelations,
} from '@/data/curriculum'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { isChinesePilotTextbook } from '@/data/curriculum/pilot'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { validateCurriculumData } from '@/services/validation'

const candidateAccessPolicy = {
  allowSampleCurriculum: true,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: true,
  allowUnreviewedLearningContent: true,
}

describe('Grade 2 PEP Chinese upper-volume curriculum', () => {
  it('enters eight units, 37 lessons, textbook text, and the appendix', () => {
    expect(gradeTwoChineseUpperCurriculum.units).toHaveLength(8)
    expect(gradeTwoChineseUpperLessons).toHaveLength(37)
    expect(gradeTwoChineseUpperKnowledgePoints).toHaveLength(37)
    expect(gradeTwoChineseUpperCourseContents).toHaveLength(37)
    expect(gradeTwoChineseUpperCurriculum.units.map((unit) => unit.title)).toEqual([
      '第一单元·课文',
      '第二单元·识字',
      '第三单元·课文',
      '第四单元·课文',
      '第五单元·课文',
      '第六单元·课文',
      '第七单元·课文',
      '第八单元·课文',
    ])
    expect(gradeTwoChineseUpperLessons[0]).toMatchObject({
      title: '1 小蝌蚪找妈妈',
      sortOrder: 1,
    })
    expect(gradeTwoChineseUpperLessons.at(-1)).toMatchObject({
      title: '语文园地八',
      sortOrder: 4,
    })
    expect(gradeTwoChineseUpperCourseContents[0]).toMatchObject({
      id: 'G2_PEP_CHINESE_S1_CONTENT_01',
      title: '《小蝌蚪找妈妈》',
      contentType: 'TEXTBOOK',
      verificationStatus: 'UNVERIFIED',
    })
    expect(gradeTwoChineseUpperCourseContents[0]?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('池塘里有一群小蝌蚪'),
        }),
      ]),
    )
    expect(gradeTwoChineseUpperCourseContents.at(-1)?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('识字表（会认450字）'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('常用偏旁名称表'),
        }),
      ]),
    )
  })

  it('supports only Guangdong and Hubei for the upper-volume textbook', () => {
    expect(gradeTwoChineseUpperRegionTextbookRelations).toHaveLength(2)
    expect(gradeTwoChineseUpperRegionTextbookRelations.map((item) => item.regionId)).toEqual([
      G1_PEP_CHINESE_GUANGDONG_REGION_ID,
      G1_PEP_CHINESE_HUBEI_REGION_ID,
    ])
    expect(
      gradeTwoChineseUpperRegionTextbookRelations.every(
        (item) => item.textbookVersionId === G2_PEP_CHINESE_S1_TEXTBOOK_ID,
      ),
    ).toBe(true)
  })

  it.each([G1_PEP_CHINESE_GUANGDONG_REGION_ID, G1_PEP_CHINESE_HUBEI_REGION_ID])(
    'resolves the Grade 2 upper-volume Chinese textbook for %s',
    async (regionId) => {
      const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
      const result = await service.resolveAvailableTextbooks({
        regionId,
        gradeId: G2_PEP_CHINESE_GRADE_ID,
        semesterId: G2_PEP_CHINESE_S1_SEMESTER_ID,
      })

      expect(result.chinese.availableTextbooks.map((textbook) => textbook.id)).toEqual([
        G2_PEP_CHINESE_S1_TEXTBOOK_ID,
      ])
      expect(result.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
      expect(result.math.availableTextbooks).toEqual([])
      expect(result.english.availableTextbooks).toEqual([])
    },
  )

  it('builds the Grade 2 knowledge island map from the domain data', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G2_PEP_CHINESE_S1_TEXTBOOK_ID)
    if (!source) throw new Error('Grade 2 map source is unavailable')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.textbook.id).toBe(G2_PEP_CHINESE_S1_TEXTBOOK_ID)
    expect(source.textbook.semester).toBe(1)
    expect(source.units).toHaveLength(8)
    expect(source.lessons).toHaveLength(37)
    expect(viewModel.islands).toHaveLength(8)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(37)
  })

  it('keeps the combined curriculum graph valid and the pilot unverified', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
    expect(curriculumData.grades.map((grade) => grade.id)).toEqual([
      'GRADE_1',
      G2_PEP_CHINESE_GRADE_ID,
    ])
    expect(isChinesePilotTextbook(G2_PEP_CHINESE_S1_TEXTBOOK_ID)).toBe(true)
    expect(gradeTwoChineseUpperCurriculum.textbooks[0]?.verificationStatus).toBe('UNVERIFIED')
    expect(gradeTwoChineseUpperCurriculum.textbooks[0]?.needsVerification).toBe(true)
  })
})
