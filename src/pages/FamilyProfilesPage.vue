<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { z } from 'zod'
import AppShell from '@/layouts/AppShell.vue'
import { useStudentStore, characterOptions } from '@/stores/studentStore'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { profileArchiveService } from '@/services/profile-archive/profileArchiveService'
import type {
  ArchivePreview,
  StudentProfileArchive,
} from '@/services/profile-archive/profileArchiveSchema'
import {
  localFamilyProfileRepository,
  type LocalFamilyProfileRegistry,
} from '@/services/family/localFamilyProfiles'
import { PetCloudError, petCloudRequest } from '@/services/pet/petCloud'
import {
  createFamilyCloudProfile,
  downloadFamilyCloudSnapshot,
  listFamilyCloudProfiles,
  updateFamilyCloudProfile,
  type FamilyCloudProfile,
  type FamilyCloudSnapshot,
} from '@/services/family-cloud/familyCloud'
import {
  archiveSectionLabels,
  archiveStatusLabels,
} from '@/components/profile-archive/archivePresentation'

const student = useStudentStore()
const { profileId } = useLearningProfile()
const registry = ref<LocalFamilyProfileRegistry | null>(null)
const name = ref('')
const character = ref<string>(characterOptions[0].id)
const busy = ref(false)
const message = ref('')
const username = ref<string | null>(null)
const loginName = ref('')
const password = ref('')
const profiles = ref<FamilyCloudProfile[]>([])
const selectedId = ref('')
const selected = computed(() =>
  profiles.value.find((item) => item.cloudProfileId === selectedId.value),
)
const snapshot = ref<FamilyCloudSnapshot | null>(null)
const restorePreview = ref<ArchivePreview | null>(null)
const upload = ref<{
  archive: StudentProfileArchive
  preview: ArchivePreview
  target?: FamilyCloudProfile
} | null>(null)
const conflict = ref(false)
let generation = 0

