<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'

defineProps<{
  characterId?: string
  name: string
  crown: string
  disabled: boolean
}>()

type Reaction = 'pet' | 'play' | 'feed'
const reaction = ref<Reaction | 'idle'>('idle')
const message = ref('')
const food = ref('')
const lookX = ref(0)
const lookY = ref(0)
const hidden = ref(false)
const reducedMotion = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let motionQuery: MediaQueryList | undefined
let patCount = 0
const durations = { pet: 2400, play: 2200, feed: 2800 }

function rest() {
  clearTimeout(timer)
  reaction.value = 'idle'
  message.value = ''
  food.value = ''
  lookX.value = lookY.value = 0
}
function interact(kind: Reaction, symbol = '') {
  // Let a gesture settle before accepting another; a saved feeding takes priority.
  if (hidden.value || (reaction.value !== 'idle' && kind !== 'feed')) return
  rest()
  reaction.value = kind
  food.value = symbol
  if (kind === 'pet') {
    const replies = ['嗯～再靠近你一点。', '嘿嘿，有一点痒！', '喜欢这样轻轻摸摸。']
    message.value = replies[patCount++ % replies.length]!
  } else {
    message.value = kind === 'play' ? '准备好啦……接住我的开心！' : '啊呜……好香呀，谢谢你！'
  }
  timer = setTimeout(rest, durations[kind])
}
function look(event: PointerEvent) {
  if (event.pointerType === 'touch' || reducedMotion.value || reaction.value !== 'idle') return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  lookX.value = Math.max(-4, Math.min(4, ((event.clientX - bounds.left) / bounds.width - 0.5) * 8))
  lookY.value = Math.max(-3, Math.min(3, ((event.clientY - bounds.top) / bounds.height - 0.5) * 6))
}
function resetLook() {
  lookX.value = lookY.value = 0
}
function visibilityChanged() {
  hidden.value = document.hidden
  if (hidden.value) rest()
}
function motionChanged() {
  reducedMotion.value = motionQuery?.matches ?? false
  if (reducedMotion.value) resetLook()
}
onMounted(() => {
  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  motionChanged()
  visibilityChanged()
  motionQuery?.addEventListener('change', motionChanged)
  document.addEventListener('visibilitychange', visibilityChanged)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  motionQuery?.removeEventListener('change', motionChanged)
  document.removeEventListener('visibilitychange', visibilityChanged)
})
defineExpose({ interact, reaction })
</script>

<template>
  <div
    class="pet-companion"
    :class="[`pet-companion--${reaction}`, { 'pet-companion--paused': hidden }]"
    :style="{ '--look-x': `${lookX}px`, '--look-y': `${lookY}px` }"
  >
    <div class="pet-companion-speech" role="status" aria-live="polite" aria-atomic="true">
      <span v-if="message" class="pet-companion-bubble">{{ message }}</span>
      <span v-else class="pet-companion-hint">{{
        disabled ? '我在这里等你，一起慢慢长大' : '轻轻点我，陪我待一会儿'
      }}</span>
    </div>
    <button
      type="button"
      class="pet-companion-touch"
      :disabled="disabled"
      :aria-label="`摸摸${name}`"
      @click="interact('pet')"
      @pointermove="look"
      @pointerleave="resetLook"
      @blur="resetLook"
    >
      <span class="pet-companion-crown" aria-hidden="true">{{ crown }}</span>
      <KnowledgeDangoPlaceholder size="lg" :character-id="characterId" :label="name" />
      <span v-if="reaction !== 'idle'" class="pet-companion-effects" aria-hidden="true">
        <span v-for="i in 3" :key="i" class="pet-companion-spark" :style="{ '--i': i }">{{
          reaction === 'pet' ? '♥' : '✦'
        }}</span>
      </span>
      <span v-if="reaction === 'feed'" class="pet-companion-food" aria-hidden="true">{{
        food
      }}</span>
    </button>
  </div>
</template>

