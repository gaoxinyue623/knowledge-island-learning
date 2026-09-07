import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MapHeader from '@/components/learning-map/MapHeader.vue'
import { demoLearningMapSource } from '@/data/learning-map/demo'
import { buildLearningMapViewModel } from '@/services/learning-map'
import type { LearningMapViewModel } from '@/types'

function renderHeader(
  viewModel = buildLearningMapViewModel(demoLearningMapSource),
  showUnverified = true,
) {
  return mount(MapHeader, {
    props: { viewModel, showUnverified },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('Learning map textbook header', () => {
  it('places navigation in its own toolbar before the full-width textbook section', () => {
    const wrapper = renderHeader()
    const children = wrapper.element.children
    expect(children[0]?.className).toBe('learning-map-header__toolbar')
    expect(children[1]?.className).toBe('learning-map-header__main')
    expect(
      wrapper.get('.learning-map-header__toolbar').findAllComponents(RouterLinkStub),
    ).toHaveLength(2)
    expect(
      wrapper.get('.learning-map-header__main').findAllComponents(RouterLinkStub),
    ).toHaveLength(0)
    expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual([
      '/home',
      '/curriculum-settings',
    ])
  })

  it.each([
    ['MATH', '北师大版数学二年级上册（2024新版·深圳用）', '数学世界'],
    ['CHINESE', '人教版（统编版）语文二年级下册（含《我不是最弱小的》）', '语文世界'],
    ['ENGLISH', '沪教版（牛津上海版）英语一年级上册（2024 新版·深圳用）', '英语世界'],
  ] as const)('keeps the entire %s title and edition text unchanged', (subject, title, label) => {
    const base = buildLearningMapViewModel(demoLearningMapSource)
    const model: LearningMapViewModel = {
      ...base,
      textbook: { ...base.textbook, subject, title, grade: 2, semester: 1 },
    }
    const before = JSON.stringify(model)
    const wrapper = renderHeader(model)
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe(title)
    expect(wrapper.get('.curriculum-eyebrow').text()).toBe(label)
    expect(wrapper.get('.learning-map-header__meta > p').text()).toMatch(/2年级 ·\s*上册/)
    expect(JSON.stringify(model)).toBe(before)
  })

  it('keeps sample and verification badges below the title without changing their guards', () => {
    const base = buildLearningMapViewModel(demoLearningMapSource)
    const model = { ...base, flags: { ...base.flags, isDemo: true, isUnverified: true } }
    const shown = renderHeader(model)
    expect(shown.get('.learning-map-header__meta').text()).toContain('开发样本')
    expect(shown.get('.learning-map-header__meta').text()).toContain('未审核数据')
    expect(shown.get('.learning-map-header__toolbar').text()).not.toContain('未审核数据')
    const hidden = renderHeader(model, false)
    expect(hidden.text()).not.toContain('未审核数据')
    expect(hidden.text()).toContain('开发样本')
    const regular = renderHeader({
      ...base,
      flags: { ...base.flags, isDemo: false, isUnverified: false },
    })
    expect(regular.find('.map-badge').exists()).toBe(false)
  })
})
