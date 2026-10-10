import supplied from './papers.json'
import { coordinateIllustrationAsset } from './coordinate-illustration'
import { countFiguresMediaAssets } from '../count-figures-media'
import { G4_BNU_MATH_S1_TEXTBOOK_ID, gradeFourBnuMathLessons, gradeFourBnuMathBundles } from '..'
import {
  G4_BNU_MATH_SYNC_APPROVAL,
  G4_BNU_MATH_SYNC_IMPORTED_AT,
} from '../../../production/gradeFourBnuMathSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'
export const gradeFourBnuUnitTestSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G4_BNU_MATH_SYNC_APPROVAL,
}
export const gradeFourBnuUnitTestSources: ContentSource[] = [
  {
    id: 'G4_BNU_MATH_S1_2022_USER_UNIT_TESTS_V1',
    title: '北师大四年级上册数学单元自测（用户提供）',
    sourceType: 'TEXTBOOK',
    sourceRef: 'user-provided://bnu-math-g4/upper/unit-tests/2026-10-09',
    sourceVersion: `SHA256:${supplied.sourceSha256}`,
    copyrightStatus: 'PENDING',
    notes: supplied.sourceNote,
    verifiedAt: G4_BNU_MATH_SYNC_IMPORTED_AT,
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
export interface GradeFourBnuUnitTestPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
  notice: string
}
export const gradeFourBnuUnitTestQuestions: Question[] = []
export const gradeFourBnuUnitTestMappings: QuestionKnowledgePoint[] = []
export const gradeFourBnuUnitTestPractices: GradeFourBnuUnitTestPractice[] = []
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
  const definitions = gradeFourBnuMathLessons
  const d = definitions.find((d) => d.topicKey === paper.topicKey)
  if (!d) throw new Error(`Missing mathematics unit test anchor: ${paper.topicKey}`)
  const textbookId = G4_BNU_MATH_S1_TEXTBOOK_ID
  const sourceId = gradeFourBnuUnitTestSources[0]!.id
  const ids: string[] = []
  for (const seed of paper.questions) {
    const hasCoordinateIllustration = paper.topicKey === 'coordinate' && seed.number === 7
    const adjustment = hasCoordinateIllustration
      ? '根据原题文字条件生成配套示意图，明确列号向右、行号向上递增，并保留列、行两空。'
      : seed.adjustment
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: textbookId,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_4',
      semesterId: 'SEMESTER_UPPER',
      subjectId: 'SUBJECT_MATH',
      questionType: seed.kind as Question['questionType'],
      stem: [
        {
          type: 'TEXT',
          text:
            paper.topicKey === 'count-figures' && seed.number === 1
              ? `观察鼹鼠钻洞图下方的A、B、C、D四点示意。${seed.stem}`
              : hasCoordinateIllustration
                ? `看图回答，图中行号从下向上递增。${seed.stem}`
                : seed.stem,
        },
      ],
      answerRule: rule(seed),
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 180 : 60,
      tags: ['g4-bnu-unit-test-v1', 'unit-sync-only', paper.topicKey],
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
            text: `${seed.kind === 'shortAnswer' ? '本题由老师或家长核对过程，不自动判分。' : '请检查答案是否符合条件。数值应用题仅核对最终数值，列式过程另行核对。'}\n参考答案：${seed.reference}${adjustment ? `\n题目整理说明：${adjustment}` : ''}`,
          },
        ],
        steps: [],
      },
      media:
        paper.topicKey === 'count-figures' && seed.number === 1
          ? [{ mediaAssetId: countFiguresMediaAssets[0]!.id, usageType: 'STEM', order: 1 }]
          : hasCoordinateIllustration
            ? [{ mediaAssetId: coordinateIllustrationAsset.id, usageType: 'STEM', order: 1 }]
            : [],
      questionVersion: hasCoordinateIllustration ? 2 : 1,
      ...reviewed,
    }
    gradeFourBnuUnitTestQuestions.push(question)
    gradeFourBnuUnitTestMappings.push({
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
  gradeFourBnuUnitTestPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: `四年级上册·${paper.title}`,
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
export const gradeFourBnuUnitTestBundles = gradeFourBnuMathBundles.map((bundle) => ({
  ...bundle,
  practiceSets: [
    ...bundle.practiceSets,
    ...gradeFourBnuUnitTestPractices.filter((p) => p.knowledgePointId === bundle.knowledgePointId),
  ],
}))
type Context = Pick<
  AssessmentLaunchContext,
  'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
> | null
export function gradeFourBnuUnitTestPracticeFor(
  context: Context,
  practiceSetId?: string,
): GradeFourBnuUnitTestPractice | null {
  if (!context) return null
  return (
    gradeFourBnuUnitTestPractices.find(
      (p) =>
        (practiceSetId === undefined || p.id === practiceSetId) &&
        p.textbookId === context.textbookId &&
        p.unitId === context.unitId &&
        p.lessonId === context.lessonId &&
        p.knowledgePointId === context.knowledgePointId,
    ) ?? null
  )
}
export function gradeFourBnuUnitTestPracticeForLesson(
  context: Context,
): GradeFourBnuUnitTestPractice | null {
  if (!context) return null
  const d = gradeFourBnuMathLessons.find(
    (d) =>
      d.textbookId === context.textbookId &&
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return d
    ? (gradeFourBnuUnitTestPractices.find(
        (p) => p.textbookId === d.textbookId && p.unitId === d.unitId,
      ) ?? null)
    : null
}
