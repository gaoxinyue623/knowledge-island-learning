import type { QuestionSession } from '@/types'
import type { LearningAgentResult, LearningAgentSnapshot } from '@/types/learning-agent'
import { createWrongBookStorage } from '@/services/wrong-book/wrongBookStorage'
import { createWrongBookRepository } from '@/services/wrong-book/wrongBookRepository'
import { WrongBookProjectionService } from '@/services/wrong-book/wrongBookProjection'
import { projectQuestionSessionToHistory } from '@/services/learning-history/learningHistoryProjection'
import { createReviewQueueRepository } from '@/services/review-queue/reviewQueueRepository'
import { createReviewQueueStorage } from '@/services/review-queue/reviewQueueStorage'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  }
}
/** Reuse the existing projections with explicitly injected memory storage. */
export function projectSimulationFacts(
  snapshot: LearningAgentSnapshot,
  session: QuestionSession,
  task: LearningAgentResult,
  now: string,
): void {
  const wrongStorage = createWrongBookStorage(memoryStorage())
  wrongStorage.save({ schemaVersion: 1, records: snapshot.wrongBook, processedAttemptIds: [] })
  const wrong = createWrongBookRepository(wrongStorage)
  new WrongBookProjectionService(wrong).projectQuestionSession(
    snapshot.profile.studentId,
    session,
    {
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
      textbookId: session.textbookId,
      unitId: session.unitId,
      lessonId: session.lessonId,
      supportedQuestionIds: new Set(session.questionIds),
      questionKnowledgePoints: new Map(
        session.questionIds.map((id) => [
          id,
          task.generatedResources.mappings
            .filter((m) => m.questionId === id)
            .map((m) => m.knowledgePointId),
        ]),
      ),
    },
  )
  snapshot.wrongBook = wrong.listByProfile(snapshot.profile.studentId, {
    includeSample: true,
    includeResolved: true,
  })
  const history = projectQuestionSessionToHistory(snapshot.profile.studentId, session, {
    isSampleDerived: true,
    verificationStatus: 'SAMPLE',
  })
  snapshot.history = [
    ...new Map([...snapshot.history, ...history.records].map((r) => [r.id, r])).values(),
  ]
  // A review is only completed by a submitted, entirely correct review task, never by Run Agent.
  if (
    task.decision?.action === 'REVIEW' &&
    session.attempts.every((a) => a.submitted && a.result?.status === 'correct')
  ) {
    const storage = createReviewQueueStorage(memoryStorage())
    storage.save({ schemaVersion: 1, items: snapshot.reviewQueue })
    const queue = createReviewQueueRepository(storage)
    for (const reason of task.decision.reasons) {
      if (reason.evidenceType === 'REVIEW_QUEUE' && reason.evidenceRef)
        queue.complete(snapshot.profile.studentId, reason.evidenceRef, now)
    }
    snapshot.reviewQueue = queue.listByProfile(snapshot.profile.studentId, {
      includeSample: true,
      includeCompleted: true,
    })
  }
}
