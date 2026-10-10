import supplied from './synchronous-exercises.json'
import {
  G3_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeThreeChineseDefinitions,
  gradeThreeChineseBundles,
} from './index'
import {
  G3_CHINESE_SYNC_APPROVAL,
  G3_CHINESE_SYNC_IMPORTED_AT,
} from '../../production/gradeThreeChineseSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'

export const G3_PEP_CHINESE_S1_SYNC_SOURCE_ID = 'G3_PEP_CHINESE_S1_USER_SYNC_EXERCISES_V1'
export const chineseSyncSourceSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G3_CHINESE_SYNC_APPROVAL,
}
export const gradeThreeChineseSyncSource: ContentSource = {
  id: G3_PEP_CHINESE_S1_SYNC_SOURCE_ID,
  title: supplied.title,
  sourceType: 'TEXTBOOK',
  sourceRef: 'user-provided://g3-pep-chinese-upper/synchronous-exercises/2026-10-08',
  sourceVersion: 'USER_SUPPLIED_SYNC_EXERCISES_V1',
  copyrightStatus: 'PENDING',
  notes: supplied.sourceNote,
  verifiedAt: G3_CHINESE_SYNC_IMPORTED_AT,
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
  scope?: string
  adjustment?: string
}
const units: Array<{ number: number; title: string; questions: Seed[] }> = supplied.units
export const gradeThreeChineseSyncQuestions: Question[] = []
export const gradeThreeChineseSyncMappings: QuestionKnowledgePoint[] = []
export interface ChineseSyncPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
}
export const gradeThreeChineseSyncPractices: ChineseSyncPractice[] = []
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
      normalization: 'TRIM',
    })),
  }
}
for (const unit of units) {
  const d = gradeThreeChineseDefinitions.find(
    (d) => d.unit === unit.number && d.kind === 'reading',
  )!
  const ids: string[] = []
  for (const seed of unit.questions) {
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: G3_PEP_CHINESE_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_UPPER',
      subjectId: 'SUBJECT_CHINESE',
      questionType: seed.kind as Question['questionType'],
      stem: [
        {
          type: 'TEXT',
          text: `${seed.section}${seed.scope === 'SUPPLEMENTARY' ? '（拓展，非本次已导入课文）' : ''}\n${seed.stem}`,
        },
      ],
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
      sourceId: G3_PEP_CHINESE_S1_SYNC_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 120 : 60,
      tags: ['g3-chinese-upper-sync-v1', 'unit-sync-only', `unit-${unit.number}`, seed.section],
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
                  ? '先表达自己的意思，再检查内容是否清楚；不需要和示例完全一样。'
                  : '结合拼音、词语或课文作答；填空按空格顺序填写，不需要抄写整个题干。',
            },
          ],
        },
      ],
      explanation: {
        summary: [
          {
            type: 'TEXT',
            text: `${seed.explanation ?? (seed.kind === 'shortAnswer' ? '本题可有不同合理表达，请对照参考答案；不自动判分。' : '检查拼音、字词或课文内容。')}\n参考答案：${seed.reference}${seed.adjustment ? `\n题目校正：${seed.adjustment}` : ''}`,
          },
        ],
        steps: [],
      },
      media: [],
      questionVersion: 1,
      ...reviewed,
    }
    gradeThreeChineseSyncQuestions.push(question)
    gradeThreeChineseSyncMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: seed.number + 3,
      isPrimary: true,
      sourceId: G3_PEP_CHINESE_S1_SYNC_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const manualCount = unit.questions.filter((q) => q.kind === 'shortAnswer').length
  gradeThreeChineseSyncPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: unit.title,
    textbookId: G3_PEP_CHINESE_S1_TEXTBOOK_ID,
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
    sourceId: G3_PEP_CHINESE_S1_SYNC_SOURCE_ID,
    ...reviewed,
  })
}
export const gradeThreeChineseSyncBundles = gradeThreeChineseBundles.map((bundle) => ({
  ...bundle,
  practiceSets: gradeThreeChineseSyncPractices.filter(
    (p) => p.knowledgePointId === bundle.knowledgePointId,
  ),
}))
/** Resolve fixed IDs from trusted curriculum, never from route-provided question arrays. */
export function chineseSyncPracticeFor(
  context: Pick<
    AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  > | null,
  practiceSetId?: string,
): ChineseSyncPractice | null {
  if (!context) return null
  return (
    gradeThreeChineseSyncPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}

/** A unit set is visible on every valid lesson in that unit; it launches its canonical context. */
export function chineseSyncPracticeForLesson(
  context: Pick<
    AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  > | null,
): ChineseSyncPractice | null {
  if (!context || context.textbookId !== G3_PEP_CHINESE_S1_TEXTBOOK_ID) return null
  const lesson = gradeThreeChineseDefinitions.find(
    (d) =>
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return lesson
    ? (gradeThreeChineseSyncPractices.find((p) => p.unitId === lesson.unitId) ?? null)
    : null
}
