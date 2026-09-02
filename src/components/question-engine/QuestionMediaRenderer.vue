<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { QuestionMediaViewModel } from '@/types'

interface Props {
  media: QuestionMediaViewModel[]
}

const props = defineProps<Props>()
</script>

<template>
  <div v-if="props.media.length" class="question-media-list" aria-label="题目媒体">
    <figure
      v-for="mediaAsset in props.media"
      :key="`${mediaAsset.mediaAssetId}-${mediaAsset.order}`"
      class="question-media"
    >
      <img
        v-if="
          mediaAsset.isAvailable &&
          (mediaAsset.mediaType === 'IMAGE' || mediaAsset.mediaType === 'SVG')
        "
        class="question-media__image"
        :src="mediaAsset.url"
        :alt="mediaAsset.altText || '题目图片'"
      />
      <audio
        v-else-if="mediaAsset.isAvailable && mediaAsset.mediaType === 'AUDIO'"
        class="question-media__audio"
        :src="mediaAsset.url"
        controls
      >
        当前浏览器不支持音频播放。
      </audio>
      <video
        v-else-if="mediaAsset.isAvailable && mediaAsset.mediaType === 'VIDEO'"
        class="question-media__video"
        :src="mediaAsset.url"
        :aria-label="mediaAsset.altText || '题目视频'"
        controls
      />
      <div v-else class="question-media__fallback" role="status">
        <AppIcon name="info" :size="18" decorative />
        <span>这项媒体内容暂时无法显示，可以继续阅读题目。</span>
      </div>
      <figcaption v-if="mediaAsset.transcript" class="question-media__transcript">
        {{ mediaAsset.transcript }}
      </figcaption>
    </figure>
  </div>
</template>
