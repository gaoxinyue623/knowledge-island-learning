import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import KnowledgeNode from '@/components/learning-map/KnowledgeNode.vue'
import { demoLearningMapSource } from '@/data/learning-map/demo'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { toKnowledgeMasteryViewModel } from '@/services/mastery'

const baseNode = flattenKnowledgeNodes(buildLearningMapViewModel(demoLearningMapSource).islands)[0]!

describe('Map completion and mastery presentation', () => {
  it('keeps completed learning visible without presenting absent assessment as zero mastery', () => {
    const node = {
      ...baseNode,
      status: 'completed' as const,
      progress: 100,
      mastery: toKnowledgeMasteryViewModel(baseNode.knowledgePointId, null),
    }
    const before = JSON.stringify(node)
    const wrapper = mount(KnowledgeNode, { props: { node } })
    expect(wrapper.text()).toContain('已完成')
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.get('.knowledge-node__mastery').text()).toBe('掌握度待评估')
    expect(wrapper.attributes('aria-label')).not.toContain('掌握度 0%')
    expect(wrapper.text()).not.toContain('还没开始')
    expect(JSON.stringify(node)).toBe(before)
    wrapper.unmount()
  })
  it('still shows a real zero score backed by evidence without changing completion', () => {
    const node = {
      ...baseNode,
      status: 'completed' as const,
      progress: 100,
      mastery: {
        ...toKnowledgeMasteryViewModel(baseNode.knowledgePointId, null),
        state: 'weak' as const,
        evidenceCount: 3,
        score: 0,
      },
    }
    const before = JSON.stringify(node)
    const wrapper = mount(KnowledgeNode, { props: { node } })
    expect(wrapper.get('.knowledge-node__mastery').text()).toBe('需要巩固 · 掌握度 0%')
    expect(wrapper.attributes('aria-label')).toContain('已完成，完成度 100%')
    expect(JSON.stringify(node)).toBe(before)
    wrapper.unmount()
  })
})
