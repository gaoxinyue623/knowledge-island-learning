import {
  G1_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeOneChineseLowerCurriculum,
  gradeOneChineseLowerKnowledgePoints,
  gradeOneChineseLowerLessons,
} from '@/data/curriculum/grade-1/chinese-pep-lower'
import type {
  Challenge,
  ContentExpansionBundle,
  ExtensionActivity,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
  StructuredContent,
} from '@/types'

/**
 * Small, self-authored practice prompts for the lower-volume lessons.
 * They do not duplicate the supplied textbook body and remain in the
 * development candidate dataset until independently reviewed.
 */
export const G1_PEP_CHINESE_S2_ORIGINAL_EXERCISE_SOURCE_ID =
  'G1_PEP_CHINESE_S2_ORIGINAL_EXERCISES_V1'

const generatedAt = '2026-09-04T00:00:00.000Z'
const baseRecord = {
  sourceId: G1_PEP_CHINESE_S2_ORIGINAL_EXERCISE_SOURCE_ID,
  verificationStatus: 'UNVERIFIED' as const,
  isSample: false,
}

function structured(...blocks: StructuredContent['blocks']): StructuredContent {
  return { blocks }
}

function displayTitle(title: string): string {
  return `《${title
    .replace(/^\d+\s*/u, '')
    .replace(/【[^】]+】.*$/u, '')
    .trim()}》`
}

function learningContent(
  lessonId: string,
  knowledgePointId: string,
  title: string,
  learningGoals: string[],
): LearningContent {
  const intro: LessonContentBlockRecord = {
    id: `${knowledgePointId}:candidate-exercises:intro`,
    block: { type: 'TEXT', text: `先读${displayTitle(title)}，再用自己的话说一说你发现了什么。` },
    stepType: 'intro',
    title: '先读课文',
    sort: 1,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  }
  const practice: LessonContentBlockRecord = {
    id: `${knowledgePointId}:candidate-exercises:practice`,
    block: { type: 'TEXT', text: '下面有阅读理解、词语积累和生活表达挑战。' },
    stepType: 'practice',
    title: '再练一练',
    sort: 2,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  }
  const steps: LessonStep[] = [intro, practice].map((block) => ({
    id: `${block.id}:step`,
    type: block.stepType as LessonStep['type'],
    title: block.title,
    contentBlockIds: [block.id],
    required: true,
    sort: block.sort,
  }))
  return {
    id: `${knowledgePointId}:candidate-exercises:learning-content:v1`,
    lessonId,
    knowledgePointId,
    title: displayTitle(title),
    learningGoals: [...learningGoals],
    steps,
    blocks: [intro, practice],
    sourceId: G1_PEP_CHINESE_S2_ORIGINAL_EXERCISE_SOURCE_ID,
    status: 'AI_GENERATED',
    currentVersion: 1,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    contentStatus: 'AI_GENERATED',
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }
}

function challenge(
  id: string,
  knowledgePointId: string,
  title: string,
  instruction: string,
  hint: string,
  referenceAnswer: string,
): Challenge {
  return {
    id,
    knowledgePointId,
    title,
    instruction,
    content: structured({ type: 'hint', value: hint }),
    referenceAnswer,
    ...baseRecord,
  }
}

function extensionActivity(
  id: string,
  knowledgePointId: string,
  title: string,
  instruction: string,
  hint: string,
  referenceAnswer: string,
): ExtensionActivity {
  return {
    id,
    knowledgePointId,
    title,
    instruction,
    content: structured({ type: 'hint', value: hint }),
    referenceAnswer,
    ...baseRecord,
  }
}

export const candidateLowerChineseContentExpansionBundles: readonly ContentExpansionBundle[] =
  gradeOneChineseLowerLessons.map((lesson, index) => {
    const knowledgePoint = gradeOneChineseLowerKnowledgePoints[index]
    if (!knowledgePoint) throw new Error(`G1_CHINESE_LOWER_EXERCISE_CONTEXT_MISSING:${index + 1}`)
    const unit = gradeOneChineseLowerCurriculum.units.find((item) => item.id === lesson.unitId)
    if (!unit) throw new Error(`G1_CHINESE_LOWER_EXERCISE_UNIT_MISSING:${lesson.unitId}`)

    const title = displayTitle(lesson.title)
    return {
      knowledgePointId: knowledgePoint.id,
      textbookId: G1_PEP_CHINESE_S2_TEXTBOOK_ID,
      unitId: unit.id,
      lessonId: lesson.id,
      learningContent: learningContent(
        lesson.id,
        knowledgePoint.id,
        lesson.title,
        knowledgePoint.learningObjective,
      ),
      activities: [],
      exerciseTemplates: [],
      practiceSets: [],
      extensionActivities: [
        extensionActivity(
          `${knowledgePoint.id}:CANDIDATE_EXTENSION_01`,
          knowledgePoint.id,
          `词语积累：${title}`,
          `从${title}中找出三个你认识的字或词语，分别组词，并用其中一个词语说一句话。`,
          '先圈出熟悉的字，再把字放进词语和完整句子中。',
          '答案可以不同，只要组词恰当、句子通顺，并且来自自己的语言表达。',
        ),
      ],
      challenges: [
        challenge(
          `${knowledgePoint.id}:CANDIDATE_CHALLENGE_01`,
          knowledgePoint.id,
          `阅读理解：${title}`,
          `读一读${title}，说出课文写到的一个人物、事物或变化，再用一句完整的话说明你的发现。`,
          '先找出“谁、什么、怎么样”，再把答案连成一句话。',
          '答案应根据课文内容作答，能说清一个关键信息即可；不同表达可以成立。',
        ),
      ],
    }
  })
