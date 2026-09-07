<script setup lang="ts">
import { watchEffect } from 'vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { RouterView } from 'vue-router'
const settings = usePreferencesStore()
watchEffect(() => {
  document.documentElement.classList.toggle('reduce-motion', settings.preferences.reducedMotion)
})
</script>

<template>
  <RouterView />
</template>
