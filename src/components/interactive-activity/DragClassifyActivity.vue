<script setup lang="ts">
import { ref } from 'vue'

import type { ActivityProgress, ActivityResult, InteractiveActivity } from '@/types'

type Activity = Extract<InteractiveActivity, { activityType: 'drag_classify' }>
const props = defineProps<{ activity: Activity; progress?: ActivityProgress | null }>()
const emit = defineEmits<{ complete: [result: ActivityResult] }>()

const selectedItem = ref<string | null>(null)
const placements = ref<Record<string, string>>({})
const attempts = ref(props.progress?.attempts ?? 0)
const feedback = ref('')
const completed = ref(props.progress?.status === 'completed')

function selectItem(itemId: string): void {
  if (completed.value) return
  selectedItem.value = itemId
  feedback.value = '现在选择它的家。'
}

function selectGroup(groupId: string): void {
  if (completed.value) return
  if (!selectedItem.value) {
    feedback.value = '先选一个要分类的物品。'
    return
  }
  attempts.value += 1
  const answer = props.activity.config.answers.find((item) => item.itemId === selectedItem.value)
  if (answer?.groupId !== groupId) {
    feedback.value = '再看看这个家适不适合它。'
    return
  }
  placements.value = { ...placements.value, [selectedItem.value]: groupId }
  selectedItem.value = null
  feedback.value = '放对了，继续分类。'
  if (Object.keys(placements.value).length === props.activity.config.answers.length) {
    completed.value = true
    feedback.value = '全部分类完成！'
    emit('complete', {
      activityId: props.activity.id,
      status: 'completed',
      attempts: attempts.value,
      completedAt: new Date().toISOString(),
    })
  }
}
</script>

<template>
  <div class="activity-task">
    <div class="activity-task__columns">
      <section aria-labelledby="drag-classify-items">
        <h4 id="drag-classify-items">要分类的内容</h4>
        <div class="activity-choice-grid">
          <button
            v-for="item in activity.config.items"
            :key="item.id"
            class="activity-choice"
            :class="{
              'activity-choice--selected': selectedItem === item.id,
              'activity-choice--done': placements[item.id],
            }"
            type="button"
            :aria-pressed="selectedItem === item.id"
            :disabled="Boolean(placements[item.id]) || completed"
            @pointerdown.prevent="selectItem(item.id)"
            @keydown.enter.prevent="selectItem(item.id)"
            @keydown.space.prevent="selectItem(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </section>
      <section aria-labelledby="drag-classify-groups">
        <h4 id="drag-classify-groups">它的家</h4>
        <div class="activity-choice-grid">
          <button
            v-for="group in activity.config.groups"
            :key="group.id"
            class="activity-choice activity-choice--target"
            type="button"
            :disabled="completed"
            @pointerdown.prevent="selectGroup(group.id)"
            @keydown.enter.prevent="selectGroup(group.id)"
            @keydown.space.prevent="selectGroup(group.id)"
          >
            {{ group.label }}
          </button>
        </div>
      </section>
    </div>
    <p class="activity-feedback" role="status">{{ feedback || '点击内容，再点击它要去的家。' }}</p>
  </div>
</template>
