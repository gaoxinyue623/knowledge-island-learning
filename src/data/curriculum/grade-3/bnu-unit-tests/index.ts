import cuboidSupplement from './cuboid-illustration.json'
import { cuboidIllustrationAsset, cuboidIllustrationSource } from './cuboid-illustration'
import supplied from './papers.json'
import {
  G3_BNU_MATH_S1_TEXTBOOK_ID,
  gradeThreeBnuMathLessons,
  gradeThreeBnuMathBundles,
} from '../math-bnu-upper-2022'
import {
  G3_BNU_MATH_S2_TEXTBOOK_ID,
  gradeThreeBnuMathLowerLessons,
  gradeThreeBnuMathLowerBundles,
} from '../math-bnu-lower-2022'
import {
  G3_BNU_MATH_SYNC_APPROVAL,
  G3_BNU_MATH_SYNC_IMPORTED_AT,
} from '../../production/gradeThreeBnuMathSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'
export const bnuUnitTestSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G3_BNU_MATH_SYNC_APPROVAL,
}
export const bnuUnitTestSources: ContentSource[] = (['UPPER', 'LOWER'] as const).map(
  (semester) => ({
    id: `G3_BNU_MATH_S${semester === 'UPPER' ? 1 : 2}_2022_USER_UNIT_TESTS_V1`,
    title: `北师大三年级${semester === 'UPPER' ? '上' : '下'}册数学单元自测（用户提供）`,
    sourceType: 'TEXTBOOK',
    sourceRef: `user-provided://bnu-math-g3/${semester.toLowerCase()}/unit-tests/2026-10-09`,
    sourceVersion: `SHA256:${supplied.sourceSha256}`,
    copyrightStatus: 'PENDING',
    notes: supplied.sourceNote,
    verifiedAt: G3_BNU_MATH_SYNC_IMPORTED_AT,
    ...reviewed,
  }),
)
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
  semester: string
  topicKey: string
  title: string
  sourceText: string
  questions: Seed[]
}> = supplied.papers
export interface BnuUnitTestPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
  notice: string
}
export const bnuUnitTestQuestions: Question[] = []
export const bnuUnitTestMappings: QuestionKnowledgePoint[] = []
export const bnuUnitTestPractices: BnuUnitTestPractice[] = []
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
  const upper = paper.semester === 'UPPER'
  const definitions = upper ? gradeThreeBnuMathLessons : gradeThreeBnuMathLowerLessons
  const d = definitions.find((d) => d.topicKey === paper.topicKey)
  if (!d)
    throw new Error(`Missing mathematics unit test anchor: ${paper.semester}/${paper.topicKey}`)
  const textbookId = upper ? G3_BNU_MATH_S1_TEXTBOOK_ID : G3_BNU_MATH_S2_TEXTBOOK_ID
  const sourceId = bnuUnitTestSources[upper ? 0 : 1]!.id
  const ids: string[] = []
  for (const originalSeed of paper.questions) {
    const hasCuboidImage = upper && paper.topicKey === 'observe-one' && originalSeed.number === 4
    const seed = hasCuboidImage
      ? {
          ...originalSeed,
          stem: cuboidSupplement.stem,
          reference: cuboidSupplement.reference,
          adjustment: cuboidSupplement.adjustment,
        }
      : originalSeed
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: textbookId,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
      semesterId: upper ? 'SEMESTER_UPPER' : 'SEMESTER_LOWER',
      subjectId: 'SUBJECT_MATH',
      questionType: seed.kind as Question['questionType'],
      stem: [
        { type: 'TEXT', text: seed.stem },
        ...(hasCuboidImage
          ? [
              {
                type: 'IMAGE' as const,
                mediaAssetId: cuboidIllustrationAsset.id,
                altText: cuboidIllustrationAsset.altText ?? undefined,
              },
            ]
          : []),
      ],
      answerRule: rule(seed),
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId: hasCuboidImage ? cuboidIllustrationSource.id : sourceId,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 180 : 60,
      tags: ['g3-bnu-unit-test-v1', 'unit-sync-only', paper.topicKey],
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
      media: hasCuboidImage
        ? [{ mediaAssetId: cuboidIllustrationAsset.id, usageType: 'STEM', order: 1 }]
        : [],
      questionVersion: hasCuboidImage ? 2 : 1,
      ...reviewed,
    }
    bnuUnitTestQuestions.push(question)
    bnuUnitTestMappings.push({
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
  bnuUnitTestPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: `${upper ? '上册' : '下册'}·${paper.title}`,
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
export const bnuUnitTestBundles = [
  ...gradeThreeBnuMathBundles,
  ...gradeThreeBnuMathLowerBundles,
].map((bundle) => ({
  ...bundle,
  practiceSets: [
    ...bundle.practiceSets,
    ...bnuUnitTestPractices.filter((p) => p.knowledgePointId === bundle.knowledgePointId),
  ],
}))
type Context = Pick<
  AssessmentLaunchContext,
  'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
> | null
export function bnuUnitTestPracticeFor(
  context: Context,
  practiceSetId?: string,
): BnuUnitTestPractice | null {
  if (!context) return null
  return (
    bnuUnitTestPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}
export function bnuUnitTestPracticeForLesson(context: Context): BnuUnitTestPractice | null {
  if (!context) return null
  const d = [...gradeThreeBnuMathLessons, ...gradeThreeBnuMathLowerLessons].find(
    (d) =>
      d.textbookId === context.textbookId &&
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return d
    ? (bnuUnitTestPractices.find((p) => p.textbookId === d.textbookId && p.unitId === d.unitId) ??
        null)
    : null
}
