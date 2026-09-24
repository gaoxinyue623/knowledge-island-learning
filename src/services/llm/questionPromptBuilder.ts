import type { LearningAgentSnapshot, QuestionGenerationRequest } from '@/types/learning-agent'
import { parseArithmetic, questionText } from '../learning-agent/deterministicAnswerValidator'
import { realMathConstraints } from '../learning-agent/mathConstraints'
import { PromptRegistry, renderPrompt } from './promptRegistry'
import type { GeneratedQuestionDTO } from './questionSchema'

const weaknessCodes = new Set([
  'LOW_MASTERY',
  'LOW_RECENT_ACCURACY',
  'CONSECUTIVE_ERRORS',
  'LOW_CONFIDENCE',
  'NO_EVIDENCE',
  'ACTIVE_WRONG_QUESTION',
])
const errorCodes = new Set([
  'UNKNOWN',
  'CARELESS_ERROR',
  'CONCEPT_CONFUSION',
  'CALCULATION_ERROR',
  'BORROWING_ERROR',
  'CARRYING_ERROR',
  'PLACE_VALUE_ERROR',
  'UNIT_ERROR',
  'FORMULA_ERROR',
  'READING_COMPREHENSION_ERROR',
  'INCOMPLETE_REASONING',
])
export function arithmeticSummary(text: string): string | null {
  const c = parseArithmetic(text)
  return c &&
    Number.isSafeInteger(c.left) &&
    Number.isSafeInteger(c.right) &&
    [c.left, c.right].every((n) => n >= 0 && n <= 100) &&
    ['+', '-'].includes(c.operator)
    ? `${c.left} ${c.operator} ${c.right} = ?`
    : null
}
export function recentQuestionSummaries(
  request: QuestionGenerationRequest,
  snapshot: LearningAgentSnapshot,
): string[] {
  return [
    ...new Set(
      snapshot.questions
        .filter(
          (q) =>
            request.recentQuestionRefs.includes(q.id) || request.avoidQuestionRefs.includes(q.id),
        )
        .map((q) => arithmeticSummary(questionText(q)))
        .filter((s): s is string => !!s),
    ),
  ].slice(-100)
}

