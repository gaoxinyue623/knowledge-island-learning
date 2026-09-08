import { curriculumData } from '@/data/curriculum'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import type {
  ContentBlock,
  CourseContent,
  Id,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
} from '@/types'

import {
  curriculumAccessConfig,
  isLearningContentRecordReadable,
  type CurriculumAccessPolicy,
} from '@/services/curriculum'
import { isContentBlock } from '@/services/validation'

export interface MockLearningContentRepositoryOptions {
  records?: CourseContent[]
  accessPolicy?: CurriculumAccessPolicy
}

function bodyBlocks(content: CourseContent): ContentBlock[] | null {
  const candidate = content.body['blocks']
  if (!Array.isArray(candidate) || !candidate.every((block) => isContentBlock(block))) return null
  return candidate as ContentBlock[]
}

function bodyStrings(content: CourseContent, key: string): string[] {
  const value = content.body[key]
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? [...(value as string[])]
    : []
}

function stableBlockFingerprint(block: ContentBlock): string {
  const seed = [block.type, block.text ?? '', block.mediaAssetId ?? '', block.altText ?? ''].join(
    '|',
  )
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${block.type.toLowerCase()}-${(hash >>> 0).toString(36)}`
}

export function buildLearningContentFromCourseContent(
  content: CourseContent,
): LearningContent | null {
  const blocks = bodyBlocks(content)
  if (!blocks?.length) return null

  const occurrenceByFingerprint = new Map<string, number>()
  const blockRecords: LessonContentBlockRecord[] = blocks.map((block, index) => {
    const fingerprint = stableBlockFingerprint(block)
    const occurrence = (occurrenceByFingerprint.get(fingerprint) ?? 0) + 1
    occurrenceByFingerprint.set(fingerprint, occurrence)
    const stableKey = occurrence === 1 ? fingerprint : `${fingerprint}-${occurrence}`
    return {
      id: `${content.id}:block:${stableKey}`,
      block,
      stepType: index === 0 ? 'intro' : 'concept',
      title: index === 0 ? content.title : undefined,
      mediaAssetIds:
        index === 0 && content.media?.length
          ? content.media
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((media) => media.mediaAssetId)
          : undefined,
      sort: index + 1,
      isSample: content.isSample,
      verificationStatus: content.verificationStatus,
    }
  })
  const steps: LessonStep[] = blockRecords.map((block) => ({
    id: `${block.id}:step`,
    type: block.stepType as LessonStep['type'],
    title: block.title,
    contentBlockIds: [block.id],
    required: true,
    sort: block.sort,
  }))
  const learningGoals = bodyStrings(content, 'learningGoals')
  return {
    id: content.id,
    lessonId: typeof content.body['lessonId'] === 'string' ? content.body['lessonId'] : content.id,
    knowledgePointId: content.knowledgePointId,
    title: content.title,
    learningGoals,
    steps,
    blocks: blockRecords,
    sourceId: content.sourceId,
    status: content.status,
    currentVersion: content.currentVersion,
    isSample: content.isSample,
    verificationStatus: content.verificationStatus,
    contentStatus: content.status,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  }
}

export class MockLearningContentRepository {
  private readonly records: CourseContent[]
  private readonly accessPolicy: CurriculumAccessPolicy

  constructor(options: MockLearningContentRepositoryOptions = {}) {
    this.records = options.records ?? curriculumData.courseContents
    this.accessPolicy = options.accessPolicy ?? curriculumAccessConfig
  }

  async getByKnowledgePoint(knowledgePointId: Id): Promise<LearningContent | null> {
    const content = this.records
      .filter(
        (record) =>
          record.knowledgePointId === knowledgePointId &&
          isLearningContentRecordReadable(record, this.accessPolicy),
      )
      .sort(
        (left, right) =>
          right.currentVersion - left.currentVersion || left.id.localeCompare(right.id),
      )
      .at(0)
    return content ? buildLearningContentFromCourseContent(content) : null
  }
}

export const learningContentRepository = new MockLearningContentRepository({
  records: [...productionCurriculumIndex.contents],
})
