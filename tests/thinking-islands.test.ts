import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { thinkingIslands, thinkingMissions, findThinkingMission } from '@/data/thinking/islands'
import {
  THINKING_SOURCE,
  thinkingPuzzleSchema,
  type ThinkingDraft,
  type ThinkingPuzzle,
} from '@/types/thinking'
import {
  checkThinkingAnswer,
  emptyThinkingDraft,
  isThinkingStep,
} from '@/services/thinking/thinkingValidator'
import {
  freshThinkingProgress,
  readThinkingProgress,
  thinkingProgressKey,
  thinkingProgressSchema,
  withSolvedThinkingPuzzle,
  THINKING_PROGRESS_PREFIX,
} from '@/services/thinking/thinkingProgressStorage'
import { useThinkingStore } from '@/stores/thinkingStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import ThinkingPlayer from '@/components/thinking/ThinkingPlayer.vue'
import ThinkingIslandsPage from '@/pages/ThinkingIslandsPage.vue'
import ThinkingMissionPage from '@/pages/ThinkingMissionPage.vue'

let items: Map<string, string>
beforeEach(() => {
  items = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value)
    },
    removeItem: (key: string) => {
      items.delete(key)
    },
    clear: () => items.clear(),
  })
  setActivePinia(createPinia())
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function permutations<T>(values: T[]): T[][] {
  return values.length
    ? values.flatMap((value, i) =>
        permutations(values.filter((_, j) => j !== i)).map((rest) => [value, ...rest]),
      )
    : [[]]
}
function subsets<T>(values: T[]): T[][] {
  return values.reduce<T[][]>(
    (sets, value) => [...sets, ...sets.map((set) => [...set, value])],
    [[]],
  )
}
function validOrders(puzzle: Extract<ThinkingPuzzle, { kind: 'order' }>) {
  return permutations(puzzle.cards.map((card) => card.id)).filter((ids) =>
    puzzle.before.every(([a, b]) => ids.indexOf(a) < ids.indexOf(b)),
  )
}
function validAssignments(puzzle: Extract<ThinkingPuzzle, { kind: 'assign' }>) {
  return permutations(puzzle.items.map((item) => item.id))
    .map((ids) => Object.fromEntries(puzzle.people.map((person, i) => [person.id, ids[i]!])))
    .filter((draft) =>
      puzzle.clues.every((clue) =>
        clue.relation === 'is'
          ? draft[clue.personId] === clue.itemId
          : draft[clue.personId] !== clue.itemId,
      ),
    )
}
function validPacks(puzzle: Extract<ThinkingPuzzle, { kind: 'pack' }>) {
  return subsets(puzzle.items)
    .filter(
      (set) =>
        set.reduce((sum, item) => sum + item.cost, 0) === puzzle.target &&
        (!puzzle.count || set.length === puzzle.count),
    )
    .map((set) => set.map((item) => item.id))
}

