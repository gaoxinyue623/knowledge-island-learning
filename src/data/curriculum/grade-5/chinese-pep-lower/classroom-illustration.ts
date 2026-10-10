import illustration from './classroom-illustration.json'
import { G5_CHINESE_LOWER_IMPORT_APPROVAL } from '../../production/gradeFiveChineseLowerApproval'
import type { ContentSource, MediaAsset } from '@/types'

export const classroomIllustrationSource: ContentSource = {
  id: 'G5_PEP_CHINESE_S2_CLASSROOM_AI_ILLUSTRATION_V1',
  sourceType: 'AI_GENERATED',
  title: '初试身手课间教室AI生成观察插图',
  sourceRef: 'project://curriculum/grade-5/chinese-pep-lower/classroom-illustration.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G5_CHINESE_LOWER_IMPORT_APPROVAL,
  verifiedAt: illustration.generatedAt,
  notes: '按用户要求AI生成的项目配套观察插图，非教材原图。',
}
export const classroomIllustrationAsset: MediaAsset = {
  id: 'G5_PEP_CHINESE_S2_CLASSROOM_AI_ILLUSTRATION_1',
  mediaType: 'IMAGE',
  storageKey: illustration.url.slice(1),
  url: illustration.url,
  mimeType: 'image/png',
  width: illustration.width,
  height: illustration.height,
  durationSeconds: null,
  altText:
    '阳光照进课间教室，同学们分别安静看书、跳绳和凑在一起说笑，动作神态清楚可观察。（AI生成配套素材）',
  transcript: null,
  sourceId: classroomIllustrationSource.id,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: illustration.generatedAt,
  updatedAt: illustration.generatedAt,
}
