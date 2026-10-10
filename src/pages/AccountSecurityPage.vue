<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { z } from 'zod'
import AppShell from '@/layouts/AppShell.vue'
import { accountRequest, securityStatus } from '@/services/account/securityService'
import { accountState, syncAccount, navigateAccount } from '@/services/account/accountService'
import '@/styles/account-tools.css'
const state = ref<Awaited<ReturnType<typeof securityStatus>> | null>(null)
const password = ref(''),
  next = ref(''),
  confirm = ref(''),
  code = ref(''),
  error = ref(''),
  message = ref(''),
  busy = ref(false)
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败，请重试。'
  } finally {
    busy.value = false
  }
}
async function refresh() {
  state.value = await securityStatus()
}
async function generate() {
  code.value = ''
  const result = z
    .object({ code: z.string() })
    .parse(await accountRequest('security/recovery-code', 'POST', { password: password.value }))
  code.value = result.code
  password.value = ''
  await refresh()
}
async function change() {
  if (next.value !== confirm.value) throw new Error('两次输入的新密码不一致。')
  await syncAccount()
  if (accountState.sync === 'pending' || accountState.conflict)
    throw new Error('请先处理账号同步，再修改密码。')
  await accountRequest('security/password', 'POST', {
    password: password.value,
    newPassword: next.value,
  })
  password.value = ''
  next.value = ''
  confirm.value = ''
  navigateAccount('/account?passwordChanged=1')
}
async function revoke() {
  await accountRequest('security/revoke-others', 'POST', { password: password.value })
  password.value = ''
  await refresh()
  message.value = '其他设备的登录已退出。'
}
function download() {
  const blob = new Blob(
    [
      `知识岛账号：${accountState.username}\n一次性恢复码：${code.value}\n请保存在家长可以找到的安全位置，勿与他人分享。\n`,
    ],
    { type: 'text/plain;charset=utf-8' },
  )
  const url = URL.createObjectURL(blob),
    link = document.createElement('a')
  link.href = url
  link.download = '知识岛账号恢复码.txt'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
onMounted(() => run(refresh))
</script>
<template>
  <AppShell context="账号安全">
    <div class="account-tools">
      <RouterLink to="/account">← 账号与同步</RouterLink>
      <h1>账号安全</h1>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="message" role="status">{{ message }}</p>
      <button v-if="!state" :disabled="busy" @click="run(refresh)">重新加载</button>
      <template v-if="state">
        <section>
          <h2>家长密码确认</h2>
          <p>生成恢复码、修改密码和退出其他设备都需要当前密码。</p>
          <label
            >当前密码<input
              v-model="password"
              type="password"
              autocomplete="current-password"
              minlength="10"
              maxlength="128"
              :disabled="busy"
          /></label>
        </section>
        <section>
          <h2>一次性恢复码 · {{ state.recoveryEnabled ? '已设置' : '尚未设置' }}</h2>
          <p>忘记密码时，可用恢复码找回账号。每次生成都会让旧恢复码失效；使用后需要重新生成。</p>
          <button :disabled="busy || password.length < 10" @click="run(generate)">
            {{ state.recoveryEnabled ? '生成新的恢复码（旧码失效）' : '生成恢复码' }}
          </button>
          <div v-if="code">
            <p>仅在本次显示，请立即下载或抄写保存：</p>
            <code class="recovery-code">{{ code }}</code>
            <div class="actions">
              <button @click="download">下载恢复码</button
              ><button @click="code = ''">已保存，隐藏恢复码</button>
            </div>
          </div>
        </section>
        <section>
          <h2>修改密码</h2>
          <p>
            修改后保留此设备登录，其他设备需要用新密码重新登录。旧恢复码同时失效，请随后生成新的恢复码。
          </p>
          <form @submit.prevent="run(change)">
            <label
              >新密码<input
                v-model="next"
                type="password"
                autocomplete="new-password"
                minlength="10"
                maxlength="128"
                required
                :disabled="busy"
            /></label>
            <label
              >确认新密码<input
                v-model="confirm"
                type="password"
                autocomplete="new-password"
                minlength="10"
                maxlength="128"
                required
                :disabled="busy"
            /></label>
            <button :disabled="busy || password.length < 10">保存新密码</button>
          </form>
        </section>
        <section>
          <h2>登录设备（{{ state.sessions.length }}）</h2>
          <p>设备信息由浏览器提供，可用于识别登录。当前登录最长保留 7 天。</p>
          <ul>
            <li v-for="session in state.sessions" :key="session.id">
              <strong>{{ session.current ? '当前设备' : '其他设备' }}</strong>
              <p class="feedback-copy">{{ session.device }}</p>
              <small>{{ new Date(session.createdAt).toLocaleString('zh-CN') }} 登录</small>
            </li>
          </ul>
          <button
            :disabled="busy || password.length < 10 || state.sessions.length < 2"
            @click="run(revoke)"
          >
            退出其他所有设备
          </button>
        </section>
      </template>
    </div>
  </AppShell>
</template>
