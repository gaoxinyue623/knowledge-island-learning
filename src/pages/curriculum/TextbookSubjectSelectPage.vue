<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import TextbookVersionSelector from '@/components/curriculum/TextbookVersionSelector.vue'
import CurriculumPageFrame from './CurriculumPageFrame.vue'
import { curriculumService } from '@/services'
import { useCurriculumStore } from '@/stores/curriculumStore'
import type { SubjectCode, TextbookDisplay } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const loading = ref(true)
const error = ref<string | null>(null)
const options = ref<TextbookDisplay[]>([])
const gradeName = ref('当前年级')
const semesterName = ref('当前学期')

const subjectCode = computed(() => {
  const value = String(route.params.subjectCode).toUpperCase()
  return (['CHINESE', 'MATH', 'ENGLISH'] as SubjectCode[]).includes(value as SubjectCode)
    ? (value as SubjectCode)
    : null
})
const subjectLabel = computed(() =>
  subjectCode.value === 'CHINESE' ? '语文' : subjectCode.value === 'MATH' ? '数学' : '英语',
)
const selectedId = computed(() =>
  subjectCode.value ? curriculumStore.selectedTextbooks[subjectCode.value] : null,
)

async function loadOptions() {
  if (!subjectCode.value) {
    error.value = '没有找到这个学科'
    loading.value = false
    return
  }
  if (
    !curriculumStore.selectedRegionId ||
    !curriculumStore.selectedGradeId ||
    !curriculumStore.selectedSemesterId
  ) {
    error.value = '请先完成地区、年级和学期选择'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  const resolution = await curriculumStore.resolveTextbooks()
  if (!resolution) {
    error.value = curriculumStore.error ?? '教材暂时无法加载'
    loading.value = false
    return
  }
  try {
    const [grades, semesters] = await Promise.all([
      curriculumService.getGrades(),
      curriculumService.getSemesters(),
    ])
    gradeName.value =
      grades.find((grade) => grade.id === curriculumStore.selectedGradeId)?.name ?? gradeName.value
    semesterName.value =
      semesters.find((semester) => semester.id === curriculumStore.selectedSemesterId)?.name ??
      semesterName.value
    const key =
      subjectCode.value === 'CHINESE'
        ? 'chinese'
        : subjectCode.value === 'MATH'
          ? 'math'
          : 'english'
    const displays = await Promise.all(
      resolution[key].availableTextbooks.map((textbook) =>
        curriculumService.getTextbookDisplay(textbook.id),
      ),
    )
    options.value = displays.filter((display): display is TextbookDisplay => Boolean(display))
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '教材选项暂时无法加载'
  } finally {
    loading.value = false
  }
}

function saveSelection(textbookId: string) {
  if (!subjectCode.value) return
  if (curriculumStore.selectTextbook(subjectCode.value, textbookId)) {
    void curriculumStore.confirmCurriculum('SAMPLE_STUDENT_01').then((profile) => {
      if (profile) router.push('/curriculum-settings')
    })
  }
}

onMounted(() => void loadOptions())
</script>

<template>
  <CurriculumPageFrame
    :title="`你正在更换${subjectLabel}课本`"
    description="只会修改这一门学科，其他学科教材保持不变。"
    :step="3"
    back-to="/curriculum-settings"
    context="我的学习设置"
  >
    <AppLoading v-if="loading" label="正在准备教材版本" />
    <AppErrorState
      v-else-if="error"
      title="教材选项暂时打不开"
      :description="error"
      @retry="loadOptions"
    />
    <section v-else class="curriculum-panel">
      <p class="curriculum-alert curriculum-alert--warning">
        请选择你正在使用的完整教材版本，不要只根据出版社简称判断。
      </p>
      <TextbookVersionSelector
        v-if="options.length"
        :options="options"
        :selected-id="selectedId"
        :grade-name="gradeName"
        :semester-name="semesterName"
        @select="saveSelection"
      />
      <p v-else class="curriculum-inline-empty">这个学科暂时没有可选教材版本。</p>
      <div class="curriculum-actions">
        <AppButton
          variant="ghost"
          icon-left="arrow-left"
          @click="router.push('/curriculum-settings')"
          >返回学习设置</AppButton
        >
      </div>
    </section>
  </CurriculumPageFrame>
</template>
