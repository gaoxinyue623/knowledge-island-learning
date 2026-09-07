import { computed, watch } from 'vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useStudentStore, LOCAL_STUDENT_ID } from '@/stores/studentStore'
import { useThinkingStore } from '@/stores/thinkingStore'

export function useThinkingProfile() {
  const curriculum = useCurriculumStore(),
    student = useStudentStore(),
    thinking = useThinkingStore()
  const profileId = computed(
    () => curriculum.curriculumProfile?.studentId ?? student.profile?.id ?? LOCAL_STUDENT_ID,
  )
  watch(profileId, (id) => thinking.load(id), { immediate: true })
  return { profileId, thinking }
}
