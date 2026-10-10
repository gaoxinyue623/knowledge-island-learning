import supplied from './papers.json'
import {
  G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  gradeThreeEnglishLowerDefinitions,
  gradeThreeEnglishLowerBundles,
} from '..'
import {
  G3_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
  G3_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT,
} from '../../../production/gradeThreeEnglishLowerApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'
export const gradeThreeEnglishLowerUnitTestSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G3_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
}
export const gradeThreeEnglishLowerUnitTestSources: ContentSource[] = [
  {
    id: 'G3_SHANGHAI_ENGLISH_S2_USER_UNIT_TESTS_V1',
    title: '沪教牛津三年级下册英语配套练习（用户提供）',
    sourceType: 'TEXTBOOK',
    sourceRef: 'user-provided://shanghai-english-g3/lower-2022/unit-tests/2026-10-09',
    sourceVersion: `SHA256:${supplied.sourceSha256}`,
    copyrightStatus: 'PENDING',
    notes: supplied.sourceNote,
    verifiedAt: G3_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT,
    ...reviewed,
  },
]
interface Seed {
  number: number
  stem: string
  kind: string
  reference: string
  adjustment: string
  answers?: string[][]
  correctValue?: boolean
  options?: string[]
  correctIndex?: number
  value?: number
}
const papers: Array<{
  topicKey: string
  title: string
  sourceText: string
  questions: Seed[]
}> = supplied.papers
export interface GradeThreeEnglishLowerUnitTestPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
  notice: string
}
export const gradeThreeEnglishLowerUnitTestQuestions: Question[] = []
export const gradeThreeEnglishLowerUnitTestMappings: QuestionKnowledgePoint[] = []
export const gradeThreeEnglishLowerUnitTestPractices: GradeThreeEnglishLowerUnitTestPractice[] = []
function rule(seed: Seed): Question['answerRule'] {
  if (seed.kind === 'singleChoice')
    return {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: String.fromCharCode(65 + seed.correctIndex!),
    }
  if (seed.kind === 'shortAnswer') return { ruleType: 'MANUAL_REVIEW' }
  if (seed.kind === 'trueFalse') return { ruleType: 'BOOLEAN', correctValue: seed.correctValue! }
  if (seed.kind === 'calculation') return { ruleType: 'NUMERIC', value: seed.value! }
  return {
    ruleType: 'TEXT_BLANKS',
    blanks: seed.answers!.map((answers, i) => ({
      blankId: `blank-${i + 1}`,
      acceptedAnswers: [...answers],
      normalization: answers.some((a) => /[a-z]/i.test(a)) ? 'ENGLISH_TEXT' : 'TRIM',
    })),
  }
}
for (const paper of papers) {
  const definitions = gradeThreeEnglishLowerDefinitions
  const d = definitions.find((d) => String(d.number) === paper.topicKey)
  if (!d) throw new Error(`Missing mathematics unit test anchor: ${paper.topicKey}`)
  const textbookId = G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID
  const sourceId = gradeThreeEnglishLowerUnitTestSources[0]!.id
  const ids: string[] = []
  for (const seed of paper.questions) {
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: textbookId,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_LOWER',
      subjectId: 'SUBJECT_ENGLISH',
      questionType: seed.kind as Question['questionType'],
      stem: [{ type: 'TEXT', text: seed.stem }],
      answerRule: rule(seed),
      ...(seed.options
        ? {
            options: seed.options.map((text, i) => ({
              id: `${id}:option:${i}`,
              questionId: id,
              optionKey: String.fromCharCode(65 + i),
              sortOrder: i,
              content: [{ type: 'TEXT' as const, text }],
            })),
          }
        : {}),
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 180 : 60,
      tags: ['g3-english-lower-unit-test-v1', 'unit-sync-only', paper.topicKey],
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
                  ? '先在纸上完成过程、画图或观察，再记录自己的方法；提交后核对参考答案。'
                  : '回看本单元词汇和句型，仔细阅读题干。',
            },
          ],
        },
      ],
      explanation: {
        summary: [
          {
            type: 'TEXT',
            text: `${seed.kind === 'shortAnswer' ? '本题由老师或家长核对过程，不自动判分。' : '根据题干核对词义和句型。'}\n参考答案：${seed.reference}${seed.adjustment ? `\n题目整理说明：${seed.adjustment}` : ''}`,
          },
        ],
        steps: [],
      },
      media: [],
      questionVersion: 1,
      ...reviewed,
    }
    gradeThreeEnglishLowerUnitTestQuestions.push(question)
    gradeThreeEnglishLowerUnitTestMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: seed.number + 3,
      isPrimary: true,
      sourceId,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const manualCount = paper.questions.filter((q) => q.kind === 'shortAnswer').length
  gradeThreeEnglishLowerUnitTestPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: `三年级下册·${paper.title}`,
    textbookId,
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
    notice: supplied.notice,
    sourceId,
    ...reviewed,
  })
}
export const gradeThreeEnglishLowerUnitTestBundles = gradeThreeEnglishLowerBundles.map(
  (bundle) => ({
    ...bundle,
    practiceSets: [
      ...bundle.practiceSets,
      ...gradeThreeEnglishLowerUnitTestPractices.filter(
        (p) => p.knowledgePointId === bundle.knowledgePointId,
      ),
    ],
  }),
)
type Context = Pick<
  AssessmentLaunchContext,
  'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
> | null
export function gradeThreeEnglishLowerUnitTestPracticeFor(
  context: Context,
  practiceSetId?: string,
): GradeThreeEnglishLowerUnitTestPractice | null {
  if (!context) return null
  return (
    gradeThreeEnglishLowerUnitTestPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}
export function gradeThreeEnglishLowerUnitTestPracticeForLesson(
  context: Context,
): GradeThreeEnglishLowerUnitTestPractice | null {
  if (!context) return null
  const d = gradeThreeEnglishLowerDefinitions.find(
    (d) =>
      G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID === context.textbookId &&
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return d
    ? (gradeThreeEnglishLowerUnitTestPractices.find(
        (p) => p.textbookId === G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID && p.unitId === d.unitId,
      ) ?? null)
    : null
}
