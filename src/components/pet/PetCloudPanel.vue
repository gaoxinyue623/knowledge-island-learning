<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import { usePetStore } from '@/stores/petStore'
import { petRepository } from '@/services/pet/petDatabase'
import { restorePetBackup } from '@/services/pet/petBackup'
import { summarizePet } from '@/services/pet/petPolicy'
import {
  listCloudBackups,
  readCloudBackup,
  petCloudRequest,
  PetCloudError,
  type CloudBackup,
  type CloudBackupInfo,
} from '@/services/pet/petCloud'
import { PET_ACCOUNT_CHANGED } from '@/services/pet/petNotifications'
const pet = usePetStore()
const username = ref<string | null>(null),
  loginName = ref(''),
  password = ref(''),
  busy = ref(false),
  message = ref('')
const backups = ref<CloudBackupInfo[]>([]),
  selected = ref(''),
  label = ref('我的宠物小屋'),
  preview = ref<CloudBackup | null>(null)
let generation = 0,
  newBackupId = ''
const previewSummary = computed(() => (preview.value ? summarizePet(preview.value.account) : null))
const disabled = computed(() => busy.value || pet.busy || pet.loading || Boolean(pet.error))
watch(
  () => pet.profileId,
  () => {
    generation++
    selected.value = ''
    preview.value = null
    message.value = ''
    newBackupId = ''
    label.value = '我的宠物小屋'
  },
)
watch(selected, () => {
  preview.value = null
  newBackupId = ''
})
async function run(action: (version: number) => Promise<void>) {
  if (disabled.value) return
  busy.value = true
  message.value = ''
  const version = generation
  try {
    await action(version)
  } catch (error) {
    if (version === generation) {
      if (
        error instanceof PetCloudError &&
        (error.status === 401 || error.code === 'SESSION_CHANGED')
      ) {
        username.value = null
        backups.value = []
        selected.value = ''
        preview.value = null
      }
      message.value = error instanceof Error ? error.message : '操作未完成，请重试。'
    }
  } finally {
    busy.value = false
  }
}
async function connect(mode: 'session' | 'register' | 'login') {
  await run(async (version) => {
    const result = z
      .object({ username: z.string().nullable() })
      .parse(
        await petCloudRequest(
          mode,
          mode === 'session' ? 'GET' : 'POST',
          mode === 'session' ? undefined : { username: loginName.value, password: password.value },
        ),
      )
    password.value = ''
    if (version !== generation) return
    username.value = result.username
    if (result.username) {
      const list = await listCloudBackups(username.value!)
      if (version !== generation) return
      backups.value = list
      message.value = '已连接。可备份本机小屋，或选择云端备份先查看。'
    } else message.value = '服务已连接，请登录或注册家长账号。'
  })
}
async function refresh() {
  await run(async (version) => {
    const list = await listCloudBackups(username.value!)
    if (version === generation) {
      backups.value = list
      preview.value = null
      message.value = '备份列表已刷新。'
    }
  })
}
async function upload() {
  await run(async (version) => {
    if (!pet.account) return
    const cloudId = selected.value || (newBackupId ||= crypto.randomUUID())
    const info = backups.value.find((b) => b.profileId === cloudId)
    const account = { ...pet.account, profileId: cloudId }
    await petCloudRequest(
      'backup',
      'PUT',
      {
        profileId: cloudId,
        label: info?.label ?? label.value,
        revision: info?.revision ?? 0,
        account,
      },
      username.value!,
    )
    const list = await listCloudBackups(username.value!)
    if (version !== generation) return
    backups.value = list
    selected.value = cloudId
    message.value = '宠物小屋已备份。之后学习或喂养有变化时，请再次更新备份。'
  })
}
async function inspect() {
  await run(async (version) => {
    const result = await readCloudBackup(selected.value, username.value!)
    if (version === generation) preview.value = result
  })
}
async function restore() {
  await run(async (version) => {
    if (!preview.value) return
    const profileId = pet.profileId
    const expected = preview.value
    const latest = await readCloudBackup(expected.profileId, username.value!)
    if (version !== generation) return
    if (latest.revision !== expected.revision) {
      preview.value = null
      throw new Error('云端记录已更新，请重新预览后恢复。')
    }
    const snapshot = { ...latest.account, profileId }
    await petRepository.update(profileId, (current) => {
      if (version !== generation || profileId !== pet.profileId)
        throw new Error('学习档案已切换，未恢复。')
      return restorePetBackup(current, snapshot)
    })
    window.dispatchEvent(new CustomEvent(PET_ACCOUNT_CHANGED, { detail: profileId }))
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('knowledge-island.pet')
      channel.postMessage(profileId)
      channel.close()
    }
    if (version !== generation) return
    await pet.sync(profileId)
    if (version === generation) {
      message.value = '宠物小屋已恢复，较新的本机记录也会保留。'
      preview.value = null
    }
  })
}
async function logout() {
  await run(async (version) => {
    await petCloudRequest('logout', 'POST', undefined, username.value!)
    if (version === generation) {
      username.value = null
      backups.value = []
      selected.value = ''
      preview.value = null
      message.value = '已退出账号，本机宠物小屋仍保留。'
    }
  })
}
</script>
<template>
  <details class="pet-cloud-panel">
    <summary>家长账号 · 备份与恢复</summary>
    <p>
      由家长管理。备份包含积分、食物、伙伴、装饰和成长流水；教材进度、错题本和学习设置暂不包含。
    </p>
    <template v-if="!username">
      <p>账号无需真实姓名或邮箱。请妥善保存密码，当前尚无找回密码功能。</p>
      <form class="pet-name-form" @submit.prevent="connect('login')">
        <label for="pet-account-name">家长账号（4～32位字母、数字或下划线）</label>
        <input
          id="pet-account-name"
          v-model="loginName"
          autocomplete="username"
          minlength="4"
          maxlength="32"
          pattern="[A-Za-z0-9_]{4,32}"
          required
          :disabled="disabled"
        />
        <label for="pet-account-password">密码（10～128个字符）</label>
        <input
          id="pet-account-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          minlength="10"
          maxlength="128"
          required
          :disabled="disabled"
        />
        <button type="submit" class="pet-button" :disabled="disabled">登录</button>
        <button
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled || loginName.length < 4 || password.length < 10"
          @click="connect('register')"
        >
          注册家长账号
        </button>
        <button
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="connect('session')"
        >
          恢复登录状态
        </button>
      </form>
    </template>
    <template v-else>
      <p>当前账号：{{ username }}。登录不会自动上传或覆盖本机记录。</p>
      <div class="pet-actions">
        <button
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="refresh"
        >
          刷新备份</button
        ><button
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="logout"
        >
          退出账号
        </button>
      </div>
      <label for="pet-backup-select">选择备份</label>
      <select id="pet-backup-select" v-model="selected" :disabled="disabled">
        <option value="">另存为独立备份</option>
        <option v-for="item in backups" :key="item.profileId" :value="item.profileId">
          {{ item.label }} · {{ item.updatedAt.slice(0, 10) }} · 第{{ item.revision }}版 ·
          {{ item.profileId.slice(0, 6) }}
        </option>
      </select>
      <div v-if="!selected" class="pet-name-form">
        <label for="pet-backup-label">备份名字</label
        ><input id="pet-backup-label" v-model="label" maxlength="40" :disabled="disabled" />
      </div>
      <div class="pet-actions">
        <button
          type="button"
          class="pet-button"
          :disabled="disabled || !pet.summary.name || (!selected && !label.trim())"
          @click="upload"
        >
          {{ selected ? '更新这份备份' : '备份本机小屋' }}
        </button>
        <button
          v-if="selected"
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="inspect"
        >
          预览并恢复
        </button>
      </div>
      <div v-if="preview && previewSummary" class="pet-notice">
        <p>
          {{ preview.label }} · 可用 {{ previewSummary.balance }} 积分 ·
          {{ Object.keys(previewSummary.companions).length }} 位伙伴 · 累计获得
          {{ previewSummary.totalEarned }} 积分
        </p>
        <p>恢复到当前学习档案；如果两边已有不同的消费或成长记录，会停止恢复并保留双方数据。</p>
        <button type="button" class="pet-button" :disabled="disabled" @click="restore">
          恢复到当前小屋
        </button>
      </div>
      <p>换设备时先恢复再学习；离开设备前更新备份。离线时可继续学习，但不会自动上传。</p>
    </template>
    <p v-if="message" role="status" class="pet-notice">{{ message }}</p>
  </details>
</template>
