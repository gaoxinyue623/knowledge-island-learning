<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import ParentGate from '@/components/account/ParentGate.vue'
const route = useRoute()
const showRestore = ref(false)
import AppShell from '@/layouts/AppShell.vue'
import {
  accountState,
  syncAccount,
  logoutAccount,
  captureAccountSnapshot,
  downloadAccountSnapshot,
  resolveAccountConflict,
  hasLegacyData,
  initializeAccount,
  navigateAccount,
  prepareAccountRestore,
  applyAccountRestore,
} from '@/services/account/accountService'
const legacyAvailable = hasLegacyData()
async function bindLegacy() {
  await initializeAccount(true)
  if (!accountState.ready) throw new Error(accountState.error)
  navigateAccount('/home')
}
const busy = ref(false),
  error = ref('')
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败，请重试。'
  } finally {
    busy.value = false
  }
}
const restoreDraft = ref<Awaited<ReturnType<typeof prepareAccountRestore>> | null>(null)
async function previewRestore(event: Event) {
  restoreDraft.value = null
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await run(async () => {
    if (file.size > 16 * 1024 * 1024) throw new Error('备份文件过大，请选择知识岛导出的账号备份。')
    restoreDraft.value = await prepareAccountRestore(await file.text())
  })
  input.value = ''
}
async function restoreBackup() {
  const draft = restoreDraft.value
  if (!draft) return
  restoreDraft.value = null
  await run(() => applyAccountRestore(draft))
}
const labels = {
  idle: '准备好记录新的成长',
  saving: '正在同步到账号…',
  saved: '记录已同步到账号',
  pending: '本机已保存，等待同步',
  conflict: '发现另一份记录，需要你选择',
}
</script>
<template>
  <AppShell context="账号与同步" show-bottom-nav>
    <div class="account-page content-container">
      <p class="curriculum-eyebrow">让成长记录，跟着你一起走</p>
      <h1>账号与同步</h1>
      <p v-if="route.query.passwordChanged" role="status">
        密码已修改，其他设备已退出登录。请在账号安全中重新生成并保存恢复码。
      </p>
      <section>
        <span class="account-label">当前登录账号</span>
        <h2>{{ accountState.username }}</h2>
        <p>一个账号可以创建多个孩子的档案，每个孩子的学习与宠物记录独立保存。</p>
        <div class="account-actions">
          <RouterLink to="/family">管理家庭学习档案 →</RouterLink
          ><RouterLink to="/account/security">账号安全与恢复码 →</RouterLink
          ><RouterLink to="/feedback">问题与建议 →</RouterLink>
        </div>
      </section>
      <p v-if="error || accountState.error" role="alert" class="account-warning">
        {{ error || accountState.error }}
      </p>
      <section>
        <h2>{{ labels[accountState.sync] }}</h2>
        <p v-if="accountState.lastSaved">
          最近同步：{{ new Date(accountState.lastSaved).toLocaleString('zh-CN') }}
        </p>
        <p>
          自动保存学习进度、错题、成长奖励、宠物与背包、家庭档案和偏好设置。AI
          专项记录直接保存在当前账号中。
        </p>
        <p>断网时，新记录会先保存在此设备；网络恢复后重试同步。</p>
        <div class="account-actions">
          <button
            :disabled="busy || accountState.sync === 'saving' || !!accountState.conflict"
            @click="run(syncAccount)"
          >
            立即同步</button
          ><button
            class="secondary"
            :disabled="busy"
            @click="run(async () => downloadAccountSnapshot(await captureAccountSnapshot()))"
          >
            下载本机备份
          </button>
        </div>
      </section>
      <section v-if="accountState.conflict" class="account-conflict">
        <h2>两个设备的记录有差异</h2>
        <p>
          云端最近更新于
          {{
            new Date(accountState.conflict.updatedAt).toLocaleString('zh-CN')
          }}。为避免丢失进度，请选择要继续使用的版本。另一份记录会先下载为备份。
        </p>
        <div class="account-actions">
          <button :disabled="busy" @click="run(() => resolveAccountConflict('cloud'))">
            备份本机记录，使用云端版本</button
          ><button
            class="secondary"
            :disabled="busy"
            @click="run(() => resolveAccountConflict('local'))"
          >
            备份云端记录，使用本机版本
          </button>
        </div>
      </section>
      <button v-if="!showRestore" class="secondary" @click="showRestore = true">
        从账号备份恢复（需家长确认）
      </button>
      <ParentGate v-if="showRestore"
        ><section>
          <h2>从账号备份恢复</h2>
          <p>
            可选择之前下载的知识岛账号备份。确认后会替换当前账号的学习与宠物记录，并先下载一份恢复前备份。
          </p>
          <label for="account-restore"
            >选择备份文件
            <input
              id="account-restore"
              type="file"
              accept=".json,application/json"
              :disabled="busy"
              @change="previewRestore"
          /></label>
          <div v-if="restoreDraft">
            <p>
              已检查：{{ restoreDraft.snapshot.entries.length }} 项学习与设置记录，{{
                restoreDraft.snapshot.pets.length
              }}
              份宠物档案。
            </p>
            <button :disabled="busy" @click="restoreBackup">确认替换为这份备份</button>
          </div>
        </section>
      </ParentGate>
      <section v-if="legacyAvailable">
        <h2>发现登录前的学习记录</h2>
        <p>
          可以把此设备之前的学习与宠物记录绑定到当前账号。仅在当前账号为空时导入，原始副本会保留。
        </p>
        <button :disabled="busy" @click="run(bindLegacy)">绑定旧记录到当前账号</button>
      </section>
      <section>
        <h2>退出账号</h2>
        <p>退出前会同步最新记录。同一设备登录其他账号时，只显示该账号的资料。</p>
        <button class="secondary" :disabled="busy" @click="run(logoutAccount)">退出登录</button>
      </section>
    </div>
  </AppShell>
</template>
<style scoped>
.account-page {
  padding-top: 35px;
  padding-bottom: 65px;
  color: #294b39;
}
.account-page h1 {
  font-size: 30px;
  margin: 10px 0 28px;
}
.account-page section {
  background: #fff;
  border: 1px solid #e0e7dc;
  border-radius: 18px;
  padding: 24px;
  margin: 16px 0;
}
.account-page h2 {
  font-size: 19px;
  margin: 6px 0 12px;
}
.account-page p {
  color: #6d7b6e;
  font-size: 14px;
  line-height: 1.9;
}
.account-label {
  color: #80917d;
  font-size: 12px;
}
.account-page a {
  display: inline-block;
  margin-top: 12px;
  color: #47754d;
}
.account-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
.account-page button {
  border: 0;
  background: #3e694c;
  color: white;
  border-radius: 9px;
  padding: 12px 18px;
  font-size: 13px;
}
.account-page button.secondary {
  background: #eff4eb;
  color: #496343;
  border: 1px solid #d6e0ce;
}
.account-page button:disabled {
  opacity: 0.5;
}
.account-warning,
.account-page section.account-conflict {
  background: #fff6e7;
  border: 1px solid #e8d7af;
  padding: 18px;
  border-radius: 14px;
}
</style>
