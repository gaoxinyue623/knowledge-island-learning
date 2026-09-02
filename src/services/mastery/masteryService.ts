import { curriculumAccessConfig } from '@/services/curriculum/accessPolicy'
import { curriculumService } from '@/services/runtime'
import type { CurriculumService } from '@/services/contracts'
import type { CurriculumAccessPolicy } from '@/services/curriculum/accessPolicy'
import type {
  Id,
  LearningEvidence,
  MasteryPolicy,
  MasteryRecord,
  QuestionEngineDataset,
  QuestionKnowledgePoint,
  QuestionSession,
} from '@/types'

import { extractLearningEvidenceFromQuestionSession } from './evidenceExtractor'
import { rebuildMasteryFromEvidence } from './masteryEngine'
import { DEFAULT_MASTERY_POLICY } from './masteryPolicy'
import { masteryRepository } from './masteryRepository'
import {
  questionRepository,
  type QuestionRepository,
} from '@/services/question-engine/questionRepository'
import type { MasteryRepository } from './masteryRepository'

export interface MasteryProcessingOptions {
  dataset?: QuestionEngineDataset
  accessPolicy?: CurriculumAccessPolicy
  policy?: MasteryPolicy
  now?: string
  validateKnowledgePoints?: boolean
}

export interface MasteryProcessingResult {
  processed: boolean
  appendedEvidence: LearningEvidence[]
  records: MasteryRecord[]
  diagnostics: string[]
  warning: string | null
}

export interface MasteryServiceDependencies {
  repository: MasteryRepository
  questionRepository: QuestionRepository
  curriculum: CurriculumService
}

const defaultDependencies: MasteryServiceDependencies = {
  repository: masteryRepository,
  questionRepository,
  curriculum: curriculumService,
}

export class MasteryProcessingService {
  constructor(private readonly dependencies: MasteryServiceDependencies = defaultDependencies) {}

  async processCompletedQuestionSession(
    studentProfileId: Id,
    session: QuestionSession,
    options: MasteryProcessingOptions = {},
  ): Promise<MasteryProcessingResult> {
    const policy = options.policy ?? DEFAULT_MASTERY_POLICY
    if (session.status !== 'completed') {
      return {
        processed: false,
        appendedEvidence: [],
        records: [],
        diagnostics: [`MASTERY_SESSION_NOT_COMPLETED: ${session.id}`],
        warning: null,
      }
    }

    const dataset = options.dataset ?? 'profile'
    const questions = await this.dependencies.questionRepository.getQuestionsByIds(
      session.questionIds,
      dataset,
    )
    const mappings: QuestionKnowledgePoint[] = []
    for (const questionId of session.questionIds) {
      mappings.push(
        ...(await this.dependencies.questionRepository.getQuestionKnowledgePoints(
          questionId,
          dataset,
        )),
      )
    }
    const diagnostics: string[] = []
    const knownQuestionIds = new Set(questions.map((question) => question.id))
    for (const questionId of session.questionIds) {
      if (!knownQuestionIds.has(questionId)) {
        diagnostics.push(`MASTERY_QUESTION_ORPHAN: ${questionId}`)
      }
      if (!mappings.some((mapping) => mapping.questionId === questionId)) {
        diagnostics.push(`MASTERY_MAPPING_MISSING: ${questionId}`)
      }
    }

    if (options.validateKnowledgePoints !== false && dataset !== 'demo') {
      const knowledgePointIds = [...new Set(mappings.map((mapping) => mapping.knowledgePointId))]
      const knownKnowledgePointIds = new Set(
        await Promise.all(
          knowledgePointIds.map(async (knowledgePointId) =>
            (await this.dependencies.curriculum.getKnowledgePointById(knowledgePointId))
              ? knowledgePointId
              : null,
          ),
        ),
      )
      for (const knowledgePointId of knowledgePointIds) {
        if (!knownKnowledgePointIds.has(knowledgePointId)) {
          diagnostics.push(`MASTERY_KNOWLEDGE_POINT_ORPHAN: ${knowledgePointId}`)
        }
      }
    }

    const extracted = extractLearningEvidenceFromQuestionSession(
      {
        studentProfileId,
        session,
        attempts: session.attempts,
        questions,
        mappings,
        policy,
      },
      { accessPolicy: options.accessPolicy ?? curriculumAccessConfig },
    )
    diagnostics.push(...extracted.diagnostics)
    const allowedKnowledgePointIds = new Set(
      mappings
        .map((mapping) => mapping.knowledgePointId)
        .filter(
          (knowledgePointId) =>
            !diagnostics.includes(`MASTERY_KNOWLEDGE_POINT_ORPHAN: ${knowledgePointId}`),
        ),
    )
    const evidenceToAppend = extracted.evidence.filter((item) =>
      allowedKnowledgePointIds.has(item.knowledgePointId),
    )
    const appendedEvidence = this.dependencies.repository.appendEvidence(evidenceToAppend)

    // Rebuild from every extracted knowledge point, not only newly appended
    // evidence. This also repairs a missing/deleted record when the raw
    // evidence has already been persisted and the session is replayed.
    const knowledgePointIds = [
      ...new Set(extracted.evidence.map((item) => item.knowledgePointId)),
    ].sort()
    const records = knowledgePointIds.map((knowledgePointId) => {
      const previousRecord = this.dependencies.repository.getMasteryRecord(
        studentProfileId,
        knowledgePointId,
      )
      if (appendedEvidence.length === 0 && previousRecord) return previousRecord
      const allEvidence = this.dependencies.repository.getEvidenceByKnowledgePoint(
        studentProfileId,
        knowledgePointId,
      )
      return rebuildMasteryFromEvidence(
        studentProfileId,
        knowledgePointId,
        allEvidence,
        previousRecord ?? undefined,
        policy,
        options.now ?? new Date().toISOString(),
      )
    })
    this.dependencies.repository.saveMasteryRecords(records)

    return {
      processed: true,
      appendedEvidence,
      records,
      diagnostics,
      warning: this.dependencies.repository.getLastWarning(),
    }
  }

  rebuildKnowledgePoint(
    studentProfileId: Id,
    knowledgePointId: Id,
    options: Pick<MasteryProcessingOptions, 'policy' | 'now'> = {},
  ): MasteryRecord {
    const previousRecord = this.dependencies.repository.getMasteryRecord(
      studentProfileId,
      knowledgePointId,
    )
    const record = rebuildMasteryFromEvidence(
      studentProfileId,
      knowledgePointId,
      this.dependencies.repository.getEvidenceByKnowledgePoint(studentProfileId, knowledgePointId),
      previousRecord ?? undefined,
      options.policy ?? DEFAULT_MASTERY_POLICY,
      options.now ?? new Date().toISOString(),
    )
    this.dependencies.repository.saveMasteryRecord(record)
    return record
  }

  rebuildAll(studentProfileId: Id, options: Pick<MasteryProcessingOptions, 'policy' | 'now'> = {}) {
    const knowledgePointIds = [
      ...new Set(
        this.dependencies.repository
          .getEvidence(studentProfileId)
          .map((evidence) => evidence.knowledgePointId),
      ),
    ].sort()
    const records = knowledgePointIds.map((knowledgePointId) =>
      this.rebuildKnowledgePoint(studentProfileId, knowledgePointId, options),
    )
    return records
  }
}

export const masteryService = new MasteryProcessingService()
