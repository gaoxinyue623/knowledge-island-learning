<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import QuestionRenderer from '@/components/question-engine/QuestionRenderer.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import {
  buildAssessmentPapers,
  scopeCompleted,
  type AssessmentPaper,
} from '@/services/comprehensive-assessment/papers'
import {
  adaptQuestionToViewModel,
  buildAssessmentResultSummary,
} from '@/services/question-engine/questionEngineAdapter'
import {
  isQuestionAnswerComplete,
  validateQuestionAnswer,
} from '@/services/question-engine/answerValidator'
import { questionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import type {
  LearningMapViewModel,
  QuestionAnswerDraft,
  QuestionSession,
  QuestionViewModel,
} from '@/types'

const props = withDefaults(
  defineProps<{
    model: LearningMapViewModel
    unitId?: string
    unitAssessmentsOnMap?: boolean
  }>(),
  { unitId: undefined, unitAssessmentsOnMap: false },
)
const { profileId } = useLearningProfile()
const selection = ref<{ unitId?: string; title: string } | null>(null)
const unitModalOpen = ref(false)
const active = ref<AssessmentPaper | null>(null)
const session = ref<QuestionSession | null>(null)
const current = ref<QuestionViewModel | null>(null)
const error = ref('')
const busy = ref(false)
let revision = 0
const unitScope = computed(() => {
  const island = props.model.islands.find((entry) => entry.unitId === props.unitId)
  return island
    ? {
        unitId: island.unitId,
        title: island.title,
        complete: scopeCompleted(props.model, island.unitId),
      }
    : null
})
const scopes = computed(() => [
  ...props.model.islands
    .filter((island) => {
      if (props.unitId) return island.unitId === props.unitId
      return !props.unitAssessmentsOnMap
    })
    .map((island) => ({
      unitId: island.unitId,
      title: island.title,
      complete: scopeCompleted(props.model, island.unitId),
    })),
  ...(!props.unitId
    ? [
        {
          unitId: undefined,
          title: '整本教材 · 期末综合测验',
          complete: scopeCompleted(props.model),
        },
      ]
    : []),
])
const finalOnly = computed(() => props.unitAssessmentsOnMap && !props.unitId)
const assessmentContainer = computed(() => (props.unitId ? AppModal : 'div'))
const modalProps = computed(() =>
  props.unitId
    ? {
        open: unitModalOpen.value,
        title: '学完一程，测测自己',
        description: unitScope.value?.title ?? '单元综合测验',
      }
    : {},
)
const papers = computed(() =>
  selection.value ? buildAssessmentPapers(props.model, selection.value.unitId) : [],
)
const overlap = computed(() =>
  papers.value.some((paper, i) =>
    papers.value
      .slice(i + 1)
      .some((other) => paper.questions.some((q) => other.questions.some((o) => o.id === q.id))),
  ),
)
const summary = computed(() =>
  session.value?.status === 'completed' && active.value
    ? buildAssessmentResultSummary(session.value, active.value.questions)
    : null,
)
const answered = computed(
  () =>
    active.value?.questions.filter((q) => {
      const a = session.value?.attempts.find((a) => a.questionId === q.id)
      return a && isQuestionAnswerComplete(q, a.answer)
    }).length ?? 0,
)

function saved(paper: AssessmentPaper) {
  if (!profileId.value) return null
  return questionSessionStorage.get(`comprehensive-session:${profileId.value}:${paper.id}`)
}
function persist() {
  if (!session.value) return
  session.value.updatedAt = new Date().toISOString()
  questionSessionStorage.save(session.value)
  error.value = questionSessionStorage.getLastWarning() ?? ''
}
async function renderCurrent() {
  const token = ++revision
  if (!active.value || !session.value) return
  const q = active.value.questions[session.value.currentQuestionIndex]
  if (!q) return
  try {
    const vm = await adaptQuestionToViewModel(
      q,
      session.value.attempts.find((a) => a.questionId === q.id),
    )
    if (token === revision) current.value = vm
  } catch {
    if (token === revision) error.value = '题目暂时无法显示，请重新打开试卷。'
  }
}
async function start(paper: AssessmentPaper, restart = false) {
  if (!profileId.value) return
  error.value = ''
  const existing = saved(paper)
  current.value = null
  active.value = paper
  session.value =
    !restart &&
    existing &&
    existing.questionIds.join('|') === paper.questions.map((q) => q.id).join('|')
      ? existing
      : {
          id: `comprehensive-session:${profileId.value}:${paper.id}`,
          assessmentId: paper.id,
          textbookId: props.model.textbook.id,
          unitId: selection.value?.unitId ?? 'final',
          lessonId: 'comprehensive',
          knowledgePointId: 'comprehensive',
          questionIds: paper.questions.map((q) => q.id),
          currentQuestionIndex: 0,
          status: 'in_progress',
          attempts: [],
          startedAt: new Date().toISOString(),
        }
  persist()
  await renderCurrent()
}
function updateDraft(answer: QuestionAnswerDraft) {
  if (!session.value || !current.value || session.value.status === 'completed') return
  current.value.answerDraft = answer
  const attempts = session.value.attempts
  const found = attempts.find((a) => a.questionId === current.value!.id)
  if (found) found.answer = answer
  else attempts.push({ questionId: current.value.id, answer, submitted: false })
  persist()
  void renderCurrent()
}
async function move(index: number) {
  if (!session.value) return
  current.value = null
  session.value.currentQuestionIndex = index
  persist()
  await renderCurrent()
}
async function submit() {
  if (
    !active.value ||
    !session.value ||
    answered.value !== active.value.questions.length ||
    busy.value
  )
    return
  busy.value = true
  try {
    for (const q of active.value.questions) {
      const attempt = session.value.attempts.find((a) => a.questionId === q.id)!
      attempt.result = validateQuestionAnswer(q, attempt.answer)
      attempt.submitted = true
      attempt.submittedAt = new Date().toISOString()
      attempt.questionVersion = q.questionVersion
    }
    session.value.status = 'completed'
    session.value.completedAt = new Date().toISOString()
    persist()
    await renderCurrent()
  } finally {
    busy.value = false
  }
}
function selectScope(scope: { unitId?: string; title: string }) {
  closePaper()
  selection.value = scope
}
function openUnitAssessment() {
  if (!unitScope.value) return
  selectScope(unitScope.value)
  unitModalOpen.value = true
}
function closeUnitAssessment() {
  unitModalOpen.value = false
  closePaper()
  selection.value = null
}
function closePaper() {
  ++revision
  active.value = null
  session.value = null
  current.value = null
  error.value = ''
}
watch(
  () => [props.model.textbook.id, profileId.value, props.unitId],
  () => {
    unitModalOpen.value = false
    closePaper()
    selection.value = null
  },
)
</script>

<template>
  <div v-if="props.unitId" class="unit-assessment-entry">
    <strong>学完一程，测测自己</strong>
    <AppButton
      size="sm"
      variant="secondary"
      :disabled="model.flags.isReadOnly || !profileId"
      @click="openUnitAssessment"
    >
      {{ unitScope?.complete ? '测测自己' : '学校已学过，先测一测' }}
    </AppButton>
  </div>
  <component :is="assessmentContainer" v-bind="modalProps" @close="closeUnitAssessment">
    <section
      class="comprehensive-assessments"
      :class="{ 'comprehensive-assessments--dialog': Boolean(props.unitId) }"
      aria-label="单元与期末测验"
    >
      <template v-if="!props.unitId">
        <h2>{{ finalOnly ? '整本教材 · 期末测验' : '学完一程，测测自己' }}</h2>
        <p>
          {{
            finalOnly
              ? '单元测评已放在地图对应单元旁；可自行选择综合测验，支持中途保存，不会直接完成课程节点。'
              : '已在学校学过的内容，可以直接检查理解；试卷结果独立保存，不会直接完成课程节点。'
          }}
        </p>
      </template>
      <div v-if="!props.unitId" class="assessment-scopes">
        <div v-for="scope in scopes" :key="scope.unitId ?? 'final'" class="assessment-scope">
          <strong>{{ scope.title }}</strong>
          <AppButton
            variant="secondary"
            :disabled="model.flags.isReadOnly || !profileId"
            @click="selectScope(scope)"
          >
            {{ scope.complete ? '选择试卷' : '提前检查理解' }}
          </AppButton>
        </div>
      </div>
      <section v-if="selection" class="assessment-selection" aria-label="选择测验试卷">
        <h3>{{ selection.title }}</h3>
        <template v-if="!active">
          <p v-if="!papers.length">
            这个范围暂无可用的自动测验。开放活动请按栏目要求完成作品并交流。
          </p>
          <p
            v-if="
              papers.some((paper) => paper.questions.some((q) => q.questionType === 'shortAnswer'))
            "
          >
            开放题交卷后提供参考表达或检查要点，可请家长或老师协助评阅；不计入客观题正确率。
          </p>
          <p v-if="overlap">当前题库有限，三套试卷会有部分重复题；各卷覆盖与题量如下。</p>
          <div v-for="paper in papers" :key="paper.id" class="assessment-scope">
            <div>
              <strong>{{ paper.title }}</strong>
              <p>
                {{ paper.questions.length }}题 · 覆盖{{ paper.coveredPoints }}/{{
                  paper.totalPoints
                }}个知识点
              </p>
              <p>
                客观题
                {{ paper.questions.filter((q) => q.questionType !== 'shortAnswer').length }}题 ·
                开放题
                {{ paper.questions.filter((q) => q.questionType === 'shortAnswer').length }}题
              </p>
              <span v-if="saved(paper)?.status === 'completed'">已完成，可查看结果或重新测验</span>
            </div>
            <AppButton @click="start(paper)">{{
              saved(paper)?.status === 'completed'
                ? '查看结果'
                : saved(paper)
                  ? '继续测验'
                  : '开始测验'
            }}</AppButton>
          </div>
          <AppButton v-if="!props.unitId" variant="ghost" @click="selection = null">
            收起试卷
          </AppButton>
        </template>
        <template v-else-if="session">
          <h3>{{ active.title }}</h3>
          <div v-if="summary" role="status">
            <h3>
              {{
                summary.percentage === null
                  ? '本卷需要对照参考答案检查'
                  : `客观题正确率 ${summary.percentage}%`
              }}
            </h3>
            <p>
              答对{{ summary.correctCount }}题，答错{{ summary.incorrectCount }}题，开放题{{
                summary.manualReviewCount
              }}题。开放题请对照参考答案自行检查。
            </p>
            <p>
              {{
                error
                  ? '测验已完成，但本机保存失败。请保持页面并重试保存。'
                  : '测验结果已保存在本机，可逐题查看答案和解析。'
              }}
            </p>
            <AppButton variant="secondary" @click="start(active, true)">重新测验</AppButton>
          </div>
          <p v-else>
            已作答 {{ answered }}/{{ active.questions.length }}题 · 交卷后统一显示答案与解析
          </p>
          <nav class="assessment-numbers" aria-label="题号导航">
            <button
              v-for="(q, i) in active.questions"
              :key="q.id"
              :aria-current="session.currentQuestionIndex === i ? 'step' : undefined"
              :aria-label="`第${i + 1}题${session.attempts.some((a) => a.questionId === q.id) ? '，已作答' : ''}`"
              @click="move(i)"
            >
              {{ i + 1
              }}{{
                session.attempts.some(
                  (a) => a.questionId === q.id && isQuestionAnswerComplete(q, a.answer),
                )
                  ? ' ✓'
                  : ''
              }}
            </button>
          </nav>
          <QuestionRenderer v-if="current" :question="current" @update-draft="updateDraft" />
          <div class="assessment-actions">
            <AppButton
              variant="secondary"
              :disabled="session.currentQuestionIndex === 0"
              @click="move(session.currentQuestionIndex - 1)"
              >上一题</AppButton
            >
            <AppButton
              variant="secondary"
              :disabled="session.currentQuestionIndex === active.questions.length - 1"
              @click="move(session.currentQuestionIndex + 1)"
              >下一题</AppButton
            >
            <AppButton
              v-if="!summary"
              :disabled="answered !== active.questions.length || busy"
              @click="submit"
              >交卷</AppButton
            >
            <AppButton variant="ghost" @click="closePaper">返回选卷</AppButton>
          </div>
          <p v-if="!summary && answered !== active.questions.length">
            还有{{ active.questions.length - answered }}题未答完，完成后即可交卷。
          </p>
        </template>
        <p v-if="error" role="alert">{{ error }}</p>
        <AppButton v-if="error && session" variant="secondary" @click="persist">重试保存</AppButton>
      </section>
    </section>
  </component>
</template>

<style scoped>
.unit-assessment-entry {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  padding: 8px 10px;
  border: 1px solid #e4d5ad;
  border-radius: 14px;
  background: rgb(255 253 246 / 94%);
}
.unit-assessment-entry strong {
  color: #684f25;
  font-size: 12px;
  white-space: nowrap;
}
.unit-assessment-entry :deep(.app-button) {
  flex: 0 0 auto;
  min-height: 40px;
  padding-inline: 12px;
}
.comprehensive-assessments {
  margin: 24px 0;
  padding: 24px;
  border-radius: 24px;
  background: var(--color-surface, #fff);
  border: 1px solid #dce6ed;
}
.comprehensive-assessments--dialog {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.comprehensive-assessments h2,
h3 {
  margin-bottom: 12px;
}
.comprehensive-assessments p {
  margin: 10px 0;
  color: #526779;
}
.assessment-scopes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.assessment-scope {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: #f4f8fb;
  border-radius: 16px;
}
.assessment-selection {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #dce6ed;
}
.assessment-selection .assessment-scope {
  margin: 12px 0;
}
.assessment-numbers,
.assessment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
.assessment-numbers button {
  border: 1px solid #c6d8e5;
  background: #f4f8fb;
  padding: 8px 12px;
  border-radius: 8px;
}
.assessment-numbers button[aria-current] {
  background: #d4eafb;
  border-color: #2974a6;
}
</style>
