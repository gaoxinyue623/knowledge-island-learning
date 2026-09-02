<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { ContentBlock } from '@/types'

interface Props {
  blocks: ContentBlock[]
}

const props = defineProps<Props>()
</script>

<template>
  <div class="question-content-renderer">
    <template v-for="(block, index) in props.blocks" :key="`${block.type}-${index}`">
      <p v-if="block.type === 'TEXT' || block.type === 'RICH_TEXT'" class="question-content__text">
        {{ block.text || '这段内容正在准备中。' }}
      </p>
      <p v-else-if="block.type === 'FORMULA'" class="question-content__formula">
        <code>{{ block.text || '公式内容正在准备中。' }}</code>
      </p>
      <div
        v-else
        class="question-content__media-fallback"
        role="img"
        :aria-label="block.altText || '题目媒体内容暂时无法显示'"
      >
        <AppIcon name="book-open" :size="20" decorative />
        <span>{{ block.altText || '题目媒体内容暂时无法显示。' }}</span>
      </div>
    </template>
    <p v-if="!props.blocks.length" class="question-content__empty">题干内容正在准备中。</p>
  </div>
</template>
