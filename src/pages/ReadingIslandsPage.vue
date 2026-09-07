<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import {
  filterReadingStories,
  readingDiagnostics,
  readingLength,
  readingStories,
} from '@/data/reading-islands'
import { readingLevels, type ReadingLanguage, type ReadingLevel } from '@/types/reading-islands'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useStudentStore, LOCAL_STUDENT_ID } from '@/stores/studentStore'
import { createStoryPractice } from '@/services/reading-islands/readingStoryAdapter'
import {
  browserQuestStorage,
  readQuestProgress,
} from '@/services/content-expansion/questProgressStorage'
import '@/styles/reading-islands.css'

const route = useRoute(),
  router = useRouter()
const curriculum = useCurriculumStore()
const student = useStudentStore()
const profileId = computed(
  () => curriculum.curriculumProfile?.studentId ?? student.profile?.id ?? LOCAL_STUDENT_ID,
)
const progress = computed(() =>
  Object.fromEntries(
    readingStories.map((story) => {
      const quest = createStoryPractice(story)
      const saved = readQuestProgress(browserQuestStorage(), profileId.value, quest)
      return [
        story.id,
        {
          count: saved.data.completedStageIds.length,
          total: quest.stages.length,
          warning: saved.warning,
        },
      ]
    }),
  ),
)
const language = computed<ReadingLanguage | 'all'>({
  get: () =>
    route.query.language === 'english' || route.query.language === 'chinese'
      ? route.query.language
      : 'all',
  set: (value) => updateQuery('language', value),
})
const level = computed<ReadingLevel | 'all'>({
  get: () =>
    route.query.level === 'starter' || route.query.level === 'growing' ? route.query.level : 'all',
  set: (value) => updateQuery('level', value),
})
const search = computed({
  get: () => (typeof route.query.q === 'string' ? route.query.q.slice(0, 100) : ''),
  set: (value: string) => updateQuery('q', value.slice(0, 100)),
})
function updateQuery(key: string, value: string) {
  void router.replace({
    query: { ...route.query, [key]: value === 'all' || !value ? undefined : value },
  })
}
const stories = computed(() =>
  filterReadingStories({ language: language.value, level: level.value, search: search.value }),
)
const languageOptions = [
  { value: 'all', label: '全部故事' },
  { value: 'chinese', label: '语文阅读岛' },
  { value: 'english', label: '英语阅读岛' },
]
</script>
<template>
  <AppShell context="阅读群岛 · 课本之外的发现" :show-bottom-nav="true">
    <div class="reading-islands-page content-container">
      <nav class="reading-breadcrumb" aria-label="阅读导航">
        <RouterLink to="/home"
          ><AppIcon name="arrow-left" :size="18" decorative />返回首页</RouterLink
        ><RouterLink to="/thinking-islands">也去思维群岛看看</RouterLink>
      </nav>
      <header class="reading-hero">
        <div>
          <p class="reading-eyebrow">READ · WONDER · SHARE</p>
          <h1>翻开故事，<br />去更远的岛屿</h1>
          <p>今天想读中文故事，还是听一小段英语？<br />读一读，找线索，再把你的发现说出来。</p>
          <div class="reading-hero__tags">
            <span>{{ readingStories.length }} 篇原创短文</span><span>两档阅读难度</span
            ><span>无需选择教材</span>
          </div>
        </div>
        <div class="reading-hero__art" aria-hidden="true">
          <span class="reading-hero__spark reading-hero__spark--one">Aa</span
          ><span class="reading-hero__spark reading-hero__spark--two">读</span
          ><KnowledgeDangoPlaceholder state="happy" size="lg" /><span class="reading-hero__book"
            ><AppIcon name="book-open" :size="90" decorative
          /></span>
        </div>
      </header>
      <section class="reading-library" aria-labelledby="reading-library-title">
        <div class="reading-section-heading">
          <div>
            <p class="reading-eyebrow">每一个故事，都有新的发现</p>
            <h2 id="reading-library-title">选一个故事出发</h2>
          </div>
        </div>
        <fieldset class="reading-language-filter">
          <legend class="sr-only">阅读语言</legend>
          <label v-for="option in languageOptions" :key="option.value"
            ><input
              v-model="language"
              type="radio"
              name="reading-language"
              :value="option.value"
            /><span>{{ option.label }}</span></label
          >
        </fieldset>
        <div class="reading-filter-row">
          <label
            >选择难度<select v-model="level">
              <option value="all">全部难度</option>
              <option v-for="(value, key) in readingLevels" :key="key" :value="key">
                {{ value.label }}
              </option>
            </select></label
          ><label class="reading-search"
            >寻找故事<input
              v-model="search"
              type="search"
              maxlength="100"
              placeholder="搜标题、主题或单词，如朋友、bag"
          /></label>
        </div>
        <p class="reading-small">
          主要面向一、二年级，可按阅读经验自由选择，不限制年级、地区或教材。英语起步短文也可以和家人一起听读。
        </p>
        <p class="reading-library__count" role="status">
          找到 {{ stories.length }} 个故事{{
            level !== 'all' ? ` · ${readingLevels[level].description}` : ''
          }}
        </p>
        <div v-if="stories.length" class="reading-story-grid">
          <article
            v-for="story in stories"
            :key="story.id"
            class="reading-story-card"
            :data-language="story.language"
          >
            <div class="reading-story-card__cover" aria-hidden="true">
              <span>{{ story.language === 'english' ? 'Aa' : '读' }}</span
              ><AppIcon
                :name="story.level === 'starter' ? 'book-open' : 'sparkles'"
                :size="62"
                decorative
              /><small>{{ story.theme }}</small>
            </div>
            <div class="reading-story-card__body">
              <p class="reading-eyebrow">
                {{ story.language === 'english' ? '英语' : '语文' }} ·
                {{ readingLevels[story.level].label }}
              </p>
              <h3 :lang="story.language === 'english' ? 'en' : 'zh-CN'">《{{ story.title }}》</h3>
              <p v-if="story.subtitle" class="reading-story-card__subtitle">{{ story.subtitle }}</p>
              <p>{{ story.description }}</p>
              <div class="reading-story-card__meta">
                <span>{{ readingLength(story) }}</span
                ><span>{{ story.language === 'english' ? '7' : '6' }} 关练习</span
                ><span v-if="story.language === 'english'">可听读</span>
              </div>
              <p v-if="progress[story.id]?.count" class="reading-small">
                已通过 {{ progress[story.id]?.count }} / {{ progress[story.id]?.total }} 关 · 已保存
              </p>
              <p v-else-if="progress[story.id]?.warning" class="reading-small">
                暂时无法读取练习进度，仍可打开故事。
              </p>
              <RouterLink
                :to="{ path: '/reading-islands/' + story.id, query: route.query }"
                class="reading-link"
                :aria-label="`${progress[story.id]?.count ? '继续阅读' : '开始阅读'}《${story.title}》`"
                >{{ progress[story.id]?.count ? '接着读，接着练' : '翻开故事'
                }}<AppIcon name="arrow-right" :size="18" decorative
              /></RouterLink>
            </div>
          </article>
        </div>
        <section v-else class="reading-empty">
          <h3>还没找到这个故事</h3>
          <p>换个词试试，或者看看全部故事。</p>
          <button class="reading-link" @click="router.replace('/reading-islands')">
            查看全部故事
          </button>
        </section>
        <p v-if="readingDiagnostics.length" class="reading-small" role="status">
          部分故事暂时无法载入，已保留可以阅读的内容。
        </p>
      </section>
      <p class="reading-small reading-library-note">
        这些是原创课外短文与练习，不是教材篇目或标准化测评。闯关进度按学习档案保存在这台设备，不改变教材掌握度；更换设备不会同步。
      </p>
    </div>
  </AppShell>
</template>
