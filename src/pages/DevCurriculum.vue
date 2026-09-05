<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppShell from '@/layouts/AppShell.vue'
import { sampleCurriculumData } from '@/data/curriculum/sample'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { validateCurriculumData } from '@/services/validation'
import { useCurriculumStore } from '@/stores/curriculumStore'

const curriculumStore = useCurriculumStore()
const devCurriculumService = new MockCurriculumService({ data: sampleCurriculumData })
const loading = ref(true)
const error = ref<string | null>(null)
const validation = validateCurriculumData(sampleCurriculumData)
const regionBResolution = ref<Awaited<
  ReturnType<typeof devCurriculumService.resolveAvailableTextbooks>
> | null>(null)
const dataSections: Array<{ label: string; value: unknown }> = [
  { label: 'Regions', value: sampleCurriculumData.regions },
  { label: 'Publishers', value: sampleCurriculumData.publishers },
  { label: 'Textbooks', value: sampleCurriculumData.textbooks },
  { label: 'RegionTextbookRelations', value: sampleCurriculumData.regionTextbookRelations },
  { label: 'Units', value: sampleCurriculumData.units },
  { label: 'Lessons', value: sampleCurriculumData.lessons },
  { label: 'KnowledgePoints', value: sampleCurriculumData.knowledgePoints },
]

const counts = computed(() => [
  ['地区', sampleCurriculumData.regions.length],
  ['出版社', sampleCurriculumData.publishers.length],
  ['教材版本', sampleCurriculumData.textbooks.length],
  ['地区教材关系', sampleCurriculumData.regionTextbookRelations.length],
  ['单元', sampleCurriculumData.units.length],
  ['课次', sampleCurriculumData.lessons.length],
  ['知识点', sampleCurriculumData.knowledgePoints.length],
  ['课程内容', sampleCurriculumData.courseContents.length],
  ['题目', sampleCurriculumData.questions.length],
  ['媒体', sampleCurriculumData.mediaAssets.length],
])

function json(value: unknown) {
  return JSON.stringify(value, null, 2)
}

async function loadDevData() {
  loading.value = true
  error.value = null
  try {
    regionBResolution.value = await devCurriculumService.resolveAvailableTextbooks({
      regionId: 'SAMPLE_REGION_B',
      gradeId: 'SAMPLE_GRADE_3',
      semesterId: 'SAMPLE_SEMESTER_UPPER',
    })
    await curriculumStore.loadCurriculumProfile('SAMPLE_STUDENT_01')
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '开发数据暂时无法读取'
  } finally {
    loading.value = false
  }
}

onMounted(() => void loadDevData())
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / Curriculum">
    <div class="curriculum-page content-container dev-curriculum">
      <header class="curriculum-page__header">
        <p class="curriculum-eyebrow">DEVELOPMENT ONLY</p>
        <h1>Curriculum Data Pipeline</h1>
        <p>只读检查 SAMPLE 数据、解析结果和校验状态，不提供正式 CRUD。</p>
      </header>
      <AppLoading v-if="loading" label="正在读取课程数据" />
      <AppErrorState
        v-else-if="error"
        title="开发数据暂时打不开"
        :description="error"
        @retry="loadDevData"
      />
      <template v-else>
        <section class="dev-curriculum__counts" aria-label="数据计数">
          <div v-for="[label, count] in counts" :key="label">
            <strong>{{ count }}</strong
            ><span>{{ label }}</span>
          </div>
        </section>
        <section class="dev-curriculum__section">
          <h2>解析结果：示例地区 B · G3 · UPPER</h2>
          <pre>{{ json(regionBResolution) }}</pre>
        </section>
        <section class="dev-curriculum__section">
          <h2>当前 StudentCurriculumProfile</h2>
          <pre>{{ json(curriculumStore.curriculumProfile) }}</pre>
        </section>
        <section class="dev-curriculum__section">
          <h2>数据校验</h2>
          <p :class="validation.valid ? 'dev-curriculum__valid' : 'dev-curriculum__invalid'">
            {{ validation.valid ? '通过' : `发现 ${validation.errors.length} 个错误` }}
          </p>
          <pre v-if="validation.errors.length">{{ json(validation.errors) }}</pre>
          <pre v-if="validation.warnings.length">{{ json(validation.warnings) }}</pre>
        </section>
        <details
          v-for="section in dataSections"
          :key="section.label"
          class="dev-curriculum__section"
        >
          <summary>{{ section.label }}</summary>
          <pre>{{ json(section.value) }}</pre>
        </details>
      </template>
    </div>
  </AppShell>
</template>
