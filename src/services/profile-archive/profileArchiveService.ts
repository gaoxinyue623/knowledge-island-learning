import { petRepository, type PetRepository } from '@/services/pet/petDatabase'
import {
  createLocalFamilyProfileRepository,
  FAMILY_PROFILE_REGISTRY_KEY,
  type LocalFamilyProfile,
  type LocalFamilyProfileRegistry,
} from '@/services/family/localFamilyProfiles'
import { adapterFor, assertArchiveRegistryComplete, profileArchiveRegistry, validateArchivePayload, type ArchiveStorage } from './profileArchiveRegistry'
import {
  PROFILE_ARCHIVE_FORMAT,
  PROFILE_ARCHIVE_FORMAT_VERSION,
  studentProfileArchiveSchema,
  type ArchivePreview,
  type ArchiveSectionPreview,
  type ProfileArchiveSectionKind,
  type StudentProfileArchive,
} from './profileArchiveSchema'
import { validatePortableArchive } from './portableArchiveValidator'
import { ACTIVE_PROFILE_JOURNAL_KEY } from '@/services/family/activeProfileStorage'

export const PROFILE_RESTORE_JOURNAL_PREFIX = 'knowledge-island.profile-restore-journal.v1:'

type LockManager = { request<T>(name: string, options: { mode: 'exclusive' }, callback: () => Promise<T>): Promise<T> }
export interface RestoreJournal { digest: string; targetProfileId: string; phase: 'staging' | 'verifying' | 'orphaned'; completed: ProfileArchiveSectionKind[] }
export interface ProfileArchiveServiceDependencies {
  storage?: ArchiveStorage | null
  pet?: PetRepository
  locks?: LockManager | null
  now?: () => Date
  uuid?: () => string
}

