import supplied from './synchronous-exercises.json'
import {
  pictureWritingMediaAssets,
  pictureWritingPrompt,
  pictureWritingSourceId,
} from './pictureWriting'
import {
  G3_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeThreeChineseLowerDefinitions,
  gradeThreeChineseLowerBundles,
} from './index'
import {
  G3_CHINESE_LOWER_SYNC_APPROVAL,
  G3_CHINESE_LOWER_SYNC_IMPORTED_AT,
} from '../../production/gradeThreeChineseLowerSyncApproval'
import type {
  ContentSource,
  Question,
  QuestionKnowledgePoint,
  PracticeSet,
  AssessmentLaunchContext,
} from '@/types'

export const G3_PEP_CHINESE_S2_SYNC_SOURCE_ID = 'G3_PEP_CHINESE_S2_USER_SYNC_EXERCISES_V1'
export const chineseLowerSyncSourceSheet = supplied
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G3_CHINESE_LOWER_SYNC_APPROVAL,
}
export const gradeThreeChineseLowerSyncSource: ContentSource = {
  id: G3_PEP_CHINESE_S2_SYNC_SOURCE_ID,
  title: supplied.title,
  sourceType: 'TEXTBOOK',
  sourceRef: 'user-provided://g3-pep-chinese-lower/synchronous-exercises/2026-10-08',
  sourceVersion: `SHA256:${supplied.sourceSha256}`,
  copyrightStatus: 'PENDING',
  notes: supplied.sourceNote,
  verifiedAt: G3_CHINESE_LOWER_SYNC_IMPORTED_AT,
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
export const gradeThreeChineseLowerSyncQuestions: Question[] = []
export const gradeThreeChineseLowerSyncMappings: QuestionKnowledgePoint[] = []
export interface ChineseLowerSyncPractice extends PracticeSet {
  textbookId: string
  unitId: string
  lessonId: string
  autoCount: number
  manualCount: number
}
export const gradeThreeChineseLowerSyncPractices: ChineseLowerSyncPractice[] = []
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
  const d = gradeThreeChineseLowerDefinitions.find(
    (d) => d.unit === unit.number && d.kind === 'reading',
  )!
  const ids: string[] = []
  for (const seed of unit.questions) {
    const isPictureWriting = unit.number === 2 && seed.number === 28
    const id = `${d.knowledgePointId}_SYNC_V1_${String(seed.number).padStart(2, '0')}`
    ids.push(id)
    const question: Question = {
      id,
      textbookVersionId: G3_PEP_CHINESE_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_LOWER',
      subjectId: 'SUBJECT_CHINESE',
      questionType: seed.kind as Question['questionType'],
      stem: [
        {
          type: 'TEXT',
          text: isPictureWriting
            ? `${seed.section}\n看图写故事：任选下面一组四格图，写清人物、事情经过和结果，再想象接下来发生的事。\n原附件未提供图片，本次使用AI生成练习素材。`
            : `${seed.section}${seed.scope === 'SUPPLEMENTARY' ? '（拓展，非本次已导入课文）' : ''}\n${seed.stem}`,
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
      sourceId: isPictureWriting ? pictureWritingSourceId : G3_PEP_CHINESE_S2_SYNC_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: seed.kind === 'shortAnswer' ? 120 : 60,
      tags: ['g3-chinese-lower-sync-v1', 'unit-sync-only', `unit-${unit.number}`, seed.section],
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
            text: isPictureWriting
              ? '项目写作提示：按照四格顺序把故事写连贯，可以写动作、表情和对话，并续写后续情节。小猴子的故事可围绕专心，小熊的故事可围绕帮助，小松鼠的故事可围绕坚持与合作，小狗的故事可围绕学习与进步展开。合理的其他写法也可以，没有唯一答案，不自动判分。\n原题档案：原附件未提供配图及本题参考答案；本次配图按用户主题生成。'
              : `${seed.explanation ?? (seed.kind === 'shortAnswer' ? '本题可有不同合理表达，请对照参考答案；不自动判分。' : '检查拼音、字词或课文内容。')}\n参考答案：${seed.reference}${seed.adjustment ? `\n题目校正：${seed.adjustment}` : ''}`,
          },
        ],
        steps: [],
      },
      media: isPictureWriting
        ? pictureWritingMediaAssets.map((asset, index) => ({
            mediaAssetId: asset.id,
            usageType: 'STEM',
            order: index + 1,
          }))
        : [],
      ...(isPictureWriting ? { pictureWriting: pictureWritingPrompt } : {}),
      questionVersion: isPictureWriting ? 2 : 1,
      ...reviewed,
    }
    gradeThreeChineseLowerSyncQuestions.push(question)
    gradeThreeChineseLowerSyncMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: seed.number + 3,
      isPrimary: true,
      sourceId: G3_PEP_CHINESE_S2_SYNC_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const manualCount = unit.questions.filter((q) => q.kind === 'shortAnswer').length
  gradeThreeChineseLowerSyncPractices.push({
    id: `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
    title: unit.title,
    textbookId: G3_PEP_CHINESE_S2_TEXTBOOK_ID,
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
    sourceId: G3_PEP_CHINESE_S2_SYNC_SOURCE_ID,
    ...reviewed,
  })
}
export const gradeThreeChineseLowerSyncBundles = gradeThreeChineseLowerBundles.map((bundle) => ({
  ...bundle,
  practiceSets: gradeThreeChineseLowerSyncPractices.filter(
    (p) => p.knowledgePointId === bundle.knowledgePointId,
  ),
}))
/** Resolve fixed IDs from trusted curriculum, never from route-provided question arrays. */
export function chineseLowerSyncPracticeFor(
  context: Pick<
    AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  > | null,
  practiceSetId?: string,
): ChineseLowerSyncPractice | null {
  if (!context) return null
  return (
    gradeThreeChineseLowerSyncPractices.find(
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
export function chineseLowerSyncPracticeForLesson(
  context: Pick<
    AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  > | null,
): ChineseLowerSyncPractice | null {
  if (!context || context.textbookId !== G3_PEP_CHINESE_S2_TEXTBOOK_ID) return null
  const lesson = gradeThreeChineseLowerDefinitions.find(
    (d) =>
      d.kind !== 'appendix' &&
      d.unitId === context.unitId &&
      d.lessonId === context.lessonId &&
      d.knowledgePointId === context.knowledgePointId,
  )
  return lesson
    ? (gradeThreeChineseLowerSyncPractices.find((p) => p.unitId === lesson.unitId) ?? null)
    : null
}
