import {
  bnuMathLowerLessons,
  G2_BNU_MATH_S2_TEXTBOOK_IDS,
} from '@/data/curriculum/grade-2/bnu-lower'
import { BNU_MATH_LOWER_IMPORT_APPROVAL } from '@/data/curriculum/production/bnuMathLowerApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest, QuestQuestionStage } from '@/types/reading-quest'

export function isBnuLowerMathTextbook(id: string) {
  return G2_BNU_MATH_S2_TEXTBOOK_IDS.some((bookId) => bookId === id)
}
export function createBnuLowerMathQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  const lesson = bnuMathLowerLessons.find(
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
    bundle.learningContent.contentStatus !== 'PUBLISHED'
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `bnu-lower-quest:v1:${lesson.knowledgePointId}`,
    textbookId: lesson.textbookId,
    lessonId: lesson.lessonId,
    knowledgePointId: lesson.knowledgePointId,
    sourceId: lesson.exerciseSourceId,
    subject: 'MATH',
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: BNU_MATH_LOWER_IMPORT_APPROVAL,
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

/** Revisit the three reviewed items; rounds vary order, not the authored math content. */
export function createBnuLowerMathReview(base: ReadingQuest, variant: number): ReadingQuest {
  const v = ((Math.trunc(Number.isFinite(variant) ? variant : 0) % 3) + 3) % 3
  const quest = structuredClone(base)
  quest.id = `${base.id}:review-v1:${v}`
  quest.training = { variantIndex: v, variantCount: 3 }
  quest.stages = [...quest.stages.slice(v), ...quest.stages.slice(0, v)].map((stage, index) => {
    const id = `${quest.id}:stage:${index + 1}`
    stage.id = id
    stage.title = ['回顾概念', '说清方法', '检查应用'][index]!
    stage.context = '复习本课已审核的三道配套题，题目和选项顺序会变化。'
    stage.trainingBand = (['foundation', 'reasoning', 'transfer'] as const)[index]!
    if (stage.kind === 'question') {
      stage.question.id = id
      const original = stage.question.options ?? []
      const offset = (v + index + 1) % original.length
      const options = [...original.slice(offset), ...original.slice(0, offset)]
      // Keep option keys and scoring rules; regenerate only identity and display order.
      stage.question.options = options.map((option, order) => ({
        ...option,
        id: `${id}:option:${option.optionKey}`,
        questionId: id,
        sortOrder: order,
      }))
    }
    return stage
  })
  return quest
}
