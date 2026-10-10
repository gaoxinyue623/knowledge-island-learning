import supplied from './papers.json'
import {
  G4_BNU_MATH_S2_TEXTBOOK_ID,
  gradeFourBnuMathLowerLessons,
  gradeFourBnuMathLowerBundles,
} from '..'
import {
  G4_BNU_MATH_LOWER_SYNC_APPROVAL,
  G4_BNU_MATH_LOWER_SYNC_IMPORTED_AT,
} from '../../../production/gradeFourBnuMathLowerSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'
export const gradeFourBnuLowerUnitTestSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G4_BNU_MATH_LOWER_SYNC_APPROVAL,
}
export const gradeFourBnuLowerUnitTestSources: ContentSource[] = [
  {
    id: 'G4_BNU_MATH_S2_USER_UNIT_TESTS_V1',
    title: '北师大四年级下册数学单元自测（用户提供）',
    sourceType: 'TEXTBOOK',
    sourceRef: 'user-provided://bnu-math-g4/lower/unit-tests/2026-10-09',
    sourceVersion: `SHA256:${supplied.sourceSha256}`,
    copyrightStatus: 'PENDING',
    notes: supplied.sourceNote,
    verifiedAt: G4_BNU_MATH_LOWER_SYNC_IMPORTED_AT,
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
export interface GradeFourBnuLowerUnitTestPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
  notice: string
}
export const gradeFourBnuLowerUnitTestQuestions: Question[] = []
export const gradeFourBnuLowerUnitTestMappings: QuestionKnowledgePoint[] = []
export const gradeFourBnuLowerUnitTestPractices: GradeFourBnuLowerUnitTestPractice[] = []
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
  const definitions = gradeFourBnuMathLowerLessons
  const d = definitions.find((d) => d.topicKey === paper.topicKey)
  if (!d) throw new Error(`Missing mathematics unit test anchor: ${paper.topicKey}`)
  const textbookId = G4_BNU_MATH_S2_TEXTBOOK_ID
  const sourceId = gradeFourBnuLowerUnitTestSources[0]!.id
  const ids: string[] = []
  for (const seed of paper.questions) {
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: textbookId,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_4',
      semesterId: 'SEMESTER_LOWER',
      subjectId: 'SUBJECT_MATH',
      questionType: seed.kind as Question['questionType'],
      stem: [{ type: 'TEXT', text: seed.stem }],
      answerRule: rule(seed),
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 180 : 60,
      tags: ['g4-bnu-lower-unit-test-v1', 'unit-sync-only', paper.topicKey],
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
    gradeFourBnuLowerUnitTestQuestions.push(question)
    gradeFourBnuLowerUnitTestMappings.push({
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
  gradeFourBnuLowerUnitTestPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: `四年级下册·${paper.title}`,
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
export const gradeFourBnuLowerUnitTestBundles = gradeFourBnuMathLowerBundles.map((bundle) => ({
  ...bundle,
  practiceSets: [
    ...bundle.practiceSets,
    ...gradeFourBnuLowerUnitTestPractices.filter(
      (p) => p.knowledgePointId === bundle.knowledgePointId,
    ),
  ],
}))
type Context = Pick<
  AssessmentLaunchContext,
  'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
> | null
export function gradeFourBnuLowerUnitTestPracticeFor(
  context: Context,
  practiceSetId?: string,
): GradeFourBnuLowerUnitTestPractice | null {
  if (!context) return null
  return (
    gradeFourBnuLowerUnitTestPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}
export function gradeFourBnuLowerUnitTestPracticeForLesson(
  context: Context,
): GradeFourBnuLowerUnitTestPractice | null {
  if (!context) return null
  const d = gradeFourBnuMathLowerLessons.find(
    (d) =>
      d.textbookId === context.textbookId &&
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return d
    ? (gradeFourBnuLowerUnitTestPractices.find(
        (p) => p.textbookId === d.textbookId && p.unitId === d.unitId,
      ) ?? null)
    : null
}
