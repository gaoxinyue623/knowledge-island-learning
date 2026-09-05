import type {
  CurriculumBatchImportSummary,
  CurriculumBatchManifest,
  CurriculumBatchPackageInput,
  CurriculumBatchReportInput,
  CurriculumBatchReviewReport,
  CurriculumBatchSlot,
  CurriculumBatchSourceManifestEntry,
  CurriculumBatchSourceValidationReport,
  CurriculumImportPackage,
  SourceReference,
} from '@/types'

import { curriculumEvidenceRequirementStatuses, curriculumRegionalSelectionStatuses } from '@/types'

import {
  diffCurriculumPackages,
  buildCurriculumPackageFingerprint,
  guardReviewedCurriculumOverwrite,
} from '../production-readiness/curriculumImportDiff'

import { importCurriculumPackage } from './curriculumImporter'

const slotStatuses = new Set(['CONFIRMED', 'PARTIAL', 'UNVERIFIED', 'NOT_FOUND'])
const evidenceRequirementStatuses = new Set(curriculumEvidenceRequirementStatuses)
const regionalSelectionStatuses = new Set(curriculumRegionalSelectionStatuses)
const evidenceRequirementFields = [
  'coverEvidence',
  'copyrightPageEvidence',
  'tocEvidence',
  'regionalSelectionEvidence',
  'isbnEvidence',
] as const

function expectedSlotKeys(manifest: CurriculumBatchManifest): Set<string> {
  return new Set(
    manifest.subjects.flatMap((subject) =>
      manifest.semesters.map((semester) => `${subject}:${semester}`),
    ),
  )
}

function slotKey(subject: string, semester: number): string {
  return `${subject}:${semester}`
}

