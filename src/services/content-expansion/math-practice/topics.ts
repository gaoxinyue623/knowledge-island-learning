import { bnuMathLowerLessons } from '@/data/curriculum/grade-2/bnu-lower'
import { gradeThreeBnuMathLessons } from '@/data/curriculum/grade-3/math-bnu-upper-2022'
import { gradeThreeBnuMathLowerLessons } from '@/data/curriculum/grade-3/math-bnu-lower-2022'
import { gradeFourBnuMathLessons } from '@/data/curriculum/grade-4/math-bnu-upper-2022'
import { gradeFourBnuMathLowerLessons } from '@/data/curriculum/grade-4/math-bnu-lower'
import { gradeFiveBnuMathLessons } from '@/data/curriculum/grade-5/math-bnu-upper'
import { gradeFiveBnuMathLowerLessons } from '@/data/curriculum/grade-5/math-bnu-lower-2013'
import { gradeSixBnuMathLessons } from '@/data/curriculum/grade-6/math-bnu-upper-2022'
import { gradeSixBnuMathLowerLessons } from '@/data/curriculum/grade-6/math-bnu-lower-2013'

// Only these lesson definitions had three authored questions and no fresh review pool.
export const mathPracticeTopics = new Map(
  [
    ...bnuMathLowerLessons,
    ...gradeThreeBnuMathLessons,
    ...gradeThreeBnuMathLowerLessons,
    ...gradeFourBnuMathLessons,
    ...gradeFourBnuMathLowerLessons,
    ...gradeFiveBnuMathLessons,
    ...gradeFiveBnuMathLowerLessons,
    ...gradeSixBnuMathLessons,
    ...gradeSixBnuMathLowerLessons,
  ].map((lesson) => [lesson.knowledgePointId, lesson]),
)
