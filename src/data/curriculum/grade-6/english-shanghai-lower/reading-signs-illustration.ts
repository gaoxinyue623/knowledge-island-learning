import illustration from './reading-signs-illustration.json'
import { G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL } from '../../production/gradeSixEnglishLowerApproval'
import type { ContentSource, MediaAsset } from '@/types'

export const readingSignsIllustrationSource: ContentSource = {
  id: 'G6_SHANGHAI_ENGLISH_S2_READING_SIGNS_AI_ILLUSTRATION_V1',
  sourceType: 'AI_GENERATED',
  title: 'Reading signs街景和公共标识AI配套插图',
  sourceRef: 'project://curriculum/grade-6/english-shanghai-lower/reading-signs-illustration.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
  verifiedAt: illustration.generatedAt,
  notes: '按用户街景、女士与Mark及六组公共标识生成并核对英文标签。AI生成配套素材，非教材原图。',
}
export const readingSignsIllustrationAsset: MediaAsset = {
  id: 'G6_SHANGHAI_ENGLISH_S2_READING_SIGNS_AI_ILLUSTRATION_1',
  mediaType: 'IMAGE',
  storageKey: illustration.url.slice(1),
  url: illustration.url,
  mimeType: 'image/png',
  width: illustration.width,
  height: illustration.height,
  durationSeconds: null,
  altText:
    '女士与Mark在地铁站旁交谈，图中展示英国地铁标识、禁止吸烟、禁止游泳、当心动物、保持安静及小心缝隙。（AI生成配套素材）',
  transcript: null,
  sourceId: readingSignsIllustrationSource.id,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: illustration.generatedAt,
  updatedAt: illustration.generatedAt,
}
