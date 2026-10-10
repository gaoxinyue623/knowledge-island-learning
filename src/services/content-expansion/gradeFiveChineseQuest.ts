import {
  G5_PEP_CHINESE_S1_TEXTBOOK_ID,
  G5_PEP_CHINESE_PRACTICE_SOURCE_ID,
  G5_ASTRONAUT_PRACTICE_SOURCE_ID,
  gradeFiveChineseDefinitions,
  gradeFiveChineseQuestions,
} from '@/data/curriculum/grade-5/chinese-pep-upper'
import { G5_CHINESE_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeFiveChineseApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeFiveChineseQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  const d = gradeFiveChineseDefinitions.find((d) => d.knowledgePointId === bundle.knowledgePointId)
  const revision = d?.key === 'reading-19' ? 2 : 1
  const practiceSourceId =
    revision === 2 ? G5_ASTRONAUT_PRACTICE_SOURCE_ID : G5_PEP_CHINESE_PRACTICE_SOURCE_ID
  if (
    !d ||
    !d.questions.length ||
    bundle.textbookId !== G5_PEP_CHINESE_S1_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== practiceSourceId ||
    bundle.learningContent.currentVersion !== revision ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G5_CHINESE_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g5-chinese-reading-quest:v${revision}:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: practiceSourceId,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G5_CHINESE_IMPORT_APPROVAL,
    stages: gradeFiveChineseQuestions
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
