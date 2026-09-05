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
  studentStore.setProfile({ id: LOCAL_STUDENT_ID, displayName: '小岛同学' })
  studentStore.setCharacter('default-character')
  router.push('/home')
}
</script>

<template>
  <CurriculumPageFrame
    title="选择你的知识团子"
    description="先选一个陪你学习的默认角色，之后还可以在我的页面查看。"
    :step="4"
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
        <AppButton size="lg" icon-right="arrow-right" @click="enterHome">出发去知识岛</AppButton>
      </AppCard>
    </section>
  </CurriculumPageFrame>
</template>
