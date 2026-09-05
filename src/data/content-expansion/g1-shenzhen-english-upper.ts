import {
  G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  gradeOneShenzhenEnglishUpperCurriculum,
  gradeOneShenzhenEnglishUpperKnowledgePoints,
  gradeOneShenzhenEnglishUpperLessonPracticeDefinitions,
  gradeOneShenzhenEnglishUpperLessons,
} from '@/data/curriculum/grade-1/english-shanghai-upper'
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
 * Original practice prompts aligned to the Shenzhen Grade 1 English lessons.
 * Each lesson deliberately has a word-spelling challenge and a sentence-
 * introduction activity; the candidate records remain outside production.
 */
export const G1_SHENZHEN_ENGLISH_S1_ORIGINAL_EXERCISE_SOURCE_ID =
  'G1_SHENZHEN_ENGLISH_S1_ORIGINAL_EXERCISES_V1'

const generatedAt = '2026-09-04T00:00:00.000Z'
const baseRecord = {
  sourceId: G1_SHENZHEN_ENGLISH_S1_ORIGINAL_EXERCISE_SOURCE_ID,
  verificationStatus: 'UNVERIFIED' as const,
  isSample: false,
}

function structured(...blocks: StructuredContent['blocks']): StructuredContent {
  return { blocks }
}

function learningContent(
  lessonId: string,
  knowledgePointId: string,
  title: string,
  learningGoals: string[],
): LearningContent {
  const intro: LessonContentBlockRecord = {
    id: `${knowledgePointId}:candidate-exercises:intro`,
    block: { type: 'TEXT', text: `先听读${title}，再跟着录音或老师读一读核心单词和句型。` },
    stepType: 'intro',
    title: '先听读英语',
    sort: 1,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  }
  const practice: LessonContentBlockRecord = {
    id: `${knowledgePointId}:candidate-exercises:practice`,
    block: { type: 'TEXT', text: '下面有单词拼写、句子介绍和听读表达挑战。' },
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
    title,
    learningGoals: [...learningGoals],
    steps,
    blocks: [intro, practice],
    sourceId: G1_SHENZHEN_ENGLISH_S1_ORIGINAL_EXERCISE_SOURCE_ID,
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

export const candidateG1ShenzhenEnglishContentExpansionBundles: readonly ContentExpansionBundle[] =
  gradeOneShenzhenEnglishUpperLessons.map((lesson, index) => {
    const definition = gradeOneShenzhenEnglishUpperLessonPracticeDefinitions[index]
    const knowledgePoint = gradeOneShenzhenEnglishUpperKnowledgePoints[index]
    if (!definition || !knowledgePoint)
      throw new Error(`G1_SHENZHEN_ENGLISH_EXERCISE_CONTEXT_MISSING:${index + 1}`)
    const unit = gradeOneShenzhenEnglishUpperCurriculum.units.find(
      (item) => item.id === lesson.unitId,
    )
    if (!unit) throw new Error(`G1_SHENZHEN_ENGLISH_EXERCISE_UNIT_MISSING:${lesson.unitId}`)

    const spellingWords = definition.words.slice(0, 3)
    const spellingPrompt = spellingWords.map((word) => `${word.chinese}（          ）`).join('、')
    const spellingAnswer = spellingWords.map((word) => word.english).join('; ')

    return {
      knowledgePointId: knowledgePoint.id,
      textbookId: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
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
          '句子介绍',
          definition.sentencePrompt,
          `先套用句型“${definition.sentencePattern}”，再替换成你自己的内容。`,
          `示例：${definition.sentenceAnswer}`,
        ),
      ],
      challenges: [
        challenge(
          `${knowledgePoint.id}:CANDIDATE_CHALLENGE_01`,
          knowledgePoint.id,
          '单词拼写',
          `根据中文提示写出${lesson.title}中的英语单词：${spellingPrompt}。`,
          '先根据中文想一想意思，再按字母顺序写出单词；不会的单词可以先听读再尝试。',
          `参考答案：${spellingAnswer}`,
        ),
      ],
    }
  })
