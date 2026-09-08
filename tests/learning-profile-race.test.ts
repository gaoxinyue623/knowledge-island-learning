import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { demoLessonPlayerSource } from '@/data/lesson-player/demo'
import { demoAssessmentContext } from '@/data/question-engine'
import { MockLessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import { createLessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import { QuestionEngineAdapter, MockQuestionRepository } from '@/services/question-engine'
import { createQuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import {
  configureLessonPlayerStore,
  resetLessonPlayerStoreDependencies,
  useLessonPlayerStore,
} from '@/stores/lessonPlayerStore'
import {
  configureQuestionEngineStore,
  resetQuestionEngineStoreDependencies,
  useQuestionEngineStore,
} from '@/stores/questionEngineStore'
const memory = () => {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
  }
}
beforeEach(() => setActivePinia(createPinia()))
afterEach(() => {
  vi.restoreAllMocks()
  resetLessonPlayerStoreDependencies()
  resetQuestionEngineStoreDependencies()
})
it('ignores an older lesson response after switching learning profiles', async () => {
  const repository = new MockLessonPlayerRepository()
  let resolve!: (result: Awaited<ReturnType<typeof repository.getLessonPlayerSource>>) => void
  vi.spyOn(repository, 'getLessonPlayerSource').mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  configureLessonPlayerStore({ repository, sessionStorage: createLessonSessionStorage(memory()) })
  const store = useLessonPlayerStore()
  const first = store.loadLesson(demoLessonPlayerSource.context, {
    dataset: 'demo',
    studentId: 'alice',
  })
  await store.loadLesson(demoLessonPlayerSource.context, { dataset: 'demo', studentId: 'bob' })
  const sessionId = store.session!.id
  expect(sessionId).toContain('bob')
  resolve({ source: null, issue: 'CONTENT_EMPTY' })
  await first
  expect(store.session!.id).toBe(sessionId)
  expect(store.status).toBe('ready')
})
it('ignores an older assessment response after switching learning profiles', async () => {
  const adapter = new QuestionEngineAdapter({ questionRepository: new MockQuestionRepository() })
  const result = await adapter.loadAssessment(demoAssessmentContext, { dataset: 'demo' })
  let resolve!: (result: Awaited<ReturnType<typeof adapter.loadAssessment>>) => void
  vi.spyOn(adapter, 'loadAssessment').mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  configureQuestionEngineStore({ adapter, sessionStorage: createQuestionSessionStorage(memory()) })
  const store = useQuestionEngineStore()
  const first = store.loadAssessment(demoAssessmentContext, { dataset: 'demo', studentId: 'alice' })
  await store.loadAssessment(demoAssessmentContext, { dataset: 'demo', studentId: 'bob' })
  const sessionId = store.session!.id
  expect(sessionId).toContain('bob')
  resolve(result)
  await first
  expect(store.session!.id).toBe(sessionId)
  expect(store.status).toBe('ready')
})
