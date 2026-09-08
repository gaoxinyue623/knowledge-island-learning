import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { petService } from '@/services/pet/petService'
import {
  freshPetAccount,
  summarizePet,
  type PetAccount,
  type PetCommand,
} from '@/services/pet/petPolicy'
import { petCommandMessage } from '@/services/pet/petPresentation'
import { PET_ACCOUNT_CHANGED } from '@/services/pet/petNotifications'

export const usePetStore = defineStore('pet', () => {
  const profileId = ref(''),
    account = ref<PetAccount | null>(null)
  const loading = ref(false),
    busy = ref(false),
    error = ref<string | null>(null),
    warning = ref<string | null>(null)
  const message = ref(''),
    feedAnimation = ref(0)
  let generation = 0,
    latestRequest = 0
  const summary = computed(() =>
    summarizePet(account.value ?? freshPetAccount(profileId.value || 'local-profile')),
  )
  function selectProfile(id: string) {
    if (profileId.value === id) return
    generation++
    profileId.value = id
    account.value = null
    loading.value = false
    busy.value = false
    error.value = null
    warning.value = null
    message.value = ''
    feedAnimation.value = 0
  }
  async function sync(id = profileId.value) {
    selectProfile(id)
    const version = generation,
      request = ++latestRequest
    loading.value = true
    try {
      const result = await petService.run(id)
      if (generation !== version || latestRequest !== request) return
      account.value = result.account
      warning.value = result.warning
      error.value = null
    } catch (caught) {
      if (generation === version && latestRequest === request)
        error.value = caught instanceof Error ? caught.message : '宠物记录暂时无法读取，请重试。'
    } finally {
      if (generation === version && latestRequest === request) loading.value = false
    }
  }
  async function act(command: PetCommand): Promise<boolean> {
    if (busy.value || loading.value || !account.value || error.value) return false
    busy.value = true
    const id = profileId.value,
      version = generation,
      request = ++latestRequest
    try {
      const result = await petService.run(id, command, crypto.randomUUID())
      if (generation !== version) return false
      // A later read may have started while this command was committing. Refresh from disk in that case.
      if (latestRequest === request) account.value = result.account
      else await sync(id)
      if (generation !== version) return false
      warning.value = result.warning
      error.value = null
      if (command.kind === 'feed' || command.kind === 'feed-pet') feedAnimation.value++
      message.value = petCommandMessage(command)
      window.dispatchEvent(new CustomEvent(PET_ACCOUNT_CHANGED, { detail: id }))
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('knowledge-island.pet')
        channel.postMessage(id)
        channel.close()
      }
      return true
    } catch (caught) {
      if (generation === version)
        message.value = caught instanceof Error ? caught.message : '这次操作没有保存，请重试。'
      return false
    } finally {
      if (generation === version) busy.value = false
    }
  }
  return {
    profileId,
    account,
    summary,
    loading,
    busy,
    error,
    warning,
    message,
    feedAnimation,
    selectProfile,
    sync,
    act,
  }
})
