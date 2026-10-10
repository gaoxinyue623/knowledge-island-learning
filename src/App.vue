<script setup lang="ts">
import ParentGate from '@/components/account/ParentGate.vue'
import { accountState } from '@/services/account/accountService'
import { watchEffect, ref, onBeforeUnmount } from 'vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { RouterView, useRouter } from 'vue-router'
const router = useRouter()
function expired() {
  accountState.username = null
  accountState.ready = false
  void router.replace('/login')
}
window.addEventListener('ki-session-expired', expired)
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
  window.removeEventListener('ki-session-expired', expired)
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
  <div
    v-if="accountState.username && ['pending', 'conflict'].includes(accountState.sync)"
    class="account-sync-notice"
    role="status"
  >
    {{
      accountState.sync === 'conflict'
        ? '另一台设备更新了记录，请选择要保留的版本。'
        : '记录已保存在本机，正在等待同步。'
    }}
    <RouterLink to="/account">查看同步</RouterLink>
  </div>
  <RouterLink
    v-if="accountState.username && !$route.path.startsWith('/feedback')"
    class="feedback-entry"
    :to="{
      path: '/feedback',
      query: {
        from: $route.path,
        contentId: String(
          $route.params.knowledgePointId ??
            $route.params.nodeId ??
            $route.query.knowledgePointId ??
            '',
        ),
      },
    }"
    >问题反馈</RouterLink
  >
  <RouterView
    v-if="accountState.username || $route.meta.public || $route.meta.devOnly"
    v-slot="{ Component }"
  >
    <ParentGate v-if="$route.meta.parentOnly"><component :is="Component" /></ParentGate>
    <component :is="Component" v-else />
  </RouterView>
</template>

<style scoped>
.feedback-entry {
  position: fixed;
  right: 16px;
  bottom: 86px;
  z-index: 40;
  padding: 7px 12px;
  font-size: 12px;
  color: #49684c;
  background: #f5f9f1;
  border: 1px solid #c8d8c4;
  border-radius: 18px;
}
.account-sync-notice {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 900;
  width: max-content;
  max-width: calc(100% - 24px);
  padding: 10px 16px;
  background: #fff8e8;
  border: 1px solid #dfd3ae;
  border-radius: 12px;
  font-size: 12px;
  color: #705c37;
}
.account-sync-notice a {
  margin-left: 12px;
  text-decoration: underline;
}
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
