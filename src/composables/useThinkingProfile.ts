import { watch } from 'vue'
import { useLearningProfile } from './useLearningProfile'
import { useThinkingStore } from '@/stores/thinkingStore'

export function useThinkingProfile() {
  const { profileId } = useLearningProfile()
  const thinking = useThinkingStore()
  watch(profileId, (id) => thinking.load(id), { immediate: true })
  return { profileId, thinking }
}
