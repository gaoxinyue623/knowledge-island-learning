<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import {
  accountState,
  authenticate,
  hasLegacyData,
  initializeAccount,
  navigateAccount,
} from '@/services/account/accountService'
import { safeAccountReturn } from '@/services/account/contract'
const route = useRoute()
const registering = computed(() => route.path === '/register')
const username = ref(''),
  password = ref(''),
  confirmPassword = ref(''),
  showPassword = ref(false)
const importLegacy = ref(false),
  legacyAvailable = hasLegacyData()
const busy = ref(false),
  error = ref('')
const destination = computed(() => safeAccountReturn(route.query.redirect))
async function submit() {
  if (busy.value) return
  error.value = ''
  if (registering.value && password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致。'
    return
  }
  busy.value = true
  try {
    await authenticate(
      registering.value ? 'register' : 'login',
      username.value,
      password.value,
      importLegacy.value,
    )
    password.value = ''
    confirmPassword.value = ''
    navigateAccount(accountState.conflict ? '/account' : destination.value)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '暂时无法登录，请重试。'
  } finally {
    busy.value = false
  }
}
async function retry() {
  busy.value = true
  await initializeAccount()
  busy.value = false
  if (accountState.ready && accountState.username)
    navigateAccount(accountState.conflict ? '/account' : destination.value)
}
</script>
<template>
  <main class="auth-page content-container">
    <section class="auth-story" aria-label="欢迎来到知识岛">
      <a href="/" class="auth-brand">✦ 知识岛 <span>KNOWLEDGE ISLAND</span></a>
      <div class="auth-story__body">
        <p class="auth-eyebrow">让每一次好奇，都留下成长的足迹</p>
        <h1>你的知识小岛，<br />一直在这里。</h1>
        <p>登录后，学习记录和团子伙伴都会跟着你。<br />换一台设备，也能接着上次的探索。</p>
        <div class="auth-island">
          <KnowledgeDangoPlaceholder size="lg" state="happy" /><span
            >今天，也一起发现新知识吧！</span
          >
        </div>
      </div>
      <div class="auth-benefits">
        <span>学习进度自动保存</span><span>一家人，独立档案</span><span>团子陪你一起成长</span>
      </div>
    </section>
    <section class="auth-card" :aria-busy="busy">
      <p class="auth-eyebrow">{{ registering ? '从这里，开始新的探索' : '欢迎回到你的小岛' }}</p>
      <h2>{{ registering ? '创建知识岛账号' : '登录知识岛' }}</h2>
      <p class="auth-intro">由家长管理账号，为孩子保管每一份成长记录。</p>
      <div class="auth-tabs">
        <RouterLink
          :to="{ path: '/login', query: { redirect: destination } }"
          :aria-current="!registering ? 'page' : undefined"
          >登录</RouterLink
        ><RouterLink
          :to="{ path: '/register', query: { redirect: destination } }"
          :aria-current="registering ? 'page' : undefined"
          >注册</RouterLink
        >
      </div>
      <p v-if="error || accountState.error" role="alert" class="auth-error">
        {{ error || accountState.error }}
      </p>
      <button
        v-if="!accountState.ready && accountState.error"
        type="button"
        class="auth-retry"
        :disabled="busy"
        @click="retry"
      >
        重新连接账号服务
      </button>
      <form @submit.prevent="submit">
        <label for="auth-username"
          >账号<input
            id="auth-username"
            v-model="username"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            pattern="[A-Za-z0-9_]{4,32}"
            minlength="4"
            maxlength="32"
            placeholder="给你的家庭起一个账号名"
            required
            :disabled="busy"
        /></label>
        <small>4～32 位英文字母、数字或下划线，不区分大小写。</small>
        <label for="auth-password"
          >密码
          <div class="auth-password">
            <input
              id="auth-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="registering ? 'new-password' : 'current-password'"
              minlength="10"
              maxlength="128"
              placeholder="至少 10 个字符"
              required
              :disabled="busy"
            /><button
              type="button"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div></label
        >
        <label v-if="registering" for="auth-confirm"
          >确认密码<input
            id="auth-confirm"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            minlength="10"
            maxlength="128"
            placeholder="再输入一次密码"
            required
            :disabled="busy"
        /></label>
        <label v-if="legacyAvailable" class="auth-migrate"
          ><input v-model="importLegacy" type="checkbox" :disabled="busy" /><span
            >将此设备登录前的学习记录绑定到这个账号<small
              >仅在账号没有已有记录时导入，原始记录会保留。</small
            ></span
          ></label
        >
        <button class="auth-submit" type="submit" :disabled="busy">
          {{
            busy ? '正在连接并整理记录…' : registering ? '创建账号，开启探索' : '登录，回到我的小岛'
          }}
          <span v-if="!busy">→</span>
        </button>
      </form>
      <p class="auth-footnote">
        无需填写孩子的真实姓名。请妥善保管账号和密码，登录后在「账号安全」保存恢复码。
        <RouterLink to="/recover">忘记密码？用恢复码找回</RouterLink>
      </p>
    </section>
  </main>
