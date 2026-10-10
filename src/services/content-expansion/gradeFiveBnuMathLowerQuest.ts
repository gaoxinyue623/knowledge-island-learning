import { gradeFiveBnuMathLowerLessons } from '@/data/curriculum/grade-5/math-bnu-lower-2013'
import { G5_BNU_MATH_LOWER_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeFiveBnuMathLowerApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest, QuestQuestionStage } from '@/types/reading-quest'

export function createGradeFiveBnuMathLowerQuest(
  bundle: ContentExpansionBundle,
): ReadingQuest | null {
  const lesson = gradeFiveBnuMathLowerLessons.find(
    (d) =>
      d.knowledgePointId === bundle.knowledgePointId &&
      d.lessonId === bundle.lessonId &&
      d.textbookId === bundle.textbookId &&
      d.unitId === bundle.unitId,
  )
  if (
    !lesson ||
    bundle.learningContent.knowledgePointId !== lesson.knowledgePointId ||
    bundle.learningContent.lessonId !== lesson.lessonId ||
    bundle.learningContent.sourceId !== lesson.exerciseSourceId ||
    bundle.learningContent.isSample ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    bundle.learningContent.currentVersion !== 1 ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G5_BNU_MATH_LOWER_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `bnu-g5-lower-quest:v1:${lesson.knowledgePointId}`,
    textbookId: lesson.textbookId,
    lessonId: lesson.lessonId,
    knowledgePointId: lesson.knowledgePointId,
    sourceId: lesson.exerciseSourceId,
    subject: 'MATH',
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G5_BNU_MATH_LOWER_IMPORT_APPROVAL,
    stages: lesson.questions.map((question, index): QuestQuestionStage => ({
      id: question.id,
      kind: 'question',
      title: ['基础理解', '方法检查', '生活应用'][index]!,
      question: structuredClone(question),
      explanation: question.explanation.summary.map((b) => b.text).join('\n'),
      hint: '先读题目中的条件，回看本课例子。',
      hints: ['先读题目中的条件，回看本课例子。', '用画图、列式或逐项比较说明依据，再检查答案。'],
    })),
  }
  return quest
}
