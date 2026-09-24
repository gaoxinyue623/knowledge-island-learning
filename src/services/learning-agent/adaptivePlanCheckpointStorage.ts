import { AdaptiveLearningPlan, type AdaptivePlanCheckpoint } from './adaptiveLearningPlan'

export interface AdaptivePlanDraft {
  index: number
  drafts: Record<string, string>
}
export type SavedAdaptivePlanCheckpoint = AdaptivePlanCheckpoint & { draft?: AdaptivePlanDraft }

const PREFIX = 'knowledge-island.learning-agent.plan.v1'

export function adaptivePlanCheckpointScope(
  dataset: string,
  profileId: string,
  textbookId: string,
  scenario: string,
  mode: string,
): string {
  return [dataset, profileId, textbookId, scenario, mode]
    .map((value) => encodeURIComponent(value))
    .join(':')
}

function storageKey(scope: string) {
  return `${PREFIX}:${scope}`
}

function browserSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function matchesScope(scope: string, checkpoint: AdaptivePlanCheckpoint): boolean {
  const parts = scope.split(':').map(decodeURIComponent)
  return (
    parts.length === 5 &&
    parts[0] === 'demo' &&
    parts[1] === checkpoint.snapshot.profile.studentId &&
    parts[2] === checkpoint.snapshot.curriculum.textbook.id &&
    parts[4] === checkpoint.mode
  )
}

/** Drafts are unsubmitted text, never evidence. Ignore unknown question IDs and invalid positions. */
export function normalizeAdaptivePlanDraft(
  checkpoint: AdaptivePlanCheckpoint,
  input?: AdaptivePlanDraft,
): AdaptivePlanDraft {
  const questions =
    checkpoint.status === 'READY' ? (checkpoint.current?.generatedResources.questions ?? []) : []
  const index = input?.index
  return {
    index:
      typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < questions.length
        ? index
        : 0,
    drafts: Object.fromEntries(
      questions.flatMap((q) => {
        const value = input?.drafts?.[q.id]
        return typeof value === 'string' && value.length <= 32 ? [[q.id, value]] : []
      }),
    ),
  }
}

/** Session-only storage; this never becomes a student archive or learning fact. */
export function saveAdaptivePlanCheckpoint(
  scope: string,
  plan: AdaptiveLearningPlan,
  draft?: AdaptivePlanDraft,
): boolean {
  try {
    const storage = browserSessionStorage()
    if (!storage) return false
    const checkpoint: SavedAdaptivePlanCheckpoint = plan.checkpoint()
    if (!matchesScope(scope, checkpoint)) return false
    checkpoint.draft = normalizeAdaptivePlanDraft(checkpoint, draft)
    // Traces are diagnostics, unnecessary for resuming a validated task.
    for (const task of [checkpoint.current, ...checkpoint.completed.map((row) => row.task)]) {
      if (task) task.trace.events = []
    }
    storage.setItem(storageKey(scope), JSON.stringify(checkpoint))
    return true
  } catch {
    return false
  }
}

export function loadAdaptivePlanCheckpoint(scope: string): SavedAdaptivePlanCheckpoint | null {
  try {
    const storage = browserSessionStorage()
    if (!storage) return null
    const raw = storage.getItem(storageKey(scope))
    if (!raw) return null
    const value = JSON.parse(raw) as SavedAdaptivePlanCheckpoint
    AdaptiveLearningPlan.restore(value)
    if (!matchesScope(scope, value)) throw new Error('AGENT_CHECKPOINT_SCOPE_MISMATCH')
    value.draft = normalizeAdaptivePlanDraft(value, value.draft)
    return value
  } catch {
    clearAdaptivePlanCheckpoint(scope)
    return null
  }
}

export function clearAdaptivePlanCheckpoint(scope: string): void {
  try {
    const storage = browserSessionStorage()
    if (!storage) return
    storage.removeItem(storageKey(scope))
  } catch {
    // Storage can be disabled or quota-limited; clearing is best effort.
  }
}
