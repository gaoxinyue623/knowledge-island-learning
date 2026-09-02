import { demoLessonPlayerSource } from '@/data/lesson-player/demo'
import { goldenMathPepG3S1Package } from '@/data/curriculum/verified/math/pep/g3-s1'
import { contentService, curriculumService } from '@/services/runtime'
import type { ContentService, CurriculumService } from '@/services/contracts'
import {
  curriculumAccessConfig,
  isLearningContentRecordReadable,
  type CurriculumAccessPolicy,
} from '@/services/curriculum'
import { buildLearningMapSourceFromImportPackage } from '@/services/learning-map/curriculumSource'
import type {
  Id,
  LessonContentBlockRecord,
  LessonLaunchContext,
  LessonMediaAsset,
  LessonPlayerDataset,
  LessonPlayerDemoState,
  LessonPlayerLoadResult,
  LessonPlayerRepository,
  LessonPlayerSource,
  LessonStep,
  LearningContent,
  MediaAsset,
} from '@/types'

import type { MockLearningContentRepository } from './lessonContentRepository'
import { learningContentRepository } from './lessonContentRepository'

type LessonPlayerMockMode = 'success' | 'empty' | 'error' | 'not_available'

export interface MockLessonPlayerRepositoryOptions {
  mode?: LessonPlayerMockMode
  curriculum?: CurriculumService
  content?: MockLearningContentRepository
  contentService?: ContentService
  accessPolicy?: CurriculumAccessPolicy
}

function isSameContext(left: LessonLaunchContext, right: LessonLaunchContext): boolean {
  return (
    left.textbookId === right.textbookId &&
    left.unitId === right.unitId &&
    left.lessonId === right.lessonId &&
    left.knowledgePointId === right.knowledgePointId
  )
}

function mediaViewModel(asset: MediaAsset): LessonMediaAsset {
  return {
    id: asset.id,
    mediaType: asset.mediaType,
    url: asset.url,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.durationSeconds,
    altText: asset.altText,
    transcript: asset.transcript,
    isAvailable: Boolean(asset.url),
  }
}

function sourceFromLearningContent(
  content: LearningContent,
  context: LessonLaunchContext,
  textbookTitle: string,
  unitTitle: string,
  lessonTitle: string,
  knowledgePoint: { id: Id; name: string; description?: string },
  mappingId: Id,
  mediaAssets: LessonMediaAsset[],
): LessonPlayerSource {
  const blocks = content.blocks.map((block): LessonContentBlockRecord => ({ ...block }))
  const steps = content.steps.map((step): LessonStep => ({ ...step }))
  return {
    context,
    textbook: { id: context.textbookId, title: textbookTitle },
    unit: { id: context.unitId, title: unitTitle },
    lesson: { id: context.lessonId, title: lessonTitle },
    knowledgePoint,
    mapping: {
      id: mappingId,
      lessonId: context.lessonId,
      knowledgePointId: context.knowledgePointId,
    },
    learningGoals:
      content.learningGoals.length > 0
        ? [...content.learningGoals]
        : knowledgePoint.description
          ? [knowledgePoint.description]
          : [],
    steps,
    blocks,
    mediaAssets,
    sourceId: content.sourceId,
    isSample: content.isSample,
    verificationStatus: content.verificationStatus,
    contentIsSample: content.isSample,
    contentVerificationStatus: content.verificationStatus,
    contentStatus: content.contentStatus ?? content.status,
    isDemo: false,
  }
}

function mediaIds(content: LearningContent): Id[] {
  return [
    ...new Set(
      content.blocks.flatMap((block) => [
        ...(block.mediaAssetIds ?? []),
        ...(block.block.mediaAssetId ? [block.block.mediaAssetId] : []),
      ]),
    ),
  ]
}

