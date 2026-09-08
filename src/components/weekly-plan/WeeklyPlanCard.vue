<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import type { DailyLearningPlan, DailyLearningTask } from '@/types'
import {
  defaultWeeklyPlan,
  getLocalWeekStartDateKey,
  listWeeklyPlanCarryOvers,
  resolveWeeklyPlan,
  sameWeeklyTask,
  updateWeeklyPlanDay,
  weekDateKey,
  weeklyPlanStorage,
  type WeekdayIndex,
  type WeeklyPlan,
  type WeeklyTaskReference,
} from '@/services/weekly-plan'

const props = defineProps<{
  profileId: string
  dailyPlan: DailyLearningPlan | null
}>()

const emit = defineEmits<{
  refresh: []
  'open-task': [task: DailyLearningTask]
}>()

const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const selectedDay = ref<WeekdayIndex>(0)
const plan = ref<WeeklyPlan | null>(null)
const message = ref<string | null>(null)

function load(): void {
  if (!props.profileId) {
    plan.value = null
    return
  }
  const weekStart = getLocalWeekStartDateKey()
  const result = weeklyPlanStorage.load(props.profileId, weekStart)
  message.value = result.warning
  plan.value = result.value ?? defaultWeeklyPlan(props.profileId, weekStart)
  const dailyIndex = plan.value.days.find(
    (day) => weekDateKey(plan.value!.weekStartDateKey, day.weekday) === props.dailyPlan?.dateKey,
  )?.weekday
  selectedDay.value = dailyIndex ?? 0
}

watch(() => props.profileId, load, { immediate: true })
watch(
  () => props.dailyPlan?.dateKey,
  (nextDateKey) => {
    if (!plan.value || !nextDateKey) return
    const matching = plan.value.days.find(
      (day) => weekDateKey(plan.value!.weekStartDateKey, day.weekday) === nextDateKey,
    )
    if (matching) selectedDay.value = matching.weekday
  },
)

const viewModel = computed(() => (plan.value ? resolveWeeklyPlan(plan.value, props.dailyPlan) : null))
const activeDay = computed(() => viewModel.value?.days.find((day) => day.weekday === selectedDay.value))
const isToday = computed(() => activeDay.value?.dateKey === props.dailyPlan?.dateKey)
const availableTasks = computed(() =>
  isToday.value
    ? (props.dailyPlan?.tasks.filter((task) => task.status === 'pending') ?? [])
    : [],
)
const selectedTaskIds = computed(() => new Set(availableTasks.value
  .filter((task) => activeDay.value?.taskReferences.some((reference) => sameWeeklyTask(reference, task)))
  .map((task) => task.id)))
const selectedCount = computed(() => activeDay.value?.taskReferences.length ?? 0)
const completedCount = computed(() => activeDay.value?.completedCount ?? 0)
const targetCount = computed(() => activeDay.value?.targetCount ?? 0)

function chooseDay(day: WeekdayIndex): void {
  selectedDay.value = day
  message.value = viewModel.value?.warning ?? null
}

function setTarget(target: number): void {
  if (!plan.value) return
  const current = activeDay.value
  if (!current) return
  if (target < current.taskReferences.length) {
    message.value = '已选内容会保留；请先取消仍待完成的任务，再降低当天学习量。'
  }
  plan.value = updateWeeklyPlanDay(plan.value, current.weekday, { targetCount: target })
}

function toggleTask(task: DailyLearningTask): void {
  if (!plan.value || !activeDay.value || !isToday.value) return
  const next = new Set(selectedTaskIds.value)
  if (next.has(task.id)) next.delete(task.id)
  else if (next.size < activeDay.value.targetCount) next.add(task.id)
  else {
    message.value = `今天已选择 ${activeDay.value.targetCount} 项；先取消一项再调整。`
    return
  }
  plan.value = updateWeeklyPlanDay(plan.value, activeDay.value.weekday, {
    targetCount: activeDay.value.targetCount,
    tasks: availableTasks.value.filter((candidate) => next.has(candidate.id)),
    retainedTaskReferences: activeDay.value.taskReferences.filter(
      (reference) => reference.status !== 'pending' || !availableTasks.value.some((task) => sameWeeklyTask(reference, task)),
    ),
  })
}

function save(): void {
  if (!plan.value) return
  const result = weeklyPlanStorage.save(plan.value)
  plan.value = result.value
  message.value = result.warning ?? '已保存本周安排。'
  if (!result.warning) emit('refresh')
}

