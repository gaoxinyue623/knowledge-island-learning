<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import StudentReadAloud from '@/components/common/StudentReadAloud.vue'
import EnglishReadAloud from '@/components/lesson-player/EnglishReadAloud.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { LessonContentBlockViewModel } from '@/types'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import GradeExtensionLessonCard from '@/components/grade-extension/GradeExtensionLessonCard.vue'
import { gradeExtensionLessons, type GradeExtensionSubject } from '@/data/grade-extension/gradeExtensionLessons'
import { createGradeExtensionQuest } from '@/services/grade-extension/gradeExtensionQuest'
import { useLearningProfile } from '@/composables/useLearningProfile'

const route = useRoute()
const router = useRouter()
const { profileId } = useLearningProfile()
const preferences = usePreferencesStore()
const subject = ref<GradeExtensionSubject | 'ALL'>('ALL')
const selectedId = computed(() => typeof route.query.lesson === 'string' ? route.query.lesson : '')
const variant = computed(() => Number(route.query.variant) === 1 ? 1 : 0)
const selected = computed(() => gradeExtensionLessons.find((lesson) => lesson.id === selectedId.value) ?? null)
const lessons = computed(() => subject.value === 'ALL' ? gradeExtensionLessons : gradeExtensionLessons.filter((lesson) => lesson.subject === subject.value))
const quest = computed(() => selected.value ? createGradeExtensionQuest(selected.value.id, variant.value) : null)
const englishBlocks = computed<LessonContentBlockViewModel[]>(() => selected.value ? [{
  id: selected.value.id, type: 'intro', content: `Story: ${selected.value.title}\n${selected.value.body}`,
  isSample: false, verificationStatus: 'UNVERIFIED', sort: 0,
}] : [])

function selectLesson(id: string) { void router.push({ path: '/grade-explorer', query: { lesson: id, variant: 0 } }) }
function returnToList() { void router.push({ path: '/grade-explorer' }) }
function switchVariant() { if (selected.value) void router.push({ path: '/grade-explorer', query: { lesson: selected.value.id, variant: variant.value === 0 ? 1 : 0 } }) }
watch(subject, () => { if (selected.value && subject.value !== 'ALL' && selected.value.subject !== subject.value) returnToList() })
</script>

<template>
  <AppShell :show-bottom-nav="true" context="三年级原创拓展">
    <div class="grade-explorer content-container">
      <header>
        <p class="curriculum-eyebrow">GRADE 3 · ORIGINAL EXTENSION</p>
        <h1>三年级原创拓展</h1>
        <p>短课用于拓展练习，不替代教材学习。内容为项目原创，暂未教师校审。</p>
      </header>
      <section v-if="!selected" aria-labelledby="grade-extension-list-title">
        <h2 id="grade-extension-list-title">选一节短课开始</h2>
        <fieldset class="grade-explorer__filters"><legend>筛选学科</legend><label v-for="item in ['ALL', 'CHINESE', 'MATH', 'ENGLISH'] as const" :key="item"><input v-model="subject" type="radio" :value="item" />{{ item === 'ALL' ? '全部' : item === 'CHINESE' ? '语文' : item === 'MATH' ? '数学' : '英语' }}</label></fieldset>
        <div class="grade-explorer__list"><GradeExtensionLessonCard v-for="lesson in lessons" :key="lesson.id" :lesson="lesson" :selected="false" @select="selectLesson" /></div>
        <RouterLink class="grade-explorer__settings" to="/curriculum-settings">一、二年级请在我的学习设置中继续使用已选教材 →</RouterLink>
      </section>
      <section v-else class="grade-explorer__lesson" aria-labelledby="grade-extension-lesson-title">
        <button type="button" class="grade-explorer__back" @click="returnToList">← 返回短课列表</button>
        <p class="grade-explorer__tag">{{ selected.subject === 'CHINESE' ? '语文' : selected.subject === 'MATH' ? '数学' : '英语' }} · 项目原创</p>
        <h2 id="grade-extension-lesson-title">{{ selected.title }}</h2>
        <p><strong>学习目标：</strong>{{ selected.objective }}</p>
        <article class="grade-explorer__body"><p v-for="paragraph in selected.body.split('\n')" :key="paragraph">{{ paragraph }}</p></article>
        <EnglishReadAloud v-if="selected.subject === 'ENGLISH'" :key="`${profileId}:${selected.id}`" :blocks="englishBlocks" :muted="preferences.preferences.muted" />
        <StudentReadAloud v-else :text="selected.body" :scope="`${profileId}:${selected.id}`" :muted="preferences.preferences.muted" label="听读短课" />
        <div class="grade-explorer__actions"><button type="button" @click="switchVariant">换一组练习（第 {{ variant + 1 }} 组）</button></div>
        <ReadingQuest v-if="quest" :key="`${profileId}:${quest.id}`" :quest="quest" :profile-id="profileId" :reading-label="selected.title" note="先读短课，再完成三道有依据的练习；进度只保存在当前学习档案。" />
        <p class="grade-explorer__notice">内容来源：项目原创；参考课程标准方向，暂未教师校审。</p>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.grade-explorer { display: grid; gap: 1.25rem; padding-block: 1.25rem 2rem; }
.grade-explorer header h1, .grade-explorer h2, .grade-explorer p { margin: 0; }
.grade-explorer header, .grade-explorer__lesson, .grade-explorer__list { display: grid; gap: 1rem; }
.grade-explorer header > p:last-child, .grade-explorer__notice { color: var(--color-text-secondary, #4b5563); line-height: 1.6; }
.grade-explorer__filters { display: flex; gap: .7rem; flex-wrap: wrap; margin: 0; padding: .75rem; border: 1px solid var(--color-border, #d8dee9); border-radius: .8rem; }
.grade-explorer__filters label { min-height: 44px; display: inline-flex; align-items: center; gap: .35rem; }
.grade-explorer__body { padding: 1rem; border-radius: .9rem; background: var(--color-primary-50, #f1f8ff); line-height: 1.8; }
.grade-explorer__back, .grade-explorer__actions button { min-height: 44px; justify-self: start; padding: .55rem .9rem; border: 1px solid var(--color-primary, #2463eb); border-radius: .7rem; color: var(--color-primary, #2463eb); background: white; font: inherit; font-weight: 700; cursor: pointer; }
.grade-explorer__tag { color: var(--color-primary, #2463eb); font-weight: 700; }
.grade-explorer__settings { color: var(--color-primary, #2463eb); font-weight: 700; }
@media (max-width: 480px) { .grade-explorer__filters { display: grid; grid-template-columns: 1fr 1fr; } }
</style>
