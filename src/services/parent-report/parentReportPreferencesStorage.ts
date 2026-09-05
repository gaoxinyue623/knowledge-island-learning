import { z } from 'zod'

import type {
  ParentReportPreferencesPayload,
  ParentReportPreferencesStorage,
  ParentReportRangePreset,
  ParentReportSubjectFilter,
} from '@/types'

export const PARENT_REPORT_PREFERENCES_STORAGE_KEY = 'knowledge-island.parent-report-preferences'

export interface ParentReportPreferencesStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const payloadSchema = z.object({
  schemaVersion: z.literal(1),
  selectedRange: z.enum(['7d', '30d', 'all']),
  selectedSubject: z.enum(['ALL', 'CHINESE', 'MATH', 'ENGLISH']),
})

function browserStorage(): ParentReportPreferencesStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function clonePayload(payload: ParentReportPreferencesPayload): ParentReportPreferencesPayload {
  return { ...payload }
}

function parsePayload(value: string | null): ParentReportPreferencesPayload | null {
  if (!value) return null
  try {
    const result = payloadSchema.safeParse(JSON.parse(value))
    return result.success ? (result.data as ParentReportPreferencesPayload) : null
  } catch {
    return null
  }
}

export function createParentReportPreferencesStorage(
  storage: ParentReportPreferencesStorageLike | null = browserStorage(),
  key = PARENT_REPORT_PREFERENCES_STORAGE_KEY,
): ParentReportPreferencesStorage {
  let lastWarning: string | null = null

  function load(): ParentReportPreferencesPayload | null {
    lastWarning = null
    if (!storage) return null
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '报告筛选偏好暂时无法读取，将使用默认设置。'
      return null
    }
    if (!raw) return null
    const payload = parsePayload(raw)
    if (payload) return clonePayload(payload)
    lastWarning = '报告筛选偏好存储已损坏，已安全恢复为默认设置。'
    try {
      storage.removeItem(key)
    } catch {
      // Corruption recovery must never make the report page unusable.
    }
    return null
  }

  function save(payload: ParentReportPreferencesPayload): void {
    const normalized: ParentReportPreferencesPayload = {
      schemaVersion: 1,
      selectedRange: payload.selectedRange as ParentReportRangePreset,
      selectedSubject: payload.selectedSubject as ParentReportSubjectFilter,
    }
    const result = payloadSchema.safeParse(normalized)
    if (!result.success) {
      lastWarning = '报告筛选偏好格式无效，本次设置未保存。'
      return
    }
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '报告筛选偏好暂时无法保存，本次查看仍可继续。'
    }
  }

  return {
    load,
    save,
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '报告筛选偏好暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const parentReportPreferencesStorage = createParentReportPreferencesStorage()
