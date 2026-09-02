import type { Lesson } from '@/types'

import type { SampleRecord } from '../types'

const lesson = (id: string, unitId: string, subject: string, sortOrder: number) => ({
  id,
  unitId,
  code: `${subject}_LESSON_${String(sortOrder).padStart(2, '0')}`,
  title: `示例${subject}课次 ${String(sortOrder).padStart(2, '0')}（待命名）`,
  sortOrder,
  status: 'DRAFT' as const,
  needsVerification: true as const,
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  isSample: true as const,
  verificationStatus: 'SAMPLE' as const,
})

export const sampleLessons: SampleRecord<Lesson>[] = [
  lesson('SAMPLE_CHINESE_LESSON_01', 'SAMPLE_CHINESE_UNIT', '语文', 1),
  lesson('SAMPLE_CHINESE_LESSON_02', 'SAMPLE_CHINESE_UNIT', '语文', 2),
  lesson('SAMPLE_CHINESE_LESSON_03', 'SAMPLE_CHINESE_UNIT', '语文', 3),
  lesson('SAMPLE_MATH_LESSON_01', 'SAMPLE_MATH_UNIT', '数学', 1),
  lesson('SAMPLE_MATH_LESSON_02', 'SAMPLE_MATH_UNIT', '数学', 2),
  lesson('SAMPLE_MATH_LESSON_03', 'SAMPLE_MATH_UNIT', '数学', 3),
  lesson('SAMPLE_ENGLISH_LESSON_01', 'SAMPLE_ENGLISH_UNIT', '英语', 1),
  lesson('SAMPLE_ENGLISH_LESSON_02', 'SAMPLE_ENGLISH_UNIT', '英语', 2),
  lesson('SAMPLE_ENGLISH_LESSON_03', 'SAMPLE_ENGLISH_UNIT', '英语', 3),
]

export const lessonById: ReadonlyMap<string, SampleRecord<Lesson>> = new Map(
  sampleLessons.map((lessonRecord) => [lessonRecord.id, lessonRecord]),
)
