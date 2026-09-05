<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import AppShell from '@/layouts/AppShell.vue'
import OnboardingProgress from '@/components/curriculum/OnboardingProgress.vue'

interface Props {
  title: string
  description: string
  step?: number
  backTo?: string
  backLabel?: string
  context?: string
}

const props = withDefaults(defineProps<Props>(), {
  step: 0,
  backTo: undefined,
  backLabel: '返回上一步',
  context: '课程配置',
})
</script>

<template>
  <AppShell :show-bottom-nav="false" :context="props.context">
    <div class="curriculum-page content-container">
      <OnboardingProgress v-if="props.step" :step="props.step" />
      <RouterLink v-if="props.backTo" class="curriculum-back-link" :to="props.backTo">
        <AppIcon name="arrow-left" :size="18" decorative />
        {{ props.backLabel }}
      </RouterLink>
      <header class="curriculum-page__header">
        <span class="curriculum-page__guide" aria-hidden="true">
          <KnowledgeDangoPlaceholder size="sm" state="encourage" />
        </span>
        <p class="curriculum-eyebrow">准备好，开启知识岛之旅</p>
        <h1>{{ props.title }}</h1>
        <p>{{ props.description }}</p>
      </header>
      <slot />
    </div>
  </AppShell>
</template>
