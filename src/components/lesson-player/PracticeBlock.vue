<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { LessonContentBlockViewModel } from '@/types'

import LessonBlockShell from './LessonBlockShell.vue'

interface Props {
  block: LessonContentBlockViewModel
}

const props = defineProps<Props>()
const showHint = ref(false)
</script>

<template>
  <LessonBlockShell eyebrow="想一想" :title="props.block.title">
    <p v-if="props.block.content" class="lesson-block__content">{{ props.block.content }}</p>
    <p v-for="paragraph in props.block.paragraphs" :key="paragraph" class="lesson-block__paragraph">
      {{ paragraph }}
    </p>
    <div class="lesson-practice">
      <AppButton variant="soft" size="sm" @click="showHint = !showHint">
        <AppIcon name="lightbulb" :size="18" decorative />
        {{ showHint ? '收起思路' : '先想一想，再看思路' }}
      </AppButton>
      <p v-if="showHint" class="lesson-practice__hint" role="status">
        {{ props.block.interaction?.revealText || '先说出你的观察方法，再检查每一步是否连得上。' }}
      </p>
    </div>
  </LessonBlockShell>
</template>
