import {
  G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
  G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
  shenzhenEnglishLowerDefinitions,
  shenzhenEnglishLowerQuestions,
} from '@/data/curriculum/grade-2/shenzhen-english-lower'
import { SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL } from '@/data/curriculum/production/shenzhenEnglishLowerApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createShenzhenEnglishLowerQuest(
  bundle: ContentExpansionBundle,
): ReadingQuest | null {
  const d = shenzhenEnglishLowerDefinitions.find(
    (d) => d.knowledgePointId === bundle.knowledgePointId,
  )
  if (
    !d ||
    bundle.textbookId !== G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `shenzhen-english-lower-quest:v1:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
    subject: 'ENGLISH',
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL,
    stages: shenzhenEnglishLowerQuestions
      .filter((q) => q.knowledgePointId === d.knowledgePointId)
      .map((q, index) => ({
        id: q.id,
        kind: 'question',
        title: ['词义认读', '对话交流', '故事理解'][index]!,
        question: structuredClone(q),
        explanation: q.explanation.summary.map((b) => b.text).join('\n'),
        hint: '回看本课词汇、对话或故事。',
        hints: ['回看本课词汇、对话或故事。', '找出与选项对应的原句，排除不符合原文的答案。'],
      })),
  }
  return quest
}
