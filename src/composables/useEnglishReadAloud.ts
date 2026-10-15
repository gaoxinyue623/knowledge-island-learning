import basicAudio from '@/data/basic-english-audio.json'
import { productionConfig } from '@/config/production'
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
  const provider = ref<'browser' | 'bundled' | 'doubao'>('browser')
  const index = ref(0)
  const error = ref('')
  const current = computed(() => segments.value[index.value])
  const busy = computed(() => state.value === 'speaking' || state.value === 'starting')
  const bundledAudio = computed(() =>
    current.value ? (basicAudio as Record<string, string>)[current.value.text] : undefined,
  )
  const usingBundledAudio = computed(
    () =>
      (provider.value === 'bundled' || (provider.value === 'browser' && !voice.value)) &&
      Boolean(bundledAudio.value),
  )
  const unavailable = computed(() => {
    if (muted.value) return '应用已静音，请先在设置中关闭静音，再来听读。'
    if (provider.value === 'bundled' && !bundledAudio.value)
      return '这一句暂未配套基础音频，可以切换设备声音，或先看文字。'
    if (provider.value === 'doubao' && !import.meta.env.DEV)
      return '当前版本暂不提供联网合成，请切换基础音频与设备声音。'
    if (provider.value === 'browser' && !supported.value && !bundledAudio.value)
      return '这个浏览器暂不支持朗读，可以换一个支持语音朗读的浏览器试试。'
    if (provider.value === 'browser' && !voice.value && !bundledAudio.value)
      return '暂未找到英语声音。可以重试检测，或在设备设置中添加英语语音。'
    if (!segments.value.length) return '这部分暂时没有可朗读的英文，仍可阅读下面的原文。'
    return ''
  })
  let synth: SpeechSynthesis | undefined
  let utterance: SpeechSynthesisUtterance | undefined
  let audio: HTMLAudioElement | undefined
  let audioUrl: string | undefined
  let request: AbortController | undefined
  let generation = 0
  let timeout: ReturnType<typeof setTimeout> | undefined

  function clearTimer() {
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = undefined
  }

  function cancel() {
    generation += 1
    clearTimer()
    request?.abort()
    request = undefined
    if (audio) {
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio.removeAttribute('src')
      audio = undefined
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    audioUrl = undefined
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
    if (unavailable.value || !current.value) return
    if (provider.value === 'doubao') {
      void speakDoubao(single)
      return
    }
    if ((provider.value === 'bundled' || !voice.value) && bundledAudio.value) {
      void speakBundled(single)
      return
    }
    if (!synth || !voice.value) return
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

  async function speakBundled(single: boolean) {
    const source = bundledAudio.value
    if (!source) return
    if (activeReader && activeReader !== stop) activeReader()
    cancel()
    activeReader = stop
    const token = generation
    state.value = 'starting'
    error.value = ''
    const player = new Audio(source)
    audio = player
    player.playbackRate = rate.value / 0.85
    player.preservesPitch = true
    player.onended = () => {
      if (token !== generation) return
      cancel()
      if (single || mode.value === 'sentence') state.value = 'waiting'
      else if (index.value + 1 < segments.value.length) {
        index.value += 1
        speakCurrent()
      } else state.value = 'finished'
    }
    player.onerror = () => {
      if (token === generation) fail('基础音频暂时无法播放，可以重试，或先看文字练习。')
    }
    timeout = setTimeout(() => {
      if (token === generation) fail('基础音频等待过久，请重试。')
    }, 15000)
    try {
      await player.play()
      if (token === generation) {
        clearTimer()
        state.value = 'speaking'
        timeout = setTimeout(() => fail('播放中断，请重听这句。'), 60000)
      }
    } catch {
      if (token === generation) fail('基础音频未能播放，请点重听或先看文字练习。')
    }
  }

  async function speakDoubao(single: boolean) {
    if (productionConfig.isProduction) {
      fail('当前版本使用设备语音，请切换浏览器语音后朗读。')
      return
    }
    if (activeReader && activeReader !== stop) activeReader()
    cancel()
    activeReader = stop
    const token = generation
    error.value = ''
    state.value = 'starting'
    request = new AbortController()
    timeout = setTimeout(() => fail('豆包语音等待超时，请稍后重试或切回浏览器语音。'), 60000)
    try {
      const response = await fetch('/api/tts/doubao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Knowledge-TTS': '1' },
        body: JSON.stringify({ text: current.value!.text }),
        signal: request.signal,
      })
      if (token !== generation) return
      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        if (token === generation)
          fail(
            typeof detail?.message === 'string'
              ? detail.message
              : '豆包语音暂不可用，请检查本地配置或切回浏览器语音。',
          )
        return
      }
      if (!response.headers.get('Content-Type')?.includes('audio/mpeg'))
        throw new Error('Not audio')
      const blob = await response.blob()
      if (token !== generation) return
      if (!blob.size) throw new Error('Empty audio')
      audioUrl = URL.createObjectURL(blob)
      const player = new Audio(audioUrl)
      audio = player
      player.playbackRate = rate.value
      player.preservesPitch = true
      player.onended = () => {
        if (token !== generation) return
        cancel()
        if (single || mode.value === 'sentence') state.value = 'waiting'
        else if (index.value + 1 < segments.value.length) {
          index.value += 1
          speakCurrent()
        } else state.value = 'finished'
      }
      player.onerror = () => {
        if (token === generation) fail('音频播放失败，请重听或切回浏览器语音。')
      }
      await player.play()
      if (token !== generation) return
      clearTimer()
      state.value = 'speaking'
      timeout = setTimeout(() => fail('播放等待过久，请重听这句。'), 180000)
    } catch {
      if (token === generation)
        fail('豆包语音未能播放，请重试或切回浏览器语音；请确认本地服务正在运行。')
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
  watch([muted, rate, mode, provider], stop, { flush: 'sync' })
  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    supported.value = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance)
    if (!supported.value) return
    synth = window.speechSynthesis
    refreshVoice()
    synth.addEventListener('voiceschanged', refreshVoice)
  })
  onBeforeUnmount(() => {
    stop()
    synth?.removeEventListener('voiceschanged', refreshVoice)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    supported,
    usingBundledAudio,
    voice,
    state,
    mode,
    rate,
    provider,
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
