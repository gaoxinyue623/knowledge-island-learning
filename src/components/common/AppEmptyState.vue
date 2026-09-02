<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

interface Props {
  title: string
  description: string
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  actionLabel: undefined,
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <section class="app-empty-state" role="status">
    <div class="app-empty-state__icon" aria-hidden="true">
      <AppIcon name="route" :size="40" decorative />
    </div>
    <h2 class="app-empty-state__title">{{ title }}</h2>
    <p class="app-empty-state__description">{{ description }}</p>
    <AppButton v-if="props.actionLabel" variant="secondary" @click="emit('action')">
      {{ props.actionLabel }}
    </AppButton>
  </section>
</template>
