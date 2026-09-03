import { describe, expect, it } from 'vitest'

import { strategyShowcaseFixtures, strategyShowcaseUnverifiedInput } from '@/data/learning-strategy'
import {
  resolveLearningRecommendation,
  resolveNextLearningRecommendation,
  resolveReviewRecommendations,
} from '@/services/learning-strategy'
import type { LearningStrategyInput, MasteryRecord, StrategyMapNode } from '@/types'

function fixture(id: (typeof strategyShowcaseFixtures)[number]['id']) {
  const value = strategyShowcaseFixtures.find((candidate) => candidate.id === id)
  if (!value) throw new Error(`Missing strategy fixture ${id}`)
  return value
}

describe('Deterministic learning strategy', () => {
  it('keeps the same recommendation when input arrays are reordered', () => {
    const source = fixture('SAMPLE_STRATEGY_WEAK').input
    const first = resolveLearningRecommendation(source)
    const reversed: LearningStrategyInput = {
      ...source,
      masteryRecords: [...source.masteryRecords].reverse(),
      mapNodes: [...source.mapNodes].reverse(),
      knowledgeRelations: [...source.knowledgeRelations].reverse(),
      learningEvidence: [...(source.learningEvidence ?? [])].reverse(),
    }

    expect(resolveLearningRecommendation(reversed)).toEqual(first)
    expect(resolveLearningRecommendation(source)).toEqual(first)
  })

  it('does not depend on time, random selection, energy, rewards, or streak fields', () => {
    const result = resolveLearningRecommendation(fixture('SAMPLE_STRATEGY_IN_PROGRESS').input)
    const serialized = JSON.stringify(result)

    expect(serialized).not.toContain('nextReviewAt')
    expect(serialized).not.toContain('scheduledAt')
    expect(serialized).not.toContain('reviewInterval')
    expect(serialized).not.toContain('decayScore')
    expect(serialized).not.toContain('KnowledgeEnergy')
    expect(serialized).not.toContain('reward')
    expect(serialized).not.toContain('streak')
  })

  it('applies the PHASE 10 mastery thresholds without recalculating mastery', () => {
    const weak = resolveLearningRecommendation(fixture('SAMPLE_STRATEGY_WEAK').input)
    expect(weak.type).toBe('REINFORCE')
    expect(weak.reason?.code).toBe('WEAK_MASTERY')
    expect(weak.reviewRecommendations[0]?.reason.masteryScore).toBe(32)

    const mastered = resolveLearningRecommendation(fixture('SAMPLE_STRATEGY_MASTERED').input)
    expect(mastered.type).toBe('PROCEED_TO_NEXT')
    expect(mastered.reviewRecommendations).toEqual([])
    expect(mastered.nextKnowledgePoint?.knowledgePointId).toBe('SAMPLE_STRATEGY_KP_B')

    const lowConfidence = resolveLearningRecommendation(
      fixture('SAMPLE_STRATEGY_LOW_CONFIDENCE').input,
    )
    expect(lowConfidence.type).toBe('GATHER_MORE_EVIDENCE')
    expect(lowConfidence.reason?.code).toBe('LOW_CONFIDENCE')

    const inProgress = resolveLearningRecommendation(fixture('SAMPLE_STRATEGY_IN_PROGRESS').input)
    expect(inProgress.type).toBe('CONTINUE_CURRENT')
    expect(inProgress.reason?.code).toBe('IN_PROGRESS')
  })

  it('does not turn an absent mastery record into weak mastery', () => {
    const input = fixture('SAMPLE_STRATEGY_IN_PROGRESS').input
    const result = resolveLearningRecommendation({ ...input, masteryRecords: [] })

    expect(result.type).toBe('CONTINUE_CURRENT')
    expect(result.reason?.code).toBe('NOT_STARTED')
    expect(result.reviewRecommendations).toEqual([])
  })

  it('keeps review ranking stable and honors the explicit limit', () => {
    const source = fixture('SAMPLE_STRATEGY_IN_PROGRESS').input
    const records: MasteryRecord[] = [
      {
        ...source.masteryRecords[0],
        knowledgePointId: 'SAMPLE_STRATEGY_KP_B',
        masteryScore: 20,
        confidence: 0.9,
        state: 'weak',
      },
      {
        ...source.masteryRecords[0],
        knowledgePointId: 'SAMPLE_STRATEGY_KP_A',
        masteryScore: 32,
        confidence: 0.8,
        state: 'weak',
      },
    ]
    const input = { ...source, masteryRecords: records }
    const result = resolveReviewRecommendations(input, { limit: 1 })

    expect(result).toHaveLength(1)
    expect(result[0]?.knowledgePointId).toBe('SAMPLE_STRATEGY_KP_B')
  })
})

