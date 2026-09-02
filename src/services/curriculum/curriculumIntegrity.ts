import type {
  CurriculumImportPackage,
  CurriculumReviewReport,
  CurriculumValidationIssue,
  KnowledgePointImportData,
  LessonImportData,
  LessonKnowledgePointImportData,
  KnowledgeRelationImportData,
  ProvenanceMetadata,
  TextbookImportData,
  UnitImportData,
} from '@/types'

import { buildTextbookIdentityKey } from './textbookIdentity'

type ImportedEntity =
  | TextbookImportData
  | UnitImportData
  | LessonImportData
  | KnowledgePointImportData
  | LessonKnowledgePointImportData
  | KnowledgeRelationImportData

type ImportedEntityType =
  | 'textbook'
  | 'unit'
  | 'lesson'
  | 'knowledge_point'
  | 'lesson_knowledge_point'
  | 'knowledge_relation'

interface EntityGroup {
  entityType: ImportedEntityType
  records: ImportedEntity[]
}

const entityGroups = (pkg: CurriculumImportPackage): EntityGroup[] => [
  { entityType: 'textbook', records: [pkg.textbook] },
  { entityType: 'unit', records: pkg.units },
  { entityType: 'lesson', records: pkg.lessons },
  { entityType: 'knowledge_point', records: pkg.knowledgePoints },
  { entityType: 'lesson_knowledge_point', records: pkg.lessonKnowledgePoints },
  { entityType: 'knowledge_relation', records: pkg.knowledgeRelations },
]

function issue(
  code: string,
  severity: CurriculumValidationIssue['severity'],
  message: string,
  entityType?: string,
  entityId?: string,
  field?: string,
): CurriculumValidationIssue {
  return { code, severity, message, entityType, entityId, field }
}

function addIssue(
  issues: CurriculumValidationIssue[],
  code: string,
  severity: CurriculumValidationIssue['severity'],
  message: string,
  entityType?: string,
  entityId?: string,
  field?: string,
): void {
  issues.push(issue(code, severity, message, entityType, entityId, field))
}

function validateVerificationMetadata(
  pkg: CurriculumImportPackage,
  record: ImportedEntity,
  entityType: ImportedEntityType,
  issues: CurriculumValidationIssue[],
): void {
  const isSample = record.isSample === true || record.verificationStatus === 'SAMPLE'
  if (isSample && record.verificationStatus !== 'SAMPLE') {
    addIssue(
      issues,
      'SAMPLE_STATUS_CONFLICT',
      'error',
      'isSample 记录只能使用 verificationStatus=SAMPLE。',
      entityType,
      record.id,
      'verificationStatus',
    )
  }
  if (record.verificationStatus === 'SAMPLE' && record.isSample !== true) {
    addIssue(
      issues,
      'SAMPLE_FLAG_REQUIRED',
      'error',
      'verificationStatus=SAMPLE 的记录必须保留 isSample=true。',
      entityType,
      record.id,
      'isSample',
    )
  }
  if (record.verificationStatus === 'SAMPLE' && record.needsVerification !== true) {
    addIssue(
      issues,
      'SAMPLE_REVIEW_FLAG_REQUIRED',
      'error',
      'SAMPLE 记录必须保留 needsVerification=true。',
      entityType,
      record.id,
      'needsVerification',
    )
  }
  if (record.id.startsWith('SAMPLE_') && record.verificationStatus !== 'SAMPLE') {
    addIssue(
      issues,
      'SAMPLE_ID_POLLUTION',
      'error',
      'SAMPLE_* ID 不能进入非 SAMPLE 验证数据集。',
      entityType,
      record.id,
      'id',
    )
  }
  if (pkg.metadata.verificationStatus !== 'SAMPLE' && isSample) {
    addIssue(
      issues,
      'SAMPLE_DATA_POLLUTION',
      'error',
      '非 SAMPLE 导入包不能包含 SAMPLE 记录。',
      entityType,
      record.id,
      'verificationStatus',
    )
  }
  if (pkg.metadata.verificationStatus === 'REVIEWED' && record.verificationStatus !== 'REVIEWED') {
    addIssue(
      issues,
      'PACKAGE_REVIEW_STATUS_MISMATCH',
      'error',
      '标记为 REVIEWED 的导入包不能包含未进入 REVIEWED 的实体。',
      entityType,
      record.id,
      'verificationStatus',
    )
  }
  if (
    (record.verificationStatus === 'VERIFIED' || record.verificationStatus === 'REVIEWED') &&
    record.needsVerification === true
  ) {
    addIssue(
      issues,
      'VERIFICATION_FLAG_CONFLICT',
      'error',
      'VERIFIED / REVIEWED 记录不能继续标记 needsVerification=true。',
      entityType,
      record.id,
      'needsVerification',
    )
  }
  if (record.verificationStatus === 'REVIEWED') {
    if (!record.verifiedAt || !record.verifiedBy) {
      addIssue(
        issues,
        'REVIEW_METADATA_REQUIRED',
        'error',
        'REVIEWED 记录必须记录 verifiedAt 和 verifiedBy。',
        entityType,
        record.id,
      )
    }
  }
}

