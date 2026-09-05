import { describe, expect, it } from 'vitest'

import { sampleQuestions } from '@/data/curriculum/questions'
import { mvpCurriculumScope, productionCurriculumData } from '@/data/curriculum/production'
import { goldenMathPepG3S1Package } from '@/data/curriculum/verified/math/pep/g3-s1'
import { resolveProductionConfig } from '@/config/production'
import { MockContentService } from '@/services/adapters/mock/contentMockAdapter'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import {
  importCurriculumPackage,
  isCurriculumRecordReadable,
  isLearningContentRecordReadable,
  isQuestionRecordReadable,
} from '@/services/curriculum'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { MockLessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import { QuestionEngineAdapter } from '@/services/question-engine/questionEngineAdapter'
import { MockQuestionRepository } from '@/services/question-engine/questionRepository'
import type {
  ContentSource,
  CourseContent,
  CurriculumImportPackage,
  MvpCurriculumScope,
  ProductionReadinessDataset,
  Question,
  QuestionKnowledgePoint,
} from '@/types'
import {
  buildContentCoverageReport,
  buildCurriculumPackageFingerprint,
  buildProductionIndex,
  buildQuestionCoverageReport,
  diffCurriculumPackages,
  evaluateMVPReleaseGate,
  guardReviewedCurriculumOverwrite,
  recoverOrphanRecords,
  scanProductionSampleLeaks,
  validateProductionReadiness,
  validateRegionMappings,
  validateStorageMigrationMatrix,
} from '@/services/production-readiness'

const curriculumSourceId = 'CURRICULUM_SOURCE_REVIEWED'
const contentSourceId = 'CONTENT_SOURCE_REVIEWED'

function strictProductionPolicy() {
  return {
    allowSampleCurriculum: false,
    allowUnreviewedCurriculum: false,
    allowSampleLearningContent: false,
    allowUnreviewedLearningContent: false,
    allowSampleQuestions: false,
    allowUnreviewedQuestions: false,
  }
}

function reviewedQuestion(id: string, knowledgePointId: string): Question {
  const sample = sampleQuestions[0]
  if (!sample) throw new Error('sample question missing')
  return {
    ...sample,
    id,
    knowledgePointId,
    sourceId: contentSourceId,
    status: 'PUBLISHED',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    gradeId: 'GRADE_3',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_MATH',
    textbookVersionId: 'TEXTBOOK_REVIEWED',
    options: (sample.options ?? []).map((option) => ({
      ...option,
      id: `${id}_${option.optionKey}`,
      questionId: id,
    })),
    hints: sample.hints.map((hint) => ({ ...hint, id: `${id}_${hint.order}` })),
    answerRule: { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' },
  }
}

function reviewedMapping(
  id: string,
  questionId: string,
  knowledgePointId: string,
): QuestionKnowledgePoint {
  return {
    id,
    questionId,
    knowledgePointId,
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
  }
}

function reviewedContent(id: string, knowledgePointId: string): CourseContent {
  return {
    id,
    knowledgePointId,
    title: `原创学习内容 ${knowledgePointId}`,
    contentType: 'EXTENSION',
    contentFormat: 'TEXT',
    body: {
      lessonId: 'LESSON_REVIEWED',
      blocks: [{ type: 'TEXT', text: `这是经过人工审核的内容 ${knowledgePointId}。` }],
      learningGoals: ['能够完成本知识点的基础练习'],
    },
    sourceId: contentSourceId,
    needsVerification: false,
    status: 'PUBLISHED',
    currentVersion: 1,
    isSample: false,
    verificationStatus: 'REVIEWED',
    createdAt: '2026-09-03T00:00:00+08:00',
    updatedAt: '2026-09-03T00:00:00+08:00',
  }
}

function reviewedDataset(): { dataset: ProductionReadinessDataset; scope: MvpCurriculumScope } {
  const knowledgePointIds = ['KP_REVIEWED_A', 'KP_REVIEWED_B']
  const questions = knowledgePointIds.flatMap((knowledgePointId) =>
    Array.from({ length: 5 }, (_, index) =>
      reviewedQuestion(`QUESTION_${knowledgePointId}_${index + 1}`, knowledgePointId),
    ),
  )
  const questionKnowledgePoints = questions.map((question, index) =>
    reviewedMapping(`QUESTION_MAPPING_${index + 1}`, question.id, question.knowledgePointId ?? ''),
  )
  const contentSources: ContentSource[] = [
    {
      id: contentSourceId,
      sourceType: 'TEACHER_CREATED',
      title: '原创内容人工审核记录',
      sourceRef: 'https://example.com/knowledge-island/reviewed-content',
      copyrightStatus: 'CLEARED',
      license: '项目原创',
      verificationStatus: 'REVIEWED',
      verifiedAt: '2026-09-03T00:00:00+08:00',
      notes: '测试夹具：仅验证生产门禁契约。',
    },
  ]
  const dataset: ProductionReadinessDataset = {
    grades: [{ id: 'GRADE_3', code: 'G3', name: '三年级', sortOrder: 3, status: 'ACTIVE' }],
    semesters: [
      { id: 'SEMESTER_UPPER', code: 'UPPER', name: '上册', sortOrder: 1, status: 'ACTIVE' },
    ],
    subjects: [
      { id: 'SUBJECT_MATH', code: 'MATH', name: '数学', themeKey: 'MATH', status: 'ACTIVE' },
    ],
    regions: [
      {
        id: 'REGION_SZ',
        code: 'CN-GD-SZ',
        name: '深圳市',
        level: 'CITY',
        status: 'ACTIVE',
        needsVerification: false,
        verificationStatus: 'REVIEWED',
      },
    ],
    publishers: [
      {
        id: 'PUBLISHER_BNUP',
        code: 'BNUP',
        name: '北京师范大学出版社',
        officialName: '北京师范大学出版社',
        status: 'ACTIVE',
        sourceId: curriculumSourceId,
        needsVerification: false,
        verificationStatus: 'REVIEWED',
      },
    ],
    textbooks: [
      {
        id: 'TEXTBOOK_REVIEWED',
        subjectId: 'SUBJECT_MATH',
        gradeId: 'GRADE_3',
        semesterId: 'SEMESTER_UPPER',
        publisherId: 'PUBLISHER_BNUP',
        versionName: '小学数学三年级上册（审核夹具）',
        editionYear: 2024,
        curriculumStandard: '2022',
        sourceId: curriculumSourceId,
        status: 'ACTIVE',
        needsVerification: false,
        verificationStatus: 'REVIEWED',
        createdAt: '2026-09-03T00:00:00+08:00',
        updatedAt: '2026-09-03T00:00:00+08:00',
      },
    ],
    regionTextbookRelations: [
      {
        id: 'REGION_TEXTBOOK_REVIEWED',
        regionId: 'REGION_SZ',
        textbookVersionId: 'TEXTBOOK_REVIEWED',
        usageType: 'DEFAULT',
        effectiveFrom: '2026-09-01',
        effectiveTo: '2027-08-31',
        sourceId: curriculumSourceId,
        status: 'ACTIVE',
        needsVerification: false,
        verificationStatus: 'REVIEWED',
      },
    ],
    units: [
      {
        id: 'UNIT_REVIEWED',
        textbookVersionId: 'TEXTBOOK_REVIEWED',
        code: 'UNIT-01',
        title: '数与运算',
        sortOrder: 1,
        status: 'ACTIVE',
        needsVerification: false,
        sourceId: curriculumSourceId,
        verificationStatus: 'REVIEWED',
      },
    ],
    lessons: [
      {
        id: 'LESSON_REVIEWED',
        unitId: 'UNIT_REVIEWED',
        code: 'LESSON-01',
        title: '基础运算练习',
        sortOrder: 1,
        status: 'ACTIVE',
        needsVerification: false,
        sourceId: curriculumSourceId,
        verificationStatus: 'REVIEWED',
      },
    ],
    knowledgePoints: knowledgePointIds.map((id, index) => ({
      id,
      code: `MATH-REVIEWED-${index + 1}`,
      name: `数学知识点 ${index + 1}`,
      subjectId: 'SUBJECT_MATH',
      gradeScope: { minGrade: 3, maxGrade: 3 },
      description: '测试夹具知识点描述。',
      learningObjective: ['完成基础理解和应用'],
      abilityTags: ['calculation'],
      difficultyLevel: 'FOUNDATION',
      status: 'ACTIVE',
      needsVerification: false,
      sourceId: curriculumSourceId,
      verificationStatus: 'REVIEWED',
    })),
    lessonKnowledgePointRelations: knowledgePointIds.map((knowledgePointId, index) => ({
      id: `LESSON_KP_REVIEWED_${index + 1}`,
      lessonId: 'LESSON_REVIEWED',
      knowledgePointId,
      relationType: 'CORE',
      order: index + 1,
      isPrimary: index === 0,
      sourceId: curriculumSourceId,
      needsVerification: false,
      status: 'ACTIVE',
      verificationStatus: 'REVIEWED',
    })),
    knowledgePrerequisites: [],
    sourceReferences: [
      {
        id: curriculumSourceId,
        type: 'official_document',
        title: '审核夹具课程来源',
        sourceUrl: 'https://example.com/knowledge-island/reviewed-curriculum',
        retrievedAt: '2026-09-03',
        verifiedAt: '2026-09-03T00:00:00+08:00',
        verifiedBy: 'manual-review-fixture',
      },
    ],
    contents: knowledgePointIds.map((id) => reviewedContent(`CONTENT_${id}`, id)),
    questions,
    questionKnowledgePoints,
    contentSources,
    mediaAssets: [],
  }
  const scope: MvpCurriculumScope = {
    id: 'MVP_SCOPE_REVIEWED_FIXTURE',
    version: 1,
    title: '审核夹具范围',
    region: { code: 'CN-GD-SZ', name: '深圳市' },
    validFrom: '2026-09-01',
    validTo: '2027-08-31',
    entries: [
      {
        id: 'SCOPE_ENTRY_REVIEWED',
        regionCode: 'CN-GD-SZ',
        regionName: '深圳市',
        grade: 3,
        semester: 'UPPER',
        subjectCode: 'MATH',
        publisherCode: 'BNUP',
        textbookVersionId: 'TEXTBOOK_REVIEWED',
        status: 'RELEASED',
        sourceReferenceIds: [curriculumSourceId],
      },
    ],
    sourceReferenceIds: [curriculumSourceId],
    releaseNote: '测试夹具，不是实际教材事实。',
  }
  return { dataset, scope }
}

describe('PHASE 16 production config and scope', () => {
  it('fails safe when production environment flags are absent', () => {
    const config = resolveProductionConfig({ isProduction: true })
    expect(config.allowSampleCurriculum).toBe(false)
    expect(config.allowUnreviewedCurriculum).toBe(false)
    expect(config.allowSampleLearningContent).toBe(false)
    expect(config.allowUnreviewedLearningContent).toBe(false)
    expect(config.allowSampleQuestions).toBe(false)
    expect(config.allowUnreviewedQuestions).toBe(false)
    expect(config.devRoutes).toBe(false)
  })

  it('keeps the current candidate scope out of the production index', () => {
    const report = validateProductionReadiness(productionCurriculumData, mvpCurriculumScope)
    const index = buildProductionIndex(productionCurriculumData, mvpCurriculumScope)
    expect(report.status).toBe('FAIL')
    expect(report.issues.some((item) => item.code === 'RELEASE_SCOPE_EMPTY')).toBe(true)
    expect(report.content.passed).toBe(false)
    expect(report.questions.passed).toBe(false)
    expect(index.textbooks).toEqual([])
    expect(index.contents).toEqual([])
    expect(index.questions).toEqual([])
  })

  it('requires active curriculum and published content/question records', () => {
    const policy = strictProductionPolicy()
    expect(
      isCurriculumRecordReadable({ verificationStatus: 'REVIEWED', status: 'DRAFT' }, policy),
    ).toBe(false)
    expect(
      isCurriculumRecordReadable({ verificationStatus: 'REVIEWED', status: 'ACTIVE' }, policy),
    ).toBe(true)
    expect(
      isLearningContentRecordReadable({ verificationStatus: 'REVIEWED', status: 'DRAFT' }, policy),
    ).toBe(false)
    expect(
      isLearningContentRecordReadable(
        { verificationStatus: 'REVIEWED', status: 'PUBLISHED' },
        policy,
      ),
    ).toBe(true)
    expect(
      isQuestionRecordReadable({ verificationStatus: 'REVIEWED', status: 'DRAFT' }, policy),
    ).toBe(false)
    expect(
      isQuestionRecordReadable({ verificationStatus: 'REVIEWED', status: 'PUBLISHED' }, policy),
    ).toBe(true)
  })
})

describe('PHASE 16 curriculum import and region gates', () => {
  it('reuses the existing import pipeline deterministically for the candidate package', () => {
    const first = importCurriculumPackage(goldenMathPepG3S1Package)
    const second = importCurriculumPackage(goldenMathPepG3S1Package)
    expect(first.success).toBe(true)
    expect(first.report.finalResult).toBe('REQUIRES_MANUAL_REVIEW')
    expect(first.normalizedPackage).toEqual(second.normalizedPackage)
    expect(first.imported).toEqual(second.imported)
  })

  it('produces a stable fingerprint and deterministic import diff', () => {
    const first = buildCurriculumPackageFingerprint(goldenMathPepG3S1Package)
    const second = buildCurriculumPackageFingerprint(goldenMathPepG3S1Package)
    expect(first).toBe(second)
    expect(
      diffCurriculumPackages(goldenMathPepG3S1Package, goldenMathPepG3S1Package).unchanged,
    ).toBe(true)
    const changed: CurriculumImportPackage = {
      ...goldenMathPepG3S1Package,
      units: goldenMathPepG3S1Package.units.map((unit, index) =>
        index === 0 ? { ...unit, title: 'changed candidate title' } : { ...unit },
      ),
    }
    const diff = diffCurriculumPackages(goldenMathPepG3S1Package, changed)
    expect(diff.unchanged).toBe(false)
    expect(diff.byEntity.unit.updated).toEqual(['GOLDEN_MATH_PEP_G3_S1_UNIT_01'])
  })

  it('blocks a changed package from silently overwriting reviewed identity', () => {
    const reviewed: CurriculumImportPackage = {
      ...goldenMathPepG3S1Package,
      metadata: { ...goldenMathPepG3S1Package.metadata, verificationStatus: 'REVIEWED' },
      textbook: {
        ...goldenMathPepG3S1Package.textbook,
        verificationStatus: 'REVIEWED',
        needsVerification: false,
        verifiedAt: '2026-09-03T00:00:00+08:00',
        verifiedBy: 'manual-review-fixture',
      },
    }
    const changed: CurriculumImportPackage = {
      ...reviewed,
      units: reviewed.units.map((unit, index) =>
        index === 0 ? { ...unit, title: 'changed reviewed title' } : { ...unit },
      ),
    }
    const guard = guardReviewedCurriculumOverwrite(reviewed, changed)
    expect(guard.allowed).toBe(false)
    expect(guard.requiresNewIdentity).toBe(true)
  })

  it('validates the reviewed region mapping and catches an expired relation', () => {
    const { dataset, scope } = reviewedDataset()
    expect(validateRegionMappings(dataset, scope, new Date('2026-09-03T00:00:00Z')).valid).toBe(
      true,
    )
    const expired = {
      ...dataset,
      regionTextbookRelations: dataset.regionTextbookRelations.map((relation) => ({
        ...relation,
        effectiveTo: '2026-09-02',
      })),
    }
    const report = validateRegionMappings(expired, scope, new Date('2026-09-03T00:00:00Z'))
    expect(report.valid).toBe(false)
    expect(report.issues).toContain('REGION_TEXTBOOK_RELATION_OUT_OF_DATE:REGION_TEXTBOOK_REVIEWED')
  })
})

describe('PHASE 16 content, question and release readiness', () => {
  it('passes coverage and readiness for a complete reviewed fixture', () => {
    const { dataset, scope } = reviewedDataset()
    const readiness = validateProductionReadiness(dataset, scope)
    expect(readiness.status).toBe('PASS')
    expect(readiness.content.passed).toBe(true)
    expect(readiness.content.reviewedContentCount).toBe(2)
    expect(readiness.questions.passed).toBe(true)
    expect(readiness.questions.reviewedQuestionCount).toBe(10)
    expect(readiness.questions.minimumQuestionsPerKnowledgePoint).toBe(5)
    expect(readiness.sampleLeak.passed).toBe(true)
  })

  it('reports missing content and insufficient reviewed questions', () => {
    const { dataset } = reviewedDataset()
    const missingContent = buildContentCoverageReport({
      curriculum: {
        textbookIds: new Set(['TEXTBOOK_REVIEWED']),
        units: dataset.units,
        lessons: dataset.lessons,
        knowledgePoints: dataset.knowledgePoints,
        lessonKnowledgePointRelations: dataset.lessonKnowledgePointRelations,
      },
      contents: dataset.contents.filter((content) => content.knowledgePointId !== 'KP_REVIEWED_B'),
      contentSources: dataset.contentSources,
      mediaAssets: dataset.mediaAssets,
    })
    expect(missingContent.passed).toBe(false)
    expect(missingContent.missingKnowledgePointIds).toEqual(['KP_REVIEWED_B'])

    const questions = dataset.questions.slice(0, 4)
    const questionCoverage = buildQuestionCoverageReport({
      knowledgePoints: dataset.knowledgePoints,
      questions,
      questionKnowledgePoints: dataset.questionKnowledgePoints.filter((mapping) =>
        questions.some((question) => question.id === mapping.questionId),
      ),
      contentSources: dataset.contentSources,
      mediaAssets: dataset.mediaAssets,
    })
    expect(questionCoverage.passed).toBe(false)
    expect(questionCoverage.insufficientKnowledgePointIds).toContain('KP_REVIEWED_A')
    expect(questionCoverage.missingKnowledgePointIds).toContain('KP_REVIEWED_B')
  })

  it('runs one reviewed LessonPlayer and QuestionEngine flow without demo fallback', async () => {
    const { dataset } = reviewedDataset()
    const policy = strictProductionPolicy()
    const curriculum = new MockCurriculumService({
      accessPolicy: policy,
      data: {
        regions: [...dataset.regions],
        grades: [...dataset.grades],
        semesters: [...dataset.semesters],
        subjects: [...dataset.subjects],
        publishers: [...dataset.publishers],
        textbooks: [...dataset.textbooks],
        regionTextbookRelations: [...dataset.regionTextbookRelations],
        units: [...dataset.units],
        lessons: [...dataset.lessons],
        knowledgePoints: [...dataset.knowledgePoints],
        lessonKnowledgePointRelations: [...dataset.lessonKnowledgePointRelations],
        knowledgePrerequisites: [...dataset.knowledgePrerequisites],
      },
    })
    const contentService = new MockContentService({
      knowledgePoints: dataset.knowledgePoints,
      mediaAssets: dataset.mediaAssets,
    })
    const content = new MockLearningContentRepository({
      records: [...dataset.contents],
      accessPolicy: policy,
    })
    const lessonRepository = new MockLessonPlayerRepository({
      curriculum,
      content,
      contentService,
      accessPolicy: policy,
    })
    const context = {
      textbookId: 'TEXTBOOK_REVIEWED',
      unitId: 'UNIT_REVIEWED',
      lessonId: 'LESSON_REVIEWED',
      knowledgePointId: 'KP_REVIEWED_A',
    } as const
    const lessonResult = await lessonRepository.getLessonPlayerSource(context, 'profile')
    expect(lessonResult.issue).toBeUndefined()
    expect(lessonResult.source?.contentVerificationStatus).toBe('REVIEWED')

    const questionRepository = new MockQuestionRepository({
      profileQuestions: [...dataset.questions],
      profileQuestionKnowledgePoints: [...dataset.questionKnowledgePoints],
    })
    const questionEngine = new QuestionEngineAdapter({
      curriculum,
      questionRepository,
      contentService,
      accessPolicy: policy,
    })
    const assessment = await questionEngine.loadAssessment(context, { dataset: 'profile' })
    expect(assessment.issue).toBeUndefined()
    expect(assessment.questions).toHaveLength(5)
    expect(assessment.flags.isDemo).toBe(false)
    expect(assessment.flags.isUnverified).toBe(false)
  })

  it('detects sample leaks and requires a production-only config in the release gate', () => {
    const scan = scanProductionSampleLeaks([
      {
        dataset: 'production',
        records: [
          {
            id: 'SAMPLE_LEAK',
            sourceId: 'SAMPLE_SOURCE',
            isSample: true,
            verificationStatus: 'SAMPLE',
          },
        ],
      },
    ])
    expect(scan.passed).toBe(false)
    const { dataset, scope } = reviewedDataset()
    const readiness = validateProductionReadiness(dataset, scope)
    const gate = evaluateMVPReleaseGate({
      readiness,
      config: resolveProductionConfig({ isProduction: true }),
      engineering: { tests: true },
      qa: { responsive: true },
      regression: { parentReport: true },
      documentation: { phase16Artifacts: true },
    })
    expect(gate.decision).toBe('READY')
    const limited = evaluateMVPReleaseGate({
      readiness,
      config: resolveProductionConfig({ isProduction: true }),
      engineering: { tests: true },
      qa: { responsive: true },
      regression: { parentReport: true },
      documentation: { phase16Artifacts: true },
      limitations: ['英语教材尚未纳入本次正式范围'],
    })
    expect(limited.decision).toBe('READY_WITH_LIMITATIONS')
  })
})

describe('PHASE 16 storage and orphan recovery', () => {
  it('keeps the migration matrix complete and recovers orphan records safely', () => {
    const migration = validateStorageMigrationMatrix()
    expect(migration.valid).toBe(true)
    expect(migration.rows.length).toBeGreaterThanOrEqual(12)
    const recovered = recoverOrphanRecords({
      records: [
        { id: 'lesson-valid', lessonId: 'LESSON_REVIEWED' },
        { id: 'lesson-orphan', lessonId: 'LESSON_MISSING' },
      ],
      knownIds: new Set(['LESSON_REVIEWED']),
      idOf: (record) => record.id,
      foreignKeyOf: (record) => record.lessonId,
      label: 'LessonSession',
    })
    expect(recovered.records).toHaveLength(1)
    expect(recovered.droppedRecordIds).toEqual(['lesson-orphan'])
    expect(recovered.diagnostics[0]).toContain('orphan')
  })
})
