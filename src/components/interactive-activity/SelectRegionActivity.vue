<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ActivityProgress, ActivityResult, InteractiveActivity } from '@/types'

type Activity = Extract<InteractiveActivity, { activityType: 'select_region' }>
const props = defineProps<{ activity: Activity; progress?: ActivityProgress | null }>()
const emit = defineEmits<{ complete: [result: ActivityResult] }>()

const selected = ref<Set<string>>(new Set())
const attempts = ref(props.progress?.attempts ?? 0)
const feedback = ref('')
const completed = ref(props.progress?.status === 'completed')
const selectedLabel = computed(() =>
  selected.value.size ? `已经选了 ${selected.value.size} 个区域` : '还没有选择区域',
)

function toggle(regionId: string): void {
  if (completed.value) return
  const next = new Set(selected.value)
  if (next.has(regionId)) next.delete(regionId)
  else next.add(regionId)
  selected.value = next
}

function check(): void {
  if (completed.value) return
  attempts.value += 1
  const expected = new Set(props.activity.config.targetRegionIds)
  const isCorrect =
    expected.size === selected.value.size && [...expected].every((id) => selected.value.has(id))
  if (isCorrect) {
    completed.value = true
    feedback.value = '找全了！'
    emit('complete', {
      activityId: props.activity.id,
      status: 'completed',
      attempts: attempts.value,
      completedAt: new Date().toISOString(),
    })
  } else {
    feedback.value = '再看看，还有没有别的区域也像它。'
  }
}
</script>

<template>
  <div class="activity-task">
    <div class="region-board" :aria-label="`活动素材 ${activity.config.assetKey}`">
      <svg viewBox="0 0 100 100" role="img" aria-label="形状观察板">
        <rect x="2" y="2" width="96" height="96" rx="8" class="region-board__surface" />
        <rect
          v-for="region in activity.config.regions"
          :key="region.id"
          :x="region.x * 100"
          :y="region.y * 100"
          :width="region.width * 100"
          :height="region.height * 100"
          class="region-board__shape"
        />
      </svg>
      <button
        v-for="region in activity.config.regions"
        :key="`button-${region.id}`"
        class="region-board__button"
        :class="{ 'region-board__button--selected': selected.has(region.id) }"
        :style="{
          left: `${region.x * 100}%`,
          top: `${region.y * 100}%`,
          width: `${region.width * 100}%`,
          height: `${region.height * 100}%`,
        }"
        type="button"
        :aria-label="region.label || `区域 ${region.id}`"
        :aria-pressed="selected.has(region.id)"
        :disabled="completed"
        @click="toggle(region.id)"
      >
        <span>{{ region.label || '选择' }}</span>
      </button>
    </div>
    <div class="activity-task__actions">
      <span>{{ selectedLabel }}</span>
      <button class="activity-check-button" type="button" :disabled="completed" @click="check">
        检查选择
      </button>
    </div>
    <p class="activity-feedback" role="status">
      {{ feedback || '点击图中的区域，再检查你的发现。' }}
    </p>
  </div>
</template>
