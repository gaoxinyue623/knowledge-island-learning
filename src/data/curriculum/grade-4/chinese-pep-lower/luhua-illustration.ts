import illustration from './luhua-illustration.json'
import { G4_CHINESE_LOWER_IMPORT_APPROVAL } from '../../production/gradeFourChineseLowerApproval'
import type { ContentSource, MediaAsset } from '@/types'

export const luhuaIllustrationSource: ContentSource = {
  id: 'G4_PEP_CHINESE_S2_LUHUA_AI_ILLUSTRATION_V1',
  sourceType: 'AI_GENERATED',
  title: '芦花鞋冬日芦苇荡AI生成配套插图',
  sourceRef: 'project://curriculum/grade-4/chinese-pep-lower/luhua-illustration.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G4_CHINESE_LOWER_IMPORT_APPROVAL,
  verifiedAt: illustration.generatedAt,
  notes:
    '根据用户指定的冬日芦苇荡、背布袋的少年青铜、银白芦花和淡雅水墨风生成并检查。项目配套素材，不是教材原图。',
}
export const luhuaIllustrationAsset: MediaAsset = {
  id: 'G4_PEP_CHINESE_S2_LUHUA_AI_ILLUSTRATION_1',
  mediaType: 'IMAGE',
  storageKey: illustration.url.slice(1),
  url: illustration.url,
  mimeType: 'image/png',
  width: illustration.width,
  height: illustration.height,
  durationSeconds: null,
  altText:
    '冬日芦苇荡雪景中，少年青铜背着布袋站在雪地，身旁是大片银白色芦花，画面为淡雅水墨风。（AI生成配套素材）',
  transcript: null,
  sourceId: luhuaIllustrationSource.id,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: illustration.generatedAt,
  updatedAt: illustration.generatedAt,
}
