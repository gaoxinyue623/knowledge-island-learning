import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import { curriculumData } from '@/data/curriculum'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import TextbookVersionSelector from '@/components/curriculum/TextbookVersionSelector.vue'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import { curriculumService } from '@/services'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import {
  createCurriculumProfileRepository,
  curriculumProfileRepository,
} from '@/services/storage/curriculumProfileRepository'
import {
  configureCurriculumStore,
  resetCurriculumStoreDependencies,
  useCurriculumStore,
} from '@/stores/curriculumStore'
import type { StudentCurriculumProfile } from '@/types'

const accessPolicy = { allowSampleCurriculum: false, allowUnreviewedCurriculum: true }
const regions = curriculumData.regions.map((region) => region.id)
const context = { regionId: regions[0]!, gradeId: 'GRADE_1', semesterId: 'SEMESTER_LOWER' }
const books = {
  CHINESE: 'G1_PEP_CHINESE_S2_2024_CANDIDATE',
  MATH: 'G1_SHENZHEN_BNU_MATH_S2_2024_CANDIDATE',
  ENGLISH: 'G1_SHENZHEN_SHANGHAI_ENGLISH_S2_2024_CANDIDATE',
} as const
const profile: StudentCurriculumProfile = {
  ...context,
  studentId: 'free-choice-test',
  chineseTextbookVersionId: books.CHINESE,
  mathTextbookVersionId: books.MATH,
  englishTextbookVersionId: books.ENGLISH,
  confirmedAt: '2026-09-05T00:00:00Z',
  source: 'USER_CONFIRMED',
}

function setupService() {
  const values = new Map<string, string>()
  const repository = createCurriculumProfileRepository({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  })
  const service = new MockCurriculumService({ accessPolicy, profileRepository: repository })
  configureCurriculumStore({ curriculumService: service })
  return { service, repository }
}

beforeEach(() => {
  curriculumProfileRepository.clear()
  setActivePinia(createPinia())
})
afterEach(() => {
  curriculumProfileRepository.clear()
  resetCurriculumStoreDependencies()
  vi.restoreAllMocks()
})

describe('region-independent textbook catalog', () => {
  it.each([
    ['GRADE_1', 'SEMESTER_UPPER', 3],
    ['GRADE_1', 'SEMESTER_LOWER', 3],
    ['GRADE_2', 'SEMESTER_UPPER', 3],
    ['GRADE_2', 'SEMESTER_LOWER', 2],
  ] as const)(
    'offers every imported book in %s / %s across all regions',
    async (gradeId, semesterId, count) => {
      const { service } = setupService()
      const expected = curriculumData.textbooks
        .filter((book) => book.gradeId === gradeId && book.semesterId === semesterId)
        .map((book) => book.id)
        .sort()
      expect(expected).toHaveLength(count)
      const baseline = await service.resolveAvailableTextbooks({ ...context, gradeId, semesterId })
      for (const regionId of [...regions, 'region-without-any-mapping']) {
        const result = await service.resolveAvailableTextbooks({ regionId, gradeId, semesterId })
        expect(result).toEqual(baseline)
        expect(
          Object.values(result)
            .flatMap((subject) => subject.availableTextbooks.map((book) => book.id))
            .sort(),
        ).toEqual(expected)
        for (const subject of Object.values(result)) {
          expect(subject.recommendedTextbookId).toBeUndefined()
          for (const book of subject.availableTextbooks) {
            expect(book.subjectId).toBe(subject.subjectId)
            expect(await service.getTextbookDisplay(book.id)).not.toBeNull()
            expect((await service.getLearningMapCurriculum(book.id))?.textbook.id).toBe(book.id)
          }
        }
      }
    },
  )

  it('does not require regional relations, region approval, or an automatic default', async () => {
    const service = new MockCurriculumService({
      accessPolicy,
      data: { regions: [], regionTextbookRelations: [] },
    })
    const result = await service.resolveAvailableTextbooks(context)
    expect(result.math.availableTextbooks.map((book) => book.id)).toEqual([books.MATH])
    expect(result.math.resolutionStatus).toBe('NEEDS_CONFIRMATION')
    expect(result.math.recommendedTextbookId).toBeUndefined()
  })

  it('sorts and deduplicates the catalog independently of regional priority', async () => {
    const math = curriculumData.textbooks.find((book) => book.id === books.MATH)!
    const service = new MockCurriculumService({
      accessPolicy,
      data: {
        textbooks: [{ ...math, id: 'Z_CHOICE' }, math, { ...math, id: 'A_CHOICE' }, math],
      },
    })
    const result = await service.resolveAvailableTextbooks(context)
    expect(result.math.availableTextbooks.map((book) => book.id)).toEqual([
      'A_CHOICE',
      books.MATH,
      'Z_CHOICE',
    ])
  })

  it('retains textbook and publisher source guards without a regional gate', async () => {
    const math = curriculumData.textbooks.find((book) => book.id === books.MATH)!
    const publisher = curriculumData.publishers.find((entry) => entry.id === math.publisherId)!
    const reviewed = { ...math, verificationStatus: 'REVIEWED' as const, needsVerification: false }
    const service = new MockCurriculumService({
      accessPolicy: { allowSampleCurriculum: false, allowUnreviewedCurriculum: false },
      data: {
        regions: [],
        regionTextbookRelations: [],
        publishers: [
          { ...publisher, verificationStatus: 'REVIEWED', needsVerification: false },
          { ...publisher, id: 'unreviewed-publisher', verificationStatus: 'UNVERIFIED' },
        ],
        textbooks: [
          math,
          { ...reviewed, id: 'sample', verificationStatus: 'SAMPLE', isSample: true },
          { ...reviewed, id: 'rejected', verificationStatus: 'REJECTED' },
          { ...reviewed, id: 'archived', status: 'ARCHIVED' },
          { ...reviewed, id: 'draft', status: 'DRAFT' },
          { ...reviewed, id: 'bad-publisher', publisherId: 'unreviewed-publisher' },
          { ...reviewed, id: 'missing-publisher', publisherId: 'missing' },
          { ...reviewed, id: 'reviewed' },
        ],
      },
    })
    expect(
      (await service.resolveAvailableTextbooks(context)).math.availableTextbooks.map(
        (book) => book.id,
      ),
    ).toEqual(['reviewed'])
    await expect(
      service.saveCurriculumProfile({
        ...profile,
        chineseTextbookVersionId: null,
        englishTextbookVersionId: null,
        mathTextbookVersionId: 'bad-publisher',
      }),
    ).rejects.toThrow('请重新选择')
  })
})

