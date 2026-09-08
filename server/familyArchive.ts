import { createHash } from 'node:crypto'
import { z } from 'zod'
import { validatePortableArchive } from '@/services/profile-archive/portableArchiveValidator'
import type { StudentProfileArchive } from '@/services/profile-archive/profileArchiveSchema'

export const familyCreateInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  archive: z.unknown(),
}).strict()

export const familyUpdateInputSchema = z.object({
  expectedRevision: z.number().int().positive(),
  archive: z.unknown(),
}).strict()

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Stable digest for CAS/idempotency. It is not a security primitive. */
export function familyArchiveDigest(archive: StudentProfileArchive): string {
  return createHash('sha256').update(canonical(archive)).digest('hex')
}

/** The server and browser use the same portable archive validation contract. */
export function validateFamilyArchive(input: unknown): StudentProfileArchive | null {
  const result = validatePortableArchive(input)
  return result.ok ? result.archive : null
}
