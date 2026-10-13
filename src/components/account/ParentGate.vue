<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { accountRequest, parentAccess } from '@/services/account/securityService'
import '@/styles/account-tools.css'
const unlocked = ref(false),
  checking = ref(true),
  busy = ref(false),
  password = ref(''),
  error = ref('')
let expiry: ReturnType<typeof setTimeout> | undefined
let alive = true
function grant(until: number) {
  clearTimeout(expiry)
  unlocked.value = until > Date.now()
  if (unlocked.value)
    expiry = setTimeout(
      () => {
        unlocked.value = false
      },
      Math.min(until - Date.now(), 15 * 60_000),
    )
}
async function check() {
  checking.value = true
  error.value = ''
  try {
    const state = await parentAccess()
    if (alive) grant(state.unlocked ? state.until : 0)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '暂时无法确认身份，请重试。'
  } finally {
    checking.value = false
  }
}
async function unlock() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await accountRequest('parent-access', 'POST', { password: password.value })
    password.value = ''
    await check()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '验证失败，请重试。'
  } finally {
    busy.value = false
  }
}
async function lock() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await accountRequest('parent-access', 'DELETE')
    grant(0)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未能结束确认，请重试。'
  } finally {
    busy.value = false
  }
}
onMounted(check)
onBeforeUnmount(() => {
  alive = false
  clearTimeout(expiry)
})
</script>
<template>
  <div v-if="unlocked">
    <div class="parent-confirmed">
      <span>家长操作已确认 · 15 分钟内有效</span
      ><button :disabled="busy" @click="lock">结束家长操作</button
      ><RouterLink to="/home">返回学习</RouterLink>
      <p v-if="error" role="alert">{{ error }}</p>
    </div>
    <slot />
  </div>
  <main v-else class="account-tools content-container">
    <RouterLink to="/profile">← 返回我的知识岛</RouterLink>
    <section>
      <h1>请家长确认一下</h1>
      <p>这里可以管理家庭档案、账号和学习设置。请输入当前账号密码，避免孩子误操作。</p>
      <p v-if="checking" role="status">正在检查确认状态…</p>
      <form v-else @submit.prevent="unlock">
        <label
          >家长账号密码<input
            v-model="password"
            type="password"
            autocomplete="current-password"
            minlength="10"
            maxlength="128"
            required
            :disabled="busy"
        /></label>
        <p v-if="error" role="alert">{{ error }}</p>
        <div class="actions">
          <button :disabled="busy">{{ busy ? '正在确认…' : '确认并继续' }}</button
          ><button type="button" :disabled="busy" @click="check">重新检查</button>
        </div>
      </form>
      <p>确认仅对这次登录有效，15 分钟后需要重新输入。</p>
    </section>
  </main>
</template>
<style scoped>
.parent-confirmed {
  padding: 10px 20px;
  background: #eaf1e3;
  color: #3f6447;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
}
.parent-confirmed button {
  border: 1px solid #b5c8b4;
  border-radius: 8px;
  padding: 6px 12px;
  background: #fff;
}
</style>