// The path oracle does not use the production movement/check functions.
function solvePath(puzzle: Extract<ThinkingPuzzle, { kind: 'path' }>): number[] | null {
  const queue = [[puzzle.start]],
    seen = new Set<string>()
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const route = queue[cursor]!,
      cell = route.at(-1)!
    if (cell === puzzle.goal && puzzle.via.every((stop) => route.includes(stop))) return route
    if (route.length - 1 === puzzle.maxSteps) continue
    for (const [dr, dc] of [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]) {
      const row = Math.floor(cell / puzzle.columns) + dr!,
        col = (cell % puzzle.columns) + dc!
      if (row < 0 || row >= puzzle.rows || col < 0 || col >= puzzle.columns) continue
      const next = row * puzzle.columns + col
      if (puzzle.blocked.includes(next)) continue
      const draft = [...route, next],
        key = `${next}:${puzzle.via.map((stop) => Number(draft.includes(stop))).join('')}`
      if (!seen.has(key)) {
        seen.add(key)
        queue.push(draft)
      }
    }
  }
  return null
}
function solveSudoku(puzzle: Extract<ThinkingPuzzle, { kind: 'sudoku' }>): number[][] {
  const solutions: number[][] = []
  const values = [...puzzle.givens]
  function search() {
    const i = values.indexOf(0)
    if (i === -1) {
      solutions.push([...values])
      return
    }
    const row = Math.floor(i / 4),
      col = i % 4
    for (let n = 1; n <= 4; n++) {
      const conflicts = values.some(
        (v, j) =>
          v === n &&
          (Math.floor(j / 4) === row ||
            j % 4 === col ||
            (Math.floor(j / 8) === Math.floor(row / 2) &&
              Math.floor((j % 4) / 2) === Math.floor(col / 2))),
      )
      if (!conflicts) {
        values[i] = n
        search()
        values[i] = 0
      }
    }
  }
  search()
  return solutions
}
function solveSwitches(puzzle: Extract<ThinkingPuzzle, { kind: 'switches' }>): string[][] {
  // Independently count flips; any repeated pair cancels, so a shortest plan uses each at most once.
  return subsets(puzzle.switches)
    .filter(
      (set) =>
        set.length <= puzzle.maxMoves &&
        puzzle.initial.every(
          (on, cell) =>
            (Number(on) + set.filter((s) => s.affects.includes(cell)).length) % 2 ===
            Number(puzzle.target[cell]),
        ),
    )
    .map((set) => set.map((s) => s.id))
}
function solution(puzzle: ThinkingPuzzle): ThinkingDraft {
  switch (puzzle.kind) {
    case 'sudoku':
      return solveSudoku(puzzle)[0]!
    case 'switches':
      return solveSwitches(puzzle)[0]!
    case 'pick':
      return [...puzzle.correctIds]
    case 'assign':
      return validAssignments(puzzle)[0]!
    case 'order':
      return validOrders(puzzle)[0]!
    case 'pack':
      return validPacks(puzzle)[0]!
    case 'path':
      return solvePath(puzzle)!
  }
}
const first = thinkingMissions[0]!,
  firstPuzzle = first.puzzles[0]!
const puzzleOf = <K extends ThinkingPuzzle['kind']>(kind: K) =>
  thinkingMissions
    .flatMap((m) => m.puzzles)
    .find((p): p is Extract<ThinkingPuzzle, { kind: K }> => p.kind === kind)!
const global = {
  stubs: {
    AppShell: { template: '<main><slot /></main>' },
    RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  },
}
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!
const player = (missionId = first.id, profileId = 'p1') =>
  mount(ThinkingPlayer, {
    props: { mission: thinkingMissions.find((m) => m.id === missionId)!, profileId },
    global,
  })

