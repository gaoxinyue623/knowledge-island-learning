import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  listFamilyCloudProfiles,
  downloadFamilyCloudSnapshot,
  updateFamilyCloudProfile,
} from '@/services/family-cloud/familyCloud'
import { profileArchiveSectionKinds } from '@/services/profile-archive/profileArchiveSchema'

const profile = {
  cloudProfileId: '018e23b0-15d7-7cc4-8db2-c02439587791',
  label: '家庭档案',
  revision: 1,
  digest: 'a'.repeat(64),
  updatedAt: '2026-09-08T00:00:00.000Z',
}

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function archive() {
  const sourceProfileId = 'student-a'
  return {
    format: 'knowledge-island.student-profile', formatVersion: 1,
    exportedAt: '2026-09-08T00:00:00.000Z', sourceProfileId,
    sections: profileArchiveSectionKinds.map((kind) => ({
      kind, schemaVersion: kind === 'pet-account' ? 2 : 1,
      data: kind === 'student-profile'
        ? { version: 1, profile: { id: sourceProfileId, displayName: '小学生' }, characterId: 'default-character' }
        : null,
    })),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('family cloud client', () => {
  it('runtime validates list metadata before returning it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { profiles: [profile] })))
    await expect(listFamilyCloudProfiles('parent_a')).resolves.toEqual([profile])

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { profiles: [{ ...profile, revision: 0 }] })))
    await expect(listFamilyCloudProfiles('parent_a')).rejects.toThrow()
  })

  it('returns a validated conflict and never issues an automatic retry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(409, {
      error: '云端档案已有更新',
      code: 'REVISION_CONFLICT',
      details: { currentRevision: 2, currentDigest: 'b'.repeat(64), updatedAt: profile.updatedAt },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await updateFamilyCloudProfile(
      profile.cloudProfileId,
      1,
      archive(),
      'parent_a',
    )
    expect(result).toMatchObject({ kind: 'conflict', currentRevision: 2 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a well-formed snapshot or update response for a different cloud id', async () => {
    const other = { ...profile, cloudProfileId: '018e23b0-15d7-7cc4-8db2-c02439587792' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { ...other, archive: archive() })))
    await expect(downloadFamilyCloudSnapshot(profile.cloudProfileId, 'parent_a')).rejects.toThrow('编号不匹配')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, other)))
    await expect(updateFamilyCloudProfile(profile.cloudProfileId, 1, archive(), 'parent_a')).rejects.toThrow('编号不匹配')
  })
})
