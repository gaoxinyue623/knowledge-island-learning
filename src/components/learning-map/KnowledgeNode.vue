<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import type { IconName, KnowledgeMapNode, LearningNodeStatus } from '@/types'

interface Props {
  node: KnowledgeMapNode
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), { selected: false })

const emit = defineEmits<{
  select: [nodeId: string]
}>()

const statusLabels: Record<LearningNodeStatus, string> = {
  locked: '未解锁',
  available: '可以开始',
  learning: '学习中',
  completed: '已完成',
  mastered: '已完成强化（演示）',
  perfect: '完成状态（演示）',
}

const statusIcons: Record<LearningNodeStatus, IconName> = {
  locked: 'lock',
  available: 'sparkles',
  learning: 'lightbulb',
  completed: 'check',
  mastered: 'check-circle',
  perfect: 'star',
}

const ariaLabel = computed(
  () =>
    `${props.node.title}，${statusLabels[props.node.status]}，完成度 ${Math.round(props.node.progress)}%`,
)
</script>

<template>
  <button
    class="knowledge-node"
    :class="[
      `knowledge-node--${props.node.status}`,
      { 'knowledge-node--selected': props.selected },
    ]"
    type="button"
    :aria-label="ariaLabel"
    :aria-pressed="props.selected"
    @click="emit('select', props.node.id)"
  >
    <span class="knowledge-node__halo" aria-hidden="true" />
    <span class="knowledge-node__core">
      <AppIcon :name="statusIcons[props.node.status]" :size="22" decorative />
    </span>
    <span class="knowledge-node__label">{{ props.node.shortTitle || props.node.title }}</span>
    <span class="knowledge-node__state">{{ statusLabels[props.node.status] }}</span>
    <span v-if="props.node.progress > 0" class="knowledge-node__progress">
      {{ Math.round(props.node.progress) }}%
    </span>
  </button>
</template>
