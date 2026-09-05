<script setup lang="ts">
import type { ActivityResult, InteractiveActivity } from '@/types'

defineProps<{ activity: InteractiveActivity }>()
const emit = defineEmits<{ complete: [result: ActivityResult] }>()

function acknowledge(activityId: string): void {
  emit('complete', { activityId, status: 'unsupported', attempts: 0 })
}
</script>

<template>
  <div class="activity-unsupported" role="status">
    <h4>这个活动正在准备中</h4>
    <p>活动类型已登记，专用操作还没有开放。你可以先探索其他活动。</p>
    <button class="activity-check-button" type="button" @click="acknowledge(activity.id)">
      知道了
    </button>
  </div>
</template>
