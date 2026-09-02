import type {
  ContentBlock,
  Id,
  LessonContentBlockRecord,
  LessonContentBlockViewModel,
  LessonLaunchContext,
  LessonLaunchContextValidation,
  LessonMediaAsset,
  LessonPlayerSource,
  LessonPlayerStatus,
  LessonPlayerViewModel,
  LessonSession,
  LessonStep,
  LessonStepViewModel,
  MediaViewModel,
} from '@/types'

import { buildLessonSessionId } from './lessonSessionStorage'

const UNREVIEWED_STATUSES = new Set(['UNVERIFIED', 'VERIFIED'])

export function createLessonSession(
  context: LessonLaunchContext,
  studentId = 'local-profile',
): LessonSession {
  return {
    id: buildLessonSessionId(context, studentId),
    textbookId: context.textbookId,
    unitId: context.unitId,
    lessonId: context.lessonId,
    knowledgePointId: context.knowledgePointId,
    status: 'not_started',
    currentStepIndex: 0,
    completedStepIds: [],
  }
}

function contextIssue(label: string, expected: string, actual: string): string {
  return `${label}不匹配：期待 ${expected}，实际 ${actual}`
}

/** Validate the complete chain before any lesson content is rendered. */
export function validateLessonLaunchContext(
  context: LessonLaunchContext,
  source: LessonPlayerSource,
): LessonLaunchContextValidation {
  const issues: string[] = []
  if (source.textbook.id !== context.textbookId) {
    issues.push(contextIssue('textbookId', context.textbookId, source.textbook.id))
  }
  if (source.unit.id !== context.unitId) {
    issues.push(contextIssue('unitId', context.unitId, source.unit.id))
  }
  if (source.unit.id !== context.unitId || source.unit.id !== source.context.unitId) {
    issues.push('Unit 不属于当前教材上下文')
  }
  if (source.lesson.id !== context.lessonId) {
    issues.push(contextIssue('lessonId', context.lessonId, source.lesson.id))
  }
  if (source.lesson.id !== source.context.lessonId) {
    issues.push('Lesson 不属于当前 Unit 上下文')
  }
  if (source.knowledgePoint.id !== context.knowledgePointId) {
    issues.push(
      contextIssue('knowledgePointId', context.knowledgePointId, source.knowledgePoint.id),
    )
  }
  if (
    source.mapping.lessonId !== context.lessonId ||
    source.mapping.knowledgePointId !== context.knowledgePointId
  ) {
    issues.push('LessonKnowledgePoint 映射不存在或不属于当前 Lesson')
  }
  if (!source.steps.length) issues.push('当前知识点没有课程步骤')
  if (
    source.context.textbookId !== context.textbookId ||
    source.context.unitId !== context.unitId ||
    source.context.lessonId !== context.lessonId ||
    source.context.knowledgePointId !== context.knowledgePointId
  ) {
    issues.push('LessonLaunchContext 与课程事实链不一致')
  }
  return {
    valid: issues.length === 0,
    ...(issues.length ? { code: 'INVALID_CONTEXT' as const } : {}),
    issues,
  }
}

function mediaViewModel(asset: LessonMediaAsset | undefined): MediaViewModel {
  if (!asset) {
    return {
      id: 'missing-media',
      mediaType: 'IMAGE',
      url: '',
      mimeType: 'application/octet-stream',
      width: null,
      height: null,
      durationSeconds: null,
      altText: null,
      transcript: null,
      isAvailable: false,
      fallbackText: '这张媒体内容暂时无法显示。',
    }
  }
  return {
    ...asset,
    fallbackText: asset.isAvailable ? '媒体加载失败，可继续阅读这一步。' : '媒体内容暂未开放。',
  }
}

function normalizeMediaIds(block: LessonContentBlockRecord): Id[] {
  return [
    ...new Set([
      ...(block.mediaAssetIds ?? []),
      ...(block.block.mediaAssetId ? [block.block.mediaAssetId] : []),
    ]),
  ]
}

function blockContent(block: ContentBlock): string | undefined {
  return block.text?.trim() || undefined
}