describe('original thinking island catalogue', () => {
  it('has four independent islands, three levels each, and 60 source-labelled tasks', () => {
    expect(thinkingIslands).toHaveLength(4)
    expect(new Set(thinkingIslands.map((i) => i.id)).size).toBe(4)
    expect(thinkingMissions).toHaveLength(15)
    const puzzles = thinkingMissions.flatMap((m) => m.puzzles)
    expect(puzzles).toHaveLength(60)
    expect(new Set(puzzles.map((p) => p.id)).size).toBe(60)
    expect(new Set(puzzles.map((p) => p.kind)).size).toBe(7)
    for (const island of thinkingIslands) {
      expect(
        [
          ...new Set(thinkingMissions.filter((m) => m.islandId === island.id).map((m) => m.level)),
        ].sort(),
      ).toEqual(['入门', '进阶', '挑战'].sort())
    }
    for (const mission of thinkingMissions) {
      expect(mission.sourceId).toBe(THINKING_SOURCE.id)
      expect(mission.version).toBe(1)
      expect(mission.puzzles).toHaveLength(4)
      expect(mission).not.toHaveProperty('textbookId')
    }
    expect(THINKING_SOURCE).toMatchObject({
      authorship: 'AI_ASSISTED_ORIGINAL',
      textbookDerived: false,
      humanReviewed: false,
    })
    expect(findThinkingMission('space', 'pattern-train')).toBeUndefined()
    expect(findThinkingMission('patterns', 'missing')).toBeUndefined()
  })

  it.each(thinkingMissions)(
    '$id has schema-valid, solvable tasks without mutating source content',
    (mission) => {
      const before = JSON.stringify(mission)
      for (const puzzle of mission.puzzles) {
        expect(thinkingPuzzleSchema.safeParse(puzzle).success, puzzle.id).toBe(true)
        expect(checkThinkingAnswer(puzzle, emptyThinkingDraft(puzzle)).status).toBe('incomplete')
        const draft = solution(puzzle)
        expect(draft, `${puzzle.id}: unsolvable`).toBeTruthy()
        expect(checkThinkingAnswer(puzzle, draft).status, puzzle.id).toBe('correct')
        if (puzzle.kind === 'sudoku') {
          expect(solveSudoku(puzzle)).toHaveLength(1)
        } else if (puzzle.kind === 'switches') {
          expect(puzzle.target).toHaveLength(puzzle.initial.length)
          for (const control of puzzle.switches) {
            expect(new Set(control.affects).size).toBe(control.affects.length)
            expect(control.affects.every((cell) => cell < puzzle.initial.length)).toBe(true)
          }
          const plans = solveSwitches(puzzle)
          expect(Math.min(...plans.map((plan) => plan.length))).toBe(puzzle.maxMoves)
          for (const plan of plans) expect(checkThinkingAnswer(puzzle, plan).status).toBe('correct')
        } else if (puzzle.kind === 'pick') {
          expect(new Set(puzzle.options.map((o) => o.id)).size).toBe(puzzle.options.length)
          expect(puzzle.correctIds.every((id) => puzzle.options.some((o) => o.id === id))).toBe(
            true,
          )
        } else if (puzzle.kind === 'order') {
          const options = validOrders(puzzle)
          expect(options.length).toBeGreaterThan(0)
          for (const order of options)
            expect(checkThinkingAnswer(puzzle, order).status).toBe('correct')
          for (const [a, b] of puzzle.before)
            expect(
              puzzle.cards.some((c) => c.id === a) &&
                puzzle.cards.some((c) => c.id === b) &&
                a !== b,
            ).toBe(true)
        } else if (puzzle.kind === 'assign') {
          expect(validAssignments(puzzle)).toHaveLength(1)
          for (const clue of puzzle.clues)
            expect(
              puzzle.people.some((p) => p.id === clue.personId) &&
                puzzle.items.some((i) => i.id === clue.itemId),
            ).toBe(true)
        } else if (puzzle.kind === 'pack') {
          for (const pack of validPacks(puzzle))
            expect(checkThinkingAnswer(puzzle, pack).status).toBe('correct')
        } else {
          const cells = [puzzle.start, puzzle.goal, ...puzzle.via, ...puzzle.blocked]
          expect(cells.every((c) => c >= 0 && c < puzzle.rows * puzzle.columns)).toBe(true)
          expect(
            puzzle.blocked.some((c) => [puzzle.start, puzzle.goal, ...puzzle.via].includes(c)),
          ).toBe(false)
        }
      }
      expect(JSON.stringify(mission)).toBe(before)
    },
  )
})

