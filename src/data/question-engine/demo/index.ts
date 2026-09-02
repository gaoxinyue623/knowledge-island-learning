import type { ContentBlock, Question, QuestionKnowledgePoint, QuestionOption } from '@/types'

import type { SampleQuestionKnowledgePoint } from '@/data/curriculum/types'

const sourceId = 'QUESTION_DEMO_SOURCE'
const generatedAt = '2026-09-02T00:00:00+08:00'
const knowledgePointId = 'DEMO_KP_01'

function text(textValue: string): ContentBlock {
  return { type: 'TEXT', text: textValue }
}

function baseQuestion(
  id: string,
  questionType: Question['questionType'],
  stem: string,
): Omit<Question, 'answerRule' | 'options'> {
  return {
    id,
    questionType,
    stem: [text(stem)],
    knowledgePointId,
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId,
    status: 'DRAFT',
    needsVerification: true,
    estimatedSeconds: 35,
    tags: ['demo', 'original-sample'],
    media: [],
    gradeId: 'DEMO_GRADE_3',
    semesterId: 'DEMO_SEMESTER_UPPER',
    subjectId: 'DEMO_SUBJECT_MATH',
    textbookVersionId: 'DEMO_TEXTBOOK_MATH_G3_S1',
    questionVersion: 1,
    hints: [
      {
        id: `${id}_HINT`,
        order: 1,
        trigger: 'ON_REQUEST',
        content: [text('先读清楚题目的条件，再一步一步检查。')],
      },
    ],
    explanation: {
      summary: [text('把已知条件整理清楚，再选择合适的方法。')],
      steps: [[text('先找出题目给出的数量。'), text('再按照题目要求完成计算或判断。')]],
    },
    isSample: true,
    verificationStatus: 'SAMPLE',
  }
}

function option(
  questionId: string,
  optionKey: string,
  label: string,
  sortOrder: number,
): QuestionOption {
  return {
    id: `${questionId}_OPTION_${optionKey}`,
    questionId,
    optionKey,
    content: [text(label)],
    sortOrder,
  }
}

export const demoAssessmentContext = {
  textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
  unitId: 'DEMO_UNIT_01',
  lessonId: 'DEMO_LESSON_1_1',
  knowledgePointId,
  source: 'dev' as const,
}

const singleChoiceId = 'DEMO_QUESTION_SINGLE_CHOICE'
const multipleChoiceId = 'DEMO_QUESTION_MULTIPLE_CHOICE'
const trueFalseId = 'DEMO_QUESTION_TRUE_FALSE'
const fillBlankId = 'DEMO_QUESTION_FILL_BLANK'
const calculationId = 'DEMO_QUESTION_CALCULATION'
const shortAnswerId = 'DEMO_QUESTION_SHORT_ANSWER'

export const demoQuestions: Question[] = [
  {
    ...baseQuestion(
      singleChoiceId,
      'singleChoice',
      '小明有 2 个苹果，又拿来 3 个，一共有几个苹果？',
    ),
    options: [
      option(singleChoiceId, 'A', '5 个', 1),
      option(singleChoiceId, 'B', '6 个', 2),
      option(singleChoiceId, 'C', '4 个', 3),
    ],
    answerRule: { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' },
  },
  {
    ...baseQuestion(multipleChoiceId, 'multipleChoice', '下面哪些数是偶数？'),
    options: [
      option(multipleChoiceId, 'A', '2', 1),
      option(multipleChoiceId, 'B', '3', 2),
      option(multipleChoiceId, 'C', '8', 3),
      option(multipleChoiceId, 'D', '9', 4),
    ],
    answerRule: {
      ruleType: 'MULTIPLE_OPTIONS',
      correctOptionKeys: ['A', 'C'],
      selectionMode: 'EXACT_SET',
    },
  },
  {
    ...baseQuestion(trueFalseId, 'trueFalse', '7 比 5 大。'),
    answerRule: { ruleType: 'BOOLEAN', correctValue: true },
  },
  {
    ...baseQuestion(fillBlankId, 'fillBlank', '4 + 2 = ____。'),
    answerRule: {
      ruleType: 'TEXT_BLANKS',
      blanks: [
        {
          blankId: 'answer-1',
          acceptedAnswers: ['6', '六'],
          normalization: 'TRIM',
        },
      ],
    },
  },
  {
    ...baseQuestion(calculationId, 'calculation', '请算一算：25 + 17 = ____。'),
    answerRule: { ruleType: 'NUMERIC', value: 42, tolerance: 0 },
  },
  {
    ...baseQuestion(shortAnswerId, 'shortAnswer', '请用一句话说说：你会怎样检查自己的计算？'),
    answerRule: { ruleType: 'MANUAL_REVIEW' },
  },
]

function relation(
  id: string,
  questionId: string,
  targetKnowledgePointId: string,
  relationType: QuestionKnowledgePoint['relationType'],
  order: number,
): SampleQuestionKnowledgePoint {
  return {
    id,
    questionId,
    knowledgePointId: targetKnowledgePointId,
    relationType,
    order,
    isPrimary: relationType === 'PRIMARY',
    sourceId,
    status: 'DRAFT',
    needsVerification: true,
    isSample: true,
    verificationStatus: 'SAMPLE',
  }
}

export const demoQuestionKnowledgePoints: SampleQuestionKnowledgePoint[] = [
  relation('DEMO_QUESTION_KP_SINGLE', singleChoiceId, knowledgePointId, 'PRIMARY', 1),
  relation('DEMO_QUESTION_KP_MULTIPLE', multipleChoiceId, knowledgePointId, 'PRIMARY', 1),
  relation('DEMO_QUESTION_KP_TRUE_FALSE', trueFalseId, knowledgePointId, 'PRIMARY', 1),
  relation('DEMO_QUESTION_KP_FILL_BLANK', fillBlankId, knowledgePointId, 'PRIMARY', 1),
  relation('DEMO_QUESTION_KP_CALCULATION', calculationId, knowledgePointId, 'PRIMARY', 1),
  relation('DEMO_QUESTION_KP_CALCULATION_SECONDARY', calculationId, 'DEMO_KP_02', 'SECONDARY', 2),
  relation('DEMO_QUESTION_KP_SHORT_ANSWER', shortAnswerId, knowledgePointId, 'PRIMARY', 1),
]

export const demoAssessmentDefinition = {
  id: 'DEMO_ASSESSMENT_MATH_KP_01',
  knowledgePointId,
  questionIds: demoQuestions.map((question) => question.id),
  mode: 'practice' as const,
}

export const demoQuestionById: ReadonlyMap<string, Question> = new Map(
  demoQuestions.map((question) => [question.id, question]),
)

export const demoQuestionData = {
  questions: demoQuestions,
  questionKnowledgePoints: demoQuestionKnowledgePoints,
  assessment: demoAssessmentDefinition,
  context: demoAssessmentContext,
  sourceId,
  generatedAt,
}
