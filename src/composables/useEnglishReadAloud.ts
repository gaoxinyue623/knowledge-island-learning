import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref } from 'vue'

import type { EnglishReadingSegment } from '@/services/lesson-player/englishReading'

type ReadingState = 'idle' | 'starting' | 'speaking' | 'paused' | 'waiting' | 'finished' | 'error'
let activeReader: (() => void) | undefined

export function useEnglishReadAloud(
  segments: Readonly<Ref<EnglishReadingSegment[]>>,
  muted: Readonly<Ref<boolean>>,
) {
  const supported = ref(false)
  const voice = shallowRef<SpeechSynthesisVoice | null>(null)
  const state = ref<ReadingState>('idle')
  const mode = ref<'sentence' | 'continuous'>('sentence')
  const rate = ref(0.85)
  const index = ref(0)
  const error = ref('')
  const current = computed(() => segments.value[index.value])
  const busy = computed(() => state.value === 'speaking' || state.value === 'starting')
  const unavailable = computed(() => {
    if (!supported.value) return '这个浏览器暂不支持朗读，可以换一个支持语音朗读的浏览器试试。'
    if (muted.value) return '应用已静音，请先在设置中关闭静音，再来听读。'
    if (!voice.value) return '暂未找到英语声音。可以重试检测，或在设备设置中添加英语语音。'
    if (!segments.value.length) return '这部分暂时没有可朗读的英文，仍可阅读下面的原文。'
    return ''
  })
  let synth: SpeechSynthesis | undefined
  let utterance: SpeechSynthesisUtterance | undefined
  let generation = 0
  let timeout: ReturnType<typeof setTimeout> | undefined

  function clearTimer() {
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = undefined
  }

  function cancel() {
    generation += 1
    clearTimer()
    const owned = utterance
    utterance = undefined
    if (owned) {
      owned.onstart = null
      owned.onend = null
      owned.onerror = null
      try {
        synth?.cancel()
      } catch {
        // A disconnected speech engine must not block normal reading or page navigation.
      }
    }
    if (activeReader === stop) activeReader = undefined
  }

  function stop() {
    cancel()
    state.value = 'idle'
    error.value = ''
  }

  function fail(message: string) {
    cancel()
    error.value = message
    state.value = 'error'
  }

  function refreshVoice() {
    if (!synth) return
    try {
      const voices = synth.getVoices().filter((item) => /^en(?:[-_]|$)/i.test(item.lang))
      voices.sort((a, b) => {
        const score = (item: SpeechSynthesisVoice) =>
          Number(item.localService) * 4 +
          Number(item.default) * 2 +
          Number(/^en[-_]GB$/i.test(item.lang))
        return (
          score(b) - score(a) ||
          a.name.localeCompare(b.name) ||
          a.voiceURI.localeCompare(b.voiceURI)
        )
      })
      voice.value = voices[0] ?? null
      if (!voice.value && utterance) stop()
    } catch {
      voice.value = null
      stop()
    }
  }

  function speakCurrent(single = false) {
    if (unavailable.value || !current.value || !synth || !voice.value) return
    if (activeReader && activeReader !== stop) activeReader()
    cancel()
    activeReader = stop
    const token = generation
    error.value = ''
    state.value = 'starting'
    try {
      const next = new SpeechSynthesisUtterance(current.value.text)
      utterance = next
      next.lang = voice.value.lang
      next.voice = voice.value
      next.rate = rate.value
      next.pitch = 1
      next.volume = 1
      next.onstart = () => {
        if (token !== generation) return
        clearTimer()
        state.value = 'speaking'
        timeout = setTimeout(() => {
          fail('朗读中断了，请检查设备声音或网络，然后重听这句。')
        }, 60000)
      }
      next.onend = () => {
        if (token !== generation) return
        cancel()
        if (single || mode.value === 'sentence') {
          state.value = 'waiting'
        } else if (index.value + 1 < segments.value.length) {
          index.value += 1
          speakCurrent()
        } else {
          state.value = 'finished'
        }
      }
      next.onerror = () => {
        if (token !== generation) return
        fail('暂时没能朗读，请检查设备声音或网络，再点一次朗读。')
      }
      timeout = setTimeout(() => {
        fail('朗读没有启动。请重试，或换一个支持语音朗读的浏览器。')
      }, 8000)
      if (synth.paused) synth.resume()
      synth.speak(next)
    } catch {
      fail('暂时没能朗读，请重试。下面的课文仍然可以阅读。')
    }
  }

  function play() {
    if (busy.value) {
      // Restarting the current short sentence also works on engines without reliable pause/resume.
      cancel()
      state.value = 'paused'
      return
    }
    if (state.value === 'finished') index.value = 0
    speakCurrent()
  }

  function select(nextIndex: number) {
    if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= segments.value.length) return
    stop()
    index.value = nextIndex
  }

  function move(offset: number) {
    const nextIndex = index.value + offset
    if (nextIndex < 0 || nextIndex >= segments.value.length) return
    select(nextIndex)
    speakCurrent(true)
  }

  function onVisibilityChange() {
    if (document.hidden) stop()
  }

  watch(
    segments,
    () => {
      stop()
      index.value = 0
    },
    { flush: 'sync' },
  )
  watch([muted, rate, mode], stop, { flush: 'sync' })
  onMounted(() => {
    supported.value = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance)
    if (!supported.value) return
    synth = window.speechSynthesis
    refreshVoice()
    synth.addEventListener('voiceschanged', refreshVoice)
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onBeforeUnmount(() => {
    stop()
    synth?.removeEventListener('voiceschanged', refreshVoice)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
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
    refreshVoice,
    replay: () => speakCurrent(true),
  }
}
