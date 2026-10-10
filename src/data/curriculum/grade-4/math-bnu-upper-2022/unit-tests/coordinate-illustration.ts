import illustration from './coordinate-illustration.json'
import { G4_BNU_MATH_SYNC_APPROVAL } from '../../../production/gradeFourBnuMathSyncApproval'
import type { ContentSource, MediaAsset } from '@/types'

export const coordinateIllustrationSource: ContentSource = {
  id: 'G4_BNU_MATH_S1_2022_COORDINATE_Q7_AI_SOURCE_V1',
  title: '我们生活的空间（二）第7题数对位置AI配套图',
  sourceType: 'AI_GENERATED',
  sourceRef:
    'project://curriculum/grade-4/math-bnu-upper-2022/unit-tests/coordinate-illustration.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G4_BNU_MATH_SYNC_APPROVAL,
  verifiedAt: illustration.generatedAt,
  notes:
    '按用户提供题目条件生成方格位置图。列号向右、行号向上递增，小明在第3列第2行，小红在右边相邻列且同行。已逐项核对图片位置与题目条件；图片为AI生成配套素材。',
}

export const coordinateIllustrationAsset: MediaAsset = {
  id: 'G4_BNU_MATH_S1_2022_COORDINATE_Q7_AI_IMAGE_V1',
  mediaType: 'IMAGE',
  storageKey: illustration.url.slice(1),
  url: illustration.url,
  mimeType: 'image/png',
  width: illustration.width,
  height: illustration.height,
  durationSeconds: null,
  altText:
    '方格位置图：列号从左向右递增，行号从下向上递增；小明在第3列第2行，小红位于他右边相邻的一列，两人同行。（AI生成配套图）',
  transcript: null,
  sourceId: coordinateIllustrationSource.id,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: illustration.generatedAt,
  updatedAt: illustration.generatedAt,
}
