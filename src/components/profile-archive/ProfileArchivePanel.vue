<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { profileArchiveService } from '@/services/profile-archive/profileArchiveService'
import { archiveSectionLabels, archiveStatusLabels } from './archivePresentation'
import type { ArchivePreview } from '@/services/profile-archive/profileArchiveSchema'
import { useStudentStore } from '@/stores/studentStore'

const student = useStudentStore()
const preview = ref<ArchivePreview | null>(null)
const incoming = ref<unknown>(null)
const message = ref('')
const busy = ref(false)
let initialRegistry = null
try {
  initialRegistry = student.profile ? profileArchiveService.bootstrapProfile({
      id: student.profile.id,
      displayName: student.profile.displayName,
      characterId: student.characterId ?? 'default-character',
      createdAt: new Date().toISOString(),
    }) : null
} catch { message.value = '本机档案目录暂时无法读取，原记录没有修改。' }
if (student.profile && initialRegistry === null && !message.value) {
  message.value = '本机档案目录无法读取，原记录已保留。'
}
const registry = ref(initialRegistry)
const activeId = computed(() => registry.value?.activeProfileId ?? student.profile?.id ?? null)

async function exportFile() {
  if (!student.profile) return
  busy.value = true; message.value = ''
  try {
    const archive = await profileArchiveService.exportArchive(student.profile.id)
    const url = URL.createObjectURL(new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `knowledge-island-${student.profile.displayName}-archive.json`; link.click()
    URL.revokeObjectURL(url)
    message.value = '学习档案已导出。文件不包含登录凭证、偏好设置或媒体缓存。'
  } catch { message.value = '档案未导出：发现无法安全读取的记录，原数据没有修改。' }
  finally { busy.value = false }
}
async function chooseFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  preview.value = null; incoming.value = null; message.value = ''
  if (!file || file.size > 4 * 1024 * 1024) { message.value = '请选择不超过 4MB 的学习档案文件。'; return }
  try {
    incoming.value = JSON.parse(await file.text())
    preview.value = profileArchiveService.inspectArchive(incoming.value)
    if (!preview.value.canRestore) message.value = '文件没有通过逐类校验，不能恢复。'
  } catch { message.value = '文件格式无法识别，不能恢复。' }
}
async function restoreCopy() {
  if (!preview.value || !incoming.value) return
  busy.value = true; message.value = ''
  try {
    const result = await profileArchiveService.restore(incoming.value, preview.value)
    registry.value = result.registry
    message.value = '恢复副本已建立并切换。原学习档案保持不变。'
    window.setTimeout(() => window.location.reload(), 0)
  } catch (error) { message.value = error instanceof Error && error.message === 'PREVIEW_STALE' ? '预览已过期，请重新选择文件。' : '恢复没有完成；原档案保持不变。' }
  finally { busy.value = false }
}
function activate(id: string) {
  try {
    profileArchiveService.activate(id)
    window.location.reload()
  } catch { message.value = '这个档案无法安全加载，当前档案没有切换。' }
}
</script>

<template>
  <section class="personal-panel profile-archive-panel" aria-labelledby="profile-archive-title">
    <h2 id="profile-archive-title">学习档案备份与恢复</h2>
    <p class="personal-muted">导入会创建一个新的本地副本，不会覆盖原来的学习记录。</p>
    <div class="profile-archive-panel__actions">
      <AppButton type="button" :disabled="busy || !student.profile" @click="exportFile">导出学习档案</AppButton>
      <label class="profile-archive-panel__upload">导入学习档案<input type="file" accept="application/json,.json" :disabled="busy" @change="chooseFile" /></label>
    </div>
    <div v-if="preview" class="profile-archive-panel__preview">
      <p><strong>{{ preview.target.proposedDisplayName }}</strong> 将作为新副本恢复。</p>
      <ul><li v-for="section in preview.sections" :key="section.kind">{{ archiveSectionLabels[section.kind] }}：{{ archiveStatusLabels[section.status] }}（{{ section.count }}）</li></ul>
      <AppButton v-if="preview.canRestore" type="button" :disabled="busy" @click="restoreCopy">确认创建恢复副本</AppButton>
    </div>
    <div v-if="registry?.profiles.length" class="profile-archive-panel__profiles">
      <h3>本机学习档案</h3>
      <button v-for="profile in registry.profiles" :key="profile.id" type="button" :disabled="profile.id === activeId" @click="activate(profile.id)">{{ profile.displayName }}{{ profile.id === activeId ? '（正在使用）' : '（切换）' }}</button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>

<style scoped>
.profile-archive-panel__actions,.profile-archive-panel__profiles{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}.profile-archive-panel__upload{cursor:pointer;padding:.6rem .9rem;border:1px solid currentColor;border-radius:.6rem}.profile-archive-panel__upload input{display:block;max-width:14rem;margin-top:.35rem}.profile-archive-panel__preview{margin-top:1rem}.profile-archive-panel__preview ul{max-height:10rem;overflow:auto;padding-left:1.2rem;font-size:.9rem}.profile-archive-panel__profiles{margin-top:1rem}.profile-archive-panel__profiles button{padding:.45rem .65rem}
</style>
