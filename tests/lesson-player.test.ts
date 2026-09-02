import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'

import { demoLessonPlayerSource } from '@/data/lesson-player/demo'
import LessonContentRenderer from '@/components/lesson-player/LessonContentRenderer.vue'
import MediaRenderer from '@/components/lesson-player/MediaRenderer.vue'
import PracticeBlock from '@/components/lesson-player/PracticeBlock.vue'
import {
  buildLessonPlayerViewModel,
  createLessonSession,
  validateLessonLaunchContext,
} from '@/services/lesson-player/lessonPlayerAdapter'
import { MockLessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import {
  createLessonSessionStorage,
  normalizeLessonSession,
  type LessonSessionStorageLike,
} from '@/services/lesson-player/lessonSessionStorage'
import {
  configureLessonPlayerStore,
  resetLessonPlayerStoreDependencies,
  useLessonPlayerStore,
} from '@/stores/lessonPlayerStore'
import type { LessonContentBlockViewModel, LessonLaunchContext } from '@/types'

function memoryStorage(): LessonSessionStorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

const context: LessonLaunchContext = demoLessonPlayerSource.context

afterEach(() => {
  resetLessonPlayerStoreDependencies()
})

describe('LessonPlayer domain and adapter', () => {
  it('validates each link in the textbook to LessonKnowledgePoint launch chain', () => {
    expect(validateLessonLaunchContext(context, demoLessonPlayerSource).valid).toBe(true)
    const invalidCases = [
      ['textbook', { textbook: { ...demoLessonPlayerSource.textbook, id: 'WRONG_TEXTBOOK' } }],
      ['unit', { unit: { ...demoLessonPlayerSource.unit, id: 'WRONG_UNIT' } }],
      ['lesson', { lesson: { ...demoLessonPlayerSource.lesson, id: 'WRONG_LESSON' } }],
      [
        'knowledgePoint',
        {
          knowledgePoint: {
            ...demoLessonPlayerSource.knowledgePoint,
            id: 'WRONG_KNOWLEDGE_POINT',
          },
        },
      ],
      ['mapping', { mapping: { ...demoLessonPlayerSource.mapping, lessonId: 'WRONG_LESSON' } }],
    ] as const

    for (const [label, overrides] of invalidCases) {
      const result = validateLessonLaunchContext(context, {
        ...demoLessonPlayerSource,
        ...overrides,
      })
      expect(result.valid, label).toBe(false)
      expect(result.code, label).toBe('INVALID_CONTEXT')
    }
  })

  it('builds an ordered ViewModel with sample flags and session counts', () => {
    const session = createLessonSession(context, 'student-a')
    const viewModel = buildLessonPlayerViewModel(demoLessonPlayerSource, {
      ...session,
      status: 'in_progress',
      currentStepIndex: 2,
      completedStepIds: [demoLessonPlayerSource.steps[0]?.id ?? ''],
    })

    expect(viewModel.steps).toHaveLength(8)
    expect(viewModel.steps.map((step) => step.sort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(viewModel.session).toEqual(
      expect.objectContaining({ currentStepIndex: 2, completedCount: 1, totalCount: 8 }),
    )
    expect(viewModel.flags).toEqual(
      expect.objectContaining({ isDemo: true, isSample: true, isContentAvailable: true }),
    )
  })

  it('normalizes orphan completed step IDs and an out-of-range cursor', () => {
    const session = createLessonSession(context)
    const normalized = normalizeLessonSession(
      {
        ...session,
        currentStepIndex: 99,
        completedStepIds: ['DEMO_LESSON_STEP_01', 'REMOVED_STEP'],
      },
      ['DEMO_LESSON_STEP_01', 'DEMO_LESSON_STEP_02'],
    )

    expect(normalized.currentStepIndex).toBe(1)
    expect(normalized.completedStepIds).toEqual(['DEMO_LESSON_STEP_01'])
  })
})

describe('Lesson Session Storage', () => {
  it('keeps multiple knowledge point sessions under one versioned payload', () => {
    const storage = createLessonSessionStorage(memoryStorage())
    const first = createLessonSession(context, 'student-a')
    const second = createLessonSession({ ...context, knowledgePointId: 'DEMO_KP_02' }, 'student-a')
    storage.save(first)
    storage.save(second)

    expect(storage.loadAll()).toHaveLength(2)
    expect(storage.get(first.id)?.knowledgePointId).toBe('DEMO_KP_01')
    expect(first.id).toBe(createLessonSession(context, 'student-a').id)
  })

  it('recovers from corrupted storage without throwing', () => {
    const raw = memoryStorage()
    raw.setItem('knowledge-island.lesson-sessions', '{broken')
    const storage = createLessonSessionStorage(raw)

    expect(storage.loadAll()).toEqual([])
    expect(storage.getLastWarning()).toContain('安全恢复')
    expect(raw.getItem('knowledge-island.lesson-sessions')).toBeNull()
  })
})

describe('LessonPlayer repository and store', () => {
  it('returns a content-empty result without entering the player', async () => {
    const repository = new MockLessonPlayerRepository({ mode: 'empty' })

    await expect(repository.getLessonPlayerSource(context, 'profile')).resolves.toEqual(
      expect.objectContaining({ source: null, issue: 'CONTENT_EMPTY' }),
    )
  })

  it('propagates the unverified content flag in development data', async () => {
    const repository = new MockLessonPlayerRepository()
    const result = await repository.getLessonPlayerSource(context, 'demo', {
      demoState: 'unverified',
    })

    expect(result.source).not.toBeNull()
    if (!result.source) return
    const viewModel = buildLessonPlayerViewModel(result.source, createLessonSession(context))
    expect(viewModel.flags).toEqual(expect.objectContaining({ isUnverified: true, isDemo: false }))
  })

  it('blocks sample learning content when the production content policy is used', async () => {
    const repository = new MockLessonPlayerRepository({
      accessPolicy: {
        allowSampleCurriculum: false,
        allowUnreviewedCurriculum: false,
        allowSampleLearningContent: false,
        allowUnreviewedLearningContent: false,
      },
    })

    await expect(repository.getLessonPlayerSource(context, 'demo')).resolves.toEqual(
      expect.objectContaining({ source: null, issue: 'CONTENT_NOT_AVAILABLE' }),
    )
  })

  it('loads, resumes, completes a session and calls the explicit map interface', async () => {
    const raw = memoryStorage()
    const sessionStorage = createLessonSessionStorage(raw)
    const completedContexts: LessonLaunchContext[] = []
    configureLessonPlayerStore({
      repository: new MockLessonPlayerRepository(),
      sessionStorage,
      mapCompletionService: {
        async markKnowledgePointCompleted(nextContext) {
          completedContexts.push(nextContext)
          return true
        },
      },
    })

    setActivePinia(createPinia())
    const store = useLessonPlayerStore()
    await store.loadLesson(context, { dataset: 'demo', studentId: 'student-a' })
    expect(store.status).toBe('ready')
    expect(store.session?.status).toBe('not_started')
    expect(store.goPrevious()).toBe(false)
    expect(store.goNext()).toBe(true)
    expect(store.currentStepIndex).toBe(1)
    expect(store.session?.status).toBe('in_progress')

    setActivePinia(createPinia())
    const resumed = useLessonPlayerStore()
    await resumed.loadLesson(context, { dataset: 'demo', studentId: 'student-a' })
    expect(resumed.currentStepIndex).toBe(1)
    expect(resumed.resumeSession()).toBe(true)

    while (!resumed.isLastStep) resumed.goNext()
    expect(await resumed.completeLesson()).toBe(true)
    expect(resumed.status).toBe('completed')
    expect(resumed.session?.status).toBe('completed')
    expect(completedContexts).toEqual([context])
  })
})

describe('Lesson content renderer', () => {
  it('renders all demo block kinds without scoring controls', () => {
    const blocks = demoLessonPlayerSource.blocks
      .map(
        (block) =>
          buildLessonPlayerViewModel(
            demoLessonPlayerSource,
            createLessonSession(context),
          ).steps.find((step) => step.contentBlockIds.includes(block.id))?.contentBlocks[0],
      )
      .filter((block): block is LessonContentBlockViewModel => Boolean(block))
    const wrapper = mount(LessonContentRenderer, { props: { blocks, showDiagnostics: true } })

    expect(wrapper.text()).toContain('今天学什么')
    expect(wrapper.text()).toContain('认识概念')
    expect(wrapper.text()).toContain('想一想')
    expect(wrapper.text()).not.toContain('提交答题')
    expect(wrapper.findAll('.lesson-block')).toHaveLength(8)
  })

  it('shows a friendly fallback for an unknown block type', () => {
    const unknown = {
      id: 'UNKNOWN_BLOCK',
      type: 'future-block',
      content: '暂不支持',
      isSample: true,
      sort: 1,
    } satisfies LessonContentBlockViewModel
    const wrapper = mount(LessonContentRenderer, {
      props: { blocks: [unknown], showDiagnostics: true },
    })

    expect(wrapper.text()).toContain('这一步的内容正在准备中')
    expect(wrapper.text()).toContain('Unsupported Content Block')
  })

  it('exposes the assessment entry only when the question engine reports availability', async () => {
    const practiceBlock = buildLessonPlayerViewModel(
      demoLessonPlayerSource,
      createLessonSession(context),
    )
      .steps.flatMap((step) => step.contentBlocks)
      .find((block) => block.type === 'practice')

    expect(practiceBlock).toBeDefined()
    if (!practiceBlock) return

    const wrapper = mount(PracticeBlock, {
      props: { block: practiceBlock, assessmentAvailable: true },
    })
    const assessmentButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('开始练习'))
    expect(assessmentButton).toBeDefined()
    await assessmentButton?.trigger('click')
    expect(wrapper.emitted('start-assessment')).toHaveLength(1)

    const unavailable = mount(PracticeBlock, {
      props: { block: practiceBlock, assessmentAvailable: false },
    })
    expect(unavailable.text()).toContain('练习内容正在准备中')
    expect(unavailable.text()).not.toContain('开始练习')
  })

  it('falls back when a media URL fails instead of blanking the page', async () => {
    const wrapper = mount(MediaRenderer, {
      props: {
        media: {
          id: 'BROKEN_MEDIA',
          mediaType: 'IMAGE',
          url: '/missing.svg',
          mimeType: 'image/svg+xml',
          width: 100,
          height: 100,
          durationSeconds: null,
          altText: '示例插图',
          transcript: null,
          isAvailable: true,
          fallbackText: '媒体加载失败，可继续阅读这一步。',
        },
      },
    })
    await wrapper.get('img').trigger('error')

    expect(wrapper.text()).toContain('媒体加载失败')
  })

  it('uses a fallback when a media asset is marked unavailable', () => {
    const wrapper = mount(MediaRenderer, {
      props: {
        media: {
          id: 'UNAVAILABLE_MEDIA',
          mediaType: 'IMAGE',
          url: '/exists-but-not-approved.svg',
          mimeType: 'image/svg+xml',
          width: 100,
          height: 100,
          durationSeconds: null,
          altText: '待开放插图',
          transcript: null,
          isAvailable: false,
          fallbackText: '媒体内容暂未开放。',
        },
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('媒体内容暂未开放')
  })
})
