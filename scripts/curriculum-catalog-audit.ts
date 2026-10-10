import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import {
  mvpCurriculumScope,
  productionCurriculumData,
  productionCurriculumIndex as catalog,
} from '../src/data/curriculum/production'
import { localCurriculumData } from '../src/data/curriculum/localCatalog'
import { buildLearningMapSourceFromDomain } from '../src/services/learning-map/curriculumSource'
import { buildLearningMapViewModel } from '../src/services/learning-map/learningMapAdapter'
import { buildAssessmentPapers } from '../src/services/comprehensive-assessment/papers'
import { buildLearningContentFromCourseContent } from '../src/services/lesson-player/lessonContentRepository'
import {
  correctAnswerDraft,
  isScorableQuestionType,
  validateQuestionAnswer,
} from '../src/services/question-engine/answerValidator'
import { validateQuestion } from '../src/services/validation/questionValidation'
import { validateProductionReadiness } from '../src/services/production-readiness/productionReadinessValidator'

// This audit checks the currently released projection, including later corrections.
// Structural release approval is not certification of a publisher's original text.
const errors: { code: string; id: string; detail: string }[] = []
const error = (code: string, id: string, detail: string) => errors.push({ code, id, detail })
const pointIds = new Set(catalog.knowledgePoints.map((point) => point.id))
const questionIds = new Set(catalog.questions.map((question) => question.id))
const readOnlyIds = new Set(mvpCurriculumScope.readingOnlyKnowledgePointIds ?? [])
const sourceIds = new Set(catalog.contentSources.map((source) => source.id))

for (const [kind, records] of Object.entries({
  textbooks: catalog.textbooks,
  units: catalog.units,
  lessons: catalog.lessons,
  knowledgePoints: catalog.knowledgePoints,
  contents: catalog.contents,
  questions: catalog.questions,
  questionKnowledgePoints: catalog.questionKnowledgePoints,
})) {
  const seen = new Set<string>()
  for (const record of records) {
    if (seen.has(record.id)) error('DUPLICATE_ID', record.id, kind)
    seen.add(record.id)
  }
}
for (const issue of validateProductionReadiness(productionCurriculumData, mvpCurriculumScope)
  .issues)
  error(issue.code, 'production', issue.message)
for (const book of localCurriculumData.textbooks)
  if (!catalog.textbookIds.has(book.id)) error('UNRELEASED_BOOK', book.id, book.versionName)

