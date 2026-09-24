import { profileArchiveService } from '@/services/profile-archive/profileArchiveService'
import {
  updateFamilyCloudProfile,
  type FamilyCloudUpdateResult,
} from './familyCloud'
import {
  loadLearningSyncBinding,
  saveLearningSyncBinding,
} from './learningSyncBindingStorage'

export type LearningFactSyncResult =
  | { kind: 'not_configured' }
  | { kind: 'updated'; revision: number }
  | Extract<FamilyCloudUpdateResult, { kind: 'conflict' }>
  | { kind: 'failed'; message: string }

/** Uploads the complete validated local archive after a formal learning fact is committed. */
export async function syncLearningFactsToCloud(profileId: string): Promise<LearningFactSyncResult> {
  const binding = loadLearningSyncBinding(profileId)
  if (!binding) return { kind: 'not_configured' }
  try {
    const archive = await profileArchiveService.exportArchive(profileId)
    const result = await updateFamilyCloudProfile(
      binding.cloudProfileId,
      binding.revision,
      archive,
      binding.username,
    )
    if (result.kind === 'conflict') return result
    // A parent may disable or rebind sync while the upload is in flight.
    const current = loadLearningSyncBinding(profileId)
    if (!current || JSON.stringify(current) !== JSON.stringify(binding))
      return { kind: 'updated', revision: result.profile.revision }
    const next = saveLearningSyncBinding({
      ...binding,
      revision: result.profile.revision,
      updatedAt: result.profile.updatedAt,
    })
    if (!next) return { kind: 'failed', message: '云端已保存，但本机同步版本未能更新。' }
    return { kind: 'updated', revision: result.profile.revision }
  } catch (error) {
    return {
      kind: 'failed',
      message: error instanceof Error ? error.message : '云端同步暂时失败，本机记录已保留。',
    }
  }
}