describe('thinking answer validation', () => {
  it('requires exact multi-selection and rejects duplicates and unknown IDs', () => {
    const p = thinkingMissions[0]!.puzzles[3]!
    expect(checkThinkingAnswer(p, ['0']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, ['0', '2', '1']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, ['2', '0']).status).toBe('correct')
    expect(checkThinkingAnswer(p, ['0', '0', '2']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, ['bad']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, [0, 2]).status).toBe('incorrect')
  })
  it('checks assignment uniqueness, complete coverage, and every clue', () => {
    const p = puzzleOf('assign')
    expect(checkThinkingAnswer(p, { '0': '1' }).status).toBe('incomplete')
    expect(checkThinkingAnswer(p, { '0': '1', '1': '1', '2': '2' }).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, { '0': '0', '1': '1', '2': '2' }).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, { '0': '1', '1': '0', '2': '2', outsider: '0' }).status).toBe(
      'incorrect',
    )
  })
  it('accepts alternative dependency orders, but not partial or repeated cards', () => {
    const p = thinkingMissions.find((m) => m.id === 'queue-detective')!.puzzles[3]!
    expect(checkThinkingAnswer(p, ['1', '2', '0']).status).toBe('correct')
    expect(checkThinkingAnswer(p, ['2', '1', '0']).status).toBe('correct')
    expect(checkThinkingAnswer(p, ['1', '0', '2']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, ['1', '2']).status).toBe('incomplete')
    expect(checkThinkingAnswer(p, ['1', '2', '2']).status).toBe('incorrect')
  })
  it('checks both sum and count, while allowing more than one packing solution', () => {
    const p = thinkingMissions.find((m) => m.id === 'packing-studio')!.puzzles[1]!
    expect(checkThinkingAnswer(p, ['1', '4']).status).toBe('correct')
    expect(checkThinkingAnswer(p, ['2', '3']).status).toBe('correct')
    expect(checkThinkingAnswer(p, ['0', '1', '3']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, ['1', '1', '1', '1']).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, ['4']).status).toBe('incorrect')
  })
  it('allows different paths but rejects wrapping, diagonals, obstacles, and wrong start', () => {
    const p = puzzleOf('path')
    expect(checkThinkingAnswer(p, [6, 3, 0, 1, 2]).status).toBe('correct')
    expect(checkThinkingAnswer(p, [6, 7, 8, 5, 2]).status).toBe('correct')
    expect(isThinkingStep(p, 2, 3)).toBe(false)
    expect(isThinkingStep(p, 6, 4)).toBe(false)
    expect(isThinkingStep(p, 0, -1)).toBe(false)
    expect(isThinkingStep(p, 0, NaN)).toBe(false)
    expect(checkThinkingAnswer(p, [3, 0, 1, 2]).status).toBe('incorrect')
    expect(checkThinkingAnswer({ ...p, blocked: [3] }, [6, 3, 0, 1, 2]).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, [6, 3, 4, 5, 2]).status).toBe('correct')
  })
  it('checks checkpoints and step budget even after reaching the goal', () => {
    const p = { ...puzzleOf('path'), via: [0] }
    expect(checkThinkingAnswer(p, [6, 7, 8, 5, 2]).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, [6, 3, 0, 1, 0, 1, 2]).status).toBe('incorrect')
    expect(checkThinkingAnswer(p, [6, 3, 0]).status).toBe('incomplete')
  })
})

