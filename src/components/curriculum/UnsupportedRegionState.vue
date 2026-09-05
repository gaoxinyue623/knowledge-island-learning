<script setup lang="ts">
import AppEmptyState from '@/components/common/AppEmptyState.vue'

const emit = defineEmits<{ change: [] }>()
</script>

<template>
  <AppEmptyState
    title="这个地区的课程正在准备中"
    description="当前地区还没有接入教材数据，请返回选择已开放的学习地区。"
    action-label="换一个地区"
    @action="emit('change')"
  />
</template>
