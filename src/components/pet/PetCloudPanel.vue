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
async function connect() {
  await run(async (version) => {
    const result = z
      .object({ username: z.string().nullable() })
      .parse(await petCloudRequest('session'))
    if (version !== generation) return
    username.value = result.username
    if (result.username) {
      const list = await listCloudBackups(result.username)
      if (version !== generation) return
      backups.value = list
      message.value = '独立备份已加载，日常宠物记录由账号自动同步。'
    } else message.value = '请前往统一登录页登录账号。'
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
</script>
<template>
  <details class="pet-cloud-panel">
    <summary>独立宠物备份与恢复</summary>
    <p>
      由家长管理。备份包含积分、食物、伙伴、装饰和成长流水；教材进度、错题本和学习设置暂不包含。
    </p>
    <template v-if="!username">
      <p>当前宠物已随账号自动同步。这里可以读取以前的独立备份，或另存一份宠物小屋。</p>
      <button type="button" class="pet-button" :disabled="disabled" @click="connect()">
        加载独立备份
      </button>
      <RouterLink to="/account">账号与同步</RouterLink>
    </template>
    <template v-else>
      <p>当前账号：{{ username }}。日常记录自动同步，以下是独立备份。</p>
      <div class="pet-actions">
        <button
          type="button"
          class="pet-button pet-button--light"
          :disabled="disabled"
          @click="refresh"
        >
          刷新备份
        </button>
        <RouterLink to="/account">账号与同步</RouterLink>
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
      <p>换设备登录后自动恢复账号数据；独立备份需要手动更新。</p>
    </template>
    <p v-if="message" role="status" class="pet-notice">{{ message }}</p>
  </details>
</template>
