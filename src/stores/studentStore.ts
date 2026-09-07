import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Id } from '@/types'

export interface StudentBasicProfile {
  id: Id
  displayName: string
}
export const LOCAL_STUDENT_ID = 'local-profile'
export const STUDENT_STORAGE_KEY = 'knowledge-island.student.v1'
export const characterOptions = [
  { id: 'default-character', name: '薄荷团子', color: '#9edbd0', shadow: '#4f9c96' },
  { id: 'sunshine-character', name: '阳光团子', color: '#ffe098', shadow: '#b78636' },
  { id: 'berry-character', name: '莓果团子', color: '#f3bbd0', shadow: '#b97596' },
] as const

export const useStudentStore = defineStore('student', () => {
  const profile = ref<StudentBasicProfile | null>(null)
  const characterId = ref<Id | null>(null)
  const warning = ref<string | null>(null)
  try {
    const raw = window.localStorage.getItem(STUDENT_STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (
        saved.version !== 1 ||
        !saved.profile ||
        typeof saved.profile.id !== 'string' ||
        typeof saved.profile.displayName !== 'string' ||
        !saved.profile.displayName.trim() ||
        saved.profile.displayName.length > 20 ||
        !characterOptions.some((option) => option.id === saved.characterId)
      )
        throw new Error()
      profile.value = saved.profile
      characterId.value = saved.characterId
    }
  } catch {
    warning.value = '个人资料暂时无法读取，请重新保存。'
  }

  function savePersonalProfile(
    displayName: string,
    character: Id,
    id = profile.value?.id ?? LOCAL_STUDENT_ID,
  ) {
    const name = displayName.trim()
    if (!name || name.length > 20 || !characterOptions.some((option) => option.id === character)) {
      warning.value = '请输入 1～20 个字符的昵称，并选择一个装扮。'
      return false
    }
    const nextProfile = { id, displayName: name }
    try {
      window.localStorage.setItem(
        STUDENT_STORAGE_KEY,
        JSON.stringify({ version: 1, profile: nextProfile, characterId: character }),
      )
      profile.value = nextProfile
      characterId.value = character
      warning.value = null
      return true
    } catch {
      warning.value = '保存失败，请检查浏览器存储空间后重试。'
      return false
    }
  }
  function setProfile(nextProfile: StudentBasicProfile) {
    return savePersonalProfile(
      nextProfile.displayName,
      characterId.value ?? 'default-character',
      nextProfile.id,
    )
  }
  function setCharacter(character: Id) {
    return savePersonalProfile(profile.value?.displayName ?? '小岛同学', character)
  }
  function clearProfile() {
    try {
      window.localStorage.removeItem(STUDENT_STORAGE_KEY)
    } catch {
      warning.value = '个人资料无法清除，请重试。'
      return
    }
    profile.value = null
    characterId.value = null
    warning.value = null
  }
  return {
    profile,
    characterId,
    warning,
    savePersonalProfile,
    setProfile,
    clearProfile,
    setCharacter,
  }
})
