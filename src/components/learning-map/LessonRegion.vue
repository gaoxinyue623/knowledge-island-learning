<script setup lang="ts">
import KnowledgeNode from './KnowledgeNode.vue'
import { LEARNING_MAP_LAYOUT } from '@/services/learning-map/learningMapLayout'
import type { KnowledgeMapNode, LessonMapSection, LearningMapSize, UnitIsland } from '@/types'

interface Props {
  lesson: LessonMapSection
  island: UnitIsland
  canvasSize: LearningMapSize
  selectedNodeId?: string | null
}

const props = withDefaults(defineProps<Props>(), { selectedNodeId: null })

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()

const LESSON_LOGICAL_WIDTH = LEARNING_MAP_LAYOUT.lessonWidth
const LESSON_LOGICAL_HEIGHT = LEARNING_MAP_LAYOUT.lessonHeight

function lessonStyle() {
  return {
    left: `${((props.lesson.position.x - props.island.position.x) / props.island.size.width) * 100}%`,
    top: `${((props.lesson.position.y - props.island.position.y) / props.island.size.height) * 100}%`,
    width: `${(LESSON_LOGICAL_WIDTH / props.island.size.width) * 100}%`,
    height: `${(LESSON_LOGICAL_HEIGHT / props.island.size.height) * 100}%`,
  }
}

function nodeStyle(node: KnowledgeMapNode) {
  return {
    left: `${((node.position.x - props.lesson.position.x) / LESSON_LOGICAL_WIDTH) * 100}%`,
    top: `${((node.position.y - props.lesson.position.y) / LESSON_LOGICAL_HEIGHT) * 100}%`,
  }
}
</script>

<template>
  <article
    class="lesson-region"
    :class="`lesson-region--${props.lesson.status}`"
    :style="lessonStyle()"
    :aria-label="`${props.lesson.title}学习区域`"
  >
    <header class="lesson-region__header">
      <div class="lesson-region__title">
        <span class="lesson-region__eyebrow">关卡 {{ props.lesson.sort }}</span>
        <h3>{{ props.lesson.title }}</h3>
      </div>
      <span class="lesson-region__progress">{{ props.lesson.progress }}%</span>
    </header>
    <div class="lesson-region__nodes">
      <KnowledgeNode
        v-for="node in props.lesson.nodes"
        :key="node.id"
        :node="node"
        :selected="props.selectedNodeId === node.id"
        :style="nodeStyle(node)"
        @select="emit('selectNode', $event)"
      />
    </div>
  </article>
</template>