function referenceAsTask(reference: WeeklyTaskReference): DailyLearningTask {
  return {
    id: reference.id,
    profileId: props.profileId,
    type: reference.type,
    subject: reference.subject,
    textbookId: reference.textbookId,
    ...(reference.knowledgePointId ? { knowledgePointId: reference.knowledgePointId } : {}),
    ...(reference.lessonId ? { lessonId: reference.lessonId } : {}),
    sourceId: reference.sourceId,
    title: reference.title,
    ...(reference.description ? { description: reference.description } : {}),
    status: 'pending',
    priority: 1,
    action: reference.action,
  }
}

function openTask(reference: WeeklyTaskReference): void {
  emit('open-task', referenceAsTask(reference))
}

const carryOver = computed(() =>
  plan.value
    ? listWeeklyPlanCarryOvers(props.profileId, plan.value.weekStartDateKey, props.dailyPlan)
    : { value: [], warning: null },
)
</script>

<template>
  <section v-if="!profileId" class="weekly-plan-card" aria-label="本周学习计划不可用">
    <p class="weekly-plan-card__message" role="status">请选择学习档案后，再安排本周学习。</p>
  </section>
  <section v-else-if="viewModel && activeDay" class="weekly-plan-card" aria-labelledby="weekly-plan-title">
    <header class="weekly-plan-card__header">
      <div>
        <p class="weekly-plan-card__eyebrow">本周学习计划</p>
        <h2 id="weekly-plan-title">按自己的节奏安排</h2>
        <p>每天 1–5 项都可以，也可以安排休息日。没有完成的内容可以以后继续，不会变成欠账。</p>
      </div>
      <AppButton variant="secondary" size="sm" @click="save">保存安排</AppButton>
    </header>

    <p v-if="message" class="weekly-plan-card__message" role="status">{{ message }}</p>

    <div class="weekly-plan-card__days" aria-label="选择学习日">
      <button
        v-for="day in viewModel.days"
        :key="day.weekday"
        class="weekly-plan-card__day"
        :class="{ 'weekly-plan-card__day--active': day.weekday === selectedDay }"
        type="button"
        :aria-pressed="day.weekday === selectedDay"
        @click="chooseDay(day.weekday)"
      >
        <span>{{ weekdayLabels[day.weekday] }}</span>
        <small>{{ day.isRestDay ? '休息' : `${day.targetCount} 项` }}</small>
      </button>
    </div>

    <div class="weekly-plan-card__day-detail">
      <div class="weekly-plan-card__day-summary">
        <div>
          <h3>{{ weekdayLabels[selectedDay] }} · {{ activeDay.dateKey }}</h3>
          <p v-if="activeDay.isRestDay">今天安排休息。想学习时，仍可从首页自由选择一项继续。</p>
          <p v-else>目标 {{ targetCount }} 项，已完成 {{ completedCount }} 项。</p>
        </div>
        <AppProgress
          v-if="targetCount"
          :value="(completedCount / targetCount) * 100"
          :label="`${weekdayLabels[selectedDay]} 完成进度`"
          show-value
          state="success"
        />
      </div>

      <fieldset class="weekly-plan-card__target">
        <legend>今天想安排几项？</legend>
        <label v-for="count in [0, 1, 2, 3, 4, 5]" :key="count">
          <input
            :checked="targetCount === count"
            type="radio"
            name="weekly-plan-target"
            :value="count"
            @change="setTarget(count)"
          />
          {{ count === 0 ? '休息日' : `${count} 项` }}
        </label>
      </fieldset>

      <div v-if="isToday && targetCount" class="weekly-plan-card__choices">
        <h4>从今天真实可用的任务中选择</h4>
        <p v-if="!availableTasks.length">今天暂时没有可选任务；你仍可保留目标，稍后刷新首页再选。</p>
        <label v-for="task in availableTasks" :key="task.id" class="weekly-plan-card__task-choice">
          <input
            :checked="selectedTaskIds.has(task.id)"
            type="checkbox"
            :disabled="!selectedTaskIds.has(task.id) && selectedCount >= targetCount"
            @change="toggleTask(task)"
          />
          <span>{{ task.title }}</span>
        </label>
      </div>
      <p v-else-if="!isToday && targetCount" class="weekly-plan-card__hint">
        到这一天时，会从当天真实生成的学习任务中选择；现在只设定学习量，不预设完成结果。
      </p>

      <ul v-if="activeDay.taskReferences.length" class="weekly-plan-card__selected" aria-label="已选任务">
        <li v-for="task in activeDay.taskReferences" :key="task.id">
          <div>
            <strong>{{ task.title }}</strong>
            <span v-if="task.status === 'completed'">已按学习记录完成</span>
            <span v-else-if="task.status === 'unconfirmed'">暂时无法确认完成状态</span>
            <span v-else-if="task.canContinue">可跨日继续</span>
            <span v-else>待继续</span>
          </div>
          <AppButton v-if="task.status === 'pending'" variant="ghost" size="sm" @click="openTask(task)">
            继续
          </AppButton>
        </li>
      </ul>

      <div v-if="carryOver.value.length" class="weekly-plan-card__carry-over">
        <h4>上周想继续的内容</h4>
        <p>这些内容可以任选一项继续，不会加入今天的目标或累计成欠账。</p>
        <ul class="weekly-plan-card__selected">
          <li v-for="task in carryOver.value" :key="`${task.id}:${task.selectedAt}`">
            <div><strong>{{ task.title }}</strong><span>可跨周继续</span></div>
            <AppButton variant="ghost" size="sm" @click="openTask(task)">继续</AppButton>
          </li>
        </ul>
      </div>
      <p v-else-if="carryOver.warning" class="weekly-plan-card__message" role="status">{{ carryOver.warning }}</p>
    </div>
  </section>
