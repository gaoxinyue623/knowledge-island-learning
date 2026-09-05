<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ActivityProgress, ActivityResult, InteractiveActivity } from '@/types'

type Activity = Extract<InteractiveActivity, { activityType: 'number_line' }>
const props = defineProps<{ activity: Activity; progress?: ActivityProgress | null }>()
const emit = defineEmits<{ complete: [result: ActivityResult] }>()

const attempts = ref(props.progress?.attempts ?? 0)
const feedback = ref('')
const completed = ref(props.progress?.status === 'completed')
const points = computed(() =>
  Array.from(
    { length: props.activity.config.max - props.activity.config.min + 1 },
    (_, index) => props.activity.config.min + index,
  ),
)
const operationText = computed(() =>
  props.activity.config.operations
    .map(
      (operation) => `${operation.direction === 'forward' ? '向前' : '向后'} ${operation.steps} 步`,
    )
    .join('，'),
)

function choose(point: number): void {
  if (completed.value) return
  attempts.value += 1
  if (point === props.activity.config.target) {
    completed.value = true
    feedback.value = '走到了正确的位置！'
    emit('complete', {
      activityId: props.activity.id,
      status: 'completed',
      attempts: attempts.value,
      completedAt: new Date().toISOString(),
    })
  } else {
    feedback.value = '再沿着数轴走一走。'
  }
}
</script>

<template>
  <div class="activity-task">
    <p class="activity-task__prompt">
      从 {{ activity.config.start }} 出发，{{ operationText }}，最后会到哪里？
    </p>
    <div class="number-line" role="group" aria-label="数轴上的位置">
      <div class="number-line__track" aria-hidden="true"></div>
      <button
        v-for="point in points"
        :key="point"
        class="number-line__point"
        :class="{ 'number-line__point--start': point === activity.config.start }"
        type="button"
        :aria-label="`选择 ${point}`"
        :disabled="completed"
        @click="choose(point)"
      >
        <span>{{ point }}</span>
      </button>
    </div>
    <p class="activity-feedback" role="status">{{ feedback || '点击你认为会到达的位置。' }}</p>
  </div>
</template>