function validateProvenance(
  record: ProvenanceMetadata & { id: string },
  entityType: ImportedEntityType,
  sourceIds: ReadonlySet<string>,
  issues: CurriculumValidationIssue[],
): void {
  if (record.sourceReferenceIds.length === 0) {
    addIssue(
      issues,
      'SOURCE_REFERENCE_REQUIRED',
      'error',
      '正式课程实体至少需要一个 sourceReferenceId。',
      entityType,
      record.id,
      'sourceReferenceIds',
    )
  }
  for (const sourceReferenceId of record.sourceReferenceIds) {
    if (!sourceIds.has(sourceReferenceId)) {
      addIssue(
        issues,
        'SOURCE_REFERENCE_NOT_FOUND',
        'error',
        `sourceReferenceId ${sourceReferenceId} 不存在。`,
        entityType,
        record.id,
        'sourceReferenceIds',
      )
    }
  }
}

function validateEntityIds(
  pkg: CurriculumImportPackage,
  groups: EntityGroup[],
  sourceIds: ReadonlySet<string>,
  issues: CurriculumValidationIssue[],
): void {
  const entityIds = new Map<string, ImportedEntityType>()
  for (const group of groups) {
    for (const record of group.records) {
      const previousType = entityIds.get(record.id)
      if (previousType) {
        addIssue(
          issues,
          'DUPLICATE_ID',
          'error',
          `ID ${record.id} 已被 ${previousType} 使用。`,
          group.entityType,
          record.id,
          'id',
        )
      } else {
        entityIds.set(record.id, group.entityType)
      }
      validateVerificationMetadata(pkg, record, group.entityType, issues)
      validateProvenance(record, group.entityType, sourceIds, issues)
    }
  }
}

function validateTextbook(
  pkg: CurriculumImportPackage,
  units: UnitImportData[],
  issues: CurriculumValidationIssue[],
): void {
  const textbook = pkg.textbook
  if (!textbook.title.trim()) {
    addIssue(
      issues,
      'TEXTBOOK_TITLE_REQUIRED',
      'error',
      '教材 title 不能为空。',
      'textbook',
      textbook.id,
      'title',
    )
  }
  const expectedKey = buildTextbookIdentityKey(textbook.identity)
  if (textbook.textbookIdentityKey && textbook.textbookIdentityKey !== expectedKey) {
    addIssue(
      issues,
      'TEXTBOOK_IDENTITY_KEY_MISMATCH',
      'error',
      `textbookIdentityKey 应为 ${expectedKey}。`,
      'textbook',
      textbook.id,
      'textbookIdentityKey',
    )
  }
  if (units.length === 0) {
    addIssue(
      issues,
      'TEXTBOOK_UNITS_REQUIRED',
      'error',
      '教材至少需要一个 Unit。',
      'textbook',
      textbook.id,
      'units',
    )
  }
}

