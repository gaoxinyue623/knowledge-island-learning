import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_ENGLISH_SEMESTER_ID,
  G1_SHENZHEN_REGION_ID,
  gradeOneShenzhenEnglishUpperCourseContents,
  gradeOneShenzhenEnglishUpperCurriculum,
  gradeOneShenzhenEnglishUpperKnowledgePoints,
  gradeOneShenzhenEnglishUpperLessons,
  gradeOneShenzhenEnglishUpperRegionTextbookRelations,
  gradeOneShenzhenEnglishUpperRegions,
  gradeOneShenzhenEnglishUpperSubject,
} from '@/data/curriculum'
import { isEnglishPilotTextbook, isPilotTextbook } from '@/data/curriculum/pilot'
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

describe('深圳沪教版一年级上册英语课程', () => {
  it('按四个 Module 建立 4 座知识岛和 16 个学习节点', () => {
    expect(gradeOneShenzhenEnglishUpperCurriculum.units).toHaveLength(4)
    expect(gradeOneShenzhenEnglishUpperLessons).toHaveLength(16)
    expect(gradeOneShenzhenEnglishUpperKnowledgePoints).toHaveLength(16)
    expect(gradeOneShenzhenEnglishUpperCourseContents).toHaveLength(16)
    expect(gradeOneShenzhenEnglishUpperCurriculum.units.map((unit) => unit.title)).toEqual([
      'Module 1 Getting to know you · 认识你',
      'Module 2 My family, my friends and me · 家庭、朋友和我',
      'Module 3 Places and activities · 地点和活动',
      'Module 4 The world around us · 我们周围的世界',
    ])
    expect(gradeOneShenzhenEnglishUpperLessons[0]).toMatchObject({
      title: 'Unit 1 What is your family like? · 你的家人是什么样的？',
      sortOrder: 1,
    })
    expect(gradeOneShenzhenEnglishUpperLessons.at(-1)).toMatchObject({
      title: 'Revision 4 · 复习4',
      sortOrder: 4,
    })

    expect(gradeOneShenzhenEnglishUpperCourseContents[0]?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('This is my grandma.'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('单词拼写'),
        }),
      ]),
    )
    expect(gradeOneShenzhenEnglishUpperCourseContents.at(-1)?.body['blocks']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('Aa Bb Cc'),
        }),
        expect.objectContaining({
          type: 'TEXT',
          text: expect.stringContaining('Picture dictionary'),
        }),
      ]),
    )
  })

  it('只把深圳市作为广东省下的英语教材适用地区', () => {
    expect(gradeOneShenzhenEnglishUpperSubject).toMatchObject({
      id: 'SUBJECT_ENGLISH',
      code: 'ENGLISH',
      name: '英语',
    })
    expect(gradeOneShenzhenEnglishUpperRegions).toEqual([
      expect.objectContaining({
        id: G1_SHENZHEN_REGION_ID,
        code: 'CN-GD-SZ',
        name: '深圳市',
        parentRegionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
        level: 'CITY',
      }),
    ])
    expect(gradeOneShenzhenEnglishUpperRegionTextbookRelations).toEqual([
      expect.objectContaining({
        regionId: G1_SHENZHEN_REGION_ID,
        textbookVersionId: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
        usageType: 'SUPPORTED',
      }),
    ])
    expect(isEnglishPilotTextbook(G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)).toBe(true)
    expect(isPilotTextbook(G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)).toBe(true)
  })

  it('在深圳市一年级上册可分别选择语文、数学和英语教材', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const result = await service.resolveAvailableTextbooks({
      regionId: G1_SHENZHEN_REGION_ID,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
      semesterId: G1_SHENZHEN_ENGLISH_SEMESTER_ID,
    })

    expect(result.english).toMatchObject({
      resolutionStatus: 'NEEDS_CONFIRMATION',
      availableTextbooks: [expect.objectContaining({ id: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID })],
    })
    expect(result.chinese).toMatchObject({
      availableTextbooks: [expect.objectContaining({ id: 'G1_PEP_CHINESE_S1_2024_CANDIDATE' })],
      resolutionStatus: 'NEEDS_CONFIRMATION',
    })
    expect(result.math).toMatchObject({
      availableTextbooks: [
        expect.objectContaining({ id: 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE' }),
      ],
      resolutionStatus: 'NEEDS_CONFIRMATION',
    })
  })

  it('从课程域生成四座英语知识岛地图', async () => {
    const service = new MockCurriculumService({ accessPolicy: candidateAccessPolicy })
    const source = await service.getLearningMapCurriculum(G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID)
    if (!source) throw new Error('深圳英语地图源不可用')

    const viewModel = buildLearningMapViewModel(source)
    expect(source.textbook).toMatchObject({
      id: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      subject: 'ENGLISH',
      semester: 1,
    })
    expect(source.units).toHaveLength(4)
    expect(source.lessons).toHaveLength(16)
    expect(viewModel.islands).toHaveLength(4)
    expect(flattenKnowledgeNodes(viewModel.islands)).toHaveLength(16)
  })

  it('在课程详情读取双语学习文本和练习提示', async () => {
    const repository = new MockLearningContentRepository({ accessPolicy: candidateAccessPolicy })
    const content = await repository.getByKnowledgePoint(
      gradeOneShenzhenEnglishUpperKnowledgePoints[0]?.id ?? '',
    )

    expect(content?.blocks).toHaveLength(2)
    expect(content?.blocks[0]?.block).toMatchObject({
      type: 'TEXT',
      text: expect.stringContaining('This is my grandma.'),
    })
    expect(content?.blocks[1]?.block).toMatchObject({
      type: 'TEXT',
      text: expect.stringContaining('单词拼写'),
    })
  })

  it('允许深圳英语试点配置只确认英语教材，并保持候选状态', () => {
    setActivePinia(createPinia())
    const store = useCurriculumStore()
    store.setProfile({
      studentId: 'G1_SHENZHEN_ENGLISH_PILOT_STUDENT',
      regionId: G1_SHENZHEN_REGION_ID,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
      semesterId: G1_SHENZHEN_ENGLISH_SEMESTER_ID,
      chineseTextbookVersionId: null,
      mathTextbookVersionId: null,
      englishTextbookVersionId: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      confirmedAt: '2026-09-04T00:00:00+08:00',
      source: 'USER_CONFIRMED',
    })

    expect(store.chineseTextbookVersionId).toBeNull()
    expect(store.englishTextbookVersionId).not.toBeNull()
    expect(store.isComplete).toBe(true)
  })

  it('保持合并后的课程图谱有效，并保留英语候选为未审核状态', () => {
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
    expect(curriculumData.subjects.map((subject) => subject.code)).toEqual([
      'CHINESE',
      'MATH',
      'ENGLISH',
    ])
    expect(gradeOneShenzhenEnglishUpperCurriculum.textbooks[0]).toMatchObject({
      id: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      verificationStatus: 'UNVERIFIED',
      needsVerification: true,
    })
  })
})
