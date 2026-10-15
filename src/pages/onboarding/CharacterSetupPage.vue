<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'
import { LOCAL_STUDENT_ID, useStudentStore } from '@/stores/studentStore'

const router = useRouter()
const studentStore = useStudentStore()

function enterHome() {
  if (
    !studentStore.savePersonalProfile(
      studentStore.profile?.displayName ?? '小岛同学',
      studentStore.characterId ?? 'default-character',
      LOCAL_STUDENT_ID,
    )
  )
    return
  router.push('/home')
}
</script>

<template>
  <CurriculumPageFrame
    title="认识你的学习伙伴"
    description="知识团子陪你学习，之后可以在成长页免费领养伙伴。"
    :step="3"
    back-to="/onboarding/textbooks"
  >
    <section class="character-setup">
      <AppCard variant="elevated" class="character-setup__card">
        <KnowledgeDangoPlaceholder state="happy" size="lg" />
        <div>
          <p class="curriculum-eyebrow">默认角色</p>
          <h2>知识团子</h2>
          <p>它会在学习开始、完成和需要鼓励时陪着你。</p>
        </div>
        <aside class="personal-panel">
          <strong>请家长保存账号恢复码</strong>
          <p>忘记密码时，恢复码能帮助找回学习记录。可先出发，再到“账号安全”设置。</p>
          <RouterLink to="/account/security">查看账号安全与恢复码 →</RouterLink>
        </aside>
        <p v-if="studentStore.warning" role="alert">{{ studentStore.warning }}</p>
        <AppButton size="lg" icon-right="arrow-right" @click="enterHome">出发去知识岛</AppButton>
      </AppCard>
    </section>
  </CurriculumPageFrame>
</template>
