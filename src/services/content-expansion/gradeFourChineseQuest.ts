import {
  G4_PEP_CHINESE_S1_TEXTBOOK_ID,
  G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
  gradeFourChineseDefinitions,
  gradeFourChineseQuestions,
} from '@/data/curriculum/grade-4/chinese-pep-upper'
import { G4_CHINESE_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeFourChineseApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeFourChineseQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  const d = gradeFourChineseDefinitions.find((d) => d.knowledgePointId === bundle.knowledgePointId)
  if (
    !d ||
    !d.questions.length ||
    bundle.textbookId !== G4_PEP_CHINESE_S1_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== G4_PEP_CHINESE_PRACTICE_SOURCE_ID ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G4_CHINESE_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g4-chinese-reading-quest:v1:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G4_CHINESE_IMPORT_APPROVAL,
    stages: gradeFourChineseQuestions
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