function browserStorage(): ArchiveStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage }
  catch { return null }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>
    return `{${Object.keys(item).sort().map((key) => `${JSON.stringify(key)}:${canonical(item[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
export function archiveDigest(value: unknown): string {
  let hash = 2166136261
  const text = canonical(value)
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return `${text.length}:${(hash >>> 0).toString(16)}`
}
function deepClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function profileToken(value: string, profileId: string): boolean {
  return value === profileId || value.split(':').includes(profileId)
}
function owned(value: unknown, profileId: string): boolean {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  if ('profileId' in item) return item.profileId === profileId
  return typeof item.id === 'string' && profileToken(item.id, profileId)
}
/** Rekey only ownership/reference fields; text content is never searched or rewritten. */
function rekey(value: unknown, source: string, target: string): unknown {
  if (Array.isArray(value)) return value.map((entry) => rekey(entry, source, target))
  if (!value || typeof value !== 'object') return value
  const input = value as Record<string, unknown>
  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(input)) {
    if ((key === 'profileId' || key === 'studentId' || key === 'studentProfileId') && item === source) output[key] = target
    else if (['id', 'sourceId', 'sessionId', 'attemptId', 'planId'].includes(key) && typeof item === 'string')
      output[key] = item.split(':').map((part) => part === source ? target : part).join(':')
    else output[key] = rekey(item, source, target)
  }
  return output
}
function rekeyIdentifier(value: string, source: string, target: string): string {
  return value.split(':').map((part) => part === source ? target : part).join(':')
}
/** Explicit cross-section foreign-key rebuilds; no text fields are searched. */
function rekeySection(kind: ProfileArchiveSectionKind, value: unknown, source: string, target: string): unknown {
  const next = rekey(value, source, target)
  const collection = (field: string) => ((next as Record<string, unknown>)?.[field] as Array<Record<string, unknown>> | undefined)
  if (kind === 'learning-evidence') for (const evidence of collection('evidence') ?? []) {
    const ref = evidence.source as Record<string, unknown> | undefined
    if (ref) for (const field of ['questionSessionId', 'questionAttemptId']) if (typeof ref[field] === 'string') ref[field] = rekeyIdentifier(ref[field] as string, source, target)
  }
  if (kind === 'wrong-book') {
    for (const record of collection('records') ?? []) {
      const ref = record.source as Record<string, unknown> | undefined
      if (Array.isArray(ref?.questionSessionIds)) ref.questionSessionIds = ref.questionSessionIds.map((id) => typeof id === 'string' ? rekeyIdentifier(id, source, target) : id)
    }
    const processed = (next as Record<string, unknown>)?.processedAttemptIds
    if (Array.isArray(processed)) (next as Record<string, unknown>).processedAttemptIds = processed.map((id) => typeof id === 'string' ? rekeyIdentifier(id, source, target) : id)
  }
  if (kind === 'review-queue') for (const item of collection('items') ?? []) if (typeof item.evidenceId === 'string') item.evidenceId = rekeyIdentifier(item.evidenceId, source, target)
  return next
}
function parseRaw(storage: ArchiveStorage, key: string): unknown | null {
  const raw = storage.getItem(key)
  if (raw === null) return null
  return JSON.parse(raw)
}
function collectionRecords(value: unknown, collection: string): unknown[] | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  return Array.isArray(item[collection]) ? item[collection] : null
}
const dynamicQuestKinds = new Set<ProfileArchiveSectionKind>(['quest-progress', 'quest-choice'])
const mapKind: ProfileArchiveSectionKind = 'learning-map-progress'
function dynamicEntries(value: unknown): Array<{ questId: string; data: unknown }> | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (item.schemaVersion !== 1 || !Array.isArray(item.entries)) return null
  const entries = item.entries as Array<Record<string, unknown>>
  return entries.every((entry) => typeof entry.questId === 'string' && entry.questId.length > 0 && 'data' in entry)
    ? entries.map((entry) => ({ questId: entry.questId as string, data: entry.data })) : null
}
function mapEntries(value: unknown): Array<{ dataset: string; textbookId: string; data: unknown }> | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (item.schemaVersion !== 1 || !Array.isArray(item.entries)) return null
  const entries = item.entries as Array<Record<string, unknown>>
  return entries.every((entry) => typeof entry.dataset === 'string' && typeof entry.textbookId === 'string' && 'data' in entry)
    ? entries.map((entry) => ({ dataset: entry.dataset as string, textbookId: entry.textbookId as string, data: entry.data })) : null
}
function namespaceKeys(storage: ArchiveStorage, prefix: string): string[] {
  if (typeof storage.key !== 'function' || typeof storage.length !== 'number') return []
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  return keys
}
function sectionPreview(kind: ProfileArchiveSectionKind, status: ArchiveSectionPreview['status'], count = 0, message?: string): ArchiveSectionPreview {
  return { kind, status, count, ...(message ? { message } : {}) }
}
function scopedBaseKey(kind: ProfileArchiveSectionKind, profileId: string): string {
  if (kind === 'student-profile') return `knowledge-island.student.v1:${encodeURIComponent(profileId)}`
  if (kind === 'curriculum-profile') return `knowledge-island.curriculum-profile:${encodeURIComponent(profileId)}`
  return adapterFor(kind).key(profileId)
}

