import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  freshThinkingProgress,
  readThinkingProgress,
  thinkingProgressKey,
  withSolvedThinkingPuzzle,
} from '@/services/thinking/thinkingProgressStorage'
import { checkThinkingAnswer } from '@/services/thinking/thinkingValidator'
import { thinkingMissions } from '@/data/thinking/islands'
import type { ThinkingDraft } from '@/types/thinking'

export const useThinkingStore = defineStore('thinking', () => {
  const data = ref(freshThinkingProgress('local-profile'))
  const warning = ref<string | null>(null)
  let writable = true
  let loadedProfile: string | null = null
  function load(profileId: string) {
    if (loadedProfile === profileId) return
    loadedProfile = profileId
    try {
      const loaded = readThinkingProgress(window.localStorage, profileId)
      data.value = loaded.data
      warning.value = loaded.warning
      writable = loaded.writable
    } catch {
      data.value = freshThinkingProgress(profileId)
      warning.value = '浏览器暂时不能保存记录，可以继续本页练习。'
      writable = false
    }
  }
  function completed(missionId: string) {
    return data.value.records.find((r) => r.missionId === missionId)?.completedPuzzleIds ?? []
  }
  function submit(profileId: string, missionId: string, puzzleId: string, draft: ThinkingDraft) {
    if (profileId !== loadedProfile) load(profileId)
    const mission = thinkingMissions.find((m) => m.id === missionId)
    const puzzle = mission?.puzzles.find((p) => p.id === puzzleId)
    if (!puzzle)
      return { status: 'incorrect' as const, message: '这个任务暂时无法检查，请返回思维群岛。' }
    const result = checkThinkingAnswer(puzzle, draft)
    if (result.status !== 'correct') return result
    let next = withSolvedThinkingPuzzle(data.value, missionId, puzzleId)
    if (!next) return result
    data.value = next
    if (writable) {
      try {
        const latest = readThinkingProgress(window.localStorage, profileId)
        if (!latest.writable) {
          writable = false
          warning.value = latest.warning
          return result
        }
        for (const record of latest.data.records) {
          for (const id of record.completedPuzzleIds)
            next = withSolvedThinkingPuzzle(next, record.missionId, id) ?? next
        }
        data.value = next
        window.localStorage.setItem(thinkingProgressKey(profileId), JSON.stringify(next))
        warning.value = null
      } catch {
        warning.value = '这次完成记录暂时未保存。你可以继续练习，下次答对时会再试着保存。'
      }
    }
    return result
  }
  return { data, warning, load, completed, submit }
})
