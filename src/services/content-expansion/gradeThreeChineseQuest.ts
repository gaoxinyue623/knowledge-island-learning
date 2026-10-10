import {
  G3_PEP_CHINESE_S1_TEXTBOOK_ID,
  G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
  gradeThreeChineseDefinitions,
  gradeThreeChineseQuestions,
} from '@/data/curriculum/grade-3/chinese-pep-upper'
import { G3_CHINESE_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeThreeChineseApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeThreeChineseQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  const d = gradeThreeChineseDefinitions.find((d) => d.knowledgePointId === bundle.knowledgePointId)
  if (
    !d ||
    !d.questions.length ||
    bundle.textbookId !== G3_PEP_CHINESE_S1_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== G3_PEP_CHINESE_PRACTICE_SOURCE_ID ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G3_CHINESE_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g3-chinese-reading-quest:v1:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G3_CHINESE_IMPORT_APPROVAL,
    stages: gradeThreeChineseQuestions
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
