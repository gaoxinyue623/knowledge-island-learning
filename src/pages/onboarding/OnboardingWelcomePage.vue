<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'

const router = useRouter()

function startOnboarding() {
  router.push('/onboarding/region')
}
</script>

<template>
  <CurriculumPageFrame
    title="欢迎来到知识岛"
    description="先告诉我你的学习地区和年级，我来帮你准备课本。"
  >
    <section class="onboarding-welcome">
      <AppCard variant="elevated" class="onboarding-welcome__card">
        <KnowledgeDangoPlaceholder state="encourage" size="lg" />
        <div class="onboarding-welcome__copy">
          <h2>准备好开始一段学习冒险了吗？</h2>
          <p>只需要选择地区、年级和三科课本，之后就能从适合你的课程出发。</p>
          <div class="onboarding-welcome__steps" aria-label="配置步骤">
            <span><AppIcon name="map-pin" :size="18" decorative /> 地区</span>
            <span><AppIcon name="star" :size="18" decorative /> 年级</span>
            <span><AppIcon name="book-open" :size="18" decorative /> 教材</span>
            <span><AppIcon name="user-round" :size="18" decorative /> 角色</span>
          </div>
          <AppButton size="lg" icon-right="arrow-right" @click="startOnboarding">
            开始设置
          </AppButton>
          <button class="curriculum-text-button" type="button" @click="startOnboarding">
            请家长帮我设置
          </button>
        </div>
      </AppCard>
    </section>
  </CurriculumPageFrame>
</template>
