<script setup lang="ts">
import { recordLearningActivity } from '@/services/learning-activity/activityHistory'
import { readingStories } from '@/data/reading-islands'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { settleQuestPetReward } from '@/services/pet/petQuestRewards'
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'

import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import SortOrderActivity from '@/components/interactive-activity/SortOrderActivity.vue'
import MathQuestVisual from './MathQuestVisual.vue'
import { checkQuestAnswer, emptyQuestDraft } from '@/services/content-expansion/readingQuest'
import {
  browserQuestStorage,
  freshQuestProgress,
  questContentRevision,
  readQuestProgress,
  saveQuestProgress,
} from '@/services/content-expansion/questProgressStorage'
import type { ActivityResult, QuestionAnswerDraft } from '@/types'
import type { ReadingPracticeQuest } from '@/types/reading-quest'

const props = defineProps<{
  quest: ReadingPracticeQuest
  profileId: string
  readingLabel?: string
  note?: string
}>()
const petRewardWarning = ref('')
const attemptId = ref(''),
  completedAt = ref<string | undefined>()
function settleReward() {
  const activeScope = scope()
  void settleQuestPetReward(props.profileId, props.quest)
    .then(() => {
      if (scope() === activeScope) petRewardWarning.value = ''
    })
    .catch(() => {
      if (scope() === activeScope)
        petRewardWarning.value =
          '练习已保存，积分暂未结算。重新打开这组练习或再试一次，会自动重试。'
    })
}
const isMath = computed(() => props.quest.subject === 'MATH')
const readingLabel = computed(() => props.readingLabel ?? (isMath.value ? '回看知识' : '回看课文'))
const stageIndex = ref(0)
const passed = ref<string[]>([])
const mistakes = ref<string[]>([])
const reviewIds = ref<string[] | null>(null)
const summaryVisible = ref(false)
const round = ref(0)
const hintVisible = ref(false)
const hintStep = ref(0)
const helped = ref<string[]>([])
const feedback = ref('')
const selectedTiles = ref<number[]>([])
const draft = ref<QuestionAnswerDraft>({ type: 'singleChoice' })
const stageHeading = ref<HTMLElement | null>(null)
const summaryHeading = ref<HTMLElement | null>(null)
const completedStageIds = ref<string[]>([])
const storageWarning = ref<string | null>(null)
const writable = ref(false)
const resumed = ref(false)
const saved = ref(false)
const restartRequested = ref(false)
const revision = computed(() => questContentRevision(props.quest))
let loadedScope = ''
const scope = () => JSON.stringify([props.profileId, props.quest.id, revision.value])

const stages = computed(() =>
  props.quest.stages.filter((stage) => !reviewIds.value || reviewIds.value.includes(stage.id)),
)
const stage = computed(() => stages.value[stageIndex.value])
const question = computed(() => (stage.value?.kind === 'question' ? stage.value.question : null))
const isPassed = computed(() => Boolean(stage.value && passed.value.includes(stage.value.id)))
const isComplete = computed(
  () => stages.value.length > 0 && passed.value.length === stages.value.length,
)
const percentage = computed(() =>
  stages.value.length ? Math.round((passed.value.length / stages.value.length) * 100) : 0,
)
const canCheck = computed(
  () => question.value && checkQuestAnswer(question.value, draft.value) !== 'incomplete',
)
const prompt = computed(
  () => question.value?.stem.map((block) => block.text ?? '').join('\n') ?? '',
)
const isTraining = computed(() => Boolean(props.quest.training))
const hints = computed(() =>
  stage.value?.hints?.length ? stage.value.hints : [stage.value?.hint ?? ''],
)
const bands = [
  { id: 'foundation', label: '独立热身' },
  { id: 'reasoning', label: '方法进阶' },
  { id: 'transfer', label: '综合实战' },
] as const
const independentCount = computed(
  () =>
    passed.value.filter((id) => !mistakes.value.includes(id) && !helped.value.includes(id)).length,
)

function openHint(): void {
  hintVisible.value = !hintVisible.value
  if (stage.value && hintVisible.value && !helped.value.includes(stage.value.id))
    helped.value.push(stage.value.id)
}

function resetStage(): void {
  hintVisible.value = false
  hintStep.value = 0
  feedback.value = ''
  selectedTiles.value = []
  if (question.value) draft.value = emptyQuestDraft(question.value)
}

