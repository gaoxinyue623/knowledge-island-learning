import type { LearningNodeStatus, LessonPlayerSessionViewModel } from '@/types'

// Presentation only: never unlock nodes or infer mastery from finishing the reading steps.
export function lessonProgressPresentation(
  session: LessonPlayerSessionViewModel | undefined,
  locked: boolean,
): { status: LearningNodeStatus; progress: number } {
  if (locked) return { status: 'locked', progress: 0 }
  if (session?.status === 'completed') return { status: 'completed', progress: 100 }
  if (session?.status === 'in_progress')
    return {
      status: 'learning',
      progress: Number.isFinite(session.progress)
        ? Math.min(100, Math.max(0, session.progress))
        : 0,
    }
  return { status: 'available', progress: 0 }
}
