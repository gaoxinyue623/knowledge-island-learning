<script setup lang="ts">
import AppEmptyState from '@/components/common/AppEmptyState.vue'

const emit = defineEmits<{ change: [] }>()
</script>

<template>
  <AppEmptyState
    title="这个地区的课程正在准备中"
    description="你可以先选择其他示例地区。我们不会根据地区名称猜测教材版本。"
    action-label="换一个地区"
    @action="emit('change')"
  />
</template>
