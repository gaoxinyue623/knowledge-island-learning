<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { LearningRecommendation } from '@/types'

interface Props {
  recommendation: LearningRecommendation
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), { compact: false })

const emit = defineEmits<{
  action: []
}>()

const title = computed(() => {
  switch (props.recommendation.type) {
    case 'CONTINUE_CURRENT':
      return '继续学习'
    case 'REINFORCE':
      return '建议巩固'
    case 'GATHER_MORE_EVIDENCE':
      return '再收集一些证据'
    case 'PROCEED_TO_NEXT':
      return '下一步'
    case 'NO_RECOMMENDATION':
      return '暂时没有优先推荐'
    default:
      return '下一步学习'
  }
})

const iconName = computed(() => {
  switch (props.recommendation.type) {
    case 'REINFORCE':
      return 'refresh-cw' as const
    case 'GATHER_MORE_EVIDENCE':
      return 'circle-help' as const
    case 'PROCEED_TO_NEXT':
      return 'route' as const
    case 'NO_RECOMMENDATION':
      return 'info' as const
    default:
      return 'lightbulb' as const
  }
})

const description = computed(
  () =>
    props.recommendation.nextKnowledgePoint?.reason.description ??
    props.recommendation.reason?.description,
)

const actionLabel = computed(() => {
  switch (props.recommendation.type) {
    case 'REINFORCE':
      return '去巩固'
    case 'GATHER_MORE_EVIDENCE':
      return '去练习'
    case 'PROCEED_TO_NEXT':
      return '进入下一步'
    case 'CONTINUE_CURRENT':
      return '继续学习'
    default:
      return undefined
  }
})
</script>

<template>
  <section
    class="learning-recommendation-card"
    :class="{ 'learning-recommendation-card--compact': props.compact }"
    aria-labelledby="learning-recommendation-title"
  >
    <div class="learning-recommendation-card__heading">
      <span class="learning-recommendation-card__icon" aria-hidden="true">
        <AppIcon :name="iconName" :size="22" decorative />
      </span>
      <div>
        <p class="curriculum-eyebrow">下一步学习</p>
        <h2 id="learning-recommendation-title">{{ title }}</h2>
      </div>
    </div>
    <div
      v-if="props.recommendation.nextKnowledgePoint"
      class="learning-recommendation-card__target"
    >
      <strong>{{ props.recommendation.nextKnowledgePoint.title || '当前知识点' }}</strong>
      <span>{{ description }}</span>
    </div>
    <p v-else class="learning-recommendation-card__description">{{ description }}</p>
    <div
      v-if="props.recommendation.warning"
      class="learning-recommendation-card__notice"
      role="status"
    >
      <AppIcon name="info" :size="16" decorative />
      <span>{{ props.recommendation.warning }}</span>
    </div>
    <AppButton
      v-if="actionLabel"
      class="learning-recommendation-card__action"
      :size="props.compact ? 'md' : 'lg'"
      icon-right="arrow-right"
      :aria-label="`${actionLabel}${props.recommendation.nextKnowledgePoint?.title ? `：${props.recommendation.nextKnowledgePoint.title}` : ''}`"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </AppButton>
  </section>
</template>