function toGoldenSource(): LessonPlayerSource {
  const mapSource = buildLearningMapSourceFromImportPackage(goldenMathPepG3S1Package)
  const lesson = mapSource.lessons[0]
  const mapping = mapSource.lessonKnowledgePoints.find((item) => item.lessonId === lesson?.id)
  const knowledgePoint = mapping
    ? mapSource.knowledgePoints.find((item) => item.id === mapping.knowledgePointId)
    : undefined
  if (!lesson || !mapping || !knowledgePoint) throw new Error('GOLDEN_LESSON_FIXTURE_INVALID')
  const context: LessonLaunchContext = {
    textbookId: mapSource.textbook.id,
    unitId: mapSource.units[0]?.id ?? '',
    lessonId: lesson.id,
    knowledgePointId: knowledgePoint.id,
  }
  const block: LessonContentBlockRecord = {
    id: 'GOLDEN_CONTENT_BLOCK_PENDING',
    block: { type: 'TEXT', text: '这是一条待审核的学习内容占位。' },
    stepType: 'intro',
    title: '待审核学习内容',
    sort: 1,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  }
  return {
    context,
    textbook: { id: mapSource.textbook.id, title: mapSource.textbook.title },
    unit: { id: context.unitId, title: mapSource.units[0]?.title ?? '待核验单元' },
    lesson: { id: lesson.id, title: lesson.title },
    knowledgePoint: {
      id: knowledgePoint.id,
      name: knowledgePoint.name,
      description: '待根据可靠课程来源确认的知识点描述。',
    },
    mapping: {
      id: mapping.id,
      lessonId: mapping.lessonId,
      knowledgePointId: mapping.knowledgePointId,
    },
    learningGoals: ['待审核学习目标'],
    steps: [
      {
        id: 'GOLDEN_LESSON_STEP_PENDING',
        type: 'intro',
        title: '待审核学习内容',
        contentBlockIds: [block.id],
        required: true,
        sort: 1,
      },
    ],
    blocks: [block],
    mediaAssets: [],
    sourceId: 'GOLDEN_MATH_PEP_G3_S1_SOURCE_PENDING',
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    contentIsSample: false,
    contentVerificationStatus: 'UNVERIFIED',
    contentStatus: 'DRAFT',
    isDemo: false,
  }
}

export class MockLessonPlayerRepository implements LessonPlayerRepository {
  private readonly mode: LessonPlayerMockMode
  private readonly content: MockLearningContentRepository
  private readonly curriculumOverride?: CurriculumService
  private readonly contentApiOverride?: ContentService
  private readonly accessPolicy: CurriculumAccessPolicy

  constructor(options: MockLessonPlayerRepositoryOptions = {}) {
    this.mode = options.mode ?? 'success'
    this.curriculumOverride = options.curriculum
    this.content = options.content ?? learningContentRepository
    this.contentApiOverride = options.contentService
    this.accessPolicy = options.accessPolicy ?? curriculumAccessConfig
  }

  async getLessonPlayerSource(
    context: LessonLaunchContext,
    dataset: LessonPlayerDataset = 'profile',
    options: { demoState?: LessonPlayerDemoState } = {},
  ): Promise<LessonPlayerLoadResult> {
    if (this.mode === 'error') throw new Error('SAMPLE_LESSON_PLAYER_ERROR')
    if (this.mode === 'empty') return { source: null, issue: 'CONTENT_EMPTY' }
    if (this.mode === 'not_available') return { source: null, issue: 'NOT_AVAILABLE' }

    if (dataset === 'demo') {
      const demoState = options.demoState ?? 'full'
      if (demoState === 'empty') return { source: null, issue: 'CONTENT_EMPTY' }
      if (demoState === 'error') throw new Error('SAMPLE_LESSON_PLAYER_ERROR')
      if (demoState === 'not_available') return { source: null, issue: 'NOT_AVAILABLE' }
      const source =
        demoState === 'unverified'
          ? {
              ...demoLessonPlayerSource,
              isSample: false,
              verificationStatus: 'UNVERIFIED' as const,
              contentIsSample: false,
              contentVerificationStatus: 'UNVERIFIED' as const,
              isDemo: false,
              blocks: demoLessonPlayerSource.blocks.map((block) => ({
                ...block,
                isSample: false,
                verificationStatus: 'UNVERIFIED' as const,
              })),
            }
          : demoLessonPlayerSource
      return isSameContext(context, source.context)
        ? this.guardContent(source)
        : { source: null, issue: 'INVALID_CONTEXT', message: 'Demo LessonLaunchContext 不存在。' }
    }
    if (dataset === 'golden') {
      const source = toGoldenSource()
      return isSameContext(context, source.context)
        ? this.guardContent(source)
        : { source: null, issue: 'INVALID_CONTEXT', message: 'Golden LessonLaunchContext 不存在。' }
    }
    return this.getProfileSource(context)
  }

