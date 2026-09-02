<script setup lang="ts">
import KnowledgeNode from './KnowledgeNode.vue'
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

const LESSON_LOGICAL_WIDTH = 780
const LESSON_LOGICAL_HEIGHT = 80

function lessonStyle() {
  return {
    left: `${((props.lesson.position.x - props.island.position.x) / props.island.size.width) * 100}%`,
    top: `${((props.lesson.position.y - props.island.position.y - 32) / props.island.size.height) * 100}%`,
    width: `${(LESSON_LOGICAL_WIDTH / props.island.size.width) * 100}%`,
    height: `${(LESSON_LOGICAL_HEIGHT / props.island.size.height) * 100}%`,
  }
}

function nodeStyle(node: KnowledgeMapNode) {
  return {
    left: `${((node.position.x - props.lesson.position.x) / LESSON_LOGICAL_WIDTH) * 100}%`,
    top: `${50 + ((node.position.y - props.lesson.position.y) / LESSON_LOGICAL_HEIGHT) * 100}%`,
  }
}
</script>

<template>
  <article
    class="lesson-region"
    :style="lessonStyle()"
    :aria-label="`${props.lesson.title}学习区域`"
  >
    <header class="lesson-region__header">
      <span class="lesson-region__eyebrow">学习区域</span>
      <h3>{{ props.lesson.title }}</h3>
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