</template>
<style scoped>
.auth-page {
  min-height: 100dvh;
  background: #f7f8f2;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  color: #233e32;
  padding-block: 32px;
  gap: clamp(24px, 5vw, 88px);
  align-items: center;
}
.auth-story {
  align-self: stretch;
  border-radius: 30px;
  background: #e5eddf;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.auth-brand {
  font-size: 25px;
  font-weight: 800;
  color: #315c46;
  text-decoration: none;
}
.auth-brand span {
  display: block;
  font-size: 10px;
  letter-spacing: 3px;
  margin: 5px 0 0 29px;
}
.auth-story__body {
  margin: auto 0;
  padding: 54px 0 30px;
}
.auth-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #63846b;
}
.auth-story h1 {
  font-size: clamp(32px, 4vw, 54px);
  line-height: 1.3;
  letter-spacing: -1.5px;
  margin: 17px 0 23px;
}
.auth-story__body > p:last-of-type {
  line-height: 1.9;
  color: #5c7363;
  font-size: 15px;
}
.auth-island {
  margin: 36px auto 10px;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  background: radial-gradient(ellipse at center, #f3f4d3 0, transparent 68%);
  padding: 20px;
}
.auth-island span {
  font-size: 12px;
  color: #6b8063;
}
.auth-benefits {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #66816c;
}
.auth-benefits span::before {
  content: '✓ ';
  color: #3e714d;
}
.auth-card {
  width: 100%;
  max-width: 440px;
  margin: 35px auto;
}
.auth-card h2 {
  font-size: 29px;
  letter-spacing: -0.8px;
  margin: 9px 0;
}
.auth-intro {
  font-size: 13px;
  color: #7a877e;
  line-height: 1.8;
}
.auth-tabs {
  display: flex;
  border-bottom: 1px solid #dce4d9;
  margin: 26px 0 24px;
  gap: 30px;
}
.auth-tabs a {
  text-decoration: none;
  padding: 10px 8px;
  color: #819083;
  font-weight: 600;
}
.auth-tabs a[aria-current='page'] {
  color: #315e43;
  border-bottom: 3px solid #4c7958;
}
.auth-card form > label:not(.auth-migrate) {
  display: block;
  font-size: 13px;
  font-weight: 650;
  margin-top: 20px;
}
.auth-card input:not([type='checkbox']) {
  display: block;
  width: 100%;
  height: 49px;
  border: 1px solid #d9e1d5;
  border-radius: 10px;
  background: #fff;
  padding: 0 14px;
  color: #2c4734;
  font-size: 14px;
  margin-top: 8px;
  outline: none;
}
.auth-card input:focus {
  border-color: #759672;
  box-shadow: 0 0 0 3px #e0eadb;
}
.auth-card small {
  display: block;
  font-size: 11px;
  line-height: 1.6;
  color: #849081;
  font-weight: 400;
  margin-top: 7px;
}
.auth-password {
  position: relative;
}
.auth-password input {
  padding-right: 60px !important;
}
.auth-password button {
  position: absolute;
  right: 13px;
  top: 15px;
  border: 0;
  background: transparent;
  font-size: 12px;
  color: #63816a;
}
.auth-migrate {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 12px;
  line-height: 1.7;
  margin-top: 20px;
  color: #60765f;
}
.auth-migrate input {
  margin-top: 4px;
  accent-color: #4a7957;
}
.auth-submit {
  width: 100%;
  border: 0;
  border-radius: 11px;
  min-height: 50px;
  padding: 13px 18px;
  background: #345f46;
  color: #fff;
  font-weight: 650;
  font-size: 14px;
  margin-top: 27px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 5px 12px #345f4620;
}
.auth-submit:disabled {
  opacity: 0.65;
  cursor: wait;
}
.auth-footnote {
  font-size: 11px;
  color: #859083;
  line-height: 1.9;
  margin-top: 20px;
}
.auth-error {
  padding: 12px;
  background: #fff0e8;
  border-radius: 9px;
  color: #a54d34;
  font-size: 13px;
  line-height: 1.7;
}
.auth-retry {
  padding: 8px 0;
  color: #45654c;
  text-decoration: underline;
  background: none;
  border: 0;
}
@media (max-width: 760px) {
  .auth-page {
    display: block;
    padding-block: 20px;
  }
  .auth-story {
    padding: 23px;
    border-radius: 20px;
  }
  .auth-story__body {
    padding: 18px 0 4px;
  }
  .auth-story h1 {
    font-size: 28px;
    margin: 10px 0;
  }
  .auth-story__body > p:last-of-type {
    font-size: 12px;
  }
  .auth-island,
  .auth-benefits,
  .auth-story__body > .auth-eyebrow {
    display: none;
  }
  .auth-brand {
    font-size: 20px;
  }
  .auth-brand span {
    font-size: 8px;
  }
  .auth-card {
    margin: 32px auto 14px;
  }
  .auth-card h2 {
    font-size: 25px;
  }
}
</style>
