<script setup lang="ts">
import { ref } from 'vue'
import { petCloudRequest } from '@/services/pet/petCloud'
import '@/styles/account-tools.css'
const username = ref(''),
  code = ref(''),
  password = ref(''),
  confirm = ref(''),
  busy = ref(false),
  error = ref(''),
  done = ref(false)
async function submit() {
  if (busy.value) return
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = '两次输入的密码不一致。'
    return
  }
  busy.value = true
  try {
    await petCloudRequest('recover', 'POST', {
      username: username.value,
      code: code.value,
      newPassword: password.value,
    })
    password.value = ''
    confirm.value = ''
    code.value = ''
    done.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : '暂时无法找回，请重试。'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <main class="account-tools content-container">
    <RouterLink to="/login">← 返回登录</RouterLink>
    <section>
      <h1>找回账号密码</h1>
      <template v-if="done"
        ><p role="status">密码已重设，之前登录的设备均已退出，学习记录仍保留。</p>
        <p>恢复码已使用。登录后请在「账号安全」重新生成并保存恢复码。</p>
        <RouterLink to="/login">使用新密码登录 →</RouterLink></template
      >
      <template v-else>
        <p>使用你之前在「账号安全」保存的一次性恢复码重设密码。</p>
        <form @submit.prevent="submit">
          <label
            >账号<input
              v-model="username"
              autocomplete="username"
              autocapitalize="none"
              pattern="[A-Za-z0-9_]{4,32}"
              required
              :disabled="busy"
          /></label>
          <label
            >恢复码<input
              v-model="code"
              autocomplete="off"
              spellcheck="false"
              minlength="48"
              maxlength="80"
              required
              :disabled="busy"
              placeholder="输入之前保存的完整恢复码"
          /></label>
          <label
            >新密码<input
              v-model="password"
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
          <p v-if="error" role="alert">{{ error }}</p>
          <button :disabled="busy">{{ busy ? '正在重设…' : '重设密码并退出所有设备' }}</button>
        </form>
        <p>
          没有恢复码？若其他设备仍可登录，可在「账号安全」用当前密码生成。若密码和恢复码都已丢失，目前无法自助找回。
        </p>
      </template>
    </section>
  </main>
</template>