describe('explicit textbook choice and persistence', () => {
  it.each(['G2_PEP_CHINESE_S2_2024_CANDIDATE', 'G2_PEP_CHINESE_S2_REVISED_CANDIDATE'])(
    'preserves %s on reload and only changes edition after explicit confirmation',
    async (bookId) => {
      const { repository } = setupService()
      const savedProfile = {
        ...profile,
        gradeId: 'GRADE_2',
        chineseTextbookVersionId: bookId,
        mathTextbookVersionId: null,
        englishTextbookVersionId: null,
      }
      repository.save(savedProfile)
      const store = useCurriculumStore()
      await store.loadCurriculumProfile(profile.studentId)
      await store.resolveTextbooks()
      expect(store.chineseTextbookVersionId).toBe(bookId)
      expect(store.availableTextbooks?.chinese.availableTextbooks).toHaveLength(2)
      const otherId = bookId.includes('REVISED')
        ? 'G2_PEP_CHINESE_S2_2024_CANDIDATE'
        : 'G2_PEP_CHINESE_S2_REVISED_CANDIDATE'
      store.beginEdit()
      await store.resolveTextbooks()
      expect(store.selectTextbook('CHINESE', otherId)).toBe(true)
      expect(repository.load()).toEqual(savedProfile)
      store.beginEdit()
      expect(store.chineseTextbookVersionId).toBe(bookId)
      await store.resolveTextbooks()
      store.selectTextbook('CHINESE', otherId)
      const confirmed = await store.confirmCurriculum(profile.studentId)
      expect(confirmed?.chineseTextbookVersionId).toBe(otherId)
      vi.spyOn(curriculumProfileRepository, 'load').mockImplementation(() => repository.load())
      setActivePinia(createPinia())
      expect(useCurriculumStore().chineseTextbookVersionId).toBe(otherId)
    },
  )

  it.each(
    regions.flatMap((regionId) =>
      (['CHINESE', 'MATH', 'ENGLISH'] as const).map((subject) => [regionId, subject] as const),
    ),
  )('allows a %s profile to confirm only %s', async (regionId, subject) => {
    const { service, repository } = setupService()
    const store = useCurriculumStore()
    store.setContext({ ...context, regionId })
    await store.resolveTextbooks()
    expect(store.selectedTextbooks).toEqual({ CHINESE: null, MATH: null, ENGLISH: null })
    expect(await store.confirmCurriculum(profile.studentId)).toBeNull()
    expect(repository.load()).toBeNull()
    expect(store.selectTextbook(subject, books[subject])).toBe(true)
    expect(store.draftIsComplete).toBe(true)
    const saved = await store.confirmCurriculum(profile.studentId)
    expect(saved).not.toBeNull()
    expect(store.isComplete).toBe(true)
    expect(repository.load()).toEqual(saved)
    expect(await service.getCurriculumProfile(profile.studentId)).toEqual(saved)
  })

  it('preserves selected books on region changes, refresh, and cancellation', async () => {
    const { service, repository } = setupService()
    repository.save(profile)
    const store = useCurriculumStore()
    await store.loadCurriculumProfile(profile.studentId)
    store.beginEdit()
    store.selectRegion(regions[1]!)
    await store.resolveTextbooks()
    expect(store.selectedTextbooks).toEqual(books)
    expect(repository.load()).toEqual(profile)
    expect(store.curriculumProfile).toEqual(profile)
    store.beginEdit()
    expect(store.regionId).toBe(profile.regionId)
    store.selectRegion(regions[1]!)
    await store.resolveTextbooks()
    const saved = await store.confirmCurriculum(profile.studentId)
    expect(saved).toMatchObject({
      ...profile,
      regionId: regions[1],
      confirmedAt: expect.any(String),
    })
    expect(await service.getCurriculumProfile(profile.studentId)).toEqual(saved)
    vi.spyOn(curriculumProfileRepository, 'load').mockImplementation(() => repository.load())
    setActivePinia(createPinia())
    const restored = useCurriculumStore()
    expect(restored.isComplete).toBe(true)
    expect(restored.selectedTextbooks).toEqual(books)
  })

  it('does not overwrite an explicit selection with a service recommendation', async () => {
    const { service } = setupService()
    const result = await service.resolveAvailableTextbooks(context)
    result.math.availableTextbooks.push({
      ...result.math.availableTextbooks[0]!,
      id: 'another-math-book',
    })
    result.math.recommendedTextbookId = 'another-math-book'
    result.math.resolutionStatus = 'AUTO_RESOLVED'
    vi.spyOn(service, 'resolveAvailableTextbooks').mockResolvedValue(result)
    const store = useCurriculumStore()
    store.setProfile(profile)
    await store.resolveTextbooks()
    expect(store.mathTextbookVersionId).toBe(books.MATH)
  })

  it('clears incompatible grade/semester choices but leaves the saved profile intact', async () => {
    const { repository } = setupService()
    repository.save(profile)
    const store = useCurriculumStore()
    store.setProfile(profile)
    store.selectGrade('GRADE_2')
    expect(store.selectedTextbooks).toEqual({ CHINESE: null, MATH: null, ENGLISH: null })
    await store.resolveTextbooks()
    expect(store.selectTextbook('MATH', books.MATH)).toBe(false)
    expect(await store.confirmCurriculum(profile.studentId)).toBeNull()
    store.beginEdit()
    store.selectSemester('SEMESTER_UPPER')
    expect(store.draftIsComplete).toBe(false)
    expect(repository.load()).toEqual(profile)
    expect(store.curriculumProfile).toEqual(profile)
  })

  it('ignores late results from a previously selected grade', async () => {
    const { service } = setupService()
    const result = await service.resolveAvailableTextbooks(context)
    let finish!: (value: typeof result) => void
    vi.spyOn(service, 'resolveAvailableTextbooks').mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const store = useCurriculumStore()
    store.setContext(context)
    const pending = store.resolveTextbooks()
    store.selectGrade('GRADE_2')
    await store.resolveTextbooks()
    finish(result)
    expect(await pending).toBeNull()
    expect(store.availableTextbooks?.math.availableTextbooks).toEqual([])
    expect(store.selectTextbook('MATH', books.MATH)).toBe(false)
  })

  it.each([
    { chineseTextbookVersionId: null, mathTextbookVersionId: null, englishTextbookVersionId: null },
    { mathTextbookVersionId: books.CHINESE },
    { gradeId: 'GRADE_2' },
    { semesterId: 'SEMESTER_UPPER' },
    { mathTextbookVersionId: 'not-a-textbook' },
  ])('rejects invalid saves without replacing the existing profile: %j', async (change) => {
    const { service, repository } = setupService()
    repository.save(profile)
    await expect(service.saveCurriculumProfile({ ...profile, ...change })).rejects.toThrow()
    expect(repository.load()).toEqual(profile)
  })

  it('keeps other subjects selected and preserves the saved profile on save failure', async () => {
    const { service, repository } = setupService()
    repository.save(profile)
    const store = useCurriculumStore()
    store.setProfile(profile)
    await store.resolveTextbooks()
    store.clearTextbookSelection('CHINESE')
    expect(store.selectedTextbooks).toEqual({ ...books, CHINESE: null })
    vi.spyOn(service, 'saveCurriculumProfile').mockRejectedValueOnce(new Error('保存失败，请重试'))
    expect(await store.confirmCurriculum(profile.studentId)).toBeNull()
    expect(store.error).toBe('保存失败，请重试')
    expect(repository.load()).toEqual(profile)
    expect(store.curriculumProfile).toEqual(profile)
  })
})

