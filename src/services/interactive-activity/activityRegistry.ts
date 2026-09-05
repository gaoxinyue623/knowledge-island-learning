import type { Component } from 'vue'

import type { InteractiveActivityType, SupportedInteractiveActivityType } from '@/types'

import DragClassifyActivity from '@/components/interactive-activity/DragClassifyActivity.vue'
import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import NumberLineActivity from '@/components/interactive-activity/NumberLineActivity.vue'
import SelectRegionActivity from '@/components/interactive-activity/SelectRegionActivity.vue'
import SimulationActivity from '@/components/interactive-activity/SimulationActivity.vue'
import SortOrderActivity from '@/components/interactive-activity/SortOrderActivity.vue'

export interface ActivityRendererDefinition {
  type: InteractiveActivityType
  label: string
  supported: boolean
  component?: Component
}

export const activityRegistry: Record<InteractiveActivityType, ActivityRendererDefinition> = {
  drag_match: {
    type: 'drag_match',
    label: '拖动配对',
    supported: true,
    component: DragMatchActivity,
  },
  drag_classify: {
    type: 'drag_classify',
    label: '拖动分类',
    supported: true,
    component: DragClassifyActivity,
  },
  sort_order: { type: 'sort_order', label: '排序', supported: true, component: SortOrderActivity },
  number_line: {
    type: 'number_line',
    label: '数轴探索',
    supported: true,
    component: NumberLineActivity,
  },
  build_object: { type: 'build_object', label: '搭建对象', supported: false },
  select_region: {
    type: 'select_region',
    label: '选择区域',
    supported: true,
    component: SelectRegionActivity,
  },
  connect_pairs: { type: 'connect_pairs', label: '连线配对', supported: false },
  fill_container: { type: 'fill_container', label: '装满容器', supported: false },
  simulation: {
    type: 'simulation',
    label: '小模拟',
    supported: true,
    component: SimulationActivity,
  },
  step_operation: { type: 'step_operation', label: '步骤操作', supported: false },
  observe_discover: { type: 'observe_discover', label: '观察发现', supported: false },
  timed_challenge: { type: 'timed_challenge', label: '限时挑战', supported: false },
}

export const supportedActivityTypes: readonly SupportedInteractiveActivityType[] = [
  'drag_match',
  'drag_classify',
  'sort_order',
  'number_line',
  'select_region',
  'simulation',
]

export function getActivityRendererDefinition(
  type: InteractiveActivityType,
): ActivityRendererDefinition {
  return activityRegistry[type]
}