describe('Map and profile boundaries', () => {
  it('reads map states without mutating status, progress, or prerequisite state', () => {
    const source = fixture('SAMPLE_STRATEGY_MASTERED').input
    const nodes = source.mapNodes.map((node) => ({ ...node }))
    const before = JSON.parse(JSON.stringify(nodes))
    const result = resolveNextLearningRecommendation({ ...source, mapNodes: nodes })

    expect(result.nextKnowledgePoint?.currentStatus).toBe('available')
    expect(nodes).toEqual(before)
    expect(nodes.find((node) => node.id === 'SAMPLE_STRATEGY_NODE_B')?.status).toBe('available')
  })

  it('never selects a locked node as the next knowledge point', () => {
    const result = resolveNextLearningRecommendation(fixture('SAMPLE_STRATEGY_LOCKED').input)

    expect(result.type).toBe('NO_RECOMMENDATION')
    expect(result.reason?.code).toBe('PREREQUISITE_LOCKED')
    expect(result.nextKnowledgePoint).toBeUndefined()
  })

  it('returns a safe empty result when every available node is mastered', () => {
    const result = resolveNextLearningRecommendation(fixture('SAMPLE_STRATEGY_NO_AVAILABLE').input)

    expect(result.type).toBe('NO_RECOMMENDATION')
    expect(result.reason?.code).toBe('NO_AVAILABLE_KNOWLEDGE_POINT')
  })

  it('isolates student records and does not duplicate a shared knowledge identity per textbook', () => {
    const source = fixture('SAMPLE_STRATEGY_WEAK').input
    const otherStudentRecord = { ...source.masteryRecords[0], studentProfileId: 'other-student' }
    const otherStudent = resolveLearningRecommendation({
      ...source,
      masteryRecords: [otherStudentRecord],
    })
    expect(otherStudent.type).toBe('CONTINUE_CURRENT')
    expect(otherStudent.reason?.code).toBe('NOT_STARTED')

    const sameKnowledgeAcrossTextbooks: StrategyMapNode[] = [
      ...source.mapNodes,
      { ...source.mapNodes[0], id: 'SAMPLE_STRATEGY_NODE_OTHER_BOOK', textbookId: 'OTHER_BOOK' },
    ]
    const shared = resolveLearningRecommendation({
      ...source,
      mapNodes: sameKnowledgeAcrossTextbooks,
      currentTextbookId: source.currentTextbookId,
    })
    expect(shared.type).toBe('REINFORCE')
    expect(shared.nextKnowledgePoint?.mapNodeId).toBe('SAMPLE_STRATEGY_NODE_A')
  })

  it('does not mix nodes or relations from a different textbook', () => {
    const source = fixture('SAMPLE_STRATEGY_MASTERED').input
    const result = resolveLearningRecommendation({
      ...source,
      mapNodes: source.mapNodes.map((node) =>
        node.knowledgePointId === 'SAMPLE_STRATEGY_KP_B'
          ? { ...node, textbookId: 'OTHER_BOOK' }
          : node,
      ),
      knowledgeRelations: source.knowledgeRelations.map((relation) =>
        relation.targetKnowledgePointId === 'SAMPLE_STRATEGY_KP_B'
          ? { ...relation, textbookId: 'OTHER_BOOK' }
          : relation,
      ),
    })

    expect(result.nextKnowledgePoint?.knowledgePointId).not.toBe('SAMPLE_STRATEGY_KP_B')
    expect(result.diagnostics).toContain('KNOWLEDGE_RELATIONS_MISSING')
  })

  it('keeps source status visible and blocks unreviewed profile data', () => {
    const profile = fixture('SAMPLE_STRATEGY_WEAK').input
    const blocked = resolveLearningRecommendation({ ...profile, dataset: 'profile' })
    expect(blocked.type).toBe('NO_RECOMMENDATION')
    expect(blocked.reason?.code).toBe('SOURCE_NOT_ALLOWED')
    expect(blocked.warning).toContain('尚未通过审核')

    const development = resolveLearningRecommendation(profile)
    expect(development.type).toBe('REINFORCE')
    expect(development.isSampleDerived).toBe(true)
    expect(development.warning).toContain('开发样本')

    const unverified = resolveLearningRecommendation(strategyShowcaseUnverifiedInput)
    expect(unverified.warning).toContain('UNVERIFIED')
    expect(unverified.isSampleDerived).toBe(false)
  })

  it('returns diagnostics for missing relations and malformed progress instead of unlocking nodes', () => {
    const source = fixture('SAMPLE_STRATEGY_IN_PROGRESS').input
    const missingRelations = resolveLearningRecommendation({ ...source, knowledgeRelations: [] })
    expect(missingRelations.type).toBe('NO_RECOMMENDATION')
    expect(missingRelations.diagnostics).toContain('KNOWLEDGE_RELATIONS_MISSING')

    const corruptedProgress = resolveLearningRecommendation({
      ...source,
      learningMapProgress: [
        { nodeId: 'SAMPLE_STRATEGY_NODE_A', status: 'not-a-status' as never, progress: NaN },
      ],
    })
    expect(corruptedProgress.diagnostics).toContain('INVALID_MAP_PROGRESS: SAMPLE_STRATEGY_NODE_A')
    expect(corruptedProgress.nextKnowledgePoint?.mapNodeId).toBe('SAMPLE_STRATEGY_NODE_A')
  })
})
