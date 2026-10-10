import supplement from './unit-3-image-supplement.json'
import type { MediaAsset } from '@/types'

export const G5_CHINESE_LOWER_UNIT_3_SOURCE_ID = 'G5_PEP_CHINESE_S2_UNIT_3_IMAGES_V4'
export const gradeFiveChineseUnitThreeMediaAssets: MediaAsset[] = supplement.assets.map(
  (asset) => ({
    id: asset.mediaAssetId,
    mediaType: 'IMAGE',
    storageKey: asset.url.slice(1),
    url: asset.url,
    mimeType: 'image/png',
    width: asset.width,
    height: asset.height,
    durationSeconds: null,
    altText: asset.title,
    transcript: null,
    sourceId: G5_CHINESE_LOWER_UNIT_3_SOURCE_ID,
    copyrightStatus: 'CLEARED',
    license: null,
    status: 'ACTIVE',
    version: 1,
    needsVerification: false,
    verificationStatus: 'REVIEWED',
    createdAt: supplement.updatedAt,
    updatedAt: supplement.updatedAt,
  }),
)

/** Insert the original crop at its matching heading or paragraph, preserving textual order. */
export function unitThreeContentBlocks(key: string, texts: string[]) {
  const assets = supplement.assets.filter((asset) => asset.ownerKey === key)
  return texts.flatMap((text) => [
    ...assets
      .filter((asset) => text.startsWith(asset.beforeText))
      .map((asset) => ({
        type: 'IMAGE',
        mediaAssetId: asset.mediaAssetId,
        altText: asset.title,
        text: `${asset.title} · 从用户附件原图提取`,
      })),
    { type: 'TEXT', text },
  ])
}
