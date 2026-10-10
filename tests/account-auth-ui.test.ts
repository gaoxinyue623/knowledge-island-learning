import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const service = vi.hoisted(() => ({
  authenticate: vi.fn(),
  navigate: vi.fn(),
  state: { ready: true, username: null, error: '', conflict: null },
}))
vi.mock('@/services/account/accountService', () => ({
  accountState: service.state,
  authenticate: service.authenticate,
  navigateAccount: service.navigate,
  hasLegacyData: () => true,
  initializeAccount: vi.fn(),
}))
import AuthPage from '@/pages/auth/AuthPage.vue'
async function page(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: AuthPage }],
  })
  await router.push(path)
  await router.isReady()
  return mount(AuthPage, {
    global: { plugins: [router], stubs: { KnowledgeDangoPlaceholder: true } },
  })
}
beforeEach(() => {
  service.authenticate.mockReset()
  service.navigate.mockReset()
})
describe('unified login and registration', () => {
  it('checks password confirmation before creating an account', async () => {
    const wrapper = await page('/register')
    await wrapper.get('#auth-username').setValue('parent_a')
    await wrapper.get('#auth-password').setValue('long-password-123')
    await wrapper.get('#auth-confirm').setValue('other-password-123')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('两次输入的密码不一致')
    expect(service.authenticate).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('disables repeated submission, explicitly migrates old data and returns to the requested lesson', async () => {
    let finish!: () => void
    service.authenticate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const wrapper = await page('/login?redirect=%2Flearning-map')
    await wrapper.get('#auth-username').setValue('parent_a')
    await wrapper.get('#auth-password').setValue('long-password-123')
    await wrapper.get('input[type=checkbox]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(service.authenticate).toHaveBeenCalledTimes(1)
    expect(service.authenticate).toHaveBeenCalledWith(
      'login',
      'parent_a',
      'long-password-123',
      true,
    )
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
    finish()
    await flushPromises()
    expect(service.navigate).toHaveBeenCalledWith('/learning-map')
    expect((wrapper.get('#auth-password').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })
  it('shows authentication errors and never redirects to an external URL', async () => {
    service.authenticate.mockRejectedValue(new Error('账号或密码不正确。'))
    const wrapper = await page('/login?redirect=https%3A%2F%2Fevil.test')
    await wrapper.get('#auth-username').setValue('parent_a')
    await wrapper.get('#auth-password').setValue('long-password-123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('账号或密码不正确')
    expect(service.navigate).not.toHaveBeenCalled()
    service.authenticate.mockResolvedValue(undefined)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(service.navigate).toHaveBeenCalledWith('/home')
    wrapper.unmount()
  })
})
