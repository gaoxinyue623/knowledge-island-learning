<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

import { getActivityRendererDefinition } from '@/services/interactive-activity'
import { useInteractiveActivityStore } from '@/stores/interactiveActivityStore'
import type { ActivityResult, Id, InteractiveActivity } from '@/types'

import UnsupportedActivity from './UnsupportedActivity.vue'

const props = withDefaults(
  defineProps<{
    activity: InteractiveActivity
    profileId?: Id
  }>(),
  { profileId: 'local-profile' },
)
const emit = defineEmits<{ result: [result: ActivityResult] }>()
const activityStore = useInteractiveActivityStore()

const definition = computed(() => getActivityRendererDefinition(props.activity.activityType))
const renderer = computed(() => definition.value.component ?? UnsupportedActivity)

async function loadActivity(): Promise<void> {
  await activityStore.loadActivity(props.activity.id, props.profileId, 'golden')
  activityStore.start()
}

function handleResult(result: ActivityResult): void {
  activityStore.complete(result)
  emit('result', result)
}

onMounted(() => void loadActivity())
watch(
  () => [props.activity.id, props.profileId],
  () => void loadActivity(),
)
</script>

<template>
  <article class="interactive-activity" :aria-labelledby="`${activity.id}-title`">
    <header class="interactive-activity__header">
      <div>
        <p class="curriculum-eyebrow">{{ definition.label }} · {{ activity.difficulty }}</p>
        <h3 :id="`${activity.id}-title`">{{ activity.title }}</h3>
        <p>{{ activity.instruction }}</p>
      </div>
      <span v-if="activityStore.isCompleted" class="interactive-activity__status">已完成</span>
      <span v-else class="interactive-activity__status interactive-activity__status--sample"
        >开发样本</span
      >
    </header>
    <p v-if="activityStore.warning" class="interactive-activity__notice" role="status">
      {{ activityStore.warning }}
    </p>
    <component
      :is="renderer"
      :activity="activity"
      :progress="activityStore.progress"
      @complete="handleResult"
      @result="handleResult"
    />
  </article>
</template>
