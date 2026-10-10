import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import OnboardingWelcomePage from '@/pages/onboarding/OnboardingWelcomePage.vue'
import GradeSelectPage from '@/pages/onboarding/GradeSelectPage.vue'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import CurriculumSettingsPage from '@/pages/curriculum/CurriculumSettingsPage.vue'
import TextbookSubjectSelectPage from '@/pages/curriculum/TextbookSubjectSelectPage.vue'
import OnboardingProgress from '@/components/curriculum/OnboardingProgress.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { accountState } from '@/services/account/accountService'
import { selectAccount } from '@/services/account/storage'
import { curriculumService } from '@/services/runtime'
import { getCurriculumPresentation } from '@/composables/useCurriculumPresentation'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { getOnboardingDraftRedirect } from '@/router/guard'
import { storagePayloadSchema } from '@/services/validation/schemas'
import { accountSnapshotSchema } from '@/services/account/contract'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import appRouter from '@/router'

const routes = [
  { path: '/profile', component: { template: '<p>个人资料</p>' } },
  { path: '/history', component: { template: '<p>学习记录</p>' } },
  { path: '/onboarding', component: OnboardingWelcomePage },
  { path: '/onboarding/grade', component: GradeSelectPage },
  { path: '/onboarding/textbooks', component: TextbookConfirmPage },
  { path: '/onboarding/character', component: { template: '<p>角色</p>' } },
  { path: '/curriculum-settings', component: CurriculumSettingsPage },
  { path: '/curriculum-settings/textbook/:subjectCode', component: TextbookSubjectSelectPage },
]
const stubs = {
  CurriculumPageFrame: { template: '<main><slot /></main>' },
  AppShell: { template: '<main><slot /></main>' },
  teleport: true,
}
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('grade_test')
  setActivePinia(createPinia())
  // A failing region catalog must not prevent any step of the new flow.
  vi.spyOn(curriculumService, 'getRegions').mockRejectedValue(new Error('REGION_UNAVAILABLE'))
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

async function open(path: string, page: Parameters<typeof mount>[0]) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  const wrapper = mount(page, { global: { plugins: [router], stubs } })
  await flushPromises()
  return { router, wrapper }
}