describe('isolated local thinking progress', () => {
  it('persists only correctly completed IDs, idempotently, in the owning profile', () => {
    const store = useThinkingStore()
    store.submit('alice', first.id, firstPuzzle.id, ['wrong'])
    expect(items.size).toBe(0)
    store.submit('alice', first.id, firstPuzzle.id, solution(firstPuzzle))
    store.submit('alice', first.id, firstPuzzle.id, solution(firstPuzzle))
    expect(store.completed(first.id)).toEqual([firstPuzzle.id])
    expect([...items.keys()]).toEqual([
      thinkingProgressKey('alice'),
      'knowledge-island.activities.v1:alice',
    ])
    expect(
      thinkingProgressSchema.safeParse(JSON.parse(items.get(thinkingProgressKey('alice'))!))
        .success,
    ).toBe(true)
    expect(items.get(thinkingProgressKey('alice'))).not.toContain('draft')
    store.load('bob')
    expect(store.completed(first.id)).toEqual([])
    setActivePinia(createPinia())
    useThinkingStore().load('alice')
    expect(useThinkingStore().completed(first.id)).toEqual([firstPuzzle.id])
  })
  it('rejects mismatched mission/puzzle IDs and preserves all other domain keys', () => {
    items.set('knowledge-island.mastery', 'unchanged')
    items.set('knowledge-island.question-session', 'immutable')
    const before = [...items]
    useThinkingStore().submit('p1', 'clue-houses', firstPuzzle.id, solution(firstPuzzle))
    expect([...items]).toEqual(before)
    useThinkingStore().submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle))
    expect(
      [...items].filter(
        ([key]) =>
          !key.startsWith(THINKING_PROGRESS_PREFIX) &&
          !key.startsWith('knowledge-island.activities.v1:'),
      ),
    ).toEqual(before)
    expect(withSolvedThinkingPuzzle(freshThinkingProgress('p1'), first.id, 'bad')).toBeNull()
  })
  it.each([
    '',
    '{broken',
    JSON.stringify({ schemaVersion: 2, profileId: 'p1', records: [] }),
    JSON.stringify({ schemaVersion: 1, profileId: 'someone-else', records: [] }),
    JSON.stringify({
      schemaVersion: 1,
      profileId: 'p1',
      records: [{ missionId: first.id, contentVersion: 2, completedPuzzleIds: [firstPuzzle.id] }],
    }),
    JSON.stringify({
      schemaVersion: 1,
      profileId: 'p1',
      records: [{ missionId: first.id, contentVersion: 1, completedPuzzleIds: ['bad'] }],
    }),
    JSON.stringify({
      schemaVersion: 1,
      profileId: 'p1',
      records: [
        {
          missionId: first.id,
          contentVersion: 1,
          completedPuzzleIds: [firstPuzzle.id, firstPuzzle.id],
        },
      ],
    }),
  ])(
    'preserves unreadable, incompatible, or foreign records and allows in-memory play (%#)',
    (raw) => {
      items.set(thinkingProgressKey('p1'), raw)
      const loaded = readThinkingProgress(window.localStorage, 'p1')
      expect(loaded.writable).toBe(false)
      expect(loaded.warning).toBeTruthy()
      expect(loaded.data.records).toEqual([])
      const store = useThinkingStore()
      expect(store.submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle)).status).toBe(
        'correct',
      )
      expect(store.completed(first.id)).toEqual([firstPuzzle.id])
      expect(items.get(thinkingProgressKey('p1'))).toBe(raw)
    },
  )
  it('retries quota failures on the next correct answer, even the same task', () => {
    const set = vi.spyOn(window.localStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota')
    })
    const store = useThinkingStore()
    store.submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle))
    expect(store.warning).toContain('暂时未保存')
    expect(store.completed(first.id)).toEqual([firstPuzzle.id])
    store.submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle))
    expect(set.mock.calls.filter(([key]) => key.startsWith(THINKING_PROGRESS_PREFIX))).toHaveLength(
      2,
    )
    expect(store.warning).toBeNull()
    expect(
      readThinkingProgress(window.localStorage, 'p1').data.records[0]?.completedPuzzleIds,
    ).toEqual([firstPuzzle.id])
  })
  it('merges newer completion IDs before writing, rather than losing another tab’s work', () => {
    const store = useThinkingStore()
    store.load('p1')
    const second = first.puzzles[1]!
    items.set(
      thinkingProgressKey('p1'),
      JSON.stringify(withSolvedThinkingPuzzle(freshThinkingProgress('p1'), first.id, second.id)),
    )
    store.submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle))
    expect(new Set(store.completed(first.id))).toEqual(new Set([firstPuzzle.id, second.id]))
  })
  it('does not overwrite corruption that appeared after loading', () => {
    const store = useThinkingStore()
    store.load('p1')
    items.set(thinkingProgressKey('p1'), '{broken')
    store.submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle))
    expect(items.get(thinkingProgressKey('p1'))).toBe('{broken')
    expect(store.warning).toBeTruthy()
  })
  it('continues safely if reading browser storage is blocked', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('security')
    })
    expect(
      useThinkingStore().submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle)).status,
    ).toBe('correct')
    expect(useThinkingStore().warning).toBeTruthy()
    expect(items.size).toBe(0)
  })
})

