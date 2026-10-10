import {
  G6_54_CHINESE_S2_TEXTBOOK_ID,
  G6_54_CHINESE_PRACTICE_SOURCE_ID,
  gradeSixChinese54LowerDefinitions,
  gradeSixChinese54LowerQuestions,
} from '@/data/curriculum/grade-6/chinese-pep-54-lower'
import { G6_54_CHINESE_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeSixChinese54LowerApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeSixChinese54LowerQuest(
  bundle: ContentExpansionBundle,
): ReadingQuest | null {
  const d = gradeSixChinese54LowerDefinitions.find(
    (d) => d.knowledgePointId === bundle.knowledgePointId,
  )
  const practiceSourceId = G6_54_CHINESE_PRACTICE_SOURCE_ID
  if (
    !d ||
    !d.questions.length ||
    bundle.textbookId !== G6_54_CHINESE_S2_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== practiceSourceId ||
    bundle.learningContent.currentVersion !== 1 ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G6_54_CHINESE_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g6-54-chinese-reading-quest:v1:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: practiceSourceId,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G6_54_CHINESE_IMPORT_APPROVAL,
    stages: gradeSixChinese54LowerQuestions
      .filter((q) => q.knowledgePointId === d.knowledgePointId)
      .map((q, n) => ({
        id: q.id,
        kind: 'question',
        title: ['读懂信息', '联系原文', '解释与概括'][n]!,
        question: structuredClone(q),
        explanation: q.explanation.summary.map((b) => b.text).join('\n'),
        hint: '回看原文，检查人物、动作、条件与结果。',
        hints: ['先理解问题，再尝试回忆。', '逐项与原文对照，用完整信息判断。'],
      })),
  }
  return quest
}
