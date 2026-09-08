import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createPetRepository, PET_DATABASE_NAME } from '@/services/pet/petDatabase'
import { createPetService, petService } from '@/services/pet/petService'
import {
  applyPetCommand,
  freshPetAccount,
  settlePetSources,
  summarizePet,
  validatePetAccount,
  PET_DAILY_LIMIT,
  petDay,
  type PetAccount,
  type PetLearningSource,
} from '@/services/pet/petPolicy'
import { collectPetSources, petSourceFromReward } from '@/services/pet/petSources'
import { questPetSource } from '@/services/pet/petQuestRewards'
import { REWARD_EVENT_STORAGE_KEY } from '@/services/reward/rewardEventStorage'
import {
  freshThinkingProgress,
  thinkingProgressKey,
  withSolvedThinkingPuzzle,
} from '@/services/thinking/thinkingProgressStorage'
import { thinkingMissions } from '@/data/thinking/islands'
import { readingStories } from '@/data/reading-islands'
import { createStoryPractice } from '@/services/reading-islands/readingStoryAdapter'
import {
  freshQuestProgress,
  saveQuestProgress,
} from '@/services/content-expansion/questProgressStorage'
import { usePetStore } from '@/stores/petStore'
import { useStudentStore } from '@/stores/studentStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useLearningProfile } from '@/composables/useLearningProfile'
import PetGarden from '@/components/pet/PetGarden.vue'
import type { RewardEvent } from '@/types/reward'

