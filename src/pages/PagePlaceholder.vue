<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import DevPlaceholder from '@/components/layout/DevPlaceholder.vue'
import AppShell from '@/layouts/AppShell.vue'

const route = useRoute()
const title = computed(() => route.meta.title ?? '页面')
const metadata = computed<Record<string, string | boolean | undefined>>(() => ({
  route: route.fullPath,
  requiresOnboarding: route.meta.requiresOnboarding,
  studentOnly: route.meta.studentOnly,
  parentOnly: route.meta.parentOnly,
  hideBottomNav: route.meta.hideBottomNav,
  immersiveMode: route.meta.immersiveMode,
}))
</script>

<template>
  <AppShell :show-bottom-nav="!route.meta.hideBottomNav">
    <div class="content-container">
      <DevPlaceholder :title="title" :metadata="metadata" />
    </div>
  </AppShell>
</template>
