import type {
  Id,
  LearningHistoryListOptions,
  LearningHistoryProjectionOptions,
  LearningHistoryProjectionResult,
  LearningHistoryRecord,
  LearningHistoryRepository,
  LessonSession,
  QuestionSession,
} from '@/types'

import { learningHistoryRepository } from './learningHistoryRepository'
import {
  projectLessonSessionToHistory,
  projectQuestionSessionToHistory,
} from './learningHistoryProjection'

export interface LearningHistoryServiceContract {
  recordLessonSession(
    profileId: Id,
    session: LessonSession,
    options?: LearningHistoryProjectionOptions,
  ): LearningHistoryProjectionResult
  recordQuestionSession(
    profileId: Id,
    session: QuestionSession,
    options?: LearningHistoryProjectionOptions,
  ): LearningHistoryProjectionResult
  listByProfile(profileId: Id, options?: LearningHistoryListOptions): LearningHistoryRecord[]
  listByKnowledgePoint(
    profileId: Id,
    knowledgePointId: Id,
    options?: LearningHistoryListOptions,
  ): LearningHistoryRecord[]
  listByLesson(
    profileId: Id,
    lessonId: Id,
    options?: LearningHistoryListOptions,
  ): LearningHistoryRecord[]
  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options?: Omit<LearningHistoryListOptions, 'textbookId'>,
  ): LearningHistoryRecord[]
  clearDemoHistory(profileId?: Id): void
  getLastWarning(): string | null
}

export class LearningHistoryService implements LearningHistoryServiceContract {
  constructor(private readonly repository: LearningHistoryRepository = learningHistoryRepository) {}

  recordLessonSession(
    profileId: Id,
    session: LessonSession,
    options: LearningHistoryProjectionOptions = {},
  ): LearningHistoryProjectionResult {
    const projection = projectLessonSessionToHistory(profileId, session, options)
    this.repository.appendMany(projection.records)
    return projection
  }

  recordQuestionSession(
    profileId: Id,
    session: QuestionSession,
    options: LearningHistoryProjectionOptions = {},
  ): LearningHistoryProjectionResult {
    const projection = projectQuestionSessionToHistory(profileId, session, options)
    this.repository.appendMany(projection.records)
    return projection
  }

  listByProfile(profileId: Id, options: LearningHistoryListOptions = {}): LearningHistoryRecord[] {
    return this.repository.listByProfile(profileId, options)
  }

  listByKnowledgePoint(
    profileId: Id,
    knowledgePointId: Id,
    options: LearningHistoryListOptions = {},
  ): LearningHistoryRecord[] {
    return this.repository.listByKnowledgePoint(profileId, knowledgePointId, options)
  }

  listByLesson(
    profileId: Id,
    lessonId: Id,
    options: LearningHistoryListOptions = {},
  ): LearningHistoryRecord[] {
    return this.repository.listByLesson(profileId, lessonId, options)
  }

  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options: Omit<LearningHistoryListOptions, 'textbookId'> = {},
  ): LearningHistoryRecord[] {
    return this.repository.listByTextbook(profileId, textbookId, options)
  }

  clearDemoHistory(profileId?: Id): void {
    this.repository.clearDemoHistory(profileId)
  }

  getLastWarning(): string | null {
    return this.repository.getLastWarning()
  }
}

export const learningHistoryService = new LearningHistoryService()