describe('textbook choice page', () => {
  async function renderPage(gradeId: string, semesterId: string, regionId: string) {
    const { service } = setupService()
    vi.spyOn(curriculumService, 'getGrades').mockImplementation(() => service.getGrades())
    vi.spyOn(curriculumService, 'getSemesters').mockImplementation(() => service.getSemesters())
    vi.spyOn(curriculumService, 'getTextbookDisplay').mockImplementation((id) =>
      service.getTextbookDisplay(id),
    )
    const store = useCurriculumStore()
    store.setContext({ gradeId, semesterId, regionId })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/onboarding/textbooks', component: TextbookConfirmPage },
        { path: '/onboarding/character', component: { template: '<p>角色设置</p>' } },
      ],
    })
    await router.push('/onboarding/textbooks')
    await router.isReady()
    const wrapper = mount(TextbookConfirmPage, {
      global: {
        plugins: [router],
        stubs: {
          CurriculumPageFrame: {
            props: ['title', 'description'],
            template: '<main><h1>{{ title }}</h1><p>{{ description }}</p><slot /></main>',
          },
          teleport: true,
        },
      },
    })
    await flushPromises()
    return { wrapper, store, router }
  }

  it.each(regions)(
    'shows all three subjects and permits one explicit choice in %s',
    async (regionId) => {
      const { wrapper, store, router } = await renderPage('GRADE_1', 'SEMESTER_LOWER', regionId)
      expect(wrapper.text()).toContain('不受地区限制')
      const cards = wrapper.findAllComponents(TextbookCard)
      expect(cards).toHaveLength(3)
      expect(
        cards.every((card) => card.props('candidateCount') === 1 && !card.props('selected')),
      ).toBe(true)
      const submit = () =>
        wrapper.findAll('button').find((button) => button.text() === '确认教材并继续')!
      expect(submit().attributes('disabled')).toBeDefined()
      const math = cards.find((card) => card.props('subjectCode') === 'MATH')!
      await math.get('.textbook-card__change').trigger('click')
      await wrapper.getComponent(TextbookVersionSelector).get('button').trigger('click')
      expect(store.selectedTextbooks).toEqual({ CHINESE: null, MATH: books.MATH, ENGLISH: null })
      expect(submit().attributes('disabled')).toBeUndefined()
      await math.get('.curriculum-text-button').trigger('click')
      expect(submit().attributes('disabled')).toBeDefined()
      await math.get('.textbook-card__change').trigger('click')
      await wrapper.getComponent(TextbookVersionSelector).get('button').trigger('click')
      await submit().trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/onboarding/character')
      expect(store.isComplete).toBe(true)
      wrapper.unmount()
    },
  )

  it('lets a grade 2 lower learner choose Chinese without unavailable subjects blocking', async () => {
    const { wrapper, store } = await renderPage('GRADE_2', 'SEMESTER_LOWER', regions[2]!)
    const chinese = wrapper
      .findAllComponents(TextbookCard)
      .find((card) => card.props('subjectCode') === 'CHINESE')!
    await chinese.get('.textbook-card__change').trigger('click')
    const options = wrapper.getComponent(TextbookVersionSelector).findAll('button')
    expect(options).toHaveLength(2)
    expect(store.chineseTextbookVersionId).toBeNull()
    await options.find((button) => button.text().includes('我不是最弱小的'))!.trigger('click')
    expect(store.chineseTextbookVersionId).toBe('G2_PEP_CHINESE_S2_REVISED_CANDIDATE')
    expect(store.draftIsComplete).toBe(true)
    expect(wrapper.text()).not.toContain('请确认当前选择的是')
    expect(wrapper.text()).not.toContain('还有学科没有匹配课本')
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text() === '确认教材并继续')!
        .attributes('disabled'),
    ).toBeUndefined()
    wrapper.unmount()
  })
})
