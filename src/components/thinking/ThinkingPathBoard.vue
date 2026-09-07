<script setup lang="ts">
import { computed } from 'vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import WorkshopObject from '@/components/hands-on/WorkshopObject.vue'
import type { ThinkingPuzzle } from '@/types/thinking'
const props = defineProps<{
  puzzle: Extract<ThinkingPuzzle, { kind: 'path' }>
  cells: number[]
  moving: boolean
  reducedMotion?: boolean
}>()
const current = computed(() => props.cells.at(-1) ?? props.puzzle.start)
const column = computed(() => current.value % props.puzzle.columns)
const row = computed(() => Math.floor(current.value / props.puzzle.columns))
const points = computed(() =>
  props.cells
    .map(
      (cell) =>
        `${((cell % props.puzzle.columns) + 0.5) * 100},${(Math.floor(cell / props.puzzle.columns) + 0.5) * 100}`,
    )
    .join(' '),
)
function description(cell: number) {
  const p = props.puzzle
  const item = p.blocked.includes(cell)
    ? '石头'
    : cell === p.goal
      ? '终点旗'
      : p.via.includes(cell)
        ? '补给站'
        : cell === p.start
          ? '起点'
          : '空地'
  return `第${Math.floor(cell / p.columns) + 1}行第${(cell % p.columns) + 1}列，${item}${cell === current.value ? '，团子现在的位置' : ''}`
}
</script>
<template>
  <div class="thinking-path-stage" :class="{ 'is-reduced-motion': reducedMotion }">
    <div class="thinking-path-canvas">
      <ol
        class="thinking-path-board thinking-path-board--illustrated"
        :style="{ 'grid-template-columns': `repeat(${puzzle.columns},minmax(0,1fr))` }"
        aria-label="路线方格图"
      >
        <li
          v-for="(_, cell) in puzzle.rows * puzzle.columns"
          :key="cell"
          :aria-label="description(cell)"
          :class="{
            'is-rock': puzzle.blocked.includes(cell),
            'is-walked': cells.includes(cell),
            'is-current': cell === current,
            'is-goal': cell === puzzle.goal,
          }"
        >
          <WorkshopObject v-if="puzzle.blocked.includes(cell)" kind="rock" />
          <WorkshopObject v-else-if="cell === puzzle.goal" kind="flag" />
          <WorkshopObject v-else-if="puzzle.via.includes(cell)" kind="supply" />
          <WorkshopObject v-else-if="cell === puzzle.start" kind="start" />
          <span v-else aria-hidden="true" class="thinking-path-pebble" />
        </li>
      </ol>
      <svg
        class="thinking-path-track"
        :viewBox="`0 0 ${puzzle.columns * 100} ${puzzle.rows * 100}`"
        aria-hidden="true"
      >
        <polyline
          :points="points"
          fill="none"
          stroke="#6f9b7d"
          stroke-width="7"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="3 12"
        />
      </svg>
      <div
        class="thinking-path-actor"
        :class="{ 'is-moving': moving }"
        :style="{
          left: `calc((100% + 7px) / ${puzzle.columns} * ${column + 0.5} - 3.5px)`,
          top: `calc((100% + 7px) / ${puzzle.rows} * ${row + 0.5} - 3.5px)`,
          width: `calc(100% / ${puzzle.columns} * .85)`,
        }"
        aria-hidden="true"
      >
        <KnowledgeDangoPlaceholder
          size="avatar"
          :state="current === puzzle.goal ? 'happy' : 'idle'"
        />
      </div>
    </div>
  </div>
</template>