const NOW = '2026-09-07T02:00:00.000Z'
let factory: IDBFactory, memory: Map<string, string>
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value)
  },
  removeItem: (key: string) => {
    memory.delete(key)
  },
}
beforeEach(() => {
  factory = new IDBFactory()
  memory = new Map()
  vi.stubGlobal('indexedDB', factory)
  vi.stubGlobal('localStorage', storage)
  setActivePinia(createPinia())
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function source(
  id = 'one',
  amount = 10,
  profileId = 'alice',
  occurredAt: string | undefined = NOW,
): PetLearningSource {
  return { id, amount, profileId, occurredAt, title: '完成课程', kind: 'lesson' }
}
function reward(overrides: Partial<RewardEvent> = {}): RewardEvent {
  return {
    id: 'r1',
    profileId: 'alice',
    type: 'lesson_completed',
    sourceId: 'session1',
    textbookId: 'book',
    knowledgePointId: 'kp',
    occurredAt: NOW,
    reward: { knowledgeEnergy: 10 },
    provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
    ...overrides,
  }
}
function funded(amount = 10) {
  return applyPetCommand(
    settlePetSources(freshPetAccount('alice'), [source('one', amount)], NOW),
    { kind: 'adopt', name: '芽芽' },
    'adopt',
    NOW,
  )
}
async function rawAccount(value?: unknown) {
  return new Promise<unknown>((resolve, reject) => {
    const request = factory.open(PET_DATABASE_NAME, 2)
    request.onupgradeneeded = () =>
      request.result.createObjectStore('accounts', { keyPath: 'profileId' })
    request.onsuccess = () => {
      const db = request.result,
        tx = db.transaction('accounts', value ? 'readwrite' : 'readonly'),
        store = tx.objectStore('accounts')
      let result: unknown
      if (value) store.put(value)
      else {
        const get = store.get('alice')
        get.onsuccess = () => {
          result = get.result
        }
      }
      tx.oncomplete = () => {
        db.close()
        resolve(result)
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error)
      }
    }
  })
}

describe('pet accounting rules', () => {
  it('separates cumulative learning points, spendable points, inventory and experience', () => {
    let account = funded()
    account = applyPetCommand(account, { kind: 'buy', foodId: 'apple' }, 'buy', NOW)
    expect(summarizePet(account)).toMatchObject({
      totalEarned: 10,
      balance: 5,
      totalSpent: 5,
      experience: 0,
      inventory: { apple: 1 },
    })
    account = applyPetCommand(account, { kind: 'feed', foodId: 'apple' }, 'feed', NOW)
    expect(summarizePet(account)).toMatchObject({
      totalEarned: 10,
      balance: 5,
      experience: 5,
      feedCount: 1,
      inventory: { apple: 0 },
    })
    expect(() => applyPetCommand(account, { kind: 'feed', foodId: 'apple' }, 'empty', NOW)).toThrow(
      '已经用完',
    )
  })
  it('settles old sources once, includes zero-grant receipts, and never releases capped points tomorrow', () => {
    const sources = Array.from({ length: 8 }, (_, i) => source(String(i)))
    const account = settlePetSources(freshPetAccount('alice'), sources, NOW)
    expect(account.events).toHaveLength(8)
    expect(summarizePet(account).balance).toBe(PET_DAILY_LIMIT)
    const later = settlePetSources(account, sources, '2026-09-08T02:00:00.000Z')
    expect(later).toEqual(account)
    expect(
      summarizePet(
        settlePetSources(
          account,
          [source('next', 10, 'alice', '2026-09-08T02:00:00.000Z')],
          '2026-09-08T02:00:00.000Z',
        ),
      ).balance,
    ).toBe(70)
  })
  it('caps partial grants and uses Beijing date boundaries', () => {
    const account = settlePetSources(
      freshPetAccount('alice'),
      [source('a', 58), source('b', 10)],
      NOW,
    )
    expect(account.events.at(-1)).toMatchObject({ amount: 2, requested: 10 })
    expect(petDay('2026-09-07T15:59:59.000Z')).toBe('2026-09-07')
    expect(petDay('2026-09-07T16:00:00.000Z')).toBe('2026-09-08')
    expect(
      settlePetSources(account, [source('future', 10, 'alice', '2026-09-09T00:00:00.000Z')], NOW),
    ).toEqual(account)
  })
  it('does not reward foreign profiles and treats retries as the same operation', () => {
    const account = funded()
    expect(settlePetSources(account, [source('bob', 20, 'bob')], NOW)).toEqual(account)
    const bought = applyPetCommand(account, { kind: 'buy', foodId: 'apple' }, 'same', NOW)
    expect(applyPetCommand(bought, { kind: 'buy', foodId: 'apple' }, 'same', NOW)).toEqual(bought)
    expect(() => applyPetCommand(bought, { kind: 'buy', foodId: 'bread' }, 'same', NOW)).toThrow(
      '编号',
    )
    expect(() =>
      applyPetCommand(account, { kind: 'adopt', name: '再领一只' }, 'other', NOW),
    ).toThrow('已经')
    expect(() => applyPetCommand(account, { kind: 'rename', name: '  ' }, 'rename', NOW)).toThrow(
      '1～12',
    )
  })
  it('unlocks and remembers growth stages without time decay or spending learner growth', () => {
    let account = funded(60)
    for (let i = 0; i < 4; i++) {
      account = applyPetCommand(account, { kind: 'buy', foodId: 'bento' }, `buy${i}`, NOW)
      account = applyPetCommand(account, { kind: 'feed', foodId: 'bento' }, `feed${i}`, NOW)
    }
    expect(summarizePet(account)).toMatchObject({
      totalEarned: 60,
      balance: 0,
      experience: 60,
      stageIndex: 2,
      stageReachedAt: [NOW, NOW, NOW, null, null],
    })
    expect(summarizePet(settlePetSources(account, [], '2027-09-07T00:00:00.000Z'))).toEqual(
      summarizePet(account),
    )
  })
  it('rejects corrupt arithmetic, duplicate credits and unsupported versions', () => {
    const account = funded()
    expect(() => validatePetAccount({ ...account, schemaVersion: 99 }, 'alice')).toThrow()
    expect(() => validatePetAccount(account, 'bob')).toThrow()
    expect(() =>
      validatePetAccount({ ...account, events: [...account.events, account.events[0]] }, 'alice'),
    ).toThrow('重复')
    expect(() =>
      validatePetAccount({ ...account, events: [{ ...account.events[0], amount: 11 }] }, 'alice'),
    ).toThrow('额度')
  })
})

describe('learning source reconciliation', () => {
  it('uses stable content identity across new sessions and excludes sample and unreviewed formal evidence', () => {
    expect(petSourceFromReward(reward())?.id).toBe(
      petSourceFromReward(reward({ id: 'r2', sourceId: 'session2' }))?.id,
    )
    for (const verificationStatus of ['SAMPLE', 'UNVERIFIED', 'REJECTED'] as const)
      expect(
        petSourceFromReward(reward({ provenance: { isSampleDerived: false, verificationStatus } })),
      ).toBeNull()
    expect(petSourceFromReward(reward({ provenance: { isSampleDerived: true } }))).toBeNull()
    expect(petSourceFromReward(reward({ occurredAt: 'bad' }))).toBeNull()
    expect(petSourceFromReward(reward({ type: 'review_completed' }))?.id).not.toBe(
      petSourceFromReward(
        reward({ type: 'review_completed', occurredAt: '2026-09-08T02:00:00.000Z' }),
      )?.id,
    )
  })
  it('combines all allowed subject rewards with persisted thinking completion without changing source data', () => {
    const mission = thinkingMissions[0]!
    memory.set(
      REWARD_EVENT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        events: [
          reward(),
          reward({ id: 'r2', sourceId: 'session2' }),
          reward({ profileId: 'bob' }),
        ],
      }),
    )
    memory.set(
      thinkingProgressKey('alice'),
      JSON.stringify(
        withSolvedThinkingPuzzle(
          freshThinkingProgress('alice'),
          mission.id,
          mission.puzzles[0]!.id,
        ),
      ),
    )
    const before = [...memory]
    const { sources, warnings } = collectPetSources(storage, 'alice')
    expect(warnings).toEqual([])
    expect(summarizePet(settlePetSources(freshPetAccount('alice'), sources, NOW)).totalEarned).toBe(
      13,
    )
    expect([...memory]).toEqual(before)
  })
  it('preserves malformed learning sources and never grants unsaved completions', () => {
    memory.set(REWARD_EVENT_STORAGE_KEY, '{bad')
    memory.set(thinkingProgressKey('alice'), '{bad')
    const before = [...memory]
    expect(collectPetSources(storage, 'alice')).toMatchObject({
      sources: [],
      warnings: [expect.any(String), expect.any(String)],
    })
    expect([...memory]).toEqual(before)
    memory.clear()
    expect(collectPetSources(storage, 'alice').sources).toEqual([])
  })
  it('rewards an entire persisted story practice once, but not partial practice or unknown content', () => {
    const quest = createStoryPractice(readingStories[0]!)
    const progress = freshQuestProgress('alice', quest)
    expect(questPetSource(storage, 'alice', quest)).toBeNull()
    progress.completedStageIds = quest.stages.map((s) => s.id)
    progress.passedIds = [...progress.completedStageIds]
    progress.activeStageId = quest.stages.at(-1)!.id
    progress.summaryVisible = true
    expect(saveQuestProgress(storage, progress, quest)).toBeNull()
    expect(questPetSource(storage, 'alice', quest)).toMatchObject({
      kind: 'quest',
      amount: 10,
      profileId: 'alice',
    })
    expect(questPetSource(storage, 'bob', quest)).toBeNull()
  })
})

