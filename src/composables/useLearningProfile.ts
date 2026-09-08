import { computed } from 'vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { LOCAL_STUDENT_ID, useStudentStore } from '@/stores/studentStore'

export function useLearningProfile() {
  const curriculum = useCurriculumStore(),
    student = useStudentStore()
  const profileId = computed(
    () => curriculum.curriculumProfile?.studentId ?? student.profile?.id ?? LOCAL_STUDENT_ID,
  )
  return { profileId }
}
