import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { accountSessionStorage, selectAccount } from '@/services/account/storage'
import { curriculumService } from '@/services/runtime'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { getOnboardingDraftRedirect } from '@/router/guard'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('textbook_test')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  localStorage.clear()
  sessionStorage.clear()
})

describe('account onboarding with the real runtime curriculum', () => {
  it.each([
    ['GRADE_1', 'SEMESTER_UPPER', 3],
    ['GRADE_1', 'SEMESTER_LOWER', 3],
    ['GRADE_2', 'SEMESTER_UPPER', 3],
    ['GRADE_2', 'SEMESTER_LOWER', 5],
  ])(
    'loads imported textbooks for %s / %s after refreshing a new account',
    async (grade, semester, count) => {
      const store = useCurriculumStore()
      store.selectGrade(grade as string)
      store.selectSemester(semester as string)
      // Recreate Pinia as a full reload or post-login navigation would.
      setActivePinia(createPinia())
      expect(useCurriculumStore().selectedGradeId).toBe(grade)
      expect(useCurriculumStore().selectedSemesterId).toBe(semester)
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
      await flushPromises()
      expect(wrapper.text()).not.toContain('教材暂时打不开')
      await vi.waitFor(
        () =>
          expect(
            wrapper
              .findAllComponents(TextbookCard)
              .reduce((sum, card) => sum + card.props('candidateCount'), 0),
          ).toBe(count),
        { timeout: 5000 },
      )
      wrapper.unmount()
    },
  )

  it('keeps explicit book choices through a reload and saves the confirmed account profile', async () => {
    const store = useCurriculumStore()
    store.setContext({
      regionId: (await curriculumService.getRegions())[0]!.id,
      gradeId: 'GRADE_1',
      semesterId: 'SEMESTER_UPPER',
    })
    const books = await store.resolveTextbooks()
    const bookId = books!.math.availableTextbooks[0]!.id
    store.selectTextbook('MATH', bookId)
    setActivePinia(createPinia())
    const restored = useCurriculumStore()
    expect(restored.selectedTextbooks.MATH).toBe(bookId)
    expect(restored.isComplete).toBe(false)
    await restored.resolveTextbooks()
    expect(await restored.confirmCurriculum('local-profile')).not.toBeNull()
    expect(curriculumProfileRepository.load()?.mathTextbookVersionId).toBe(bookId)
    expect(accountSessionStorage.getItem('knowledge-island.curriculum-draft.v1')).toBeNull()
    setActivePinia(createPinia())
    expect(useCurriculumStore().isComplete).toBe(true)
  })

  it('isolates unfinished setup between accounts and restores it on returning to the same account', () => {
    useCurriculumStore().setContext({
      regionId: 'REGION_SHENZHEN',
      gradeId: 'GRADE_2',
      semesterId: 'SEMESTER_LOWER',
    })
    selectAccount('another_parent')
    setActivePinia(createPinia())
    expect(useCurriculumStore().selectedGradeId).toBeNull()
    selectAccount('textbook_test')
    setActivePinia(createPinia())
    expect(useCurriculumStore().selectedGradeId).toBe('GRADE_2')
  })

  it('preserves opted-out single books after reload and resets defaults for a new semester', async () => {
    let store = useCurriculumStore()
    store.setContext({
      regionId: (await curriculumService.getRegions())[0]!.id,
      gradeId: 'GRADE_1',
      semesterId: 'SEMESTER_UPPER',
    })
    await store.resolveTextbooks()
    store.selectSingleTextbookDefaults()
    expect(Object.values(store.selectedTextbooks).every(Boolean)).toBe(true)
    store.clearTextbookSelection('MATH')
    setActivePinia(createPinia())
    store = useCurriculumStore()
    await store.resolveTextbooks()
    store.selectSingleTextbookDefaults()
    expect(store.mathTextbookVersionId).toBeNull()
    expect(store.chineseTextbookVersionId).not.toBeNull()
    store.selectSemester('SEMESTER_LOWER')
    await store.resolveTextbooks()
    store.selectSingleTextbookDefaults()
    expect(store.mathTextbookVersionId).not.toBeNull()
  })

  it('preserves a saved choice to learn only one subject when revisiting textbook settings', async () => {
    let store = useCurriculumStore()
    store.setContext({
      regionId: (await curriculumService.getRegions())[0]!.id,
      gradeId: 'GRADE_1',
      semesterId: 'SEMESTER_UPPER',
    })
    const result = await store.resolveTextbooks()
    store.selectTextbook('MATH', result!.math.availableTextbooks[0]!.id)
    await store.confirmCurriculum('local-profile')
    setActivePinia(createPinia())
    store = useCurriculumStore()
    await store.resolveTextbooks()
    store.selectSingleTextbookDefaults()
    expect(store.selectedTextbooks).toEqual({
      CHINESE: null,
      MATH: result!.math.availableTextbooks[0]!.id,
      ENGLISH: null,
    })
  })

  it('discards a draft when the confirmed child profile changes', async () => {
    const store = useCurriculumStore()
    store.setContext({
      regionId: (await curriculumService.getRegions())[0]!.id,
      gradeId: 'GRADE_1',
      semesterId: 'SEMESTER_UPPER',
    })
    const books = await store.resolveTextbooks()
    store.selectTextbook('MATH', books!.math.availableTextbooks[0]!.id)
    const saved = await store.confirmCurriculum('child_a')
    store.selectGrade('GRADE_2')
    curriculumProfileRepository.save({ ...saved!, studentId: 'child_b' })
    setActivePinia(createPinia())
    expect(useCurriculumStore().selectedGradeId).toBe('GRADE_1')
  })

  it('recovers missing setup at the earliest incomplete step without a retry loop', () => {
    const store = useCurriculumStore()
    expect(getOnboardingDraftRedirect('/onboarding/textbooks', store)).toBe('/onboarding/grade')
    expect(getOnboardingDraftRedirect('/onboarding/grade', store)).toBeNull()
    expect(getOnboardingDraftRedirect('/onboarding/textbooks', store)).toBe('/onboarding/grade')
    store.selectGrade('GRADE_1')
    store.selectSemester('SEMESTER_UPPER')
    expect(getOnboardingDraftRedirect('/onboarding/textbooks', store)).toBeNull()
    expect(getOnboardingDraftRedirect('/home', store)).toBeNull()
  })

  it('ignores damaged draft storage and allows setup to resume', () => {
    accountSessionStorage.setItem('knowledge-island.curriculum-draft.v1', '{broken')
    expect(useCurriculumStore().selectedGradeId).toBeNull()
    expect(accountSessionStorage.getItem('knowledge-island.curriculum-draft.v1')).toBeNull()
  })
})
