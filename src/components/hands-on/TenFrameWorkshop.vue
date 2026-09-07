<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePieceTransfer } from '@/composables/usePieceTransfer'

const props = defineProps<{ a: number; b: number }>()
const root = ref<HTMLElement | null>(null)
const slots = ref<(number | null)[]>(Array(10).fill(null))
const message = ref('')
const valid = computed(
  () =>
    Number.isInteger(props.a) &&
    Number.isInteger(props.b) &&
    props.a > 0 &&
    props.a < 10 &&
    props.b > 0 &&
    props.b < 10 &&
    props.a + props.b >= 10,
)
const moved = computed(() => slots.value.filter((v) => v !== null).length)
const full = computed(() => moved.value === 10 - props.a)
const remaining = computed(() =>
  Array.from({ length: valid.value ? props.b : 0 }, (_, i) => i).filter(
    (i) => !slots.value.includes(i),
  ),
)
function place(piece: string, zone: string) {
  if (!valid.value) return
  const id = Number(piece),
    slot = Number(zone)
  if (!/^\d+$/.test(piece) || !remaining.value.includes(id)) return
  if (!/^\d+$/.test(zone) || slot < props.a || slot >= 10 || slots.value[slot] !== null) {
    message.value = '每格只能放一根小棒。找一个空格，再试一次。'
    return
  }
  slots.value[slot] = id
  message.value = full.value
    ? '十格框填满了！只是重新分组，小棒总数没有变。'
    : `你移了 ${moved.value} 根，还差 ${10 - props.a - moved.value} 根就满十。`
}
const transfer = usePieceTransfer(root, place)
function reset() {
  transfer.cancel()
  slots.value = Array(10).fill(null)
  message.value = ''
}
function undo() {
  const id = Math.max(-1, ...slots.value.filter((v): v is number => v !== null))
  const index = slots.value.indexOf(id)
  if (index >= 0) slots.value[index] = null
  transfer.cancel()
  message.value = '取回一根，再试着把十格框填满。'
}
watch(() => [props.a, props.b], reset)
</script>
<template>
  <section v-if="valid" ref="root" class="hands-on ten-workshop" aria-label="小棒凑十实验室">
    <p class="hands-on__eyebrow">动手实验室 · 原题之外再试试</p>
    <h3>把 {{ a }} 凑成十，需要搬几根？</h3>
    <p>拖动橙色小棒到空格；也可以先点小棒，再点空格。每格放一根。</p>
    <div class="ten-workshop__equation">{{ a }} ＋ {{ b }}<span>先摆一摆，不急着报答案</span></div>
    <div class="ten-workshop__frame" role="group" aria-label="十格框">
      <button
        v-for="(_, index) in 10"
        :key="index"
        type="button"
        :data-drop-zone="String(index)"
        :aria-label="`第${index + 1}格，${index < a || slots[index] !== null ? '已有一根小棒' : '空格，放入小棒'}`"
        :class="{
          'is-filled': index < a || slots[index] !== null,
          'is-moved': slots[index] !== null,
        }"
        @click="transfer.drop(String(index))"
      >
        <span v-if="index < a || slots[index] !== null" class="workshop-stick" aria-hidden="true" />
        <span v-else aria-hidden="true" class="ten-workshop__slot-number">{{ index + 1 }}</span>
      </button>
    </div>
    <p class="ten-workshop__pool-label">另一组小棒 · 还剩 {{ remaining.length }} 根</p>
    <div class="ten-workshop__pool" role="group" aria-label="可以移动的小棒">
      <button
        v-for="piece in remaining"
        :key="piece"
        type="button"
        class="workshop-piece"
        :aria-label="`选择第${piece + 1}根橙色小棒`"
        :aria-pressed="transfer.selected.value === String(piece)"
        @pointerdown="transfer.start($event, String(piece))"
        @click="transfer.choose(String(piece))"
      >
        <span class="workshop-stick workshop-stick--orange" aria-hidden="true" />
      </button>
    </div>
    <p role="status">
      {{
        message ||
        (transfer.selected.value !== null
          ? '小棒选好了，点一个空格放进去。'
          : '先看看十格框里空着几格。')
      }}
    </p>
    <div v-if="full" class="hands-on__success">
      <strong>{{ b }} 分成 {{ 10 - a }} 和 {{ b - (10 - a) }}</strong>
      <p>{{ a }} ＋ {{ 10 - a }} ＝ 10；10 ＋ {{ b - (10 - a) }} ＝ {{ a + b }}</p>
      <p>说一说：为什么这样搬，小棒的总数还是 {{ a + b }}？</p>
    </div>
    <div class="hands-on__actions">
      <button type="button" :disabled="moved === 0" @click="undo">取回一根</button
      ><button type="button" @click="reset">重新摆一摆</button>
    </div>
    <p class="hands-on__note">小棒可以反复摆，本次摆放离开后不保留。原来的闯关进度不受影响。</p>
    <span
      v-if="transfer.dragging.value"
      class="workshop-drag-ghost workshop-stick workshop-stick--orange"
      aria-hidden="true"
      :style="{ left: transfer.point.value.x + 'px', top: transfer.point.value.y + 'px' }"
    />
  </section>
</template>
<style src="../../styles/hands-on.css"></style>
