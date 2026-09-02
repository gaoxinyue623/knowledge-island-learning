<script setup lang="ts">
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'

interface Props {
  label?: string
}

withDefaults(defineProps<Props>(), {
  label: '正在准备知识岛',
})
</script>

<template>
  <div class="app-loading" role="status" aria-live="polite">
    <KnowledgeDangoPlaceholder state="idle" size="sm" />
    <span>{{ label }}</span>
  </div>
</template>
