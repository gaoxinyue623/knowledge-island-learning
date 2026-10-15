<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ notes?: readonly string[] }>()
const notes = computed(() => [
  ...new Set(
    (props.notes ?? [])
      .map((note) =>
        note
          .trim()
          .replace(/^(?:来源说明|补充稿核对说明)[：:]?\s*\n/u, '')
          .trim(),
      )
      .filter(Boolean),
  ),
])
</script>

<template>
  <details v-if="notes.length" class="lesson-source-notes">
    <summary>教材来源与校对说明</summary>
    <p class="lesson-source-notes__intro">核对教材版本或发现内容疑问时，可以在这里查看本课说明。</p>
    <ul>
      <li v-for="note in notes" :key="note">{{ note }}</li>
    </ul>
  </details>
</template>

<style scoped>
.lesson-source-notes {
  margin: 16px 0;
  padding: 12px 16px;
  border: 1px solid var(--color-border, #d8e2d7);
  border-radius: 14px;
  background: var(--color-surface, #fffdf8);
  color: var(--color-text-secondary, #4b6258);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.lesson-source-notes summary {
  min-height: 44px;
  align-content: center;
  cursor: pointer;
  color: var(--color-primary, #315f50);
  font-weight: 700;
}
.lesson-source-notes summary:focus-visible {
  outline: 2px solid var(--color-primary, #315f50);
  outline-offset: 3px;
  border-radius: 4px;
}
.lesson-source-notes__intro {
  margin: 8px 0;
}
.lesson-source-notes ul {
  display: grid;
  gap: 12px;
  padding-left: 20px;
  list-style: disc;
}
.lesson-source-notes li {
  white-space: pre-wrap;
}
</style>