function resetCloud() {
  username.value = null
  profiles.value = []
  selectedId.value = ''
  snapshot.value = null
  restorePreview.value = null
  upload.value = null
  conflict.value = false
}
function initializeLocal() {
  generation++
  busy.value = false
  message.value = ''
  resetCloud()
  try {
    registry.value = student.profile
      ? profileArchiveService.bootstrapProfile({
          id: student.profile.id,
          displayName: student.profile.displayName,
          characterId: student.characterId ?? characterOptions[0].id,
          createdAt: new Date().toISOString(),
        })
      : localFamilyProfileRepository.read()
    if (!registry.value) message.value = '本机档案目录暂时无法读取，原资料已保留。请先在通用设置中检查档案备份。'
  } catch {
    registry.value = null
    message.value = '本机档案目录暂时无法读取，原资料已保留。请先在通用设置中导出可读取的档案。'
  }
}
async function run(action: (current: () => boolean) => Promise<void>) {
  if (busy.value) return
  busy.value = true
  message.value = ''
  const version = ++generation
  const id = profileId.value
  const current = () => version === generation && id === profileId.value
  try {
    await action(current)
  } catch (error) {
    if (!current()) return
    if (
      error instanceof PetCloudError &&
      (error.status === 401 || error.code === 'SESSION_CHANGED')
    )
      resetCloud()
    message.value =
      error instanceof z.ZodError
        ? '收到的档案信息无法识别，本机记录未改变。'
        : error instanceof Error
          ? error.message
          : '操作暂时未完成，请重试。'
  } finally {
    if (current()) busy.value = false
  }
}
async function createChild() {
  await run(async (current) => {
    const result = await profileArchiveService.createProfile({
      displayName: name.value,
      characterId: character.value,
      copyCurriculum: true,
    })
    if (current() && result.profile) window.location.reload()
  })
}
async function switchChild(id: string) {
  await run(async () => {
    await profileArchiveService.activate(id)
    window.location.reload()
  })
}
async function connect(mode: 'session' | 'login' | 'register') {
  await run(async (current) => {
    try {
      const response = z
        .object({ username: z.string().min(1).nullable() })
        .parse(
          await petCloudRequest(
            mode,
            mode === 'session' ? 'GET' : 'POST',
            mode === 'session'
              ? undefined
              : { username: loginName.value, password: password.value },
          ),
        )
      if (!current()) return
      resetCloud()
      username.value = response.username
      if (!response.username) {
        message.value = '服务已连接，请登录家长账号。'
        return
      }
      const list = await listFamilyCloudProfiles(response.username)
      if (!current()) return
      profiles.value = list
      message.value = '已连接。同步由你手动发起，本机档案保持独立。'
    } finally {
      password.value = ''
    }
  })
}
async function refreshCloud() {
  if (!username.value) return
  const account = username.value
  await run(async (current) => {
    const list = await listFamilyCloudProfiles(account)
    if (!current()) return
    profiles.value = list
    snapshot.value = null
    restorePreview.value = null
    upload.value = null
    conflict.value = false
    message.value = '云端列表已刷新，请重新预览需要同步的档案。'
  })
}
async function prepareUpload() {
  if (!username.value) return
  const id = profileId.value
  const target = selected.value ? { ...selected.value } : undefined
  await run(async (current) => {
    const archive = await profileArchiveService.exportArchive(id)
    if (!current()) return
    const preview = profileArchiveService.inspectArchive(archive)
    if (!preview.canRestore) throw new Error('当前档案未通过校验，暂不能同步。')
    upload.value = { archive, preview, target }
    conflict.value = false
  })
}
async function sendUpload(asNew: boolean) {
  if (!username.value || !upload.value || (!asNew && (!upload.value.target || conflict.value)))
    return
  const account = username.value
  const draft = upload.value
  await run(async (current) => {
    if (asNew) {
      await createFamilyCloudProfile(draft.preview.source.displayName, draft.archive, account)
    } else {
      const target = draft.target!
      const result = await updateFamilyCloudProfile(
        target.cloudProfileId,
        target.revision,
        draft.archive,
        account,
      )
      if (!current()) return
      if (result.kind === 'conflict') {
        conflict.value = true
        message.value =
          '另一台设备已更新这份云端档案。本次没有覆盖；可以另存新档案，或预览云端版本并恢复为本机副本。'
        return
      }
    }
    if (!current()) return
    upload.value = null
    snapshot.value = null
    restorePreview.value = null
    const list = await listFamilyCloudProfiles(account)
    if (current()) {
      profiles.value = list
      message.value = '云端档案已保存。继续学习后，可以再次预览并同步。'
    }
  })
}
async function inspectCloud() {
  if (!username.value || !selected.value) return
  const account = username.value
  const id = selected.value.cloudProfileId
  await run(async (current) => {
    const downloaded = await downloadFamilyCloudSnapshot(id, account)
    if (!current()) return
    snapshot.value = downloaded
    restorePreview.value = profileArchiveService.inspectArchive(downloaded.archive)
  })
}
async function restoreCloud() {
  if (!username.value || !snapshot.value || !restorePreview.value?.canRestore) return
  const account = username.value
  const expected = snapshot.value
  const preview = restorePreview.value
  await run(async (current) => {
    const latest = await downloadFamilyCloudSnapshot(expected.cloudProfileId, account)
    if (!current()) return
    if (latest.revision !== expected.revision || latest.digest !== expected.digest) {
      snapshot.value = null
      restorePreview.value = null
      throw new Error('云端档案已更新，请重新预览后恢复。')
    }
    await profileArchiveService.restore(expected.archive, preview)
    if (current()) window.location.reload()
  })
}
async function logout() {
  if (!username.value) return
  const account = username.value
  await run(async (current) => {
    await petCloudRequest('logout', 'POST', undefined, account)
    if (current()) {
      resetCloud()
      message.value = '已退出账号，本机学习档案仍保留。'
    }
  })
}
watch(profileId, initializeLocal, { immediate: true })
watch(selectedId, () => {
  snapshot.value = null
  restorePreview.value = null
  upload.value = null
  conflict.value = false
})
onBeforeUnmount(() => {
  generation++
  password.value = ''
})
</script>

