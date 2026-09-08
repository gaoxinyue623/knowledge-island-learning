<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/layouts/AppShell.vue'
import AppButton from '@/components/common/AppButton.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import { characterOptions, useStudentStore } from '@/stores/studentStore'
const student = useStudentStore()
const selected = ref(student.characterId ?? 'default-character')
const message = ref('')
const outfit = computed(
  () => characterOptions.find((item) => item.id === selected.value) ?? characterOptions[0],
)
function selectOutfit(id: string) {
  selected.value = id
  message.value = ''
}
function save() {
  message.value = student.setCharacter(selected.value) ? '装扮已保存，团子准备好陪你出发了！' : ''
}
</script>
<template>
  <AppShell show-bottom-nav context="角色装扮">
    <div class="personal-page content-container">
      <RouterLink class="personal-back" to="/profile">← 返回我的</RouterLink>
      <header class="personal-heading">
        <h1>团子的衣帽间</h1>
        <p>选一套喜欢的颜色，带着好心情去探索。</p>
      </header>
      <div class="personal-columns">
        <section class="personal-panel personal-preview" aria-label="角色预览">
          <KnowledgeDangoPlaceholder :character-id="selected" state="happy" size="lg" />
          <h2>{{ outfit.name }}</h2>
          <p>今天也一起学一点新知识吧。</p>
          <span class="personal-tag">{{
            selected === student.characterId ? '当前装扮' : '试穿中'
          }}</span>
        </section>
        <section class="personal-panel">
          <h2>选择装扮</h2>
          <div class="personal-outfits" role="group" aria-label="可用装扮">
            <button
              v-for="item in characterOptions"
              :key="item.id"
              type="button"
              class="personal-outfit"
              :aria-pressed="selected === item.id"
              @click="selectOutfit(item.id)"
            >
              <KnowledgeDangoPlaceholder :character-id="item.id" size="sm" /><strong>{{
                item.name
              }}</strong
              ><small>{{ selected === item.id ? '已选择' : '可使用' }}</small>
            </button>
          </div>
          <p class="personal-muted">
            三套基础装扮都可以自由使用。这是你的学习头像，宠物伙伴在成长页单独领养和喂养。
          </p>
          <AppButton @click="save">保存装扮</AppButton>
          <p v-if="message" role="status" class="personal-notice">{{ message }}</p>
          <p v-if="student.warning" role="alert" class="personal-notice">{{ student.warning }}</p>
        </section>
      </div>
    </div>
  </AppShell>
</template>
