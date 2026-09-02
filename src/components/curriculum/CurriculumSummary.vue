<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { SubjectCode, TextbookDisplay } from '@/types'

interface Props {
  regionName: string
  gradeName: string
  semesterName: string
  textbooks: Partial<Record<SubjectCode, TextbookDisplay | null>>
}

const props = defineProps<Props>()
const labels: Record<SubjectCode, string> = { CHINESE: '语文', MATH: '数学', ENGLISH: '英语' }
</script>

<template>
  <section class="curriculum-summary" aria-labelledby="curriculum-summary-title">
    <div class="curriculum-summary__heading">
      <div>
        <p class="curriculum-eyebrow">当前学习配置</p>
        <h2 id="curriculum-summary-title">{{ props.gradeName }} · {{ props.semesterName }}</h2>
      </div>
      <AppIcon name="book-open" :size="28" decorative />
    </div>
    <dl class="curriculum-summary__context">
      <div>
        <dt>学习地区</dt>
        <dd>{{ props.regionName }}</dd>
      </div>
      <div>
        <dt>年级</dt>
        <dd>{{ props.gradeName }}</dd>
      </div>
      <div>
        <dt>学期</dt>
        <dd>{{ props.semesterName }}</dd>
      </div>
    </dl>
    <div class="curriculum-summary__subjects">
      <div
        v-for="subjectCode in ['CHINESE', 'MATH', 'ENGLISH'] as SubjectCode[]"
        :key="subjectCode"
      >
        <span>{{ labels[subjectCode] }}</span>
        <strong>{{ props.textbooks[subjectCode]?.textbook.versionName ?? '待确认' }}</strong>
        <small>{{ props.textbooks[subjectCode]?.publisher.name ?? '暂未配置' }}</small>
      </div>
    </div>
  </section>
</template>
