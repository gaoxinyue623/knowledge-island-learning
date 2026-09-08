import { z } from 'zod'
import { validatePortableArchive } from '@/services/profile-archive/portableArchiveValidator'
import type { StudentProfileArchive } from '@/services/profile-archive/profileArchiveSchema'
import { PetCloudError, petCloudRequest } from '@/services/pet/petCloud'

export const familyCloudProfileSchema = z.object({
  cloudProfileId: z.string().uuid(),
  label: z.string().min(1).max(80),
  revision: z.number().int().positive(),
  digest: z.string().min(1).max(200),
  updatedAt: z.string().datetime(),
}).strict()

export type FamilyCloudProfile = z.infer<typeof familyCloudProfileSchema>
export type FamilyCloudSnapshot = FamilyCloudProfile & { archive: StudentProfileArchive }
export type FamilyCloudUpdateResult =
  | { kind: 'updated'; profile: FamilyCloudProfile }
  | { kind: 'conflict'; currentRevision: number; currentDigest: string; updatedAt: string }

const listResponseSchema = z.object({ profiles: z.array(familyCloudProfileSchema).max(100) }).strict()
const snapshotResponseSchema = familyCloudProfileSchema.extend({ archive: z.unknown() }).strict()
const updateResponseSchema = familyCloudProfileSchema

function validatedArchive(value: unknown): StudentProfileArchive {
  const result = validatePortableArchive(value)
  if (!result.ok) throw new Error('学习档案格式无法安全同步。')
  return result.archive
}

function parseSnapshot(value: unknown): FamilyCloudSnapshot {
  const snapshot = snapshotResponseSchema.parse(value)
  return { ...snapshot, archive: validatedArchive(snapshot.archive) }
}

function matchingProfile(value: unknown, requestedCloudProfileId: string): FamilyCloudProfile {
  const profile = updateResponseSchema.parse(value)
  if (profile.cloudProfileId !== requestedCloudProfileId)
    throw new Error('云端返回的档案编号不匹配，本机记录未改变。')
  return profile
}

function encodeProfileId(cloudProfileId: string): string {
  return encodeURIComponent(z.string().uuid().parse(cloudProfileId))
}

function conflictFrom(error: unknown): FamilyCloudUpdateResult | null {
  if (!(error instanceof PetCloudError) || error.status !== 409 || error.code !== 'REVISION_CONFLICT') return null
  const details = z.object({
    currentRevision: z.number().int().positive(),
    currentDigest: z.string().min(1).max(200),
    updatedAt: z.string().datetime(),
  }).strict().safeParse(error.details)
  if (!details.success) throw new Error('云端冲突响应无法识别，本机记录未改变。')
  return { kind: 'conflict', ...details.data }
}

export async function listFamilyCloudProfiles(expectedUsername: string): Promise<FamilyCloudProfile[]> {
  return listResponseSchema.parse(
    await petCloudRequest('family/profiles', 'GET', undefined, expectedUsername),
  ).profiles
}

export async function createFamilyCloudProfile(
  label: string,
  archive: unknown,
  expectedUsername: string,
): Promise<FamilyCloudProfile> {
  return updateResponseSchema.parse(await petCloudRequest('family/profiles', 'POST', {
    label: z.string().trim().min(1).max(80).parse(label),
    archive: validatedArchive(archive),
  }, expectedUsername))
}

export async function downloadFamilyCloudSnapshot(
  cloudProfileId: string,
  expectedUsername: string,
): Promise<FamilyCloudSnapshot> {
  const snapshot = parseSnapshot(await petCloudRequest(
    `family/profiles/${encodeProfileId(cloudProfileId)}`,
    'GET',
    undefined,
    expectedUsername,
  ))
  if (snapshot.cloudProfileId !== cloudProfileId)
    throw new Error('云端返回的档案编号不匹配，本机记录未改变。')
  return snapshot
}

/** A conflict is returned to the caller; this client never retries or overwrites automatically. */
export async function updateFamilyCloudProfile(
  cloudProfileId: string,
  expectedRevision: number,
  archive: unknown,
  expectedUsername: string,
): Promise<FamilyCloudUpdateResult> {
  try {
    const profile = matchingProfile(await petCloudRequest(
      `family/profiles/${encodeProfileId(cloudProfileId)}`,
      'PUT',
      {
        expectedRevision: z.number().int().positive().parse(expectedRevision),
        archive: validatedArchive(archive),
      },
      expectedUsername,
    ), cloudProfileId)
    return { kind: 'updated', profile }
  } catch (error) {
    const conflict = conflictFrom(error)
    if (conflict) return conflict
    throw error
  }
}
