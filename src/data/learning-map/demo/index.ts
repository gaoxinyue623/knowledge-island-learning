import type {
  LearningMapCurriculumKnowledgePoint,
  LearningMapCurriculumKnowledgeRelation,
  LearningMapCurriculumLesson,
  LearningMapCurriculumLessonKnowledgePoint,
  LearningMapCurriculumSource,
  LearningMapCurriculumUnit,
} from '@/types'

const SAMPLE_STATUS = {
  isSample: true,
  verificationStatus: 'SAMPLE' as const,
}

const unitDefinitions = [
  ['DEMO_UNIT_01', '雾林起点', '从观察开始认识数字世界。'],
  ['DEMO_UNIT_02', '晴港航线', '沿着稳定的路径继续探索。'],
  ['DEMO_UNIT_03', '星光山谷', '把已经走过的路连成新的发现。'],
] as const

export const demoLearningMapSource: LearningMapCurriculumSource = {
  textbook: {
    id: 'DEMO_TEXTBOOK_MATH_G3_S1',
    title: 'DEMO 数学知识海域（仅用于地图视觉验证）',
    grade: 3,
    semester: 1,
    subject: 'MATH',
    edition: 'DEMO 视觉夹具',
    ...SAMPLE_STATUS,
  },
  units: unitDefinitions.map(([id, title, subtitle], index): LearningMapCurriculumUnit => ({
    id,
    textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
    title,
    subtitle,
    sort: index + 1,
    ...SAMPLE_STATUS,
  })),
  lessons: unitDefinitions.flatMap(([unitId], unitIndex): LearningMapCurriculumLesson[] =>
    [1, 2].map((lessonNumber) => ({
      id: `DEMO_LESSON_${unitIndex + 1}_${lessonNumber}`,
      unitId,
      title: `探索区 ${unitIndex + 1}-${lessonNumber}`,
      sort: lessonNumber,
      ...SAMPLE_STATUS,
    })),
  ),
  knowledgePoints: Array.from({ length: 18 }, (_, index): LearningMapCurriculumKnowledgePoint => ({
    id: `DEMO_KP_${String(index + 1).padStart(2, '0')}`,
    name: `演示知识点 ${String(index + 1).padStart(2, '0')}`,
    shortTitle: `节点 ${index + 1}`,
    ...SAMPLE_STATUS,
  })),
  lessonKnowledgePoints: Array.from(
    { length: 18 },
    (_, index): LearningMapCurriculumLessonKnowledgePoint => {
      const unitIndex = Math.floor(index / 6)
      const lessonIndex = Math.floor((index % 6) / 3)
      const nodeIndex = index % 3
      return {
        id: `DEMO_LKP_${String(index + 1).padStart(2, '0')}`,
        lessonId: `DEMO_LESSON_${unitIndex + 1}_${lessonIndex + 1}`,
        knowledgePointId: `DEMO_KP_${String(index + 1).padStart(2, '0')}`,
        role: nodeIndex === 0 ? 'core' : nodeIndex === 1 ? 'secondary' : 'extended',
        weight: nodeIndex === 0 ? 1 : 0.5,
        sort: nodeIndex + 1,
        ...SAMPLE_STATUS,
      }
    },
  ),
  knowledgeRelations: Array.from(
    { length: 17 },
    (_, index): LearningMapCurriculumKnowledgeRelation => ({
      id: `DEMO_RELATION_${String(index + 1).padStart(2, '0')}`,
      sourceKnowledgePointId: `DEMO_KP_${String(index + 1).padStart(2, '0')}`,
      targetKnowledgePointId: `DEMO_KP_${String(index + 2).padStart(2, '0')}`,
      relationType: 'prerequisite',
      ...SAMPLE_STATUS,
    }),
  ),
  isSample: true,
  verificationStatus: 'SAMPLE',
}
