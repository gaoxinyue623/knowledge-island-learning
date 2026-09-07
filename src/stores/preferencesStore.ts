import { defineStore } from 'pinia'
import { ref } from 'vue'

export const PREFERENCES_STORAGE_KEY = 'knowledge-island.preferences.v1'
export interface Preferences {
  reducedMotion: boolean
  muted: boolean
  showTranscript: boolean
}
const defaults: Preferences = { reducedMotion: false, muted: false, showTranscript: true }
export const usePreferencesStore = defineStore('preferences', () => {
  const preferences = ref<Preferences>({ ...defaults })
  const warning = ref<string | null>(null)
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (
        saved.version !== 1 ||
        Object.keys(defaults).some((key) => typeof saved.preferences?.[key] !== 'boolean')
      )
        throw new Error()
      preferences.value = {
        reducedMotion: saved.preferences.reducedMotion,
        muted: saved.preferences.muted,
        showTranscript: saved.preferences.showTranscript,
      }
    }
  } catch {
    warning.value = '偏好暂时无法读取，已使用默认设置。'
  }
  function save(next: Preferences) {
    try {
      window.localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ version: 1, preferences: next }),
      )
      preferences.value = { ...next }
      warning.value = null
      return true
    } catch {
      warning.value = '设置未保存，请检查浏览器存储空间后重试。'
      return false
    }
  }
  return { preferences, warning, save }
})
