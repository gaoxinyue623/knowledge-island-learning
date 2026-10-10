import { gradeSixEnglishLowerBundles } from '@/data/curriculum/grade-6/english-shanghai-lower'
import { gradeSixEnglishUpperBundles } from '@/data/curriculum/grade-6/english-shanghai-upper-2022'
import { gradeFourEnglishUpperUnitTestBundles } from '@/data/curriculum/grade-4/english-shanghai-upper-2022/unit-tests'
import { gradeFiveEnglishLowerUnitTestBundles } from '@/data/curriculum/grade-5/english-shanghai-lower/unit-tests'
import { gradeFiveEnglishUpperUnitTestBundles } from '@/data/curriculum/grade-5/english-shanghai-upper-2022/unit-tests'
import { gradeFourEnglishLowerUnitTestBundles } from '@/data/curriculum/grade-4/english-shanghai-lower-2022/unit-tests'
import { gradeThreeEnglishLowerUnitTestBundles } from '@/data/curriculum/grade-3/english-shanghai-lower-2022/unit-tests'
import { gradeThreeEnglishUpperBundles } from '@/data/curriculum/grade-3/english-shanghai-upper-2022'
import { gradeSixBnuLowerUnitTestBundles } from '@/data/curriculum/grade-6/math-bnu-lower-2013/unit-tests'
import { gradeSixBnuUnitTestBundles } from '@/data/curriculum/grade-6/math-bnu-upper-2022/unit-tests'
import { gradeFiveBnuLowerUnitTestBundles } from '@/data/curriculum/grade-5/math-bnu-lower-2013/unit-tests'
import { gradeFiveBnuUnitTestBundles } from '@/data/curriculum/grade-5/math-bnu-upper/unit-tests'
import { gradeFourBnuLowerUnitTestBundles } from '@/data/curriculum/grade-4/math-bnu-lower/unit-tests'
import { gradeFourBnuUnitTestBundles } from '@/data/curriculum/grade-4/math-bnu-upper-2022/unit-tests'
import { bnuUnitTestBundles } from '@/data/curriculum/grade-3/bnu-unit-tests'
import { gradeSixChinese2019LowerBundles } from '@/data/curriculum/grade-6/chinese-pep-lower-2019'
import { gradeFiveChineseLowerBundles } from '@/data/curriculum/grade-5/chinese-pep-lower'
import { gradeFiveChineseBundles } from '@/data/curriculum/grade-5/chinese-pep-upper'
import { gradeSixChineseBundles } from '@/data/curriculum/grade-6/chinese-pep-upper'
import { gradeSixChinese2019Bundles } from '@/data/curriculum/grade-6/chinese-pep-upper-2019'
import { gradeFourChineseLowerBundles } from '@/data/curriculum/grade-4/chinese-pep-lower'
import { gradeFourChineseBundles } from '@/data/curriculum/grade-4/chinese-pep-upper'
import { gradeThreeChineseLowerSyncBundles } from '@/data/curriculum/grade-3/chinese-pep-lower/synchronousExercises'
import { gradeThreeChineseSyncBundles } from '@/data/curriculum/grade-3/chinese-pep-upper/synchronousExercises'
import { approvedLocalBundles } from '@/data/content-expansion/localBundles'
import { shenzhenEnglishLowerSyncBundles } from '@/data/curriculum/grade-2/shenzhen-english-lower/synchronousExercises'
import { bnuMathLowerBundles } from '@/data/curriculum/grade-2/bnu-lower'
import {
  candidateContentExpansionBundles,
  candidateG2ShenzhenMathUpperContentExpansionBundles,
  candidateG1ShenzhenMathUpperContentExpansionBundles,
  candidateG1ShenzhenMathLowerContentExpansionBundles,
  candidateG1ShenzhenEnglishContentExpansionBundles,
  candidateG1ShenzhenEnglishLowerContentExpansionBundles,
  candidateG2ShenzhenEnglishUpperContentExpansionBundles,
  candidateG2ChineseContentExpansionBundles,
  candidateG2ChineseLowerContentExpansionBundles,
  candidateRevisedChineseLowerBundles,
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
      ...candidateG1ShenzhenMathUpperContentExpansionBundles,
      ...candidateG1ShenzhenMathLowerContentExpansionBundles,
      ...candidateLowerChineseContentExpansionBundles,
      ...candidateG2ChineseContentExpansionBundles,
      ...candidateG2ChineseLowerContentExpansionBundles,
      ...candidateRevisedChineseLowerBundles,
      ...candidateG1ShenzhenEnglishContentExpansionBundles,
      ...candidateG1ShenzhenEnglishLowerContentExpansionBundles,
      ...candidateG2ShenzhenEnglishUpperContentExpansionBundles,
      ...bnuMathLowerBundles,
      ...gradeFourBnuLowerUnitTestBundles,
      ...gradeFiveBnuUnitTestBundles,
      ...gradeFiveBnuLowerUnitTestBundles,
      ...gradeSixBnuUnitTestBundles,
      ...gradeSixBnuLowerUnitTestBundles,
      ...gradeFourBnuUnitTestBundles,
      ...bnuUnitTestBundles,
      ...gradeFourEnglishUpperUnitTestBundles,
      ...gradeFiveEnglishLowerUnitTestBundles,
      ...gradeSixEnglishLowerBundles,
      ...gradeSixEnglishUpperBundles,
      ...gradeFiveEnglishUpperUnitTestBundles,
      ...gradeFourEnglishLowerUnitTestBundles,
      ...gradeThreeEnglishLowerUnitTestBundles,
      ...gradeThreeEnglishUpperBundles,
      ...shenzhenEnglishLowerSyncBundles,
      ...gradeThreeChineseSyncBundles,
      ...gradeThreeChineseLowerSyncBundles,
      ...gradeFourChineseBundles,
      ...gradeFourChineseLowerBundles,
      ...gradeFiveChineseBundles,
      ...gradeSixChineseBundles,
      ...gradeSixChinese2019Bundles,
      ...gradeSixChinese2019LowerBundles,
      ...gradeFiveChineseLowerBundles,
    ],
  ) {
    this.goldenBundles = bundles.map(copyBundle)
    this.candidateBundles = candidateBundles.map(copyBundle)
  }

  private records(dataset: ContentExpansionDataset): ContentExpansionBundle[] {
    if (dataset === 'candidate') return this.candidateBundles
    if (dataset === 'profile')
      return [...approvedLocalBundles, ...this.goldenBundles, ...this.candidateBundles]
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
