<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { curriculumService } from '@/services/runtime'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import type { Grade, Semester, Subject, TextbookVersion } from '@/types'

const props = defineProps<{
  gradeId: string | null
  semesterId: string | null
  disabled?: boolean
}>()
const emit = defineEmits<{
  select: [selection: { gradeId: string; semesterId: string }]
  availability: [available: boolean]
}>()
const grades = ref<Grade[]>([])
const semesters = ref<Semester[]>([])
const subjects = ref<Subject[]>([])
const books = ref<TextbookVersion[]>([])
const loading = ref(true)
const error = ref('')
const labels = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
const subjectLabels = [
  { code: 'CHINESE', label: '语文' },
  { code: 'MATH', label: '数学' },
  { code: 'ENGLISH', label: '英语' },
]
const rows = computed(() =>
  labels.map((name, index) => {
    const grade = grades.value.find((item) => item.sortOrder === index + 1)
    return {
      name,
      terms: (['UPPER', 'LOWER'] as const).map((code) => {
        const term = semesters.value.find((item) => item.code === code)
        const counts = subjectLabels.map((subject) => ({
          ...subject,
          count:
            grade && term
              ? books.value.filter(
                  (book) =>
                    book.gradeId === grade.id &&
                    book.semesterId === term.id &&
                    book.subjectId ===
                      subjects.value.find((item) => item.code === subject.code)?.id,
                ).length
              : 0,
        }))
        return {
          gradeId: grade?.id,
          semesterId: term?.id,
          name: code === 'UPPER' ? '上册' : '下册',
          counts,
          available: counts.some((item) => item.count > 0),
          selected: Boolean(
            grade && term && props.gradeId === grade.id && props.semesterId === term.id,
          ),
        }
      }),
    }
  }),
)
const selectionAvailable = computed(
  () =>
    !loading.value &&
    !error.value &&
    rows.value.some((row) => row.terms.some((term) => term.selected && term.available)),
)
watch(selectionAvailable, (value) => emit('availability', Boolean(value)), { immediate: true })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [loadedGrades, loadedTerms, loadedSubjects, loadedBooks] = await Promise.all([
      curriculumService.getGrades(),
      curriculumService.getSemesters(),
      curriculumService.getSubjects(),
      curriculumService.getTextbookVersions(),
    ])
    grades.value = loadedGrades
    semesters.value = loadedTerms
    subjects.value = loadedSubjects
    books.value = loadedBooks
  } catch {
    error.value = '教材接入情况暂时无法读取，请重试。'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <section class="textbook-coverage" aria-label="小学教材接入总览">
    <div class="textbook-coverage__heading">
      <div>
        <p class="curriculum-eyebrow">教材接入总览</p>
        <h2>先看看，有哪些课本</h2>
      </div>
      <span class="curriculum-hint">所有账号共享 · 持续补充</span>
    </div>
    <p class="curriculum-hint">
      每格显示语文、数学、英语的版本数量。点击已接入的年级和册次，即可选择课本。
    </p>
    <AppLoading v-if="loading" label="正在读取教材接入情况" />
    <AppErrorState
      v-else-if="error"
      title="接入总览暂时无法加载"
      :description="error"
      @retry="load"
    />
    <div v-else class="textbook-coverage__rows">
      <div
        v-for="row in rows"
        :key="row.name"
        class="textbook-coverage__row"
        :aria-label="row.name"
      >
        <h3>{{ row.name }}</h3>
        <button
          v-for="term in row.terms"
          :key="term.name"
          type="button"
          class="textbook-coverage__term"
          :class="{
            'textbook-coverage__term--selected': term.selected,
            'textbook-coverage__term--missing': !term.available,
          }"
          :disabled="disabled || !term.available"
          :aria-pressed="term.selected"
          :aria-label="`${row.name}${term.name}：${term.counts.map((item) => `${item.label}${item.count ? `${item.count}个版本` : '未接入'}`).join('，')}`"
          @click="
            term.gradeId &&
            term.semesterId &&
            emit('select', { gradeId: term.gradeId, semesterId: term.semesterId })
          "
        >
          <span class="textbook-coverage__term-title"
            ><strong>{{ term.name }}</strong
            ><small>{{
              term.selected ? '当前选择' : term.available ? '可选择' : '暂未接入'
            }}</small></span
          >
          <span class="textbook-coverage__subjects">
            <span
              v-for="subject in term.counts"
              :key="subject.code"
              :class="subject.count ? 'textbook-coverage__available' : 'textbook-coverage__missing'"
            >
              {{ subject.label }} <b>{{ subject.count ? `${subject.count}版` : '缺失' }}</b>
            </span>
          </span>
        </button>
      </div>
    </div>
  </section>
</template>
