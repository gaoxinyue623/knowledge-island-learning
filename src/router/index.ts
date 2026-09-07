import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import CharacterSetupPage from '@/pages/onboarding/CharacterSetupPage.vue'
import GradeSelectPage from '@/pages/onboarding/GradeSelectPage.vue'
import OnboardingWelcomePage from '@/pages/onboarding/OnboardingWelcomePage.vue'
import RegionSelectPage from '@/pages/onboarding/RegionSelectPage.vue'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import PagePlaceholder from '@/pages/PagePlaceholder.vue'
import { productionConfig } from '@/config/production'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { pinia } from '@/stores/pinia'
import { getOnboardingRedirect } from './guard'

const placeholder = (title: string, meta: RouteRecordRaw['meta'] = {}) => ({
  component: PagePlaceholder,
  meta: { title, ...meta },
})

// Keep the onboarding shell eager, but load product and developer surfaces on
// demand so the first route does not pay for every feature bundle.
const HomePage = () => import('@/pages/HomePage.vue')
const LearningMapPage = () => import('@/pages/LearningMapPage.vue')
const ThinkingIslandsPage = () => import('@/pages/ThinkingIslandsPage.vue')
const ThinkingMissionPage = () => import('@/pages/ThinkingMissionPage.vue')
const ReadingIslandsPage = () => import('@/pages/ReadingIslandsPage.vue')
const ReadingStoryPage = () => import('@/pages/ReadingStoryPage.vue')
const KnowledgePointDetailPage = () => import('@/pages/KnowledgePointDetailPage.vue')
const LessonPlayerPage = () => import('@/pages/LessonPlayerPage.vue')
const LearningHistoryPage = () => import('@/pages/LearningHistoryPage.vue')
const ParentDashboardPage = () => import('@/pages/ParentDashboardPage.vue')
const QuestionEnginePage = () => import('@/pages/QuestionEnginePage.vue')
const ReviewQueuePage = () => import('@/pages/ReviewQueuePage.vue')
const RewardPage = () => import('@/pages/RewardPage.vue')
const WrongBookPage = () => import('@/pages/WrongBookPage.vue')
const DevCurriculum = () => import('@/pages/DevCurriculum.vue')
const DevLearningMapPage = () => import('@/pages/DevLearningMapPage.vue')
const DevMasteryPage = () => import('@/pages/DevMasteryPage.vue')
const DevStrategyPage = () => import('@/pages/DevStrategyPage.vue')
const DevUi = () => import('@/pages/DevUi.vue')
const DevActivityEnginePage = () => import('@/pages/DevActivityEnginePage.vue')
const DevContentExpansionPage = () => import('@/pages/DevContentExpansionPage.vue')
const CurriculumSettingsPage = () => import('@/pages/curriculum/CurriculumSettingsPage.vue')
const TextbookSubjectSelectPage = () => import('@/pages/curriculum/TextbookSubjectSelectPage.vue')

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
    component: HomePage,
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
    path: '/reading-islands',
    component: ReadingIslandsPage,
    meta: { title: '阅读群岛', studentOnly: true },
  },
  {
    path: '/reading-islands/:storyId',
    component: ReadingStoryPage,
    meta: { title: '课外阅读', studentOnly: true, hideBottomNav: true, immersiveMode: true },
  },
  {
    path: '/thinking-islands',
    component: ThinkingIslandsPage,
    meta: { title: '思维群岛', studentOnly: true },
  },
  {
    path: '/thinking-islands/:islandId',
    component: ThinkingIslandsPage,
    meta: { title: '探索思维岛', studentOnly: true },
  },
  {
    path: '/thinking-islands/:islandId/:missionId',
    component: ThinkingMissionPage,
    meta: { title: '思维训练', studentOnly: true, hideBottomNav: true, immersiveMode: true },
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
    path: '/knowledge-point/:knowledgePointId',
    component: KnowledgePointDetailPage,
    meta: {
      title: '知识点详情',
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
  {
    path: '/tasks',
    component: HomePage,
    meta: { title: '今日学习', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/wrong-book',
    component: WrongBookPage,
    meta: { title: '错题本', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/review-queue',
    component: ReviewQueuePage,
    meta: { title: '待巩固', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/history',
    component: LearningHistoryPage,
    meta: { title: '学习记录', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { title: '我的知识岛', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/character',
    component: () => import('@/pages/CharacterPage.vue'),
    meta: { title: '角色装扮', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/achievements',
    component: RewardPage,
    meta: { title: '成长反馈', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/parent',
    component: ParentDashboardPage,
    meta: { title: '学习报告', parentOnly: true, hideBottomNav: true },
  },
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
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { title: '通用设置', requiresOnboarding: true, studentOnly: true },
  },
  {
    path: '/dev/ui',
    component: DevUi,
    meta: { title: '基础组件 Demo', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/home',
    component: HomePage,
    meta: { title: 'Home Debug View', devOnly: true, hideBottomNav: true },
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
    path: '/dev/knowledge-point/:knowledgePointId',
    component: KnowledgePointDetailPage,
    meta: { title: 'KnowledgePoint Detail Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/lesson-player/states',
    component: LessonPlayerPage,
    meta: { title: 'LessonPlayer State Showcase', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/activity-engine',
    component: DevActivityEnginePage,
    meta: { title: 'Interactive Activity Engine Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/content-expansion',
    component: DevContentExpansionPage,
    meta: { title: 'Content Expansion Debug View', devOnly: true, hideBottomNav: true },
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
  {
    path: '/dev/history',
    component: LearningHistoryPage,
    meta: { title: 'Learning History Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/wrong-book',
    component: WrongBookPage,
    meta: { title: 'WrongBook Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/review-queue',
    component: ReviewQueuePage,
    meta: { title: 'Review Queue Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/reward',
    component: RewardPage,
    meta: { title: 'Reward / Growth Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/mastery',
    component: DevMasteryPage,
    meta: { title: 'Mastery Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/strategy',
    component: DevStrategyPage,
    meta: { title: 'Learning Strategy Debug View', devOnly: true, hideBottomNav: true },
  },
  {
    path: '/dev/parent-dashboard',
    component: ParentDashboardPage,
    meta: { title: 'Parent Dashboard Debug View', devOnly: true, hideBottomNav: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from) => {
    if (to.path === '/reading-islands' && from.path === '/reading-islands') return false
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.devOnly && !productionConfig.devRoutes) {
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
