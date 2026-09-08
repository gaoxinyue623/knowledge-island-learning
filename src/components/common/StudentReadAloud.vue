<script lang="ts">
let activeStop: (() => void) | undefined
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    scope?: string
    muted?: boolean
    label?: string
  }>(),
  { scope: '', muted: false, label: '听题' },
)

const message = ref('')
const text = computed(() => props.text.trim())
const isPlaying = ref(false)
let generation = 0
let startTimer: ReturnType<typeof setTimeout> | undefined

function clearStartTimer(): void {
  if (startTimer !== undefined) clearTimeout(startTimer)
  startTimer = undefined
}

function stop(): void {
  generation += 1
  clearStartTimer()
  isPlaying.value = false
  message.value = ''
  if (activeStop === stop) {
    activeStop = undefined
    try {
      window.speechSynthesis?.cancel()
    } catch {
      // Device speech may disconnect while a learner changes questions.
    }
  }
}

function play(): void {
  if (props.muted) {
    message.value = '应用已静音，请先在设置中关闭静音，再来听读。'
    return
  }
  if (!text.value) {
    message.value = '这里暂时没有可朗读的内容，仍可阅读并继续学习。'
    return
  }
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    message.value = '这个浏览器暂不支持朗读，仍可阅读并继续学习。'
    return
  }
  activeStop?.()
  stop()
  const token = generation
  const utterance = new SpeechSynthesisUtterance(text.value)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.85
  utterance.onstart = () => {
    if (token !== generation) return
    message.value = '正在朗读。'
    clearStartTimer()
  }
  utterance.onend = () => {
    if (token !== generation) return
    isPlaying.value = false
    if (activeStop === stop) activeStop = undefined
    clearStartTimer()
    message.value = '朗读完成。'
  }
  utterance.onerror = () => {
    if (token !== generation) return
    isPlaying.value = false
    if (activeStop === stop) activeStop = undefined
    clearStartTimer()
    message.value = '暂时没能朗读，请检查设备声音后再试一次。'
  }
  try {
    // A student can switch from English reading to a question without two voices overlapping.
    window.speechSynthesis.cancel()
    activeStop = stop
    isPlaying.value = true
    message.value = '正在准备朗读。'
    startTimer = setTimeout(() => {
      if (token !== generation || activeStop !== stop) return
      stop()
      message.value = '朗读没有启动，请重试或检查设备声音。'
    }, 8000)
    window.speechSynthesis.speak(utterance)
  } catch {
    isPlaying.value = false
    if (activeStop === stop) activeStop = undefined
    clearStartTimer()
    message.value = '暂时没能朗读，请检查设备声音后再试一次。'
  }
}

watch([() => props.scope, () => props.text, () => props.muted], stop, { flush: 'sync' })
onBeforeUnmount(stop)
onDeactivated(stop)
</script>

<template>
  <div class="student-read-aloud" data-test="student-read-aloud">
    <button type="button" @click="play">{{ label }}</button>
    <button v-if="isPlaying" type="button" @click="stop">停止朗读</button>
    <p v-if="message" role="status">{{ message }}</p>
  </div>
</template>

<style scoped>
.student-read-aloud {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-block: 0.5rem;
}

.student-read-aloud button {
  min-height: 44px;
  min-width: 88px;
  padding: 0.55rem 0.85rem;
  border: 2px solid var(--color-primary, #2463eb);
  border-radius: 0.75rem;
  background: var(--color-surface, #fff);
  color: var(--color-primary, #2463eb);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.student-read-aloud p {
  margin: 0;
  color: var(--color-text-secondary, #4b5563);
  font-size: 0.9rem;
}
</style>
