import type {
  CurriculumImportDiff,
  CurriculumImportEntityChanges,
  CurriculumImportPackage,
  ReviewedCurriculumOverwriteGuardResult,
} from '@/types'

type EntityGroup = keyof CurriculumImportDiff['byEntity']

const entityGroups: ReadonlyArray<{
  key: EntityGroup
  records: (pkg: CurriculumImportPackage) => Array<{ id: string }>
}> = [
  { key: 'textbook', records: (pkg) => [pkg.textbook] },
  { key: 'unit', records: (pkg) => pkg.units },
  { key: 'lesson', records: (pkg) => pkg.lessons },
  { key: 'knowledgePoint', records: (pkg) => pkg.knowledgePoints },
  { key: 'lessonKnowledgePoint', records: (pkg) => pkg.lessonKnowledgePoints },
  { key: 'knowledgeRelation', records: (pkg) => pkg.knowledgeRelations },
]

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableValue(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function buildCurriculumPackageFingerprint(pkg: CurriculumImportPackage): string {
  return stableValue(pkg)
}

function changesFor(
  previous: Array<{ id: string }>,
  next: Array<{ id: string }>,
): CurriculumImportEntityChanges {
  const previousById = new Map(previous.map((record) => [record.id, stableValue(record)]))
  const nextById = new Map(next.map((record) => [record.id, stableValue(record)]))
  const added = [...nextById.keys()].filter((id) => !previousById.has(id)).sort()
  const removed = [...previousById.keys()].filter((id) => !nextById.has(id)).sort()
  const updated = [...nextById.keys()]
    .filter((id) => previousById.has(id) && previousById.get(id) !== nextById.get(id))
    .sort()
  return { added, updated, removed }
}

export function diffCurriculumPackages(
  previous: CurriculumImportPackage,
  next: CurriculumImportPackage,
): CurriculumImportDiff {
  const byEntity = Object.fromEntries(
    entityGroups.map(({ key, records }) => [key, changesFor(records(previous), records(next))]),
  ) as CurriculumImportDiff['byEntity']
  const previousFingerprint = buildCurriculumPackageFingerprint(previous)
  const nextFingerprint = buildCurriculumPackageFingerprint(next)
  return {
    previousFingerprint,
    nextFingerprint,
    unchanged: previousFingerprint === nextFingerprint,
    byEntity,
  }
}

export function guardReviewedCurriculumOverwrite(
  previous: CurriculumImportPackage,
  next: CurriculumImportPackage,
): ReviewedCurriculumOverwriteGuardResult {
  const sameIdentity =
    previous.textbook.textbookIdentityKey === next.textbook.textbookIdentityKey &&
    previous.textbook.identity.stage === next.textbook.identity.stage &&
    previous.textbook.identity.subjectCode === next.textbook.identity.subjectCode &&
    previous.textbook.identity.grade === next.textbook.identity.grade &&
    previous.textbook.identity.semester === next.textbook.identity.semester &&
    previous.textbook.identity.publisherCode === next.textbook.identity.publisherCode
  const changed = !diffCurriculumPackages(previous, next).unchanged
  if (previous.metadata.verificationStatus !== 'REVIEWED' || !sameIdentity || !changed) {
    return { allowed: true, requiresNewIdentity: false }
  }
  if (next.metadata.verificationStatus === 'REVIEWED') {
    return {
      allowed: false,
      requiresNewIdentity: true,
      reason: '已 REVIEWED 的教材不能被同一身份的新版本静默覆盖。',
    }
  }
  return {
    allowed: true,
    requiresNewIdentity: false,
    reason: '变更包必须保留在重新审核状态，不能直接成为已审核版本。',
  }
}
