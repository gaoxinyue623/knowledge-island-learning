import { describe, expect, it } from 'vitest'
import { productionCurriculumIndex as index } from '@/data/curriculum/production'
import { comprehensiveSupplementSource } from '@/data/curriculum/production/comprehensiveSupplement'
import { curriculumService } from '@/services/runtime'
import { buildLearningMapViewModel } from '@/services/learning-map/learningMapAdapter'
import { buildAssessmentPapers } from '@/services/comprehensive-assessment/papers'
import { MockQuestionRepository } from '@/services/question-engine/questionRepository'
import {
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine/answerValidator'
import {
  isProductionContentSource,
  isProductionQuestionRecord,
} from '@/services/production-readiness/productionGuard'

const fingerprint = (questions: Array<{ id: string }>) =>
  questions
    .map((q) => q.id)
    .sort()
    .join('|')
describe('released comprehensive coverage', () => {
  it('covers all released textbooks and every unit with three genuinely different question sets', async () => {
    expect(index.textbooks.length).toBeGreaterThanOrEqual(32)
    for (const book of index.textbooks) {
      const source = await curriculumService.getLearningMapCurriculum(book.id)
      expect(source, book.id).not.toBeNull()
      const model = buildLearningMapViewModel(source!)
      for (const scope of [undefined, ...model.islands.map((i) => i.unitId)]) {
        const papers = buildAssessmentPapers(model, scope)
        const nodes = model.islands
          .filter((i) => !scope || i.unitId === scope)
          .flatMap((i) => i.lessons.flatMap((l) => l.nodes))
        if (
          nodes.length &&
          nodes.every((n) =>
            index.knowledgePoints
              .find((p) => p.id === n.knowledgePointId)
              ?.abilityTags.includes('开放实践'),
          )
        ) {
          expect(papers).toEqual([])
          continue
        }
        expect(papers, `${book.id}:${scope ?? 'final'}`).toHaveLength(3)
        expect(
          new Set(papers.map((p) => fingerprint(p.questions))).size,
          `${book.id}:${scope ?? 'final'} duplicates`,
        ).toBe(3)
        for (const paper of papers) {
          expect(paper.coveredPoints, paper.id).toBe(paper.totalPoints)
          expect(new Set(paper.questions.map((q) => q.id)).size).toBe(paper.questions.length)
          expect(
            paper.questions.every(
              (q) => q.textbookVersionId === book.id && !q.tags.includes('unit-sync-only'),
            ),
          ).toBe(true)
          if (model.textbook.subject === 'ENGLISH')
            expect(paper.questions.length).toBeGreaterThanOrEqual(scope ? 12 : 24)
        }
      }
    }
  }, 30000)
  it('retains traceable original sources, valid objective answers, and manual scoring for Chinese responses', () => {
    expect(isProductionContentSource(comprehensiveSupplementSource)).toBe(true)
    const added = index.questions.filter((q) => q.sourceId === comprehensiveSupplementSource.id)
    expect(added.length).toBeGreaterThan(0)
    for (const q of added) {
      expect(isProductionQuestionRecord(q), q.id).toBe(true)
      expect(index.questionKnowledgePoints.filter((m) => m.questionId === q.id)).toHaveLength(1)
      if (q.subjectId === 'SUBJECT_CHINESE') {
        expect(q.questionType).toBe('shortAnswer')
        expect(
          validateQuestionAnswer(q, { type: 'shortAnswer', value: '学生的开放表达' }).status,
        ).toBe('manual_review_required')
        expect(q.explanation.summary[0]?.text).toContain('检查要点')
      } else {
        expect(validateQuestionAnswer(q, correctAnswerDraft(q)).status, q.id).toBe('correct')
        if (q.options)
          expect(new Set(q.options.map((o) => o.content[0]!.text)).size).toBe(q.options.length)
      }
    }
  })
  it('keeps supplemental exam tasks out of the original lesson-practice assessment', async () => {
    const q = index.questions.find(
      (q) => q.tags.includes('comprehensive-only') && q.subjectId === 'SUBJECT_CHINESE',
    )!
    const mapping = index.questionKnowledgePoints.find((m) => m.questionId === q.id)!
    const relation = index.lessonKnowledgePointRelations.find(
      (r) => r.knowledgePointId === mapping.knowledgePointId,
    )!
    const lesson = index.lessons.find((l) => l.id === relation.lessonId)!
    const definition = await new MockQuestionRepository().getAssessmentDefinition({
      textbookId: q.textbookVersionId!,
      unitId: lesson.unitId,
      lessonId: lesson.id,
      knowledgePointId: mapping.knowledgePointId,
    })
    expect(definition?.questionIds ?? []).not.toContain(q.id)
  })
})

it('keeps the expanded release dataset valid', async () => {
  const { productionCurriculumData, mvpCurriculumScope } =
    await import('@/data/curriculum/production')
  const { validateProductionReadiness } =
    await import('@/services/production-readiness/productionReadinessValidator')
  const { validateQuestion } = await import('@/services/validation/questionValidation')
  for (const question of index.questions.filter((q) => q.tags.includes('comprehensive-only'))) {
    const validation = validateQuestion(question)
    expect(validation.issues, question.id).toEqual([])
  }
  expect(validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues).toEqual(
    [],
  )
})
