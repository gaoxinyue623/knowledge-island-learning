import { productionConfig } from '@/config/production'
import {
  isProductionExerciseTemplate,
  isProductionPracticeSet,
} from '@/services/production-readiness'
import type {
  AssessmentDefinition,
  AssessmentLaunchContext,
  ContentExpansionDataset,
  ExerciseInstance,
  QuestionKnowledgePoint,
  PracticeMode,
  PracticeSet,
  Question,
  QuestionSession,
} from '@/types'

import { createQuestionSession } from '@/services/question-engine'
import { adaptExerciseInstances, generateExerciseInstances } from '@/services/exercise-template'
import {
  contentExpansionRepository,
  type ContentExpansionRepository,
} from './contentExpansionRepository'

export interface PracticeService {
  listByKnowledgePoint(
    knowledgePointId: string,
    dataset?: ContentExpansionDataset,
  ): Promise<PracticeSet[]>
  generate(
    practiceSetId: string,
    seed: string,
    count: number,
    dataset?: ContentExpansionDataset,
  ): Promise<{ instances: ExerciseInstance[]; questions: Question[] }>
  buildGeneratedPracticeSession(input: {
    practiceSetId: string
    context: AssessmentLaunchContext
    studentId: string
    seed: string
    count: number
    dataset?: ContentExpansionDataset
  }): Promise<{
    definition: AssessmentDefinition
    questions: Question[]
    questionKnowledgePoints: QuestionKnowledgePoint[]
    session: QuestionSession
  }>
}

export interface PracticeServiceOptions {
  repository?: ContentExpansionRepository
}

export class DefaultPracticeService implements PracticeService {
  private readonly repository: ContentExpansionRepository

  constructor(options: PracticeServiceOptions = {}) {
    this.repository = options.repository ?? contentExpansionRepository
  }

  async listByKnowledgePoint(
    knowledgePointId: string,
    dataset: ContentExpansionDataset = 'profile',
  ) {
    const bundle = await this.repository.getBundle(knowledgePointId, dataset)
    return (bundle?.practiceSets ?? []).sort(
      (left, right) => left.mode.localeCompare(right.mode) || left.id.localeCompare(right.id),
    )
  }

  async generate(
    practiceSetId: string,
    seed: string,
    count: number,
    dataset: ContentExpansionDataset = 'golden',
  ): Promise<{ instances: ExerciseInstance[]; questions: Question[] }> {
    const bundles = await this.repository.listBundles(dataset)
    const bundle = bundles.find((candidate) =>
      candidate.practiceSets.some((set) => set.id === practiceSetId),
    )
    const practiceSet = bundle?.practiceSets.find((set) => set.id === practiceSetId)
    if (!practiceSet) throw new Error('PRACTICE_SET_NOT_FOUND')
    if (dataset === 'profile' && !isProductionPracticeSet(practiceSet))
      throw new Error('PRACTICE_SET_NOT_AVAILABLE')
    if (productionConfig.isProduction && !isProductionPracticeSet(practiceSet))
      throw new Error('PRACTICE_SET_NOT_AVAILABLE')
    const template = bundle?.exerciseTemplates.find(
      (candidate) => candidate.id === practiceSet.templateIds[0],
    )
    if (!template || (productionConfig.isProduction && !isProductionExerciseTemplate(template))) {
      throw new Error('EXERCISE_TEMPLATE_NOT_AVAILABLE')
    }
    const instances = generateExerciseInstances(template, seed, count)
    return { instances, questions: adaptExerciseInstances(instances) }
  }

  async buildGeneratedPracticeSession(input: {
    practiceSetId: string
    context: AssessmentLaunchContext
    studentId: string
    seed: string
    count: number
    dataset?: ContentExpansionDataset
  }) {
    const dataset = input.dataset ?? 'golden'
    const bundles = await this.repository.listBundles(dataset)
    const bundle = bundles.find((candidate) =>
      candidate.practiceSets.some((set) => set.id === input.practiceSetId),
    )
    const practiceSet = bundle?.practiceSets.find((set) => set.id === input.practiceSetId)
    if (!bundle || !practiceSet) throw new Error('PRACTICE_SET_NOT_FOUND')
    const generated = await this.generate(input.practiceSetId, input.seed, input.count, dataset)
    const definition: AssessmentDefinition = {
      id: `GENERATED_PRACTICE:${practiceSet.id}:${input.seed}`,
      knowledgePointId: input.context.knowledgePointId,
      questionIds: generated.questions.map((question) => question.id),
      mode: 'practice',
    }
    const questionKnowledgePoints: QuestionKnowledgePoint[] = generated.questions.map(
      (question, index) => ({
        id: `${question.id}:kp:${input.context.knowledgePointId}`,
        questionId: question.id,
        knowledgePointId: input.context.knowledgePointId,
        relationType: 'PRIMARY',
        weight: 1,
        order: index + 1,
        isPrimary: true,
        sourceId: 'GENERATED_FROM_VERIFIED_TEMPLATE',
        status: 'DRAFT',
        needsVerification: true,
        isSample: question.isSample,
        verificationStatus: question.verificationStatus,
      }),
    )
    return {
      definition,
      questions: generated.questions,
      questionKnowledgePoints,
      session: createQuestionSession(input.context, definition, input.studentId, input.seed),
    }
  }
}

export const practiceService = new DefaultPracticeService()

export function practiceModeLabel(mode: PracticeMode): string {
  return mode === 'basic' ? '基础练习' : mode === 'reinforce' ? '巩固练习' : '应用练习'
}