const nodes = catalog.knowledgePoints.map((point) => {
  const relation = catalog.lessonKnowledgePointRelations.find(
    (item) => item.knowledgePointId === point.id,
  )
  const lesson = catalog.lessons.find((item) => item.id === relation?.lessonId)
  const unit = catalog.units.find((item) => item.id === lesson?.unitId)
  const content = catalog.contents.filter((item) => item.knowledgePointId === point.id)
  const mappedIds = new Set(
    catalog.questionKnowledgePoints
      .filter((item) => item.knowledgePointId === point.id)
      .map((item) => item.questionId),
  )
  const questions = catalog.questions.filter((item) => mappedIds.has(item.id))
  if (!lesson || !unit) error('UNBOUND_POINT', point.id, point.name)
  if (!content.length) error('MISSING_CONTENT', point.id, point.name)
  for (const item of content)
    if (!buildLearningContentFromCourseContent(item))
      error('UNRENDERABLE_CONTENT', item.id, item.title)
  const baseQuestions = questions.filter(
    (item) => !item.tags.includes('unit-sync-only') && !item.tags.includes('comprehensive-only'),
  )
  if (readOnlyIds.has(point.id) && baseQuestions.length)
    error('READ_ONLY_HAS_BASE_QUESTIONS', point.id, baseQuestions.map((item) => item.id).join(', '))
  // A composite exercise landing page can be open while hosting explicit sync-only
  // worksheets. They must stay out of default practice, AI and exam question pools.
  if (
    point.abilityTags.includes('开放实践') &&
    questions.some((item) => !item.tags.includes('unit-sync-only'))
  )
    error('OPEN_ACTIVITY_HAS_QUESTIONS', point.id, questions.map((item) => item.id).join(', '))
  for (const item of questions.filter(
    (item) => readOnlyIds.has(point.id) && item.tags.includes('comprehensive-only'),
  ))
    if (isScorableQuestionType(item.questionType))
      error('READ_ONLY_OBJECTIVE_EXAM', item.id, point.id)
  for (const item of questions)
    if (item.textbookVersionId !== unit?.textbookVersionId)
      error('CROSS_BOOK_QUESTION', item.id, point.id)
  const bodies = content.map((item) => item.body)
  const metadata = bodies.map((body) =>
    Object.fromEntries(
      Object.entries(body).filter(
        ([key]) =>
          key !== 'suppliedText' && /note|missing|quality|reference|original|supplied/i.test(key),
      ),
    ),
  )
  const blocks = bodies.flatMap((body) => (Array.isArray(body.blocks) ? body.blocks : [])) as {
    text?: string
  }[]
  const text = blocks.map((block) => block.text ?? '').join('\n')
  const markedLines = text
    .split('\n')
    .filter((line) =>
      /待核对|未提供|尚未|未核验|还原稿|还原整理|数量.*不一致|标称.*实际/.test(line),
    )
  return {
    id: point.id,
    title: point.name,
    textbookId: unit?.textbookVersionId,
    unitTitle: unit?.title,
    readOnly: readOnlyIds.has(point.id),
    openPractice: point.abilityTags.includes('开放实践'),
    contentCount: content.length,
    characters: text.length,
    sourceIds: content.map((item) => item.sourceId),
    baseQuestions: baseQuestions.length,
    syncQuestions: questions.filter((item) => item.tags.includes('unit-sync-only')).length,
    comprehensiveQuestions: questions.filter((item) => item.tags.includes('comprehensive-only'))
      .length,
    metadata,
    markedLines,
    researchReview: bodies.map((body) => body.researchReview).filter(Boolean),
    // Completeness is separate from structural readiness. A rendered synopsis,
    // reconstruction, missing picture or sound sample must remain discoverable.
    completenessWarnings: [
      ...new Set(
        bodies.flatMap((body) => {
          const notes = [
            body.sourceNote,
            ...(Array.isArray(body.importNotes) ? body.importNotes : []),
            ...(Array.isArray(body.reviewNotes) ? body.reviewNotes : []),
          ].filter((value): value is string => typeof value === 'string')
          const explicitMissing = Array.isArray(body.missingSections) ? body.missingSections : []
          return [
            ...explicitMissing.map((item) => `登记缺项：${String(item)}`),
            ...(body.textQuality === 'RECONSTRUCTED' ? ['主题还原稿，未取得同版教材原文'] : []),
            ...notes.filter((note) =>
              /仍.*概要|此前提供的是故事概要|未提供|未附|仅列题目|仅提供|缺失|数量.*不一致|标称|版次.*疑点/.test(
                note,
              ),
            ),
          ]
        }),
      ),
    ],
  }
})
for (const mapping of catalog.questionKnowledgePoints) {
  if (!pointIds.has(mapping.knowledgePointId) || !questionIds.has(mapping.questionId))
    error('DANGLING_QUESTION_MAPPING', mapping.id, mapping.questionId)
}
let objectiveQuestions = 0
let manualQuestions = 0
for (const question of catalog.questions) {
  const validation = validateQuestion(question, { knowledgePointIds: pointIds, sourceIds })
  for (const issue of validation.issues) error('INVALID_QUESTION', question.id, issue)
  if (!isScorableQuestionType(question.questionType)) {
    manualQuestions++
    continue
  }
  objectiveQuestions++
  if (validateQuestionAnswer(question, correctAnswerDraft(question)).status !== 'correct')
    error('ANSWER_REJECTED', question.id, question.questionType)
}

