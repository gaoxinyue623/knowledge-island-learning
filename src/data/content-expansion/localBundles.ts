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
])
