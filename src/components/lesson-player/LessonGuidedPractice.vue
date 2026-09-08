<script setup lang="ts">
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import type { ReadingPracticeQuest } from '@/types/reading-quest'

defineProps<{
  quest: ReadingPracticeQuest | null
  title: string
  profileId: string
  state: 'loading' | 'ready' | 'unavailable' | 'error'
}>()

defineEmits<{ openDetails: []; retry: [] }>()
</script>

<template>
  <section class="lesson-guided-practice" aria-labelledby="lesson-guided-practice-title">
    <div class="lesson-guided-practice__heading">
      <div>
        <p class="curriculum-eyebrow">读完马上练一练</p>
        <h3 id="lesson-guided-practice-title">现在就试试课后练习</h3>
      </div>
      <span>不用限时</span>
    </div>
    <p class="lesson-guided-practice__intro">
      先练一关，也可以休息。完成课程不等于已经掌握；已通过的关卡会自动保存。
    </p>

    <p v-if="state === 'loading'" class="lesson-guided-practice__status" role="status">
      正在准备课后练习……
    </p>
    <ReadingQuest
      v-else-if="state === 'ready' && quest"
      :key="`${profileId}:${quest.id}`"
      :quest="quest"
      :profile-id="profileId"
      :reading-label="title"
      note="基础练习会一关一关出现；强化练习和动手活动在完整学习内容里。"
    />
    <div v-else class="lesson-guided-practice__fallback" role="status">
      <p v-if="state === 'error'">课后练习暂时没有准备好，你可以先回首页，晚些时候再来。</p>
      <p v-else>这节课暂时没有可直接开始的课后练习。</p>
      <button
        v-if="state === 'error'"
        data-test="retry-guided-practice"
        type="button"
        @click="$emit('retry')"
      >
        重新准备课后练习
      </button>
      <button type="button" @click="$emit('openDetails')">查看完整学习内容</button>
    </div>
  </section>
</template>

<style scoped>
.lesson-guided-practice {
  display: grid;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 1.25rem;
  border: 1px solid var(--color-primary-200, #b9d8ff);
  border-radius: 1rem;
  background: var(--color-primary-50, #f1f8ff);
}

.lesson-guided-practice__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lesson-guided-practice__heading h3,
.lesson-guided-practice__intro,
.lesson-guided-practice__fallback p {
  margin: 0;
}

.lesson-guided-practice__heading > span {
  flex: 0 0 auto;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  color: var(--color-primary-700, #155e9a);
  background: white;
  font-size: 0.875rem;
}

.lesson-guided-practice__intro,
.lesson-guided-practice__status,
.lesson-guided-practice__fallback {
  color: var(--color-text-secondary, #4b5563);
}

.lesson-guided-practice__fallback {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
}

.lesson-guided-practice__fallback button {
  min-height: 2.75rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-primary-500, #3b82f6);
  border-radius: 0.625rem;
  color: var(--color-primary-700, #155e9a);
  background: white;
  font: inherit;
  font-weight: 700;
}
</style>
