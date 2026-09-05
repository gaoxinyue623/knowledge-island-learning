import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import KnowledgeNode from '@/components/learning-map/KnowledgeNode.vue'
import NodeDetailPanel from '@/components/learning-map/NodeDetailPanel.vue'
import KnowledgeChallengeCard from '@/components/knowledge-point/KnowledgeChallengeCard.vue'

describe('AppButton', () => {
  it('renders a primary button with an accessible loading state', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true, ariaLabel: '正在保存' },
      slots: { default: '保存' },
    })

    const button = wrapper.get('button')
    expect(button.classes()).toContain('app-button--primary')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes('aria-label')).toBe('正在保存')
  })
})

describe('AppIcon', () => {
  it('renders the registered icon without a direct Lucide import in consumers', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'map-pin', ariaLabel: '地区' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg').attributes('aria-label')).toBe('地区')
  })
})

describe('AppProgress', () => {
  it('clamps the value and exposes progress semantics', () => {
    const wrapper = mount(AppProgress, { props: { value: 140, showValue: true } })
    const progress = wrapper.get('[role="progressbar"]')

    expect(progress.attributes('aria-valuenow')).toBe('100')
    expect(wrapper.text()).toContain('100%')
  })
})

describe('LearningMap components', () => {
  const node = {
    id: 'map-node-1',
    type: 'knowledge' as const,
    knowledgePointId: 'kp-1',
    lessonId: 'lesson-1',
    unitId: 'unit-1',
    title: '演示知识点',
    status: 'locked' as const,
    progress: 0,
    position: { x: 100, y: 100 },
    visual: { variant: 'number-beacon' },
    prerequisites: ['kp-0'],
    isSample: true,
    verificationStatus: 'SAMPLE' as const,
    sort: 1,
  }

  it('uses a real button for locked nodes and exposes state in its label', async () => {
    const wrapper = mount(KnowledgeNode, { props: { node } })
    const button = wrapper.get('button')

    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('aria-label')).toContain('未解锁')
    await button.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['map-node-1'])
  })

  it('keeps the locked start action disabled in node detail', () => {
    const wrapper = mount(NodeDetailPanel, {
      props: {
        open: true,
        node,
        lessonTitle: '演示区域',
        unitTitle: '演示知识岛',
        prerequisiteTitles: ['前置知识点'],
        isSample: true,
      },
    })

    const action = wrapper.get('.node-detail-panel__actions button')
    expect(action.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('完成前置知识后解锁')
    expect(wrapper.text()).toContain('开发样本')
  })

  it('shows an unverified warning in node detail', () => {
    const wrapper = mount(NodeDetailPanel, {
      props: {
        open: true,
        node,
        isSample: false,
        isUnverified: true,
      },
    })

    expect(wrapper.text()).toContain('未审核数据')
  })

  it('keeps empty and error states recoverable', async () => {
    const empty = mount(AppEmptyState, {
      props: {
        title: '课程还在准备中',
        description: '可以先回到学习设置。',
        actionLabel: '回到设置',
      },
    })
    await empty.get('button').trigger('click')
    expect(empty.attributes('role')).toBe('status')
    expect(empty.emitted('action')).toHaveLength(1)

    const error = mount(AppErrorState, {
      props: { title: '地图暂时打不开', description: '请再试一次。' },
    })
    await error.get('button').trigger('click')
    expect(error.attributes('role')).toBe('alert')
    expect(error.emitted('retry')).toHaveLength(1)
  })
})

describe('Knowledge point detail components', () => {
  it('lets a learner write and submit a non-scoring knowledge challenge', async () => {
    const wrapper = mount(KnowledgeChallengeCard, {
      props: {
        challengeId: 'knowledge-point-1:challenge',
        title: '说说你的发现',
        prompt: '说说你是怎样找到答案的。',
        hint: '先说出你的观察方法。',
      },
    })

    const submit = wrapper.get('.app-button--primary')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.get('textarea').setValue('我先观察，再比较。')
    expect(submit.attributes('disabled')).toBeUndefined()
    await submit.trigger('click')

    expect(wrapper.text()).toContain('挑战完成')
    expect(wrapper.text()).toContain('不改变掌握度')
    expect(wrapper.get('[role="status"]').text()).toContain('挑战完成')
  })
})
