<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type {
  KnowledgeLearningState,
  KnowledgeMapNode,
  KnowledgeMasteryViewModel,
  LearningNodeStatus,
} from '@/types'

interface Props {
  open: boolean
  node: KnowledgeMapNode | null
  lessonTitle?: string
  unitTitle?: string
  prerequisiteTitles?: string[]
  isSample?: boolean
  isUnverified?: boolean
  isReadOnly?: boolean
  mastery?: KnowledgeMasteryViewModel
}

const props = withDefaults(defineProps<Props>(), {
  lessonTitle: undefined,
  unitTitle: undefined,
  prerequisiteTitles: () => [],
  isSample: false,
  isUnverified: false,
  isReadOnly: false,
  mastery: undefined,
})

const emit = defineEmits<{
  close: []
  start: []
  complete: []
}>()

const statusLabels: Record<LearningNodeStatus, string> = {
  locked: '未解锁',
  available: '可以开始',
  learning: '学习中',
  completed: '已完成',
  mastered: '已完成强化（演示状态）',
  perfect: '完成状态（演示状态）',
}

const masteryLabels: Record<KnowledgeLearningState, string> = {
  not_started: '还没开始',
  learning: '正在掌握',
  weak: '需要巩固',
  mastered: '已经掌握',
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="props.open && props.node"
      class="node-detail-panel__backdrop"
      @click.self="emit('close')"
    >
      <aside
        class="node-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-detail-title"
      >
        <header class="node-detail-panel__header">
          <div>
            <p class="curriculum-eyebrow">KnowledgePoint</p>
            <h2 id="node-detail-title">{{ props.node.title }}</h2>
          </div>
          <button
            class="node-detail-panel__close touch-target"
            type="button"
            aria-label="关闭知识点详情"
            @click="emit('close')"
          >
            <AppIcon name="x" :size="20" decorative />
          </button>
        </header>
        <div class="node-detail-panel__content">
          <div v-if="props.isSample" class="map-notice map-notice--sample">
            <AppIcon name="info" :size="18" decorative />
            <span>开发样本：仅用于地图交互验证。</span>
          </div>
          <div v-if="props.isUnverified" class="map-notice map-notice--warning">
            <AppIcon name="alert-circle" :size="18" decorative />
            <span>未审核数据：不代表已发布的正式课程内容。</span>
          </div>
          <dl class="node-detail-panel__facts">
            <div>
              <dt>所属单元</dt>
              <dd>{{ props.unitTitle || '待确认' }}</dd>
            </div>
            <div>
              <dt>所属学习区域</dt>
              <dd>{{ props.lessonTitle || '待确认' }}</dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>{{ statusLabels[props.node.status] }}</dd>
            </div>
            <div>
              <dt>地图完成度</dt>
              <dd>{{ Math.round(props.node.progress) }}%</dd>
            </div>
          </dl>
          <section
            v-if="props.mastery"
            class="node-detail-panel__mastery"
            aria-labelledby="node-mastery-title"
          >
            <div class="node-detail-panel__mastery-heading">
              <div>
                <p class="curriculum-eyebrow">Learning evidence</p>
                <h3 id="node-mastery-title">知识掌握</h3>
              </div>
              <strong>{{ Math.round(props.mastery.score) }}%</strong>
            </div>
            <p>
              {{ masteryLabels[props.mastery.state] }} · 基于
              {{ props.mastery.evidenceCount }} 条作答证据
            </p>
            <small v-if="props.mastery.isSampleDerived">开发样本掌握度，不代表正式学习记录。</small>
          </section>
          <section v-if="props.prerequisiteTitles.length" class="node-detail-panel__prerequisites">
            <h3>前置知识</h3>
            <ul>
              <li v-for="title in props.prerequisiteTitles" :key="title">{{ title }}</li>
            </ul>
          </section>
          <p v-else class="node-detail-panel__hint">这是当前路径的起点，可以从这里开始探索。</p>
          <p v-if="props.isReadOnly" class="node-detail-panel__hint">
            当前课程为只读状态，暂不能记录演示进度。
          </p>
        </div>
        <footer class="node-detail-panel__actions">
          <AppButton
            v-if="props.node.status === 'locked' || props.isReadOnly"
            full-width
            variant="secondary"
            disabled
            icon-left="lock"
          >
            {{ props.node.status === 'locked' ? '完成前置知识后解锁' : '当前仅可查看' }}
          </AppButton>
          <AppButton
            v-else-if="props.node.status === 'available'"
            full-width
            icon-right="arrow-right"
            @click="emit('start')"
          >
            开始学习
          </AppButton>
          <AppButton
            v-else-if="props.node.status === 'learning'"
            full-width
            icon-right="check"
            @click="emit('complete')"
          >
            继续学习
          </AppButton>
          <AppButton v-else full-width variant="secondary" @click="emit('close')">
            返回地图继续探索
          </AppButton>
        </footer>
      </aside>
    </div>
  </Transition>
</template>
