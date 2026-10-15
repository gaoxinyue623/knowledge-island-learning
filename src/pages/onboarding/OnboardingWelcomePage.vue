<script setup lang="ts">
import { ref } from 'vue'
import AppBottomSheet from '@/components/common/AppBottomSheet.vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'

const router = useRouter()
const parentHelp = ref(false)

function startOnboarding() {
  router.push('/onboarding/grade')
}
</script>

<template>
  <CurriculumPageFrame
    title="欢迎来到知识岛"
    description="先选择年级，再确认你正在使用的教材版本。"
  >
    <section class="onboarding-welcome">
      <AppCard variant="elevated" class="onboarding-welcome__card">
        <KnowledgeDangoPlaceholder state="encourage" size="lg" />
        <div class="onboarding-welcome__copy">
          <h2>准备好开始一段学习冒险了吗？</h2>
          <p>选择年级和课本册次，再按各科教材版本确认课本，就能从适合你的课程出发。</p>
          <div class="onboarding-welcome__steps" aria-label="配置步骤">
            <span><AppIcon name="star" :size="18" decorative /> 年级</span>
            <span><AppIcon name="book-open" :size="18" decorative /> 教材版本</span>
            <span><AppIcon name="user-round" :size="18" decorative /> 角色</span>
          </div>
          <AppButton size="lg" icon-right="arrow-right" @click="startOnboarding">
            开始设置
          </AppButton>
          <button class="curriculum-text-button" type="button" @click="parentHelp = true">
            请家长帮我设置
          </button>
        </div>
      </AppCard>
    </section>
    <AppBottomSheet
      :open="parentHelp"
      title="家长准备这三样就可以"
      primary-label="准备好了，开始设置"
      @close="parentHelp = false"
      @primary="startOnboarding"
    >
      <ol>
        <li>确认孩子的年级，以及现在使用上册还是下册。</li>
        <li>准备课本，核对封面、版权页和目录；有多个版本时再逐科选择。</li>
        <li>为孩子使用昵称，设置后到账号安全保存一次性恢复码。</li>
      </ol>
      <p>可以先设置一科，其他科目以后补充。每个孩子都能建立自己的学习档案。</p>
    </AppBottomSheet>
  </CurriculumPageFrame>
</template>
