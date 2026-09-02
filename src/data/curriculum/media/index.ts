import type { MediaAsset } from '@/types'

import type { SampleRecord } from '../types'

const sampleMedia = (
  id: string,
  mediaType: MediaAsset['mediaType'],
  storageKey: string,
  url: string,
  mimeType: string,
  width: number | null,
  height: number | null,
): SampleRecord<MediaAsset> => ({
  id,
  mediaType,
  storageKey,
  url,
  mimeType,
  width,
  height,
  durationSeconds: null,
  altText: '示例媒体占位资源',
  transcript: null,
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  copyrightStatus: 'PENDING',
  license: '仅限项目本地开发占位使用，待核验',
  status: 'DRAFT',
  version: 1,
  needsVerification: true,
  createdAt: '2026-09-02T00:00:00+08:00',
  updatedAt: '2026-09-02T00:00:00+08:00',
  isSample: true,
  verificationStatus: 'SAMPLE',
})

export const sampleMediaAssets: SampleRecord<MediaAsset>[] = [
  sampleMedia(
    'SAMPLE_MEDIA_CHARACTER',
    'SVG',
    'sample/placeholders/character.svg',
    '/src/assets/placeholders/sample-character.svg',
    'image/svg+xml',
    96,
    96,
  ),
  sampleMedia(
    'SAMPLE_MEDIA_MAP',
    'SVG',
    'sample/placeholders/map.svg',
    '/src/assets/placeholders/sample-map.svg',
    'image/svg+xml',
    320,
    180,
  ),
  sampleMedia(
    'SAMPLE_MEDIA_QUESTION',
    'SVG',
    'sample/placeholders/question.svg',
    '/src/assets/placeholders/sample-question.svg',
    'image/svg+xml',
    160,
    96,
  ),
]

export const mediaAssetById: ReadonlyMap<string, SampleRecord<MediaAsset>> = new Map(
  sampleMediaAssets.map((asset) => [asset.id, asset]),
)