export function validateCurriculumBatchManifest(
  manifest: CurriculumBatchManifest,
  sourceManifest: readonly CurriculumBatchSourceManifestEntry[],
  sourceReferences: readonly SourceReference[],
): CurriculumBatchSourceValidationReport {
  const issues: string[] = []
  const missingSourceReferenceIds = new Set<string>()
  const duplicateManifestEntryIds: string[] = []
  const sourceReferenceIds = new Set(sourceReferences.map((source) => source.id))
  const seenManifestEntryIds = new Set<string>()

  if (manifest.grade !== 1 || manifest.regionCode !== 'CN-GD-SZ') {
    issues.push('BATCH_SCOPE_INVALID: Batch 01 必须限定为深圳小学一年级。')
  }
  if (manifest.schoolYear !== '2026-2027') {
    issues.push('BATCH_SCHOOL_YEAR_INVALID: Batch 01 目标学年必须为 2026-2027。')
  }
  if (manifest.slots.length !== 6) {
    issues.push(`BATCH_SLOT_COUNT_INVALID: 期望 6 个槽位，实际为 ${manifest.slots.length}。`)
  }

  const expectedKeys = expectedSlotKeys(manifest)
  const actualKeys = new Set<string>()
  const slotIds = new Set<string>()
  for (const slot of manifest.slots) {
    const key = slotKey(slot.subjectCode, slot.semester)
    if (actualKeys.has(key)) issues.push(`BATCH_SLOT_DUPLICATE: 槽位 ${key} 重复。`)
    actualKeys.add(key)
    if (!slotIds.has(slot.id)) slotIds.add(slot.id)
    else issues.push(`BATCH_SLOT_ID_DUPLICATE: 槽位 ID ${slot.id} 重复。`)
    if (!slotStatuses.has(slot.status)) {
      issues.push(`BATCH_SLOT_STATUS_INVALID: 槽位 ${slot.id} 状态无效。`)
    }
    if (!regionalSelectionStatuses.has(slot.regionalSelectionStatus)) {
      issues.push(`BATCH_REGIONAL_SELECTION_STATUS_INVALID: 槽位 ${slot.id} 地区选用状态无效。`)
    }
    if (slot.grade !== manifest.grade || slot.regionCode !== manifest.regionCode) {
      issues.push(`BATCH_SLOT_SCOPE_MISMATCH: 槽位 ${slot.id} 超出 Batch Scope。`)
    }
    if (
      !manifest.subjects.includes(slot.subjectCode) ||
      !manifest.semesters.includes(slot.semester)
    ) {
      issues.push(`BATCH_SLOT_TARGET_INVALID: 槽位 ${slot.id} 不在目标学科/学期矩阵内。`)
    }
    if (!seenManifestEntryIds.has(slot.sourceManifestEntryId)) {
      seenManifestEntryIds.add(slot.sourceManifestEntryId)
    } else {
      duplicateManifestEntryIds.push(slot.sourceManifestEntryId)
    }
    const sourceEntry = sourceManifest.find((source) => source.id === slot.sourceManifestEntryId)
    if (!sourceEntry) {
      issues.push(`BATCH_SOURCE_MANIFEST_ENTRY_MISSING: ${slot.sourceManifestEntryId}。`)
    } else {
      if (
        sourceEntry.regionCode !== slot.regionCode ||
        sourceEntry.schoolYear !== slot.schoolYear ||
        sourceEntry.grade !== slot.grade ||
        sourceEntry.semester !== slot.semester ||
        sourceEntry.subject !== slot.subjectCode
      ) {
        issues.push(`BATCH_SOURCE_SLOT_MISMATCH: ${slot.id} 与来源清单槽位不一致。`)
      }
      for (const sourceId of sourceEntry.sourceReferenceIds) {
        if (!sourceReferenceIds.has(sourceId)) missingSourceReferenceIds.add(sourceId)
      }
      if (!sourceEntry.evidenceRequirements) {
        issues.push(`BATCH_EVIDENCE_REQUIREMENTS_MISSING: ${sourceEntry.id}。`)
      } else {
        for (const field of evidenceRequirementFields) {
          if (!evidenceRequirementStatuses.has(sourceEntry.evidenceRequirements[field])) {
            issues.push(`BATCH_EVIDENCE_REQUIREMENT_INVALID: ${sourceEntry.id}.${field}。`)
          }
        }
      }
      if (!regionalSelectionStatuses.has(sourceEntry.regionalSelectionStatus)) {
        issues.push(
          `BATCH_SOURCE_REGIONAL_SELECTION_STATUS_INVALID: ${sourceEntry.id} 地区选用状态无效。`,
        )
      }
    }
    for (const sourceId of slot.sourceReferenceIds) {
      if (!sourceReferenceIds.has(sourceId)) missingSourceReferenceIds.add(sourceId)
    }
    if (!slot.evidenceRequirements) {
      issues.push(`BATCH_SLOT_EVIDENCE_REQUIREMENTS_MISSING: ${slot.id}。`)
    } else {
      for (const field of evidenceRequirementFields) {
        if (!evidenceRequirementStatuses.has(slot.evidenceRequirements[field])) {
          issues.push(`BATCH_SLOT_EVIDENCE_REQUIREMENT_INVALID: ${slot.id}.${field}。`)
        }
      }
    }
    if (slot.packageId && !manifest.packages.some((pkg) => pkg.packageId === slot.packageId)) {
      issues.push(`BATCH_PACKAGE_DESCRIPTOR_MISSING: ${slot.packageId}。`)
    }
    if (slot.status === 'CONFIRMED' && !slot.textbookVersionId) {
      issues.push(`BATCH_CONFIRMED_IDENTITY_MISSING: 槽位 ${slot.id} 缺少 textbookVersionId。`)
    }
  }

  for (const expected of expectedKeys) {
    if (!actualKeys.has(expected)) issues.push(`BATCH_SLOT_MISSING: 缺少槽位 ${expected}。`)
  }
  for (const actual of actualKeys) {
    if (!expectedKeys.has(actual)) issues.push(`BATCH_SLOT_UNEXPECTED: 多余槽位 ${actual}。`)
  }
  if (new Set(manifest.sourceManifestEntryIds).size !== manifest.sourceManifestEntryIds.length) {
    issues.push('BATCH_SOURCE_MANIFEST_ID_DUPLICATE: manifest source entry ID 重复。')
  }
  for (const entryId of manifest.sourceManifestEntryIds) {
    if (!sourceManifest.some((entry) => entry.id === entryId)) {
      issues.push(`BATCH_SOURCE_MANIFEST_ENTRY_MISSING: ${entryId}。`)
    }
  }

  const packageIds = new Set<string>()
  const packageSlotIds = new Set<string>()
  for (const descriptor of manifest.packages) {
    if (packageIds.has(descriptor.packageId)) {
      issues.push(`BATCH_PACKAGE_ID_DUPLICATE: ${descriptor.packageId}。`)
    }
    packageIds.add(descriptor.packageId)
    if (packageSlotIds.has(descriptor.slotId)) {
      issues.push(`BATCH_PACKAGE_SLOT_DUPLICATE: 槽位 ${descriptor.slotId} 存在多个包。`)
    }
    packageSlotIds.add(descriptor.slotId)
    if (!slotIds.has(descriptor.slotId)) {
      issues.push(`BATCH_PACKAGE_SLOT_UNKNOWN: ${descriptor.slotId}。`)
    }
    if (!descriptor.relativePath.trim())
      issues.push(`BATCH_PACKAGE_PATH_EMPTY: ${descriptor.packageId}。`)
  }
  for (const slot of manifest.slots) {
    if (slot.packageId && !packageIds.has(slot.packageId)) {
      issues.push(`BATCH_PACKAGE_ID_UNKNOWN: ${slot.packageId}。`)
    }
  }

  return {
    valid: issues.length === 0 && missingSourceReferenceIds.size === 0,
    issues,
    missingSourceReferenceIds: [...missingSourceReferenceIds].sort(),
    duplicateManifestEntryIds: [...new Set(duplicateManifestEntryIds)].sort(),
  }
}

