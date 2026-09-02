<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

interface Props {
  label: string
  value: string
  icon: 'map-pin' | 'book-open' | 'library'
}

const props = defineProps<Props>()
</script>

<template>
  <div class="curriculum-profile-item">
    <AppIcon :name="props.icon" :size="18" decorative />
    <span
      ><small>{{ props.label }}</small
      ><strong>{{ props.value }}</strong></span
    >
  </div>
</template>