watch(() => stage.value?.id, resetStage, { immediate: true })
watch(
  () => [props.profileId, revision.value],
  () => {
    const result = readQuestProgress(browserQuestStorage(), props.profileId, props.quest)
    const data = result.data
    attemptId.value = data.attemptId ?? crypto.randomUUID()
    completedAt.value = data.completedAt
    reviewIds.value = data.reviewIds
    passed.value = data.passedIds
    mistakes.value = data.mistakeIds
    helped.value = data.helpedIds
    completedStageIds.value = data.completedStageIds
    stageIndex.value = Math.max(
      0,
      stages.value.findIndex((item) => item.id === data.activeStageId),
    )
    summaryVisible.value = data.summaryVisible
    storageWarning.value = result.warning
    writable.value = result.writable
    resumed.value = result.resumed
    saved.value = false
    restartRequested.value = false
    round.value += 1
    loadedScope = scope()
    resetStage()
    petRewardWarning.value = ''
    if (result.writable) {
      settleReward()
      if (data.completedAt) queueMicrotask(persist)
    }
  },
  { immediate: true, flush: 'sync' },
)

function persist(): void {
  if (!writable.value || loadedScope !== scope()) return
  const warning = saveQuestProgress(
    browserQuestStorage(),
    {
      ...freshQuestProgress(props.profileId, props.quest),
      passedIds: [...passed.value],
      mistakeIds: [...mistakes.value],
      helpedIds: [...helped.value],
      completedStageIds: [...completedStageIds.value],
      reviewIds: reviewIds.value ? [...reviewIds.value] : null,
      activeStageId: stage.value?.id ?? null,
      summaryVisible: summaryVisible.value,
      attemptId: attemptId.value,
      completedAt: completedAt.value,
    },
    props.quest,
  )
  storageWarning.value = warning
  saved.value = !warning
  if (!warning) {
    settleReward()
    if (
      summaryVisible.value &&
      completedAt.value &&
      !window.location.pathname.startsWith('/dev/')
    ) {
      try {
        const quest = props.quest as ReadingPracticeQuest & {
          textbookId?: string
          knowledgePointId?: string
          lessonId?: string
        }
        const lesson = productionCurriculumIndex.lessons.find((item) => item.id === quest.lessonId)
        const story = readingStories.find((item) =>
          window.location.pathname.endsWith('/' + item.id),
        )
        const query = new URLSearchParams({
          textbookId: quest.textbookId ?? '',
          knowledgePointId: quest.knowledgePointId ?? '',
          lessonId: lesson?.id ?? '',
          unitId: lesson?.unitId ?? '',
        })
        recordLearningActivity({
          id: `quest:${attemptId.value}`,
          profileId: props.profileId,
          contentId: props.quest.id,
          contentVersion: revision.value,
          kind: 'quest',
          title: lesson?.title ?? story?.title ?? '课后闯关',
          subject: props.quest.subject ?? (story?.language === 'english' ? 'ENGLISH' : 'CHINESE'),
          occurredAt: completedAt.value,
          completedCount: passed.value.length,
          mistakeCount: mistakes.value.length,
          href: lesson
            ? `/knowledge-point/${encodeURIComponent(quest.knowledgePointId!)}?${query}#knowledge-challenges`
            : window.location.pathname,
        })
      } catch {
        storageWarning.value = '闯关进度已保存，活动记录暂未更新；重新打开本组练习会重试。'
      }
    }
  }
}
watch(
  [passed, mistakes, helped, completedStageIds, reviewIds, stageIndex, summaryVisible],
  persist,
  { deep: true, flush: 'post' },
)
onBeforeUnmount(persist)
onDeactivated(persist)

function passStage(): void {
  if (!stage.value || isPassed.value) return
  passed.value.push(stage.value.id)
  if (!completedStageIds.value.includes(stage.value.id))
    completedStageIds.value.push(stage.value.id)
}

async function focusStage(): Promise<void> {
  await nextTick()
  stageHeading.value?.focus({ preventScroll: true })
  stageHeading.value?.closest('section')?.scrollIntoView?.({ block: 'start' })
}

