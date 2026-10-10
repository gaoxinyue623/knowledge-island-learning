import supplied from './papers.json'
import { G6_BNU_MATH_S1_TEXTBOOK_ID, gradeSixBnuMathLessons, gradeSixBnuMathBundles } from '..'
import {
  G6_BNU_MATH_SYNC_APPROVAL,
  G6_BNU_MATH_SYNC_IMPORTED_AT,
} from '../../../production/gradeSixBnuMathSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'
export const gradeSixBnuUnitTestSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G6_BNU_MATH_SYNC_APPROVAL,
}
export const gradeSixBnuUnitTestSources: ContentSource[] = [
  {
    id: 'G6_BNU_MATH_S1_2022_USER_UNIT_TESTS_V1',
    title: '北师大六年级上册数学单元自测（用户提供）',
    sourceType: 'TEXTBOOK',
    sourceRef: 'user-provided://bnu-math-g6/upper-2022/unit-tests/2026-10-09',
    sourceVersion: `SHA256:${supplied.sourceSha256}`,
    copyrightStatus: 'PENDING',
    notes: supplied.sourceNote,
    verifiedAt: G6_BNU_MATH_SYNC_IMPORTED_AT,
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
  value?: number
}
const papers: Array<{
  topicKey: string
  title: string
  sourceText: string
  questions: Seed[]
}> = supplied.papers
export interface GradeSixBnuUnitTestPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
  notice: string
}
export const gradeSixBnuUnitTestQuestions: Question[] = []
export const gradeSixBnuUnitTestMappings: QuestionKnowledgePoint[] = []
export const gradeSixBnuUnitTestPractices: GradeSixBnuUnitTestPractice[] = []
function rule(seed: Seed): Question['answerRule'] {
  if (seed.kind === 'shortAnswer') return { ruleType: 'MANUAL_REVIEW' }
  if (seed.kind === 'trueFalse') return { ruleType: 'BOOLEAN', correctValue: seed.correctValue! }
  if (seed.kind === 'calculation') return { ruleType: 'NUMERIC', value: seed.value! }
  return {
    ruleType: 'TEXT_BLANKS',
    blanks: seed.answers!.map((answers, i) => ({
      blankId: `blank-${i + 1}`,
      acceptedAnswers: [...answers],
      normalization: 'TRIM',
    })),
  }
}
for (const paper of papers) {
  const definitions = gradeSixBnuMathLessons
  const d = definitions.find((d) => d.topicKey === paper.topicKey)
  if (!d) throw new Error(`Missing mathematics unit test anchor: ${paper.topicKey}`)
  const textbookId = G6_BNU_MATH_S1_TEXTBOOK_ID
  const sourceId = gradeSixBnuUnitTestSources[0]!.id
  const ids: string[] = []
  for (const seed of paper.questions) {
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: textbookId,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      subjectId: 'SUBJECT_MATH',
      questionType: seed.kind as Question['questionType'],
      stem: [{ type: 'TEXT', text: seed.stem }],
      answerRule: rule(seed),
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 180 : 60,
      tags: ['g6-bnu-unit-test-v1', 'unit-sync-only', paper.topicKey],
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
                  : '读清条件，检查数位、运算顺序和单位。填空按顺序作答，数值题只填写数值。',
            },
          ],
        },
      ],
      explanation: {
        summary: [
          {
            type: 'TEXT',
            text: `${seed.kind === 'shortAnswer' ? '本题由老师或家长核对过程，不自动判分。' : '请检查答案是否符合条件。数值应用题仅核对最终数值，列式过程另行核对。'}\n参考答案：${seed.reference}${seed.adjustment ? `\n题目整理说明：${seed.adjustment}` : ''}`,
          },
        ],
        steps: [],
      },
      media: [],
      questionVersion: 1,
      ...reviewed,
    }
    gradeSixBnuUnitTestQuestions.push(question)
    gradeSixBnuUnitTestMappings.push({
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
  gradeSixBnuUnitTestPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: `六年级上册·${paper.title}`,
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
export const gradeSixBnuUnitTestBundles = gradeSixBnuMathBundles.map((bundle) => ({
  ...bundle,
  practiceSets: [
    ...bundle.practiceSets,
    ...gradeSixBnuUnitTestPractices.filter((p) => p.knowledgePointId === bundle.knowledgePointId),
  ],
}))
type Context = Pick<
  AssessmentLaunchContext,
  'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
> | null
export function gradeSixBnuUnitTestPracticeFor(
  context: Context,
  practiceSetId?: string,
): GradeSixBnuUnitTestPractice | null {
  if (!context) return null
  return (
    gradeSixBnuUnitTestPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}
export function gradeSixBnuUnitTestPracticeForLesson(
  context: Context,
): GradeSixBnuUnitTestPractice | null {
  if (!context) return null
  const d = gradeSixBnuMathLessons.find(
    (d) =>
      d.textbookId === context.textbookId &&
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return d
    ? (gradeSixBnuUnitTestPractices.find(
        (p) => p.textbookId === d.textbookId && p.unitId === d.unitId,
      ) ?? null)
    : null
}