function blockViewModel(
  record: LessonContentBlockRecord,
  assetsById: ReadonlyMap<Id, LessonMediaAsset>,
  diagnostics: string[],
): LessonContentBlockViewModel {
  const media = normalizeMediaIds(record).map((mediaId) => {
    const asset = assetsById.get(mediaId)
    if (!asset) diagnostics.push(`MEDIA_UNAVAILABLE: ${mediaId}`)
    return mediaViewModel(asset)
  })
  const interaction = record.interaction
    ? {
        kind: record.interaction.kind,
        prompt: record.interaction.prompt,
        items: record.interaction.items ? [...record.interaction.items] : [],
        ...(record.interaction.revealText ? { revealText: record.interaction.revealText } : {}),
        processSteps: record.interaction.processSteps ? [...record.interaction.processSteps] : [],
        ...(record.interaction.durationSeconds
          ? { durationSeconds: record.interaction.durationSeconds }
          : {}),
      }
    : undefined
  return {
    id: record.id,
    type: record.stepType,
    ...(record.title ? { title: record.title } : {}),
    ...(blockContent(record.block) ? { content: blockContent(record.block) } : {}),
    ...(record.paragraphs?.length ? { paragraphs: [...record.paragraphs] } : {}),
    ...(record.bullets?.length ? { bullets: [...record.bullets] } : {}),
    ...(record.highlights?.length ? { highlights: [...record.highlights] } : {}),
    ...(media.length ? { media } : {}),
    ...(interaction ? { interaction } : {}),
    isSample: record.isSample,
    ...(record.verificationStatus ? { verificationStatus: record.verificationStatus } : {}),
    sort: record.sort,
  }
}

function sortedSteps(source: LessonPlayerSource): LessonStep[] {
  return [...source.steps].sort(
    (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
  )
}

export function buildLessonPlayerViewModel(
  source: LessonPlayerSource,
  session: LessonSession,
  options: {
    status?: LessonPlayerStatus
    diagnostics?: string[]
  } = {},
): LessonPlayerViewModel {
  const diagnostics = [...(options.diagnostics ?? [])]
  const blocksById = new Map(source.blocks.map((block) => [block.id, block]))
  const assetsById = new Map(source.mediaAssets.map((asset) => [asset.id, asset]))
  const steps = sortedSteps(source).map((step): LessonStepViewModel => {
    const contentBlocks = step.contentBlockIds
      .map((blockId) => blocksById.get(blockId))
      .filter((block): block is LessonContentBlockRecord => Boolean(block))
      .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
      .map((block) => blockViewModel(block, assetsById, diagnostics))
    if (contentBlocks.length !== step.contentBlockIds.length) {
      diagnostics.push(`CONTENT_BLOCK_MISSING: ${step.id}`)
    }
    return {
      ...step,
      contentBlocks,
      isCompleted: session.completedStepIds.includes(step.id),
    }
  })
  const completedStepIds = session.completedStepIds.filter((id) =>
    steps.some((step) => step.id === id),
  )
  const currentStepIndex = Math.min(
    Math.max(0, session.currentStepIndex),
    Math.max(0, steps.length - 1),
  )
  const completedCount = completedStepIds.length
  const totalCount = steps.length
  const status = options.status ?? (session.status === 'completed' ? 'completed' : 'ready')
  const verificationStatuses = [source.verificationStatus, source.contentVerificationStatus]
  const isUnverified = verificationStatuses.some((value) =>
    value ? UNREVIEWED_STATUSES.has(value) : false,
  )
  return {
    context: source.context,
    textbook: source.textbook,
    unit: source.unit,
    lesson: source.lesson,
    knowledgePoint: source.knowledgePoint,
    learningGoals: [...source.learningGoals],
    steps,
    currentStepIndex,
    currentStep: steps[currentStepIndex],
    session: {
      id: session.id,
      status: session.status,
      currentStepIndex,
      completedStepIds,
      completedCount,
      totalCount,
      progress: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
      ...(session.startedAt ? { startedAt: session.startedAt } : {}),
      ...(session.updatedAt ? { updatedAt: session.updatedAt } : {}),
      ...(session.completedAt ? { completedAt: session.completedAt } : {}),
    },
    status,
    flags: {
      isSample: source.isSample || source.contentIsSample,
      isUnverified,
      isDemo: source.isDemo === true,
      isContentAvailable: source.steps.length > 0,
    },
    diagnostics: [...new Set(diagnostics)],
  }
}
