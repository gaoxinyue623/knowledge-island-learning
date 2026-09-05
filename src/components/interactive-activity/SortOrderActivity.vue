<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ActivityProgress, ActivityResult, InteractiveActivity } from '@/types'

type Activity = Extract<InteractiveActivity, { activityType: 'sort_order' }>
const props = defineProps<{ activity: Activity; progress?: ActivityProgress | null }>()
const emit = defineEmits<{
  complete: [result: ActivityResult]
  attempt: [result: { correct: boolean }]
}>()

const order = ref<string[]>([])
const attempts = ref(props.progress?.attempts ?? 0)
const feedback = ref('')
const completed = ref(props.progress?.status === 'completed')
const remaining = computed(() =>
  props.activity.config.items.filter((item) => !order.value.includes(item.id)),
)

function choose(itemId: string): void {
  if (completed.value || order.value.includes(itemId)) return
  order.value = [...order.value, itemId]
  feedback.value = ''
}

function remove(itemId: string): void {
  if (completed.value) return
  order.value = order.value.filter((id) => id !== itemId)
}

function labelFor(itemId: string): string {
  return props.activity.config.items.find((item) => item.id === itemId)?.label ?? itemId
}

function check(): void {
  if (completed.value || order.value.length !== props.activity.config.correctOrder.length) {
    feedback.value = '先把每张卡片都排进队伍。'
    return
  }
  attempts.value += 1
  if (
    order.value.every(
      (itemId, index) => labelFor(itemId) === labelFor(props.activity.config.correctOrder[index]!),
    )
  ) {
    completed.value = true
    feedback.value = '顺序正确，小火车出发！'
    emit('attempt', { correct: true })
    emit('complete', {
      activityId: props.activity.id,
      status: 'completed',
      attempts: attempts.value,
      completedAt: new Date().toISOString(),
    })
  } else {
    feedback.value = '再排一次，看看谁应该走在前面。'
    emit('attempt', { correct: false })
  }
}
</script>

<template>
  <div class="activity-task">
    <div class="activity-order" aria-label="已经排好的顺序">
      <button
        v-for="(itemId, index) in order"
        :key="itemId"
        class="activity-order__item"
        type="button"
        :aria-label="`第${index + 1}个，${labelFor(itemId)}，点击移回待选区`"
        :disabled="completed"
        @click="remove(itemId)"
      >
        {{ labelFor(itemId) }}
      </button>
      <span v-if="!order.length" class="activity-order__empty">点击下面的卡片开始排队</span>
    </div>
    <div class="activity-choice-grid" aria-label="待排序卡片">
      <button
        v-for="item in remaining"
        :key="item.id"
        class="activity-choice"
        type="button"
        :disabled="completed"
        @click="choose(item.id)"
      >
        {{ item.label }}
      </button>
    </div>
    <button class="activity-check-button" type="button" :disabled="completed" @click="check">
      检查顺序
    </button>
    <p class="activity-feedback" role="status">{{ feedback || '按提示排好顺序，再检查一次。' }}</p>
  </div>
</template>
