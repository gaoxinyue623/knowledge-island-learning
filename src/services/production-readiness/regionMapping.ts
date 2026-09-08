import type {
  MvpCurriculumScope,
  ProductionCurriculumRecords,
  RegionMappingValidationReport,
} from '@/types'

import {
  isProductionCurriculumRecord,
  isProductionRelationRecord,
  isProductionSourceReference,
} from './productionGuard'

export function validateRegionMappings(
  records: ProductionCurriculumRecords,
  scope: MvpCurriculumScope,
  now = new Date(),
): RegionMappingValidationReport {
  const issues: string[] = []
  const effectiveRelationIds: string[] = []
  const releasedEntries = scope.entries.filter(
    (entry) => entry.status === 'RELEASED' && entry.textbookVersionId,
  )
  const textbooksById = new Map(records.textbooks.map((textbook) => [textbook.id, textbook]))
  const publishersById = new Map(records.publishers.map((publisher) => [publisher.id, publisher]))
  const sourceIds = new Set(
    records.sourceReferences.filter(isProductionSourceReference).map((source) => source.id),
  )
  const gradesById = new Map(records.grades.map((grade) => [grade.id, grade]))
  const semestersById = new Map(records.semesters.map((semester) => [semester.id, semester]))
  const subjectsById = new Map(records.subjects.map((subject) => [subject.id, subject]))
  const today = now.toISOString().slice(0, 10)
  const defaults = new Map<string, string[]>()

  for (const entry of releasedEntries) {
    if (scope.selectionPolicy === 'MANUAL') continue
    const region = records.regions.find((candidate) => candidate.code === entry.regionCode)
    if (!region) {
      issues.push(`REGION_NOT_FOUND:${entry.id}`)
      continue
    }
    if (!isProductionCurriculumRecord(region)) issues.push(`REGION_NOT_RELEASE_READY:${region.id}`)
    const textbook = textbooksById.get(entry.textbookVersionId as string)
    if (!textbook) {
      issues.push(`TEXTBOOK_NOT_FOUND:${entry.textbookVersionId}`)
      continue
    }
    if (!isProductionCurriculumRecord(textbook)) {
      issues.push(`TEXTBOOK_NOT_RELEASE_READY:${textbook.id}`)
    }
    const publisher = publishersById.get(textbook.publisherId)
    if (!publisher || !isProductionCurriculumRecord(publisher)) {
      issues.push(`PUBLISHER_NOT_RELEASE_READY:${textbook.publisherId}`)
    }
    const grade = gradesById.get(textbook.gradeId)
    if (!grade || grade.sortOrder !== entry.grade) {
      issues.push(`GRADE_MAPPING_MISMATCH:${entry.id}`)
    }
    const semester = semestersById.get(textbook.semesterId)
    if (!semester || semester.code !== entry.semester) {
      issues.push(`SEMESTER_MAPPING_MISMATCH:${entry.id}`)
    }
    const subject = subjectsById.get(textbook.subjectId)
    if (!subject || subject.code !== entry.subjectCode) {
      issues.push(`SUBJECT_MAPPING_MISMATCH:${entry.id}`)
    }
    if (entry.publisherCode && (!publisher || publisher.code !== entry.publisherCode)) {
      issues.push(`PUBLISHER_MAPPING_MISMATCH:${entry.id}`)
    }
    if (!sourceIds.has(textbook.sourceId)) {
      issues.push(`TEXTBOOK_SOURCE_NOT_RELEASE_READY:${textbook.id}`)
    }
    if (publisher && !sourceIds.has(publisher.sourceId)) {
      issues.push(`PUBLISHER_SOURCE_NOT_RELEASE_READY:${publisher.id}`)
    }
    const relations = records.regionTextbookRelations.filter(
      (relation) => relation.regionId === region.id && relation.textbookVersionId === textbook.id,
    )
    if (relations.length === 0) {
      issues.push(`REGION_TEXTBOOK_RELATION_MISSING:${entry.id}`)
      continue
    }
    for (const relation of relations) {
      if (!isProductionRelationRecord(relation)) {
        issues.push(`REGION_TEXTBOOK_RELATION_NOT_RELEASE_READY:${relation.id}`)
        continue
      }
      if (
        relation.effectiveFrom > today ||
        (relation.effectiveTo && relation.effectiveTo < today)
      ) {
        issues.push(`REGION_TEXTBOOK_RELATION_OUT_OF_DATE:${relation.id}`)
        continue
      }
      if (!sourceIds.has(relation.sourceId)) {
        issues.push(`REGION_TEXTBOOK_SOURCE_MISSING:${relation.id}`)
        continue
      }
      effectiveRelationIds.push(relation.id)
      if (relation.usageType === 'DEFAULT') {
        const key = `${region.id}:${textbook.subjectId}:${textbook.gradeId}:${textbook.semesterId}`
        const ids = defaults.get(key) ?? []
        ids.push(relation.id)
        defaults.set(key, ids)
      }
    }
  }

  for (const [key, ids] of defaults) {
    if (ids.length > 1) issues.push(`REGION_MULTIPLE_DEFAULTS:${key}:${ids.join(',')}`)
  }

  if (releasedEntries.length === 0) issues.push('RELEASE_SCOPE_EMPTY')
  return {
    valid: issues.length === 0,
    issues: [...new Set(issues)].sort(),
    effectiveRelationIds: [...new Set(effectiveRelationIds)].sort(),
  }
}
