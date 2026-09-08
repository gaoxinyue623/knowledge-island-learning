<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { usePetStore } from '@/stores/petStore'
import { PET_ACCOUNT_CHANGED, PET_LEARNING_CHANGED } from '@/services/pet/petNotifications'
const route = useRoute(),
  pet = usePetStore()
const { profileId } = useLearningProfile()
let timer: ReturnType<typeof setTimeout> | undefined
let channel: BroadcastChannel | undefined
function refresh() {
  if (route.path.startsWith('/dev/')) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    void pet.sync(profileId.value)
  }, 30)
}
function storageChanged(event: StorageEvent) {
  if (
    !event.key ||
    event.key === 'knowledge-island.reward-events' ||
    event.key.startsWith('knowledge-island.thinking.v1:')
  )
    refresh()
}
function visible() {
  if (document.visibilityState === 'visible') refresh()
}
watch(
  profileId,
  (id) => {
    pet.selectProfile(id)
    refresh()
  },
  { immediate: true },
)
onMounted(() => {
  window.addEventListener(PET_LEARNING_CHANGED, refresh)
  window.addEventListener(PET_ACCOUNT_CHANGED, refresh)
  window.addEventListener('storage', storageChanged)
  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', visible)
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('knowledge-island.pet')
    channel.onmessage = (event) => {
      if (event.data === profileId.value) refresh()
    }
  }
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  channel?.close()
  window.removeEventListener(PET_LEARNING_CHANGED, refresh)
  window.removeEventListener(PET_ACCOUNT_CHANGED, refresh)
  window.removeEventListener('storage', storageChanged)
  window.removeEventListener('focus', refresh)
  document.removeEventListener('visibilitychange', visible)
})
</script>
<template>
  <RouterLink
    v-if="!route.path.startsWith('/dev/')"
    to="/achievements"
    class="pet-status-link"
    :aria-label="
      pet.error ? '宠物记录待重试，打开成长页' : `我的宠物，可用积分${pet.summary.balance}`
    "
  >
    <span aria-hidden="true">🌱</span
    ><span>{{ pet.error ? '待重试' : pet.account ? `${pet.summary.balance} 积分` : '宠物' }}</span>
  </RouterLink>
</template>
<style scoped>
.pet-status-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  padding: 0.45rem 0.65rem;
  min-height: 44px;
  border: 1px solid #cbd8b4;
  border-radius: 999px;
  background: #edf4e2;
  color: #36583b;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}
</style>
