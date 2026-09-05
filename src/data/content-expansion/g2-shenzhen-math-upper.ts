import {
  G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
  G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
  gradeTwoShenzhenMathUpperCurriculum,
  gradeTwoShenzhenMathUpperDefinitions,
} from '@/data/curriculum/grade-2/math-bnu-upper'
import type {
  ContentExpansionBundle,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
} from '@/types'

const provenance = {
  sourceId: G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
  isSample: false,
  verificationStatus: 'UNVERIFIED' as const,
}
export const candidateG2ShenzhenMathUpperContentExpansionBundles: readonly ContentExpansionBundle[] =
  gradeTwoShenzhenMathUpperDefinitions.map((d, i) => {
    const blocks: LessonContentBlockRecord[] = [
      {
        id: `${d.knowledgePointId}:math-intro`,
        block: {
          type: 'TEXT',
          text: '先看知识讲解和例子，再到数学闯关试一试。可以画图、摆小棒，不限时。',
        },
        stepType: 'intro',
        title: '准备出发',
        sort: 1,
        ...provenance,
      },
    ]
    const steps: LessonStep[] = blocks.map((b) => ({
      id: `${b.id}:step`,
      type: 'intro',
      title: b.title,
      contentBlockIds: [b.id],
      required: true,
      sort: b.sort,
    }))
    const learningContent: LearningContent = {
      id: `${d.knowledgePointId}:math-learning:v1`,
      lessonId: d.lessonId,
      knowledgePointId: d.knowledgePointId,
      title: d.title,
      learningGoals: [...gradeTwoShenzhenMathUpperCurriculum.knowledgePoints[i]!.learningObjective],
      steps,
      blocks,
      ...provenance,
      status: 'AI_GENERATED',
      contentStatus: 'AI_GENERATED',
      currentVersion: 1,
      createdAt: '2026-09-05T00:00:00+08:00',
      updatedAt: '2026-09-05T00:00:00+08:00',
    }
    return {
      knowledgePointId: d.knowledgePointId,
      textbookId: G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
      unitId: gradeTwoShenzhenMathUpperCurriculum.units[d.unitIndex]!.id,
      lessonId: d.lessonId,
      learningContent,
      activities: [],
      exerciseTemplates: [],
      practiceSets: [],
      challenges: [],
      extensionActivities: [
        {
          id: `${d.knowledgePointId}:investigation:v1`,
          knowledgePointId: d.knowledgePointId,
          title: '动手探究 · 说说你的方法',
          instruction: d.discovery,
          content: {
            blocks: [
              {
                type: 'hint',
                value: '用画图、摆物或列式解释。这个开放探究没有唯一表达方式，不自动评分。',
              },
            ],
          },
          referenceAnswer: d.discoveryAnswer,
          ...provenance,
        },
      ],
    }
  })
