<script setup lang="ts">
import { ref } from 'vue'

import type { ActivityProgress, ActivityResult, InteractiveActivity } from '@/types'

type Activity = Extract<InteractiveActivity, { activityType: 'drag_match' }>
const props = withDefaults(
  defineProps<{
    activity: Activity
    progress?: ActivityProgress | null
    sourceLabel?: string
    targetLabel?: string
  }>(),
  { sourceLabel: '数量', targetLabel: '数字', progress: null },
)
const emit = defineEmits<{
  complete: [result: ActivityResult]
  attempt: [result: { correct: boolean }]
}>()

const selectedSource = ref<string | null>(null)
const placements = ref<Record<string, string>>({})
const attempts = ref(props.progress?.attempts ?? 0)
const feedback = ref('')
const completed = ref(props.progress?.status === 'completed')

function selectSource(sourceId: string): void {
  if (completed.value) return
  selectedSource.value = sourceId
  feedback.value = '现在选择它要去的地方。'
}

function selectTarget(targetId: string): void {
  if (completed.value) return
  if (!selectedSource.value) {
    feedback.value = '先选左边的一张卡片。'
    return
  }
  attempts.value += 1
  const sourceId = selectedSource.value
  const match = props.activity.config.matches.find((item) => item.sourceId === sourceId)
  if (match?.targetId !== targetId) {
    feedback.value = '这两张还不是一对，再找找它的伙伴吧。'
    emit('attempt', { correct: false })
    return
  }
  emit('attempt', { correct: true })
  placements.value = { ...placements.value, [sourceId]: targetId }
  selectedSource.value = null
  feedback.value = '配对成功，继续找下一个伙伴。'
  if (Object.keys(placements.value).length === props.activity.config.matches.length) {
    completed.value = true
    feedback.value = '全部配对成功！'
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
      <section :aria-labelledby="activity.id + '-sources'">
        <h4 :id="activity.id + '-sources'">{{ sourceLabel }}</h4>
        <div class="activity-choice-grid">
          <button
            v-for="source in activity.config.sources"
            :key="source.id"
            class="activity-choice"
            :class="{
              'activity-choice--selected': selectedSource === source.id,
              'activity-choice--done': placements[source.id],
            }"
            type="button"
            :aria-pressed="selectedSource === source.id"
            :disabled="Boolean(placements[source.id]) || completed"
            @click="selectSource(source.id)"
          >
            {{ source.label || source.id }}
          </button>
        </div>
      </section>
      <section :aria-labelledby="activity.id + '-targets'">
        <h4 :id="activity.id + '-targets'">{{ targetLabel }}</h4>
        <div class="activity-choice-grid">
          <button
            v-for="target in activity.config.targets"
            :key="target.id"
            class="activity-choice activity-choice--target"
            :class="{ 'activity-choice--done': Object.values(placements).includes(target.id) }"
            type="button"
            :disabled="Object.values(placements).includes(target.id) || completed"
            @click="selectTarget(target.id)"
          >
            {{ target.label || target.id }}
          </button>
        </div>
      </section>
    </div>
    <p class="activity-feedback" role="status">
      {{ feedback || '先点左边的卡片，再点右边对应的伙伴。' }}
    </p>
  </div>
</template>
