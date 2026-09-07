<script setup lang="ts">
import type { ThinkingToken } from '@/types/thinking'
defineProps<{ token: ThinkingToken }>()
const colors = { mint: '#66a786', gold: '#e5b34c', blue: '#6594bd', coral: '#d27d71' }
const rotation = { up: 0, right: 90, down: 180, left: 270 }
</script>
<template>
  <span class="thinking-token">
    <svg
      v-if="token.shape"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      :style="{ color: colors[token.color ?? 'mint'] }"
    >
      <circle v-if="token.shape === 'circle'" cx="20" cy="20" r="14" />
      <rect v-else-if="token.shape === 'square'" x="6" y="6" width="28" height="28" rx="4" />
      <path v-else-if="token.shape === 'triangle'" d="M20 4L37 35H3Z" />
      <path v-else-if="token.shape === 'diamond'" d="M20 3L36 20L20 37L4 20Z" />
      <path
        v-else
        d="M20 3L35 20H26V36H14V20H5Z"
        :transform="`rotate(${rotation[token.shape]} 20 20)`"
      />
    </svg>
    <span>{{ token.label }}</span>
  </span>
</template>
