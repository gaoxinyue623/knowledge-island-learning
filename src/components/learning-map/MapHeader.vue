<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { LearningMapViewModel } from '@/types'

interface Props {
  viewModel: LearningMapViewModel
  showUnverified?: boolean
}

const props = withDefaults(defineProps<Props>(), { showUnverified: true })

const subjectLabels = { CHINESE: '语文世界', MATH: '数学世界', ENGLISH: '英语世界' } as const
const semesterLabels = { 1: '上册', 2: '下册' } as const
</script>

<template>
  <header class="learning-map-header">
    <div class="learning-map-header__toolbar">
      <RouterLink class="learning-map-header__back" to="/home">
        <AppIcon name="arrow-left" :size="18" decorative />
        <span>返回首页</span>
      </RouterLink>
      <RouterLink class="learning-map-header__settings" to="/curriculum-settings">
        <AppIcon name="settings" :size="18" decorative />
        <span>学习设置</span>
      </RouterLink>
    </div>
    <div class="learning-map-header__main">
      <p class="curriculum-eyebrow">{{ subjectLabels[props.viewModel.textbook.subject] }}</p>
      <h1>{{ props.viewModel.textbook.title }}</h1>
      <div class="learning-map-header__meta">
        <p>
          {{ props.viewModel.textbook.grade }}年级 ·
          {{ semesterLabels[props.viewModel.textbook.semester as 1 | 2] }}
        </p>
        <span v-if="props.viewModel.flags.isDemo" class="map-badge map-badge--sample">
          开发样本
        </span>
        <span
          v-if="props.showUnverified && props.viewModel.flags.isUnverified"
          class="map-badge map-badge--warning"
        >
          未审核数据
        </span>
      </div>
    </div>
  </header>
</template>
