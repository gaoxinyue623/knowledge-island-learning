<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import SubjectHabitat from '@/components/illustrations/SubjectHabitat.vue'

import LessonRegion from './LessonRegion.vue'
import { LEARNING_MAP_LAYOUT } from '@/services/learning-map/learningMapLayout'
import type { LearningMapPosition, LearningMapSize, LearningNodeStatus, UnitIsland } from '@/types'

interface Props {
  island: UnitIsland
  canvasSize: LearningMapSize
  selectedNodeId?: string | null
}

const props = withDefaults(defineProps<Props>(), { selectedNodeId: null })

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()

interface RoutePoint {
  x: number
  y: number
  status: LearningNodeStatus
}

const routePoints = computed<RoutePoint[]>(() =>
  props.island.lessons.map((lesson) => {
    const node = lesson.nodes[0]
    const position: LearningMapPosition = node?.position ?? {
      x: lesson.position.x + LEARNING_MAP_LAYOUT.lessonWidth / 2,
      y: lesson.position.y + LEARNING_MAP_LAYOUT.nodeCenterY,
    }
    return {
      x: position.x - props.island.position.x,
      y: position.y - props.island.position.y,
      status: node?.status ?? lesson.status,
    }
  }),
)

const routePath = computed(() => {
  if (routePoints.value.length === 0) return ''
  return routePoints.value.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = routePoints.value[index - 1]
    if (!previous) return path
    const midY = (previous.y + point.y) / 2
    return `${path} C ${previous.x} ${midY}, ${point.x} ${midY}, ${point.x} ${point.y}`
  }, '')
})

function islandStyle() {
  return {
    left: `${(props.island.position.x / props.canvasSize.width) * 100}%`,
    top: `${(props.island.position.y / props.canvasSize.height) * 100}%`,
    width: `${(props.island.size.width / props.canvasSize.width) * 100}%`,
    height: `${(props.island.size.height / props.canvasSize.height) * 100}%`,
  }
}
</script>

<template>
  <section
    class="unit-island"
    :class="`unit-island--${props.island.theme.biome}`"
    :style="islandStyle()"
    :aria-label="`${props.island.title}知识岛`"
  >
    <div class="unit-island__glow" aria-hidden="true" />
    <div class="unit-island__landmark" aria-hidden="true">
      <SubjectHabitat
        :subject="
          props.island.theme.biome === 'mechanical-city'
            ? 'MATH'
            : props.island.theme.biome === 'starlight-valley'
              ? 'ENGLISH'
              : 'CHINESE'
        "
      />
    </div>
    <svg
      class="unit-island__route"
      :viewBox="`0 0 ${props.island.size.width} ${props.island.size.height}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path class="unit-island__route-shadow" :d="routePath" />
      <path class="unit-island__route-line" :d="routePath" />
      <circle
        v-for="(point, index) in routePoints"
        :key="`${props.island.id}-route-point-${index}`"
        class="unit-island__route-point"
        :class="`unit-island__route-point--${point.status}`"
        :cx="point.x"
        :cy="point.y"
        r="17"
      />
    </svg>
    <header class="unit-island__header">
      <div>
        <p class="unit-island__eyebrow">
          <AppIcon name="map-pin" :size="14" decorative /> 知识岛 {{ props.island.sort }}
        </p>
        <h2>{{ props.island.title }}</h2>
        <p v-if="props.island.subtitle">{{ props.island.subtitle }}</p>
      </div>
      <div class="unit-island__summary">
        <strong>{{ props.island.progress }}%</strong>
        <span>{{ props.island.lessons.length }} 个关卡</span>
      </div>
    </header>
    <div class="unit-island__lessons">
      <LessonRegion
        v-for="lesson in props.island.lessons"
        :key="lesson.id"
        :lesson="lesson"
        :island="props.island"
        :canvas-size="props.canvasSize"
        :selected-node-id="props.selectedNodeId"
        @select-node="emit('selectNode', $event)"
      />
    </div>
    <span class="unit-island__badge">
      <AppIcon name="route" :size="14" decorative />
      {{ props.island.status === 'locked' ? '等待解锁' : '探索中' }}
    </span>
  </section>
</template>
