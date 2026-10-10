import {
  G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
  gradeSixEnglishUpperDefinitions,
  gradeSixEnglishUpperQuestions,
} from '@/data/curriculum/grade-6/english-shanghai-upper-2022'
import { G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeSixEnglishUpperApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeSixEnglishUpperQuest(
  bundle: ContentExpansionBundle,
): ReadingQuest | null {
  const d = gradeSixEnglishUpperDefinitions.find(
    (d) => d.knowledgePointId === bundle.knowledgePointId,
  )
  if (
    !d ||
    d.kind !== 'unit' ||
    bundle.learningContent.currentVersion !== 1 ||
    bundle.textbookId !== G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g6-shanghai-english-upper-quest:v1:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
    subject: 'ENGLISH',
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
    stages: gradeSixEnglishUpperQuestions
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