<template>
  <AppShell context="家庭学习档案">
    <div class="content-container family-profiles">
      <header>
        <p class="curriculum-eyebrow">由家长管理，一人一份学习记录</p>
        <h1>家庭学习档案</h1>
        <p>
          本机可建立多个孩子的档案。登录家长账号后，可手动保存到云端，在另一台设备恢复为独立副本。
        </p>
      </header>
      <p v-if="message" role="status" class="family-profiles__notice">{{ message }}</p>
      <section aria-labelledby="family-local-title">
        <h2 id="family-local-title">本机的孩子</h2>
        <ul>
          <li v-for="child in registry?.profiles ?? []" :key="child.id">
            <strong>{{ child.displayName }}</strong
            ><span v-if="child.id === profileId">正在使用</span
            ><button v-else :disabled="busy" type="button" @click="switchChild(child.id)">
              切换到这个档案
            </button>
          </li>
        </ul>
        <form @submit.prevent="createChild">
          <h3>创建孩子档案</h3>
          <label for="family-child-name"
            >昵称<input
              id="family-child-name"
              v-model="name"
              required
              maxlength="20"
              :disabled="busy || !registry" /></label
          ><label for="family-character"
            >团子伙伴<select
              id="family-character"
              v-model="character"
              :disabled="busy || !registry"
            >
              <option v-for="option in characterOptions" :key="option.id" :value="option.id">
                {{ option.name }}
              </option>
            </select></label
          >
          <p>沿用当前教材设置，学习记录从空白开始。之后可在“我的学习设置”中调整教材。</p>
          <button type="submit" :disabled="busy || !registry || !name.trim()">
            创建并使用新档案
          </button>
        </form>
        <RouterLink to="/settings">通过文件导出或恢复学习档案 →</RouterLink>
      </section>
      <section aria-labelledby="family-cloud-title">
        <h2 id="family-cloud-title">家长账号与跨设备同步</h2>
        <template v-if="!username"
          ><p>可使用已有宠物备份账号，无需真实姓名或邮箱。请保存好密码，目前尚无找回密码功能。</p>
          <form @submit.prevent="connect('login')">
            <label for="family-account"
              >账号<input
                id="family-account"
                v-model="loginName"
                autocomplete="username"
                required
                pattern="[A-Za-z0-9_]{4,32}"
                minlength="4"
                maxlength="32"
                :disabled="busy" /></label
            ><label for="family-password"
              >密码<input
                id="family-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                minlength="10"
                maxlength="128"
                :disabled="busy"
            /></label>
            <div class="family-profiles__actions">
              <button type="submit" :disabled="busy">登录</button
              ><button
                type="button"
                :disabled="busy || !/^[A-Za-z0-9_]{4,32}$/.test(loginName) || password.length < 10"
                @click="connect('register')"
              >
                注册家长账号</button
              ><button type="button" :disabled="busy" @click="connect('session')">
                检查已有登录
              </button>
            </div>
          </form></template
        >
        <template v-else
          ><p>当前家长账号：{{ username }}</p>
          <div class="family-profiles__actions">
            <button type="button" :disabled="busy" @click="refreshCloud">刷新云端列表</button
            ><button type="button" :disabled="busy" @click="logout">退出账号</button>
          </div>
          <label for="family-cloud-select"
            >选择云端档案<select id="family-cloud-select" v-model="selectedId" :disabled="busy">
              <option value="">新建一份云端档案</option>
              <option
                v-for="item in profiles"
                :key="item.cloudProfileId"
                :value="item.cloudProfileId"
              >
                {{ item.label }} · {{ item.updatedAt.slice(0, 10) }}
              </option>
            </select></label
          >
          <p v-if="!profiles.length">云端还没有学习档案。</p>
          <div class="family-profiles__actions">
            <button type="button" :disabled="busy" @click="prepareUpload">预览本机档案再同步</button
            ><button type="button" :disabled="busy || !selected" @click="inspectCloud">
              预览选中的云端档案
            </button>
          </div></template
        >
        <div v-if="upload" class="family-profiles__preview">
          <h3>准备同步：{{ upload.preview.source.displayName }}</h3>
          <p>以下是刚刚读取的本机快照。同步期间新增的学习会在下次同步时保存。</p>
          <ul>
            <li
              v-for="item in upload.preview.sections.filter((section) => section.count > 0)"
              :key="item.kind"
            >
              {{ archiveSectionLabels[item.kind] }}：{{ item.count }} 项
            </li>
          </ul>
          <p v-if="upload.target">
            更新将替换云端“{{ upload.target.label }}”的学习快照。本机其他档案不受影响。
          </p>
          <div class="family-profiles__actions">
            <button type="button" :disabled="busy" @click="sendUpload(true)">
              另存为新的云端档案</button
            ><button
              v-if="upload.target"
              type="button"
              :disabled="busy || conflict"
              @click="sendUpload(false)"
            >
              确认更新选中的云端档案
            </button>
          </div>
        </div>
        <div v-if="snapshot && restorePreview" class="family-profiles__preview">
          <h3>云端：{{ snapshot.label }}</h3>
          <p>恢复会创建新的本机副本并切换过去，原学习记录保留。</p>
          <ul>
            <li v-for="item in restorePreview.sections" :key="item.kind">
              {{ archiveSectionLabels[item.kind] }}：{{ archiveStatusLabels[item.status] }}（{{
                item.count
              }}）
            </li>
          </ul>
          <button
            type="button"
            :disabled="busy || !restorePreview.canRestore"
            @click="restoreCloud"
          >
            确认恢复为新的本机副本
          </button>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.family-profiles {
  display: grid;
  gap: 1.25rem;
  padding-block: 1.5rem 2rem;
}
.family-profiles section,
.family-profiles form {
  display: grid;
  gap: 1rem;
}
.family-profiles section {
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 1rem;
  padding: 1rem;
}
.family-profiles h1,
.family-profiles h2,
.family-profiles h3,
.family-profiles p {
  margin: 0;
}
.family-profiles p {
  line-height: 1.7;
}
.family-profiles label {
  display: grid;
  gap: 0.4rem;
}
.family-profiles input,
.family-profiles select {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  min-height: 44px;
  font: inherit;
  padding: 0.55rem;
  border: 1px solid #94a3b8;
  border-radius: 0.5rem;
}
.family-profiles button {
  min-height: 44px;
  padding: 0.55rem 0.8rem;
  font: inherit;
  font-weight: 600;
  color: #174e79;
  background: #eff7ff;
  border: 1px solid #93b6d4;
  border-radius: 0.5rem;
  cursor: pointer;
}
.family-profiles button:disabled {
  opacity: 0.55;
  cursor: default;
}
.family-profiles ul {
  padding-left: 1.2rem;
  margin: 0;
  overflow-wrap: anywhere;
}
.family-profiles li {
  margin-block: 0.4rem;
}
.family-profiles li span,
.family-profiles li button {
  margin-left: 0.5rem;
}
.family-profiles__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.family-profiles__notice,
.family-profiles__preview {
  padding: 1rem;
  border-radius: 0.6rem;
  background: #f1f7ec;
}
.family-profiles__preview {
  display: grid;
  gap: 0.75rem;
}
.family-profiles__preview ul {
  max-height: 18rem;
  overflow-y: auto;
}
</style>
