import {
  candidateContentExpansionBundles,
  candidateG2ShenzhenMathUpperContentExpansionBundles,
  candidateG1ShenzhenEnglishContentExpansionBundles,
  candidateG1ShenzhenEnglishLowerContentExpansionBundles,
  candidateG2ShenzhenEnglishUpperContentExpansionBundles,
  candidateG2ChineseContentExpansionBundles,
  candidateG2ChineseLowerContentExpansionBundles,
  candidateLowerChineseContentExpansionBundles,
  goldenContentExpansionBundles,
} from '@/data/content-expansion'
import { productionConfig } from '@/config/production'
import {
  isProductionChallenge,
  isProductionExerciseTemplate,
  isProductionExtensionActivity,
  isProductionInteractiveActivity,
  isProductionPracticeSet,
} from '@/services/production-readiness'
import type {
  Challenge,
  ContentExpansionBundle,
  ContentExpansionDataset,
  ExerciseTemplate,
  ExtensionActivity,
  Id,
  InteractiveActivity,
  PracticeSet,
} from '@/types'

export interface ContentExpansionRepository {
  getBundle(
    knowledgePointId: Id,
    dataset?: ContentExpansionDataset,
  ): Promise<ContentExpansionBundle | null>
  listBundles(dataset?: ContentExpansionDataset): Promise<ContentExpansionBundle[]>
}

function readableBundle(bundle: ContentExpansionBundle, dataset: ContentExpansionDataset): boolean {
  if (dataset === 'candidate') {
    // Candidate authored exercises are useful in the local development
    // runtime, but remain unavailable to a production build until a
    // reviewer promotes every record independently.
    return (
      !productionConfig.isProduction &&
      bundle.learningContent.isSample !== true &&
      bundle.activities.every((record) => record.isSample !== true) &&
      bundle.exerciseTemplates.every((record) => record.isSample !== true) &&
      bundle.practiceSets.every((record) => record.isSample !== true) &&
      bundle.extensionActivities.every((record) => record.isSample !== true) &&
      bundle.challenges.every((record) => record.isSample !== true)
    )
  }
  if (dataset !== 'profile') return !productionConfig.isProduction
  return (
    bundle.learningContent.isSample !== true &&
    bundle.activities.every(isProductionInteractiveActivity) &&
    bundle.exerciseTemplates.every(isProductionExerciseTemplate) &&
    bundle.practiceSets.every(isProductionPracticeSet) &&
    bundle.extensionActivities.every(isProductionExtensionActivity) &&
    bundle.challenges.every(isProductionChallenge)
  )
}

function copyBundle(bundle: ContentExpansionBundle): ContentExpansionBundle {
  return {
    ...bundle,
    learningContent: structuredClone(bundle.learningContent),
    activities: structuredClone(bundle.activities),
    exerciseTemplates: structuredClone(bundle.exerciseTemplates),
    practiceSets: structuredClone(bundle.practiceSets),
    extensionActivities: structuredClone(bundle.extensionActivities),
    challenges: structuredClone(bundle.challenges),
  }
}

export class StaticContentExpansionRepository implements ContentExpansionRepository {
  private readonly goldenBundles: ContentExpansionBundle[]
  private readonly candidateBundles: ContentExpansionBundle[]

  constructor(
    bundles: readonly ContentExpansionBundle[] = goldenContentExpansionBundles,
    candidateBundles: readonly ContentExpansionBundle[] = [
      ...candidateContentExpansionBundles,
      ...candidateG2ShenzhenMathUpperContentExpansionBundles,
      ...candidateLowerChineseContentExpansionBundles,
      ...candidateG2ChineseContentExpansionBundles,
      ...candidateG2ChineseLowerContentExpansionBundles,
      ...candidateG1ShenzhenEnglishContentExpansionBundles,
      ...candidateG1ShenzhenEnglishLowerContentExpansionBundles,
      ...candidateG2ShenzhenEnglishUpperContentExpansionBundles,
    ],
  ) {
    this.goldenBundles = bundles.map(copyBundle)
    this.candidateBundles = candidateBundles.map(copyBundle)
  }

  private records(dataset: ContentExpansionDataset): ContentExpansionBundle[] {
    if (dataset === 'candidate') return this.candidateBundles
    if (dataset === 'profile') return [...this.goldenBundles, ...this.candidateBundles]
    return this.goldenBundles
  }

  async getBundle(
    knowledgePointId: Id,
    dataset: ContentExpansionDataset = 'profile',
  ): Promise<ContentExpansionBundle | null> {
    const bundle = this.records(dataset).find(
      (candidate) => candidate.knowledgePointId === knowledgePointId,
    )
    return bundle && readableBundle(bundle, dataset) ? copyBundle(bundle) : null
  }

  async listBundles(
    dataset: ContentExpansionDataset = 'profile',
  ): Promise<ContentExpansionBundle[]> {
    return this.records(dataset)
      .filter((bundle) => readableBundle(bundle, dataset))
      .map(copyBundle)
  }
}

export const contentExpansionRepository = new StaticContentExpansionRepository()

export function allExpansionRecords(
  bundle: ContentExpansionBundle,
): Array<InteractiveActivity | ExerciseTemplate | PracticeSet | ExtensionActivity | Challenge> {
  return [
    ...bundle.activities,
    ...bundle.exerciseTemplates,
    ...bundle.practiceSets,
    ...bundle.extensionActivities,
    ...bundle.challenges,
  ]
}
