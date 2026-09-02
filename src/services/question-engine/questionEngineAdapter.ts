import { demoAssessmentContext } from '@/data/question-engine'
import { contentService, curriculumService } from '@/services/runtime'
import type { ContentService, CurriculumService } from '@/services/contracts'
import {
  curriculumAccessConfig,
  isQuestionRecordReadable,
  type CurriculumAccessPolicy,
} from '@/services/curriculum'
import type {
  AssessmentDefinition,
  AssessmentLaunchContext,
  AssessmentResultSummary,
  Id,
  Question,
  QuestionAnswerDraft,
  QuestionEngineContextValidation,
  QuestionEngineDataset,
  QuestionEngineFlags,
  QuestionEngineLoadOptions,
  QuestionEngineLoadResult,
  QuestionEngineStatus,
  QuestionKnowledgePoint,
  QuestionOptionViewModel,
  QuestionSession,
  QuestionViewModel,
} from '@/types'

import {
  correctAnswerText,
  isScorableQuestionType,
  normalizeCalculationInput,
} from './answerValidator'
import { questionRepository, type QuestionRepository } from './questionRepository'

const SUPPORTED_QUESTION_TYPES = new Set<Question['questionType']>([
  'singleChoice',
  'multipleChoice',
  'trueFalse',
  'fillBlank',
  'calculation',
  'shortAnswer',
])

const UNREVIEWED_STATUSES = new Set(['UNVERIFIED', 'VERIFIED'])

export interface QuestionEngineAdapterOptions {
  curriculum?: CurriculumService
  questionRepository?: QuestionRepository
  contentService?: ContentService
  accessPolicy?: CurriculumAccessPolicy
}

export interface QuestionEngineAssessment {
  context: AssessmentLaunchContext
  definition: AssessmentDefinition
  questions: Question[]
  flags: QuestionEngineFlags
  diagnostics: string[]
}

function sameContext(left: AssessmentLaunchContext, right: AssessmentLaunchContext): boolean {
  return (
    left.textbookId === right.textbookId &&
    left.unitId === right.unitId &&
    left.lessonId === right.lessonId &&
    left.knowledgePointId === right.knowledgePointId
  )
}

function issueMessage(issue: QuestionEngineLoadResult['issue']): string | undefined {
  switch (issue) {
    case 'QUESTION_EMPTY':
      return '这个知识点的练习内容正在准备中。'
    case 'QUESTION_NOT_AVAILABLE':
    case 'NOT_AVAILABLE':
      return '这组练习还需要完成审核，暂时不能进入。'
    case 'UNSUPPORTED_QUESTION':
      return '这里有一种暂时不支持的题型，请稍后再试。'
    case 'INVALID_CONTEXT':
      return '学习上下文无效，请从课程中的练习入口进入。'
    default:
      return undefined
  }
}

function mappingForTarget(
  mappings: readonly QuestionKnowledgePoint[],
  questionId: Id,
  knowledgePointId: Id,
): QuestionKnowledgePoint | undefined {
  return mappings
    .filter(
      (mapping) =>
        mapping.questionId === questionId && mapping.knowledgePointId === knowledgePointId,
    )
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))[0]
}

function createDraft(question: Question): QuestionAnswerDraft {
  switch (question.questionType) {
    case 'singleChoice':
      return { type: 'singleChoice' }
    case 'multipleChoice':
      return { type: 'multipleChoice', optionIds: [] }
    case 'trueFalse':
      return { type: 'trueFalse' }
    case 'fillBlank':
      return {
        type: 'fillBlank',
        values:
          question.answerRule.ruleType === 'TEXT_BLANKS'
            ? question.answerRule.blanks.map(() => '')
            : [],
      }
    case 'calculation':
      return { type: 'calculation', value: '' }
    case 'shortAnswer':
      return { type: 'shortAnswer', value: '' }
    default:
      return { type: 'shortAnswer', value: '' }
  }
}

function draftOptionIds(draft: QuestionAnswerDraft): Set<Id> {
  if (draft.type === 'singleChoice' && draft.optionId) return new Set([draft.optionId])
  if (draft.type === 'multipleChoice') return new Set(draft.optionIds)
  return new Set()
}

