import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import {
  curriculumData,
  G2_PEP_CHINESE_GRADE_ID,
  G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
  G2_SHENZHEN_REGION_ID,
  gradeTwoShenzhenEnglishUpperCourseContents,
  gradeTwoShenzhenEnglishUpperCurriculum,
  gradeTwoShenzhenEnglishUpperKnowledgePoints,
  gradeTwoShenzhenEnglishUpperLessons,
  gradeTwoShenzhenEnglishUpperRegionTextbookRelations,
} from '@/data/curriculum'
import { isEnglishPilotTextbook, isPilotTextbook } from '@/data/curriculum/pilot'
import { candidateG2ShenzhenEnglishUpperContentExpansionBundles } from '@/data/content-expansion'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { validateCurriculumData } from '@/services/validation'
import { useCurriculumStore } from '@/stores/curriculumStore'

const candidateAccessPolicy = {
  allowSampleCurriculum: true,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: true,
  allowUnreviewedLearningContent: true,
}

describe('深圳沪教版二年级上册英语课程', () => {
  it('按 Unit 建立 6 座知识岛和 6 个学习节点', () => {
    expect(gradeTwoShenzhenEnglishUpperCurriculum.units).toHaveLength(6)
    expect(gradeTwoShenzhenEnglishUpperLessons).toHaveLength(6)
    expect(gradeTwoShenzhenEnglishUpperKnowledgePoints).toHaveLength(6)
    expect(gradeTwoShenzhenEnglishUpperCourseContents).toHaveLength(6)
    expect(gradeTwoShenzhenEnglishUpperLessons[0]).toMatchObject({
      title: 'Unit 1 Big Question: What can you do with your five senses? · 你能用五官做什么？',
      sortOrder: 1,
    })
    expect(gradeTwoShenzhenEnglishUpperLessons.at(-1)).toMatchObject({
      title:
        'Unit 6 Big Question: How do people celebrate the Mid-Autumn Festival? · 人们怎样过中秋节？',
      sortOrder: 1,
    })

    expect(gradeTwoShenzhenEnglishUpperCourseContents[0]?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('I can feel the rabbit.'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('单词拼写'),
        }),
      ]),
    )
    expect(gradeTwoShenzhenEnglishUpperCourseContents.at(-1)?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('Word list 1'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('play with lanterns'),
        }),
      ]),
    )
  })

  it('只将二年级上册英语教材关联到深圳市', () => {
    expect(gradeTwoShenzhenEnglishUpperRegionTextbookRelations).toEqual([
      expect.objectContaining({
        regionId: G2_SHENZHEN_REGION_ID,
        textbookVersionId: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
        usageType: 'SUPPORTED',
      }),
    ])
    expect(isEnglishPilotTextbook(G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)).toBe(true)
    expect(isPilotTextbook(G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)).toBe(true)
  })

  it('在深圳市二年级上册解析英语与新接入的数学教材', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const result = await service.resolveAvailableTextbooks({
      regionId: G2_SHENZHEN_REGION_ID,
      gradeId: G2_PEP_CHINESE_GRADE_ID,
      semesterId: 'SEMESTER_UPPER',
    })

    expect(result.english).toMatchObject({
      resolutionStatus: 'NEEDS_CONFIRMATION',
      availableTextbooks: [expect.objectContaining({ id: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID })],
    })
    expect(result.chinese).toMatchObject({
      availableTextbooks: [],
      resolutionStatus: 'NOT_AVAILABLE',
    })
    expect(result.math).toMatchObject({
      availableTextbooks: [expect.objectContaining({ id: G2_SHENZHEN_MATH_S1_TEXTBOOK_ID })],
      resolutionStatus: 'NEEDS_CONFIRMATION',
    })
  })

  it('从课程域生成六座二年级英语知识岛地图', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)
    if (!source) throw new Error('深圳二年级英语地图源不可用')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.textbook).toMatchObject({
      id: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      subject: 'ENGLISH',
      semester: 1,
    })
    expect(source.units).toHaveLength(6)
    expect(source.lessons).toHaveLength(6)
    expect(viewModel.islands).toHaveLength(6)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(6)
  })

  it('在课程详情读取二年级双语文本和练习提示', async () => {
    const repository = new MockLearningContentRepository({ accessPolicy: candidateAccessPolicy })
    const content = await repository.getByKnowledgePoint(
      gradeTwoShenzhenEnglishUpperKnowledgePoints[0]?.id ?? '',
    )

    expect(content?.blocks).toHaveLength(2)
    expect(content?.blocks[0]?.block).toMatchObject({
      type: 'TEXT',
      text: expect.stringContaining('I can feel the rabbit.'),
    })
    expect(content?.blocks[1]?.block).toMatchObject({
      type: 'TEXT',
      text: expect.stringContaining('单词拼写'),
    })
  })

  it('覆盖 6 个节点的单词拼写和句子介绍练习', () => {
    expect(candidateG2ShenzhenEnglishUpperContentExpansionBundles).toHaveLength(6)
    for (const bundle of candidateG2ShenzhenEnglishUpperContentExpansionBundles) {
      expect(bundle.textbookId).toBe(G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.title).toBe('单词拼写')
      expect(bundle.extensionActivities[0]?.title).toBe('句子介绍')
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
    }
  })

  it('允许深圳二年级英语试点只确认英语教材', () => {
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.setProfile({
      studentId: 'G2_SHENZHEN_ENGLISH_PILOT_STUDENT',
      regionId: G2_SHENZHEN_REGION_ID,
      gradeId: G2_PEP_CHINESE_GRADE_ID,
      semesterId: 'SEMESTER_UPPER',
      chineseTextbookVersionId: null,
      mathTextbookVersionId: null,
      englishTextbookVersionId: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      confirmedAt: '2026-09-04T00:00:00+08:00',
      source: 'USER_CONFIRMED',
    })

    expect(store.isChinesePilot).toBe(false)
    expect(store.isEnglishPilot).toBe(true)
    expect(store.isCurriculumPilot).toBe(true)
    expect(store.isComplete).toBe(true)
  })

  it('保持合并后的课程图谱有效，并保留二年级英语候选状态', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
    expect(curriculumData.textbooks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
          verificationStatus: 'UNVERIFIED',
          needsVerification: true,
        }),
      ]),
    )
  })
})
