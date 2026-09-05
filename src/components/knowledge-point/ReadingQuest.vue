<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import SortOrderActivity from '@/components/interactive-activity/SortOrderActivity.vue'
import MathQuestVisual from './MathQuestVisual.vue'
import { checkQuestAnswer, emptyQuestDraft } from '@/services/content-expansion/readingQuest'
import type { ActivityResult, QuestionAnswerDraft } from '@/types'
import type { ReadingQuest } from '@/types/reading-quest'

const props = defineProps<{ quest: ReadingQuest; profileId: string }>()
const isMath = computed(() => props.quest.subject === 'MATH')
const readingLabel = computed(() => (isMath.value ? '回看知识' : '回看课文'))
const stageIndex = ref(0)
const passed = ref<string[]>([])
const mistakes = ref<string[]>([])
const reviewIds = ref<string[] | null>(null)
const summaryVisible = ref(false)
const round = ref(0)
const hintVisible = ref(false)
const feedback = ref('')
const selectedTiles = ref<number[]>([])
const draft = ref<QuestionAnswerDraft>({ type: 'singleChoice' })
const stageHeading = ref<HTMLElement | null>(null)
const summaryHeading = ref<HTMLElement | null>(null)

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

function resetStage(): void {
  hintVisible.value = false
  feedback.value = ''
  selectedTiles.value = []
  if (question.value) draft.value = emptyQuestDraft(question.value)
}

watch(() => stage.value?.id, resetStage, { immediate: true })
watch(
  () => [props.quest.id, props.profileId],
  () => restart(false),
)

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
  if (!isPassed.value) passed.value.push(stage.value.id)
}

function check(): void {
  if (!question.value || !stage.value || isPassed.value) return
  const result = checkQuestAnswer(question.value, draft.value)
  if (result === 'incomplete') {
    feedback.value = '先完成你的答案，再来检查吧。'
  } else if (result === 'correct') {
    passed.value.push(stage.value.id)
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
  reviewIds.value = onlyMistakes && mistakes.value.length ? [...mistakes.value] : null
  stageIndex.value = 0
  passed.value = []
  mistakes.value = []
  summaryVisible.value = false
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
      <div class="reading-quest__actions">
        <AppButton v-if="mistakes.length" @click="restart(true)">再练错过的关卡</AppButton>
        <AppButton variant="soft" @click="restart(false)">全部再闯一次</AppButton>
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
        <MathQuestVisual v-if="stage.visual" :key="stage.id" :visual="stage.visual" />
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
                  ? `选择${question.answerRule.ruleType === 'MULTIPLE_OPTIONS' ? question.answerRule.correctOptionKeys.length : ''}个答案，再检查`
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
                stage.tileMode === 'letters' ? '你的单词会出现在这里' : '把字词放到这里'
              }}</span>
            </div>
            <div class="reading-quest__tiles" aria-label="待选字词卡">
              <button
                v-for="(tile, index) in stage.tiles"
                :key="index"
                type="button"
                :disabled="selectedTiles.includes(index)"
                :aria-label="tile + (stage.tileMode === 'letters' ? '，字母卡' + (index + 1) : '')"
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
            @click="hintVisible = !hintVisible"
          >
            <AppIcon name="lightbulb" :size="18" decorative />{{
              hintVisible ? '收起提示' : '给我一点提示'
            }}
          </button>
        </div>
        <p v-if="feedback" class="reading-quest__feedback" role="status">{{ feedback }}</p>
        <p v-if="hintVisible" id="quest-hint" class="reading-quest__hint">{{ stage.hint }}</p>
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
    <p class="reading-quest__note">这是本页的课后拓展，不计入掌握度。离开页面后，可以重新挑战。</p>
  </div>
</template>