function visit(index: number): void {
  if (index < 0 || index >= stages.value.length) return
  if (index > 0 && !stages.value.slice(0, index).every((item) => passed.value.includes(item.id)))
    return
  stageIndex.value = index
  summaryVisible.value = false
  void focusStage()
}

async function advance(): Promise<void> {
  if (!isPassed.value) return
  if (isComplete.value) {
    completedAt.value = new Date().toISOString()
    summaryVisible.value = true
    await nextTick()
    summaryHeading.value?.focus({ preventScroll: true })
  } else visit(stageIndex.value + 1)
}

function recordMistake(): void {
  if (stage.value && !mistakes.value.includes(stage.value.id)) mistakes.value.push(stage.value.id)
}

function completeActivity(result: ActivityResult): void {
  if (
    result.status !== 'completed' ||
    stage.value?.kind !== 'activity' ||
    result.activityId !== stage.value.activity.id
  )
    return
  passStage()
}

function check(): void {
  if (!question.value || !stage.value || isPassed.value) return
  const result = checkQuestAnswer(question.value, draft.value)
  if (result === 'incomplete') {
    feedback.value = '先完成你的答案，再来检查吧。'
  } else if (result === 'correct') {
    passStage()
    feedback.value = ''
  } else if (result === 'incorrect') {
    recordMistake()
    feedback.value = '还差一点点！可以修改答案再试一次，或打开小提示。'
  } else {
    feedback.value = '这道题适合一起讨论，不会自动判断对错。'
  }
}

function chooseOption(id: string): void {
  if (!question.value || isPassed.value) return
  feedback.value = ''
  if (question.value.questionType === 'multipleChoice') {
    const previous = draft.value.type === 'multipleChoice' ? draft.value.optionIds : []
    draft.value = {
      type: 'multipleChoice',
      optionIds: previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    }
  } else draft.value = { type: 'singleChoice', optionId: id }
}

function isSelected(id: string): boolean {
  return draft.value.type === 'singleChoice'
    ? draft.value.optionId === id
    : draft.value.type === 'multipleChoice' && draft.value.optionIds.includes(id)
}

function chooseBoolean(value: boolean): void {
  if (isPassed.value) return
  draft.value = { type: 'trueFalse', value }
  feedback.value = ''
}

function numberAnswer(value: string): void {
  if (isPassed.value || question.value?.questionType !== 'calculation') return
  draft.value = { type: 'calculation', value: value.replace(/[^0-9０-９]/g, '').slice(0, 3) }
  feedback.value = ''
}

function pressNumber(key: string): void {
  const value = draft.value.type === 'calculation' ? draft.value.value : ''
  numberAnswer(key === '退一格' ? value.slice(0, -1) : key === '清空' ? '' : value + key)
}

function updateTiles(indices: number[]): void {
  if (isPassed.value || stage.value?.kind !== 'question' || !stage.value.tiles) return
  selectedTiles.value = indices
  draft.value = {
    type: 'fillBlank',
    values: [
      indices
        .map((index) =>
          stage.value?.kind === 'question' ? (stage.value.tiles?.[index] ?? '') : '',
        )
        .join(''),
    ],
  }
  feedback.value = ''
}

function chooseTile(index: number): void {
  if (stage.value?.kind !== 'question' || !stage.value.tiles?.[index]) return
  if (stage.value.tileMode === 'word') updateTiles([index])
  else if (!selectedTiles.value.includes(index)) updateTiles([...selectedTiles.value, index])
}

function restart(onlyMistakes: boolean): void {
  attemptId.value = crypto.randomUUID()
  completedAt.value = undefined
  reviewIds.value = onlyMistakes && mistakes.value.length ? [...mistakes.value] : null
  stageIndex.value = 0
  passed.value = []
  mistakes.value = []
  helped.value = []
  summaryVisible.value = false
  restartRequested.value = false
  resumed.value = false
  round.value += 1
  resetStage()
  void focusStage()
}
</script>

