import supplied from './synchronous-exercises.json'
import {
  G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
  shenzhenEnglishLowerDefinitions,
  shenzhenEnglishLowerBundles,
} from './index'
import {
  SHENZHEN_ENGLISH_SYNC_APPROVAL,
  SHENZHEN_ENGLISH_SYNC_IMPORTED_AT,
} from '../../production/shenzhenEnglishSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'

export const G2_SHENZHEN_ENGLISH_S2_SYNC_SOURCE_ID = 'G2_SHENZHEN_ENGLISH_S2_USER_SYNC_EXERCISES_V1'
export const englishSyncSourceSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: SHENZHEN_ENGLISH_SYNC_APPROVAL,
}
export const shenzhenEnglishSyncSource: ContentSource = {
  id: G2_SHENZHEN_ENGLISH_S2_SYNC_SOURCE_ID,
  title: supplied.title,
  sourceType: 'TEXTBOOK',
  sourceRef: 'user-provided://g2-shenzhen-english-lower/synchronous-exercises/2026-10-08',
  sourceVersion: 'USER_SUPPLIED_SYNC_EXERCISES_V1',
  copyrightStatus: 'PENDING',
  notes: supplied.sourceNote,
  verifiedAt: SHENZHEN_ENGLISH_SYNC_IMPORTED_AT,
  ...reviewed,
}
interface Seed {
  number: number
  section: string
  stem: string
  kind: string
  reference: string
  options?: string[]
  correctOptionKey?: string
  correctValue?: boolean
  answers?: string[][]
  explanation?: string
}
const units: Array<{ number: number; title: string; questions: Seed[] }> = supplied.units
export const shenzhenEnglishSyncQuestions: Question[] = []
export const shenzhenEnglishSyncMappings: QuestionKnowledgePoint[] = []
export interface EnglishSyncPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
}
export const shenzhenEnglishSyncPractices: EnglishSyncPractice[] = []
function answerRule(seed: Seed): Question['answerRule'] {
  if (seed.kind === 'singleChoice')
    return { ruleType: 'SINGLE_OPTION', correctOptionKey: seed.correctOptionKey! }
  if (seed.kind === 'trueFalse') return { ruleType: 'BOOLEAN', correctValue: seed.correctValue! }
  if (seed.kind === 'shortAnswer')
    return {
      ruleType: 'MANUAL_REVIEW',
    }
  return {
    ruleType: 'TEXT_BLANKS',
    blanks: seed.answers!.map((answers, index) => ({
      blankId: `blank-${index + 1}`,
      acceptedAnswers: [...answers],
      normalization: /^[A-Za-z]/.test(answers[0]!) ? 'ENGLISH_TEXT' : 'TRIM',
    })),
  }
}
for (const unit of units) {
  const d = shenzhenEnglishLowerDefinitions.find((d) => d.number === unit.number)!
  const ids: string[] = []
  for (const seed of unit.questions) {
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_2',
      semesterId: 'SEMESTER_LOWER',
      subjectId: 'SUBJECT_ENGLISH',
      questionType: seed.kind as Question['questionType'],
      stem: [{ type: 'TEXT', text: `${seed.section}\n${seed.stem}` }],
      answerRule: answerRule(seed),
      ...(seed.kind === 'singleChoice'
        ? {
            options: seed.options!.map((label, order) => ({
              id: `${id}:option:${order}`,
              questionId: id,
              optionKey: String.fromCharCode(65 + order),
              content: [{ type: 'TEXT' as const, text: label }],
              sortOrder: order,
            })),
          }
        : {}),
      difficulty: 'FOUNDATION',
      contentType: 'EXTENSION',
      sourceId: G2_SHENZHEN_ENGLISH_S2_SYNC_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 120 : 60,
      tags: ['shenzhen-english-lower-sync-v1', `unit-${unit.number}`, seed.section],
      hints: [
        {
          id: `${id}:hint`,
          order: 1,
          trigger: 'ON_REQUEST',
          content: [
            {
              type: 'TEXT',
              text:
                seed.kind === 'shortAnswer'
                  ? '先表达自己的意思，再检查句型；不需要和示例完全一样。'
                  : '回想本单元词汇或句型；填空按空格顺序填写，不需要抄写整个题干。',
            },
          ],
        },
      ],
      explanation: {
        summary: [
          {
            type: 'TEXT',
            text: `${seed.explanation ?? '对照本单元词汇检查答案。'}\n参考答案：${seed.reference}`,
          },
        ],
        steps: [],
      },
      media: [],
      questionVersion: 1,
      ...reviewed,
    }
    shenzhenEnglishSyncQuestions.push(question)
    shenzhenEnglishSyncMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: seed.number + 3,
      isPrimary: true,
      sourceId: G2_SHENZHEN_ENGLISH_S2_SYNC_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const manualCount = unit.questions.filter((q) => q.kind === 'shortAnswer').length
  shenzhenEnglishSyncPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: unit.title,
    textbookId: G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    mode: 'basic',
    templateIds: [],
    fixedQuestionIds: ids,
    targetCount: ids.length,
    difficultyRange: { min: 'L1', max: 'L2' },
    autoCount: ids.length - manualCount,
    manualCount,
    sourceId: G2_SHENZHEN_ENGLISH_S2_SYNC_SOURCE_ID,
    ...reviewed,
  })
}
export const shenzhenEnglishLowerSyncBundles = shenzhenEnglishLowerBundles.map((bundle) => ({
  ...bundle,
  practiceSets: shenzhenEnglishSyncPractices.filter(
    (p) => p.knowledgePointId === bundle.knowledgePointId,
  ),
}))
/** Resolve fixed IDs from trusted curriculum, never from route-provided question arrays. */
export function englishSyncPracticeFor(
  context: Pick<
    AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  > | null,
  practiceSetId?: string,
): EnglishSyncPractice | null {
  if (!context) return null
  return (
    shenzhenEnglishSyncPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}
