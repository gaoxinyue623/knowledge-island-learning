import type { Id, LessonSession, QuestionSession } from '@/types'

import { lessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import type { LessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import { questionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import type { QuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'

export interface HomeLessonSessionReader {
  listByProfile(profileId: Id): LessonSession[]
}

export interface HomeQuestionSessionReader {
  listByProfile(profileId: Id): QuestionSession[]
}

function sessionSort(
  left: { id: Id; updatedAt?: string; completedAt?: string; startedAt?: string },
  right: { id: Id; updatedAt?: string; completedAt?: string; startedAt?: string },
): number {
  return (
    (right.updatedAt ?? right.completedAt ?? right.startedAt ?? '').localeCompare(
      left.updatedAt ?? left.completedAt ?? left.startedAt ?? '',
    ) || left.id.localeCompare(right.id)
  )
}

function ownerPrefix(profileId: Id): string {
  return `:${profileId}:`
}

export function createHomeLessonSessionReader(
  storage: LessonSessionStorage = lessonSessionStorage,
): HomeLessonSessionReader {
  return {
    listByProfile(profileId) {
      const prefix = ownerPrefix(profileId)
      return storage
        .loadAll()
        .filter((session) => session.id.includes(prefix))
        .sort(sessionSort)
        .map((session) => ({ ...session, completedStepIds: [...session.completedStepIds] }))
    },
  }
}

export function createHomeQuestionSessionReader(
  storage: QuestionSessionStorage = questionSessionStorage,
): HomeQuestionSessionReader {
  return {
    listByProfile(profileId) {
      const prefix = ownerPrefix(profileId)
      return storage
        .loadAll()
        .filter((session) => session.id.includes(prefix))
        .sort(sessionSort)
        .map((session) => ({
          ...session,
          questionIds: [...session.questionIds],
          attempts: session.attempts.map((attempt) => ({ ...attempt })),
        }))
    },
  }
}

export const homeLessonSessionReader = createHomeLessonSessionReader()
export const homeQuestionSessionReader = createHomeQuestionSessionReader()
