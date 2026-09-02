import type { Id, LearningEvidence, MasteryRecord } from '@/types'

import { masteryStorage, type MasteryStorage } from './masteryStorage'

export interface MasteryRepository {
  getMasteryRecord(studentProfileId: Id, knowledgePointId: Id): MasteryRecord | null
  getMasteryRecords(studentProfileId: Id): MasteryRecord[]
  saveMasteryRecord(record: MasteryRecord): void
  saveMasteryRecords(records: readonly MasteryRecord[]): void
  getEvidence(studentProfileId: Id): LearningEvidence[]
  getEvidenceByKnowledgePoint(studentProfileId: Id, knowledgePointId: Id): LearningEvidence[]
  appendEvidence(evidence: readonly LearningEvidence[]): LearningEvidence[]
  replaceEvidenceForStudent(studentProfileId: Id, evidence: readonly LearningEvidence[]): void
  removeRecordsWhere(studentProfileId: Id, predicate: (record: MasteryRecord) => boolean): void
  clearStudent(studentProfileId: Id): void
  getLastWarning(): string | null
}

function recordKey(record: Pick<MasteryRecord, 'studentProfileId' | 'knowledgePointId'>): string {
  return `${record.studentProfileId}::${record.knowledgePointId}`
}

export function createMasteryRepository(
  storage: MasteryStorage = masteryStorage,
): MasteryRepository {
  return {
    getMasteryRecord(studentProfileId, knowledgePointId) {
      return (
        storage
          .loadRecords()
          .find(
            (record) =>
              record.studentProfileId === studentProfileId &&
              record.knowledgePointId === knowledgePointId,
          ) ?? null
      )
    },
    getMasteryRecords(studentProfileId) {
      return storage
        .loadRecords()
        .filter((record) => record.studentProfileId === studentProfileId)
        .sort((left, right) => recordKey(left).localeCompare(recordKey(right)))
    },
    saveMasteryRecord(record) {
      const records = storage
        .loadRecords()
        .filter((candidate) => recordKey(candidate) !== recordKey(record))
      storage.saveRecords([...records, { ...record }])
    },
    saveMasteryRecords(nextRecords) {
      const byKey = new Map(storage.loadRecords().map((record) => [recordKey(record), record]))
      for (const record of nextRecords) byKey.set(recordKey(record), { ...record })
      storage.saveRecords([...byKey.values()])
    },
    getEvidence(studentProfileId) {
      return storage
        .loadEvidence()
        .filter((evidence) => evidence.studentProfileId === studentProfileId)
        .sort(
          (left, right) =>
            left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id),
        )
    },
    getEvidenceByKnowledgePoint(studentProfileId, knowledgePointId) {
      return storage
        .loadEvidence()
        .filter(
          (evidence) =>
            evidence.studentProfileId === studentProfileId &&
            evidence.knowledgePointId === knowledgePointId,
        )
        .sort(
          (left, right) =>
            left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id),
        )
    },
    appendEvidence(nextEvidence) {
      const byId = new Map(storage.loadEvidence().map((evidence) => [evidence.id, evidence]))
      const appended: LearningEvidence[] = []
      for (const evidence of nextEvidence) {
        if (byId.has(evidence.id)) continue
        const copy = {
          ...evidence,
          source: { ...evidence.source },
          ...(evidence.metadata ? { metadata: { ...evidence.metadata } } : {}),
        }
        byId.set(evidence.id, copy)
        appended.push(copy)
      }
      storage.saveEvidence([...byId.values()])
      return appended
    },
    replaceEvidenceForStudent(studentProfileId, nextEvidence) {
      const retained = storage
        .loadEvidence()
        .filter((evidence) => evidence.studentProfileId !== studentProfileId)
      storage.saveEvidence([...retained, ...nextEvidence])
    },
    removeRecordsWhere(studentProfileId, predicate) {
      const records = storage
        .loadRecords()
        .filter((record) => record.studentProfileId !== studentProfileId || !predicate(record))
      storage.saveRecords(records)
    },
    clearStudent(studentProfileId) {
      const evidence = storage
        .loadEvidence()
        .filter((candidate) => candidate.studentProfileId !== studentProfileId)
      const records = storage
        .loadRecords()
        .filter((candidate) => candidate.studentProfileId !== studentProfileId)
      storage.saveEvidence(evidence)
      storage.saveRecords(records)
    },
    getLastWarning() {
      return storage.getLastWarning()
    },
  }
}

export const masteryRepository = createMasteryRepository()
