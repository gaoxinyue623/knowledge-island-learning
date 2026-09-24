import type { LearningDecision } from '@/types/learning-agent'

export interface FormalAgentLaunch {
  id: string
  profileId: string
  textbookId: string
  decision: LearningDecision
  createdAt: string
}

const prefix = 'knowledge-island.agent-launch.v1:'

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function valid(value: unknown): value is FormalAgentLaunch {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<FormalAgentLaunch>
  return Boolean(
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.profileId === 'string' &&
    item.profileId.length > 0 &&
    typeof item.textbookId === 'string' &&
    item.textbookId.length > 0 &&
    typeof item.createdAt === 'string' &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    item.decision &&
    typeof item.decision === 'object' &&
    item.decision.profileId === item.profileId &&
    item.decision.textbookId === item.textbookId &&
    typeof item.decision.decisionId === 'string' &&
    item.decision.recommendedActivity &&
    Array.isArray(item.decision.recommendedActivity.knowledgePointIds),
  )
}

export function saveFormalAgentLaunch(launch: FormalAgentLaunch): boolean {
  if (!valid(launch)) return false
  const target = storage()
  if (!target) return false
  try {
    target.setItem(`${prefix}${launch.id}`, JSON.stringify(launch))
    return true
  } catch {
    return false
  }
}

export function loadFormalAgentLaunch(id: string): FormalAgentLaunch | null {
  if (!id) return null
  const target = storage()
  if (!target) return null
  try {
    const raw = target.getItem(`${prefix}${id}`)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!valid(parsed)) {
      target.removeItem(`${prefix}${id}`)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearFormalAgentLaunch(id: string): void {
  const target = storage()
  if (!target || !id) return
  try {
    target.removeItem(`${prefix}${id}`)
  } catch {
    // Session cleanup is best effort.
  }
}
