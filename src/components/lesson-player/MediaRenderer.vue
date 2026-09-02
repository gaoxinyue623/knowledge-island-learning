<script setup lang="ts">
import { ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import type { MediaViewModel } from '@/types'

interface Props {
  media: MediaViewModel
}

const props = defineProps<Props>()
const failed = ref(false)

function markFailed() {
  failed.value = true
}

function isImage() {
  return props.media.mediaType === 'IMAGE' || props.media.mediaType === 'SVG'
}

function isVideo() {
  return props.media.mediaType === 'VIDEO' || props.media.mediaType === 'ANIMATION'
}
</script>

<template>
  <figure class="lesson-media" :class="{ 'lesson-media--failed': failed || !props.media.url }">
    <template v-if="!failed && props.media.isAvailable && props.media.url && isImage()">
      <img
        class="lesson-media__image"
        :src="props.media.url"
        :alt="props.media.altText || '课程插图'"
        @error="markFailed"
      />
    </template>
    <template v-else-if="!failed && props.media.isAvailable && props.media.url && isVideo()">
      <video
        class="lesson-media__video"
        :src="props.media.url"
        :aria-label="props.media.altText || '课程动画'"
        controls
        playsinline
        @error="markFailed"
      />
    </template>
    <template
      v-else-if="
        !failed && props.media.isAvailable && props.media.url && props.media.mediaType === 'AUDIO'
      "
    >
      <audio
        class="lesson-media__audio"
        :src="props.media.url"
        :aria-label="props.media.altText || '课程音频'"
        controls
        @error="markFailed"
      />
    </template>
    <div v-else class="lesson-media__fallback" role="status">
      <AppIcon name="info" :size="20" decorative />
      <span>{{ props.media.fallbackText }}</span>
    </div>
    <figcaption v-if="props.media.transcript" class="lesson-media__transcript">
      {{ props.media.transcript }}
    </figcaption>
  </figure>
</template>
