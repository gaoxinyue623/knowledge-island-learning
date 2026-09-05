import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { sampleCurriculumData } from '@/data/curriculum/sample'
import { demoLearningMapSource } from '@/data/learning-map/demo'
import { goldenMathPepG3S1Package } from '@/data/curriculum/verified/math/pep/g3-s1'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import {
  buildLearningMapLayout,
  buildLearningMapSourceFromImportPackage,
  buildLearningMapViewModel,
  createLearningMapProgressStorage,
  flattenKnowledgeNodes,
  resolveNodeStates,
} from '@/services/learning-map'
import { buildMasteryRecord } from '@/services/mastery'
import type { LearningMapProgressRecord, LearningMapViewModel } from '@/types'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { LEARNING_MAP_LAYOUT } from '@/services/learning-map/learningMapLayout'

function nodesOf(viewModel: LearningMapViewModel) {
  return flattenKnowledgeNodes(viewModel.islands)
}

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('LearningMap curriculum adapter', () => {
  it('maps the Golden Curriculum chain without adding visual fields to the source', () => {
    const source = buildLearningMapSourceFromImportPackage(goldenMathPepG3S1Package)
    const viewModel = buildLearningMapViewModel(source)

    expect(viewModel.textbook.title).toContain('PEP')
    expect(viewModel.islands).toHaveLength(1)
    expect(viewModel.islands[0]?.lessons).toHaveLength(3)
    expect(nodesOf(viewModel)).toHaveLength(6)
    expect(viewModel.flags.isUnverified).toBe(true)
    expect(viewModel.flags.isDemo).toBe(false)
    expect(viewModel.progress).toEqual({ completedNodes: 0, totalNodes: 6, percentage: 0 })
    expect(source.units[0]).not.toHaveProperty('position')
    expect(source.knowledgePoints[0]).not.toHaveProperty('visual')
  })

  it('maps Unit, Lesson, KnowledgePoint and prerequisite connections', () => {
    const viewModel = buildLearningMapViewModel(demoLearningMapSource, [])
    const nodes = nodesOf(viewModel)

    expect(viewModel.islands).toHaveLength(3)
    expect(viewModel.islands.every((island) => island.lessons.length === 2)).toBe(true)
    expect(nodes).toHaveLength(18)
    expect(viewModel.connections).toHaveLength(17)
    expect(nodes.every((node) => node.isSample)).toBe(true)
    expect(nodes[0]?.status).toBe('available')
    expect(nodes[1]?.status).toBe('locked')
  })

  it('resolves a prerequisite across lessons and units deterministically', () => {
    const initial = buildLearningMapViewModel(demoLearningMapSource)
    const firstNode = nodesOf(initial)[0]
    if (!firstNode) throw new Error('demo fixture has no first node')
    const completed: LearningMapProgressRecord = {
      nodeId: firstNode.id,
      status: 'completed',
      progress: 100,
      completedAt: '2026-09-02T00:00:00+08:00',
    }
    const next = buildLearningMapViewModel(demoLearningMapSource, [completed])
    const nextNodes = nodesOf(next)

    expect(nextNodes[0]?.status).toBe('completed')
    expect(nextNodes[1]?.status).toBe('available')
    expect(nextNodes[6]?.status).toBe('locked')
    expect(next.currentNodeId).toBe(nextNodes[1]?.id)
  })

  it('computes lesson, unit and overall completion independently', () => {
    const initial = buildLearningMapViewModel(demoLearningMapSource)
    const firstLessonNodes = initial.islands[0]?.lessons[0]?.nodes ?? []
    const completed = firstLessonNodes.map((node) => ({
      nodeId: node.id,
      status: 'completed' as const,
      progress: 100,
    }))
    const next = buildLearningMapViewModel(demoLearningMapSource, completed)

    expect(next.islands[0]?.lessons[0]?.progress).toBe(100)
    expect(next.islands[0]?.progress).toBe(50)
    expect(next.progress).toEqual({ completedNodes: 3, totalNodes: 18, percentage: 17 })
  })

  it('attaches mastery as a separate knowledge view without changing map completion or unlock state', () => {
    const initial = buildLearningMapViewModel(demoLearningMapSource, [], {
      masteryRecords: [
        buildMasteryRecord({
          studentProfileId: 'student-a',
          knowledgePointId: 'DEMO_KP_01',
          evidence: [
            {
              id: 'map-mastery-1',
              type: 'question_attempt',
              studentProfileId: 'student-a',
              knowledgePointId: 'DEMO_KP_01',
              source: { questionId: 'map-question-1' },
              outcome: 'correct',
              questionDifficulty: 3,
              knowledgeWeight: 1,
              evidenceWeight: 1,
              occurredAt: '2026-09-01T00:00:00.000Z',
            },
            {
              id: 'map-mastery-2',
              type: 'question_attempt',
              studentProfileId: 'student-a',
              knowledgePointId: 'DEMO_KP_01',
              source: { questionId: 'map-question-2' },
              outcome: 'correct',
              questionDifficulty: 3,
              knowledgeWeight: 1,
              evidenceWeight: 1,
              occurredAt: '2026-09-01T00:00:01.000Z',
            },
            {
              id: 'map-mastery-3',
              type: 'question_attempt',
              studentProfileId: 'student-a',
              knowledgePointId: 'DEMO_KP_01',
              source: { questionId: 'map-question-3' },
              outcome: 'correct',
              questionDifficulty: 3,
              knowledgeWeight: 1,
              evidenceWeight: 1,
              occurredAt: '2026-09-01T00:00:02.000Z',
            },
          ],
        }),
      ],
    })
    const nodes = nodesOf(initial)
    expect(nodes[0]?.mastery?.state).toBe('mastered')
    expect(nodes[0]?.mastery?.score).toBe(100)
    expect(nodes[0]?.status).toBe('available')
    expect(nodes[1]?.status).toBe('locked')
    expect(initial.progress).toEqual({ completedNodes: 0, totalNodes: 18, percentage: 0 })
  })

  it('keeps layout positions stable for the same curriculum', () => {
    const first = buildLearningMapViewModel(demoLearningMapSource)
    const second = buildLearningMapViewModel(demoLearningMapSource)

    expect(buildLearningMapLayout(first.islands)).toEqual(buildLearningMapLayout(second.islands))
    expect(nodesOf(first).map((node) => node.position)).toEqual(
      nodesOf(second).map((node) => node.position),
    )
  })

  it('keeps game-map lesson cards in separate logical lanes', () => {
    const viewModel = buildLearningMapViewModel(demoLearningMapSource)

    for (const island of viewModel.islands) {
      for (let index = 0; index < island.lessons.length; index += 1) {
        const lesson = island.lessons[index]
        if (!lesson) continue

        for (const nextLesson of island.lessons.slice(index + 1)) {
          const overlapsHorizontally =
            lesson.position.x < nextLesson.position.x + LEARNING_MAP_LAYOUT.lessonWidth &&
            lesson.position.x + LEARNING_MAP_LAYOUT.lessonWidth > nextLesson.position.x
          const overlapsVertically =
            lesson.position.y < nextLesson.position.y + LEARNING_MAP_LAYOUT.lessonHeight &&
            lesson.position.y + LEARNING_MAP_LAYOUT.lessonHeight > nextLesson.position.y

          expect(overlapsHorizontally && overlapsVertically).toBe(false)
        }

        for (const node of lesson.nodes) {
          expect(node.position.x).toBeGreaterThanOrEqual(lesson.position.x)
          expect(node.position.x).toBeLessThanOrEqual(
            lesson.position.x + LEARNING_MAP_LAYOUT.lessonWidth,
          )
          expect(node.position.y).toBeGreaterThanOrEqual(lesson.position.y)
          expect(node.position.y).toBeLessThanOrEqual(
            lesson.position.y + LEARNING_MAP_LAYOUT.lessonHeight,
          )
        }
      }
    }
  })

  it('returns a usable empty view model when there are no curriculum units', () => {
    const viewModel = buildLearningMapViewModel({
      ...demoLearningMapSource,
      units: [],
      lessons: [],
      knowledgePoints: [],
      lessonKnowledgePoints: [],
      knowledgeRelations: [],
    })

    expect(viewModel.islands).toEqual([])
    expect(viewModel.currentNodeId).toBeUndefined()
    expect(viewModel.progress).toEqual({ completedNodes: 0, totalNodes: 0, percentage: 0 })
  })
})