describe('thinking game interaction', () => {
  it('requires correct work to advance; hints and wrong attempts never complete a task', async () => {
    const wrapper = player()
    expect(button(wrapper, '检查方案').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('.thinking-task-trail button')[1]!.attributes('disabled')).toBeDefined()
    await wrapper.findAll('input')[0]!.setValue(true)
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.find('.thinking-feedback').exists()).toBe(true)
    expect(useThinkingStore().completed(first.id)).toEqual([])
    await button(wrapper, '给我一点提示').trigger('click')
    await button(wrapper, '再给一步提示').trigger('click')
    expect(wrapper.findAll('.thinking-hints p')).toHaveLength(2)
    await wrapper.findAll('input')[1]!.setValue(true)
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    expect(useThinkingStore().completed(first.id)).toEqual([firstPuzzle.id])
    await button(wrapper, '下一个任务').trigger('click')
    expect(wrapper.get('#thinking-task-title').text()).toBe(first.puzzles[1]!.title)
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    wrapper.unmount()
  })
  it('resumes unfinished work, does not persist drafts, and resets local UI for a new profile', async () => {
    useThinkingStore().submit('p1', first.id, firstPuzzle.id, solution(firstPuzzle))
    const wrapper = player()
    expect(wrapper.get('#thinking-task-title').text()).toBe(first.puzzles[1]!.title)
    await wrapper.findAll('input')[0]!.setValue(true)
    await wrapper.setProps({ profileId: 'p2' })
    expect(wrapper.get('#thinking-task-title').text()).toBe(firstPuzzle.title)
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    await wrapper.setProps({ profileId: 'p1' })
    expect(wrapper.get('#thinking-task-title').text()).toBe(first.puzzles[1]!.title)
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    wrapper.unmount()
  })
  it('supports a full round, multi-selection, summary and replay without deleting progress', async () => {
    const wrapper = player()
    for (const p of first.puzzles) {
      if (p.kind !== 'pick') throw new Error('expected pick')
      for (const id of p.correctIds)
        await wrapper.findAll('input')[p.options.findIndex((o) => o.id === id)]!.setValue(true)
      await button(wrapper, '检查方案').trigger('click')
      await button(wrapper, p === first.puzzles.at(-1) ? '查看路线小结' : '下一个任务').trigger(
        'click',
      )
    }
    expect(wrapper.get('#thinking-summary-title').text()).toContain('探索完成')
    expect(useThinkingStore().completed(first.id)).toHaveLength(4)
    const saved = items.get(thinkingProgressKey('p1'))
    await button(wrapper, '重新挑战这条路线').trigger('click')
    expect(wrapper.get('#thinking-task-title').text()).toBe(firstPuzzle.title)
    expect(wrapper.text()).toContain('0 / 4 已完成')
    expect(items.get(thinkingProgressKey('p1'))).toBe(saved)
    wrapper.unmount()
    const restored = player()
    expect(restored.find('#thinking-summary-title').exists()).toBe(true)
    expect(restored.text()).not.toContain('本次练习中')
    restored.unmount()
  })
  it('lets children reassign a used item without duplicate ownership', async () => {
    const wrapper = player('clue-houses')
    const people = () => wrapper.findAll('[aria-label="选择伙伴"] button')
    const choices = () => wrapper.findAll('[aria-label="选择对应物品"] button')
    await people()[0]!.trigger('click')
    await choices()[1]!.trigger('click')
    await people()[1]!.trigger('click')
    await choices()[1]!.trigger('click')
    expect(people()[0]!.text()).toContain('待配对')
    expect(people()[1]!.text()).toContain('方顶屋')
    for (const [person, item] of Object.entries(solution(puzzleOf('assign')))) {
      await people()[Number(person)]!.trigger('click')
      await choices()[Number(item)]!.trigger('click')
    }
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    wrapper.unmount()
  })
  it('allows ordering cards, undoing a choice, and checking the plan', async () => {
    const wrapper = player('queue-detective')
    await wrapper.findAll('.thinking-card-bank button')[0]!.trigger('click')
    await wrapper.get('.thinking-answer-tray button').trigger('click')
    expect(wrapper.findAll('.thinking-answer-tray button')).toHaveLength(0)
    for (const id of ['2', '1', '0'])
      await wrapper.findAll('.thinking-card-bank button')[Number(id)]!.trigger('click')
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    wrapper.unmount()
  })
  it('moves and backtracks on the grid without any input field', async () => {
    usePreferencesStore().preferences.reducedMotion = true
    const wrapper = player('direction-guide')
    expect(wrapper.find('input').exists()).toBe(false)
    await button(wrapper, '向上走').trigger('click')
    expect(wrapper.get('.thinking-path-status').text()).toContain('已走 1 / 4')
    await button(wrapper, '撤回一步').trigger('click')
    expect(wrapper.get('.thinking-path-status').text()).toContain('已走 0 / 4')
    for (const label of ['向右走', '向右走', '向上走', '向上走'])
      await button(wrapper, label).trigger('click')
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    wrapper.unmount()
  })
  it('selects and cancels materials with a visible sum and multiple valid combinations', async () => {
    const wrapper = player('packing-studio')
    const cards = () => wrapper.findAll('.thinking-pack-items button')
    await cards()[0]!.trigger('click')
    await cards()[0]!.trigger('click')
    expect(wrapper.get('.thinking-pack-total').text()).toContain('总长度 0 / 8')
    await cards()[1]!.trigger('click')
    await cards()[4]!.trigger('click')
    expect(wrapper.get('.thinking-pack-total').text()).toContain('总长度 8 / 8')
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    wrapper.unmount()
  })
})

