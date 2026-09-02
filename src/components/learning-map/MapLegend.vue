<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { IconName, LearningNodeStatus } from '@/types'

const legend: Array<{ status: LearningNodeStatus; label: string; icon: IconName }> = [
  { status: 'locked', label: '未解锁', icon: 'lock' },
  { status: 'available', label: '可以开始', icon: 'sparkles' },
  { status: 'learning', label: '学习中', icon: 'lightbulb' },
  { status: 'completed', label: '已完成', icon: 'check' },
]
</script>

<template>
  <div class="map-legend" aria-label="地图状态说明">
    <span v-for="item in legend" :key="item.status" class="map-legend__item">
      <span class="map-legend__icon" :class="`map-legend__icon--${item.status}`">
        <AppIcon :name="item.icon" :size="14" decorative />
      </span>
      {{ item.label }}
    </span>
  </div>
</template>
