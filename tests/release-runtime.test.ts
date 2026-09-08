import { buildLearningMapViewModel } from '@/services/learning-map/learningMapAdapter'
import {
  learningStrategyService,
  toStrategyMapNodes,
  toStrategyKnowledgeRelations,
} from '@/services/learning-strategy'
import { approvedCurriculum } from '@/data/curriculum/production/localRelease'
import { describe, expect, it } from 'vitest'
import {
  productionCurriculumData,
  productionCurriculumIndex,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { MockQuestionRepository } from '@/services/question-engine/questionRepository'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { resolveProductionConfig } from '@/config/production'
import { evaluateMVPReleaseGate } from '@/services/production-readiness/mvpReleaseGate'
import { contentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import { createReadingQuest } from '@/services/content-expansion/readingQuest'

const policy = resolveProductionConfig({ isProduction: true })
describe('released local curriculum runtime', () => {
  it('exposes all owner-approved local textbooks under strict production guards', async () => {
    expect(productionCurriculumIndex.textbooks).toHaveLength(11)
    expect(productionCurriculumIndex.lessons).toHaveLength(357)
    const service = new MockCurriculumService({ data: approvedCurriculum, accessPolicy: policy })
    expect((await service.getRegions()).length).toBeGreaterThan(0)
    const contents = new MockLearningContentRepository({
      records: [...productionCurriculumIndex.contents],
      accessPolicy: policy,
    })
    const questions = new MockQuestionRepository()
    for (const book of productionCurriculumIndex.textbooks) {
      const map = await service.getLearningMapCurriculum(book.id)
      expect(map?.lessons.length).toBeGreaterThan(0)
      expect(map?.verificationStatus).toBe('REVIEWED')
      const view = buildLearningMapViewModel(map!, [], { dataset: 'profile' })
      const recommendation = learningStrategyService.resolve({
        studentProfileId: 'local-profile',
        currentTextbookId: book.id,
        mapNodes: toStrategyMapNodes(view),
        knowledgeRelations: toStrategyKnowledgeRelations(view),
        masteryRecords: [],
        dataset: 'profile',
      })
      expect(recommendation.nextKnowledgePoint?.knowledgePointId).toBeTruthy()
      const mapping = map!.lessonKnowledgePoints.find(
        (item) => !mvpCurriculumScope.readingOnlyKnowledgePointIds!.includes(item.knowledgePointId),
      )!
      const lesson = map!.lessons.find((item) => item.id === mapping.lessonId)!
      const content = await contents.getByKnowledgePoint(mapping.knowledgePointId)
      expect(content?.contentStatus).toBe('PUBLISHED')
      const assessment = await questions.getAssessmentDefinition({
        textbookId: book.id,
        unitId: lesson.unitId,
        lessonId: lesson.id,
        knowledgePointId: mapping.knowledgePointId,
      })
      expect(assessment?.questionIds.length).toBeGreaterThan(0)
      const bundle = await contentExpansionRepository.getBundle(mapping.knowledgePointId, 'profile')
      expect(bundle?.learningContent.verificationStatus).toBe('REVIEWED')
      const quest = createReadingQuest({
        bundle,
        title: lesson.title,
        text: content!.blocks.map((block) => block.block.text ?? '').join('\n'),
      })
      expect(quest?.stages.length).toBeGreaterThan(0)
      expect(quest?.verificationStatus).toBe('REVIEWED')
    }
  })
  it('passes content readiness and rejects missing required execution results', () => {
    const readiness = validateProductionReadiness(productionCurriculumData, mvpCurriculumScope)
    expect(readiness.issues).toEqual([])
    expect(readiness.status).toBe('PASS')
    expect(
      evaluateMVPReleaseGate({
        readiness,
        config: policy,
        engineering: {},
        qa: {},
        regression: {},
        documentation: {},
      }).decision,
    ).toBe('NOT_READY')
  })
})
