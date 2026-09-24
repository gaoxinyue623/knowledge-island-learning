import { afterEach, describe, expect, it, vi } from 'vitest'
import * as familyCloud from '@/services/family-cloud/familyCloud'
import { profileArchiveService } from '@/services/profile-archive/profileArchiveService'
import {
  clearLearningSyncBinding,
  loadLearningSyncBinding,
  saveLearningSyncBinding,
} from '@/services/family-cloud/learningSyncBindingStorage'
import { syncLearningFactsToCloud } from '@/services/family-cloud/learningFactSyncService'

const profileId = 'SYNC_STUDENT'
const binding = {
  profileId,
  username: 'parent_account',
  cloudProfileId: '00000000-0000-4000-8000-000000000001',
  revision: 2,
  enabled: true as const,
  updatedAt: '2026-09-24T00:00:00.000Z',
}

afterEach(() => {
  clearLearningSyncBinding(profileId)
  vi.restoreAllMocks()
})

describe('learning fact cloud sync', () => {
  it('does not export or upload when sync is not enabled', async () => {
    const exported = vi.spyOn(profileArchiveService, 'exportArchive')
    const update = vi.spyOn(familyCloud, 'updateFamilyCloudProfile')
    await expect(syncLearningFactsToCloud(profileId)).resolves.toEqual({ kind: 'not_configured' })
    expect(exported).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('keeps the local revision on conflict without retrying or overwriting', async () => {
    saveLearningSyncBinding(binding)
    vi.spyOn(profileArchiveService, 'exportArchive').mockResolvedValue({} as never)
    const conflict = { kind: 'conflict' as const, currentRevision: 4, currentDigest: 'remote', updatedAt: binding.updatedAt }
    const update = vi.spyOn(familyCloud, 'updateFamilyCloudProfile').mockResolvedValue(conflict)
    await expect(syncLearningFactsToCloud(profileId)).resolves.toEqual(conflict)
    expect(update).toHaveBeenCalledTimes(1)
    expect(loadLearningSyncBinding(profileId)).toEqual(binding)
  })

  it('preserves the revision when offline', async () => {
    saveLearningSyncBinding(binding)
    vi.spyOn(profileArchiveService, 'exportArchive').mockResolvedValue({} as never)
    vi.spyOn(familyCloud, 'updateFamilyCloudProfile').mockRejectedValue(new Error('offline'))
    await expect(syncLearningFactsToCloud(profileId)).resolves.toEqual({ kind: 'failed', message: 'offline' })
    expect(loadLearningSyncBinding(profileId)).toEqual(binding)
  })

  it('does not re-enable a binding disabled while uploading', async () => {
    saveLearningSyncBinding(binding)
    vi.spyOn(profileArchiveService, 'exportArchive').mockResolvedValue({} as never)
    vi.spyOn(familyCloud, 'updateFamilyCloudProfile').mockImplementation(async () => {
      clearLearningSyncBinding(profileId)
      return { kind: 'updated', profile: { ...binding, label: 'test', digest: 'test', revision: 3 } }
    })
    await syncLearningFactsToCloud(profileId)
    expect(loadLearningSyncBinding(profileId)).toBeNull()
  })

  it('stores a per-profile cloud binding', () => {
    expect(saveLearningSyncBinding(binding)).toBe(true)
    expect(loadLearningSyncBinding(profileId)).toEqual(binding)
  })

  it('uploads the validated archive and advances the revision', async () => {
    saveLearningSyncBinding(binding)
    vi.spyOn(profileArchiveService, 'exportArchive').mockResolvedValue({
      format: 'knowledge-island.student-profile',
      formatVersion: 1,
      exportedAt: '2026-09-24T00:01:00.000Z',
      sourceProfileId: profileId,
      sections: [{ kind: 'student-profile', schemaVersion: 1, data: {} }],
    })
    vi.spyOn(familyCloud, 'updateFamilyCloudProfile').mockResolvedValue({
      kind: 'updated',
      profile: {
        ...binding,
        revision: 3,
        updatedAt: '2026-09-24T00:02:00.000Z',
      },
    })
    await expect(syncLearningFactsToCloud(profileId)).resolves.toEqual({
      kind: 'updated',
      revision: 3,
    })
    expect(loadLearningSyncBinding(profileId)?.revision).toBe(3)
  })
})