function variationShapeExample(
  operator: '+' | '-',
  originalLeft: number | undefined,
  originalRight: number | undefined,
  math: ReturnType<typeof realMathConstraints>,
): string | undefined {
  if (originalLeft === undefined || originalRight === undefined) return undefined
  for (
    let left = math.minLargestOperand ?? math.minNumber;
    left <= (math.maxLargestOperand ?? math.maxNumber);
    left++
  ) {
    for (let right = math.minNumber; right <= math.maxNumber; right++) {
      if (left === originalLeft || right === originalRight) continue
      if (operator === '-' && (left < right || (math.requireBorrowing && left % 10 >= right % 10)))
        continue
      if (operator === '+' && math.requireCarrying && (left % 10) + (right % 10) < 10) continue
      return `${left} ${operator} ${right} = ?`
    }
  }
  return undefined
}
export type GenerationPromptVersion = '4' | '5' | '6' | '7'
export class QuestionGenerationPromptBuilder {
  constructor(private readonly version: GenerationPromptVersion = '6') {}
  build(
    request: QuestionGenerationRequest,
    snapshot: LearningAgentSnapshot,
    options: {
      count: number
      accepted: string[]
      repair?: { failedQuestions: GeneratedQuestionDTO[]; validationErrors: string[] }
    },
  ) {
    const c = snapshot.curriculum
    const math = realMathConstraints(request, snapshot)
    const selectedTemplates = snapshot.templates.filter((t) =>
      request.constraints.templateIds.includes(t.id),
    )
    const hardMathRules = [
      ...(math.requireCarrying ? ['每一道加法的两个个位数之和必须 >= 10（必须进位）。'] : []),
      ...(math.requireBorrowing ? ['每一道减法的被减数个位必须小于减数个位（必须借位）。'] : []),
      ...selectedTemplates.flatMap((template) =>
        template.templateType === 'addition_range' && template.config.noCarry
          ? ['模板 noCarry=true：每一道加法的两个个位数之和必须 < 10。']
          : [],
      ),
    ]
    const context = {
      grade: c.grade.name,
      semester: c.semester.name,
      subject: c.subject.code,
      textbook: { id: c.textbook.id, name: c.textbook.versionName, publisher: c.publisher?.name },
      knowledgePoints: c.knowledgePoints
        .filter((k) => request.targetKnowledgePoints.includes(k.id))
        .map((k) => ({ id: k.id, name: k.name })),
      difficulty: request.difficulty,
      ...(request.constraints.math?.minLargestOperand !== undefined
        ? {
            difficultyProfile: {
              minLargestOperand: request.constraints.math.minLargestOperand,
              maxLargestOperand: request.constraints.math.maxLargestOperand,
              operandRule: `a 和 b 中至少一个必须 >= ${request.constraints.math.minLargestOperand}；a 和 b 都必须 <= ${request.constraints.math.maxLargestOperand ?? request.constraints.math.maxNumber}。只检查等号左边的两个操作数，不能用答案满足这个下限。`,
              supportedSurface: '单步计算；不扩展应用题或推理题型',
            },
          }
        : {}),
      ...(request.weaknessSignals.includes('ACTIVE_WRONG_QUESTION')
        ? {
            variation: snapshot.questions
              .filter((q) => request.avoidQuestionRefs.includes(q.id) && !q.id.includes(':chunk:'))
              .slice(0, 5)
              .map((q) => {
                const arithmetic = parseArithmetic(questionText(q))
                const math = realMathConstraints(request, snapshot)
                return {
                  original: arithmeticSummary(questionText(q)),
                  originalLeft: arithmetic?.left,
                  originalRight: arithmetic?.right,
                  originalOperator: arithmetic?.operator,
                  originalAnswer: arithmetic?.result,
                  knowledgePoint: q.knowledgePointId,
                  rules: {
                    operator: arithmetic?.operator,
                    minLargestOperand: math.minLargestOperand,
                    maxLargestOperand: math.maxLargestOperand,
                    minNumber: math.minNumber,
                    maxNumber: math.maxNumber,
                    bothOperandsMustChange: true,
                    leftMustNotEqual: arithmetic?.left,
                    rightMustNotEqual: arithmetic?.right,
                    nonNegativeResult: arithmetic?.operator === '-',
                    preserveKnowledgePoint: true,
                    forbidExactOriginal: true,
                  },
                  requirements: [
                    '保持原题运算符与知识点',
                    '两个操作数都必须分别变化',
                    '不得复制原题算式',
                    '严格服从当前 constraints.math 的操作数范围',
                  ],
                  repairHint: variationShapeExample(
                    arithmetic?.operator === '+' ? '+' : '-',
                    arithmetic?.left,
                    arithmetic?.right,
                    math,
                  ),
                }
              }),
          }
        : {}),
      questionCount: options.count,
      questionTypes: request.allowedQuestionTypes,
      constraints: {
        math,
        maxTextLength: request.constraints.maxTextLength,
        templates: snapshot.templates
          .filter((t) => request.constraints.templateIds.includes(t.id))
          .map((t) => ({
            knowledgePointId: t.knowledgePointId,
            type: t.templateType,
            limits: t.config,
          })),
      },
      ...(this.version === '7' ? { hardMathRules } : {}),
      weaknessSignals: request.weaknessSignals.filter((s) => weaknessCodes.has(s)),
      errorPatterns: request.errorPatterns
        .filter((e) => errorCodes.has(e.code))
        .map((e) => ({ code: e.code, confidence: e.confidence })),
      questionMix: request.constraints.questionMix,
      recentQuestionSummary: recentQuestionSummaries(request, snapshot),
      forbiddenStems: [
        ...new Set([
          ...recentQuestionSummaries(request, snapshot),
          ...options.accepted.filter((stem) => !!stem),
        ]),
      ],
      avoidRules: ['不重复近期题目或已接受题目的算式', '不超出指定教材、知识点、数值和运算范围'],
      acceptedStems: options.accepted,
      // Only allowlisted, parsed arithmetic fields from failures go back to the model.
      ...(options.repair
        ? {
            repair: {
              validationErrors: options.repair.validationErrors,
              failedQuestions: options.repair.failedQuestions.map((q) => ({
                stem: arithmeticSummary(q.stem),
                expectedAnswer: q.expectedAnswer,
                difficulty: q.difficulty,
              })),
            },
          }
        : {}),
    }
    const definition = options.repair
      ? PromptRegistry[`QUESTION_GENERATION_REPAIR_V${this.version}`]
      : PromptRegistry[`QUESTION_GENERATION_USER_V${this.version}`]
    if (options.repair) {
      // Repairs retain only grade, targets, schema/constraints and bounded arithmetic diagnostics.
      // Student history, publisher/textbook descriptions and mastery signals are unnecessary.
      const {
        grade,
        knowledgePoints,
        difficulty,
        questionCount,
        questionTypes,
        constraints,
        errorPatterns,
        questionMix,
        acceptedStems,
        recentQuestionSummary,
        forbiddenStems,
        repair,
        variation,
        difficultyProfile,
        hardMathRules,
      } = context
      return {
        systemPrompt: PromptRegistry[`QUESTION_GENERATION_SYSTEM_V${this.version}`].template,
        userPrompt: renderPrompt(definition, {
          grade,
          knowledgePoints,
          difficulty,
          questionCount,
          questionTypes,
          constraints,
          errorPatterns,
          questionMix,
          acceptedStems,
          recentQuestionSummary,
          forbiddenStems,
          repair,
          variation,
          difficultyProfile,
          hardMathRules,
        }),
        definition,
      }
    }
    return {
      systemPrompt: PromptRegistry[`QUESTION_GENERATION_SYSTEM_V${this.version}`].template,
      userPrompt: renderPrompt(definition, context),
      definition,
    }
  }
}
