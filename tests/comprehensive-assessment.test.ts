import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { demoQuestions } from '@/data/question-engine'
import { demoLearningMapSource } from '@/data/learning-map/demo'
import { buildLearningMapViewModel } from '@/services/learning-map'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { buildAssessmentPapers, scopeCompleted } from '@/services/comprehensive-assessment/papers'
import ComprehensiveAssessments from '@/components/learning-map/ComprehensiveAssessments.vue'
import QuestionRenderer from '@/components/question-engine/QuestionRenderer.vue'
import { correctAnswerDraft } from '@/services/question-engine'
import { questionSessionStorage } from '@/services/question-engine/questionSessionStorage'

function fixture() {
  const model = buildLearningMapViewModel(demoLearningMapSource)
  const points = model.islands.flatMap((i) =>
    i.lessons.flatMap((l) => l.nodes.map((n) => n.knowledgePointId)),
  )
  const questions = points.flatMap((point, i) =>
    Array.from({ length: 6 }, (_, j) => ({
      ...demoQuestions[0]!,
      id: `q-${i}-${j}`,
      textbookVersionId: model.textbook.id,
    })),
  )
  const mappings = questions.map((q, i) => ({
    ...productionCurriculumIndex.questionKnowledgePoints[0]!,
    id: `m-${i}`,
    questionId: q.id,
    knowledgePointId: points[Math.floor(i / 6)]!,
  }))
  const index = { ...productionCurriculumIndex, questions, questionKnowledgePoints: mappings }
  return { model, index }
}

describe('comprehensive papers', () => {
  it('builds stable distinct papers covering every point in the chosen unit', () => {
    const { model, index } = fixture()
    const unit = model.islands[0]!.unitId
    const papers = buildAssessmentPapers(model, unit, index)
    expect(papers).toHaveLength(3)
    expect(papers).toEqual(buildAssessmentPapers(model, unit, index))
    for (const paper of papers) {
      expect(paper.coveredPoints).toBe(paper.totalPoints)
      expect(new Set(paper.questions.map((q) => q.id)).size).toBe(paper.questions.length)
    }
    expect(
      papers[0]!.questions.some((q) => papers[1]!.questions.some((other) => other.id === q.id)),
    ).toBe(false)
    expect(buildAssessmentPapers(model, undefined, index)[0]!.coveredPoints).toBe(
      new Set(
        model.islands.flatMap((i) =>
          i.lessons.flatMap((l) => l.nodes.map((n) => n.knowledgePointId)),
        ),
      ).size,
    )
  })
  it('uses three different pairs when each point has only four available questions', () => {
    const { model, index } = fixture()
    index.questions = index.questions.filter((q) => !q.id.endsWith('-4') && !q.id.endsWith('-5'))
    const papers = buildAssessmentPapers(model, model.islands[0]!.unitId, index)
    expect(
      new Set(
        papers.map((p) =>
          p.questions
            .map((q) => q.id)
            .sort()
            .join('|'),
        ),
      ).size,
    ).toBe(3)
  })
  it('rejects questions from another textbook and empty scopes', () => {
    const { model, index } = fixture()
    index.questions = index.questions.map((q) => ({ ...q, textbookVersionId: 'other' }))
    expect(buildAssessmentPapers(model, undefined, index)).toEqual([])
    expect(buildAssessmentPapers(model, 'unknown', index)).toEqual([])
  })
  it('keeps whole-unit synchronous sheets separate from papers built around individual knowledge points', () => {
    const { model, index } = fixture()
    index.questions = index.questions.map((q) => ({ ...q, tags: ['unit-sync-only'] }))
    expect(buildAssessmentPapers(model, undefined, index)).toEqual([])
    expect(buildAssessmentPapers(model, model.islands[0]!.unitId, index)).toEqual([])
  })
  it('unlocks only when every node has completed learning', () => {
    const { model } = fixture()
    expect(scopeCompleted(model)).toBe(false)
    for (const island of model.islands)
      for (const lesson of island.lessons)
        for (const node of lesson.nodes) node.status = 'completed'
    expect(scopeCompleted(model)).toBe(true)
    model.islands[0]!.lessons[0]!.nodes[0]!.status = 'learning'
    expect(scopeCompleted(model)).toBe(false)
  })
})

describe('comprehensive exam flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })
  it('hides answers until handing in, saves progress, and restores the completed result', async () => {
    const { model } = fixture()
    model.textbook.id = demoQuestions[0]!.textbookVersionId!
    // Bind a released question to the model for this isolated UI test.
    const originalQuestions = productionCurriculumIndex.questions
    const originalMappings = productionCurriculumIndex.questionKnowledgePoints
    const point = model.islands[0]!.lessons[0]!.nodes[0]!.knowledgePointId
    Object.assign(productionCurriculumIndex, {
      questions: [demoQuestions[0]!],
      questionKnowledgePoints: [
        { ...originalMappings[0]!, questionId: demoQuestions[0]!.id, knowledgePointId: point },
      ],
    })
    for (const island of model.islands)
      for (const lesson of island.lessons)
        for (const node of lesson.nodes) node.status = 'completed'
    const wrapper = mount(ComprehensiveAssessments, { props: { model } })
    try {
      await wrapper
        .findAll('button')
        .find((b) => b.text() === '选择试卷')!
        .trigger('click')
      await wrapper
        .findAll('button')
        .find((b) => b.text() === '开始测验')!
        .trigger('click')
      await flushPromises()
      expect(wrapper.findComponent(QuestionRenderer).props('question').submitted).toBe(false)
      wrapper
        .findComponent(QuestionRenderer)
        .vm.$emit('update-draft', correctAnswerDraft(demoQuestions[0]!))
      await flushPromises()
      expect(questionSessionStorage.loadAll()[0]!.attempts[0]!.submitted).toBe(false)
      await wrapper
        .findAll('button')
        .find((b) => b.text() === '交卷')!
        .trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('客观题正确率 100%')
      expect(wrapper.findComponent(QuestionRenderer).props('question').submitted).toBe(true)
      await wrapper
        .findAll('button')
        .find((b) => b.text() === '返回选卷')!
        .trigger('click')
      await wrapper
        .findAll('button')
        .find((b) => b.text() === '查看结果')!
        .trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('客观题正确率 100%')
    } finally {
      wrapper.unmount()
      Object.assign(productionCurriculumIndex, {
        questions: originalQuestions,
        questionKnowledgePoints: originalMappings,
      })
    }
  })
})
