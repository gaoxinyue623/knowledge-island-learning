<script setup lang="ts">
import { watchEffect, ref, onBeforeUnmount } from 'vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { RouterView, useRouter } from 'vue-router'
const router = useRouter()
const opening = ref(''),
  failedPath = ref('')
const removeBefore = router.beforeEach((to) => {
  opening.value = String(to.meta.title ?? '页面')
  failedPath.value = ''
})
const removeAfter = router.afterEach(() => {
  opening.value = ''
})
const removeError = router.onError((_error, to) => {
  opening.value = ''
  failedPath.value = to.fullPath
})
onBeforeUnmount(() => {
  removeBefore()
  removeAfter()
  removeError()
})
const settings = usePreferencesStore()
watchEffect(() => {
  document.documentElement.classList.toggle('reduce-motion', settings.preferences.reducedMotion)
})
</script>

<template>
  <div
    v-if="opening || failedPath"
    class="navigation-feedback"
    :role="failedPath ? 'alert' : 'status'"
  >
    <template v-if="failedPath"
      >页面暂时没有打开，学习记录仍保留。<a :href="failedPath">重新打开页面</a></template
    >
    <template v-else>正在打开{{ opening }}……</template>
  </div>
  <RouterView />
</template>

<style scoped>
.navigation-feedback {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: max-content;
  max-width: calc(100% - 32px);
  padding: 12px 18px;
  border: 1px solid #b6cebf;
  border-radius: 12px;
  background: #f6fff8;
  color: #284e40;
  box-shadow: 0 4px 18px #284e4022;
}
.navigation-feedback a {
  margin-left: 10px;
  text-decoration: underline;
}
</style>