describe('transactional pet persistence', () => {
  it('survives reload and isolates accounts', async () => {
    const repository = createPetRepository(() => factory)
    await repository.update('alice', () => funded())
    expect(
      summarizePet(await createPetRepository(() => factory).update('alice', (a) => a)).balance,
    ).toBe(10)
    expect(summarizePet(await repository.update('bob', (a) => a)).balance).toBe(0)
  })
  it('serializes two tabs spending the final points and feeding the final item', async () => {
    const a = createPetRepository(() => factory),
      b = createPetRepository(() => factory)
    await a.update('alice', () => funded(5))
    const buy = await Promise.allSettled([
      a.update('alice', (x) => applyPetCommand(x, { kind: 'buy', foodId: 'apple' }, 'b1', NOW)),
      b.update('alice', (x) => applyPetCommand(x, { kind: 'buy', foodId: 'apple' }, 'b2', NOW)),
    ])
    expect(buy.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const feed = await Promise.allSettled([
      a.update('alice', (x) => applyPetCommand(x, { kind: 'feed', foodId: 'apple' }, 'f1', NOW)),
      b.update('alice', (x) => applyPetCommand(x, { kind: 'feed', foodId: 'apple' }, 'f2', NOW)),
    ])
    expect(feed.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(summarizePet(await a.update('alice', (x) => x))).toMatchObject({
      balance: 0,
      experience: 5,
      inventory: { apple: 0 },
    })
  })
  it('deduplicates simultaneous reward synchronization and repeated command IDs', async () => {
    const a = createPetRepository(() => factory),
      b = createPetRepository(() => factory)
    await Promise.all([
      a.update('alice', (x) => settlePetSources(x, [source()], NOW)),
      b.update('alice', (x) => settlePetSources(x, [source()], NOW)),
    ])
    await Promise.all([
      a.update('alice', (x) => applyPetCommand(x, { kind: 'adopt', name: '芽芽' }, 'same', NOW)),
      b.update('alice', (x) => applyPetCommand(x, { kind: 'adopt', name: '芽芽' }, 'same', NOW)),
    ])
    expect((await a.update('alice', (x) => x)).events).toHaveLength(2)
  })
  it('preserves incompatible data instead of replacing it with a new wallet', async () => {
    const broken = { schemaVersion: 99, profileId: 'alice', note: 'keep me' }
    await rawAccount(broken)
    await expect(
      createPetRepository(() => factory).update('alice', () => funded()),
    ).rejects.toThrow('格式')
    expect(await rawAccount()).toEqual(broken)
  })
  it('rolls back a failed write, then allows retry without phantom inventory', async () => {
    const repository = createPetRepository(() => factory)
    await repository.update('alice', () => funded())
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    await expect(
      repository.update('alice', (x) =>
        applyPetCommand(x, { kind: 'buy', foodId: 'apple' }, 'buy', NOW),
      ),
    ).rejects.toThrow()
    put.mockRestore()
    expect(summarizePet(await repository.update('alice', (x) => x))).toMatchObject({
      balance: 10,
      inventory: { apple: 0 },
    })
    expect(
      summarizePet(
        await repository.update('alice', (x) =>
          applyPetCommand(x, { kind: 'buy', foodId: 'apple' }, 'buy', NOW),
        ),
      ).balance,
    ).toBe(5)
  })
  it('reports unavailable storage and replays sources after a failed settlement', async () => {
    await expect(createPetRepository(() => undefined).update('alice', (x) => x)).rejects.toThrow(
      '暂不支持',
    )
    memory.set(REWARD_EVENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, events: [reward()] }))
    const service = createPetService(
      createPetRepository(() => factory),
      () => storage,
      () => NOW,
    )
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new Error('disk full')
    })
    await expect(service.run('alice')).rejects.toThrow()
    put.mockRestore()
    expect(summarizePet((await service.run('alice')).account).balance).toBe(10)
    expect(summarizePet((await service.run('alice')).account).balance).toBe(10)
  })
})

