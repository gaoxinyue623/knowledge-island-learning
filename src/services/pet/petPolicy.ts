import { z } from 'zod'
import { DEFAULT_REWARD_POLICY } from '../../types/reward'

export const PET_DAILY_LIMIT = 60
export const PET_THINKING_POINTS = 3
export const PET_QUEST_POINTS = 10
export const petEarningRules = [
  { title: '课程首次完成', points: DEFAULT_REWARD_POLICY.lessonCompletedEnergy },
  { title: '练习首次完成', points: DEFAULT_REWARD_POLICY.assessmentCompletedEnergy },
  { title: '首次掌握知识点', points: DEFAULT_REWARD_POLICY.knowledgeMasteredEnergy },
  { title: '完成复习', points: DEFAULT_REWARD_POLICY.reviewCompletedEnergy },
  { title: '解决错题', points: DEFAULT_REWARD_POLICY.wrongQuestionResolvedEnergy },
  { title: '思维题首次通过', points: PET_THINKING_POINTS },
  { title: '首次完成整组课后闯关或阅读练习', points: PET_QUEST_POINTS },
] as const
export const PET_POLICY_VERSION = 'PET_V1' as const
export const petFoods = [
  {
    id: 'apple',
    name: '脆甜苹果',
    symbol: '🍎',
    cost: 5,
    experience: 5,
    description: '清脆的一口，给团子一点小能量。',
  },
  {
    id: 'bread',
    name: '云朵面包',
    symbol: '🍞',
    cost: 10,
    experience: 10,
    description: '软软的面包，一起分享学习的收获。',
  },
  {
    id: 'bento',
    name: '彩虹便当',
    symbol: '🍱',
    cost: 15,
    experience: 15,
    description: '装满好心情，陪团子慢慢长大。',
  },
] as const
export type PetFoodId = (typeof petFoods)[number]['id']
export const petCompanions = [
  { id: 'mint', name: '薄荷团子', characterId: 'default-character', cost: 0 },
  { id: 'sunshine', name: '阳光团子', characterId: 'sunshine-character', cost: 30 },
  { id: 'berry', name: '莓果团子', characterId: 'berry-character', cost: 50 },
] as const
export type PetId = (typeof petCompanions)[number]['id']
export const petDecorations = [
  { id: 'meadow', name: '晴日草地', symbol: '🌼', slot: 'landscape', cost: 20 },
  { id: 'night', name: '星星夜空', symbol: '🌙', slot: 'landscape', cost: 30 },
  { id: 'flowers', name: '窗前花园', symbol: '🌷', slot: 'ornament', cost: 10 },
  { id: 'books', name: '故事书堆', symbol: '📚', slot: 'ornament', cost: 15 },
] as const
export type DecorationId = (typeof petDecorations)[number]['id']
export type DecorationSlot = (typeof petDecorations)[number]['slot']
export const petStages = [
  { threshold: 0, title: '初见团子', description: '我们成为学习伙伴啦。', symbol: '🌱' },
  { threshold: 20, title: '嫩芽团子', description: '头顶冒出了好奇的小芽。', symbol: '🌿' },
  { threshold: 60, title: '花苞团子', description: '一起积攒的收获开出了花苞。', symbol: '🌷' },
  { threshold: 120, title: '繁花团子', description: '每一次努力，都让花朵更灿烂。', symbol: '🌸' },
  { threshold: 240, title: '星光团子', description: '带着我们的学习故事继续探索。', symbol: '⭐' },
] as const
export const petSourceKindSchema = z.enum([
  'lesson',
  'assessment',
  'mastery',
  'review',
  'correction',
  'thinking',
  'quest',
])
export type PetSourceKind = z.infer<typeof petSourceKindSchema>
export interface PetLearningSource {
  id: string
  profileId: string
  kind: PetSourceKind
  title: string
  amount: number
  occurredAt?: string
}
const id = z.string().min(1).max(1500)
const at = z.string().datetime()
const foodId = z.enum(['apple', 'bread', 'bento'])
const petId = z.enum(['mint', 'sunshine', 'berry'])
const decorationId = z.enum(['meadow', 'night', 'flowers', 'books'])
const base = { id, at }
export const petEventSchema = z.discriminatedUnion('kind', [
  z
    .object({
      ...base,
      kind: z.literal('credit'),
      sourceId: id,
      sourceKind: petSourceKindSchema,
      title: z.string().min(1).max(200),
      requested: z.number().int().min(1).max(100),
      amount: z.number().int().min(0).max(PET_DAILY_LIMIT),
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .strict(),
  z.object({ ...base, kind: z.literal('adopt'), name: z.string().trim().min(1).max(12) }).strict(),
  z.object({ ...base, kind: z.literal('rename'), name: z.string().trim().min(1).max(12) }).strict(),
  z.object({ ...base, kind: z.literal('buy'), foodId }).strict(),
  z.object({ ...base, kind: z.literal('feed'), foodId }).strict(),
  z
    .object({ ...base, kind: z.literal('collect'), petId, name: z.string().trim().min(1).max(12) })
    .strict(),
  z.object({ ...base, kind: z.literal('select'), petId }).strict(),
  z
    .object({ ...base, kind: z.literal('name-pet'), petId, name: z.string().trim().min(1).max(12) })
    .strict(),
  z.object({ ...base, kind: z.literal('feed-pet'), petId, foodId }).strict(),
  z.object({ ...base, kind: z.literal('decorate-buy'), decorationId }).strict(),
  z.object({ ...base, kind: z.literal('decorate-equip'), decorationId }).strict(),
  z
    .object({ ...base, kind: z.literal('decorate-clear'), slot: z.enum(['landscape', 'ornament']) })
    .strict(),
])
export const petAccountSchema = z
  .object({
    schemaVersion: z.literal(2),
    policyVersion: z.literal(PET_POLICY_VERSION),
    profileId: z.string().min(1).max(200),
    events: z.array(petEventSchema),
  })
  .strict()
export type PetEvent = z.infer<typeof petEventSchema>
export type PetAccount = z.infer<typeof petAccountSchema>
export type PetCommand =
  | { kind: 'adopt' | 'rename'; name: string }
  | { kind: 'buy' | 'feed'; foodId: PetFoodId }
  | { kind: 'collect' | 'name-pet'; petId: PetId; name: string }
  | { kind: 'select'; petId: PetId }
  | { kind: 'feed-pet'; petId: PetId; foodId: PetFoodId }
  | { kind: 'decorate-buy' | 'decorate-equip'; decorationId: DecorationId }
  | { kind: 'decorate-clear'; slot: DecorationSlot }
export interface CompanionState {
  name: string
  adoptedAt: string
  experience: number
  feedCount: number
  stageReachedAt: (string | null)[]
}
export interface PetSummary {
  activePetId: PetId | null
  companions: Partial<Record<PetId, CompanionState>>
  decorations: DecorationId[]
  equipped: Partial<Record<DecorationSlot, DecorationId>>
  balance: number
  totalEarned: number
  totalSpent: number
  experience: number
  feedCount: number
  name: string | null
  adoptedAt: string | null
  inventory: Record<PetFoodId, number>
  dailyEarned: Record<string, number>
  stageIndex: number
  progress: number
  stageReachedAt: (string | null)[]
}
export class PetDataError extends Error {}
export function petDay(at: string): string {
  const date = new Date(at)
  if (!Number.isFinite(date.getTime()))
    throw new PetDataError('学习记录的日期无法识别，暂未结算这条记录。')
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
export function freshPetAccount(profileId: string): PetAccount {
  return { schemaVersion: 2, policyVersion: PET_POLICY_VERSION, profileId, events: [] }
}
export function summarizePet(account: PetAccount): PetSummary {
  const summary: PetSummary = {
    activePetId: null,
    companions: {},
    decorations: [],
    equipped: {},
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    experience: 0,
    feedCount: 0,
    name: null,
    adoptedAt: null,
    inventory: { apple: 0, bread: 0, bento: 0 },
    dailyEarned: {},
    stageIndex: 0,
    progress: 0,
    stageReachedAt: petStages.map(() => null),
  }
  const ids = new Set<string>(),
    sources = new Set<string>()
  for (const event of account.events) {
    if (ids.has(event.id)) throw new PetDataError('积分记录存在重复操作，原记录已保留。')
    ids.add(event.id)
    if (event.kind === 'credit') {
      const earned = summary.dailyEarned[event.day] ?? 0
      if (
        sources.has(event.sourceId) ||
        event.amount !== Math.min(event.requested, Math.max(0, PET_DAILY_LIMIT - earned))
      )
        throw new PetDataError('积分来源或额度不一致，原记录已保留。')
      sources.add(event.sourceId)
      summary.dailyEarned[event.day] = earned + event.amount
      summary.balance += event.amount
      summary.totalEarned += event.amount
    } else if (event.kind === 'adopt') {
      if (summary.companions.mint) throw new PetDataError('你已经有一位宠物伙伴啦。')
      summary.companions.mint = {
        name: event.name,
        adoptedAt: event.at,
        experience: 0,
        feedCount: 0,
        stageReachedAt: petStages.map((_, i) => (i === 0 ? event.at : null)),
      }
      summary.activePetId = 'mint'
    } else {
      if (!summary.activePetId) throw new PetDataError('先给宠物取个名字，完成领养吧。')
      const spend = (cost: number) => {
        if (summary.balance < cost) throw new PetDataError('积分不足，先去完成一次学习吧。')
        summary.balance -= cost
        summary.totalSpent += cost
      }
      if (event.kind === 'collect') {
        if (summary.companions[event.petId])
          throw new PetDataError('已经拥有这位伙伴，无需重复兑换。')
        spend(petCompanions.find((p) => p.id === event.petId)!.cost)
        summary.companions[event.petId] = {
          name: event.name,
          adoptedAt: event.at,
          experience: 0,
          feedCount: 0,
          stageReachedAt: petStages.map((_, i) => (i === 0 ? event.at : null)),
        }
        summary.activePetId = event.petId
      } else if (event.kind === 'select') {
        if (!summary.companions[event.petId]) throw new PetDataError('还没有领养这位伙伴。')
        summary.activePetId = event.petId
      } else if (event.kind === 'decorate-buy') {
        if (summary.decorations.includes(event.decorationId))
          throw new PetDataError('已经拥有这件装饰，无需重复兑换。')
        spend(petDecorations.find((d) => d.id === event.decorationId)!.cost)
        summary.decorations.push(event.decorationId)
      } else if (event.kind === 'decorate-equip') {
        if (!summary.decorations.includes(event.decorationId))
          throw new PetDataError('先兑换这件装饰。')
        summary.equipped[petDecorations.find((d) => d.id === event.decorationId)!.slot] =
          event.decorationId
      } else if (event.kind === 'decorate-clear') {
        delete summary.equipped[event.slot]
      } else {
        // V1 events always belong to the original mint pet, even after selection changes.
        const companion = summary.companions['petId' in event ? event.petId : 'mint']
        if (!companion) throw new PetDataError('还没有领养这位伙伴。')
        if (event.kind === 'rename' || event.kind === 'name-pet') companion.name = event.name
        else {
          const food = petFoods.find((item) => item.id === event.foodId)!
          if (event.kind === 'buy') {
            spend(food.cost)
            summary.inventory[food.id]++
          } else {
            if (summary.inventory[food.id] < 1)
              throw new PetDataError('这种食物已经用完了，先兑换一份吧。')
            summary.inventory[food.id]--
            companion.experience += food.experience
            companion.feedCount++
            petStages.forEach((stage, i) => {
              if (companion.experience >= stage.threshold && !companion.stageReachedAt[i])
                companion.stageReachedAt[i] = event.at
            })
          }
        }
      }
    }
  }
  const active = summary.activePetId ? summary.companions[summary.activePetId] : undefined
  if (active) Object.assign(summary, active)
  summary.stageIndex = petStages.reduce(
    (index, stage, i) => (summary.experience >= stage.threshold ? i : index),
    0,
  )
  const current = petStages[summary.stageIndex]!,
    next = petStages[summary.stageIndex + 1]
  summary.progress = next
    ? Math.floor(
        ((summary.experience - current.threshold) / (next.threshold - current.threshold)) * 100,
      )
    : 100
  return summary
}
export function validatePetAccount(value: unknown, profileId: string): PetAccount {
  const legacy = petAccountSchema.extend({ schemaVersion: z.literal(1) }).safeParse(value)
  if (
    legacy.success &&
    legacy.data.events.some((e) => !['credit', 'adopt', 'rename', 'buy', 'feed'].includes(e.kind))
  )
    throw new PetDataError('旧版宠物记录包含无法识别的操作，原记录已保留。')
  const parsed = petAccountSchema.safeParse(
    legacy.success ? { ...legacy.data, schemaVersion: 2 } : value,
  )
  if (!parsed.success || parsed.data.profileId !== profileId)
    throw new PetDataError('宠物记录的格式或档案不匹配，原记录已保留。请勿清除浏览器数据。')
  summarizePet(parsed.data)
  return parsed.data
}
export function settlePetSources(
  account: PetAccount,
  sources: PetLearningSource[],
  now: string,
): PetAccount {
  const next = { ...account, events: [...account.events] }
  const summary = summarizePet(next)
  const known = new Set(next.events.filter((e) => e.kind === 'credit').map((e) => e.sourceId))
  for (const source of [...sources].sort(
    (a, b) => (a.occurredAt ?? now).localeCompare(b.occurredAt ?? now) || a.id.localeCompare(b.id),
  )) {
    if (source.profileId !== account.profileId || known.has(source.id)) continue
    if (!Number.isInteger(source.amount) || source.amount < 1 || source.amount > 100)
      throw new PetDataError('学习积分规则无效。')
    const day = petDay(source.occurredAt ?? now)
    // Invalid future timestamps must not manufacture another day's allowance.
    if (day > petDay(now)) continue
    const earned = summary.dailyEarned[day] ?? 0
    const amount = Math.min(source.amount, Math.max(0, PET_DAILY_LIMIT - earned))
    next.events.push({
      id: `credit:${source.id}`,
      at: now,
      kind: 'credit',
      sourceId: source.id,
      sourceKind: source.kind,
      title: source.title,
      requested: source.amount,
      amount,
      day,
    })
    known.add(source.id)
    summary.dailyEarned[day] = earned + amount
  }
  return next
}
export function applyPetCommand(
  account: PetAccount,
  command: PetCommand,
  operationId: string,
  now: string,
): PetAccount {
  const previous = account.events.find((event) => event.id === operationId)
  if (previous) {
    const candidate = petEventSchema.safeParse({ ...command, id: operationId, at: previous.at })
    const same = candidate.success && JSON.stringify(candidate.data) === JSON.stringify(previous)
    if (!same) throw new PetDataError('这次操作编号已被使用，请重新操作。')
    return account
  }
  const summary = summarizePet(account)
  if (command.kind === 'adopt' && summary.name !== null)
    throw new PetDataError('你已经有一位宠物伙伴啦。')
  if (command.kind !== 'adopt' && summary.name === null)
    throw new PetDataError('先给宠物取个名字，完成领养吧。')
  const event = petEventSchema.safeParse({ ...command, id: operationId, at: now })
  if (!event.success) throw new PetDataError('请输入1～12个字符的宠物名字，或选择有效的食物。')
  const next = { ...account, events: [...account.events, event.data] }
  summarizePet(next)
  return next
}