<template>
  <div class="reading-quest">
    <header class="reading-quest__welcome">
      <KnowledgeDangoPlaceholder :state="isComplete ? 'success' : 'encourage'" size="sm" />
      <div>
        <span class="reading-quest__eyebrow">{{
          reviewIds ? '再练一遍，更有把握' : '团子陪你闯关'
        }}</span>
        <h3>
          {{
            reviewIds
              ? '这些关卡，再来试试看！'
              : isTraining
                ? '不只会答，还要会想、会用'
                : isMath
                  ? '学会一个方法，解开数学小谜题'
                  : '读懂一个故事，闯过一串小关卡'
          }}
        </h3>
        <p>一关一关来，不限时。答错没关系，找到线索再出发。</p>
      </div>
      <div class="reading-quest__counter">
        <strong
          >{{ passed.length }}<small> / {{ stages.length }}</small></strong
        ><span>关已通过</span>
      </div>
    </header>

    <div class="reading-quest__save-bar">
      <p role="status">
        {{
          storageWarning ??
          (resumed
            ? '已接上上次的进度，继续这一关吧。'
            : saved
              ? '闯关进度已保存在这台设备。'
              : '通过的关卡会自动保存，下次可以接着玩。')
        }}
      </p>
      <button
        v-if="!summaryVisible && (passed.length || reviewIds)"
        type="button"
        :aria-expanded="restartRequested"
        @click="restartRequested = !restartRequested"
      >
        从第一关重练
      </button>
    </div>
    <p v-if="petRewardWarning" role="status" class="reading-quest__storage-warning">
      {{ petRewardWarning }}
    </p>
    <section v-if="restartRequested" class="reading-quest__restart" aria-label="确认重练">
      <p>要从第一关重新练习吗？本轮答案和提示记录会重置，已通过的足迹仍保留。</p>
      <div class="reading-quest__actions">
        <AppButton variant="soft" @click="restartRequested = false">继续当前关卡</AppButton>
        <AppButton @click="restart(false)">确认重新练习</AppButton>
      </div>
    </section>

    <div
      class="reading-quest__progress"
      role="progressbar"
      aria-label="本次闯关进度"
      :aria-valuenow="passed.length"
      :aria-valuemin="0"
      :aria-valuemax="stages.length"
    >
      <span :style="{ width: percentage + '%' }" />
    </div>

    <ol v-if="isTraining && !reviewIds" class="quest-training__bands" aria-label="强化训练三个阶段">
      <li
        v-for="band in bands"
        :key="band.id"
        :aria-current="stage?.trainingBand === band.id && !summaryVisible ? 'step' : undefined"
      >
        <strong>{{ band.label }}</strong>
        <span
          >{{
            stages.filter((item) => item.trainingBand === band.id && passed.includes(item.id))
              .length
          }}
          / {{ stages.filter((item) => item.trainingBand === band.id).length }}</span
        >
      </li>
    </ol>

    <nav class="reading-quest__trail" aria-label="闯关路线">
      <button
        v-for="(item, index) in stages"
        :key="item.id"
        type="button"
        :class="{
          'is-current': !summaryVisible && index === stageIndex,
          'is-passed': passed.includes(item.id),
        }"
        :disabled="
          index > 0 && !stages.slice(0, index).every((previous) => passed.includes(previous.id))
        "
        :aria-current="!summaryVisible && index === stageIndex ? 'step' : undefined"
        :aria-label="
          '第' + (index + 1) + '关，' + item.title + (passed.includes(item.id) ? '，已通过' : '')
        "
        @click="visit(index)"
      >
        <span class="reading-quest__stop"
          ><AppIcon v-if="passed.includes(item.id)" name="check" :size="20" decorative /><template
            v-else
            >{{ index + 1 }}</template
          ></span
        >
        <span>{{ item.title }}</span>
      </button>
    </nav>

    <section
      v-if="summaryVisible"
      class="reading-quest__summary"
      aria-labelledby="quest-summary-title"
    >
      <KnowledgeDangoPlaceholder state="success" size="md" />
      <h3 id="quest-summary-title" ref="summaryHeading" tabindex="-1">这一轮，全部通过！</h3>
      <p>
        你完成了 {{ stages.length }} 个小关卡。{{
          isMath ? '选一道题，把你的方法讲给身边的人听吧。' : '再把喜欢的句子读给身边的人听吧。'
        }}
      </p>
      <p v-if="mistakes.length">有 {{ mistakes.length }} 关是重试后完成的，再练一遍会更熟悉。</p>
      <p v-if="isTraining">
        本轮首次独立通过 {{ independentCount }} 关；有
        {{ helped.length }} 关使用过提示。用过提示也值得再独立试一遍。
      </p>
      <div class="reading-quest__actions">
        <AppButton v-if="mistakes.length" @click="restart(true)">再练错过的关卡</AppButton>
        <AppButton variant="soft" @click="restart(false)">全部再闯一次</AppButton>
        <a href="/achievements">去宠物小屋</a>
        <a href="#knowledge-reading">{{ readingLabel }}</a>
      </div>
    </section>

    <section v-else-if="stage" class="reading-quest__stage" aria-labelledby="quest-stage-title">
      <div class="reading-quest__stage-heading">
        <div>
          <p class="reading-quest__eyebrow">第 {{ stageIndex + 1 }} / {{ stages.length }} 关</p>
          <h3 id="quest-stage-title" ref="stageHeading" tabindex="-1">{{ stage.title }}</h3>
        </div>
        <a href="#knowledge-reading"
          ><AppIcon name="book-open" :size="18" decorative />{{ readingLabel }}</a
        >
      </div>

      <template v-if="!isPassed">
        <aside v-if="stage.context" class="quest-training__context" aria-label="连续任务情境">
          <strong>带着这些线索，连续解决问题</strong>
          <p>{{ stage.context }}</p>
        </aside>
        <MathQuestVisual v-if="stage.visual" :key="round + ':' + stage.id" :visual="stage.visual" />
        <template v-if="stage.kind === 'question' && question">
          <p id="quest-question-prompt" class="reading-quest__prompt">{{ prompt }}</p>
          <fieldset
            v-if="question.options?.length"
            class="reading-quest__options"
            aria-describedby="quest-question-prompt"
          >
            <legend>
              {{
                question.questionType === 'multipleChoice'
                  ? isTraining
                    ? '选出所有符合条件的答案，再检查'
                    : `选择${question.answerRule.ruleType === 'MULTIPLE_OPTIONS' ? question.answerRule.correctOptionKeys.length : ''}个答案，再检查`
                  : '选择一个答案，再检查'
              }}
            </legend>
            <label
              v-for="option in question.options"
              :key="option.id"
              :class="{ 'is-selected': isSelected(option.id) }"
            >
              <input
                :type="question.questionType === 'multipleChoice' ? 'checkbox' : 'radio'"
                :name="question.id"
                :value="option.id"
                :checked="isSelected(option.id)"
                @change="chooseOption(option.id)"
              />
              <span class="reading-quest__option-key" aria-hidden="true">{{
                option.optionKey
              }}</span>
              <span>{{ option.content.map((block) => block.text).join(' ') }}</span>
            </label>
          </fieldset>

          <div
            v-else-if="question.questionType === 'trueFalse'"
            class="reading-quest__boolean"
            aria-label="选择判断答案"
          >
            <button
              v-for="value in [true, false]"
              :key="String(value)"
              type="button"
              :aria-pressed="draft.type === 'trueFalse' && draft.value === value"
              @click="chooseBoolean(value)"
            >
              <AppIcon :name="value ? 'check' : 'x'" :size="26" decorative />{{
                isMath ? (value ? '说法正确' : '说法不正确') : value ? '与原句一致' : '与原句不一致'
              }}
            </button>
          </div>

          <div v-else-if="question.questionType === 'calculation'" class="math-number-pad">
            <label for="math-number-answer">数字答案 <small>只填数字，单位看题目</small></label>
            <input
              id="math-number-answer"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              maxlength="3"
              :value="draft.type === 'calculation' ? draft.value : ''"
              @input="numberAnswer(($event.target as HTMLInputElement).value)"
              @keydown.enter.prevent="check"
            />
            <div aria-label="数字键盘">
              <button
                v-for="key in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清空', '0', '退一格']"
                :key="key"
                type="button"
                :aria-label="/^\d$/.test(key) ? '数字' + key : key"
                @click="pressNumber(key)"
              >
                {{ key }}
              </button>
            </div>
          </div>
          <div v-else-if="stage.tiles" class="reading-quest__tile-game">
            <p>
              {{
                stage.tileMode === 'letters'
                  ? '按顺序点字母；点上方已选字母可以退回。'
                  : stage.tileMode === 'characters'
                    ? '按顺序点汉字；多余的字不用选，点上方已选字可退回。'
                    : stage.tileMode === 'sequence'
                      ? '按顺序点数字和符号搭建算式；多余的卡不用选，已选卡片可以移回。'
                      : isMath
                        ? '点击下方数字或符号卡，把答案放进空格。'
                        : '点击下方字词卡，把答案放进空格。'
              }}
            </p>
            <div class="reading-quest__answer-slot" aria-label="我的答案" aria-live="polite">
              <button
                v-for="(tileIndex, index) in selectedTiles"
                :key="tileIndex"
                type="button"
                :aria-label="'移回第' + (index + 1) + '张：' + stage.tiles[tileIndex]"
                @click="updateTiles(selectedTiles.filter((item) => item !== tileIndex))"
              >
                {{ stage.tiles[tileIndex] }}
              </button>
              <span v-if="!selectedTiles.length">{{
                stage.tileMode === 'letters'
                  ? '你的单词会出现在这里'
                  : isMath
                    ? '把答案卡放到这里'
                    : '把字词放到这里'
              }}</span>
            </div>
            <div class="reading-quest__tiles" :aria-label="isMath ? '待选答案卡' : '待选字词卡'">
              <button
                v-for="(tile, index) in stage.tiles"
                :key="index"
                type="button"
                :disabled="selectedTiles.includes(index)"
                :aria-label="
                  tile +
                  (stage.tileMode === 'letters'
                    ? '，字母卡' + (index + 1)
                    : stage.tileMode === 'characters'
                      ? '，字卡' + (index + 1)
                      : '')
                "
                @click="chooseTile(index)"
              >
                {{ tile }}
              </button>
            </div>
            <button
              v-if="selectedTiles.length"
              class="reading-quest__clear"
              type="button"
              @click="updateTiles([])"
            >
              清空，重新选
            </button>
          </div>
        </template>

        <template v-else-if="stage.kind === 'activity'">
          <p class="reading-quest__prompt">{{ stage.activity.instruction }}</p>
          <DragMatchActivity
            v-if="stage.activity.activityType === 'drag_match'"
            :key="round + stage.id"
            :activity="stage.activity"
            :source-label="stage.sourceLabel"
            :target-label="stage.targetLabel"
            @complete="completeActivity"
            @attempt="!$event.correct && recordMistake()"
          />
          <SortOrderActivity
            v-else-if="stage.activity.activityType === 'sort_order'"
            :key="round + stage.id"
            :activity="stage.activity"
            @complete="completeActivity"
            @attempt="!$event.correct && recordMistake()"
          />
        </template>

        <div class="reading-quest__actions">
          <AppButton v-if="question" :disabled="!canCheck" @click="check">检查答案</AppButton>
          <button
            class="reading-quest__hint-toggle"
            type="button"
            :aria-expanded="hintVisible"
            aria-controls="quest-hint"
            @click="openHint"
          >
            <AppIcon name="lightbulb" :size="18" decorative />{{
              hintVisible ? '收起提示' : '给我一点提示'
            }}
          </button>
        </div>
        <p v-if="feedback" class="reading-quest__feedback" role="status">{{ feedback }}</p>
        <div v-if="hintVisible" id="quest-hint" class="reading-quest__hint" role="status">
          <p v-for="(hint, index) in hints.slice(0, hintStep + 1)" :key="index">{{ hint }}</p>
          <button
            v-if="hintStep + 1 < hints.length"
            type="button"
            class="reading-quest__hint-toggle"
            @click="hintStep += 1"
          >
            再给一步提示
          </button>
        </div>
      </template>

      <div v-else class="reading-quest__success" role="status">
        <span class="reading-quest__success-icon"
          ><AppIcon name="check" :size="28" decorative
        /></span>
        <div>
          <h4>这一关通过啦！</h4>
          <p>{{ stage.explanation }}</p>
        </div>
      </div>
      <div v-if="isPassed" class="reading-quest__actions">
        <AppButton icon-right="arrow-right" @click="advance">{{
          isComplete ? '查看闯关小结' : '下一关'
        }}</AppButton>
      </div>
    </section>
    <p class="reading-quest__note">
      {{
        props.note ??
        '这是课后拓展练习，闯关记录与教材掌握度分开保存，不计入正式错题本。未提交的答案不保存。'
      }}
    </p>
  </div>
</template>