  private guardContent(source: LessonPlayerSource): LessonPlayerLoadResult {
    if (
      !isLearningContentRecordReadable(
        {
          isSample: source.contentIsSample,
          verificationStatus: source.contentVerificationStatus,
          status: source.contentStatus,
        },
        this.accessPolicy,
      )
    ) {
      return {
        source: null,
        issue: 'CONTENT_NOT_AVAILABLE',
        message: '该学习内容暂未开放。',
      }
    }
    return { source }
  }

  private async getProfileSource(context: LessonLaunchContext): Promise<LessonPlayerLoadResult> {
    // Resolve application defaults lazily: services/index.ts exports this
    // repository as part of the same module graph as curriculumService.
    const curriculum = this.curriculumOverride ?? curriculumService
    const contentApi = this.contentApiOverride ?? contentService
    const textbook = await curriculum.getTextbook(context.textbookId)
    if (!textbook) return { source: null, issue: 'INVALID_CONTEXT', message: '教材上下文不存在。' }
    const units = await curriculum.getUnitsByTextbookVersion(textbook.id)
    const unit = units.find((candidate) => candidate.id === context.unitId)
    if (!unit || unit.textbookVersionId !== textbook.id) {
      return { source: null, issue: 'INVALID_CONTEXT', message: 'Unit 不属于当前教材。' }
    }
    const lessons = await curriculum.getLessonsByUnit(unit.id)
    const lesson = lessons.find((candidate) => candidate.id === context.lessonId)
    if (!lesson || lesson.unitId !== unit.id) {
      return { source: null, issue: 'INVALID_CONTEXT', message: 'Lesson 不属于当前 Unit。' }
    }
    const knowledgePoints = await curriculum.getKnowledgePointsByLesson(lesson.id)
    const knowledgePoint = knowledgePoints.find(
      (candidate) => candidate.id === context.knowledgePointId,
    )
    if (!knowledgePoint) {
      return {
        source: null,
        issue: 'INVALID_CONTEXT',
        message: '当前 KnowledgePoint 没有 LessonKnowledgePoint 映射。',
      }
    }
    const relation = curriculum.getLessonKnowledgePointRelation
      ? await curriculum.getLessonKnowledgePointRelation(lesson.id, knowledgePoint.id)
      : null
    const content = await this.content.getByKnowledgePoint(knowledgePoint.id)
    if (!content) {
      return { source: null, issue: 'CONTENT_NOT_AVAILABLE', message: '该学习内容暂未开放。' }
    }
    const assets = await Promise.all(
      mediaIds(content).map((mediaId) => contentApi.getMediaAsset(mediaId)),
    )
    const mediaAssets = assets
      .filter((asset): asset is MediaAsset => Boolean(asset))
      .map(mediaViewModel)
    const source = sourceFromLearningContent(
      content,
      context,
      textbook.versionName,
      unit.title,
      lesson.title,
      {
        id: knowledgePoint.id,
        name: knowledgePoint.name,
        description: knowledgePoint.description,
      },
      relation?.id ?? `lesson-kp:${lesson.id}:${knowledgePoint.id}`,
      mediaAssets,
    )
    return this.guardContent(source)
  }
}

export const lessonPlayerRepository = new MockLessonPlayerRepository()