export function validateTextbookIdentityUniqueness(
  textbooks: TextbookImportData[],
): CurriculumValidationIssue[] {
  const issues: CurriculumValidationIssue[] = []
  const keys = new Map<string, string>()
  for (const textbook of textbooks) {
    const key = buildTextbookIdentityKey(textbook.identity)
    const currentId = keys.get(key)
    if (currentId && currentId !== textbook.id) {
      addIssue(
        issues,
        'DUPLICATE_TEXTBOOK_IDENTITY',
        'error',
        `教材身份 ${key} 已被 ${currentId} 使用。`,
        'textbook',
        textbook.id,
        'identity',
      )
    } else {
      keys.set(key, textbook.id)
    }
  }
  return issues
}

function validateUnits(
  units: UnitImportData[],
  textbookId: string,
  issues: CurriculumValidationIssue[],
): void {
  const unitNos = new Map<number, string>()
  const sorts = new Map<number, string>()
  for (const unit of units) {
    if (unit.textbookId !== textbookId) {
      addIssue(
        issues,
        'UNIT_TEXTBOOK_REF_INVALID',
        'error',
        `Unit ${unit.id} 的 textbookId 必须指向 ${textbookId}。`,
        'unit',
        unit.id,
        'textbookId',
      )
    }
    if (!unit.title.trim()) {
      addIssue(
        issues,
        'UNIT_TITLE_REQUIRED',
        'error',
        'Unit title 不能为空。',
        'unit',
        unit.id,
        'title',
      )
    }
    const previousUnit = unitNos.get(unit.unitNo)
    if (previousUnit) {
      addIssue(
        issues,
        'DUPLICATE_UNIT_NO',
        'error',
        `unitNo ${unit.unitNo} 重复。`,
        'unit',
        unit.id,
        'unitNo',
      )
    } else unitNos.set(unit.unitNo, unit.id)
    const previousSort = sorts.get(unit.sort)
    if (previousSort) {
      addIssue(
        issues,
        'DUPLICATE_UNIT_SORT',
        'error',
        `Unit sort ${unit.sort} 重复。`,
        'unit',
        unit.id,
        'sort',
      )
    } else sorts.set(unit.sort, unit.id)
  }
}

function validateLessons(
  lessons: LessonImportData[],
  units: ReadonlySet<string>,
  mappings: LessonKnowledgePointImportData[],
  issues: CurriculumValidationIssue[],
): void {
  const unitNumbers = new Map<string, Map<number, string>>()
  const unitSorts = new Map<string, Map<number, string>>()
  for (const lesson of lessons) {
    if (!units.has(lesson.unitId)) {
      addIssue(
        issues,
        'LESSON_UNIT_REF_INVALID',
        'error',
        `Lesson ${lesson.id} 的 unitId ${lesson.unitId} 不存在。`,
        'lesson',
        lesson.id,
        'unitId',
      )
    }
    if (!lesson.title.trim()) {
      addIssue(
        issues,
        'LESSON_TITLE_REQUIRED',
        'error',
        'Lesson title 不能为空。',
        'lesson',
        lesson.id,
        'title',
      )
    }
    const lessonNos = unitNumbers.get(lesson.unitId) ?? new Map<number, string>()
    if (lessonNos.has(lesson.lessonNo)) {
      addIssue(
        issues,
        'DUPLICATE_LESSON_NO',
        'error',
        `unit ${lesson.unitId} 中 lessonNo ${lesson.lessonNo} 重复。`,
        'lesson',
        lesson.id,
        'lessonNo',
      )
    } else lessonNos.set(lesson.lessonNo, lesson.id)
    unitNumbers.set(lesson.unitId, lessonNos)

    const sorts = unitSorts.get(lesson.unitId) ?? new Map<number, string>()
    if (sorts.has(lesson.sort)) {
      addIssue(
        issues,
        'DUPLICATE_LESSON_SORT',
        'error',
        `unit ${lesson.unitId} 中 lesson sort ${lesson.sort} 重复。`,
        'lesson',
        lesson.id,
        'sort',
      )
    } else sorts.set(lesson.sort, lesson.id)
    unitSorts.set(lesson.unitId, sorts)

    const mappingCount = mappings.filter((mapping) => mapping.lessonId === lesson.id).length
    if (mappingCount === 0 && !lesson.mappingSkipReason) {
      addIssue(
        issues,
        'LESSON_MAPPING_REQUIRED',
        'error',
        '正式 Lesson 至少需要一个 LessonKnowledgePoint 映射，或填写 mappingSkipReason。',
        'lesson',
        lesson.id,
        'mappingSkipReason',
      )
    }
  }
}

