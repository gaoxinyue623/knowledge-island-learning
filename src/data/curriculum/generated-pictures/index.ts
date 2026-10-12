import manifest from './manifest.json'
import type { ContentBlock, ContentSource, MediaAsset, Question } from '@/types'
import type { CurriculumData } from '../types'

export const TASK_PICTURES_APPROVAL = 'OWNER_TASK_PICTURES_2026_10_12'
const SOURCE_PREFIX = 'GENERATED_TASK_PICTURES_2026_10_12'
export const taskPictures = manifest.images

const sourceId = (mode: string) =>
  `${SOURCE_PREFIX}_${mode === 'built-in image_gen' ? 'AI' : 'SVG'}`

export const taskPictureSources: ContentSource[] = ['built-in image_gen', 'deterministic SVG'].map(
  (mode) => ({
    id: sourceId(mode),
    title: mode === 'built-in image_gen' ? '看图活动生成配图' : '按题目条件绘制的数学配图',
    sourceType: mode === 'built-in image_gen' ? 'AI_GENERATED' : 'TEACHER_CREATED',
    sourceRef: 'project://curriculum/generated-pictures/manifest.json',
    sourceVersion: 'V1',
    copyrightStatus: 'CLEARED',
    verificationStatus: 'REVIEWED',
    releaseApprovalId: TASK_PICTURES_APPROVAL,
    verifiedAt: manifest.generatedAt,
    notes: `${manifest.authorization} 工具：${mode}。原稿保留，配图为项目新增素材，题目条件核对范围记录于清单。`,
  }),
)

export const taskPictureAssets: MediaAsset[] = taskPictures.map((picture) => ({
  id: picture.id,
  mediaType: 'IMAGE',
  storageKey: picture.url.slice(1),
  url: picture.url,
  mimeType: picture.url.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
  width: picture.width,
  height: picture.height,
  durationSeconds: null,
  altText: picture.altText,
  transcript: null,
  sourceId: sourceId(picture.mode),
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: manifest.generatedAt,
  updatedAt: manifest.generatedAt,
}))

/** Append companions to the published projection, preserving imported text and IDs. */
export function applyTaskPictures(curriculum: CurriculumData): CurriculumData {
  const firstContent = new Map<string, string>()
  for (const content of curriculum.courseContents)
    if (!firstContent.has(content.knowledgePointId))
      firstContent.set(content.knowledgePointId, content.id)
  return {
    ...curriculum,
    sources: [
      ...curriculum.sources,
      ...taskPictureSources.filter(
        (source) => !curriculum.sources.some((item) => item.id === source.id),
      ),
    ],
    mediaAssets: [
      ...curriculum.mediaAssets,
      ...taskPictureAssets.filter(
        (asset) => !curriculum.mediaAssets.some((item) => item.id === asset.id),
      ),
    ],
    courseContents: curriculum.courseContents.map((content) => {
      const pictures = taskPictures.filter(
        (picture) =>
          picture.lesson &&
          picture.nodeId === content.knowledgePointId &&
          firstContent.get(picture.nodeId) === content.id,
      )
      if (!pictures.length) return content
      const originalBlocks = (content.body.blocks ?? []) as ContentBlock[]
      const additions = pictures.filter(
        (picture) => !originalBlocks.some((block) => block.mediaAssetId === picture.id),
      )
      if (!additions.length) return content
      return {
        ...content,
        currentVersion: content.currentVersion + 1,
        updatedAt: manifest.generatedAt,
        body: {
          ...content.body,
          blocks: [
            ...originalBlocks,
            ...additions.map((picture): ContentBlock => ({
              type: 'IMAGE',
              mediaAssetId: picture.id,
              altText: picture.altText,
            })),
          ],
          sourceIds: [
            ...new Set([
              content.sourceId,
              ...((content.body.sourceIds ?? []) as string[]),
              ...pictures.map((picture) => sourceId(picture.mode)),
            ]),
          ],
          taskPictureSupplement: {
            generatedAt: manifest.generatedAt,
            manifest: 'project://curriculum/generated-pictures/manifest.json',
            assets: pictures.map((picture) => picture.id),
          },
        },
      }
    }),
  }
}

/** Bind only the exact exercises whose conditions match the picture. */
export function attachTaskQuestionPictures(questions: Question[]): Question[] {
  return questions.map((question) => {
    const pictures = taskPictures.filter((picture) => picture.questionIds.includes(question.id))
    const additions = pictures.filter(
      (picture) => !question.media.some((media) => media.mediaAssetId === picture.id),
    )
    if (!additions.length) return question
    return {
      ...question,
      media: [
        ...question.media,
        ...additions.map((picture, index) => ({
          mediaAssetId: picture.id,
          usageType: 'STEM' as const,
          order: Math.max(0, ...question.media.map((media) => media.order)) + index + 1,
        })),
      ],
    }
  })
}