<style scoped>
.pet-companion {
  position: relative;
  display: grid;
  justify-items: center;
  width: 100%;
}
.pet-companion-speech {
  display: grid;
  place-items: center;
  min-height: 48px;
  text-align: center;
  font-size: 0.85rem;
  padding: 0 6px;
  margin-bottom: 20px;
}
.pet-companion-bubble {
  position: relative;
  padding: 9px 15px;
  border-radius: 18px;
  background: #fffef5;
  box-shadow: 0 3px 12px #3851370c;
  animation: bubble-arrive 320ms ease-out both;
}
.pet-companion-bubble::after {
  content: '';
  position: absolute;
  left: calc(50% - 5px);
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: inherit;
  transform: rotate(45deg);
}
.pet-companion-hint {
  color: #465a40;
  padding: 6px 12px;
  border-radius: 16px;
  background: #fffef5dc;
}
.pet-companion-touch {
  position: relative;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 45%;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.pet-companion-touch:disabled {
  cursor: default;
}
.pet-companion-touch:focus-visible {
  outline: 3px solid #b97829;
  outline-offset: 6px;
}
.pet-companion-crown {
  position: absolute;
  top: -22px;
  left: calc(50% - 22px);
  width: 44px;
  font-size: 2.6rem;
  z-index: 1;
  transform-origin: center bottom;
  animation: crown-sway 6.8s ease-in-out infinite;
  pointer-events: none;
}
.pet-companion :deep(.dango-placeholder__body) {
  transform-origin: 50% 95%;
  animation: companion-breathe 5.6s ease-in-out infinite;
}
.pet-companion :deep(.dango-placeholder__face) {
  transform: translate(var(--look-x), var(--look-y));
  transition: transform 260ms ease-out;
}
.pet-companion :deep(.dango-placeholder__eye) {
  transform-origin: center;
  animation: companion-blink 7.3s linear infinite;
}
.pet-companion :deep(.dango-placeholder__arm) {
  transition: transform 400ms ease-in-out;
}
.pet-companion--pet :deep(.dango-placeholder__body) {
  animation: companion-nuzzle 2400ms cubic-bezier(0.37, 0, 0.25, 1) both;
}
.pet-companion--pet :deep(.dango-placeholder__eye) {
  animation: none;
  height: 22%;
  background: transparent;
  border-top: 3px solid var(--color-character-ink);
  border-radius: 50% 50% 0 0;
}
.pet-companion--pet :deep(.dango-placeholder__arm--right) {
  transform: rotate(-35deg);
}
.pet-companion--play :deep(.dango-placeholder__body) {
  animation: companion-hop 2200ms cubic-bezier(0.33, 0, 0.22, 1) both;
}
.pet-companion--play :deep(.dango-placeholder__shadow) {
  animation: companion-hop-shadow 2200ms ease-in-out both;
}
.pet-companion--play :deep(.dango-placeholder__arm--left) {
  transform-origin: right center;
  animation: companion-wave-left 2200ms ease-in-out both;
}
.pet-companion--play :deep(.dango-placeholder__arm--right) {
  transform-origin: left center;
  animation: companion-wave-right 2200ms ease-in-out both;
}
.pet-companion--feed :deep(.dango-placeholder__body) {
  animation: companion-munch 2800ms ease-in-out both;
}
.pet-companion--feed :deep(.dango-placeholder__mouth) {
  animation: companion-chew 430ms 650ms ease-in-out 4;
}
.pet-companion--pet .pet-companion-crown,
.pet-companion--play .pet-companion-crown {
  animation: crown-delight 2200ms 100ms ease-in-out both;
}
.pet-companion-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.pet-companion-spark {
  position: absolute;
  left: calc(16% + var(--i) * 17%);
  top: 25%;
  color: #d46e82;
  font-size: calc(15px + var(--i) * 3px);
  animation: companion-spark 1450ms calc(var(--i) * 170ms) ease-out both;
}
.pet-companion--play .pet-companion-spark,
.pet-companion--feed .pet-companion-spark {
  color: #a87728;
}
.pet-companion-food {
  position: absolute;
  left: calc(50% - 20px);
  top: 47%;
  font-size: 2.2rem;
  pointer-events: none;
  animation: companion-food 2800ms ease-in-out both;
}
@keyframes companion-breathe {
  0%,
  100% {
    transform: rotate(-2deg) scale(1, 1);
  }
  46% {
    transform: translateY(-2px) rotate(-1deg) scale(1.015, 1.025);
  }
}
@keyframes companion-blink {
  0%,
  39%,
  43%,
  76%,
  80%,
  83%,
  87%,
  100% {
    transform: scaleY(1);
  }
  41%,
  78%,
  85% {
    transform: scaleY(0.1);
  }
}
@keyframes crown-sway {
  0%,
  100% {
    transform: rotate(-4deg);
  }
  50% {
    transform: translateY(-3px) rotate(5deg);
  }
}
@keyframes companion-nuzzle {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  18% {
    transform: translateY(3px) rotate(3deg) scale(1.035, 0.97);
  }
  42% {
    transform: translateX(-5px) rotate(-8deg) scale(1.02, 0.98);
  }
  66% {
    transform: translateX(4px) rotate(6deg);
  }
  83% {
    transform: translateX(-1px) rotate(-3deg);
  }
}
@keyframes companion-hop {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  15% {
    transform: translateY(5px) scale(1.07, 0.91) rotate(-4deg);
  }
  34% {
    transform: translateY(-25px) scale(0.97, 1.04) rotate(6deg);
  }
  50% {
    transform: translateY(3px) scale(1.06, 0.94) rotate(1deg);
  }
  66% {
    transform: translateY(-10px) scale(0.99, 1.02) rotate(-4deg);
  }
  80% {
    transform: translateY(1px) scale(1.025, 0.98) rotate(-2deg);
  }
}
@keyframes companion-hop-shadow {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  34% {
    transform: scale(0.75);
    opacity: 0.55;
  }
  50%,
  80% {
    transform: scale(1.04);
    opacity: 1;
  }
  66% {
    transform: scale(0.88);
    opacity: 0.75;
  }
}
@keyframes companion-wave-left {
  0%,
  100% {
    transform: rotate(22deg);
  }
  32%,
  64% {
    transform: rotate(65deg);
  }
  48% {
    transform: rotate(38deg);
  }
}
@keyframes companion-wave-right {
  0%,
  100% {
    transform: rotate(-16deg);
  }
  36%,
  68% {
    transform: rotate(-65deg);
  }
  52% {
    transform: rotate(-32deg);
  }
}
@keyframes companion-munch {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  22% {
    transform: translateY(3px) rotate(3deg) scale(1.03, 0.98);
  }
  40%,
  65% {
    transform: translateY(1px) rotate(-2deg) scale(1.025, 0.975);
  }
  52%,
  78% {
    transform: translateY(-2px) rotate(1deg) scale(0.99, 1.02);
  }
}
@keyframes companion-chew {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.4, 0.55);
  }
}
@keyframes crown-delight {
  0%,
  100% {
    transform: rotate(-4deg);
  }
  30% {
    transform: translateY(-12px) rotate(12deg);
  }
  52% {
    transform: translateY(2px) rotate(-9deg);
  }
  74% {
    transform: translateY(-4px) rotate(4deg);
  }
}
@keyframes companion-spark {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.5);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(calc((var(--i) - 2) * 26px), -55px) scale(1.15) rotate(12deg);
  }
}
@keyframes companion-food {
  0% {
    opacity: 0;
    transform: translate(48px, 28px) rotate(20deg) scale(0.75);
  }
  22%,
  38% {
    opacity: 1;
    transform: translate(0, 0) rotate(-8deg) scale(1);
  }
  52% {
    opacity: 1;
    transform: scale(0.8) rotate(5deg);
  }
  68%,
  100% {
    opacity: 0;
    transform: translateY(-3px) scale(0.25);
  }
}
@keyframes bubble-arrive {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.pet-companion--paused *,
.pet-companion--paused :deep(*) {
  animation-play-state: paused !important;
}
@media (prefers-reduced-motion: reduce) {
  .pet-companion *,
  .pet-companion :deep(*) {
    animation: none !important;
    transition: none !important;
  }
  .pet-companion-effects {
    display: none;
  }
}
</style>
