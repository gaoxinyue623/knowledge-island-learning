<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { ReadingLanguage } from '@/types/reading-islands'
defineProps<{ compact?: boolean; language?: ReadingLanguage }>()
</script>
<template>
  <section
    class="reading-entry"
    :class="{ 'reading-entry--compact': compact }"
    aria-label="课外阅读入口"
  >
    <span class="reading-entry__icon" aria-hidden="true"
      ><AppIcon name="book-open" :size="30" decorative
    /></span>
    <div>
      <p>读一个新故事，发现更大的世界</p>
      <h2>
        {{
          language === 'english'
            ? '去英语阅读岛听听、说说'
            : language === 'chinese'
              ? '去语文阅读岛读读、想想'
              : '和团子一起，探索阅读群岛'
        }}
      </h2>
      <p v-if="!compact">
        原创短文、词语配对、故事排序，还有英语听读和开口表达。课本之外，自由选择。
      </p>
    </div>
    <RouterLink
      :to="{ path: '/reading-islands', query: language ? { language } : {} }"
      class="reading-link"
    >
      探索阅读群岛<AppIcon name="arrow-right" :size="18" decorative />
    </RouterLink>
  </section>
</template>
<style src="../../styles/reading-islands.css"></style>
