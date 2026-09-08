import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import {
  applyPetCommand,
  freshPetAccount,
  settlePetSources,
  summarizePet,
  validatePetAccount,
  type PetCommand,
} from '@/services/pet/petPolicy'
import { createPetRepository, PET_DATABASE_NAME } from '@/services/pet/petDatabase'
import { restorePetBackup } from '@/services/pet/petBackup'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { usePetStore } from '@/stores/petStore'
import PetCollection from '@/components/pet/PetCollection.vue'
import PetParentReport from '@/components/pet/PetParentReport.vue'
import { petService } from '@/services/pet/petService'
const now = '2026-09-07T02:00:00.000Z'
function funded() {
  return applyPetCommand(
    settlePetSources(
      freshPetAccount('alice'),
      [0, 1, 2, 3].map((i) => ({
        id: `day${i}`,
        profileId: 'alice',
        kind: 'lesson' as const,
        title: '课程',
        amount: 60,
        occurredAt: `2026-09-0${i + 1}T02:00:00.000Z`,
      })),
      now,
    ),
    { kind: 'adopt', name: '小芽' },
    'adopt',
    now,
  )
}
let counter = 0
function act(a: ReturnType<typeof funded>, command: PetCommand) {
  return applyPetCommand(a, command, `op${++counter}`, now)
}
beforeEach(() => {
  setActivePinia(createPinia())
  counter = 0
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
describe('phase 2 pet collection and home', () => {
  it('keeps each pet experience and name independent with explicit feeding targets', () => {
    let a = act(funded(), { kind: 'buy', foodId: 'bento' })
    a = act(a, { kind: 'feed', foodId: 'bento' })
    a = act(a, { kind: 'collect', petId: 'sunshine', name: '暖暖' })
    expect(summarizePet(a)).toMatchObject({
      balance: 195,
      experience: 0,
      name: '暖暖',
      activePetId: 'sunshine',
    })
    a = act(a, { kind: 'buy', foodId: 'apple' })
    a = act(a, { kind: 'select', petId: 'mint' })
    a = act(a, { kind: 'feed-pet', petId: 'sunshine', foodId: 'apple' })
    a = act(a, { kind: 'name-pet', petId: 'sunshine', name: '小太阳' })
    expect(summarizePet(a)).toMatchObject({
      experience: 15,
      name: '小芽',
      companions: { sunshine: { experience: 5, name: '小太阳' }, mint: { experience: 15 } },
    })
    expect(() => act(a, { kind: 'collect', petId: 'sunshine', name: '再买' })).toThrow('已经拥有')
    expect(() => act(a, { kind: 'feed-pet', petId: 'berry', foodId: 'apple' })).toThrow('还没有')
  })
  it('buys decorations once, equips only owned items and clears one slot without spending', () => {
    let a = funded()
    expect(() => act(a, { kind: 'decorate-equip', decorationId: 'flowers' })).toThrow('先兑换')
    for (const decorationId of ['flowers', 'night'] as const) {
      a = act(a, { kind: 'decorate-buy', decorationId })
      a = act(a, { kind: 'decorate-equip', decorationId })
    }
    expect(summarizePet(a)).toMatchObject({
      balance: 200,
      totalSpent: 40,
      experience: 0,
      equipped: { ornament: 'flowers', landscape: 'night' },
    })
    expect(() => act(a, { kind: 'decorate-buy', decorationId: 'flowers' })).toThrow('已经拥有')
    a = act(a, { kind: 'decorate-clear', slot: 'landscape' })
    expect(summarizePet(a).equipped).toEqual({ ornament: 'flowers' })
    expect(summarizePet(a).balance).toBe(200)
  })
  it('deduplicates new command retries and rejects a changed target under the same operation id', () => {
    const a = applyPetCommand(
      funded(),
      { kind: 'collect', petId: 'berry', name: '粉粉' },
      'collect',
      now,
    )
    expect(
      applyPetCommand(a, { kind: 'collect', petId: 'berry', name: '粉粉' }, 'collect', now),
    ).toEqual(a)
    expect(() =>
      applyPetCommand(a, { kind: 'collect', petId: 'sunshine', name: '粉粉' }, 'collect', now),
    ).toThrow('编号')
  })
  it('atomically migrates a real v1 database without changing ledger or progress', async () => {
    const factory = new IDBFactory()
    const original = act(act(funded(), { kind: 'buy', foodId: 'bento' }), {
      kind: 'feed',
      foodId: 'bento',
    })
    const legacy = { ...original, schemaVersion: 1 }
    await new Promise<void>((resolve, reject) => {
      const open = factory.open(PET_DATABASE_NAME, 1)
      open.onupgradeneeded = () =>
        open.result.createObjectStore('accounts', { keyPath: 'profileId' })
      open.onsuccess = () => {
        const db = open.result
        const tx = db.transaction('accounts', 'readwrite')
        tx.objectStore('accounts').put(legacy)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onabort = () => reject(tx.error)
      }
    })
    const repository = createPetRepository(() => factory)
    const migrated = await repository.update('alice', (a) => a)
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.events).toEqual(legacy.events)
    expect(summarizePet(migrated)).toEqual(summarizePet(original))
    const newer = act(migrated, { kind: 'collect', petId: 'sunshine', name: '阳光' })
    expect(() => validatePetAccount({ ...newer, schemaVersion: 1 }, 'alice')).toThrow('旧版')
    expect((await repository.update('alice', (a) => a)).schemaVersion).toBe(2)
  })
  it('serializes simultaneous collection and decoration purchases across repositories', async () => {
    const factory = new IDBFactory(),
      a = createPetRepository(() => factory),
      b = createPetRepository(() => factory)
    await a.update('alice', () => funded())
    for (const command of [
      { kind: 'collect', petId: 'sunshine', name: '阳光' },
      { kind: 'decorate-buy', decorationId: 'night' },
    ] as const) {
      const results = await Promise.allSettled([
        a.update('alice', (account) => act(account, command)),
        b.update('alice', (account) => act(account, command)),
      ])
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    }
    expect(summarizePet(await a.update('alice', (a) => a)).balance).toBe(180)
  })
  it('restores only compatible histories, retains newer local data, and blocks divergent spending', () => {
    const original = funded(),
      remote = act(original, { kind: 'buy', foodId: 'apple' })
    expect(restorePetBackup(original, remote)).toEqual(remote)
    expect(restorePetBackup(remote, original)).toEqual(remote)
    expect(() => restorePetBackup(act(original, { kind: 'buy', foodId: 'bread' }), remote)).toThrow(
      '不同记录',
    )
    expect(() => restorePetBackup(original, { ...remote, profileId: 'bob' })).toThrow('档案')
    expect(() =>
      restorePetBackup(original, { ...remote, events: [...remote.events, remote.events[0]] }),
    ).toThrow('重复')
  })
  it('connects collection and decoration actions to the same store', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.spyOn(petService, 'run').mockImplementation(async (_id, command, op) => {
      if (command) a = applyPetCommand(a, command, op!, now)
      return { account: a, warning: null }
    })
    let a = funded()
    const pet = usePetStore()
    await pet.sync('alice')
    const wrapper = mount(PetCollection)
    const click = async (text: string) => {
      await wrapper
        .findAll('button')
        .find((b) => b.text() === text)!
        .trigger('click')
      await flushPromises()
    }
    await click('兑换阳光团子')
    expect(pet.summary.activePetId).toBe('sunshine')
    await click('兑换窗前花园')
    await click('布置窗前花园')
    expect(pet.summary.equipped.ornament).toBe('flowers')
    await click('收起窗前花园')
    expect(pet.summary.equipped).toEqual({})
    expect(pet.summary.balance).toBe(200)
    wrapper.unmount()
  })
  it('shows all-time parent source totals without treating spending as lost learning', async () => {
    vi.spyOn(petService, 'run').mockResolvedValue({ account: funded(), warning: null })
    const wrapper = mount(PetParentReport, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    await wrapper.findAll('select')[0]!.setValue('all')
    expect(wrapper.text()).toContain('累计获得 240')
    expect(wrapper.find('tbody tr').text()).toContain('240')
    wrapper.unmount()
  })
})
