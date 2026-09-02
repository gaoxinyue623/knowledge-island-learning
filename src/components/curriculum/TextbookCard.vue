<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { IconName } from '@/types'
import type { SubjectCode, TextbookDisplay, TextbookResolutionStatus } from '@/types'

interface Props {
  subjectCode: SubjectCode
  subjectName: string
  subjectIcon: IconName
  textbook: TextbookDisplay | null
  resolutionStatus: TextbookResolutionStatus
  selected: boolean
  candidateCount: number
  gradeName: string
  semesterName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ change: [] }>()
</script>

<template>
  <article class="textbook-card" :class="`textbook-card--${props.subjectCode.toLowerCase()}`">
    <div class="textbook-card__subject">
      <AppIcon :name="props.subjectIcon" :size="22" decorative />
      <strong>{{ props.subjectName }}</strong>
      <span v-if="props.selected" class="textbook-card__selected"
        ><AppIcon name="check-circle" :size="16" decorative /> 已选</span
      >
    </div>
    <template v-if="props.textbook">
      <p class="textbook-card__label"><AppIcon name="library" :size="16" decorative /> 出版社</p>
      <p class="textbook-card__value">{{ props.textbook.publisher.name }}</p>
      <p class="textbook-card__label"><AppIcon name="book-marked" :size="16" decorative /> 版本</p>
      <p class="textbook-card__value">{{ props.textbook.textbook.versionName }}</p>
      <p class="textbook-card__meta">{{ props.gradeName }} · {{ props.semesterName }}</p>
    </template>
    <p v-else class="textbook-card__pending">暂时没有找到匹配课本</p>
    <p v-if="props.resolutionStatus === 'NEEDS_CONFIRMATION'" class="textbook-card__notice">
      这里有 {{ props.candidateCount }} 种课本版本，请确认你正在使用哪一本。
    </p>
    <p v-else-if="props.resolutionStatus === 'NOT_AVAILABLE'" class="textbook-card__notice">
      这个地区暂时没有匹配课本。
    </p>
    <button class="textbook-card__change" type="button" @click="emit('change')">
      {{ props.resolutionStatus === 'NOT_AVAILABLE' ? '手动查看' : '修改版本' }}
    </button>
  </article>
</template>
