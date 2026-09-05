import type {
  CurriculumBatchManifest,
  CurriculumBatchPackageDescriptor,
  CurriculumBatchSlot,
} from '@/types'

import { batch01SourceManifest } from './source-manifest'

const sharedBlockingSourceGaps = [
  '缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。',
  '缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。',
]

const sharedManualReviewItems = [
  '教材名称、出版社、年级和学期',
  '版本/年份和 ISBN（若有）',
  '目录顺序、Unit 名称和 Lesson 名称',
  '地区适用关系与 SourceReference',
  'KnowledgePoint 定义、去重和 LessonKnowledgePoint 映射',
  'KnowledgeRelation 方向及 prerequisite DAG',
  '人工审核者、审核时间和 review note',
]

const packageDescriptors: readonly CurriculumBatchPackageDescriptor[] = [
  {
    packageId: 'B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE',
    slotId: 'B01-SZ-G1-MATH-S1',
    relativePath: 'src/data/curriculum/batch-01/packages/g1-math-s1.ts',
    status: 'CANDIDATE',
  },
  {
    packageId: 'B01_SZ_G1_MATH_S2_BNUP_2024_CANDIDATE',
    slotId: 'B01-SZ-G1-MATH-S2',
    relativePath: 'src/data/curriculum/batch-01/packages/g1-math-s2.ts',
    status: 'CANDIDATE',
  },
]

function slotFromSource(source: (typeof batch01SourceManifest)[number]): CurriculumBatchSlot {
  const packageDescriptor = packageDescriptors.find((candidate) => candidate.slotId === source.id)
  const textbookIdentityKey =
    source.subject === 'MATH' && source.semester === 1
      ? 'PRI-MAT-BNUP-G1-S1-2024'
      : source.subject === 'MATH' && source.semester === 2
        ? 'PRI-MAT-BNUP-G1-S2-2024'
        : undefined
  const additionalGaps =
    source.subject === 'ENGLISH' && source.semester === 1
      ? ['尚未确认深圳一年级是否存在统一的正式英语教材及对应上册身份。']
      : source.subject === 'CHINESE' && source.semester === 1
        ? ['尚未取得一年级语文上册的学期特定选用和版本身份证据。']
        : ['尚未取得可与候选目录对应的原书版权页和完整目录证据。']
  return {
    id: source.id,
    regionCode: source.regionCode,
    regionName: '深圳市',
    schoolYear: source.schoolYear,
    grade: source.grade,
    semester: source.semester,
    subjectCode: source.subject,
    status: source.selectionStatus,
    sourceManifestEntryId: source.id,
    regionalSelectionStatus: source.regionalSelectionStatus,
    packageId: packageDescriptor?.packageId,
    textbookIdentityKey,
    publisher: source.publisher,
    textbookTitle: source.textbookTitle,
    candidateSeries: source.candidateSeries,
    candidateRevision: source.candidateRevision,
    candidatePublication: source.candidatePublication,
    candidateIsbn: source.candidateIsbn,
    candidateTextbookIdentifier: source.candidateTextbookIdentifier,
    evidenceRequirements: { ...source.evidenceRequirements },
    diagnosticCodes: source.diagnosticCodes ? [...source.diagnosticCodes] : undefined,
    sourceReferenceIds: [...source.sourceReferenceIds],
    blockingSourceGaps: [...sharedBlockingSourceGaps, ...additionalGaps],
    manualReviewItems: [...sharedManualReviewItems],
    notes: source.notes,
  }
}

export const batch01Manifest: CurriculumBatchManifest = {
  id: 'CURRICULUM_DATA_BATCH_01_SZ_G1_2026_2027',
  version: 1,
  title: 'CURRICULUM DATA BATCH 01：深圳小学一年级语文/数学/英语上下册',
  regionCode: 'CN-GD-SZ',
  regionName: '深圳市',
  schoolYear: '2026-2027',
  grade: 1,
  subjects: ['CHINESE', 'MATH', 'ENGLISH'],
  semesters: [1, 2],
  status: 'REQUIRES_MANUAL_REVIEW',
  generatedAt: '2026-09-03T00:00:00+08:00',
  sourceManifestEntryIds: batch01SourceManifest.map((source) => source.id),
  slots: batch01SourceManifest.map(slotFromSource),
  packages: packageDescriptors,
  releaseNote:
    '六个槽位均已给出明确调查状态；只有数学上下册有结构候选包，全部保持 UNVERIFIED，未进入生产选择器。',
}

export { packageDescriptors as batch01PackageDescriptors }
