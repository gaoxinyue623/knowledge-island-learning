<script setup lang="ts">
import AppProgress from '@/components/common/AppProgress.vue'

interface Props {
  completed: number
  total: number
}

const props = defineProps<Props>()
</script>

<template>
  <div class="learning-progress">
    <AppProgress
      :value="props.total ? (props.completed / props.total) * 100 : 0"
      label="地图完成度"
      show-value
    />
    <p class="learning-progress__count">{{ props.completed }} / {{ props.total }} 个知识点已完成</p>
  </div>
</template>
