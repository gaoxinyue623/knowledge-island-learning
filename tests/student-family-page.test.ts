import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { PetCloudError } from '@/services/pet/petCloud'
import { useStudentStore } from '@/stores/studentStore'
import { clearLearningSyncBinding, loadLearningSyncBinding, saveLearningSyncBinding } from '@/services/family-cloud/learningSyncBindingStorage'

const state = vi.hoisted(() => ({
  profileId: null as unknown as Ref<string>,
  petRequest: vi.fn(),
  list: vi.fn(),
  download: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  archive: {
    bootstrapProfile: vi.fn(), createProfile: vi.fn(), activate: vi.fn(), exportArchive: vi.fn(),
    inspectArchive: vi.fn(), restore: vi.fn(),
  },
}))

vi.mock('@/composables/useLearningProfile', () => ({ useLearningProfile: () => ({ profileId: state.profileId }) }))
vi.mock('@/services/pet/petCloud', async () => {
  const actual = await vi.importActual<typeof import('@/services/pet/petCloud')>('@/services/pet/petCloud')
  return { ...actual, petCloudRequest: state.petRequest }
})
vi.mock('@/services/family-cloud/familyCloud', () => ({
  listFamilyCloudProfiles: state.list, downloadFamilyCloudSnapshot: state.download,
  updateFamilyCloudProfile: state.update, createFamilyCloudProfile: state.create,
}))
vi.mock('@/services/profile-archive/profileArchiveService', () => ({ profileArchiveService: state.archive }))
vi.mock('@/services/family/localFamilyProfiles', () => ({ localFamilyProfileRepository: { read: vi.fn(() => null) } }))

import FamilyProfilesPage from '@/pages/FamilyProfilesPage.vue'

const profile = {
  cloudProfileId: '018e23b0-15d7-7cc4-8db2-c02439587791', label: '云端甲', revision: 1,
  digest: 'a'.repeat(64), updatedAt: '2026-09-08T00:00:00.000Z',
}
const archive = { format: 'knowledge-island.student-profile' } as never
const preview = {
  source: { displayName: '小学生', exportedAt: '2026-09-08T00:00:00.000Z', formatVersion: 1 as const },
  target: { mode: 'COPY' as const, proposedProfileId: 'copy', proposedDisplayName: '副本' },
  sections: [{ kind: 'student-profile', status: 'READY' as const, count: 1 }], canRestore: true, digest: 'digest',
}

function buttons(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button')
}
function button(wrapper: ReturnType<typeof mount>, text: string) {
  const found = buttons(wrapper).find((item) => item.text().includes(text))
  if (!found) throw new Error(`Missing button: ${text}`)
  return found
}
async function login(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('#family-account').setValue('parent_a')
  await wrapper.find('#family-password').setValue('strong-password-123')
  await wrapper.findAll('form')[1]!.trigger('submit')
  await flushPromises()
}
function page() {
  return mount(FamilyProfilesPage, {
    global: { stubs: { AppShell: { template: '<main><slot /></main>' }, RouterLink: { template: '<a><slot /></a>' } } },
  })
}

beforeEach(() => {
  clearLearningSyncBinding('student-a')
  setActivePinia(createPinia())
  const student = useStudentStore()
  student.profile = { id: 'student-a', displayName: '小学生' }
  student.characterId = 'default-character'
  state.profileId = ref('student-a')
  state.petRequest.mockReset()
  state.list.mockReset()
  state.download.mockReset()
  state.update.mockReset()
  state.create.mockReset()
  Object.values(state.archive).forEach((mock) => mock.mockReset())
  state.archive.bootstrapProfile.mockReturnValue({ schemaVersion: 1, activeProfileId: 'student-a', profiles: [] })
  state.archive.exportArchive.mockResolvedValue(archive)
  state.archive.inspectArchive.mockReturnValue(preview)
  state.list.mockResolvedValue([profile])
  state.petRequest.mockResolvedValue({ username: 'parent_a' })
})

