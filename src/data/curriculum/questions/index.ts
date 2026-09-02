import type { ContentBlock, QuestionKnowledgePoint, QuestionOption, QuestionType } from '@/types'

import type { SampleQuestion, SampleRecord } from '../types'

const sampleStem: ContentBlock[] = [
  {
    type: 'TEXT',
    text: '示例题干，仅用于验证题目结构。',
  },
]

const baseQuestion = (
  id: string,
  questionType: QuestionType,
  knowledgePointId: string,
): Omit<
  SampleQuestion,
  'answerRule' | 'options' | 'draggableItems' | 'targets' | 'subQuestionIds'
> => ({
  id,
  questionType,
  stem: sampleStem,
  knowledgePointId,
  difficulty: 'FOUNDATION',
  contentType: 'EXTENSION',
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  status: 'DRAFT',
  needsVerification: true,
  estimatedSeconds: 30,
  tags: ['sample'],
  media: [],
  gradeId: 'SAMPLE_GRADE_3',
  semesterId: 'SAMPLE_SEMESTER_UPPER',
  subjectId: 'SAMPLE_SUBJECT_MATH',
  textbookVersionId: 'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A',
  hints: [
    {
      id: `${id}_HINT_01`,
      order: 1,
      trigger: 'ON_REQUEST',
      content: [{ type: 'TEXT', text: '示例提示，仅用于验证结构。' }],
    },
  ],
  explanation: {
    summary: [{ type: 'TEXT', text: '示例解析摘要，仅用于验证结构。' }],
    steps: [[{ type: 'TEXT', text: '示例解析步骤，仅用于验证结构。' }]],
  },
  isSample: true,
  verificationStatus: 'SAMPLE',
})

const option = (questionId: string, optionKey: string, sortOrder: number): QuestionOption => ({
  id: `${questionId}_OPTION_${optionKey}`,
  questionId,
  optionKey,
  content: [{ type: 'TEXT', text: `示例选项 ${optionKey}` }],
  sortOrder,
})

export const sampleQuestions: SampleQuestion[] = [
  {
    ...baseQuestion('SAMPLE_QUESTION_SINGLE_CHOICE', 'singleChoice', 'SAMPLE_MATH_KP_01'),
    options: [
      option('SAMPLE_QUESTION_SINGLE_CHOICE', 'A', 1),
      option('SAMPLE_QUESTION_SINGLE_CHOICE', 'B', 2),
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
  },
  {
    ...baseQuestion('SAMPLE_QUESTION_DRAG_DROP', 'dragDrop', 'SAMPLE_MATH_KP_02'),
    draggableItems: [
      {
        itemKey: 'ITEM_A',
        content: [{ type: 'TEXT', text: '示例拖拽项 A' }],
      },
      {
        itemKey: 'ITEM_B',
        content: [{ type: 'TEXT', text: '示例拖拽项 B' }],
      },
    ],
    targets: [
      {
        targetKey: 'TARGET_A',
        content: [{ type: 'TEXT', text: '示例目标 A' }],
      },
      {
        targetKey: 'TARGET_B',
        content: [{ type: 'TEXT', text: '示例目标 B' }],
      },
    ],
    answerRule: {
      ruleType: 'PLACEMENT',
      placements: [
        { itemKey: 'ITEM_A', targetKey: 'TARGET_A' },
        { itemKey: 'ITEM_B', targetKey: 'TARGET_B' },
      ],
    },
  },
  {
    ...baseQuestion('SAMPLE_QUESTION_CALCULATION', 'calculation', 'SAMPLE_MATH_KP_03'),
    stem: [{ type: 'FORMULA', text: '示例计算表达式' }],
    answerRule: {
      ruleType: 'NUMERIC',
      value: 0,
    },
  },
  {
    ...baseQuestion('SAMPLE_QUESTION_READING', 'reading', 'SAMPLE_CHINESE_KP_01'),
    media: [
      {
        mediaAssetId: 'SAMPLE_MEDIA_QUESTION',
        usageType: 'PASSAGE',
        order: 1,
      },
    ],
    subQuestionIds: ['SAMPLE_QUESTION_SINGLE_CHOICE'],
    subjectId: 'SAMPLE_SUBJECT_CHINESE',
    textbookVersionId: 'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A',
    answerRule: {
      ruleType: 'READING_SUB_QUESTIONS',
      subQuestionIds: ['SAMPLE_QUESTION_SINGLE_CHOICE'],
    },
  },
]

export const questionById: ReadonlyMap<string, SampleQuestion> = new Map(
  sampleQuestions.map((question) => [question.id, question]),
)

const questionKnowledgePoint = (
  id: string,
  questionId: string,
  knowledgePointId: string,
  relationType: QuestionKnowledgePoint['relationType'] = 'PRIMARY',
  order = 1,
  weight = 1,
): SampleRecord<QuestionKnowledgePoint> => ({
  id,
  questionId,
  knowledgePointId,
  relationType,
  weight,
  order,
  isPrimary: relationType === 'PRIMARY',
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  status: 'DRAFT',
  needsVerification: true,
  isSample: true,
  verificationStatus: 'SAMPLE',
})

export const sampleQuestionKnowledgePoints: SampleRecord<QuestionKnowledgePoint>[] = [
  questionKnowledgePoint(
    'SAMPLE_QUESTION_KP_SINGLE',
    'SAMPLE_QUESTION_SINGLE_CHOICE',
    'SAMPLE_MATH_KP_01',
  ),
  questionKnowledgePoint(
    'SAMPLE_QUESTION_KP_DRAG',
    'SAMPLE_QUESTION_DRAG_DROP',
    'SAMPLE_MATH_KP_02',
  ),
  questionKnowledgePoint(
    'SAMPLE_QUESTION_KP_CALCULATION',
    'SAMPLE_QUESTION_CALCULATION',
    'SAMPLE_MATH_KP_03',
  ),
  questionKnowledgePoint(
    'SAMPLE_QUESTION_KP_READING',
    'SAMPLE_QUESTION_READING',
    'SAMPLE_CHINESE_KP_01',
  ),
]

export const questionKnowledgePointsByQuestionId: ReadonlyMap<
  string,
  SampleRecord<QuestionKnowledgePoint>[]
> = new Map(
  [...new Set(sampleQuestionKnowledgePoints.map((mapping) => mapping.questionId))].map(
    (questionId) => [
      questionId,
      sampleQuestionKnowledgePoints.filter((mapping) => mapping.questionId === questionId),
    ],
  ),
)