describe('thinking routes without textbook configuration', () => {
  it('shows all islands and missions, and rejects invalid cross-island links', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', component: { template: '<main>Home</main>' } },
        { path: '/learning-map', component: { template: '<main>Map</main>' } },
        { path: '/thinking-islands', component: ThinkingIslandsPage },
        { path: '/thinking-islands/:islandId', component: ThinkingIslandsPage },
        { path: '/thinking-islands/:islandId/:missionId', component: ThinkingMissionPage },
      ],
    })
    await router.push('/thinking-islands')
    await router.isReady()
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [router], stubs: { AppShell: global.stubs.AppShell } } },
    )
    await flushPromises()
    expect(wrapper.findAll('.thinking-island-card')).toHaveLength(4)
    await router.push('/thinking-islands/logic')
    await flushPromises()
    expect(wrapper.findAll('.thinking-mission-stop')).toHaveLength(4)
    await router.push('/thinking-islands/logic/clue-houses')
    await flushPromises()
    expect(wrapper.get('#thinking-task-title').text()).toBe('谁住哪间屋')
    await router.push('/thinking-islands/space/clue-houses')
    await flushPromises()
    expect(wrapper.text()).toContain('这个任务暂时找不到')
    await router.push('/thinking-islands/unknown')
    await flushPromises()
    expect(wrapper.text()).toContain('这座小岛还没有开放')
    wrapper.unmount()
  })
})

