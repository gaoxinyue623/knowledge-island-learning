import type { ThinkingDraft, ThinkingPuzzle } from '@/types/thinking'

export interface ThinkingCheck {
  status: 'incomplete' | 'incorrect' | 'correct'
  message: string
}
const result = (status: ThinkingCheck['status'], message: string): ThinkingCheck => ({
  status,
  message,
})
const incomplete = () => result('incomplete', '先完成你的方案，再检查一次。')
const incorrect = (message = '还差一点点。逐条检查条件，修改后可以再试。') =>
  result('incorrect', message)
const correct = () => result('correct', '这个方案符合所有条件！')

export function emptyThinkingDraft(puzzle: ThinkingPuzzle): ThinkingDraft {
  return puzzle.kind === 'assign' ? {} : puzzle.kind === 'path' ? [puzzle.start] : []
}

export function isThinkingStep(
  puzzle: Extract<ThinkingPuzzle, { kind: 'path' }>,
  from: number,
  to: number,
) {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < 0 ||
    from >= puzzle.rows * puzzle.columns ||
    to >= puzzle.rows * puzzle.columns ||
    puzzle.blocked.includes(to) ||
    puzzle.blocked.includes(from)
  )
    return false
  return (
    Math.abs(Math.floor(from / puzzle.columns) - Math.floor(to / puzzle.columns)) +
      Math.abs((from % puzzle.columns) - (to % puzzle.columns)) ===
    1
  )
}

export function checkThinkingAnswer(puzzle: ThinkingPuzzle, draft: ThinkingDraft): ThinkingCheck {
  if (puzzle.kind === 'assign') {
    if (Array.isArray(draft)) return incomplete()
    const people = puzzle.people.map((p) => p.id),
      items = puzzle.items.map((i) => i.id)
    if (
      Object.keys(draft).some((p) => !people.includes(p)) ||
      Object.values(draft).some((i) => !items.includes(i))
    )
      return incorrect()
    if (people.some((p) => !draft[p])) return incomplete()
    if (new Set(Object.values(draft)).size !== people.length)
      return incorrect('每个选项只能属于一位伙伴。看看有没有重复。')
    return puzzle.clues.every((c) =>
      c.relation === 'is' ? draft[c.personId] === c.itemId : draft[c.personId] !== c.itemId,
    )
      ? correct()
      : incorrect('有一条线索还没满足。把每个人的选择与线索对一遍。')
  }
  if (!Array.isArray(draft) || !draft.length) return incomplete()
  if (puzzle.kind === 'path') {
    if (draft.some((cell) => typeof cell !== 'number') || draft[0] !== puzzle.start)
      return incorrect()
    const cells = draft as number[]
    if (cells.slice(1).some((cell, i) => !isThinkingStep(puzzle, cells[i]!, cell)))
      return incorrect('只能上下左右走一格，不能跨格或穿过石头。')
    if (cells.at(-1) !== puzzle.goal) return result('incomplete', '先走到终点，再检查你的路线。')
    if (puzzle.via.some((cell) => !cells.includes(cell)))
      return incorrect('路线还漏了补给站。想想可以怎样经过它。')
    if (cells.length - 1 > puzzle.maxSteps)
      return incorrect('已经到终点了，不过步数超出了限制。试试少绕一点。')
    return correct()
  }
  if (
    draft.some((id) => typeof id !== 'string') ||
    new Set<string | number>(draft).size !== draft.length
  )
    return incorrect()
  const ids = draft as string[]
  if (puzzle.kind === 'pick') {
    if (ids.some((id) => !puzzle.options.some((option) => option.id === id))) return incorrect()
    return ids.length === puzzle.correctIds.length &&
      ids.every((id) => puzzle.correctIds.includes(id))
      ? correct()
      : incorrect()
  }
  if (puzzle.kind === 'order') {
    if (ids.some((id) => !puzzle.cards.some((card) => card.id === id))) return incorrect()
    if (ids.length !== puzzle.cards.length) return incomplete()
    return puzzle.before.every(([a, b]) => ids.indexOf(a) < ids.indexOf(b))
      ? correct()
      : incorrect('有两项的先后顺序还不符合要求。找出必须先完成的那一项。')
  }
  if (ids.some((id) => !puzzle.items.some((item) => item.id === id))) return incorrect()
  const sum = ids.reduce(
    (total, id) => total + puzzle.items.find((item) => item.id === id)!.cost,
    0,
  )
  return sum === puzzle.target && (!puzzle.count || ids.length === puzzle.count)
    ? correct()
    : incorrect('再检查总长度和需要的张数。可以取消一张，换一种组合。')
}
