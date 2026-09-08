import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import PetCloudPanel from '@/components/pet/PetCloudPanel.vue'
import { usePetStore } from '@/stores/petStore'
import { applyPetCommand, freshPetAccount } from '@/services/pet/petPolicy'
import * as cloud from '@/services/pet/petCloud'
import { petRepository } from '@/services/pet/petDatabase'
const at = '2026-09-07T02:00:00.000Z'
const account = applyPetCommand(
  freshPetAccount('alice'),
  { kind: 'adopt', name: '小芽' },
  'adopt',
  at,
)
const backup = { profileId: 'alice', label: '小屋', revision: 1, updatedAt: at, account }
beforeEach(() => {
  setActivePinia(createPinia())
  const pet = usePetStore()
  pet.selectProfile('alice')
  pet.account = account
})
afterEach(() => {
  vi.restoreAllMocks()
})
async function connected() {
  vi.spyOn(cloud, 'petCloudRequest').mockResolvedValue({ username: 'parent_a' })
  vi.spyOn(cloud, 'listCloudBackups').mockResolvedValue([backup])
  const wrapper = mount(PetCloudPanel)
  const click = async (label: string) => {
    await wrapper
      .findAll('button')
      .find((b) => b.text() === label)!
      .trigger('click')
    await flushPromises()
  }
  await click('恢复登录状态')
  return { wrapper, click }
}
describe('cloud interface recovery boundaries', () => {
  it('returns to login after session expiration while preserving the local wallet', async () => {
    const { wrapper, click } = await connected()
    vi.mocked(cloud.listCloudBackups).mockRejectedValueOnce(
      new cloud.PetCloudError(401, '请先登录家长账号。'),
    )
    await click('刷新备份')
    expect(wrapper.find('#pet-account-name').exists()).toBe(true)
    expect(usePetStore().account).toEqual(account)
    expect(wrapper.text()).toContain('请先登录家长账号')
    wrapper.unmount()
  })
  it('rechecks the preview revision before applying a restore', async () => {
    const { wrapper, click } = await connected()
    const update = vi.spyOn(petRepository, 'update')
    vi.spyOn(cloud, 'readCloudBackup')
      .mockResolvedValueOnce(backup)
      .mockResolvedValueOnce({ ...backup, revision: 2 })
    await wrapper.get('#pet-backup-select').setValue('alice')
    await click('预览并恢复')
    await click('恢复到当前小屋')
    expect(update).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('云端记录已更新')
    wrapper.unmount()
  })
  it('does not apply a late cloud response after changing learning profile', async () => {
    const { wrapper, click } = await connected()
    const update = vi.spyOn(petRepository, 'update')
    let resolve!: (value: cloud.CloudBackup) => void
    vi.spyOn(cloud, 'readCloudBackup')
      .mockResolvedValueOnce(backup)
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          }),
      )
    await wrapper.get('#pet-backup-select').setValue('alice')
    await click('预览并恢复')
    await click('恢复到当前小屋')
    usePetStore().selectProfile('bob')
    await flushPromises()
    resolve(backup)
    await flushPromises()
    expect(update).not.toHaveBeenCalled()
    expect(usePetStore().profileId).toBe('bob')
    wrapper.unmount()
  })
})
