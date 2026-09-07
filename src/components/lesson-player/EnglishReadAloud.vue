<script setup lang="ts">
import { computed, ref, toRef, useId, watch } from 'vue'
import { Headphones, Pause, Play, RotateCcw, Square } from 'lucide-vue-next'

import AppButton from '@/components/common/AppButton.vue'
import { useEnglishReadAloud } from '@/composables/useEnglishReadAloud'
import {
  buildEnglishReadingSegments,
  type EnglishReadingSection,
} from '@/services/lesson-player/englishReading'
import type { LessonContentBlockViewModel } from '@/types'

const props = withDefaults(
  defineProps<{
    blocks: LessonContentBlockViewModel[]
    muted?: boolean
  }>(),
  { muted: false },
)
const id = useId()
const section = ref<EnglishReadingSection | 'all'>('all')
const sections: { value: EnglishReadingSection; label: string }[] = [
  { value: 'dialogue', label: '课文对话' },
  { value: 'chant', label: '歌谣' },
  { value: 'story', label: '小故事' },
  { value: 'words', label: '单词' },
]
const allSegments = computed(() => buildEnglishReadingSegments(props.blocks))
watch(
  () => props.blocks,
  () => {
    section.value = 'all'
  },
  { flush: 'sync' },
)
const availableSections = computed(() =>
  sections.filter((item) => allSegments.value.some((segment) => segment.section === item.value)),
)
const segments = computed(() =>
  section.value === 'all'
    ? allSegments.value
    : allSegments.value.filter((segment) => segment.section === section.value),
)
const {
  supported,
  voice,
  state,
  mode,
  rate,
  index,
  current,
  busy,
  unavailable,
  error,
  play,
  stop,
  select,
  move,
  replay,
  refreshVoice,
} = useEnglishReadAloud(segments, toRef(props, 'muted'))
const playLabel = computed(() => {
  if (busy.value) return '暂停'
  if (state.value === 'paused') return '继续这句'
  if (state.value === 'finished') return '再听一遍'
  return mode.value === 'sentence' ? '听这一句' : '开始连读'
})
const status = computed(() => {
  if (unavailable.value) return unavailable.value
  if (error.value) return error.value
  if (state.value === 'starting') return '正在准备声音…'
  if (state.value === 'speaking') return '仔细听，留意单词的发音。'
  if (state.value === 'paused') return '已暂停。继续时会从这句开头朗读。'
  if (state.value === 'waiting') return '轮到你啦！试着模仿读一遍，再听下一句。'
  if (state.value === 'finished') return '本次听读结束，试着自己读一遍吧。'
  return mode.value === 'sentence'
    ? '每次读一句，停下来等你跟读。不用打开麦克风。'
    : '从当前句接着读，也可以随时暂停、重听。'
})
</script>

<template>
  <section class="english-listener" :aria-labelledby="`${id}-title`">
    <header class="english-listener__heading">
      <span class="english-listener__icon" aria-hidden="true"><Headphones :size="25" /></span>
      <div>
        <h3 :id="`${id}-title`">英语跟读角</h3>
        <p>先听一听，再大声说出来</p>
      </div>
      <span class="english-listener__badge">听读 · 开口练习</span>
    </header>

    <div class="english-listener__options">
      <label :for="`${id}-section`"
        >朗读内容
        <select :id="`${id}-section`" v-model="section">
          <option value="all">全部英文</option>
          <option v-for="item in availableSections" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>
      <label :for="`${id}-mode`"
        >练习方式
        <select :id="`${id}-mode`" v-model="mode">
          <option value="sentence">逐句跟读</option>
          <option value="continuous">连续听读</option>
        </select>
      </label>
      <label :for="`${id}-rate`"
        >朗读语速
        <select :id="`${id}-rate`" v-model="rate">
          <option :value="0.7">慢慢读 · 0.7×</option>
          <option :value="0.85">跟读速度 · 0.85×</option>
          <option :value="1">正常速度 · 1×</option>
        </select>
      </label>
    </div>

    <div v-if="current" class="english-listener__sentence" :data-speaking="state === 'speaking'">
      <div class="english-listener__sentence-meta">
        <span>{{ sections.find((item) => item.value === current?.section)?.label }}</span>
        <span>第 {{ index + 1 }} / {{ segments.length }} 句（含单词）</span>
      </div>
      <span v-if="current.speaker" class="english-listener__speaker" lang="en">{{
        current.speaker
      }}</span>
      <p class="english-listener__text" lang="en">{{ current.text }}</p>
      <div class="english-listener__navigation">
        <AppButton
          variant="ghost"
          size="sm"
          icon-left="chevron-left"
          :disabled="index === 0 || !!unavailable"
          @click="move(-1)"
          >上一句</AppButton
        >
        <label class="english-listener__jump" :for="`${id}-sentence`">
          <span class="sr-only">选择朗读句子</span>
          <select
            :id="`${id}-sentence`"
            :value="index"
            @change="select(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="(segment, position) in segments" :key="segment.id" :value="position">
              {{ position + 1 }}. {{ segment.text }}
            </option>
          </select>
        </label>
        <AppButton
          variant="ghost"
          size="sm"
          icon-right="chevron-right"
          :disabled="index === segments.length - 1 || !!unavailable"
          @click="move(1)"
          >下一句</AppButton
        >
      </div>
    </div>

    <div class="english-listener__controls">
      <AppButton :disabled="!!unavailable" @click="play">
        <component :is="busy ? Pause : Play" :size="18" aria-hidden="true" />{{ playLabel }}
      </AppButton>
      <AppButton variant="secondary" :disabled="!!unavailable" @click="replay">
        <RotateCcw :size="18" aria-hidden="true" />重听这句
      </AppButton>
      <AppButton variant="ghost" :disabled="!busy && state !== 'paused'" @click="stop">
        <Square :size="16" aria-hidden="true" />停止
      </AppButton>
    </div>
    <p class="english-listener__status" role="status" aria-live="polite">{{ status }}</p>
    <a v-if="props.muted" class="english-listener__settings" href="/settings">前往声音设置</a>
    <AppButton v-else-if="supported && !voice" variant="secondary" @click="refreshVoice"
      >重新检测声音</AppButton
    >
    <p class="english-listener__source">
      设备合成朗读，不是教材原声；歌谣按文字朗读，不演唱。不录音、不评分。
      <span v-if="voice"
        >当前声音：{{ voice.name }}<span v-if="!voice.localService">（可能需要联网）</span>。</span
      >
    </p>
  </section>
</template>

<style src="../../styles/english-listener.css"></style>
