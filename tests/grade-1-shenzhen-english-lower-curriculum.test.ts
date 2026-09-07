import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
  G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
  G1_SHENZHEN_REGION_ID,
  gradeOneShenzhenEnglishLowerCourseContents,
  gradeOneShenzhenEnglishLowerCurriculum,
  gradeOneShenzhenEnglishLowerKnowledgePoints,
  gradeOneShenzhenEnglishLowerLessons,
  gradeOneShenzhenEnglishLowerRegionTextbookRelations,
} from '@/data/curriculum'
import { isEnglishPilotTextbook, isPilotTextbook } from '@/data/curriculum/pilot'
import { candidateG1ShenzhenEnglishLowerContentExpansionBundles } from '@/data/content-expansion'
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

describe('深圳沪教版一年级下册英语课程', () => {
  it('按四个 Module 建立 4 座知识岛和 16 个学习节点', () => {
    expect(gradeOneShenzhenEnglishLowerCurriculum.units).toHaveLength(4)
    expect(gradeOneShenzhenEnglishLowerLessons).toHaveLength(16)
    expect(gradeOneShenzhenEnglishLowerKnowledgePoints).toHaveLength(16)
    expect(gradeOneShenzhenEnglishLowerCourseContents).toHaveLength(16)
    expect(gradeOneShenzhenEnglishLowerCurriculum.units.map((unit) => unit.title)).toEqual([
      'Module 1 Using my five senses · 运用五官',
      'Module 2 My favourite things · 我最喜欢的事物',
      'Module 3 Things around us · 我们周围的事物',
      'Module 4 Things we enjoy · 我们喜爱的活动',
    ])
    expect(gradeOneShenzhenEnglishLowerLessons[0]).toMatchObject({
      title: 'Unit 1 Look and see · 看一看',
      sortOrder: 1,
    })
    expect(gradeOneShenzhenEnglishLowerLessons.at(-1)).toMatchObject({
      title: 'Revision 4 · 复习4',
      sortOrder: 4,
    })

    expect(gradeOneShenzhenEnglishLowerCourseContents[0]?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('I see a frog.'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('单词拼写'),
        }),
      ]),
    )
    expect(gradeOneShenzhenEnglishLowerCourseContents.at(-1)?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('Aa Bb Cc'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('Picture Dictionary'),
        }),
      ]),
    )
  })

  it('将下册英语教材关联到深圳市，并纳入英语试点识别', () => {
    expect(gradeOneShenzhenEnglishLowerRegionTextbookRelations).toEqual([
      expect.objectContaining({
        regionId: G1_SHENZHEN_REGION_ID,
        textbookVersionId: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
        usageType: 'SUPPORTED',
      }),
    ])
    expect(isEnglishPilotTextbook(G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID)).toBe(true)
    expect(isPilotTextbook(G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID)).toBe(true)
  })

  it('在深圳市一年级下册可分别选择语文、数学和英语教材', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const result = await service.resolveAvailableTextbooks({
      regionId: G1_SHENZHEN_REGION_ID,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
      semesterId: G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
    })

    expect(result.english).toMatchObject({
      resolutionStatus: 'NEEDS_CONFIRMATION',
      availableTextbooks: [expect.objectContaining({ id: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID })],
    })
    expect(result.chinese).toMatchObject({
      availableTextbooks: [expect.objectContaining({ id: 'G1_PEP_CHINESE_S2_2024_CANDIDATE' })],
      resolutionStatus: 'NEEDS_CONFIRMATION',
    })
    expect(result.math).toMatchObject({
      availableTextbooks: [
        expect.objectContaining({ id: 'G1_SHENZHEN_BNU_MATH_S2_2024_CANDIDATE' }),
      ],
      resolutionStatus: 'NEEDS_CONFIRMATION',
    })
  })

  it('从课程域生成四座下册英语知识岛地图', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID)
    if (!source) throw new Error('深圳英语下册地图源不可用')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.textbook).toMatchObject({
      id: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
      subject: 'ENGLISH',
      semester: 2,
    })
    expect(source.units).toHaveLength(4)
    expect(source.lessons).toHaveLength(16)
    expect(viewModel.islands).toHaveLength(4)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(16)
  })

  it('在课程详情读取下册双语文本和英语练习提示', async () => {
    const repository = new MockLearningContentRepository({ accessPolicy: candidateAccessPolicy })
    const content = await repository.getByKnowledgePoint(
      gradeOneShenzhenEnglishLowerKnowledgePoints[0]?.id ?? '',
    )

    expect(content?.blocks).toHaveLength(2)
    expect(content?.blocks[0]?.block).toMatchObject({
      type: 'TEXT',
      text: expect.stringContaining('I see a frog.'),
    })
    expect(content?.blocks[1]?.block).toMatchObject({
      type: 'TEXT',
      text: expect.stringContaining('单词拼写'),
    })
  })

  it('覆盖下册 16 个节点的单词拼写和句子介绍练习', () => {
    expect(candidateG1ShenzhenEnglishLowerContentExpansionBundles).toHaveLength(16)
    for (const bundle of candidateG1ShenzhenEnglishLowerContentExpansionBundles) {
      expect(bundle.textbookId).toBe(G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID)
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.title).toBe('单词拼写')
      expect(bundle.extensionActivities[0]?.title).toBe('句子介绍')
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
    }
  })

  it('允许深圳英语下册试点只确认英语教材', () => {
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.setProfile({
      studentId: 'G1_SHENZHEN_ENGLISH_LOWER_PILOT_STUDENT',
      regionId: G1_SHENZHEN_REGION_ID,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
      semesterId: G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
      chineseTextbookVersionId: null,
      mathTextbookVersionId: null,
      englishTextbookVersionId: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
      confirmedAt: '2026-09-04T00:00:00+08:00',
      source: 'USER_CONFIRMED',
    })

    expect(store.chineseTextbookVersionId).toBeNull()
    expect(store.englishTextbookVersionId).not.toBeNull()
    expect(store.isComplete).toBe(true)
  })

  it('保持合并后的课程图谱有效，并保留下册英语候选状态', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
    expect(curriculumData.textbooks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
          verificationStatus: 'UNVERIFIED',
          needsVerification: true,
        }),
      ]),
    )
  })
})
