import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Id } from '@/types'

export interface StudentBasicProfile {
  id: Id
  displayName: string
}

export const useStudentStore = defineStore('student', () => {
  const profile = ref<StudentBasicProfile | null>(null)
  const characterId = ref<Id | null>(null)

  function setProfile(nextProfile: StudentBasicProfile) {
    profile.value = nextProfile
  }

  function clearProfile() {
    profile.value = null
    characterId.value = null
  }

  function setCharacter(character: Id) {
    characterId.value = character
  }

  return { profile, characterId, setProfile, clearProfile, setCharacter }
})