export function createProfileArchiveService(dependencies: ProfileArchiveServiceDependencies = {}) {
  const storage = dependencies.storage ?? browserStorage()
  const pet = dependencies.pet ?? petRepository
  const locks = dependencies.locks ?? (typeof navigator === 'undefined' ? null : (navigator as Navigator & { locks?: LockManager }).locks ?? null)
  const now = dependencies.now ?? (() => new Date())
  const uuid = dependencies.uuid ?? (() => globalThis.crypto.randomUUID())
  const family = createLocalFamilyProfileRepository(storage)

  function exportSection(kind: ProfileArchiveSectionKind, sourceProfileId: string) {
    const adapter = adapterFor(kind)
    if (kind === 'pet-account') return { status: 'EMPTY' as const, data: null, count: 0 }
    if (!storage) return { status: 'INVALID' as const, data: null, count: 0 }
    if (kind === mapKind) {
      const prefix = 'knowledge-island.learning-map-progress.v2:'
      const entries: Array<{ dataset: string; textbookId: string; data: unknown }> = []
      try {
        for (const key of namespaceKeys(storage, prefix)) {
          const tuple = JSON.parse(key.slice(prefix.length))
          if (!Array.isArray(tuple) || tuple.length !== 3 || tuple[0] !== sourceProfileId || typeof tuple[1] !== 'string' || typeof tuple[2] !== 'string') continue
          const data = parseRaw(storage, key)
          if (!validateArchivePayload(adapter, data) || (data as { textbookId?: unknown })?.textbookId !== tuple[2]) return { status: 'INVALID' as const, data: null, count: 0 }
          entries.push({ dataset: tuple[1], textbookId: tuple[2], data: deepClone(data) })
        }
      } catch { return { status: 'INVALID' as const, data: null, count: 0 } }
      return { status: entries.length ? 'READY' as const : 'EMPTY' as const, data: { schemaVersion: 1, entries }, count: entries.length }
    }
    if (dynamicQuestKinds.has(kind)) {
      const prefix = `${adapter.key(sourceProfileId)}:`
      const entries: Array<{ questId: string; data: unknown }> = []
      try {
        for (const key of namespaceKeys(storage, prefix)) {
          const encodedQuestId = key.slice(prefix.length)
          const questId = decodeURIComponent(encodedQuestId)
          const data = parseRaw(storage, key)
          const item = data as { profileId?: unknown; questId?: unknown } | null
          if (!validateArchivePayload(adapter, data) || !item || item.profileId !== sourceProfileId || item.questId !== questId) return { status: 'INVALID' as const, data: null, count: 0 }
          entries.push({ questId, data: deepClone(data) })
        }
      } catch { return { status: 'INVALID' as const, data: null, count: 0 } }
      return { status: entries.length ? 'READY' as const : 'EMPTY' as const, data: { schemaVersion: 1, entries }, count: entries.length }
    }
    let raw: unknown | null
    try { raw = parseRaw(storage, adapter.key(sourceProfileId)) } catch { return { status: 'INVALID' as const, data: null, count: 0 } }
    if (raw === null) return { status: 'EMPTY' as const, data: null, count: 0 }
    if (!validateArchivePayload(adapter, raw)) return { status: 'INVALID' as const, data: null, count: 0 }
    if (kind === 'student-profile') {
      const item = raw as Record<string, unknown>
      const profile = item?.profile as Record<string, unknown> | undefined
      if (item?.version !== 1 || !profile || profile.id !== sourceProfileId || typeof profile.displayName !== 'string' || typeof item.characterId !== 'string')
        return { status: 'INVALID' as const, data: null, count: 0 }
      return { status: 'READY' as const, data: { version: 1, profile: { id: sourceProfileId, displayName: profile.displayName }, characterId: item.characterId }, count: 1 }
    }
    if (kind === 'curriculum-profile') {
      const item = raw as Record<string, unknown>
      const profile = item?.profile as Record<string, unknown> | undefined
      if (item?.schemaVersion !== 1 || !profile || profile.studentId !== sourceProfileId) return { status: 'INVALID' as const, data: null, count: 0 }
      return { status: 'READY' as const, data: { schemaVersion: 1, profile: deepClone(profile) }, count: 1 }
    }
    if (adapter.collection) {
      const records = collectionRecords(raw, adapter.collection)
      if (!records) return { status: 'INVALID' as const, data: null, count: 0 }
      const selected = records.filter((record) => owned(record, sourceProfileId))
      const portable: Record<string, unknown> = { ...(raw as Record<string, unknown>), [adapter.collection]: deepClone(selected) }
      if (kind === 'wrong-book') portable.processedAttemptIds = deepClone((raw as { processedAttemptIds?: unknown }).processedAttemptIds ?? [])
      return { status: selected.length ? 'READY' as const : 'EMPTY' as const, data: portable, count: selected.length }
    }
    if (!owned(raw, sourceProfileId)) return { status: 'INVALID' as const, data: null, count: 0 }
    return { status: 'READY' as const, data: deepClone(raw), count: 1 }
  }

  async function exportArchive(sourceProfileId: string): Promise<StudentProfileArchive> {
    assertArchiveRegistryComplete()
    const student = exportSection('student-profile', sourceProfileId)
    if (student.status !== 'READY') throw new Error('当前学生资料无法安全导出；原记录未修改。')
    const sections = await Promise.all(profileArchiveRegistry.map(async (adapter) => {
      const result = adapter.kind === 'pet-account'
        ? await pet.read(sourceProfileId).then((account) => account ? { status: 'READY' as const, data: account, count: 1 } : { status: 'EMPTY' as const, data: null, count: 0 })
        : exportSection(adapter.kind, sourceProfileId)
      if (result.status === 'INVALID') throw new Error(`“${adapter.kind}”记录损坏，未生成不完整备份。`)
      return { kind: adapter.kind, schemaVersion: adapter.schemaVersion, data: result.data }
    }))
    return studentProfileArchiveSchema.parse({ format: PROFILE_ARCHIVE_FORMAT, formatVersion: PROFILE_ARCHIVE_FORMAT_VERSION, exportedAt: now().toISOString(), sourceProfileId, sections })
  }

  function inspectArchive(input: unknown): ArchivePreview {
    const parsed = studentProfileArchiveSchema.safeParse(input)
    const portable = validatePortableArchive(input)
    const sourceName = parsed.success
      ? String(((parsed.data.sections.find((section) => section.kind === 'student-profile')?.data as { profile?: { displayName?: string } })?.profile?.displayName) ?? '学习档案')
      : '学习档案'
    const targetId = uuid()
    if (!parsed.success || !portable.ok) return { source: { displayName: sourceName, exportedAt: '', formatVersion: 1 }, target: { mode: 'COPY', proposedProfileId: targetId, proposedDisplayName: sourceName }, sections: [sectionPreview('student-profile', 'INVALID', 0, '文件格式无法识别')], canRestore: false, digest: '' }
    const present = new Map(parsed.data.sections.map((section) => [section.kind, section]))
    const sections = profileArchiveRegistry.map((adapter) => {
      const section = present.get(adapter.kind)
      if (!section) return sectionPreview(adapter.kind, adapter.required ? 'MISSING_REQUIRED' : 'EMPTY')
      if (section.schemaVersion !== adapter.schemaVersion) return sectionPreview(adapter.kind, 'UNSUPPORTED_VERSION')
      const result = validateSection(section.kind, section.data, parsed.data.sourceProfileId)
      return sectionPreview(adapter.kind, result.ok ? (result.count ? 'READY' : 'EMPTY') : 'INVALID', result.count, result.message)
    })
    return { source: { displayName: sourceName, exportedAt: parsed.data.exportedAt, formatVersion: 1 }, target: { mode: 'COPY', proposedProfileId: targetId, proposedDisplayName: `${sourceName} 的恢复副本` }, sections, canRestore: sections.every((section) => !['INVALID', 'UNSUPPORTED_VERSION', 'MISSING_REQUIRED'].includes(section.status)), digest: archiveDigest(parsed.data) }
  }

  function validateSection(kind: ProfileArchiveSectionKind, data: unknown, source: string): { ok: boolean; count: number; message?: string } {
    if (data === null) return { ok: true, count: 0 }
    const adapter = adapterFor(kind)
    if (!dynamicQuestKinds.has(kind) && kind !== mapKind && !validateArchivePayload(adapter, data)) return { ok: false, count: 0, message: '记录不符合当前存储契约' }
    if (kind === 'student-profile') return owned((data as { profile?: unknown })?.profile, source) ? { ok: true, count: 1 } : { ok: false, count: 0, message: '档案归属不一致' }
    if (kind === 'curriculum-profile') return ((data as { profile?: { studentId?: unknown } })?.profile?.studentId === source) ? { ok: true, count: 1 } : { ok: false, count: 0, message: '课程档案归属不一致' }
    if (dynamicQuestKinds.has(kind)) {
      const entries = dynamicEntries(data)
      return entries && entries.every(({ questId, data: entry }) => {
        const item = entry as { profileId?: unknown; questId?: unknown }
        return validateArchivePayload(adapter, entry) && item?.profileId === source && item.questId === questId
      }) ? { ok: true, count: entries.length } : { ok: false, count: 0, message: '挑战记录结构或归属不一致' }
    }
    if (kind === mapKind) {
      const entries = mapEntries(data)
      return entries && entries.every((entry) => validateArchivePayload(adapter, entry.data) && (entry.data as { textbookId?: unknown }).textbookId === entry.textbookId)
        ? { ok: true, count: entries.length } : { ok: false, count: 0, message: '地图进度结构或 key tuple 不一致' }
    }
    if (adapter.collection) {
      const records = collectionRecords(data, adapter.collection)
      return records && records.every((record) => owned(record, source)) ? { ok: true, count: records.length } : { ok: false, count: 0, message: '记录结构或归属不一致' }
    }
    return owned(data, source) ? { ok: true, count: 1 } : { ok: false, count: 0, message: '记录归属不一致' }
  }

  async function restore(input: unknown, preview: ArchivePreview): Promise<{ profileId: string; registry: LocalFamilyProfileRegistry }> {
    const parsed = studentProfileArchiveSchema.parse(input)
    if (!preview.canRestore || preview.digest !== archiveDigest(parsed)) throw new Error('PREVIEW_STALE')
    if (!locks) throw new Error('当前浏览器不支持安全恢复锁；仍可导出档案。')
    return locks.request('knowledge-island.profile-mutation', { mode: 'exclusive' }, async () => {
      const target = preview.target.proposedProfileId
      if (!storage) throw new Error('本地存储不可用')
      const existingRegistry = family.read()
      if (storage.getItem(FAMILY_PROFILE_REGISTRY_KEY) !== null && !existingRegistry) throw new Error('本地档案目录损坏，未覆盖原目录。')
      if (existingRegistry?.profiles.some((profile) => profile.id === target)) throw new Error('目标档案已存在')
      const journalKey = PROFILE_RESTORE_JOURNAL_PREFIX + target
      const journal: RestoreJournal = { digest: preview.digest, targetProfileId: target, phase: 'staging', completed: [] }
      storage.setItem(journalKey, JSON.stringify(journal))
      try {
        for (const section of parsed.sections) {
          const valid = validateSection(section.kind, section.data, parsed.sourceProfileId)
          if (!valid.ok || section.data === null) continue
          await stageSection(section.kind, section.data, parsed.sourceProfileId, target)
          journal.completed.push(section.kind)
          storage.setItem(journalKey, JSON.stringify(journal))
        }
        journal.phase = 'verifying'; storage.setItem(journalKey, JSON.stringify(journal))
        for (const kind of journal.completed) verifySection(kind, target)
        const studentData = parsed.sections.find((section) => section.kind === 'student-profile')!.data as { profile: { displayName: string }; characterId: string }
        const entry: LocalFamilyProfile = { id: target, displayName: studentData.profile.displayName, characterId: studentData.characterId, createdAt: now().toISOString() }
        const current = existingRegistry ?? { schemaVersion: 1 as const, activeProfileId: null, profiles: [] }
        // Keep the persisted directory untouched until activate() has switched both
        // singleton payloads.  In particular, preserve the previous active id so
        // activate() snapshots its latest edits before publishing this copy.
        const registry: LocalFamilyProfileRegistry = { ...current, profiles: [...current.profiles, entry] }
        activate(target, registry)
        storage.removeItem(journalKey)
        return { profileId: target, registry }
      } catch (error) {
        journal.phase = 'orphaned'
        try { storage.setItem(journalKey, JSON.stringify(journal)) } catch { /* Preserve existing records even if journal persistence fails. */ }
        throw error
      }
    })
  }

  async function stageSection(kind: ProfileArchiveSectionKind, data: unknown, source: string, target: string) {
    if (kind === 'pet-account') {
      await pet.putNewProfile(target, rekey(data, source, target) as Parameters<PetRepository['putNewProfile']>[1])
      return
    }
    if (!storage) return
    const adapter = adapterFor(kind)
    const next = rekeySection(kind, data, source, target)
    const key = scopedBaseKey(kind, target)
    if (kind === mapKind) {
      for (const entry of mapEntries(next)!) {
        const targetKey = `knowledge-island.learning-map-progress.v2:${JSON.stringify([target, entry.dataset, entry.textbookId])}`
        storage.setItem(targetKey, JSON.stringify(entry.data))
      }
      return
    }
    if (dynamicQuestKinds.has(kind)) {
      const entries = dynamicEntries(next)!
      for (const entry of entries) storage.setItem(`${adapter.key(target)}:${encodeURIComponent(entry.questId)}`, JSON.stringify(entry.data))
      return
    }
    if (adapter.collection) {
      const imported = collectionRecords(next, adapter.collection)!
      const current = parseRaw(storage, key)
      if (current === null) { storage.setItem(key, JSON.stringify(next)); return }
      const existing = collectionRecords(current, adapter.collection)
      if (!existing) throw new Error(`现有 ${kind} 记录损坏，未覆盖。`)
      const merged = [...existing]
      for (const record of imported) if (!merged.some((item) => canonical(item) === canonical(record))) merged.push(record)
      const payload = { ...(current as Record<string, unknown>), [adapter.collection]: merged }
      if (kind === 'wrong-book') {
        const existingIds = Array.isArray(payload.processedAttemptIds) ? payload.processedAttemptIds : []
        const importedIds = Array.isArray((next as Record<string, unknown>).processedAttemptIds) ? (next as Record<string, unknown>).processedAttemptIds as unknown[] : []
        payload.processedAttemptIds = [...new Set([...existingIds, ...importedIds])]
      }
      storage.setItem(key, JSON.stringify(payload))
      return
    }
    storage.setItem(key, JSON.stringify(next))
  }
  function verifySection(kind: ProfileArchiveSectionKind, target: string) {
    if (kind === 'pet-account') return
    if (!storage) return
    const adapter = adapterFor(kind)
    if (kind === mapKind) return
    if (dynamicQuestKinds.has(kind)) return
    const raw = parseRaw(storage, scopedBaseKey(kind, target))
    if (raw === null) throw new Error(`恢复后的 ${kind} 无法回读。`)
    if (adapter.collection && !collectionRecords(raw, adapter.collection)) throw new Error(`恢复后的 ${kind} 格式无效。`)
  }
  async function cleanupOrphan(targetProfileId: string): Promise<void> {
    if (!storage || !locks) return
    await locks.request('knowledge-island.profile-mutation', { mode: 'exclusive' }, async () => {
      for (const adapter of profileArchiveRegistry) {
        if (adapter.kind === 'pet-account' || !scopedBaseKey(adapter.kind, targetProfileId)) continue
        if (dynamicQuestKinds.has(adapter.kind)) {
          for (const key of namespaceKeys(storage, `${adapter.key(targetProfileId)}:`)) storage.removeItem(key)
          continue
        }
        if (adapter.kind === mapKind) {
          const prefix = 'knowledge-island.learning-map-progress.v2:'
          for (const key of namespaceKeys(storage, prefix)) {
            try { if (JSON.parse(key.slice(prefix.length))?.[0] === targetProfileId) storage.removeItem(key) } catch { /* exact namespace only */ }
          }
          continue
        }
        const scopedKey = scopedBaseKey(adapter.kind, targetProfileId)
        const raw = parseRaw(storage, scopedKey)
        if (raw === null) continue
        if (!adapter.collection) storage.removeItem(scopedKey)
        else {
          const records = collectionRecords(raw, adapter.collection)
          if (records) storage.setItem(scopedKey, JSON.stringify({ ...(raw as Record<string, unknown>), [adapter.collection]: records.filter((item) => !owned(item, targetProfileId)) }))
        }
      }
      await pet.deleteProfile(targetProfileId).catch(() => undefined)
      storage.removeItem(PROFILE_RESTORE_JOURNAL_PREFIX + targetProfileId)
    })
  }
  function activate(profileId: string, pendingRegistry?: LocalFamilyProfileRegistry): LocalFamilyProfileRegistry {
    if (!storage) throw new Error('本地存储不可用')
    const registry = pendingRegistry ?? family.read()
    const entry = registry?.profiles.find((profile) => profile.id === profileId)
    if (!registry || !entry) throw new Error('找不到这个本地学习档案。')
    const previousStudentBytes = storage.getItem('knowledge-island.student.v1')
    const previousCurriculumBytes = storage.getItem('knowledge-island.curriculum-profile')
    const previousRegistryBytes = storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)
    storage.setItem(ACTIVE_PROFILE_JOURNAL_KEY, JSON.stringify({ student: previousStudentBytes, curriculum: previousCurriculumBytes, registry: previousRegistryBytes }))
    const restorePrevious = () => {
      try {
        if (previousStudentBytes === null) storage.removeItem('knowledge-island.student.v1')
        else storage.setItem('knowledge-island.student.v1', previousStudentBytes)
        if (previousCurriculumBytes === null) storage.removeItem('knowledge-island.curriculum-profile')
        else storage.setItem('knowledge-island.curriculum-profile', previousCurriculumBytes)
        if (previousRegistryBytes === null) storage.removeItem(FAMILY_PROFILE_REGISTRY_KEY)
        else storage.setItem(FAMILY_PROFILE_REGISTRY_KEY, previousRegistryBytes)
        storage.removeItem(ACTIVE_PROFILE_JOURNAL_KEY)
      } catch { /* The triggering storage failure already prevents publication; preserve best-effort rollback. */ }
    }
    try {
    // Capture the current singleton before another scope can replace it, so normal profile edits are not lost.
    if (registry.activeProfileId && registry.activeProfileId !== profileId) {
      const activeRaw = parseRaw(storage, 'knowledge-island.student.v1')
      const activeAdapter = adapterFor('student-profile')
      if (!validateArchivePayload(activeAdapter, activeRaw) || (activeRaw as { profile?: { id?: unknown } }).profile?.id !== registry.activeProfileId) throw new Error('当前学生资料无法安全归档。')
      storage.setItem(scopedBaseKey('student-profile', registry.activeProfileId), JSON.stringify(activeRaw))
      const activeCurriculum = parseRaw(storage, 'knowledge-island.curriculum-profile')
      if (activeCurriculum) {
        const curriculumAdapter = adapterFor('curriculum-profile')
        if (!validateArchivePayload(curriculumAdapter, activeCurriculum) || (activeCurriculum as { profile?: { studentId?: unknown } }).profile?.studentId !== registry.activeProfileId) throw new Error('当前课程资料无法安全归档。')
        storage.setItem(scopedBaseKey('curriculum-profile', registry.activeProfileId), JSON.stringify(activeCurriculum))
      }
    }
    const studentRaw = parseRaw(storage, scopedBaseKey('student-profile', profileId))
    // The exporter intentionally reads the active singleton; activation validates its isolated source.
    const candidate = studentRaw as { version?: unknown; profile?: { id?: unknown } } | null
    if (!candidate || candidate.version !== 1 || candidate.profile?.id !== profileId) throw new Error('档案基础资料无法安全加载。')
    const curriculumRaw = parseRaw(storage, scopedBaseKey('curriculum-profile', profileId))
    if (curriculumRaw) {
      const curriculum = curriculumRaw as { schemaVersion?: unknown; profile?: { studentId?: unknown } }
      if (curriculum.schemaVersion !== 1 || curriculum.profile?.studentId !== profileId) throw new Error('课程档案与学生资料不一致。')
    }
    storage.setItem('knowledge-island.student.v1', JSON.stringify(studentRaw))
    if (curriculumRaw) storage.setItem('knowledge-island.curriculum-profile', JSON.stringify(curriculumRaw))
    else storage.removeItem('knowledge-island.curriculum-profile')
    const next: LocalFamilyProfileRegistry = { ...registry, activeProfileId: profileId }
    if (!family.write(next)) throw new Error('本地档案目录没有更新。')
    storage.removeItem(ACTIVE_PROFILE_JOURNAL_KEY)
    return next
    } catch (error) {
      restorePrevious()
      throw error
    }
  }
  function bootstrapProfile(entry: LocalFamilyProfile): LocalFamilyProfileRegistry | null {
    if (!storage) return null
    if (family.status() === 'invalid') return null
    const student = parseRaw(storage, 'knowledge-island.student.v1') as { version?: unknown; profile?: { id?: unknown } } | null
    if (!student || student.version !== 1 || student.profile?.id !== entry.id) return family.read()
    const studentKey = scopedBaseKey('student-profile', entry.id)
    if (storage.getItem(studentKey) === null) storage.setItem(studentKey, JSON.stringify(student))
    const curriculum = parseRaw(storage, 'knowledge-island.curriculum-profile') as { schemaVersion?: unknown; profile?: { studentId?: unknown } } | null
    const curriculumKey = scopedBaseKey('curriculum-profile', entry.id)
    if (curriculum && curriculum.schemaVersion === 1 && curriculum.profile?.studentId === entry.id && storage.getItem(curriculumKey) === null)
      storage.setItem(curriculumKey, JSON.stringify(curriculum))
    return family.ensureInitial(entry)
  }
  async function createProfile(input: { displayName: string; characterId: string; copyCurriculum: boolean }): Promise<{ profile: LocalFamilyProfile; registry: LocalFamilyProfileRegistry }> {
    if (!storage || !locks) throw new Error('当前浏览器无法安全创建新档案。')
    const name = input.displayName.trim()
    const target = uuid()
    const candidate = { version: 1, profile: { id: target, displayName: name }, characterId: input.characterId }
    if (!validateArchivePayload(adapterFor('student-profile'), candidate)) throw new Error('昵称或角色无效。')
    return locks.request('knowledge-island.profile-mutation', { mode: 'exclusive' }, async () => {
      const registry = family.read()
      if (!registry || family.status() !== 'valid') throw new Error('本地档案目录不可用。')
      const journalKey = PROFILE_RESTORE_JOURNAL_PREFIX + target
      storage.setItem(journalKey, JSON.stringify({ digest: 'new-profile', targetProfileId: target, phase: 'staging', completed: ['student-profile'] }))
      try {
        storage.setItem(scopedBaseKey('student-profile', target), JSON.stringify(candidate))
        if (input.copyCurriculum) {
          const current = parseRaw(storage, 'knowledge-island.curriculum-profile')
          if (current && validateArchivePayload(adapterFor('curriculum-profile'), current)) storage.setItem(scopedBaseKey('curriculum-profile', target), JSON.stringify(rekeySection('curriculum-profile', current, registry.activeProfileId ?? '', target)))
        }
        const profile: LocalFamilyProfile = { id: target, displayName: name, characterId: input.characterId, createdAt: now().toISOString() }
        const next: LocalFamilyProfileRegistry = { ...registry, profiles: [...registry.profiles, profile] }
        const activated = activate(target, next)
        storage.removeItem(journalKey)
        return { profile, registry: activated }
      } catch (error) {
        try { storage.setItem(journalKey, JSON.stringify({ digest: 'new-profile', targetProfileId: target, phase: 'orphaned', completed: [] })) } catch { /* preserve source */ }
        throw error
      }
    })
  }
  return { exportArchive, inspectArchive, restore, cleanupOrphan, activate, bootstrapProfile, createProfile }
}

export const profileArchiveService = createProfileArchiveService()
