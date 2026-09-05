export interface OrphanRecoveryResult<T> {
  records: T[]
  droppedRecordIds: string[]
  diagnostics: string[]
}

/**
 * Storage recovery helper. It drops only records whose foreign key is absent;
 * it never mutates the supplied array and never invents a replacement ID.
 */
export function recoverOrphanRecords<T>(input: {
  records: readonly T[]
  knownIds: ReadonlySet<string>
  idOf: (record: T) => string
  foreignKeyOf: (record: T) => string
  label: string
}): OrphanRecoveryResult<T> {
  const records: T[] = []
  const droppedRecordIds: string[] = []
  const diagnostics: string[] = []
  for (const record of input.records) {
    const recordId = input.idOf(record)
    const foreignKey = input.foreignKeyOf(record)
    if (input.knownIds.has(foreignKey)) records.push(record)
    else {
      droppedRecordIds.push(recordId)
      diagnostics.push(`${input.label}: orphan ${recordId} -> ${foreignKey}`)
    }
  }
  return {
    records,
    droppedRecordIds: droppedRecordIds.sort(),
    diagnostics: diagnostics.sort(),
  }
}
