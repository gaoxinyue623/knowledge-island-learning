import {
  G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
  gradeOneShenzhenMathUpperCurriculum,
  gradeOneShenzhenMathUpperDefinitions,
} from '@/data/curriculum/grade-1/math-bnu-upper'
import type {
  ContentExpansionBundle,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
} from '@/types'

const provenance = {
  sourceId: G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
  isSample: false,
  verificationStatus: 'UNVERIFIED' as const,
}
export const candidateG1ShenzhenMathUpperContentExpansionBundles: readonly ContentExpansionBundle[] =
  gradeOneShenzhenMathUpperDefinitions.map((d, i) => {
    const blocks: LessonContentBlockRecord[] = [
      {
        id: `${d.knowledgePointId}:math-intro`,
        block: {
          type: 'TEXT',
          text: '先看一看，再点一点、摆一摆。下方有数字卡、配对和排队游戏，不限时，可以请家人读题。',
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
      learningGoals: [...gradeOneShenzhenMathUpperCurriculum.knowledgePoints[i]!.learningObjective],
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
      textbookId: G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
      unitId: gradeOneShenzhenMathUpperCurriculum.units[d.unitIndex]!.id,
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
                value:
                  '可以画图、摆圆片或说一说；动手操作时请家人陪同。这个开放探究没有唯一表达方式，不自动评分。',
              },
            ],
          },
          referenceAnswer: d.discoveryAnswer,
          ...provenance,
        },
      ],
    }
  })
