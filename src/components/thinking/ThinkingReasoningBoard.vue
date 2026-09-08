<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ThinkingDraft, ThinkingPuzzle } from '@/types/thinking'
import { thinkingLights } from '@/services/thinking/thinkingValidator'
const props = defineProps<{
  puzzle: Extract<ThinkingPuzzle, { kind: 'switches' | 'sudoku' }>
  draft: ThinkingDraft
}>()
const emit = defineEmits<{ change: [draft: ThinkingDraft] }>()
const selectedCell = ref<number | null>(null)
const moves = computed(() => props.draft as string[])
const numbers = computed(() => props.draft as number[])
const lights = computed(() =>
  props.puzzle.kind === 'switches' ? thinkingLights(props.puzzle, moves.value) : [],
)
function fill(value: number) {
  if (
    props.puzzle.kind !== 'sudoku' ||
    selectedCell.value === null ||
    props.puzzle.givens[selectedCell.value]
  )
    return
  const next = [...numbers.value]
  next[selectedCell.value] = value
  emit('change', next)
}
</script>
<template>
  <div v-if="puzzle.kind === 'switches'" class="thinking-switch-game">
    <div class="thinking-light-panel">
      <div>
        <h3>目标灯光</h3>
        <ol class="thinking-lights" aria-label="目标灯光">
          <li v-for="(on, i) in puzzle.target" :key="i" :class="{ 'is-on': on }">
            <span aria-hidden="true">{{ on ? '☀' : '○' }}</span
            ><strong>{{ i + 1 }} · {{ on ? '亮' : '暗' }}</strong>
          </li>
        </ol>
      </div>
      <div>
        <h3>当前灯光</h3>
        <ol class="thinking-lights" aria-label="当前灯光" aria-live="polite">
          <li v-for="(on, i) in lights" :key="i" :class="{ 'is-on': on }">
            <span aria-hidden="true">{{ on ? '☀' : '○' }}</span
            ><strong>{{ i + 1 }} · {{ on ? '亮' : '暗' }}</strong>
          </li>
        </ol>
      </div>
    </div>
    <p class="thinking-switch-count" role="status">
      已按 {{ moves.length }} / {{ puzzle.maxMoves }} 次{{
        moves.length === puzzle.maxMoves ? ' · 次数已用完，可以检查或撤回' : ''
      }}
    </p>
    <div class="thinking-switch-controls" aria-label="联动开关">
      <button
        v-for="control in puzzle.switches"
        :key="control.id"
        type="button"
        :disabled="moves.length >= puzzle.maxMoves"
        @click="emit('change', [...moves, control.id])"
      >
        <strong>{{ control.label }}</strong
        ><span>反转灯 {{ control.affects.map((i) => i + 1).join('、') }}</span>
      </button>
    </div>
    <p class="thinking-muted">先预测会变成什么，再按开关。反转两次会恢复原样。</p>
    <p class="thinking-switch-history">
      操作记录：{{
        moves
          .map((id) =>
            puzzle.kind === 'switches' ? puzzle.switches.find((s) => s.id === id)?.label : '',
          )
          .join(' → ') || '还没按开关'
      }}
    </p>
    <button
      type="button"
      class="thinking-text-button"
      :disabled="!moves.length"
      @click="emit('change', moves.slice(0, -1))"
    >
      撤回一步
    </button>
  </div>
  <div v-else class="thinking-sudoku-game">
    <p>先点一个空格，再选数字。选错可以改，也可以擦除。</p>
    <div class="thinking-sudoku-grid" role="group" aria-label="四宫数独棋盘">
      <button
        v-for="(value, i) in numbers"
        :key="i"
        type="button"
        :class="{
          'is-given': puzzle.givens[i] !== 0,
          'is-active': selectedCell === i,
          'palace-right': i % 4 === 1,
          'palace-bottom': Math.floor(i / 4) === 1,
        }"
        :disabled="puzzle.givens[i] !== 0"
        :aria-label="`第${Math.floor(i / 4) + 1}行第${(i % 4) + 1}列，${value || '空格'}${puzzle.givens[i] ? '，固定线索' : ''}`"
        :aria-pressed="selectedCell === i"
        @click="selectedCell = i"
      >
        {{ value || '·' }}
      </button>
    </div>
    <p role="status">
      {{
        selectedCell === null
          ? '请选择一个空格'
          : `正在填写第${Math.floor(selectedCell / 4) + 1}行第${(selectedCell % 4) + 1}列`
      }}
      · 已填 {{ numbers.filter(Boolean).length }} / 16 格
    </p>
    <div class="thinking-number-pad" aria-label="填写数字">
      <button
        v-for="n in 4"
        :key="n"
        type="button"
        :disabled="selectedCell === null"
        @click="fill(n)"
      >
        {{ n }}
      </button>
      <button type="button" :disabled="selectedCell === null" @click="fill(0)">擦除</button>
    </div>
  </div>
</template>
