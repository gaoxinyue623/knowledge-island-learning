import { gradeSixEnglishLowerBundles } from '../curriculum/grade-6/english-shanghai-lower'
import { gradeSixEnglishUpperBundles } from '../curriculum/grade-6/english-shanghai-upper-2022'
import { gradeFourEnglishUpperUnitTestBundles } from '../curriculum/grade-4/english-shanghai-upper-2022/unit-tests'
import { gradeFiveEnglishLowerUnitTestBundles } from '../curriculum/grade-5/english-shanghai-lower/unit-tests'
import { gradeFiveEnglishUpperUnitTestBundles } from '../curriculum/grade-5/english-shanghai-upper-2022/unit-tests'
import { gradeFourEnglishLowerUnitTestBundles } from '../curriculum/grade-4/english-shanghai-lower-2022/unit-tests'
import { gradeThreeEnglishLowerUnitTestBundles } from '../curriculum/grade-3/english-shanghai-lower-2022/unit-tests'
import { gradeThreeEnglishUpperBundles } from '../curriculum/grade-3/english-shanghai-upper-2022'
import { gradeSixBnuLowerUnitTestBundles } from '../curriculum/grade-6/math-bnu-lower-2013/unit-tests'
import { gradeSixBnuUnitTestBundles } from '../curriculum/grade-6/math-bnu-upper-2022/unit-tests'
import { gradeFiveBnuLowerUnitTestBundles } from '../curriculum/grade-5/math-bnu-lower-2013/unit-tests'
import { gradeFiveBnuUnitTestBundles } from '../curriculum/grade-5/math-bnu-upper/unit-tests'
import { gradeFourBnuLowerUnitTestBundles } from '../curriculum/grade-4/math-bnu-lower/unit-tests'
import { gradeFourBnuUnitTestBundles } from '../curriculum/grade-4/math-bnu-upper-2022/unit-tests'
import { bnuUnitTestBundles } from '../curriculum/grade-3/bnu-unit-tests'
import { gradeSixChinese2019LowerBundles } from '../curriculum/grade-6/chinese-pep-lower-2019'
import { gradeFiveChineseLowerBundles } from '../curriculum/grade-5/chinese-pep-lower'
import { gradeFiveChineseBundles } from '../curriculum/grade-5/chinese-pep-upper'
import { gradeSixChineseBundles } from '../curriculum/grade-6/chinese-pep-upper'
import { gradeSixChinese2019Bundles } from '../curriculum/grade-6/chinese-pep-upper-2019'
import { gradeFourChineseLowerBundles } from '../curriculum/grade-4/chinese-pep-lower'
import { gradeFourChineseBundles } from '../curriculum/grade-4/chinese-pep-upper'
import { gradeThreeChineseLowerSyncBundles } from '../curriculum/grade-3/chinese-pep-lower/synchronousExercises'
import { gradeThreeChineseSyncBundles } from '../curriculum/grade-3/chinese-pep-upper/synchronousExercises'
import { approveLocalRecords } from '../curriculum/localApproval'
import { candidateContentExpansionBundles } from './g1-chinese'
import { candidateLowerChineseContentExpansionBundles } from './g1-chinese-lower'
import { candidateG2ChineseContentExpansionBundles } from './g2-chinese-upper'
import { candidateG2ChineseLowerContentExpansionBundles } from './g2-chinese-lower'
import { candidateRevisedChineseLowerBundles } from './g2-chinese-lower-revised'
import { candidateG1ShenzhenEnglishContentExpansionBundles } from './g1-shenzhen-english-upper'
import { candidateG1ShenzhenEnglishLowerContentExpansionBundles } from './g1-shenzhen-english-lower'
import { candidateG2ShenzhenEnglishUpperContentExpansionBundles } from './g2-shenzhen-english-upper'
import { candidateG2ShenzhenMathUpperContentExpansionBundles } from './g2-shenzhen-math-upper'
import { candidateG1ShenzhenMathUpperContentExpansionBundles } from './g1-shenzhen-math-upper'
import { candidateG1ShenzhenMathLowerContentExpansionBundles } from './g1-shenzhen-math-lower'
import { shenzhenEnglishLowerSyncBundles } from '../curriculum/grade-2/shenzhen-english-lower/synchronousExercises'
import { bnuMathLowerBundles } from '../curriculum/grade-2/bnu-lower'

export const approvedLocalBundles = approveLocalRecords([
  ...candidateContentExpansionBundles,
  ...candidateLowerChineseContentExpansionBundles,
  ...candidateG2ChineseContentExpansionBundles,
  ...candidateG2ChineseLowerContentExpansionBundles,
  ...candidateRevisedChineseLowerBundles,
  ...candidateG1ShenzhenEnglishContentExpansionBundles,
  ...candidateG1ShenzhenEnglishLowerContentExpansionBundles,
  ...candidateG2ShenzhenEnglishUpperContentExpansionBundles,
  ...candidateG2ShenzhenMathUpperContentExpansionBundles,
  ...candidateG1ShenzhenMathUpperContentExpansionBundles,
  ...candidateG1ShenzhenMathLowerContentExpansionBundles,
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
])