describe('grade and version selection without regions', () => {
  it('starts at grade selection and completes setup after a reload with no region data', async () => {
    const welcome = await open('/onboarding', OnboardingWelcomePage)
    expect(welcome.wrapper.text()).not.toContain('地区')
    await welcome.wrapper
      .findAll('button')
      .find((b) => b.text() === '开始设置')!
      .trigger('click')
    await flushPromises()
    expect(welcome.router.currentRoute.value.path).toBe('/onboarding/grade')
    welcome.wrapper.unmount()

    const grade = await open('/onboarding/grade', GradeSelectPage)
    expect(grade.wrapper.text()).not.toContain('地区')
    await grade.wrapper.get('button[aria-label^="一年级上册"]').trigger('click')
    await grade.wrapper
      .findAll('button')
      .find((b) => b.text() === '继续选择教材版本')!
      .trigger('click')
    await flushPromises()
    expect(grade.router.currentRoute.value.path).toBe('/onboarding/textbooks')
    grade.wrapper.unmount()

    setActivePinia(createPinia())
    expect(useCurriculumStore().selectedRegionId).toBeNull()
    const books = await open('/onboarding/textbooks', TextbookConfirmPage)
    const store = useCurriculumStore()
    expect(books.wrapper.text()).not.toContain('地区')
    expect(books.wrapper.findAllComponents(TextbookCard)).toHaveLength(3)
    expect(Object.values(store.selectedTextbooks).every(Boolean)).toBe(true)
    await books.wrapper
      .findAll('button')
      .find((b) => b.text() === '确认教材并继续')!
      .trigger('click')
    await flushPromises()
    expect(books.router.currentRoute.value.path).toBe('/onboarding/character')
    const profile = curriculumProfileRepository.load()!
    expect(profile.gradeId).toBe('GRADE_1')
    expect(profile).not.toHaveProperty('regionId')
    expect(store.isComplete).toBe(true)
    const payload = { schemaVersion: 1, profile }
    expect(storagePayloadSchema.safeParse(payload).success).toBe(true)
    expect(
      accountSnapshotSchema.safeParse({
        schemaVersion: 1,
        entries: [{ key: 'knowledge-island.curriculum-profile', value: JSON.stringify(payload) }],
        pets: [],
      }).success,
    ).toBe(true)
    books.wrapper.unmount()
    setActivePinia(createPinia())
    expect(useCurriculumStore().isComplete).toBe(true)
    expect(curriculumService.getRegions).not.toHaveBeenCalled()
  })

  it('offers all versions for the chosen grade and semester without passing region metadata', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_2', semesterId: 'SEMESTER_LOWER' })
    const resolver = vi.spyOn(curriculumService, 'resolveAvailableTextbooks')
    const result = await store.resolveTextbooks()
    expect(resolver).toHaveBeenCalledWith({ gradeId: 'GRADE_2', semesterId: 'SEMESTER_LOWER' })
    const ids = Object.values(result!)
      .flatMap((s) => s.availableTextbooks.map((b) => b.id))
      .sort()
    expect(ids).toEqual(
      productionCurriculumIndex.textbooks
        .filter((b) => b.gradeId === 'GRADE_2' && b.semesterId === 'SEMESTER_LOWER')
        .map((b) => b.id)
        .sort(),
    )
    expect(result!.chinese.availableTextbooks).toHaveLength(2)
    expect(store.selectTextbook('CHINESE', 'G1_PEP_CHINESE_S1_2024_CANDIDATE')).toBe(false)
  })

  it('keeps legacy profile selections and hides regions in settings and individual version changes', async () => {
    const store = useCurriculumStore()
    store.setContext({
      regionId: 'REGION_SHENZHEN',
      gradeId: 'GRADE_1',
      semesterId: 'SEMESTER_UPPER',
    })
    await store.resolveTextbooks()
    store.selectSingleTextbookDefaults()
    const saved = (await store.confirmCurriculum('local-profile'))!
    setActivePinia(createPinia())
    expect(useCurriculumStore().curriculumProfile).toEqual(saved)
    const presentation = await getCurriculumPresentation(saved)
    expect(presentation).not.toHaveProperty('regionName')
    const settings = await open('/curriculum-settings', CurriculumSettingsPage)
    expect(settings.wrapper.text()).not.toContain('地区')
    expect(settings.wrapper.text()).toContain('修改年级和册次')
    settings.wrapper.unmount()
    const before = { ...useCurriculumStore().selectedTextbooks }
    const subject = await open('/curriculum-settings/textbook/MATH', TextbookSubjectSelectPage)
    expect(subject.wrapper.text()).not.toContain('地区')
    await subject.wrapper.get('.textbook-selector-option').trigger('click')
    await flushPromises()
    expect(subject.router.currentRoute.value.path).toBe('/curriculum-settings')
    expect(useCurriculumStore().selectedTextbooks.CHINESE).toBe(before.CHINESE)
    expect(useCurriculumStore().selectedTextbooks.ENGLISH).toBe(before.ENGLISH)
    expect(curriculumProfileRepository.load()?.regionId).toBe('REGION_SHENZHEN')
    expect(curriculumService.getRegions).not.toHaveBeenCalled()
    subject.wrapper.unmount()
  })

  it('uses three steps and sends incomplete textbook setup directly to grades', () => {
    const store = useCurriculumStore()
    expect(getOnboardingDraftRedirect('/onboarding/grade', store)).toBeNull()
    expect(getOnboardingDraftRedirect('/onboarding/textbooks', store)).toBe('/onboarding/grade')
    const wrapper = mount(OnboardingProgress, { props: { step: 2 } })
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('当前步骤 2 / 3')
    expect(wrapper.text()).toContain('年级 · 教材版本 · 角色')
    wrapper.unmount()
  })

  it('redirects the old region link to grades while retaining the settings return query', async () => {
    const previous = { ...accountState }
    Object.assign(accountState, { username: 'grade_test', ready: true, conflict: null })
    try {
      await appRouter.push('/onboarding/region?from=settings')
      expect(appRouter.currentRoute.value.path).toBe('/onboarding/grade')
      expect(appRouter.currentRoute.value.query.from).toBe('settings')
    } finally {
      Object.assign(accountState, previous)
    }
  })
})
