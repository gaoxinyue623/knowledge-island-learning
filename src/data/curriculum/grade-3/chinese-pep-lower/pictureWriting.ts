import manifest from './picture-writing-images.json'
import { G3_CHINESE_LOWER_SYNC_APPROVAL } from '../../production/gradeThreeChineseLowerSyncApproval'
import type { ContentSource, MediaAsset, PictureWritingPrompt } from '@/types'

export const pictureWritingSourceId = 'G3_PEP_CHINESE_S2_UNIT_2_PICTURE_WRITING_AI_V1'
export const pictureWritingSource: ContentSource = {
  id: pictureWritingSourceId,
  title: '三年级下册第二单元看图写故事AI练习素材',
  sourceType: 'AI_GENERATED',
  edition: '部编人教版·三年级下册·年份未注明（用户指定练习范围）',
  sourceRef: 'project://curriculum/grade-3/chinese-pep-lower/picture-writing-images.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G3_CHINESE_LOWER_SYNC_APPROVAL,
  verifiedAt: manifest.generatedAt,
  notes:
    '按用户提供的四个故事主题及参考图生成，已检查四格叙事及物品连续性。原附件配图仍未提供；本次为AI生成练习素材，非教材或原题配图。保留原题与人工点评规则。',
}
export const pictureWritingMediaAssets: MediaAsset[] = manifest.images.map((image) => ({
  id: image.mediaAssetId,
  mediaType: 'IMAGE',
  storageKey: image.url.slice(1),
  url: image.url,
  mimeType: 'image/png',
  width: image.width,
  height: image.height,
  durationSeconds: null,
  altText: `${image.title}：${image.description}（AI生成练习素材）`,
  transcript: image.description,
  sourceId: pictureWritingSourceId,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: manifest.generatedAt,
  updatedAt: manifest.generatedAt,
}))
export const pictureWritingPrompt: PictureWritingPrompt = {
  lineCount: 6,
  choices: manifest.images.map(({ mediaAssetId, title, writingPrompt }) => ({
    mediaAssetId,
    title,
    prompt: writingPrompt,
  })),
}
