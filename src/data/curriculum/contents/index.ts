import type { ContentBlock, CourseContent } from '@/types'

import { sampleKnowledgePoints } from '../knowledge-points'
import type { SampleRecord } from '../types'

const placeholderBody: ContentBlock[] = [
  {
    type: 'TEXT',
    text: '示例课程内容，仅用于验证 ContentBlock 与课程数据管线。',
  },
]

export const sampleCourseContents: SampleRecord<CourseContent>[] = sampleKnowledgePoints.map(
  (knowledgePoint, index) => ({
    id: `SAMPLE_CONTENT_${String(index + 1).padStart(2, '0')}`,
    knowledgePointId: knowledgePoint.id,
    title: `示例内容 ${String(index + 1).padStart(2, '0')}（待审核）`,
    contentType: 'EXTENSION',
    contentFormat: 'TEXT',
    body: { blocks: placeholderBody },
    media:
      index === 0
        ? [
            {
              mediaAssetId: 'SAMPLE_MEDIA_MAP',
              usageType: 'ILLUSTRATION',
              order: 1,
            },
          ]
        : undefined,
    difficulty: 'FOUNDATION',
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    needsVerification: true,
    status: 'DRAFT',
    currentVersion: 1,
    isSample: true,
    createdAt: '2026-09-02T00:00:00+08:00',
    updatedAt: '2026-09-02T00:00:00+08:00',
    verificationStatus: 'SAMPLE',
  }),
)

export const courseContentById: ReadonlyMap<string, SampleRecord<CourseContent>> = new Map(
  sampleCourseContents.map((content) => [content.id, content]),
)
