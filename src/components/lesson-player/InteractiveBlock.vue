<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { LessonContentBlockViewModel } from '@/types'

import LessonBlockShell from './LessonBlockShell.vue'

interface Props {
  block: LessonContentBlockViewModel
}

const props = defineProps<Props>()
const revealed = ref(false)
const activeProcessIndex = ref(0)
const selectedItemId = ref<string | null>(null)
const timerSeconds = ref(0)
const timerRunning = ref(false)
let timerHandle: ReturnType<typeof setInterval> | undefined

const interaction = computed(() => props.block.interaction)
const isProcessDemo = computed(() => interaction.value?.kind === 'STEP_DEMO')
const processSteps = computed(() => interaction.value?.processSteps ?? [])

function toggleReveal() {
  revealed.value = !revealed.value
}

function chooseItem(id: string) {
  selectedItemId.value = selectedItemId.value === id ? null : id
}

function nextProcessStep() {
  if (activeProcessIndex.value < processSteps.value.length - 1) activeProcessIndex.value += 1
}

function startTimer() {
  if (timerRunning.value) return
  timerRunning.value = true
  timerHandle = setInterval(() => {
    timerSeconds.value += 1
    const limit = interaction.value?.durationSeconds
    if (limit && timerSeconds.value >= limit) stopTimer()
  }, 1000)
}

function stopTimer() {
  timerRunning.value = false
  if (timerHandle) clearInterval(timerHandle)
  timerHandle = undefined
}

onBeforeUnmount(stopTimer)
</script>

<template>
  <LessonBlockShell eyebrow="动手观察" :title="props.block.title">
    <p v-if="props.block.content" class="lesson-block__content">{{ props.block.content }}</p>
    <div
      v-if="interaction"
      class="lesson-interaction"
      :class="`lesson-interaction--${interaction.kind.toLowerCase()}`"
    >
      <p class="lesson-interaction__prompt">{{ interaction.prompt }}</p>

      <div
        v-if="interaction.kind === 'REVEAL' || interaction.kind === 'TOGGLE'"
        class="lesson-interaction__reveal"
      >
        <AppButton variant="soft" size="sm" @click="toggleReveal">
          <AppIcon name="lightbulb" :size="18" decorative />
          {{ revealed ? '收起提示' : interaction.prompt }}
        </AppButton>
        <p
          v-if="revealed && interaction.revealText"
          class="lesson-interaction__reveal-copy"
          role="status"
        >
          {{ interaction.revealText }}
        </p>
      </div>

      <div v-else-if="isProcessDemo" class="lesson-interaction__process">
        <ol>
          <li
            v-for="(step, index) in processSteps"
            :key="step"
            :class="{ 'lesson-interaction__process-step--active': index <= activeProcessIndex }"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ step }}</strong>
          </li>
        </ol>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="activeProcessIndex >= processSteps.length - 1"
          @click="nextProcessStep"
        >
          展开下一步
        </AppButton>
      </div>

      <div v-else-if="interaction.kind === 'TIMER'" class="lesson-interaction__timer">
        <strong>{{ timerSeconds }} 秒</strong>
        <AppButton v-if="!timerRunning" variant="secondary" size="sm" @click="startTimer">
          开始体验
        </AppButton>
        <AppButton v-else variant="soft" size="sm" @click="stopTimer">暂停体验</AppButton>
      </div>

      <div v-else class="lesson-interaction__items" role="list" aria-label="观察项目">
        <button
          v-for="item in interaction.items"
          :key="item.id"
          class="lesson-interaction__item"
          :class="{ 'lesson-interaction__item--selected': selectedItemId === item.id }"
          type="button"
          :aria-pressed="selectedItemId === item.id"
          @click="chooseItem(item.id)"
        >
          <span>{{ item.label }}</span>
          <small v-if="item.description">{{ item.description }}</small>
        </button>
      </div>
    </div>
    <p v-else class="lesson-block__empty-copy">这段观察互动正在准备中。</p>
  </LessonBlockShell>
</template>
