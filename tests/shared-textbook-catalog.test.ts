import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import { IDBFactory } from 'fake-indexeddb'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

const remote = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('@/config/production', async () => {
  const config = await vi.importActual<typeof import('@/config/production')>('@/config/production')
  // Use the real release policy, independent of Vitest's development environment.
  return { ...config, productionConfig: config.resolveProductionConfig({ isProduction: true }) }
})
vi.mock('@/services/pet/petCloud', async () => ({
  ...(await vi.importActual('@/services/pet/petCloud')),
  petCloudRequest: remote.request,
}))

import { localCurriculumData } from '@/data/curriculum/localCatalog'
import { productionConfig } from '@/config/production'
import { curriculumService } from '@/services/runtime'
import { accountState, initializeAccount } from '@/services/account/accountService'
import { canonicalSnapshot, type AccountSnapshot } from '@/services/account/contract'
import { selectAccount } from '@/services/account/storage'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { useCurriculumStore } from '@/stores/curriculumStore'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import TextbookVersionSelector from '@/components/curriculum/TextbookVersionSelector.vue'

const importedIds = [...new Set(localCurriculumData.textbooks.map((book) => book.id))].sort()
const accountCases = ['new_parent', 'returning_parent', 'cloud_restored_parent'] as const

async function signIn(username: (typeof accountCases)[number]) {
  const textbook = localCurriculumData.textbooks.find((book) => book.gradeId === 'GRADE_2')!
  const profile = {
    studentId: 'local-profile',
    regionId: localCurriculumData.regions[0]!.id,
    gradeId: textbook.gradeId,
    semesterId: textbook.semesterId,
    chineseTextbookVersionId: textbook.id,
    mathTextbookVersionId: null,
    englishTextbookVersionId: null,
    confirmedAt: '2026-09-28T00:00:00.000Z',
    source: 'USER_CONFIRMED' as const,
  }
  if (username === 'returning_parent') {
    selectAccount(username)
    curriculumProfileRepository.save(profile)
  }
  const snapshot: AccountSnapshot = {
    schemaVersion: 1,
    entries: [
      {
        key: 'knowledge-island.curriculum-profile',
        value: JSON.stringify({ schemaVersion: 1, profile }),
      },
    ],
    pets: [],
  }
  const digest = Buffer.from(
    await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalSnapshot(snapshot))),
  ).toString('hex')
  // Only the HTTP transport is replaced: the actual account initialization,
  // account namespace switch and cloud installation run below.
  remote.request.mockImplementation(async (path: string, method: string) => {
    if (path === 'session') return { username }
    if (path === 'account/data' && method === 'GET')
      return {
        data:
          username === 'new_parent'
            ? null
            : { revision: 1, digest, updatedAt: '2026-09-28T00:00:00.000Z', snapshot },
      }
    throw new Error(`Unexpected request: ${method} ${path}`)
  })
  await initializeAccount()
  expect(accountState.ready).toBe(true)
  expect(accountState.error).toBe('')
  expect(accountState.username).toBe(username)
  setActivePinia(createPinia())
  return useCurriculumStore()
}

beforeEach(() => {
  selectAccount(null)
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('crypto', webcrypto)
  Object.assign(accountState, {
    username: null,
    ready: false,
    error: '',
    sync: 'idle',
    conflict: null,
    lastSaved: '',
  })
  remote.request.mockReset()
})
afterEach(() => {
  selectAccount(null)
  vi.unstubAllGlobals()
})

describe('shared imported textbooks across authenticated accounts', () => {
  it('keeps every imported textbook available through repeated login and cloud restoration', async () => {
    expect(productionConfig.isProduction).toBe(true)
    expect(productionConfig.allowUnreviewedCurriculum).toBe(false)
    expect(importedIds).toHaveLength(40)
    for (const username of [...accountCases, 'returning_parent', 'new_parent'] as const) {
      const store = await signIn(username)
      expect((await curriculumService.getTextbookVersions()).map((book) => book.id).sort()).toEqual(
        importedIds,
      )
      for (const id of importedIds) {
        expect(await curriculumService.getTextbookDisplay(id)).toMatchObject({ textbook: { id } })
      }
      if (username === 'new_parent') {
        expect(store.curriculumProfile).toBeNull()
        expect(store.selectedTextbooks).toEqual({ CHINESE: null, MATH: null, ENGLISH: null })
      } else {
        expect(store.curriculumProfile?.gradeId).toBe('GRADE_2')
      }
    }
  })

  describe.each(accountCases)('%s', (username) => {
    it.each([
      ['GRADE_1', 'SEMESTER_UPPER'],
      ['GRADE_1', 'SEMESTER_LOWER'],
      ['GRADE_2', 'SEMESTER_UPPER'],
      ['GRADE_2', 'SEMESTER_LOWER'],
    ])('renders every imported option for %s / %s', async (gradeId, semesterId) => {
      const store = await signIn(username)
      const confirmedBefore = curriculumProfileRepository.load()
      store.setContext({ regionId: localCurriculumData.regions[0]!.id, gradeId, semesterId })
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/onboarding/textbooks', component: TextbookConfirmPage }],
      })
      await router.push('/onboarding/textbooks')
      const wrapper = mount(TextbookConfirmPage, {
        global: {
          plugins: [router],
          stubs: {
            CurriculumPageFrame: { template: '<main><slot /></main>' },
            teleport: true,
          },
        },
      })
      try {
        await flushPromises()
        await vi.waitFor(() => expect(store.availableTextbooks).not.toBeNull(), { timeout: 5000 })
        expect(wrapper.text()).not.toContain('教材暂时打不开')
        const expected = localCurriculumData.textbooks.filter(
          (book) => book.gradeId === gradeId && book.semesterId === semesterId,
        )
        const shown = Object.values(store.availableTextbooks!)
          .flatMap((subject) => subject.availableTextbooks.map((book) => book.id))
          .sort()
        expect(shown).toEqual(expected.map((book) => book.id).sort())
        expect(
          wrapper
            .findAllComponents(TextbookCard)
            .reduce((count, card) => count + card.props('candidateCount'), 0),
        ).toBe(expected.length)
        for (const card of wrapper.findAllComponents(TextbookCard)) {
          if (!card.props('candidateCount')) continue
          if (card.props('candidateCount') === 1) {
            expect(card.props('selected')).toBe(true)
            expect(wrapper.text()).toContain(card.props('textbook')!.textbook.versionName)
            continue
          }
          await card.get('.textbook-card__change').trigger('click')
          const options = wrapper.getComponent(TextbookVersionSelector).props('options')
          const subjectId = localCurriculumData.subjects.find(
            (subject) => subject.code === card.props('subjectCode'),
          )!.id
          expect(options.map((option) => option.textbook.id).sort()).toEqual(
            expected
              .filter((book) => book.subjectId === subjectId)
              .map((book) => book.id)
              .sort(),
          )
          for (const option of options)
            expect(wrapper.text()).toContain(option.textbook.versionName)
        }
        // Browsing the shared catalog must not overwrite a saved personal choice.
        expect(curriculumProfileRepository.load()).toEqual(confirmedBefore)
      } finally {
        wrapper.unmount()
      }
    })
  })
})