function validateKnowledgePoints(
  knowledgePoints: KnowledgePointImportData[],
  textbook: TextbookImportData,
  issues: CurriculumValidationIssue[],
): void {
  const codes = new Map<string, string>()
  for (const knowledgePoint of knowledgePoints) {
    const previousId = codes.get(knowledgePoint.code)
    if (previousId) {
      addIssue(
        issues,
        'DUPLICATE_KNOWLEDGE_POINT_CODE',
        'error',
        `KnowledgePoint code ${knowledgePoint.code} 重复。`,
        'knowledge_point',
        knowledgePoint.id,
        'code',
      )
    } else codes.set(knowledgePoint.code, knowledgePoint.id)
    if (knowledgePoint.gradeStart > knowledgePoint.gradeEnd) {
      addIssue(
        issues,
        'KNOWLEDGE_POINT_GRADE_SCOPE_INVALID',
        'error',
        'KnowledgePoint gradeStart 不能大于 gradeEnd。',
        'knowledge_point',
        knowledgePoint.id,
        'gradeStart',
      )
    }
    if (!knowledgePoint.name.trim() || !knowledgePoint.description.trim()) {
      addIssue(
        issues,
        'KNOWLEDGE_POINT_TEXT_REQUIRED',
        'error',
        'KnowledgePoint name 和 description 不能为空。',
        'knowledge_point',
        knowledgePoint.id,
      )
    }
    if (
      knowledgePoint.gradeStart > textbook.identity.grade ||
      knowledgePoint.gradeEnd < textbook.identity.grade
    ) {
      addIssue(
        issues,
        'KNOWLEDGE_POINT_GRADE_MISMATCH',
        'warning',
        'KnowledgePoint 的年级范围没有覆盖教材年级，需人工确认。',
        'knowledge_point',
        knowledgePoint.id,
        'gradeStart',
      )
    }
  }
}

function validateMappings(
  mappings: LessonKnowledgePointImportData[],
  lessonIds: ReadonlySet<string>,
  knowledgePointIds: ReadonlySet<string>,
  issues: CurriculumValidationIssue[],
): void {
  const pairs = new Set<string>()
  for (const mapping of mappings) {
    if (!lessonIds.has(mapping.lessonId)) {
      addIssue(
        issues,
        'MAPPING_LESSON_REF_INVALID',
        'error',
        `LessonKnowledgePoint ${mapping.id} 的 lessonId 不存在。`,
        'lesson_knowledge_point',
        mapping.id,
        'lessonId',
      )
    }
    if (!knowledgePointIds.has(mapping.knowledgePointId)) {
      addIssue(
        issues,
        'MAPPING_KNOWLEDGE_POINT_REF_INVALID',
        'error',
        `LessonKnowledgePoint ${mapping.id} 的 knowledgePointId 不存在。`,
        'lesson_knowledge_point',
        mapping.id,
        'knowledgePointId',
      )
    }
    const pair = `${mapping.lessonId}::${mapping.knowledgePointId}`
    if (pairs.has(pair)) {
      addIssue(
        issues,
        'DUPLICATE_LESSON_KNOWLEDGE_POINT',
        'error',
        `Lesson ${mapping.lessonId} 与 KnowledgePoint ${mapping.knowledgePointId} 的映射重复。`,
        'lesson_knowledge_point',
        mapping.id,
      )
    }
    pairs.add(pair)
    if (mapping.weight <= 0 || mapping.weight > 1) {
      addIssue(
        issues,
        'MAPPING_WEIGHT_INVALID',
        'error',
        'LessonKnowledgePoint weight 必须大于 0 且不超过 1。',
        'lesson_knowledge_point',
        mapping.id,
        'weight',
      )
    }
  }
}