function answerOptionModels(
  question: Question,
  draft: QuestionAnswerDraft,
  submitted: boolean,
): QuestionOptionViewModel[] {
  const selectedIds = draftOptionIds(draft)
  const correctKeys =
    question.answerRule.ruleType === 'SINGLE_OPTION'
      ? [question.answerRule.correctOptionKey]
      : question.answerRule.ruleType === 'MULTIPLE_OPTIONS'
        ? question.answerRule.correctOptionKeys
        : []
  return (question.options ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    .map((option) => ({
      ...option,
      isSelected: selectedIds.has(option.id),
      ...(submitted ? { isCorrect: correctKeys.includes(option.optionKey) } : {}),
    }))
}

async function mediaViewModels(
  question: Question,
  contentApi: ContentService,
): Promise<QuestionViewModel['media']> {
  return Promise.all(
    question.media
      .slice()
      .sort(
        (left, right) =>
          left.order - right.order || left.mediaAssetId.localeCompare(right.mediaAssetId),
      )
      .map(async (media) => {
        const asset = await contentApi.getMediaAsset(media.mediaAssetId)
        return {
          ...media,
          ...(asset
            ? {
                url: asset.url,
                mimeType: asset.mimeType,
                mediaType: asset.mediaType,
                altText: asset.altText,
                transcript: asset.transcript,
              }
            : {}),
          isAvailable: Boolean(asset?.url),
        }
      }),
  )
}

export async function adaptQuestionToViewModel(
  question: Question,
  attempt: import('@/types').QuestionAttempt | undefined,
  contentApi: ContentService = contentService,
): Promise<QuestionViewModel> {
  const draft = attempt?.answer ?? createDraft(question)
  const submitted = attempt?.submitted === true
  return {
    id: question.id,
    type: question.questionType,
    stem: question.stem.map((block) => ({ ...block })),
    options: answerOptionModels(question, draft, submitted),
    media: await mediaViewModels(question, contentApi),
    answerDraft: draft,
    submitted,
    ...(attempt?.result ? { result: attempt.result } : {}),
    explanation: {
      summary: question.explanation.summary.map((block) => ({ ...block })),
      steps: question.explanation.steps.map((step) => step.map((block) => ({ ...block }))),
      ...(question.explanation.misconceptionTags
        ? { misconceptionTags: [...question.explanation.misconceptionTags] }
        : {}),
    },
    hints: question.hints.map((hint) => ({
      ...hint,
      content: hint.content.map((block) => ({ ...block })),
    })),
    ...(submitted ? { correctAnswerText: correctAnswerText(question) } : {}),
    isSample: question.isSample,
    ...(question.verificationStatus ? { verificationStatus: question.verificationStatus } : {}),
    ...(question.questionVersion !== undefined
      ? { questionVersion: question.questionVersion }
      : {}),
  }
}

export function createQuestionSession(
  context: AssessmentLaunchContext,
  definition: AssessmentDefinition,
  studentId = 'local-profile',
): QuestionSession {
  const id = [
    'question-session',
    studentId,
    definition.id,
    context.textbookId,
    context.unitId,
    context.lessonId,
    context.knowledgePointId,
  ].join(':')
  return {
    id,
    assessmentId: definition.id,
    textbookId: context.textbookId,
    unitId: context.unitId,
    lessonId: context.lessonId,
    knowledgePointId: context.knowledgePointId,
    questionIds: [...definition.questionIds],
    currentQuestionIndex: 0,
    status: 'not_started',
    attempts: [],
  }
}

export async function buildQuestionEngineViewModel(
  assessment: QuestionEngineAssessment,
  session: QuestionSession,
  status: QuestionEngineStatus = session.status === 'completed' ? 'completed' : 'ready',
  contentApi: ContentService = contentService,
): Promise<import('@/types').QuestionEngineViewModel> {
  const questionsById = new Map(assessment.questions.map((question) => [question.id, question]))
  const orderedQuestions = assessment.definition.questionIds
    .map((questionId) => questionsById.get(questionId))
    .filter((question): question is Question => Boolean(question))
  const currentQuestionIndex = Math.min(
    Math.max(0, session.currentQuestionIndex),
    Math.max(0, orderedQuestions.length - 1),
  )
  const currentQuestion = orderedQuestions[currentQuestionIndex]
  const currentAttempt = currentQuestion
    ? session.attempts.find((attempt) => attempt.questionId === currentQuestion.id)
    : undefined
  const summary = buildAssessmentResultSummary(session, orderedQuestions)
  const answeredCount = session.attempts.filter(
    (attempt) =>
      assessment.definition.questionIds.includes(attempt.questionId) && attempt.submitted,
  ).length
  return {
    context: assessment.context,
    definition: {
      ...assessment.definition,
      questionIds: [...assessment.definition.questionIds],
    },
    session: {
      id: session.id,
      status: session.status,
      currentQuestionIndex,
      answeredCount,
      totalQuestions: orderedQuestions.length,
      progress:
        orderedQuestions.length === 0
          ? 0
          : Math.round((answeredCount / orderedQuestions.length) * 100),
    },
    currentQuestion: currentQuestion
      ? await adaptQuestionToViewModel(currentQuestion, currentAttempt, contentApi)
      : null,
    ...(session.status === 'completed' ? { resultSummary: summary } : {}),
    flags: { ...assessment.flags },
    status,
    diagnostics: [...assessment.diagnostics],
  }
}

export function buildAssessmentResultSummary(
  session: QuestionSession,
  questions: readonly Question[],
): AssessmentResultSummary {
  const questionIds = new Set(questions.map((question) => question.id))
  const attempts = session.attempts.filter(
    (attempt) => questionIds.has(attempt.questionId) && attempt.submitted && attempt.result,
  )
  const correctCount = attempts.filter((attempt) => attempt.result?.status === 'correct').length
  const incorrectCount = attempts.filter((attempt) => attempt.result?.status === 'incorrect').length
  const manualReviewCount = attempts.filter(
    (attempt) => attempt.result?.status === 'manual_review_required',
  ).length
  const score = attempts.reduce((total, attempt) => total + (attempt.result?.score ?? 0), 0)
  const maxScore = attempts.reduce((total, attempt) => total + (attempt.result?.maxScore ?? 0), 0)
  const scorableQuestions = correctCount + incorrectCount
  return {
    totalQuestions: questions.length,
    submittedQuestions: attempts.length,
    correctCount,
    incorrectCount,
    manualReviewCount,
    score,
    maxScore,
    percentage:
      scorableQuestions === 0 ? null : Math.round((correctCount / scorableQuestions) * 100),
    scorableQuestions,
  }
}

export async function validateAssessmentLaunchContext(
  context: AssessmentLaunchContext,
  curriculum: CurriculumService = curriculumService,
  dataset: QuestionEngineDataset = 'profile',
): Promise<QuestionEngineContextValidation> {
  if (dataset === 'demo') {
    return {
      valid: sameContext(context, demoAssessmentContext),
      ...(sameContext(context, demoAssessmentContext) ? {} : { code: 'INVALID_CONTEXT' as const }),
      issues: sameContext(context, demoAssessmentContext)
        ? []
        : ['Demo AssessmentLaunchContext 不存在。'],
    }
  }

  const issues: string[] = []
  const textbook = await curriculum.getTextbook(context.textbookId)
  if (!textbook) return { valid: false, code: 'INVALID_CONTEXT', issues: ['Textbook 不存在。'] }
  const units = await curriculum.getUnitsByTextbookVersion(textbook.id)
  const unit = units.find((candidate) => candidate.id === context.unitId)
  if (!unit || unit.textbookVersionId !== textbook.id) issues.push('Unit 不属于当前 Textbook。')
  const lessons = unit ? await curriculum.getLessonsByUnit(unit.id) : []
  const lesson = lessons.find((candidate) => candidate.id === context.lessonId)
  if (!lesson || lesson.unitId !== context.unitId) issues.push('Lesson 不属于当前 Unit。')
  const knowledgePoints = lesson ? await curriculum.getKnowledgePointsByLesson(lesson.id) : []
  if (!knowledgePoints.some((candidate) => candidate.id === context.knowledgePointId)) {
    issues.push('KnowledgePoint 不属于当前 Lesson。')
  }
  const relation = curriculum.getLessonKnowledgePointRelation
    ? await curriculum.getLessonKnowledgePointRelation(context.lessonId, context.knowledgePointId)
    : null
  if (!relation) issues.push('LessonKnowledgePoint 映射不存在。')
  return {
    valid: issues.length === 0,
    ...(issues.length ? { code: 'INVALID_CONTEXT' as const } : {}),
    issues,
  }
}

export class QuestionEngineAdapter {
  private readonly curriculum: CurriculumService
  private readonly repository: QuestionRepository
  private readonly contentApi: ContentService
  private readonly accessPolicy: CurriculumAccessPolicy

  constructor(options: QuestionEngineAdapterOptions = {}) {
    this.curriculum = options.curriculum ?? curriculumService
    this.repository = options.questionRepository ?? questionRepository
    this.contentApi = options.contentService ?? contentService
    this.accessPolicy = options.accessPolicy ?? curriculumAccessConfig
  }

  async loadAssessment(
    context: AssessmentLaunchContext,
    options: QuestionEngineLoadOptions = {},
  ): Promise<QuestionEngineLoadResult> {
    const dataset = options.dataset ?? 'profile'
    const demoState = options.demoState ?? 'full'
    if (dataset === 'demo' && demoState === 'error') throw new Error('SAMPLE_QUESTION_ENGINE_ERROR')
    if (dataset === 'demo' && demoState === 'empty') {
      return {
        definition: null,
        questions: [],
        issue: 'QUESTION_EMPTY',
        message: issueMessage('QUESTION_EMPTY'),
      }
    }
    if (dataset === 'demo' && demoState === 'not_available') {
      return {
        definition: null,
        questions: [],
        issue: 'QUESTION_NOT_AVAILABLE',
        message: issueMessage('QUESTION_NOT_AVAILABLE'),
      }
    }

    const contextValidation = await validateAssessmentLaunchContext(
      context,
      this.curriculum,
      dataset,
    )
    if (!contextValidation.valid) {
      return {
        definition: null,
        questions: [],
        issue: 'INVALID_CONTEXT',
        message: contextValidation.issues.join('；') || issueMessage('INVALID_CONTEXT'),
      }
    }

    const definition = await this.repository.getAssessmentDefinition(context, dataset)
    if (!definition) {
      return {
        definition: null,
        questions: [],
        issue: 'QUESTION_EMPTY',
        message: issueMessage('QUESTION_EMPTY'),
      }
    }
    const rawQuestions = await this.repository.getQuestionsByIds(definition.questionIds, dataset)
    const questionsById = new Map(rawQuestions.map((question) => [question.id, question]))
    const diagnostics: string[] = []
    const orderedRawQuestions = definition.questionIds
      .map((questionId) => {
        if (!questionsById.has(questionId)) diagnostics.push(`QUESTION_ORPHAN: ${questionId}`)
        return questionsById.get(questionId)
      })
      .filter((question): question is Question => Boolean(question))

    const mappedQuestions: Question[] = []
    for (const question of orderedRawQuestions) {
      const mappings = await this.repository.getQuestionKnowledgePoints(question.id, dataset)
      if (!mappingForTarget(mappings, question.id, context.knowledgePointId)) {
        diagnostics.push(`QUESTION_MAPPING_INVALID: ${question.id}`)
        continue
      }
      mappedQuestions.push(question)
    }

    const supportedQuestions = mappedQuestions.filter((question) => {
      if (SUPPORTED_QUESTION_TYPES.has(question.questionType)) return true
      diagnostics.push(`UNSUPPORTED_QUESTION_TYPE: ${question.id}:${question.questionType}`)
      return false
    })
    if (supportedQuestions.length === 0) {
      return {
        definition: null,
        questions: [],
        issue: 'UNSUPPORTED_QUESTION',
        message: issueMessage('UNSUPPORTED_QUESTION'),
        diagnostics,
      }
    }

    const questions = supportedQuestions.map((question) => {
      if (dataset === 'demo' && demoState === 'unverified') {
        return {
          ...question,
          isSample: false,
          needsVerification: true,
          verificationStatus: 'UNVERIFIED' as const,
        }
      }
      return question
    })
    const readableQuestions = questions.filter((question) =>
      isQuestionRecordReadable(question, this.accessPolicy),
    )
    if (readableQuestions.length === 0) {
      return {
        definition: null,
        questions: [],
        issue: 'QUESTION_NOT_AVAILABLE',
        message: issueMessage('QUESTION_NOT_AVAILABLE'),
        diagnostics,
      }
    }
    const availableIds = new Set(readableQuestions.map((question) => question.id))
    const availableDefinition: AssessmentDefinition = {
      ...definition,
      questionIds: definition.questionIds.filter((questionId) => availableIds.has(questionId)),
    }
    const flags: QuestionEngineFlags = {
      isSample: readableQuestions.some((question) => question.isSample),
      isUnverified: readableQuestions.some((question) =>
        question.verificationStatus ? UNREVIEWED_STATUSES.has(question.verificationStatus) : false,
      ),
      isDemo: dataset === 'demo',
    }
    return {
      definition: availableDefinition,
      questions: readableQuestions,
      flags,
      diagnostics,
    }
  }

  async getAssessmentAvailability(
    context: AssessmentLaunchContext,
    options: QuestionEngineLoadOptions = {},
  ): Promise<boolean> {
    const result = await this.loadAssessment(context, options)
    return Boolean(result.definition && result.questions.length)
  }

  async buildViewModel(
    assessment: QuestionEngineAssessment,
    session: QuestionSession,
    status: QuestionEngineStatus = session.status === 'completed' ? 'completed' : 'ready',
  ): Promise<import('@/types').QuestionEngineViewModel> {
    return buildQuestionEngineViewModel(assessment, session, status, this.contentApi)
  }

  static defaultDraft(question: Question): QuestionAnswerDraft {
    return createDraft(question)
  }

  static normalizeCalculationInput(value: string): string {
    return normalizeCalculationInput(value)
  }

  static isScorableQuestionType(question: Question['questionType']): boolean {
    return isScorableQuestionType(question)
  }
}

export const questionEngineAdapter = new QuestionEngineAdapter()
