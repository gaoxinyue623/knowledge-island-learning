import illustration from './cuboid-illustration.json'
import { G3_BNU_MATH_SYNC_APPROVAL } from '../../production/gradeThreeBnuMathSyncApproval'
import type { ContentSource, MediaAsset } from '@/types'

export const cuboidIllustrationSource: ContentSource = {
  id: 'G3_BNU_MATH_S1_CUBOID_AI_ILLUSTRATION_V1',
  sourceType: 'AI_GENERATED',
  title: '观察长方体AI生成连线题插图',
  sourceRef: 'project://curriculum/grade-3/bnu-unit-tests/cuboid-illustration.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G3_BNU_MATH_SYNC_APPROVAL,
  verifiedAt: illustration.generatedAt,
  notes:
    '按用户2026-10-10补充的题目描述生成连线配图，替换缺图口述任务；配图为AI生成项目素材，非教材原图。仍由教师或家长核对，不自动判分。',
}
export const cuboidIllustrationAsset: MediaAsset = {
  id: 'G3_BNU_MATH_S1_CUBOID_AI_ILLUSTRATION_1',
  mediaType: 'IMAGE',
  storageKey: illustration.url.slice(1),
  url: illustration.url,
  mimeType: 'image/png',
  width: illustration.width,
  height: illustration.height,
  durationSeconds: null,
  altText:
    '淘气在正前方、笑笑在左侧、妙想在斜上方观察横放长方体，右侧为①较长长方形、②较窄长方形、③三面组合图，留白用于连线。（AI生成配套素材）',
  transcript: null,
  sourceId: cuboidIllustrationSource.id,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: illustration.generatedAt,
  updatedAt: illustration.generatedAt,
}
