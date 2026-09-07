import {
  G1_SHENZHEN_MATH_S2_TEXTBOOK_ID,
  G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID,
  gradeOneShenzhenMathLowerCurriculum,
  gradeOneShenzhenMathLowerDefinitions,
} from '@/data/curriculum/grade-1/math-bnu-lower'
import type {
  ContentExpansionBundle,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
} from '@/types'

const provenance = {
  sourceId: G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID,
  isSample: false,
  verificationStatus: 'UNVERIFIED' as const,
}
export const candidateG1ShenzhenMathLowerContentExpansionBundles: readonly ContentExpansionBundle[] =
  gradeOneShenzhenMathLowerDefinitions.map((d, i) => {
    const blocks: LessonContentBlockRecord[] = [
      {
        id: `${d.knowledgePointId}:math-intro`,
        block: {
          type: 'TEXT',
          text: '先看图理解方法，再试数字卡、配对、排序和填数挑战。凑十与破十可以分步看，不限时，可以请家人读题。',
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
      learningGoals: [...gradeOneShenzhenMathLowerCurriculum.knowledgePoints[i]!.learningObjective],
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
      textbookId: G1_SHENZHEN_MATH_S2_TEXTBOOK_ID,
      unitId: gradeOneShenzhenMathLowerCurriculum.units[d.unitIndex]!.id,
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
