import type {
  Id,
  QuestionSession,
  WrongBookListOptions,
  WrongBookProjectionOptions,
  WrongBookProjectionResult,
  WrongBookRepository,
  WrongQuestionRecord,
} from '@/types'

import { wrongBookProjectionService, WrongBookProjectionService } from './wrongBookProjection'
import { wrongBookRepository } from './wrongBookRepository'

export class WrongBookService {
  constructor(
    private readonly repository: WrongBookRepository = wrongBookRepository,
    private readonly projection: WrongBookProjectionService = wrongBookProjectionService,
  ) {}

  projectQuestionSession(
    profileId: Id,
    session: QuestionSession,
    options: WrongBookProjectionOptions = {},
  ): WrongBookProjectionResult {
    return this.projection.projectQuestionSession(profileId, session, options)
  }

  resolveRetry(
    profileId: Id,
    session: QuestionSession,
    questionId: Id,
    resolvedAt: string,
    options: WrongBookProjectionOptions = {},
  ): WrongBookProjectionResult {
    return this.projection.resolveRetry(profileId, session, questionId, resolvedAt, options)
  }

  listByProfile(profileId: Id, options: WrongBookListOptions = {}): WrongQuestionRecord[] {
    return this.repository.listByProfile(profileId, options)
  }

  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options: Omit<WrongBookListOptions, 'textbookId'> = {},
  ): WrongQuestionRecord[] {
    return this.repository.listByTextbook(profileId, textbookId, options)
  }

  get(profileId: Id, questionId: Id): WrongQuestionRecord | null {
    return this.repository.get(profileId, questionId)
  }

  markResolved(profileId: Id, questionId: Id, resolvedAt: string): WrongQuestionRecord | null {
    return this.repository.markResolved(profileId, questionId, resolvedAt)
  }

  markActive(profileId: Id, questionId: Id): WrongQuestionRecord | null {
    return this.repository.markActive(profileId, questionId)
  }

  clearDemoWrongBook(profileId?: Id): void {
    this.repository.clearDemoWrongBook(profileId)
  }

  getLastWarning(): string | null {
    return this.repository.getLastWarning()
  }
}

export const wrongBookService = new WrongBookService()