describe('pet interface and active profile', () => {
  it('resolves the same curriculum, personal and local profile everywhere', () => {
    const student = useStudentStore(),
      curriculum = useCurriculumStore()
    const { profileId } = useLearningProfile()
    expect(profileId.value).toBe('local-profile')
    student.profile = { id: 'alice', displayName: '小青' }
    expect(profileId.value).toBe('alice')
    curriculum.curriculumProfile = { studentId: 'bob' } as NonNullable<
      typeof curriculum.curriculumProfile
    >
    expect(profileId.value).toBe('bob')
  })
  it('discards a late response from the previous profile', async () => {
    let resolve!: (value: { account: PetAccount; warning: null }) => void
    vi.spyOn(petService, 'run')
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          }),
      )
      .mockResolvedValueOnce({ account: freshPetAccount('bob'), warning: null })
    const store = usePetStore()
    const first = store.sync('alice')
    await store.sync('bob')
    resolve({ account: funded(60), warning: null })
    await first
    expect(store.profileId).toBe('bob')
    expect(store.summary.balance).toBe(0)
  })
  it('adopts, buys and feeds with visible balances and reload recovery', async () => {
    useStudentStore().profile = { id: 'alice', displayName: '小青' }
    memory.set(REWARD_EVENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, events: [reward()] }))
    const wrapper = mount(PetGarden, {
      global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
    })
    const waitReady = async () => {
      await vi.waitFor(() => expect(usePetStore().loading || usePetStore().busy).toBe(false))
      await flushPromises()
    }
    await waitReady()
    await wrapper.get('#pet-name').setValue('小芽')
    await wrapper.get('form').trigger('submit')
    await waitReady()
    expect(wrapper.text()).toContain('小芽')
    await wrapper.get('[aria-label="兑换脆甜苹果"]').trigger('click')
    await waitReady()
    expect(wrapper.get('[aria-label="脆甜苹果库存"]').text()).toContain('1 份')
    await wrapper.get('[aria-label="喂食脆甜苹果"]').trigger('click')
    await waitReady()
    expect(wrapper.get('[aria-label="脆甜苹果库存"]').text()).toContain('0 份')
    expect(usePetStore().summary).toMatchObject({ balance: 5, experience: 5, totalEarned: 10 })
    expect(wrapper.get('[aria-label="喂食脆甜苹果"]').attributes('disabled')).toBeDefined()
    await usePetStore().sync('alice')
    expect(usePetStore().summary.experience).toBe(5)
    wrapper.unmount()
  })
})

