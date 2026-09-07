import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { STUDENT_STORAGE_KEY, useStudentStore } from '@/stores/studentStore'
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from '@/stores/preferencesStore'
import CharacterPage from '@/pages/CharacterPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

beforeEach(() => {
  const items = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value)
    },
    removeItem: (key: string) => {
      items.delete(key)
    },
    clear: () => items.clear(),
  })
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})
afterEach(() => vi.unstubAllGlobals())
const global = {
  stubs: {
    AppShell: { template: '<main><slot /></main>' },
    RouterLink: { template: '<a><slot /></a>' },
  },
}

describe('personal profile persistence', () => {
  it('restores nickname and outfit together after a reload', () => {
    expect(useStudentStore().savePersonalProfile(' 小小探索家 ', 'berry-character')).toBe(true)
    setActivePinia(createPinia())
    expect(useStudentStore().profile?.displayName).toBe('小小探索家')
    expect(useStudentStore().characterId).toBe('berry-character')
  })
  it('keeps saved data intact when storage fails or input is invalid', () => {
    const student = useStudentStore()
    student.savePersonalProfile('原昵称', 'default-character')
    expect(student.savePersonalProfile('   ', 'berry-character')).toBe(false)
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(student.savePersonalProfile('新昵称', 'berry-character')).toBe(false)
    expect(student.profile?.displayName).toBe('原昵称')
    expect(student.characterId).toBe('default-character')
  })
  it('recovers from corrupted stored data without breaking the page', () => {
    window.localStorage.setItem(STUDENT_STORAGE_KEY, '{broken')
    expect(useStudentStore().profile).toBeNull()
    expect(useStudentStore().warning).toBeTruthy()
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ version: 1, preferences: { muted: 'false' } }),
    )
    expect(usePreferencesStore().preferences.muted).toBe(false)
    expect(usePreferencesStore().warning).toBeTruthy()
  })
  it('previews an outfit without changing saved appearance until saving', async () => {
    const wrapper = mount(CharacterPage, { global })
    await wrapper.findAll('.personal-outfit')[2]!.trigger('click')
    expect(useStudentStore().characterId).toBeNull()
    await wrapper.get('.app-button').trigger('click')
    expect(useStudentStore().characterId).toBe('berry-character')
    expect(wrapper.text()).toContain('装扮已保存')
  })
  it('saves preferences and nickname through the settings forms', async () => {
    const wrapper = mount(SettingsPage, { global })
    await wrapper.get('#student-name').setValue('海岛同学')
    await wrapper.findAll('form')[0]!.trigger('submit')
    await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(true)
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true)
    await wrapper.findAll('form')[1]!.trigger('submit')
    setActivePinia(createPinia())
    expect(useStudentStore().profile?.displayName).toBe('海岛同学')
    expect(usePreferencesStore().preferences).toEqual({
      reducedMotion: true,
      muted: true,
      showTranscript: true,
    })
  })
})