describe('LearningMap progress rules and storage', () => {
  it('never derives mastered or perfect from a numeric score', () => {
    const source = buildLearningMapSourceFromImportPackage(goldenMathPepG3S1Package)
    const nodes = nodesOf(buildLearningMapViewModel(source))
    const states = resolveNodeStates(nodes, [
      { nodeId: nodes[0]?.id ?? '', status: 'completed', progress: 100 },
    ])

    expect(states.get(nodes[0]?.id ?? '')?.status).toBe('completed')
    expect([...states.values()].some((state) => state.status === 'mastered')).toBe(false)
    expect([...states.values()].some((state) => state.status === 'perfect')).toBe(false)
  })

  it('persists a versioned payload and ignores orphan records by textbook', () => {
    const storage = memoryStorage()
    const repository = createLearningMapProgressStorage(storage)
    const records: LearningMapProgressRecord[] = [
      { nodeId: 'learning-map:node-1', status: 'learning', progress: 12 },
    ]

    repository.save('textbook-1', records)
    expect(repository.load('textbook-1')).toEqual(records)
    expect(repository.load('textbook-2')).toEqual([])
    expect(JSON.parse(storage.getItem('knowledge-island.learning-map-progress') ?? '{}')).toEqual({
      schemaVersion: 1,
      textbookId: 'textbook-1',
      records,
    })
  })

  it('drops malformed progress payloads instead of breaking map loading', () => {
    const storage = memoryStorage()
    storage.setItem('knowledge-island.learning-map-progress', '{broken')
    const repository = createLearningMapProgressStorage(storage)

    expect(repository.load('textbook-1')).toEqual([])
  })

  it('reports progress records whose node IDs no longer exist', () => {
    const source = buildLearningMapSourceFromImportPackage(goldenMathPepG3S1Package)
    const viewModel = buildLearningMapViewModel(source, [
      { nodeId: 'old-node-id', status: 'completed', progress: 100 },
    ])

    expect(viewModel.diagnostics).toEqual([
      expect.objectContaining({ code: 'ORPHAN_PROGRESS', entityId: 'old-node-id' }),
    ])
  })

  it('loads, starts, completes, unlocks and resets demo progress through the store', async () => {
    setActivePinia(createPinia())
    const store = useLearningMapStore()
    const loaded = await store.loadMap({ dataset: 'demo' })
    if (!loaded) throw new Error('demo map failed to load')
    const firstNode = nodesOf(loaded)[0]
    const secondNode = nodesOf(loaded)[1]
    if (!firstNode || !secondNode) throw new Error('demo fixture has too few nodes')

    expect(store.currentNode?.id).toBe(firstNode.id)
    expect(store.markNodeStarted(firstNode.id)).toBe(true)
    expect(store.viewModel?.currentNodeId).toBe(firstNode.id)
    expect(nodesOf(store.viewModel as LearningMapViewModel)[0]?.status).toBe('learning')
    expect(store.markNodeCompleted(firstNode.id)).toBe(true)
    expect(nodesOf(store.viewModel as LearningMapViewModel)[0]?.status).toBe('completed')
    expect(store.viewModel?.progress.completedNodes).toBe(1)
    expect(nodesOf(store.viewModel as LearningMapViewModel)[1]?.status).toBe('available')
    expect(store.resetDemoProgress()).toBe(true)
    expect(store.viewModel?.progress.completedNodes).toBe(0)
  })

  it('keeps empty and unsupported curriculum unavailable', async () => {
    const emptyService = new MockCurriculumService({ mode: 'empty' })
    const unsupportedService = new MockCurriculumService({ mode: 'unsupported' })

    await expect(
      emptyService.getLearningMapCurriculum('SAMPLE_MATH_TEXTBOOK_G3_UPPER_A'),
    ).resolves.toBeNull()
    await expect(
      unsupportedService.getLearningMapCurriculum('SAMPLE_MATH_TEXTBOOK_G3_UPPER_A'),
    ).resolves.toBeNull()
  })

  it('blocks SAMPLE curriculum from the production access policy', async () => {
    const productionService = new MockCurriculumService({
      data: sampleCurriculumData,
      accessPolicy: {
        allowSampleCurriculum: false,
        allowUnreviewedCurriculum: false,
      },
    })

    await expect(
      productionService.getLearningMapCurriculum('SAMPLE_MATH_TEXTBOOK_G3_UPPER_A'),
    ).resolves.toBeNull()
  })
})
