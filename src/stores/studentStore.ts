import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Id } from '@/types'

export interface StudentBasicProfile {
  id: Id
  displayName: string
}

/** Stable local identity used until account authentication is introduced. */
export const LOCAL_STUDENT_ID = 'local-profile'

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
