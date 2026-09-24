import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AdaptiveLearningPlanPanel from '@/components/learning-agent/AdaptiveLearningPlanPanel.vue'
import { createAgentScenario } from '@/data/learning-agent/scenarios'
import { parseArithmetic } from '@/services/learning-agent/deterministicAnswerValidator'
import { clearAdaptivePlanCheckpoint } from '@/services/learning-agent/adaptivePlanCheckpointStorage'

describe('adaptive plan reflection UI', () => {
  beforeEach(() => {
    // The UI contract uses reproducible template questions; random seeds may
    // legitimately produce a batch rejected by the independent validator.
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    window.sessionStorage.clear()
  })

  it('offers recovery for a ready SAMPLE plan after the component is remounted', async () => {
    const props = {
      snapshot: createAgentScenario('A'),
      mode: 'MOCK' as const,
      scenario: 'A',
      disabled: false,
    }
    const first = mount(AdaptiveLearningPlanPanel, { props })
    await first
      .findAll('button')
      .find((button) => button.text() === '创建并开始计划')!
      .trigger('click')
    await flushPromises()
    const firstQuestion = parseArithmetic(first.get('.stem').text())!
    await first.get('input').setValue(String(firstQuestion.result + 1))
    await first
      .findAll('button')
      .find((button) => button.text() === '保存并暂停')!
      .trigger('click')
    await flushPromises()
    first.unmount()
    const second = mount(AdaptiveLearningPlanPanel, { props })
    try {
      expect(second.text()).toContain('发现未结束的 SAMPLE 学习计划')
      expect(second.find('button').text()).toContain('恢复计划')
      await second
        .findAll('button')
        .find((button) => button.text() === '恢复计划')!
        .trigger('click')
      await flushPromises()
      expect(second.text()).toContain('第 1 组 · 巩固练习')
      expect(second.find('input').exists()).toBe(true)
      expect(second.get('input').element.value).toBe(String(firstQuestion.result + 1))
    } finally {
      second.unmount()
      clearAdaptivePlanCheckpoint('demo:AGENT_STUDENT:AGENT_TEXTBOOK:A:MOCK')
    }
  })

  it('shows committed mastery and wrong answers, then continues from the learned state', async () => {
    const wrapper = mount(AdaptiveLearningPlanPanel, {
      props: { snapshot: createAgentScenario('A'), mode: 'MOCK', scenario: 'A', disabled: false },
    })
    const click = async (label: string) => {
      await wrapper
        .findAll('button')
        .find((button) => button.text().includes(label))!
        .trigger('click')
      await flushPromises()
    }
    try {
      await wrapper.get('select').setValue('1')
      await click('创建并开始计划')
      expect(wrapper.find('[aria-label="计划学习复盘"]').exists()).toBe(false)
      for (let i = 0; i < 5; i++) {
        const arithmetic = parseArithmetic(wrapper.get('.stem').text())!
        await wrapper.get('input').setValue(String(arithmetic.result + 1))
        await wrapper.get('form').trigger('submit')
        await flushPromises()
      }
      const report = wrapper.get('[aria-label="计划学习复盘"]')
      expect(report.text()).toContain('本次学习复盘')
      expect(report.text()).toContain('答对 0 / 5 题')
      expect(report.text()).toContain('新增 5 条学习证据')
      expect(report.get('[aria-label="掌握度变化"]').text()).toContain('退位减法')
      expect(report.findAll('.wrong-answers li')).toHaveLength(5)
      expect(report.text()).toContain('你的答案：')
      expect(report.text()).toContain('正确答案：')
      expect(report.get('[aria-label="后续学习建议"]').text()).toContain('降低难度')
      expect(report.text()).toContain('CONSECUTIVE_ERRORS')
      // Changing the parent settings must not silently replace a completed plan's context.
      await wrapper.setProps({ snapshot: createAgentScenario('G'), scenario: 'G' })
      await click('按建议继续练习')
      expect(wrapper.text()).toContain('第 1 组 · 降低难度')
      expect(wrapper.text()).toContain('A · MOCK')
      expect(wrapper.find('[aria-label="计划学习复盘"]').exists()).toBe(false)
      await click('结束本次计划')
      await click('创建并开始计划')
      expect(wrapper.text()).toContain('G · MOCK')
      expect(wrapper.text()).not.toContain('第 1 组 · 降低难度')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps unsubmitted and blocked tasks out of the report', async () => {
    const wrapper = mount(AdaptiveLearningPlanPanel, {
      props: { snapshot: createAgentScenario('H'), mode: 'MOCK', scenario: 'H', disabled: false },
    })
    try {
      await wrapper
        .findAll('button')
        .find((button) => button.text() === '创建并开始计划')!
        .trigger('click')
      await flushPromises()
      expect(wrapper.get('[role="alert"]').text()).toContain('未通过校验')
      expect(wrapper.find('[aria-label="计划学习复盘"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('按建议继续练习')
    } finally {
      wrapper.unmount()
    }
  })
})
