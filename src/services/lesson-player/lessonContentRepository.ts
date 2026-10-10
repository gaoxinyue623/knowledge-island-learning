import { curriculumData } from '@/data/curriculum'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import type {
  ContentBlock,
  CourseContent,
  Id,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
  LiteracyTablePresentation,
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

function isEditorialSourceNote(text: string): boolean {
  return (
    /(?:用户.{0,12}(?:提供|附件|标注|确认|上传)|来稿|附件|来源说明|来源\s*[:：])/.test(
      text,
    ) && /(?:接入|整理|学习|保留|核对|核验|版次|出版社原版|原版|不自动判分)/.test(text)
  )
}

function displayedContentBlocks(content: CourseContent, blocks: ContentBlock[]): ContentBlock[] {
  const body = content.body
  const sourceNotes = [body['sourceNote'], body['editionNote']].filter(
    (value): value is string => typeof value === 'string' && Boolean(value.trim()),
  )
  const summary = body['summary']
  if (typeof summary === 'string' && isEditorialSourceNote(summary)) sourceNotes.push(summary)

  return blocks.flatMap((block) => {
    if (block.type !== 'TEXT' || typeof block.text !== 'string') return [block]

    let text = block.text
    for (const note of sourceNotes) text = text.replaceAll(note, '')
    text = text.replace(/^\s*(?:#{1,6}\s*)?用户提供的单元提要(?:（[^）]*）)?\s*$/gmu, '')

    const paragraphs = text
      .split(/\n\s*\n+/)
      .filter((paragraph) => paragraph.trim() && !isEditorialSourceNote(paragraph))
    const displayedText = paragraphs.join('\n\n').trim()
    return displayedText ? [{ ...block, text: displayedText }] : []
  })
}

function bodyLiteracyTable(content: CourseContent): LiteracyTablePresentation | undefined {
  const body = content.body
  const kind = body.tableKind
  if (!['recognition', 'writing', 'words'].includes(String(kind))) return undefined
  const groups = body.literacyGroups
  if (
    !Array.isArray(groups) ||
    !groups.length ||
    !groups.every(
      (group) =>
        group &&
        typeof group.heading === 'string' &&
        Array.isArray(group.entries) &&
        group.entries.every((entry: unknown) => {
          if (kind !== 'recognition') return typeof entry === 'string'
          if (!entry || typeof entry !== 'object') return false
          const character = entry as Record<string, unknown>
          return (
            typeof character.character === 'string' &&
            typeof character.pinyin === 'string' &&
            typeof character.polyphonic === 'boolean'
          )
        }),
    )
  )
    return undefined
  if (typeof body.declaredCount !== 'number' || typeof body.entryCount !== 'number')
    return undefined
  return {
    title: content.title,
    tableKind: kind as LiteracyTablePresentation['tableKind'],
    declaredCount: body.declaredCount,
    entryCount: body.entryCount,
    polyphonicCount: typeof body.polyphonicCount === 'number' ? body.polyphonicCount : 0,
    groups: groups as LiteracyTablePresentation['groups'],
    sourcePages: Array.isArray(body.sourcePages)
      ? body.sourcePages.filter(
          (page) => page && typeof page.url === 'string' && typeof page.title === 'string',
        )
      : [],
  }
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
  const sourceBlocks = bodyBlocks(content)
  if (!sourceBlocks?.length) return null
  const blocks = displayedContentBlocks(content, sourceBlocks)
  if (!blocks.length) return null

  const literacyTable = bodyLiteracyTable(content)
  const occurrenceByFingerprint = new Map<string, number>()
  const blockRecords: LessonContentBlockRecord[] = blocks.map((block, index) => {
    const fingerprint = stableBlockFingerprint(block)
    const occurrence = (occurrenceByFingerprint.get(fingerprint) ?? 0) + 1
    occurrenceByFingerprint.set(fingerprint, occurrence)
    const stableKey = occurrence === 1 ? fingerprint : `${fingerprint}-${occurrence}`
    return {
      id: `${content.id}:block:${stableKey}`,
      block,
      stepType: block.mediaAssetId ? 'media' : index === 0 ? 'intro' : 'concept',
      title: index === 0 && !literacyTable ? content.title : undefined,
      ...(index === 1 && literacyTable ? { literacyTable } : {}),
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