function validateKnowledgeRelations(
  relations: KnowledgeRelationImportData[],
  knowledgePointIds: ReadonlySet<string>,
  issues: CurriculumValidationIssue[],
): void {
  const adjacency = new Map<string, string[]>()
  for (const relation of relations) {
    const sourceExists = knowledgePointIds.has(relation.sourceKnowledgePointId)
    const targetExists = knowledgePointIds.has(relation.targetKnowledgePointId)
    if (!sourceExists || !targetExists) {
      addIssue(
        issues,
        'KNOWLEDGE_RELATION_REF_INVALID',
        'error',
        `KnowledgeRelation ${relation.id} 引用了不存在的 KnowledgePoint。`,
        'knowledge_relation',
        relation.id,
      )
    }
    if (relation.sourceKnowledgePointId === relation.targetKnowledgePointId) {
      addIssue(
        issues,
        'KNOWLEDGE_RELATION_SELF_REFERENCE',
        'error',
        'KnowledgeRelation 不能指向自身。',
        'knowledge_relation',
        relation.id,
      )
    }
    if (relation.relationType === 'prerequisite' && sourceExists && targetExists) {
      const next = adjacency.get(relation.sourceKnowledgePointId) ?? []
      next.push(relation.targetKnowledgePointId)
      adjacency.set(relation.sourceKnowledgePointId, next)
    }
  }

  const state = new Map<string, 'VISITING' | 'VISITED'>()
  const path: string[] = []
  const visit = (node: string): void => {
    const currentState = state.get(node)
    if (currentState === 'VISITED') return
    if (currentState === 'VISITING') {
      const cycleStart = path.indexOf(node)
      const cycle = [...path.slice(cycleStart), node].join(' -> ')
      addIssue(
        issues,
        'KNOWLEDGE_PREREQUISITE_CYCLE',
        'error',
        `prerequisite 关系存在循环：${cycle}。`,
        'knowledge_relation',
      )
      return
    }
    state.set(node, 'VISITING')
    path.push(node)
    for (const next of adjacency.get(node) ?? []) visit(next)
    path.pop()
    state.set(node, 'VISITED')
  }
  for (const knowledgePointId of knowledgePointIds) visit(knowledgePointId)
}

export function validateCurriculumImportPackage(
  pkg: CurriculumImportPackage,
): CurriculumValidationIssue[] {
  const issues: CurriculumValidationIssue[] = []
  const groups = entityGroups(pkg)
  const sourceIds = new Set<string>()
  for (const source of pkg.sources) {
    if (sourceIds.has(source.id)) {
      addIssue(
        issues,
        'DUPLICATE_SOURCE_REFERENCE_ID',
        'error',
        `SourceReference ID ${source.id} 重复。`,
        'source',
        source.id,
        'id',
      )
    }
    sourceIds.add(source.id)
    if (source.id.startsWith('SAMPLE_') && pkg.metadata.verificationStatus !== 'SAMPLE') {
      addIssue(
        issues,
        'SAMPLE_ID_POLLUTION',
        'error',
        'SAMPLE_* SourceReference ID 不能进入非 SAMPLE 验证数据集。',
        'source',
        source.id,
        'id',
      )
    }
  }

  validateEntityIds(pkg, groups, sourceIds, issues)
  validateTextbook(pkg, pkg.units, issues)
  issues.push(...validateTextbookIdentityUniqueness([pkg.textbook]))
  validateUnits(pkg.units, pkg.textbook.id, issues)
  validateLessons(
    pkg.lessons,
    new Set(pkg.units.map((unit) => unit.id)),
    pkg.lessonKnowledgePoints,
    issues,
  )
  validateKnowledgePoints(pkg.knowledgePoints, pkg.textbook, issues)
  validateMappings(
    pkg.lessonKnowledgePoints,
    new Set(pkg.lessons.map((lesson) => lesson.id)),
    new Set(pkg.knowledgePoints.map((knowledgePoint) => knowledgePoint.id)),
    issues,
  )
  validateKnowledgeRelations(
    pkg.knowledgeRelations,
    new Set(pkg.knowledgePoints.map((knowledgePoint) => knowledgePoint.id)),
    issues,
  )

  if (pkg.metadata.verificationStatus !== 'REVIEWED') {
    addIssue(
      issues,
      'MANUAL_REVIEW_REQUIRED',
      'warning',
      `导入包当前为 ${pkg.metadata.verificationStatus}，正式发布前必须完成人工审核并进入 REVIEWED。`,
      'textbook',
      pkg.textbook.id,
      'verificationStatus',
    )
  }
  return issues
}