describe('reasoning boards', () => {
  it('replays repeated switches, undoes moves, limits actions and saves correct work', async () => {
    const wrapper = player('switch-discovery')
    const controls = () => wrapper.findAll('.thinking-switch-controls button')
    await controls()[1]!.trigger('click')
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.get('.thinking-feedback').text()).toContain('第1盏灯')
    expect(useThinkingStore().completed('switch-discovery')).toEqual([])
    expect(controls().every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await button(wrapper, '撤回一步').trigger('click')
    expect(wrapper.get('.thinking-switch-count').text()).toContain('0 / 1')
    await controls()[0]!.trigger('click')
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    await button(wrapper, '下一个任务').trigger('click')
    await controls()[0]!.trigger('click')
    await controls()[0]!.trigger('click')
    expect(wrapper.findAll('[aria-label="当前灯光"] .is-on')).toHaveLength(0)
    await button(wrapper, '清空方案').trigger('click')
    await controls()[0]!.trigger('click')
    await controls()[1]!.trigger('click')
    await button(wrapper, '检查方案').trigger('click')
    expect(useThinkingStore().completed('switch-discovery')).toHaveLength(2)
    wrapper.unmount()
  })
  it('fills, erases, resets and completes a sudoku without changing givens', async () => {
    const wrapper = player('mini-sudoku')
    const puzzle = puzzleOf('sudoku')
    const answer = solution(puzzle) as number[]
    const cell = puzzle.givens.indexOf(0)
    const grid = () => wrapper.findAll('.thinking-sudoku-grid button')
    const pad = () => wrapper.findAll('.thinking-number-pad button')
    expect(pad()[0]!.attributes('disabled')).toBeDefined()
    expect(grid()[puzzle.givens.findIndex(Boolean)]!.attributes('disabled')).toBeDefined()
    await grid()[cell]!.trigger('click')
    await pad()[0]!.trigger('click')
    expect(grid()[cell]!.text()).toBe('1')
    await pad()[4]!.trigger('click')
    expect(grid()[cell]!.text()).toBe('·')
    await pad()[1]!.trigger('click')
    await button(wrapper, '清空方案').trigger('click')
    expect(grid()[cell]!.text()).toBe('·')
    for (let i = 0; i < 16; i++) {
      if (puzzle.givens[i]) continue
      await grid()[i]!.trigger('click')
      await pad()[answer[i]! - 1]!.trigger('click')
    }
    await button(wrapper, '检查方案').trigger('click')
    expect(wrapper.text()).toContain('这个任务通过啦')
    expect(useThinkingStore().completed('mini-sudoku')).toEqual([puzzle.id])
    wrapper.unmount()
  })
  it('rejects invalid moves, over-budget plans, malformed grids, changed clues and all three sudoku conflicts', () => {
    const switches = puzzleOf('switches')
    expect(checkThinkingAnswer(switches, ['bad']).status).toBe('incorrect')
    expect(checkThinkingAnswer(switches, ['0', '0', '0']).message).toContain('超过')
    const sudoku = puzzleOf('sudoku')
    expect(checkThinkingAnswer(sudoku, []).status).toBe('incorrect')
    expect(checkThinkingAnswer(sudoku, Array(16).fill(5)).status).toBe('incorrect')
    const changed = solution(sudoku) as number[]
    changed[sudoku.givens.findIndex(Boolean)] = 0
    expect(checkThinkingAnswer(sudoku, changed).message).toContain('不能改变')
    const blank = { ...sudoku, givens: Array(16).fill(0) }
    expect(checkThinkingAnswer(blank, Array(16).fill(1)).message).toContain('行')
    expect(
      checkThinkingAnswer(blank, [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]).message,
    ).toContain('列')
    expect(
      checkThinkingAnswer(blank, [1, 2, 3, 4, 2, 3, 4, 1, 3, 4, 1, 2, 4, 1, 2, 3]).message,
    ).toContain('小宫')
    expect(
      checkThinkingAnswer(blank, [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1]).status,
    ).toBe('correct')
  })
})
