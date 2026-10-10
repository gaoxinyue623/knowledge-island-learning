import {
  G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  G4_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
  gradeFourEnglishUpperDefinitions,
  gradeFourEnglishUpperQuestions,
} from '@/data/curriculum/grade-4/english-shanghai-upper-2022'
import { G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL } from '@/data/curriculum/production/gradeFourEnglishUpperApproval'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

export function createGradeFourEnglishUpperQuest(
  bundle: ContentExpansionBundle,
): ReadingQuest | null {
  const d = gradeFourEnglishUpperDefinitions.find(
    (d) => d.knowledgePointId === bundle.knowledgePointId,
  )
  if (
    !d ||
    d.kind !== 'unit' ||
    bundle.learningContent.currentVersion !== 1 ||
    bundle.textbookId !== G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID ||
    bundle.unitId !== d.unitId ||
    bundle.lessonId !== d.lessonId ||
    bundle.learningContent.sourceId !== G4_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID ||
    bundle.learningContent.isSample ||
    ('needsVerification' in bundle.learningContent &&
      bundle.learningContent.needsVerification === true) ||
    bundle.learningContent.verificationStatus !== 'REVIEWED' ||
    bundle.learningContent.contentStatus !== 'PUBLISHED' ||
    !('releaseApprovalId' in bundle.learningContent) ||
    bundle.learningContent.releaseApprovalId !== G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL
  )
    return null
  const quest: ReadingQuest & { releaseApprovalId: string } = {
    id: `g4-shanghai-english-upper-quest:v1:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G4_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
    subject: 'ENGLISH',
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
    stages: gradeFourEnglishUpperQuestions
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