function hasEntityError(
  issues: CurriculumValidationIssue[],
  entityType: string,
  entityId: string,
): boolean {
  return issues.some(
    (current) =>
      current.severity === 'error' &&
      current.entityType === entityType &&
      current.entityId === entityId,
  )
}

function validCount(
  records: ImportedEntity[],
  entityType: ImportedEntityType,
  issues: CurriculumValidationIssue[],
): number {
  return records.filter((record) => !hasEntityError(issues, entityType, record.id)).length
}

export function buildCurriculumReviewReport(
  pkg: CurriculumImportPackage,
  issues: CurriculumValidationIssue[],
): CurriculumReviewReport {
  const errors = issues.filter((current) => current.severity === 'error')
  const warnings = issues.filter((current) => current.severity === 'warning')
  const pendingManualReview = issues.filter(
    (current) =>
      current.code === 'MANUAL_REVIEW_REQUIRED' ||
      current.code === 'REVIEW_METADATA_REQUIRED' ||
      current.code.includes('SOURCE'),
  )
  const expectedIdentityKey = buildTextbookIdentityKey(pkg.textbook.identity)
  const samplePollution = issues.some(
    (current) => current.code === 'SAMPLE_DATA_POLLUTION' || current.code === 'SAMPLE_ID_POLLUTION',
  )
    ? 'FAIL'
    : 'PASS'
  const knowledgeDag = issues.some((current) => current.code === 'KNOWLEDGE_PREREQUISITE_CYCLE')
    ? 'FAIL'
    : 'PASS'
  const finalResult =
    errors.length > 0
      ? 'FAIL'
      : pkg.metadata.verificationStatus !== 'REVIEWED' || pendingManualReview.length > 0
        ? 'REQUIRES_MANUAL_REVIEW'
        : 'PASS'

  return {
    schemaVersion: pkg.schemaVersion,
    textbookId: pkg.textbook.id,
    textbookIdentityKey: pkg.textbook.textbookIdentityKey ?? expectedIdentityKey,
    generatedAt: pkg.metadata.generatedAt,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: issues.filter((current) => current.severity === 'info').length,
    },
    completeness: {
      textbook: !hasEntityError(issues, 'textbook', pkg.textbook.id),
      units: {
        total: pkg.units.length,
        valid: validCount(pkg.units, 'unit', issues),
      },
      lessons: {
        total: pkg.lessons.length,
        valid: validCount(pkg.lessons, 'lesson', issues),
      },
      knowledgePoints: {
        total: pkg.knowledgePoints.length,
        valid: validCount(pkg.knowledgePoints, 'knowledge_point', issues),
      },
      mappings: {
        total: pkg.lessonKnowledgePoints.length,
        valid: validCount(pkg.lessonKnowledgePoints, 'lesson_knowledge_point', issues),
      },
      relations: {
        total: pkg.knowledgeRelations.length,
        valid: validCount(pkg.knowledgeRelations, 'knowledge_relation', issues),
      },
    },
    verificationStatus: pkg.metadata.verificationStatus,
    issues,
    pendingManualReview,
    samplePollution,
    knowledgeDag,
    finalResult,
  }
}
