import images from './writing-3-images.json'
import material from './writing-3-material.json'
import type { ContentSource, MediaAsset } from '@/types'

export const storyWritingTextSourceId = 'G3_PEP_CHINESE_S1_WRITING_3_TEXT_V3'
export const storyWritingImageSourceId = 'G3_PEP_CHINESE_S1_WRITING_3_AI_IMAGES_V1'
const scenes = [
  '同学们开心分享过九岁生日的经历。',
  '李晓明独自坐在课桌前，因为爸爸妈妈在外地工作而失落。',
  '两名同学悄悄商量如何帮助李晓明，故事等待续写。',
]
const dialogues = [
  '我上个星期过九岁生日，妈妈给我买了一个很大的生日蛋糕。\n我也刚刚过了九岁生日，生日那天是我们全家人一起过的。',
  '我也快过生日了，但是爸爸妈妈都在外地工作……',
  '李晓明的爸爸妈妈在外地工作，我们可以……',
]
export const storyWritingSources: ContentSource[] = [
  {
    id: storyWritingTextSourceId,
    sourceType: 'TEXTBOOK',
    title: '习作续写故事图文情境及用户参考资料',
    edition: '三年级上册·2022修订版（用户标注）',
    sourceRef: 'user-provided://g3-pep-chinese-upper/2026-10-10/writing-3',
    sourceVersion: `SHA256:${material.sourceSha256}`,
    copyrightStatus: 'PENDING',
    verificationStatus: 'REVIEWED',
    verifiedAt: material.updatedAt,
    notes: material.sourceNote,
  },
  {
    id: storyWritingImageSourceId,
    sourceType: 'AI_GENERATED',
    title: '习作续写故事三幅AI生成配套插图',
    sourceRef: 'project://curriculum/grade-3/chinese-pep-upper/writing-3-images.json',
    sourceVersion: 'V1',
    copyrightStatus: 'CLEARED',
    verificationStatus: 'REVIEWED',
    verifiedAt: material.updatedAt,
    notes: '使用内置image_gen根据用户图文情境生成，已检查画面与对话。项目配套素材，不是教材原图。',
  },
]
export const gradeThreeStoryWritingMediaAssets: MediaAsset[] = images.images.map(
  (image, index) => ({
    id: `G3_PEP_CHINESE_S1_WRITING_3_SCENE_${image.scene}`,
    mediaType: 'IMAGE',
    storageKey: image.url.slice(1),
    url: image.url,
    mimeType: 'image/png',
    width: image.width,
    height: image.height,
    durationSeconds: null,
    altText: `第${image.scene}幅图（AI生成配套素材）：${scenes[index]}`,
    transcript: dialogues[index]!,
    sourceId: storyWritingImageSourceId,
    copyrightStatus: 'CLEARED',
    license: null,
    status: 'ACTIVE',
    version: 1,
    needsVerification: false,
    verificationStatus: 'REVIEWED',
    createdAt: material.updatedAt,
    updatedAt: material.updatedAt,
  }),
)