describe('FamilyProfilesPage', () => {
  it('removes the previous automatic binding when saving with sync unchecked', async () => {
    saveLearningSyncBinding({ profileId: 'student-a', username: 'parent_a', cloudProfileId: profile.cloudProfileId, revision: 1, enabled: true, updatedAt: profile.updatedAt })
    const wrapper = page()
    await login(wrapper)
    await wrapper.find('#family-cloud-select').setValue(profile.cloudProfileId)
    await button(wrapper, '预览本机档案再同步').trigger('click')
    await flushPromises()
    await wrapper.find('input[type="checkbox"]').setValue(false)
    state.update.mockResolvedValue({ kind: 'updated', profile: { ...profile, revision: 2 } })
    await button(wrapper, '确认更新选中的云端档案').trigger('click')
    await flushPromises()
    expect(loadLearningSyncBinding('student-a')).toBeNull()
    wrapper.unmount()
  })

  it('clears the cloud session for login expiry or account changes', async () => {
    const wrapper = page()
    await login(wrapper)
    expect(wrapper.text()).toContain('parent_a')
    state.list.mockRejectedValueOnce(new PetCloudError(401, '请先登录'))
    await button(wrapper, '刷新云端列表').trigger('click')
    await flushPromises()
    expect(wrapper.find('#family-account').exists()).toBe(true)
  })

  it('requires a local preview before any upload is enabled', async () => {
    const wrapper = page()
    await login(wrapper)
    expect(state.create).not.toHaveBeenCalled()
    expect(state.update).not.toHaveBeenCalled()
    await button(wrapper, '预览本机档案再同步').trigger('click')
    await flushPromises()
    expect(state.archive.exportArchive).toHaveBeenCalledWith('student-a')
    expect(state.archive.inspectArchive).toHaveBeenCalledWith(archive)
    expect(button(wrapper, '另存为新的云端档案').exists()).toBe(true)
  })

  it('does not retry a revision conflict and disables the overwrite button', async () => {
    const wrapper = page()
    await login(wrapper)
    await wrapper.find('#family-cloud-select').setValue(profile.cloudProfileId)
    await button(wrapper, '预览本机档案再同步').trigger('click')
    await flushPromises()
    state.update.mockResolvedValue({ kind: 'conflict', currentRevision: 2, currentDigest: 'b'.repeat(64), updatedAt: profile.updatedAt })
    const overwrite = button(wrapper, '确认更新选中的云端档案')
    await overwrite.trigger('click')
    await flushPromises()
    expect(state.update).toHaveBeenCalledTimes(1)
    expect(button(wrapper, '确认更新选中的云端档案').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('没有覆盖')
  })

  it('clears prepared upload and restore preview when selection changes', async () => {
    const wrapper = page()
    await login(wrapper)
    await button(wrapper, '预览本机档案再同步').trigger('click')
    await flushPromises()
    expect(button(wrapper, '另存为新的云端档案').exists()).toBe(true)
    await wrapper.find('#family-cloud-select').setValue(profile.cloudProfileId)
    await flushPromises()
    expect(buttons(wrapper).some((item) => item.text().includes('另存为新的云端档案'))).toBe(false)
  })

  it('does not backfill a stale login response after profile switching or unmount', async () => {
    let resolveList!: (value: typeof profile[]) => void
    state.list.mockImplementationOnce(() => new Promise((resolve) => { resolveList = resolve }))
    const wrapper = page()
    await wrapper.find('#family-account').setValue('parent_a')
    await wrapper.find('#family-password').setValue('strong-password-123')
    await wrapper.findAll('form')[1]!.trigger('submit')
    state.profileId.value = 'student-b'
    await flushPromises()
    resolveList([profile])
    await flushPromises()
    expect(wrapper.find('#family-cloud-select').exists()).toBe(false)
    wrapper.unmount()
  })

  it('refuses restore if the cloud revision changed after preview', async () => {
    const wrapper = page()
    await login(wrapper)
    await wrapper.find('#family-cloud-select').setValue(profile.cloudProfileId)
    state.download.mockResolvedValueOnce({ ...profile, archive })
    await button(wrapper, '预览选中的云端档案').trigger('click')
    await flushPromises()
    state.download.mockResolvedValueOnce({ ...profile, revision: 2, digest: 'b'.repeat(64), archive })
    await button(wrapper, '确认恢复为新的本机副本').trigger('click')
    await flushPromises()
    expect(state.archive.restore).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('已更新')
  })
})
