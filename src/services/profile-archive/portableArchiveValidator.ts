import { profileArchiveRegistry, validateArchivePayload } from './profileArchiveRegistry'
import { studentProfileArchiveSchema, type ProfileArchiveSectionKind, type StudentProfileArchive } from './profileArchiveSchema'

export type PortableArchiveValidation = { ok: true; archive: StudentProfileArchive } | { ok: false; issue: string }
const dynamicKinds = new Set<ProfileArchiveSectionKind>(['quest-progress', 'quest-choice'])
function owned(value: unknown, source: string, field?: 'profileId' | 'studentProfileId'): boolean {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  if (field) return item[field] === source
  return typeof item.id === 'string' && item.id.split(':').includes(source)
}

/** Pure Node-safe archive gate shared by local restore and family-cloud routes. */
export function validatePortableArchive(input: unknown): PortableArchiveValidation {
  const parsed = studentProfileArchiveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, issue: 'ARCHIVE_FORMAT' }
  const archive = parsed.data
  for (const adapter of profileArchiveRegistry) {
    const section = archive.sections.find((item) => item.kind === adapter.kind)
    if (!section) return { ok: false, issue: `MISSING:${adapter.kind}` }
    if (section.schemaVersion !== adapter.schemaVersion) return { ok: false, issue: `VERSION:${adapter.kind}` }
    if (section.data === null) {
      if (adapter.required) return { ok: false, issue: `MISSING:${adapter.kind}` }
      continue
    }
    if (dynamicKinds.has(adapter.kind)) {
      const payload = section.data as { schemaVersion?: unknown; entries?: Array<{ questId?: unknown; data?: unknown }> }
      if (payload.schemaVersion !== 1 || !Array.isArray(payload.entries) || !payload.entries.every((entry) => typeof entry.questId === 'string' && validateArchivePayload(adapter, entry.data) && (entry.data as { profileId?: unknown; questId?: unknown })?.profileId === archive.sourceProfileId && (entry.data as { questId?: unknown })?.questId === entry.questId)) return { ok: false, issue: `INVALID:${adapter.kind}` }
      continue
    }
    if (adapter.kind === 'learning-map-progress') {
      const payload = section.data as { schemaVersion?: unknown; entries?: Array<{ dataset?: unknown; textbookId?: unknown; data?: unknown }> }
      if (payload.schemaVersion !== 1 || !Array.isArray(payload.entries) || !payload.entries.every((entry) => typeof entry.dataset === 'string' && typeof entry.textbookId === 'string' && validateArchivePayload(adapter, entry.data) && (entry.data as { textbookId?: unknown }).textbookId === entry.textbookId)) return { ok: false, issue: 'INVALID:learning-map-progress' }
      continue
    }
    if (!validateArchivePayload(adapter, section.data)) return { ok: false, issue: `INVALID:${adapter.kind}` }
    if (adapter.kind === 'student-profile') { if ((section.data as { profile?: { id?: unknown } }).profile?.id !== archive.sourceProfileId) return { ok: false, issue: 'SCOPE:student-profile' }; continue }
    if (adapter.kind === 'curriculum-profile') { if ((section.data as { profile?: { studentId?: unknown } }).profile?.studentId !== archive.sourceProfileId) return { ok: false, issue: 'SCOPE:curriculum-profile' }; continue }
    if (adapter.collection) {
      const records = (section.data as Record<string, unknown>)[adapter.collection]
      if (!Array.isArray(records) || !records.every((record) => owned(record, archive.sourceProfileId, adapter.ownerField))) return { ok: false, issue: `SCOPE:${adapter.kind}` }
    } else if (adapter.ownerField && !owned(section.data, archive.sourceProfileId, adapter.ownerField)) return { ok: false, issue: `SCOPE:${adapter.kind}` }
  }
  return { ok: true, archive }
}
