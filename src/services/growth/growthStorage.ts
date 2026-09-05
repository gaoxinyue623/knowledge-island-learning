import { z } from 'zod'

import type {
  GrowthRecord,
  GrowthStoragePayload,
  KnowledgeEnergyBalance,
  KnowledgeEnergyStoragePayload,
} from '@/types'

export const KNOWLEDGE_ENERGY_STORAGE_KEY = 'knowledge-island.knowledge-energy'
export const GROWTH_STORAGE_KEY = 'knowledge-island.growth'
export const knowledgeEnergyStorageKey = KNOWLEDGE_ENERGY_STORAGE_KEY
export const growthStorageKey = GROWTH_STORAGE_KEY
export const growthStorageSchemaVersion = 1 as const

export interface GrowthStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface KnowledgeEnergyStorage {
  loadAll(): KnowledgeEnergyBalance[]
  saveAll(balances: readonly KnowledgeEnergyBalance[]): void
  clear(): void
  getLastWarning(): string | null
}

export interface GrowthStorage {
  loadAll(): GrowthRecord[]
  saveAll(records: readonly GrowthRecord[]): void
  clear(): void
  getLastWarning(): string | null
}

const provenanceSchema = z
  .object({
    isSampleDerived: z.boolean(),
    verificationStatus: z
      .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
      .optional(),
  })
  .strict()

const energySchema = z
  .object({
    profileId: z.string().min(1),
    totalEarned: z.number().int().nonnegative(),
    current: z.number().int().nonnegative(),
    updatedAt: z.string().min(1),
    algorithmVersion: z.string().min(1),
    provenance: provenanceSchema,
  })
  .strict()

const growthSchema = z
  .object({
    profileId: z.string().min(1),
    knowledgeEnergy: z.number().int().nonnegative(),
    growthLevel: z.number().int().positive(),
    progressToNextLevel: z.number().finite().min(0).max(100),
    updatedAt: z.string().min(1),
    algorithmVersion: z.string().min(1),
    provenance: provenanceSchema,
  })
  .strict()

export const knowledgeEnergyStoragePayloadSchema = z
  .object({
    schemaVersion: z.literal(growthStorageSchemaVersion),
    balances: z.array(energySchema),
  })
  .strict()

export const growthStoragePayloadSchema = z
  .object({
    schemaVersion: z.literal(growthStorageSchemaVersion),
    records: z.array(growthSchema),
  })
  .strict()

function browserStorage(): GrowthStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneBalance(balance: KnowledgeEnergyBalance): KnowledgeEnergyBalance {
  return { ...balance, provenance: { ...balance.provenance } }
}

function cloneRecord(record: GrowthRecord): GrowthRecord {
  return { ...record, provenance: { ...record.provenance } }
}

function readPayload<T>(
  storage: GrowthStorageLike | null,
  key: string,
  parse: (value: unknown) => T | null,
  onReadError: () => void,
  onCorrupt: () => void,
): T | null {
  if (!storage) return null
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    onReadError()
    return null
  }
  if (!raw) return null
  try {
    const parsed = parse(JSON.parse(raw))
    if (parsed) return parsed
  } catch {
    // Handled uniformly below so malformed JSON and invalid schema have the same UX.
  }
  onCorrupt()
  try {
    storage.removeItem(key)
  } catch {
    // Corruption recovery is best effort.
  }
  return null
}

export function createKnowledgeEnergyStorage(
  storage: GrowthStorageLike | null = browserStorage(),
  key = KNOWLEDGE_ENERGY_STORAGE_KEY,
): KnowledgeEnergyStorage {
  let lastWarning: string | null = null

  function loadAll(): KnowledgeEnergyBalance[] {
    lastWarning = null
    const payload = readPayload(
      storage,
      key,
      (value) => {
        const result = knowledgeEnergyStoragePayloadSchema.safeParse(value)
        return result.success ? result.data : null
      },
      () => {
        lastWarning = 'KnowledgeEnergy 暂时无法读取，将使用可重建的空白快照。'
      },
      () => {
        lastWarning = 'KnowledgeEnergy 存储已损坏，已安全恢复为空白快照。'
      },
    )
    return payload ? payload.balances.map(cloneBalance) : []
  }

  function saveAll(balances: readonly KnowledgeEnergyBalance[]): void {
    if (!storage) return
    const payload: KnowledgeEnergyStoragePayload = {
      schemaVersion: growthStorageSchemaVersion,
      balances: balances.map(cloneBalance),
    }
    const result = knowledgeEnergyStoragePayloadSchema.safeParse(payload)
    if (!result.success) {
      lastWarning = 'KnowledgeEnergy 快照格式无效，本次快照未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = 'KnowledgeEnergy 快照暂时无法保存，但可从奖励记录继续重建。'
    }
  }

  return {
    loadAll,
    saveAll,
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = 'KnowledgeEnergy 快照暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export function createGrowthStorage(
  storage: GrowthStorageLike | null = browserStorage(),
  key = GROWTH_STORAGE_KEY,
): GrowthStorage {
  let lastWarning: string | null = null

  function loadAll(): GrowthRecord[] {
    lastWarning = null
    const payload = readPayload(
      storage,
      key,
      (value) => {
        const result = growthStoragePayloadSchema.safeParse(value)
        return result.success ? result.data : null
      },
      () => {
        lastWarning = '成长进度暂时无法读取，将从奖励记录继续重建。'
      },
      () => {
        lastWarning = '成长进度存储已损坏，已安全恢复为空白快照。'
      },
    )
    return payload ? payload.records.map(cloneRecord) : []
  }

  function saveAll(records: readonly GrowthRecord[]): void {
    if (!storage) return
    const payload: GrowthStoragePayload = {
      schemaVersion: growthStorageSchemaVersion,
      records: records.map(cloneRecord),
    }
    const result = growthStoragePayloadSchema.safeParse(payload)
    if (!result.success) {
      lastWarning = '成长进度快照格式无效，本次快照未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '成长进度快照暂时无法保存，但可从奖励记录继续重建。'
    }
  }

  return {
    loadAll,
    saveAll,
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '成长进度快照暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const knowledgeEnergyStorage = createKnowledgeEnergyStorage()
export const growthStorage = createGrowthStorage()

export function migrateKnowledgeEnergyStoragePayload(value: unknown): {
  payload: KnowledgeEnergyStoragePayload | null
  warning: string | null
} {
  const result = knowledgeEnergyStoragePayloadSchema.safeParse(value)
  return result.success
    ? { payload: result.data, warning: null }
    : {
        payload: null,
        warning: 'KnowledgeEnergy 存储版本或格式无法识别，已安全恢复为空白快照。',
      }
}

export function migrateGrowthStoragePayload(value: unknown): {
  payload: GrowthStoragePayload | null
  warning: string | null
} {
  const result = growthStoragePayloadSchema.safeParse(value)
  return result.success
    ? { payload: result.data, warning: null }
    : {
        payload: null,
        warning: '成长进度存储版本或格式无法识别，已安全恢复为空白快照。',
      }
}
