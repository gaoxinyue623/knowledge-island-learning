<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import type { PetStory } from '@/services/pet-stories/petStoryService'

const props = defineProps<{ story: PetStory }>()
const emit = defineEmits<{
  open: []
  review: []
  selfReport: [chapter: 'expression' | 'discovery']
}>()

function reportChapter(chapter: 'review' | 'expression' | 'discovery') {
  if (chapter === 'expression' || chapter === 'discovery') emit('selfReport', chapter)
}
</script>

<template>
  <article class="pet-story-card">
    <header>
      <p class="curriculum-eyebrow">团子的知识小故事</p>
      <h2>{{ props.story.title }}</h2>
      <AppButton v-if="!props.story.opened" size="sm" variant="secondary" @click="emit('open')">打开故事</AppButton>
      <span v-else>故事已打开</span>
    </header>
    <p>{{ props.story.introduction }}</p>

    <ol>
      <li v-for="chapter in props.story.chapters" :key="chapter.id">
        <strong>{{ chapter.title }}</strong>
        <p>{{ chapter.prompt }}</p>
        <span>{{ chapter.completed ? '已完成' : chapter.id === 'review' ? '完成新的复习后解锁' : '可以自己记录' }}</span>
        <AppButton
          v-if="!chapter.completed && chapter.id === 'review'"
          size="sm"
          @click="emit('review')"
        >
          去复习
        </AppButton>
        <button
          v-else-if="!chapter.completed"
          type="button"
          @click="reportChapter(chapter.id)"
        >
          我完成了
        </button>
      </li>
    </ol>
  </article>
</template>

<style scoped>
.pet-story-card { display: grid; gap: 1rem; padding: 1rem; border: 1px solid var(--color-primary-200, #b9d8ff); border-radius: 1rem; }
.pet-story-card header { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.pet-story-card h2, .pet-story-card p { margin: 0; }
.pet-story-card ol { display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
.pet-story-card li { padding: .75rem; background: var(--color-primary-50, #f1f8ff); border-radius: .5rem; }
.pet-story-card li span { display: block; margin: .35rem 0; color: var(--color-text-secondary, #4b5563); }
</style>