</template>

<style scoped>
.weekly-plan-card { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid var(--color-border, #d7ded9); border-radius: 1rem; background: var(--color-surface, #fff); }
.weekly-plan-card__header, .weekly-plan-card__day-summary, .weekly-plan-card__selected li { display: flex; gap: 1rem; justify-content: space-between; align-items: flex-start; }
.weekly-plan-card h2, .weekly-plan-card h3, .weekly-plan-card h4, .weekly-plan-card p { margin: 0; }
.weekly-plan-card__header p { margin-top: .35rem; color: var(--color-text-muted, #57665e); }
.weekly-plan-card__eyebrow { color: var(--color-primary, #1d7a55) !important; font-size: .82rem; font-weight: 700; }
.weekly-plan-card__message { padding: .65rem .8rem; border-radius: .65rem; background: #fff7dc; color: #6d4d00; }
.weekly-plan-card__days { display: grid; grid-template-columns: repeat(7, minmax(3.8rem, 1fr)); gap: .4rem; overflow-x: auto; }
.weekly-plan-card__day { min-height: 3.75rem; display: grid; gap: .2rem; place-items: center; padding: .4rem; border: 1px solid var(--color-border, #d7ded9); border-radius: .65rem; background: transparent; color: inherit; cursor: pointer; }
.weekly-plan-card__day--active { border-color: var(--color-primary, #1d7a55); background: #e8f6ef; }
.weekly-plan-card__day small { color: var(--color-text-muted, #57665e); }
.weekly-plan-card__day-detail { display: grid; gap: 1rem; }
.weekly-plan-card__day-summary .app-progress { min-width: 9rem; }
.weekly-plan-card__target { display: flex; flex-wrap: wrap; gap: .5rem; padding: .75rem; border: 1px solid var(--color-border, #d7ded9); border-radius: .75rem; }
.weekly-plan-card__target legend { padding: 0 .25rem; font-weight: 700; }
.weekly-plan-card__target label, .weekly-plan-card__task-choice { min-height: 2.75rem; display: inline-flex; align-items: center; gap: .4rem; padding: .35rem .65rem; border-radius: .5rem; cursor: pointer; }
.weekly-plan-card__target label:has(input:checked), .weekly-plan-card__task-choice:has(input:checked) { background: #e8f6ef; }
.weekly-plan-card__choices { display: grid; gap: .45rem; }
.weekly-plan-card__task-choice { border: 1px solid var(--color-border, #d7ded9); }
.weekly-plan-card__hint { color: var(--color-text-muted, #57665e); }
.weekly-plan-card__selected { display: grid; gap: .5rem; padding: 0; margin: 0; list-style: none; }
.weekly-plan-card__carry-over { display: grid; gap: .5rem; padding-top: .25rem; border-top: 1px solid var(--color-border, #d7ded9); }
.weekly-plan-card__selected li { align-items: center; padding: .75rem; border-radius: .7rem; background: #f6f8f7; }
.weekly-plan-card__selected strong, .weekly-plan-card__selected span { display: block; }
.weekly-plan-card__selected span { margin-top: .2rem; color: var(--color-text-muted, #57665e); font-size: .9rem; }
@media (max-width: 560px) { .weekly-plan-card__header, .weekly-plan-card__day-summary { flex-direction: column; } .weekly-plan-card__day-summary .app-progress { width: 100%; } }
</style>
