import { computed } from 'vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { LOCAL_STUDENT_ID, useStudentStore } from '@/stores/studentStore'
import { ACTIVE_PROFILE_JOURNAL_KEY } from '@/services/family/activeProfileStorage'

export function useLearningProfile() {
  const curriculum = useCurriculumStore(),
    student = useStudentStore()
  const profileId = computed(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(ACTIVE_PROFILE_JOURNAL_KEY) !== null) return ''
    } catch {
      return ''
    }
    return curriculum.curriculumProfile?.studentId ?? student.profile?.id ?? LOCAL_STUDENT_ID
  })
  return { profileId }
}
