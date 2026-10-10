import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const api = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('@/services/pet/petCloud', () => ({ petCloudRequest: api.request }))
vi.mock('@/services/account/accountService', () => ({ accountState: { username: 'parent_a' } }))
import ParentGate from '@/components/account/ParentGate.vue'
import RecoverPage from '@/pages/auth/RecoverPage.vue'
import FeedbackPage from '@/pages/FeedbackPage.vue'
beforeEach(() => api.request.mockReset())
afterEach(() => vi.useRealTimers())
async function router(path = '/') {
  const instance = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  await instance.push(path)
  await instance.isReady()
  return instance
}
describe('parent confirmation and recovery UX', () => {
  it('hides sensitive controls until verification, rejects wrong passwords and hides them at expiry', async () => {
    vi.useFakeTimers()
    api.request.mockResolvedValueOnce({ unlocked: false, until: 0 })
    const wrapper = mount(ParentGate, {
      slots: { default: '<button id="sensitive">恢复备份</button>' },
      global: { plugins: [await router()] },
    })
    await flushPromises()
    expect(wrapper.find('#sensitive').exists()).toBe(false)
    api.request.mockRejectedValueOnce(new Error('密码不正确'))
    await wrapper.get('input').setValue('wrong-password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('密码不正确')
    expect(wrapper.find('#sensitive').exists()).toBe(false)
    api.request
      .mockResolvedValueOnce({ unlocked: true, until: Date.now() + 900_000 })
      .mockResolvedValueOnce({ unlocked: true, until: Date.now() + 900_000 })
    await wrapper.get('input').setValue('correct-password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('#sensitive').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(900_001)
    expect(wrapper.find('#sensitive').exists()).toBe(false)
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })
  it('validates matching passwords and clears recovery secrets after success', async () => {
    const wrapper = mount(RecoverPage, { global: { plugins: [await router('/recover')] } })
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('parent_a')
    await inputs[1]!.setValue('A'.repeat(48))
    await inputs[2]!.setValue('new-password-123')
    await inputs[3]!.setValue('different-password')
    await wrapper.get('form').trigger('submit')
    expect(api.request).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('两次输入的密码不一致')
    api.request.mockResolvedValueOnce({ ok: true })
    await inputs[3]!.setValue('new-password-123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.request).toHaveBeenCalledWith('recover', 'POST', {
      username: 'parent_a',
      code: 'A'.repeat(48),
      newPassword: 'new-password-123',
    })
    expect(wrapper.text()).toContain('密码已重设')
    expect(wrapper.find('input').exists()).toBe(false)
    wrapper.unmount()
  })
  it('carries question context and retries the same feedback after an uncertain network result', async () => {
    api.request.mockResolvedValueOnce({ tickets: [], canManage: false })
    const wrapper = mount(FeedbackPage, {
      global: {
        plugins: [await router('/feedback?from=/assessment&contentId=AI-question-123&category=ai')],
        stubs: { AppShell: { template: '<div><slot /></div>' } },
      },
    })
    await flushPromises()
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('ai')
    expect(wrapper.text()).toContain('已自动关联具体内容')
    await wrapper.get('textarea').setValue('这道题的解析看不懂')
    api.request.mockRejectedValueOnce(new Error('网络连接中断'))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const payload = api.request.mock.calls[1]![2]
    expect(payload).toMatchObject({
      page: '/assessment',
      contentId: 'AI-question-123',
      category: 'ai',
    })
    expect(wrapper.text()).toContain('重试这份反馈')
    api.request
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ tickets: [], canManage: false })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.request.mock.calls[2]![2]).toEqual(payload)
    expect(wrapper.text()).toContain('反馈已收到')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('')
    wrapper.unmount()
  })
})
