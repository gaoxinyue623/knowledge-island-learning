import {
  demoAssessmentDefinition,
  demoQuestions,
  demoQuestionKnowledgePoints,
} from '@/data/question-engine'
import { productionConfig } from '@/config/production'
import { curriculumData } from '@/data/curriculum'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import type {
  AssessmentDefinition,
  Id,
  Question,
  QuestionEngineDataset,
  QuestionKnowledgePoint,
} from '@/types'

export type QuestionRepositoryMode = 'success' | 'empty' | 'error' | 'not_available'

export interface QuestionRepositoryOptions {
  mode?: QuestionRepositoryMode
  profileQuestions?: Question[]
  profileQuestionKnowledgePoints?: QuestionKnowledgePoint[]
  demoQuestions?: Question[]
  demoQuestionKnowledgePoints?: QuestionKnowledgePoint[]
  demoAssessment?: AssessmentDefinition
}

export interface QuestionRepository {
  getAssessmentDefinition(
    context: Pick<
      import('@/types').AssessmentLaunchContext,
      'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
    >,
    dataset?: QuestionEngineDataset,
  ): Promise<AssessmentDefinition | null>
  getQuestionsByIds(ids: readonly Id[], dataset?: QuestionEngineDataset): Promise<Question[]>
  getQuestionById(id: Id, dataset?: QuestionEngineDataset): Promise<Question | null>
  getQuestionKnowledgePoints(
    questionId: Id,
    dataset?: QuestionEngineDataset,
  ): Promise<QuestionKnowledgePoint[]>
}

function sameDemoContext(
  context: Pick<
    import('@/types').AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  >,
): boolean {
  return (
    context.textbookId === 'DEMO_TEXTBOOK_MATH_G3_S1' &&
    context.unitId === 'DEMO_UNIT_01' &&
    context.lessonId === 'DEMO_LESSON_1_1' &&
    context.knowledgePointId === 'DEMO_KP_01'
  )
}

function sameProfileQuestionContext(
  question: Question,
  context: Pick<
    import('@/types').AssessmentLaunchContext,
    'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
  >,
): boolean {
  // Knowledge-point membership is resolved exclusively through
  // QuestionKnowledgePoint below. The legacy direct field must not become a
  // second source of truth during the migration period.
  return !question.textbookVersionId || question.textbookVersionId === context.textbookId
}

export class MockQuestionRepository implements QuestionRepository {
  private readonly mode: QuestionRepositoryMode
  private readonly profileQuestions: Question[]
  private readonly profileMappings: QuestionKnowledgePoint[]
  private readonly demoQuestions: Question[]
  private readonly demoMappings: QuestionKnowledgePoint[]
  private readonly demoAssessment: AssessmentDefinition

  constructor(options: QuestionRepositoryOptions = {}) {
    this.mode = options.mode ?? 'success'
    this.profileQuestions =
      options.profileQuestions ??
      (productionConfig.isProduction
        ? [...productionCurriculumIndex.questions]
        : curriculumData.questions)
    this.profileMappings =
      options.profileQuestionKnowledgePoints ??
      (productionConfig.isProduction
        ? [...productionCurriculumIndex.questionKnowledgePoints]
        : curriculumData.questionKnowledgePoints)
    this.demoQuestions = options.demoQuestions ?? demoQuestions
    this.demoMappings = options.demoQuestionKnowledgePoints ?? demoQuestionKnowledgePoints
    this.demoAssessment = options.demoAssessment ?? demoAssessmentDefinition
  }

  private runGuard(): void {
    if (this.mode === 'error') throw new Error('SAMPLE_QUESTION_REPOSITORY_ERROR')
  }

  private records(dataset: QuestionEngineDataset): {
    questions: Question[]
    mappings: QuestionKnowledgePoint[]
  } {
    if (dataset === 'demo') {
      return { questions: this.demoQuestions, mappings: this.demoMappings }
    }
    return { questions: this.profileQuestions, mappings: this.profileMappings }
  }

  async getAssessmentDefinition(
    context: Pick<
      import('@/types').AssessmentLaunchContext,
      'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
    >,
    dataset: QuestionEngineDataset = 'profile',
  ): Promise<AssessmentDefinition | null> {
    this.runGuard()
    if (this.mode === 'empty' || this.mode === 'not_available') return null
    if (dataset === 'golden') return null
    if (dataset === 'demo') {
      return sameDemoContext(context)
        ? { ...this.demoAssessment, questionIds: [...this.demoAssessment.questionIds] }
        : null
    }

    const { questions, mappings } = this.records(dataset)
    const questionIds = questions
      .filter((question) => sameProfileQuestionContext(question, context))
      .filter((question) =>
        mappings.some(
          (mapping) =>
            mapping.questionId === question.id &&
            mapping.knowledgePointId === context.knowledgePointId,
        ),
      )
      .map((question) => question.id)
      .sort((left, right) => left.localeCompare(right))
    if (questionIds.length === 0) return null
    return {
      id: `ASSESSMENT:${context.lessonId}:${context.knowledgePointId}:PRACTICE`,
      knowledgePointId: context.knowledgePointId,
      questionIds,
      mode: 'practice',
    }
  }

  async getQuestionsByIds(
    ids: readonly Id[],
    dataset: QuestionEngineDataset = 'profile',
  ): Promise<Question[]> {
    this.runGuard()
    if (this.mode === 'empty' || this.mode === 'not_available') return []
    const { questions } = this.records(dataset)
    const byId = new Map(questions.map((question) => [question.id, question]))
    return ids
      .map((id) => byId.get(id))
      .filter((question): question is Question => Boolean(question))
  }

  async getQuestionById(
    id: Id,
    dataset: QuestionEngineDataset = 'profile',
  ): Promise<Question | null> {
    const questions = await this.getQuestionsByIds([id], dataset)
    return questions[0] ?? null
  }

  async getQuestionKnowledgePoints(
    questionId: Id,
    dataset: QuestionEngineDataset = 'profile',
  ): Promise<QuestionKnowledgePoint[]> {
    this.runGuard()
    if (this.mode === 'empty' || this.mode === 'not_available') return []
    const { mappings } = this.records(dataset)
    return mappings
      .filter((mapping) => mapping.questionId === questionId)
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
      .map((mapping) => ({ ...mapping }))
  }
}

export const questionRepository = new MockQuestionRepository()
