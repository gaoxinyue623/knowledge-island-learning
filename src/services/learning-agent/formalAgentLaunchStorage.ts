import { createUuid } from '@/utils/uuid'
import { accountStorage, accountSessionStorage } from '@/services/account/storage'
import type { LearningDecision } from '@/types/learning-agent'
import { z } from 'zod'

export interface FormalAgentLaunch {
  id: string
  profileId: string
  textbookId: string
  decision: LearningDecision
  createdAt: string
  completedAt?: string
  runId?: string
}
const legacyPrefix = 'knowledge-island.agent-launch.v1:'
const key = 'knowledge-island.agent-launches.v1'
const runKey = 'knowledge-island.agent-runs.v1'
const runSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  textbookId: z.string(),
  taskLimit: z.number().int().min(1).max(5),
  completedLaunchIds: z.array(z.string()).max(5),
  currentLaunchId: z.string().nullable(),
  startedAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(['active', 'completed']),
})
export type FormalStudyRun = z.infer<typeof runSchema>
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
    item.decision.profileId === item.profileId &&
    item.decision.textbookId === item.textbookId &&
    typeof item.decision.decisionId === 'string' &&
    item.decision.recommendedActivity &&
    Array.isArray(item.decision.recommendedActivity.knowledgePointIds),
  )
}
export function listFormalAgentLaunches(
  profileId?: string,
  textbookId?: string,
): FormalAgentLaunch[] {
  if (typeof window === 'undefined') return []
  const raw = accountStorage.getItem(key)
  const data: unknown = raw ? JSON.parse(raw) : []
  if (!Array.isArray(data) || !data.every(valid))
    throw new Error('学习任务记录无法读取，原数据已保留。')
  const migratedKeys: string[] = []
  for (let i = 0; i < accountSessionStorage.length; i++) {
    const legacyKey = accountSessionStorage.key(i)
    if (!legacyKey?.startsWith(legacyPrefix)) continue
    try {
      const launch: unknown = JSON.parse(accountSessionStorage.getItem(legacyKey)!)
      if (!valid(launch) || legacyKey !== legacyPrefix + launch.id) continue
      if (!data.some((l) => l.id === launch.id)) {
        if (data.length >= 100) continue
        data.push(launch)
      }
      migratedKeys.push(legacyKey)
    } catch {
      /* Preserve malformed legacy data for recovery. */
    }
  }
  if (migratedKeys.length) {
    accountStorage.setItem(key, JSON.stringify(data))
    for (const migrated of migratedKeys) accountSessionStorage.removeItem(migrated)
  }
  return data
    .filter(
      (l) =>
        (!profileId || l.profileId === profileId) && (!textbookId || l.textbookId === textbookId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export function saveFormalAgentLaunch(launch: FormalAgentLaunch): boolean {
  if (!valid(launch) || typeof window === 'undefined') return false
  try {
    const all = listFormalAgentLaunches().filter((l) => l.id !== launch.id)
    // Never discard an unfinished task while keeping completed history.
    const active = all.filter((l) => !l.completedAt)
    if (active.length >= 100) return false
    accountStorage.setItem(
      key,
      JSON.stringify([launch, ...active, ...all.filter((l) => l.completedAt)].slice(0, 100)),
    )
    return true
  } catch {
    return false
  }
}
export function loadFormalAgentLaunch(id: string): FormalAgentLaunch | null {
  if (!id || typeof window === 'undefined') return null
  try {
    const saved = listFormalAgentLaunches().find((l) => l.id === id)
    if (saved) return saved
    const raw = accountSessionStorage.getItem(legacyPrefix + id)
    if (!raw) return null
    const legacy: unknown = JSON.parse(raw)
    if (!valid(legacy)) return null
    if (!saveFormalAgentLaunch(legacy)) return null
    return legacy
  } catch {
    return null
  }
}
export function clearFormalAgentLaunch(id: string) {
  if (typeof window === 'undefined') return
  accountStorage.setItem(key, JSON.stringify(listFormalAgentLaunches().filter((l) => l.id !== id)))
  accountSessionStorage.removeItem(legacyPrefix + id)
}
function runs(): FormalStudyRun[] {
  const raw = accountStorage.getItem(runKey)
  return raw ? z.array(runSchema).max(100).parse(JSON.parse(raw)) : []
}
function saveRun(run: FormalStudyRun) {
  const all = runs().filter((r) => r.id !== run.id)
  if (all.filter((r) => r.status === 'active').length >= 100)
    throw new Error('未完成的学习安排过多，请先完成已有任务。')
  accountStorage.setItem(
    runKey,
    JSON.stringify(
      [
        run,
        ...all.filter((r) => r.status === 'active'),
        ...all.filter((r) => r.status === 'completed'),
      ].slice(0, 100),
    ),
  )
}
export function latestFormalRun(profileId: string, textbookId: string) {
  return (
    runs()
      .filter((r) => r.profileId === profileId && r.textbookId === textbookId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  )
}
export function startFormalRun(
  profileId: string,
  textbookId: string,
  taskLimit = 3,
): FormalStudyRun {
  const date = new Date().toISOString()
  const run = runSchema.parse({
    id: createUuid(),
    profileId,
    textbookId,
    taskLimit,
    completedLaunchIds: [],
    currentLaunchId: null,
    startedAt: date,
    updatedAt: date,
    status: 'active',
  })
  saveRun(run)
  return run
}
export function bindFormalRun(run: FormalStudyRun, launch: FormalAgentLaunch) {
  const current = runs().find((r) => r.id === run.id)
  if (
    !current ||
    current.status !== 'active' ||
    current.profileId !== launch.profileId ||
    current.textbookId !== launch.textbookId ||
    current.currentLaunchId ||
    current.completedLaunchIds.length >= current.taskLimit
  )
    throw new Error('学习安排已更新，请刷新后继续。')
  if (!saveFormalAgentLaunch({ ...launch, runId: current.id }))
    throw new Error('学习任务暂时无法保存。')
  saveRun({ ...current, currentLaunchId: launch.id, updatedAt: new Date().toISOString() })
}
export function completeFormalTask(id: string) {
  const launch = loadFormalAgentLaunch(id)
  if (!launch) throw new Error('学习任务暂时无法读取。')
  const date = launch.completedAt ?? new Date().toISOString()
  if (!saveFormalAgentLaunch({ ...launch, completedAt: date }))
    throw new Error('完成记录暂时无法保存。')
  if (!launch.runId) return
  const run = runs().find((r) => r.id === launch.runId)
  if (!run || run.completedLaunchIds.includes(id)) return
  if (run.currentLaunchId !== id) throw new Error('学习安排已更新，请刷新后继续。')
  const completedLaunchIds = [...run.completedLaunchIds, id]
  saveRun({
    ...run,
    completedLaunchIds,
    currentLaunchId: null,
    status: completedLaunchIds.length >= run.taskLimit ? 'completed' : 'active',
    updatedAt: date,
  })
}

/** Repair an interrupted local commit before offering the next task. */
export function recoverFormalRun(profileId: string, textbookId: string, taskLimit = 3) {
  let run = latestFormalRun(profileId, textbookId)
  let launch = run?.currentLaunchId ? loadFormalAgentLaunch(run.currentLaunchId) : null
  if (run?.currentLaunchId && !launch)
    throw new Error('上次学习任务暂时无法读取，请恢复账号记录后继续。')
  if (launch && (launch.profileId !== profileId || launch.textbookId !== textbookId))
    throw new Error('学习安排与当前档案不一致，请重新进入。')
  if (launch?.completedAt) {
    completeFormalTask(launch.id)
    run = latestFormalRun(profileId, textbookId)
    launch = null
  }
  launch ??= listFormalAgentLaunches(profileId, textbookId).find((l) => !l.completedAt) ?? null
  if (launch && !run?.currentLaunchId) {
    if (!run || run.status === 'completed') run = startFormalRun(profileId, textbookId, taskLimit)
    bindFormalRun(run, launch)
    run = latestFormalRun(profileId, textbookId)
    launch = loadFormalAgentLaunch(launch.id)
  }
  return { run, launch }
}
