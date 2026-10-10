import {
  G4_PEP_CHINESE_S2_TEXTBOOK_ID,
  G4_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
  G4_LUHUA_PRACTICE_SOURCE_ID,
  gradeFourLuhuaCorrection,
  gradeFourChineseLowerDefinitions,
  gradeFourChineseLowerQuestions,
} from '@/data/curriculum/grade-4/chinese-pep-lower'
import { G4_CHINESE_LOWER_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeFourChineseLowerApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeFourChineseLowerQuest(
  bundle: ContentExpansionBundle,
): ReadingQuest | null {
  const d = gradeFourChineseLowerDefinitions.find(
    (d) => d.knowledgePointId === bundle.knowledgePointId,
  )
  const revision = d?.key === gradeFourLuhuaCorrection.key ? 2 : 1
  const practiceSourceId =
    revision === 2 ? G4_LUHUA_PRACTICE_SOURCE_ID : G4_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID
  if (
    !d ||
    !d.questions.length ||
    bundle.textbookId !== G4_PEP_CHINESE_S2_TEXTBOOK_ID ||
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
    bundle.learningContent.releaseApprovalId !== G4_CHINESE_LOWER_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g4-chinese-lower-reading-quest:v${revision}:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: practiceSourceId,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G4_CHINESE_LOWER_IMPORT_APPROVAL,
    stages: gradeFourChineseLowerQuestions
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
