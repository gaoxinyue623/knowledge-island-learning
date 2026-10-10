import {
  gradeFourEnglishUpperUnitTestPracticeFor,
  gradeFourEnglishUpperUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-4/english-shanghai-upper-2022/unit-tests'
import {
  gradeFiveEnglishLowerUnitTestPracticeFor,
  gradeFiveEnglishLowerUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-5/english-shanghai-lower/unit-tests'
import {
  gradeFiveEnglishUpperUnitTestPracticeFor,
  gradeFiveEnglishUpperUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-5/english-shanghai-upper-2022/unit-tests'
import {
  gradeFourEnglishLowerUnitTestPracticeFor,
  gradeFourEnglishLowerUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-4/english-shanghai-lower-2022/unit-tests'
import {
  gradeThreeEnglishLowerUnitTestPracticeFor,
  gradeThreeEnglishLowerUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-3/english-shanghai-lower-2022/unit-tests'
import {
  gradeSixBnuLowerUnitTestPracticeFor,
  gradeSixBnuLowerUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-6/math-bnu-lower-2013/unit-tests'
import {
  gradeSixBnuUnitTestPracticeFor,
  gradeSixBnuUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-6/math-bnu-upper-2022/unit-tests'
import {
  gradeFiveBnuLowerUnitTestPracticeFor,
  gradeFiveBnuLowerUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-5/math-bnu-lower-2013/unit-tests'
import {
  gradeFiveBnuUnitTestPracticeFor,
  gradeFiveBnuUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-5/math-bnu-upper/unit-tests'
import {
  gradeFourBnuLowerUnitTestPracticeFor,
  gradeFourBnuLowerUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-4/math-bnu-lower/unit-tests'
import {
  gradeFourBnuUnitTestPracticeFor,
  gradeFourBnuUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-4/math-bnu-upper-2022/unit-tests'
import {
  bnuUnitTestPracticeFor,
  bnuUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-3/bnu-unit-tests'
import { englishSyncPracticeFor } from '@/data/curriculum/grade-2/shenzhen-english-lower/synchronousExercises'
import {
  chineseLowerSyncPracticeFor,
  chineseLowerSyncPracticeForLesson,
} from '@/data/curriculum/grade-3/chinese-pep-lower/synchronousExercises'
import {
  chineseSyncPracticeFor,
  chineseSyncPracticeForLesson,
} from '@/data/curriculum/grade-3/chinese-pep-upper/synchronousExercises'
import type { AssessmentLaunchContext } from '@/types'

type Context = Pick<
  AssessmentLaunchContext,
  'textbookId' | 'unitId' | 'lessonId' | 'knowledgePointId'
> | null

/** Assessment URLs must match the stored canonical context in all four fields. */
export function synchronousPracticeFor(context: Context, practiceSetId?: string) {
  return (
    gradeFourEnglishUpperUnitTestPracticeFor(context, practiceSetId) ??
    gradeFiveEnglishLowerUnitTestPracticeFor(context, practiceSetId) ??
    gradeFiveEnglishUpperUnitTestPracticeFor(context, practiceSetId) ??
    gradeFourEnglishLowerUnitTestPracticeFor(context, practiceSetId) ??
    gradeThreeEnglishLowerUnitTestPracticeFor(context, practiceSetId) ??
    gradeFourBnuLowerUnitTestPracticeFor(context, practiceSetId) ??
    gradeFiveBnuUnitTestPracticeFor(context, practiceSetId) ??
    gradeFiveBnuLowerUnitTestPracticeFor(context, practiceSetId) ??
    gradeSixBnuUnitTestPracticeFor(context, practiceSetId) ??
    gradeSixBnuLowerUnitTestPracticeFor(context, practiceSetId) ??
    gradeFourBnuUnitTestPracticeFor(context, practiceSetId) ??
    bnuUnitTestPracticeFor(context, practiceSetId) ??
    englishSyncPracticeFor(context, practiceSetId) ??
    chineseSyncPracticeFor(context, practiceSetId) ??
    chineseLowerSyncPracticeFor(context, practiceSetId)
  )
}

/** Lessons may display the matching unit set; the button navigates to its canonical context. */
export function synchronousPracticeForLesson(context: Context) {
  return (
    gradeFourEnglishUpperUnitTestPracticeForLesson(context) ??
    gradeFiveEnglishLowerUnitTestPracticeForLesson(context) ??
    gradeFiveEnglishUpperUnitTestPracticeForLesson(context) ??
    gradeFourEnglishLowerUnitTestPracticeForLesson(context) ??
    gradeThreeEnglishLowerUnitTestPracticeForLesson(context) ??
    gradeFourBnuLowerUnitTestPracticeForLesson(context) ??
    gradeFiveBnuUnitTestPracticeForLesson(context) ??
    gradeFiveBnuLowerUnitTestPracticeForLesson(context) ??
    gradeSixBnuUnitTestPracticeForLesson(context) ??
    gradeSixBnuLowerUnitTestPracticeForLesson(context) ??
    gradeFourBnuUnitTestPracticeForLesson(context) ??
    bnuUnitTestPracticeForLesson(context) ??
    englishSyncPracticeFor(context) ??
    chineseSyncPracticeForLesson(context) ??
    chineseLowerSyncPracticeForLesson(context)
  )
}

/** Paper-specific scoring boundaries are visible both before launch and during practice. */
export function synchronousPracticeNotice(
  practice: ReturnType<typeof synchronousPracticeFor>,
): string | undefined {
  return practice && 'notice' in practice && typeof practice.notice === 'string'
    ? practice.notice
    : undefined
}
