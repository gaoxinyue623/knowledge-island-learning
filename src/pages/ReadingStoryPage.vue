<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import ReadingStoryExperience from '@/components/reading-islands/ReadingStoryExperience.vue'
import { findReadingStory, readingLength, readingStories } from '@/data/reading-islands'
import { readingLevels } from '@/types/reading-islands'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { LOCAL_STUDENT_ID, useStudentStore } from '@/stores/studentStore'
import '@/styles/reading-islands.css'

const route = useRoute(),
  preferences = usePreferencesStore(),
  curriculum = useCurriculumStore(),
  student = useStudentStore()
const profileId = computed(
  () => curriculum.curriculumProfile?.studentId ?? student.profile?.id ?? LOCAL_STUDENT_ID,
)
const story = computed(() => findReadingStory(String(route.params.storyId)))
const related = computed(() =>
  readingStories
    .filter(
      (item) =>
        item.id !== story.value?.id &&
        item.language === story.value?.language &&
        item.level === story.value?.level,
    )
    .slice(0, 2),
)
const returnQuery = computed(() =>
  Object.fromEntries(
    ['language', 'level', 'q'].flatMap((key) =>
      typeof route.query[key] === 'string' ? [[key, route.query[key]]] : [],
    ),
  ),
)
</script>
<template>
  <AppShell context="课外阅读 · 读一读，想一想">
    <div class="reading-islands-page reading-story-page content-container">
      <nav class="reading-breadcrumb" aria-label="阅读导航">
        <RouterLink :to="{ path: '/reading-islands', query: returnQuery }"
          ><AppIcon name="arrow-left" :size="18" decorative />返回阅读群岛</RouterLink
        ><RouterLink to="/home">首页</RouterLink>
      </nav>
      <template v-if="story">
        <header class="reading-story-heading">
          <p class="reading-eyebrow">
            {{ story.language === 'english' ? '英语阅读岛' : '语文阅读岛' }} ·
            {{ readingLevels[story.level].label }} · 原创课外阅读
          </p>
          <h1 :lang="story.language === 'english' ? 'en' : 'zh-CN'">《{{ story.title }}》</h1>
          <p v-if="story.subtitle" class="reading-story-heading__subtitle">{{ story.subtitle }}</p>
          <p>{{ story.description }}</p>
          <div class="reading-hero__tags">
            <span>{{ story.theme }}</span
            ><span>{{ readingLength(story) }}</span
            ><span>可以反复练习</span>
          </div>
        </header>
        <ReadingStoryExperience
          :key="story.id + ':' + profileId"
          :story="story"
          :profile-id="profileId"
          :muted="preferences.preferences.muted"
        />
        <section class="reading-related" aria-labelledby="reading-related-title">
          <h2 id="reading-related-title">还想再读一篇？</h2>
          <div>
            <RouterLink
              v-for="item in related"
              :key="item.id"
              :to="{ path: '/reading-islands/' + item.id, query: returnQuery }"
              class="reading-link reading-link--soft"
              >《{{ item.title }}》<AppIcon name="arrow-right" :size="18" decorative /></RouterLink
            ><RouterLink :to="{ path: '/reading-islands', query: returnQuery }" class="reading-link"
              >换个主题看看</RouterLink
            >
          </div>
        </section>
      </template>
      <section v-else class="reading-empty">
        <h1>这个故事暂时找不到</h1>
        <p>回到阅读群岛，重新选一个故事吧。</p>
        <RouterLink to="/reading-islands" class="reading-link">查看全部故事</RouterLink>
      </section>
    </div>
  </AppShell>
</template>
