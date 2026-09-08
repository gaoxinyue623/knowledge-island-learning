<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import type { SpacedReviewDue } from '@/services/student-growth/spacedReview'

defineProps<{ items: SpacedReviewDue[] }>()
defineEmits<{ launch: [item: SpacedReviewDue] }>()
</script>

<template>
  <section v-if="items.length" class="spaced-review-entry" aria-labelledby="spaced-review-title">
    <div>
      <p class="curriculum-eyebrow">隔一隔，再试一次</p>
      <h2 id="spaced-review-title">今天的复习小站</h2>
      <p>完成新一轮独立作答后，才会安排下一次复习；提示或答错后重做不会算作独立掌握。</p>
    </div>
    <ol>
      <li v-for="item in items" :key="item.questId + ':' + item.contentRevision">
        <div>
          <strong>{{ item.title }}</strong>
          <span>
            {{ item.subject === 'MATH' ? '数学' : item.subject === 'ENGLISH' ? '英语' : '语文' }} ·
            {{
              item.completedIndependentRounds
                ? `第 ${item.completedIndependentRounds} 次独立完成后复查`
                : '上次使用了提示或需要重试，今天再试试'
            }}
          </span>
        </div>
        <AppButton size="sm" variant="secondary" icon-right="arrow-right" @click="$emit('launch', item)">
          开始复习
        </AppButton>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.spaced-review-entry {
  display: grid;
  gap: 1rem;
  margin: 1.25rem 0;
  padding: 1.25rem;
  border: 1px solid var(--color-primary-200, #b9d8ff);
  border-radius: 1rem;
  background: var(--color-primary-50, #f1f8ff);
}

.spaced-review-entry h2,
.spaced-review-entry p {
  margin: 0;
}

.spaced-review-entry p:last-child {
  margin-top: 0.5rem;
  color: var(--color-text-secondary, #4b5563);
}

.spaced-review-entry ol {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.spaced-review-entry li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 3rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: white;
}

.spaced-review-entry li div {
  display: grid;
  gap: 0.25rem;
}

.spaced-review-entry li span {
  color: var(--color-text-secondary, #4b5563);
  font-size: 0.875rem;
}

@media (max-width: 480px) {
  .spaced-review-entry li {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