const books = catalog.textbooks.map((book) => {
  const units = catalog.units.filter((unit) => unit.textbookVersionId === book.id)
  const unitIds = new Set(units.map((unit) => unit.id))
  const lessons = catalog.lessons.filter((lesson) => unitIds.has(lesson.unitId))
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const relations = catalog.lessonKnowledgePointRelations.filter((relation) =>
    lessonIds.has(relation.lessonId),
  )
  const ids = new Set(relations.map((relation) => relation.knowledgePointId))
  const bookNodes = nodes.filter((node) => node.textbookId === book.id)
  const model = buildLearningMapViewModel(
    buildLearningMapSourceFromDomain({
      textbook: book,
      grade: catalog.grades.find((grade) => grade.id === book.gradeId)!,
      semester: catalog.semesters.find((semester) => semester.id === book.semesterId)!,
      subject: catalog.subjects.find((subject) => subject.id === book.subjectId)!,
      publisher: catalog.publishers.find((publisher) => publisher.id === book.publisherId),
      units,
      lessons,
      knowledgePoints: catalog.knowledgePoints.filter((point) => ids.has(point.id)),
      lessonKnowledgePoints: relations,
      knowledgePrerequisites: catalog.knowledgePrerequisites.filter(
        (relation) =>
          ids.has(relation.prerequisiteKnowledgePointId) &&
          ids.has(relation.dependentKnowledgePointId),
      ),
    }),
  )
  const assessmentScopes = [undefined, ...units.map((unit) => unit.id)].map((scope) => {
    const papers = buildAssessmentPapers(model, scope)
    const scopeNodes = bookNodes.filter(
      (node) => !scope || units.find((unit) => unit.id === scope)?.title === node.unitTitle,
    )
    if (!papers.length && scopeNodes.some((node) => !node.openPractice))
      error('NO_ASSESSMENT', scope ?? book.id, book.versionName)
    for (const paper of papers) {
      if (paper.coveredPoints !== paper.totalPoints)
        error('ASSESSMENT_GAP', paper.id, `${paper.coveredPoints}/${paper.totalPoints}`)
      for (const question of paper.questions)
        if (question.textbookVersionId !== book.id || question.tags.includes('unit-sync-only'))
          error('ASSESSMENT_WRONG_SCOPE', question.id, paper.id)
    }
    return {
      scope: scope ?? 'final',
      paperCount: papers.length,
      questions: papers.map((paper) => paper.questions.length),
    }
  })
  return {
    id: book.id,
    title: book.versionName,
    grade: book.gradeId,
    semester: book.semesterId,
    subject: book.subjectId,
    editionYear: book.editionYear ?? null,
    unitCount: units.length,
    nodeCount: bookNodes.length,
    baseQuestions: bookNodes.reduce((count, node) => count + node.baseQuestions, 0),
    syncQuestions: bookNodes.reduce((count, node) => count + node.syncQuestions, 0),
    readOnlyNodes: bookNodes.filter((node) => node.readOnly || node.openPractice).length,
    markedNodes: bookNodes
      .filter((node) => node.markedLines.length)
      .map((node) => ({ id: node.id, title: node.title, lines: node.markedLines })),
    completenessWarningNodes: bookNodes
      .filter((node) => node.completenessWarnings.length)
      .map((node) => ({
        id: node.id,
        title: node.title,
        unit: node.unitTitle,
        warnings: node.completenessWarnings,
      })),
    sourceArchiveNotes: catalog.contentSources
      .filter((source) => source.id === book.sourceId)
      .map((source) => source.notes),
    assessmentScopes,
  }
})

function filesIn(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(path, entry.name)
    return entry.isDirectory() ? filesIn(full) : [full]
  })
}
const evidenceHashes: { path: string; field: string; matchedPaths: string[] }[] = []
const allFiles = [
  ...filesIn(resolve('src/data/curriculum')),
  ...filesIn(resolve('public/curriculum')),
]
const hashToFiles = new Map<string, string[]>()
for (const path of allFiles.filter((path) => /\.(md|txt|png)$/.test(path))) {
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex')
  hashToFiles.set(hash, [...(hashToFiles.get(hash) ?? []), relative(process.cwd(), path)])
}
function checkHash(value: unknown, path: string, field = '') {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const childField = field ? `${field}.${key}` : key
    if (/sha256/i.test(key) && typeof child === 'string' && /^[0-9a-f]{64}$/.test(child)) {
      const matchedPaths = hashToFiles.get(child) ?? []
      evidenceHashes.push({ path, field: childField, matchedPaths })
      if (!matchedPaths.length) error('EVIDENCE_HASH_MISMATCH', path, childField)
    } else checkHash(child, path, childField)
  }
}
for (const path of allFiles.filter((path) => path.endsWith('.json')))
  checkHash(JSON.parse(readFileSync(path, 'utf8')), relative(process.cwd(), path))

const report = {
  generatedAt: new Date().toISOString(),
  boundary:
    '系统结构、内容可渲染性、判分规则、组卷范围及本地来源哈希检查；不是出版社原书逐页或全部学科事实认证。',
  releaseVersion: mvpCurriculumScope.version,
  totals: {
    books: books.length,
    units: catalog.units.length,
    nodes: nodes.length,
    questions: catalog.questions.length,
    objectiveQuestions,
    manualQuestions,
    evidenceHashes: evidenceHashes.length,
    errors: errors.length,
    completenessWarningNodes: nodes.filter((node) => node.completenessWarnings.length).length,
    researchedNodes: nodes.filter((node) => node.researchReview.length).length,
  },
  errors,
  researchFindings: nodes
    .filter((node) => node.researchReview.length)
    .map((node) => ({
      textbook: books.find((book) => book.id === node.textbookId),
      unit: node.unitTitle,
      nodeId: node.id,
      title: node.title,
      findings: node.researchReview,
    })),
  books,
  nodes,
  evidenceHashes,
}
const destination = resolve('doc/curriculum/TEXTBOOK_CATALOG_AUDIT_2026-10-09.json')
mkdirSync(resolve('doc/curriculum'), { recursive: true })
writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report.totals))
for (const issue of errors) console.log(JSON.stringify(issue))
console.log(`Report: ${destination}`)
if (errors.length) process.exitCode = 1
