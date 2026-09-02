import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import DevCurriculum from '@/pages/DevCurriculum.vue'
import DevLearningMapPage from '@/pages/DevLearningMapPage.vue'
import DevUi from '@/pages/DevUi.vue'
import HomePlaceholderPage from '@/pages/HomePlaceholderPage.vue'
import LearningMapPage from '@/pages/LearningMapPage.vue'
import LessonPlayerPage from '@/pages/LessonPlayerPage.vue'
import QuestionEnginePage from '@/pages/QuestionEnginePage.vue'
import CharacterSetupPage from '@/pages/onboarding/CharacterSetupPage.vue'
import GradeSelectPage from '@/pages/onboarding/GradeSelectPage.vue'
import OnboardingWelcomePage from '@/pages/onboarding/OnboardingWelcomePage.vue'
import RegionSelectPage from '@/pages/onboarding/RegionSelectPage.vue'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import CurriculumSettingsPage from '@/pages/curriculum/CurriculumSettingsPage.vue'
import TextbookSubjectSelectPage from '@/pages/curriculum/TextbookSubjectSelectPage.vue'
import PagePlaceholder from '@/pages/PagePlaceholder.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { pinia } from '@/stores/pinia'
import { getOnboardingRedirect } from './guard'

const placeholder = (title: string, meta: RouteRecordRaw['meta'] = {}) => ({
  component: PagePlaceholder,
  meta: { title, ...meta },
})

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/onboarding' },
  {
    path: '/onboarding',
    component: OnboardingWelcomePage,
    meta: { title: '欢迎来到知识岛', hideBottomNav: true },
  },
  {
    path: '/onboarding/region',
    component: RegionSelectPage,
    meta: { title: '选择学习地区', hideBottomNav: true },
  },
  {
    path: '/onboarding/grade',
    component: GradeSelectPage,
    meta: { title: '选择年级', hideBottomNav: true },
  },
  {
    path: '/onboarding/textbooks',
    component: TextbookConfirmPage,
    meta: { title: '确认教材版本', hideBottomNav: true },
  },
  {
    path: '/onboarding/character',
    component: CharacterSetupPage,
    meta: { title: '选择知识团子', hideBottomNav: true },
  },
  {
    path: '/home',
    component: HomePlaceholderPage,
    meta: { title: '首页', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/map/:mapId',
    redirect: '/learning-map',
  },
  {
    path: '/learning-map',
    component: LearningMapPage,
    meta: { title: '知识岛地图', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/lesson',
    component: LessonPlayerPage,
    meta: {
      title: '学习课程',
      requiresOnboarding: true,
      studentOnly: true,
      hideBottomNav: true,
      immersiveMode: true,
    },
  },
  {
    path: '/lesson/:nodeId',
    component: LessonPlayerPage,
    meta: {
      title: '学习课程',
      requiresOnboarding: true,
      studentOnly: true,
      hideBottomNav: true,
      immersiveMode: true,
    },
  },
  {
    path: '/assessment',
    component: QuestionEnginePage,
    meta: {
      title: '本次练习',
      requiresOnboarding: true,
      studentOnly: true,
      hideBottomNav: true,
      immersiveMode: true,
    },
  },
  {
    path: '/question/:nodeId',
    ...placeholder('Question', {
      requiresOnboarding: true,
      studentOnly: true,
      hideBottomNav: true,
      immersiveMode: true,
    }),
  },
  {
    path: '/result/:nodeId',
    ...placeholder('Result', {
      requiresOnboarding: true,
      studentOnly: true,
      hideBottomNav: true,
    }),
  },
  { path: '/tasks', ...placeholder('DailyTasks', { requiresOnboarding: true, studentOnly: true }) },
  {
    path: '/wrong-book',
    ...placeholder('WrongBook', { requiresOnboarding: true, studentOnly: true }),
  },
  { path: '/profile', ...placeholder('Profile', { requiresOnboarding: true, studentOnly: true }) },
  {
    path: '/character',
    ...placeholder('Character', { requiresOnboarding: true, studentOnly: true }),
  },
  {
    path: '/achievements',
    ...placeholder('Achievements', { requiresOnboarding: true, studentOnly: true }),
  },
  { path: '/parent', ...placeholder('ParentDashboard', { parentOnly: true }) },
  {
    path: '/curriculum-settings',
    component: CurriculumSettingsPage,
    meta: { title: '我的学习设置', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/curriculum-settings/textbook/:subjectCode',
    component: TextbookSubjectSelectPage,
    meta: {
      title: '更换教材版本',
      requiresOnboarding: true,
      studentOnly: true,
      hideBottomNav: true,
    },
  },
  {
    path: '/settings',
    ...placeholder('Settings', { requiresOnboarding: true, studentOnly: true }),
  },
  {
    path: '/dev/ui',
    component: DevUi,
    meta: { title: '基础组件 Demo', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/curriculum',
    component: DevCurriculum,
    meta: { title: '课程数据管线', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/learning-map',
    component: DevLearningMapPage,
    meta: { title: 'LearningMap Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/learning-map/states',
    component: DevLearningMapPage,
    meta: { title: 'LearningMap State Showcase', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/lesson-player',
    component: LessonPlayerPage,
    meta: { title: 'LessonPlayer Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/lesson-player/states',
    component: LessonPlayerPage,
    meta: { title: 'LessonPlayer State Showcase', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/question-engine',
    component: QuestionEnginePage,
    meta: { title: 'Question Engine Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/question-engine/states',
    component: QuestionEnginePage,
    meta: { title: 'Question Engine State Showcase', devOnly: true, hideBottomNav: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.meta.devOnly && import.meta.env.PROD) {
    return { path: '/' }
  }

  if (to.meta.title) {
    document.title = `${to.meta.title} · 知识岛`
  }

  const curriculumStore = useCurriculumStore(pinia)
  const onboardingRedirect = getOnboardingRedirect(
    to.path,
    Boolean(to.meta.requiresOnboarding),
    curriculumStore.isComplete,
    to.path === '/onboarding' && to.query.edit === 'true',
  )
  if (onboardingRedirect) return onboardingRedirect

  return true
})

export default router