function emptyPackageForDiff(pkg: CurriculumImportPackage): CurriculumImportPackage {
  return {
    ...pkg,
    textbook: { ...pkg.textbook, id: `${pkg.textbook.id}__EMPTY_PREVIOUS` },
    units: [],
    lessons: [],
    knowledgePoints: [],
    lessonKnowledgePoints: [],
    knowledgeRelations: [],
  }
}

export function buildCurriculumBatchImportSummary(
  input: CurriculumBatchPackageInput,
): CurriculumBatchImportSummary {
  const result = importCurriculumPackage(input.package)
  const diff = diffCurriculumPackages(emptyPackageForDiff(input.package), input.package)
  const overwriteGuard = input.previousPackage
    ? guardReviewedCurriculumOverwrite(input.previousPackage, input.package)
    : { allowed: true, requiresNewIdentity: false }
  const issues = [...result.errors, ...result.warnings].map(
    (issue) => `${issue.code}: ${issue.message}`,
  )
  if (!overwriteGuard.allowed) {
    issues.push(
      `REVIEWED_OVERWRITE_BLOCKED: ${overwriteGuard.reason ?? '已审核教材不能被静默覆盖。'}`,
    )
  }
  return {
    packageId: input.descriptor.packageId,
    slotId: input.descriptor.slotId,
    success: result.success,
    reportStatus: result.report.finalResult,
    fingerprint: buildCurriculumPackageFingerprint(input.package),
    imported: result.imported,
    diff,
    reviewedOverwriteGuard: overwriteGuard.allowed ? 'PASS' : 'FAIL',
    releaseEligible:
      result.success && result.report.finalResult === 'PASS' && overwriteGuard.allowed,
    issues,
  }
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

export function buildCurriculumBatchReviewReport(
  input: CurriculumBatchReportInput,
): CurriculumBatchReviewReport {
  const candidates = input.packageInputs.flatMap((current) => current.package.knowledgePoints)
  const occurrenceByCode = new Map<string, number>()
  for (const candidate of candidates) {
    occurrenceByCode.set(candidate.code, (occurrenceByCode.get(candidate.code) ?? 0) + 1)
  }
  const reusedKnowledgePointCount = [...occurrenceByCode.values()].filter(
    (count) => count > 1,
  ).length
  const uniqueKnowledgePointCount = occurrenceByCode.size
  const relevantSourceIds = new Set(input.manifest.slots.flatMap((slot) => slot.sourceReferenceIds))
  const sourceReferenceCount = input.sourceReferences.filter((source) =>
    relevantSourceIds.has(source.id),
  ).length
  const manualReviewItems = unique(
    input.manifest.slots.flatMap((slot) =>
      slot.manualReviewItems.map((item) => `${slot.id}: ${item}`),
    ),
  )
  const blockingSourceGaps = unique(input.manifest.slots.flatMap((slot) => slot.blockingSourceGaps))
  const validatedPackageCount = input.packageSummaries.filter((summary) => summary.success).length
  const allPackageValidationPassed = validatedPackageCount === input.packageSummaries.length
  const importDiffPassed = input.packageSummaries.every(
    (summary) =>
      summary.diff.byEntity.textbook.added.length === 1 &&
      summary.diff.byEntity.unit.added.length === summary.imported.units &&
      summary.diff.byEntity.lesson.added.length === summary.imported.lessons &&
      summary.diff.byEntity.knowledgePoint.added.length === summary.imported.knowledgePoints &&
      summary.diff.byEntity.lessonKnowledgePoint.added.length ===
        summary.imported.lessonKnowledgePoints &&
      summary.diff.byEntity.knowledgeRelation.added.length === summary.imported.knowledgeRelations,
  )
  const dagPassed = input.packageSummaries.every(
    (summary) => !summary.issues.some((issue) => issue.startsWith('KNOWLEDGE_PREREQUISITE_CYCLE')),
  )
  const confirmedSlotCount = input.manifest.slots.filter(
    (slot) => slot.status === 'CONFIRMED',
  ).length
  const partialSlotCount = input.manifest.slots.filter((slot) => slot.status === 'PARTIAL').length
  const unverifiedSlotCount = input.manifest.slots.filter(
    (slot) => slot.status === 'UNVERIFIED',
  ).length
  const notFoundSlotCount = input.manifest.slots.filter(
    (slot) => slot.status === 'NOT_FOUND',
  ).length
  const packageSummaryBySlotId = new Map(
    input.packageSummaries.map((summary) => [summary.slotId, summary]),
  )
  const allConfirmedSlotsHaveEligiblePackages = input.manifest.slots
    .filter((slot) => slot.status === 'CONFIRMED')
    .every((slot) => packageSummaryBySlotId.get(slot.id)?.releaseEligible === true)
  const allPackagesReleaseEligible =
    input.packageSummaries.length > 0 &&
    input.packageSummaries.every((summary) => summary.releaseEligible)
  const status =
    confirmedSlotCount === input.manifest.slots.length &&
    allConfirmedSlotsHaveEligiblePackages &&
    allPackagesReleaseEligible
      ? 'REVIEWED'
      : confirmedSlotCount > 0
        ? 'PARTIALLY_REVIEWED'
        : 'REQUIRES_MANUAL_REVIEW'
  const productionIndexChange = input.manifest.slots.some(
    (slot) =>
      slot.status === 'CONFIRMED' && packageSummaryBySlotId.get(slot.id)?.releaseEligible === true,
  )
    ? 'YES'
    : 'NO'

  return {
    batchId: input.manifest.id,
    status,
    slotCount: input.manifest.slots.length,
    confirmedSlotCount,
    partialSlotCount,
    unverifiedSlotCount,
    notFoundSlotCount,
    packageCount: input.packageInputs.length,
    validatedPackageCount,
    sourceReferenceCount,
    textbookCount: input.packageInputs.length,
    unitCount: input.packageInputs.reduce(
      (total, current) => total + current.package.units.length,
      0,
    ),
    lessonCount: input.packageInputs.reduce(
      (total, current) => total + current.package.lessons.length,
      0,
    ),
    knowledgePointCandidateCount: uniqueKnowledgePointCount,
    reusedKnowledgePointCount,
    newKnowledgePointCount: uniqueKnowledgePointCount - reusedKnowledgePointCount,
    lessonKnowledgePointCount: input.packageInputs.reduce(
      (total, current) => total + current.package.lessonKnowledgePoints.length,
      0,
    ),
    knowledgeRelationCount: input.packageInputs.reduce(
      (total, current) => total + current.package.knowledgeRelations.length,
      0,
    ),
    importValidation: allPackageValidationPassed ? 'PASS' : 'FAIL',
    integrityValidation: allPackageValidationPassed ? 'PASS' : 'FAIL',
    dagValidation: dagPassed ? 'PASS' : 'FAIL',
    importDiff: importDiffPassed ? 'PASS' : 'FAIL',
    reviewedOverwriteGuard: input.packageSummaries.every(
      (summary) => summary.reviewedOverwriteGuard === 'PASS',
    )
      ? 'PASS'
      : 'FAIL',
    productionIndexChange,
    manualReviewItems,
    blockingSourceGaps,
    packageSummaries: [...input.packageSummaries],
  }
}

export function renderCurriculumBatchReport(
  input: CurriculumBatchReportInput,
  report = buildCurriculumBatchReviewReport(input),
): string {
  const slotRows = input.manifest.slots
    .map(
      (slot) =>
        `| ${slot.subjectCode} / ${slot.semester === 1 ? '上册' : '下册'} | ${slot.status} | ${slot.publisher ?? '未确认'} | ${slot.textbookTitle ?? 'NOT_CONFIRMED'} | ${slot.candidateSeries ?? 'UNKNOWN'} | ${slot.candidateRevision ?? 'UNKNOWN'} | ${slot.candidatePublication ?? 'UNKNOWN'} | ${slot.candidateIsbn ?? 'UNKNOWN'} | ${slot.candidateTextbookIdentifier ?? 'UNKNOWN'} | ${slot.packageId ? '候选包' : '无包'} |`,
    )
    .join('\n')
  const statusRows = (status: CurriculumBatchSlot['status']): string => {
    const slots = input.manifest.slots.filter((slot) => slot.status === status)
    return slots.length > 0
      ? slots
          .map(
            (slot) =>
              `- ${slot.subjectCode} ${slot.semester === 1 ? '上册' : '下册'}（${slot.id}）`,
          )
          .join('\n')
      : '- 无'
  }
  const packageRows = report.packageSummaries
    .map(
      (summary) =>
        `| ${summary.packageId} | ${summary.reportStatus} | ${summary.imported.units} | ${summary.imported.lessons} | ${summary.imported.knowledgePoints} | ${summary.imported.lessonKnowledgePoints} | ${summary.imported.knowledgeRelations} | ${summary.releaseEligible ? 'YES' : 'NO'} |`,
    )
    .join('\n')
  const manualRows = report.manualReviewItems.map((item) => `- ${item}`).join('\n')
  const gapRows = report.blockingSourceGaps.map((gap) => `- ${gap}`).join('\n')
  return `# CURRICULUM DATA BATCH 01 Report

## Scope

| 项目 | 值 |
| --- | --- |
| Batch ID | \`${report.batchId}\` |
| Region | ${input.manifest.regionName} (\`${input.manifest.regionCode}\`) |
| SchoolYear | ${input.manifest.schoolYear} |
| Grade | ${input.manifest.grade} |
| Final status | \`${report.status}\` |
| Production Index changes | \`${report.productionIndexChange}\` |

本报告描述当前 BATCH 01 的调查、候选结构导入和审核待办状态。候选数据不是事实确认，也不会自动进入 Production Index。

## 6-slot Matrix

| 槽位 | 调查结果 | 出版社候选 | 教材身份 | 系列候选 | 版本候选 | 出版标识 | ISBN 候选 | 教材识别码候选 | Import Package |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${slotRows}

统计：${report.slotCount} 个槽位；CONFIRMED ${report.confirmedSlotCount}，PARTIAL ${report.partialSlotCount}，UNVERIFIED ${report.unverifiedSlotCount}，NOT_FOUND ${report.notFoundSlotCount}。

### Confirmed

${statusRows('CONFIRMED')}

### Partial

${statusRows('PARTIAL')}

### Unverified

${statusRows('UNVERIFIED')}

### Not Found

${statusRows('NOT_FOUND')}

## Source Summary

- SourceReference Count：${report.sourceReferenceCount}
- Selection source 与 textbook/catalog source 分开记录；历史来源不能证明当前学年。
- 本次新增的公开证据只支持教材存在、候选身份、候选目录或本地教育资源线索；不支持 2026—2027 深圳当前地区选用。
- 没有真实人工 reviewer，因此没有任何实体推进到 REVIEWED。

## Candidate Dataset Counts

| 指标 | 数量 |
| --- | ---: |
| Textbook candidate | ${report.textbookCount} |
| Unit | ${report.unitCount} |
| Lesson | ${report.lessonCount} |
| KnowledgePoint candidate（去重后） | ${report.knowledgePointCandidateCount} |
| Reused KnowledgePoint candidate | ${report.reusedKnowledgePointCount} |
| New KnowledgePoint candidate | ${report.newKnowledgePointCount} |
| LessonKnowledgePoint | ${report.lessonKnowledgePointCount} |
| KnowledgeRelation | ${report.knowledgeRelationCount} |

## Import Packages

| Package | Import report | Unit | Lesson | KnowledgePoint | Mapping | Relation | Release eligible |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
${packageRows}

Package 初始状态全部为 UNVERIFIED；没有完整 LearningContent 或 Question 批量生成。

## Validation

| 检查 | 结果 |
| --- | --- |
| Batch manifest / 6-slot matrix | ${input.manifest.slots.length === 6 ? 'PASS' : 'FAIL'} |
| Import validation | ${report.importValidation} |
| Integrity validation | ${report.integrityValidation} |
| prerequisite DAG | ${report.dagValidation} |
| Existing import diff | ${report.importDiff} |
| Reviewed overwrite guard | ${report.reviewedOverwriteGuard} |
| SAMPLE leak | PASS（候选包未标记 SAMPLE；仍不可生产发布） |
| Production Index | ${report.productionIndexChange} |

## Manual Review Items

${manualRows}

## Blocking Source Gaps

${gapRows}

## Batch Decision

**${report.status}**

Batch 01 没有全部 REVIEWED。六个槽位现在均为 PARTIAL：公开资料补充了候选出版社、版本、ISBN/识别码或本地资源线索，但没有任何槽位获得 2026—2027 深圳当前地区选用确认。英语一年级是否存在统一正式教材仍必须人工确认，不能由历史材料或模型记忆推断。

下一边界：完成 Batch 01 的原书和地区选用人工核验；本次不生成 Batch 02，不扩展年级/地区，也不进入 PHASE 17。
`
}
