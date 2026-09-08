<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '@/layouts/AppShell.vue'
import AppButton from '@/components/common/AppButton.vue'
import ProfileArchivePanel from '@/components/profile-archive/ProfileArchivePanel.vue'
import { useStudentStore } from '@/stores/studentStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
const student = useStudentStore()
const settings = usePreferencesStore()
const name = ref(student.profile?.displayName ?? '小岛同学')
const draft = ref({ ...settings.preferences })
const nameMessage = ref('')
const preferencesMessage = ref('')
function saveName() {
  nameMessage.value = student.savePersonalProfile(
    name.value,
    student.characterId ?? 'default-character',
  )
    ? '昵称已保存。'
    : ''
}
function savePreferences() {
  preferencesMessage.value = settings.save(draft.value) ? '设置已保存并生效。' : ''
}
</script>
<template>
  <AppShell show-bottom-nav context="通用设置">
    <div class="personal-page content-container">
      <RouterLink class="personal-back" to="/profile">← 返回我的</RouterLink>
      <header class="personal-heading">
        <h1>把知识岛调成你喜欢的样子</h1>
        <p>个人资料、学习偏好和使用帮助，都在这里。</p>
      </header>
      <div class="personal-columns">
        <div class="personal-stack">
          <form class="personal-panel" @submit.prevent="saveName">
            <h2>我的昵称</h2>
            <label class="personal-field" for="student-name"
              >昵称<input
                id="student-name"
                v-model="name"
                required
                maxlength="20"
                autocomplete="nickname"
                @input="nameMessage = ''"
            /></label>
            <p class="personal-muted">1～20 个字符，使用你喜欢的昵称即可。</p>
            <AppButton type="submit">保存昵称</AppButton>
            <p v-if="nameMessage" role="status">{{ nameMessage }}</p>
            <p v-if="student.warning" role="alert">{{ student.warning }}</p>
          </form>
          <form class="personal-panel" @submit.prevent="savePreferences">
            <h2>学习偏好</h2>
            <label class="personal-setting"
              ><span
                ><strong>减少动效</strong
                ><small>减少页面动画和角色运动；也会尊重设备的减少动态效果设置。</small></span
              ><input
                v-model="draft.reducedMotion"
                type="checkbox"
                @change="preferencesMessage = ''" /></label
            ><label class="personal-setting"
              ><span
                ><strong>媒体默认静音</strong
                ><small>课程和题目的音频、视频默认静音，播放时仍可手动开启声音。</small></span
              ><input
                v-model="draft.muted"
                type="checkbox"
                @change="preferencesMessage = ''" /></label
            ><label class="personal-setting"
              ><span
                ><strong>展开文字讲解</strong
                ><small>有配套文字的媒体默认展开讲解，也可以随时收起。</small></span
              ><input
                v-model="draft.showTranscript"
                type="checkbox"
                @change="preferencesMessage = ''" /></label
            ><AppButton type="submit">保存设置</AppButton>
            <p v-if="preferencesMessage" role="status">{{ preferencesMessage }}</p>
            <p v-if="settings.warning" role="alert">{{ settings.warning }}</p>
          </form>
          <ProfileArchivePanel />
        </div>
        <section class="personal-panel personal-help">
          <h2>帮助与隐私</h2>
          <details open>
            <summary>怎样修改年级或教材？</summary>
            <p>在“我的学习设置”中修改地区、年级或单科教材，并按页面提示确认。</p>
            <RouterLink class="personal-text-link" to="/curriculum-settings"
              >打开我的学习设置 →</RouterLink
            >
          </details>
          <details>
            <summary>在哪里查看学习和成长？</summary>
            <p>学习记录可以回看已完成的学习；成长页面展示学习获得的能量和成就。</p>
            <RouterLink class="personal-text-link" to="/history">查看学习记录 →</RouterLink>
          </details>
          <details>
            <summary>资料保存在哪里？</summary>
            <p>
              昵称、装扮、偏好和学习记录保存在当前浏览器中。更换设备或浏览器不会自动同步；清除网站数据可能丢失这些记录。
            </p>
          </details>
          <details>
            <summary>没有网络时可以使用吗？</summary>
            <p>
              已打开的页面可以读取本地记录。刷新页面、打开未加载的页面或播放在线媒体时可能需要网络。
            </p>
          </details>
          <details>
            <summary>会发送学习通知吗？</summary>
            <p>目前没有系统推送或后台学习提醒。你可以在首页查看今日学习任务。</p>
          </details>
          <details>
            <summary>声音或文字没有显示？</summary>
            <p>
              先检查播放器是否静音，以及课程是否提供音频或配套文字。修改播放偏好不会生成课程中尚未提供的媒体内容。
            </p>
          </details>
        </section>
      </div>
    </div>
  </AppShell>
</template>
