<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

interface Props {
  title?: string
  description?: string
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '这一步暂时打不开',
  description: '请重新试一次，或者先回到上一页。',
  actionLabel: '重新试试',
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="app-error-state" role="alert">
    <AppIcon name="refresh-cw" :size="40" decorative />
    <h2 class="app-error-state__title">{{ props.title }}</h2>
    <p class="app-error-state__description">{{ props.description }}</p>
    <AppButton variant="secondary" @click="emit('retry')">{{ props.actionLabel }}</AppButton>
  </section>
</template>
