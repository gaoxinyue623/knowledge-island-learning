import { describe, expect, it } from 'vitest'

import {
  curriculumData,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G2_PEP_CHINESE_GRADE_ID,
  G2_PEP_CHINESE_S2_SEMESTER_ID,
  G2_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeTwoChineseLowerCourseContents,
  gradeTwoChineseLowerCurriculum,
  gradeTwoChineseLowerKnowledgePoints,
  gradeTwoChineseLowerLessons,
  gradeTwoChineseLowerRegionTextbookRelations,
} from '@/data/curriculum'
import { isChinesePilotTextbook } from '@/data/curriculum/pilot'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { validateCurriculumData } from '@/services/validation'
import { G2_REVISED_CHINESE_TEXTBOOK_ID } from '@/data/curriculum/grade-2/chinese-pep-lower-revised'

const candidateAccessPolicy = {
  allowSampleCurriculum: true,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: true,
  allowUnreviewedLearningContent: true,
}

describe('Grade 2 PEP Chinese lower-volume curriculum', () => {
  it('enters eight units, 38 lessons, textbook text, and the appendix', () => {
    expect(gradeTwoChineseLowerCurriculum.units).toHaveLength(8)
    expect(gradeTwoChineseLowerLessons).toHaveLength(38)
    expect(gradeTwoChineseLowerKnowledgePoints).toHaveLength(38)
    expect(gradeTwoChineseLowerCourseContents).toHaveLength(38)
    expect(gradeTwoChineseLowerCurriculum.units.map((unit) => unit.title)).toEqual([
      '第一单元·课文',
      '第二单元·课文',
      '第三单元·识字',
      '第四单元·课文',
      '第五单元·课文',
      '第六单元·课文',
      '第七单元·课文',
      '第八单元·课文',
    ])
    expect(gradeTwoChineseLowerLessons[0]).toMatchObject({
      title: '1 古诗二首',
      sortOrder: 1,
    })
    expect(gradeTwoChineseLowerLessons.at(-1)).toMatchObject({
      title: '语文园地八',
      sortOrder: 4,
    })
    expect(gradeTwoChineseLowerCourseContents[0]).toMatchObject({
      id: 'G2_PEP_CHINESE_S2_CONTENT_01',
      title: '《古诗二首》',
      contentType: 'TEXTBOOK',
      verificationStatus: 'UNVERIFIED',
    })
    expect(gradeTwoChineseLowerCourseContents[0]?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('草长莺飞二月天'),
        }),
      ]),
    )
    expect(gradeTwoChineseLowerCourseContents.at(-1)?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('附录一 识字表'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('附录三 词语表'),
        }),
      ]),
    )
  })

  it('preserves the existing Guangdong and Hubei source relations', () => {
    expect(gradeTwoChineseLowerRegionTextbookRelations).toHaveLength(2)
    expect(gradeTwoChineseLowerRegionTextbookRelations.map((item) => item.regionId)).toEqual([
      G1_PEP_CHINESE_GUANGDONG_REGION_ID,
      G1_PEP_CHINESE_HUBEI_REGION_ID,
    ])
    expect(
      gradeTwoChineseLowerRegionTextbookRelations.every(
        (item) => item.textbookVersionId === G2_PEP_CHINESE_S2_TEXTBOOK_ID,
      ),
    ).toBe(true)
  })

  it.each([G1_PEP_CHINESE_GUANGDONG_REGION_ID, G1_PEP_CHINESE_HUBEI_REGION_ID])(
    'resolves the Grade 2 lower-volume Chinese textbook for %s',
    async (regionId) => {
      const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
      const result = await service.resolveAvailableTextbooks({
        regionId,
        gradeId: G2_PEP_CHINESE_GRADE_ID,
        semesterId: G2_PEP_CHINESE_S2_SEMESTER_ID,
      })

      expect(result.chinese.availableTextbooks.map((textbook) => textbook.id)).toEqual([
        G2_PEP_CHINESE_S2_TEXTBOOK_ID,
        G2_REVISED_CHINESE_TEXTBOOK_ID,
      ])
      expect(result.chinese.resolutionStatus).toBe('NEEDS_CONFIRMATION')
      expect(result.math.availableTextbooks).toEqual([])
      expect(result.english.availableTextbooks).toEqual([])
    },
  )

  it('builds the Grade 2 lower-volume knowledge island map from the domain data', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G2_PEP_CHINESE_S2_TEXTBOOK_ID)
    if (!source) throw new Error('Grade 2 lower-volume map source is unavailable')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.textbook.id).toBe(G2_PEP_CHINESE_S2_TEXTBOOK_ID)
    expect(source.textbook.semester).toBe(2)
    expect(source.units).toHaveLength(8)
    expect(source.lessons).toHaveLength(38)
    expect(viewModel.islands).toHaveLength(8)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(38)
  })

  it('keeps the combined curriculum graph valid and the pilot unverified', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
    expect(curriculumData.grades.map((grade) => grade.id)).toEqual([
      'GRADE_1',
      G2_PEP_CHINESE_GRADE_ID,
    ])
    expect(isChinesePilotTextbook(G2_PEP_CHINESE_S2_TEXTBOOK_ID)).toBe(true)
    expect(gradeTwoChineseLowerCurriculum.textbooks[0]?.verificationStatus).toBe('UNVERIFIED')
    expect(gradeTwoChineseLowerCurriculum.textbooks[0]?.needsVerification).toBe(true)
  })
})
