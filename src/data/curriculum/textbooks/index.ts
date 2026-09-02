import type { TextbookVersion } from '@/types'

import type { SampleRecord } from '../types'

const sampleTextbook = (
  id: string,
  subjectId: string,
  publisherId: string,
  versionName: string,
): SampleRecord<TextbookVersion> => ({
  id,
  subjectId,
  gradeId: 'SAMPLE_GRADE_3',
  semesterId: 'SAMPLE_SEMESTER_UPPER',
  publisherId,
  versionName,
  editionYear: '待核验',
  curriculumStandard: 'SAMPLE_CURRICULUM_STANDARD',
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  status: 'DRAFT',
  needsVerification: true,
  createdAt: '2026-09-02T00:00:00+08:00',
  updatedAt: '2026-09-02T00:00:00+08:00',
  isSample: true,
  verificationStatus: 'SAMPLE',
})

export const sampleTextbooks: SampleRecord<TextbookVersion>[] = [
  sampleTextbook(
    'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A',
    'SAMPLE_SUBJECT_CHINESE',
    'SAMPLE_PUBLISHER_A',
    '示例语文版本 A（待核验）',
  ),
  sampleTextbook(
    'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_B',
    'SAMPLE_SUBJECT_CHINESE',
    'SAMPLE_PUBLISHER_B',
    '示例语文版本 B（待核验）',
  ),
  sampleTextbook(
    'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A',
    'SAMPLE_SUBJECT_MATH',
    'SAMPLE_PUBLISHER_A',
    '示例数学版本 A（待核验）',
  ),
  sampleTextbook(
    'SAMPLE_MATH_TEXTBOOK_G3_UPPER_B',
    'SAMPLE_SUBJECT_MATH',
    'SAMPLE_PUBLISHER_B',
    '示例数学版本 B（待核验）',
  ),
  sampleTextbook(
    'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A',
    'SAMPLE_SUBJECT_ENGLISH',
    'SAMPLE_PUBLISHER_C',
    '示例英语版本 A（待核验）',
  ),
  sampleTextbook(
    'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_B',
    'SAMPLE_SUBJECT_ENGLISH',
    'SAMPLE_PUBLISHER_A',
    '示例英语版本 B（待核验）',
  ),
]

export const textbookById: ReadonlyMap<string, SampleRecord<TextbookVersion>> = new Map(
  sampleTextbooks.map((textbook) => [textbook.id, textbook]),
)
