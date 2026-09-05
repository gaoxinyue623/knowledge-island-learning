<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ActivityProgress, ActivityResult, InteractiveActivity } from '@/types'

type Activity = Extract<InteractiveActivity, { activityType: 'simulation' }>
const props = defineProps<{ activity: Activity; progress?: ActivityProgress | null }>()
const emit = defineEmits<{ complete: [result: ActivityResult] }>()

const attempts = ref(props.progress?.attempts ?? 0)
const feedback = ref('')
const completed = ref(props.progress?.status === 'completed')
const walked = ref(
  props.activity.config.templateKey === 'number_line_walk'
    ? props.activity.config.parameters.start
    : 0,
)
const chosenShape = ref<string | null>(null)
const towerChoice = ref<string | null>(null)
const numberLine = computed(() =>
  props.activity.config.templateKey === 'number_line_walk'
    ? props.activity.config.parameters
    : { min: 0, max: 0, start: 0, target: 0 },
)
const hasNumberLine = computed(() => props.activity.config.templateKey === 'number_line_walk')
const towers = computed(() =>
  props.activity.config.templateKey === 'compare_towers' ? props.activity.config.parameters : null,
)
const shapes = ['circle', 'triangle', 'square', 'rectangle']
const shapeLabels: Record<string, string> = {
  circle: '圆形',
  triangle: '三角形',
  square: '正方形',
  rectangle: '长方形',
}

function complete(): void {
  completed.value = true
  feedback.value = '观察完成！'
  emit('complete', {
    activityId: props.activity.id,
    status: 'completed',
    attempts: attempts.value,
    completedAt: new Date().toISOString(),
  })
}

function walk(): void {
  if (!hasNumberLine.value || completed.value) return
  attempts.value += 1
  walked.value = Math.min(numberLine.value.max, walked.value + 1)
  if (walked.value === numberLine.value.target) complete()
  else feedback.value = '继续向前走一步。'
}

function chooseTower(choice: string): void {
  if (!towers.value || completed.value) return
  attempts.value += 1
  towerChoice.value = choice
  if (choice === towers.value.target) complete()
  else feedback.value = '再比较一下两座塔的数量。'
}

function chooseShape(shape: string): void {
  if (props.activity.config.templateKey !== 'shape_builder' || completed.value) return
  attempts.value += 1
  chosenShape.value = shape
  if (shape === props.activity.config.parameters.targetShape) complete()
  else feedback.value = '再想一想，哪种形状符合目标。'
}
</script>

<template>
  <div class="activity-task activity-simulation">
    <template v-if="hasNumberLine">
      <p class="activity-task__prompt">
        小朋友现在在 {{ walked }}，目标是 {{ numberLine.target }}。
      </p>
      <div class="simulation-line" aria-label="模拟数轴">
        <span
          v-for="point in Array.from(
            { length: numberLine.max - numberLine.min + 1 },
            (_, index) => numberLine.min + index,
          )"
          :key="point"
          :class="{ 'simulation-line__point--current': point === walked }"
          >{{ point }}</span
        >
      </div>
      <button class="activity-check-button" type="button" :disabled="completed" @click="walk">
        向前走一步
      </button>
    </template>
    <template v-else-if="towers">
      <div class="tower-scene" aria-label="两座数量不同的小塔">
        <div class="tower-scene__tower">
          <span v-for="block in towers.leftCount" :key="`left-${block}`"></span
          ><strong>左边</strong>
        </div>
        <div class="tower-scene__tower">
          <span v-for="block in towers.rightCount" :key="`right-${block}`"></span
          ><strong>右边</strong>
        </div>
      </div>
      <div class="activity-choice-grid activity-choice-grid--three">
        <button
          v-for="choice in ['left', 'same', 'right']"
          :key="choice"
          class="activity-choice"
          :class="{ 'activity-choice--selected': towerChoice === choice }"
          type="button"
          :disabled="completed"
          @click="chooseTower(choice)"
        >
          {{ choice === 'left' ? '左边更多' : choice === 'right' ? '右边更多' : '一样多' }}
        </button>
      </div>
    </template>
    <template v-else>
      <p class="activity-task__prompt">请选择你认为合适的形状，完成小屋的屋顶。</p>
      <div class="shape-builder" aria-label="形状积木选择">
        <button
          v-for="shape in shapes"
          :key="shape"
          class="shape-builder__piece"
          :class="[
            `shape-builder__piece--${shape}`,
            { 'shape-builder__piece--selected': chosenShape === shape },
          ]"
          type="button"
          :disabled="completed"
          @click="chooseShape(shape)"
        >
          {{ shapeLabels[shape] }}
        </button>
      </div>
    </template>
    <p class="activity-feedback" role="status">
      {{ feedback || '动手试一试，再观察发生了什么。' }}
    </p>
  </div>
</template>
