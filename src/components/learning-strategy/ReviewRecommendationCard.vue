<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { ReviewRecommendation } from '@/types'

interface Props {
  recommendation: ReviewRecommendation
}

const props = defineProps<Props>()
</script>

<template>
  <article class="review-recommendation-card">
    <div class="review-recommendation-card__icon" aria-hidden="true">
      <AppIcon
        :name="props.recommendation.type === 'REINFORCE' ? 'refresh-cw' : 'circle-help'"
        :size="18"
        decorative
      />
    </div>
    <div class="review-recommendation-card__body">
      <div class="review-recommendation-card__heading">
        <strong>{{ props.recommendation.reason.title }}</strong>
        <span>优先级 {{ props.recommendation.priority }}</span>
      </div>
      <p>{{ props.recommendation.reason.description }}</p>
      <small>{{ props.recommendation.knowledgePointId }}</small>
    </div>
  </article>
</template>