describe('complete curriculum reward coverage', () => {
  it('recognizes saved Chinese, mathematics and English quests, and deduplicates changed training variants', async () => {
    const { curriculumData } = await import('@/data/curriculum')
    const { StaticContentExpansionRepository } =
      await import('@/services/content-expansion/contentExpansionRepository')
    const { createReadingQuest, questReadingText } =
      await import('@/services/content-expansion/readingQuest')
    const { createTrainingQuest } = await import('@/services/content-expansion/trainingQuest')
    const bundles = await new StaticContentExpansionRepository().listBundles('candidate')
    for (const code of ['CHINESE', 'BNU_MATH', 'ENGLISH']) {
      const bundle = bundles.find(
        (item) => item.textbookId.includes(code) && !item.learningContent.isSample,
      )!
      const content = curriculumData.courseContents.find(
        (item) => item.knowledgePointId === bundle.knowledgePointId,
      )!
      const blocks = content.body['blocks'] as import('@/types').ContentBlock[]
      const input = {
        bundle,
        title: content.title,
        text: questReadingText(
          blocks.map((block, index) => ({
            id: String(index),
            type: 'intro' as const,
            content: block.text,
            isSample: false,
            sort: index,
          })),
        ),
      }
      const quest = createReadingQuest(input)!
      expect(quest, code).toBeTruthy()
      const saveComplete = (q: import('@/types/reading-quest').ReadingPracticeQuest) => {
        const progress = freshQuestProgress('alice', q)
        progress.completedStageIds = q.stages.map((s) => s.id)
        progress.passedIds = [...progress.completedStageIds]
        progress.activeStageId = q.stages.at(-1)!.id
        progress.summaryVisible = true
        expect(saveQuestProgress(storage, progress, q)).toBeNull()
        return questPetSource(storage, 'alice', q)
      }
      const first = saveComplete(quest)
      expect(first, code).toMatchObject({ amount: 10, kind: 'quest' })
      const variant = createTrainingQuest({ ...input, variant: 1 })!
      expect(saveComplete(variant)?.id).toBe(first?.id)
    }
  })
  it('allows only one of two simultaneous store actions', async () => {
    memory.set(REWARD_EVENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, events: [reward()] }))
    const store = usePetStore()
    await store.sync('alice')
    await store.act({ kind: 'adopt', name: '小芽' })
    const result = await Promise.all([
      store.act({ kind: 'buy', foodId: 'apple' }),
      store.act({ kind: 'buy', foodId: 'apple' }),
    ])
    expect(result).toEqual([true, false])
    expect(store.summary).toMatchObject({ balance: 5, inventory: { apple: 1 } })
  })
})
