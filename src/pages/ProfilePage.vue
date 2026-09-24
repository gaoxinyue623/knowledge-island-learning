<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import AppShell from '@/layouts/AppShell.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import {
  getCurriculumPresentation,
  type CurriculumPresentation,
} from '@/composables/useCurriculumPresentation'
import { useStudentStore } from '@/stores/studentStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useGrowthStore } from '@/stores/growthStore'
import { useAchievementStore } from '@/stores/achievementStore'
import type { IconName } from '@/types'
import { productionConfig } from '@/config/production'

const { profileId } = useLearningProfile()
let loadVersion = 0
const student = useStudentStore()
const curriculum = useCurriculumStore()
const growth = useGrowthStore()
const achievements = useAchievementStore()
const showAgentEntry = productionConfig.devRoutes
const presentation = ref<CurriculumPresentation | null>(null)
const loading = ref(true)
const error = ref('')
const nextAchievement = computed(() =>
  achievements.progress.find((item) => item.status !== 'unlocked'),
)
const links: { title: string; description: string; path: string; icon: IconName }[] = [
  {
    title: '今日 Agent 建议',
    description: '根据学习记录安排下一步',
    path: '/learning-agent',
    icon: 'sparkles',
  },
  { title: '角色装扮', description: '给团子换个新模样', path: '/character', icon: 'sparkles' },
  { title: '学习记录', description: '回看每一步探索', path: '/history', icon: 'book-open' },
  {
    title: '我的本领册',
    description: '从练过到掌握，查看真实证据',
    path: '/abilities',
    icon: 'book-open',
  },
  {
    title: '团子的知识小故事',
    description: '复习、讲解和生活中的新发现',
    path: '/pet-stories',
    icon: 'sparkles',
  },
  {
    title: '三年级原创拓展',
    description: '语数英短课与迁移练习',
    path: '/grade-explorer',
    icon: 'book-open',
  },
  {
    title: '我的错题',
    description: '把还不熟悉的再练一练',
    path: '/wrong-book',
    icon: 'refresh-cw',
  },
  { title: '待巩固', description: '温习学过的知识', path: '/review-queue', icon: 'route' },
  { title: '家长中心', description: '一起了解学习进展', path: '/parent', icon: 'user-round' },
  {
    title: '家庭学习档案',
    description: '多个孩子与跨设备同步',
    path: '/family',
    icon: 'user-round',
  },
  { title: '通用设置', description: '昵称、播放偏好与帮助', path: '/settings', icon: 'settings' },
]
if (showAgentEntry)
  links.splice(0, 0, {
    title: 'Agent 实验室',
    description: '查看学习决策与题目生成过程（开发入口）',
    path: '/agent',
    icon: 'sparkles',
  })
async function load() {
  const version = ++loadVersion
  const id = profileId.value
  loading.value = true
  presentation.value = null
  error.value = ''
  try {
    const profile = curriculum.curriculumProfile
    growth.load(id, { dataset: 'profile', includeSample: false })
    achievements.load(id, { dataset: 'profile', includeSample: false })
    if (growth.error || achievements.error)
      throw new Error(growth.error || achievements.error || '')
    const result = profile ? await getCurriculumPresentation(profile) : null
    if (version !== loadVersion) return
    presentation.value = result
  } catch (caught) {
    if (version !== loadVersion) return
    error.value = caught instanceof Error ? caught.message : '个人主页暂时无法读取。'
  } finally {
    if (version === loadVersion) loading.value = false
  }
}
watch(profileId, load, { immediate: true })
</script>

<template>
  <AppShell show-bottom-nav context="我的知识岛">
    <div class="personal-page content-container">
      <header class="personal-heading">
        <p class="curriculum-eyebrow">每一步探索，都值得记住</p>
        <h1>我的知识岛</h1>
      </header>
      <AppLoading v-if="loading" label="正在整理你的学习足迹" />
      <AppErrorState v-if="!loading && error" :description="error" @retry="load" />
      <template v-if="!loading">
        <p
          v-if="student.warning || growth.warning || achievements.warning"
          class="personal-notice"
          role="status"
        >
          {{ student.warning || growth.warning || achievements.warning }}
        </p>
        <section class="personal-hero">
          <KnowledgeDangoPlaceholder state="happy" size="lg" />
          <div class="personal-hero__copy">
            <span class="personal-tag">知识岛探索者</span>
            <h2>{{ student.profile?.displayName ?? '小岛同学' }}</h2>
            <p v-if="presentation">
              {{ presentation?.gradeName }} · {{ presentation?.semesterName }} ·
              {{ presentation?.regionName }}
            </p>
            <RouterLink
              class="personal-primary"
              :to="curriculum.isComplete ? '/curriculum-settings' : '/onboarding'"
              >我的学习设置 <AppIcon name="arrow-right" :size="18" decorative
            /></RouterLink>
          </div>
        </section>
        <div class="personal-columns">
          <section class="personal-panel" aria-labelledby="growth-title">
            <div class="personal-section-title">
              <h2 id="growth-title">我的成长</h2>
              <RouterLink to="/achievements">查看全部 <span aria-hidden="true">→</span></RouterLink>
            </div>
            <div class="personal-stats">
              <div>
                <strong>{{ growth.growthLevel }}</strong
                ><span>成长等级</span>
              </div>
              <div>
                <strong>{{ growth.knowledgeEnergy }}</strong
                ><span>知识能量</span>
              </div>
              <div>
                <strong>{{ achievements.unlockedCount }}</strong
                ><span>已达成成就</span>
              </div>
            </div>
            <AppProgress
              :value="growth.growth?.progressToNextLevel ?? 0"
              label="成长进度"
              state="success"
            />
            <p class="personal-muted">
              {{
                growth.summary?.nextLevelThreshold
                  ? `再积累 ${Math.max(0, growth.summary.nextLevelThreshold - growth.knowledgeEnergy)} 点能量，就能到达下一等级。`
                  : '继续探索，收藏更多学习回忆。'
              }}
            </p>
            <div v-if="nextAchievement" class="personal-milestone">
              <AppIcon :name="nextAchievement.definition.iconKey" :size="24" decorative />
              <div>
                <h3>下一枚成就 · {{ nextAchievement.definition.title }}</h3>
                <p>{{ nextAchievement.definition.description }}</p>
                <small
                  >{{ Math.min(nextAchievement.current, nextAchievement.target) }} /
                  {{ nextAchievement.target }}</small
                >
              </div>
            </div>
            <RouterLink v-if="!growth.knowledgeEnergy" class="personal-text-link" to="/learning-map"
              >从一次学习开始，留下第一份成长记录 →</RouterLink
            >
          </section>
          <section class="personal-panel" aria-labelledby="entrances-title">
            <h2 id="entrances-title">我的学习空间</h2>
            <div class="personal-links">
              <RouterLink
                v-for="item in links"
                :key="item.path"
                :to="item.path"
                class="personal-link"
                ><span class="personal-link__icon"
                  ><AppIcon :name="item.icon" :size="22" decorative /></span
                ><span
                  ><strong>{{ item.title }}</strong
                  ><small>{{ item.description }}</small></span
                ><AppIcon name="chevron-right" :size="18" decorative
              /></RouterLink>
            </div>
          </section>
        </div>
      </template>
    </div>
  </AppShell>
</template>
