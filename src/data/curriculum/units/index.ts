import type { Unit } from '@/types'

import type { SampleRecord } from '../types'

export const sampleUnits: SampleRecord<Unit>[] = [
  {
    id: 'SAMPLE_CHINESE_UNIT',
    textbookVersionId: 'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A',
    code: 'SAMPLE_CHINESE_UNIT_01',
    title: '示例语文单元 01（待教材确认）',
    sortOrder: 1,
    sceneKey: 'sample-story-world',
    status: 'DRAFT',
    needsVerification: true,
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    isSample: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_MATH_UNIT',
    textbookVersionId: 'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A',
    code: 'SAMPLE_MATH_UNIT_01',
    title: '示例数学单元 01（待教材确认）',
    sortOrder: 1,
    sceneKey: 'sample-math-world',
    status: 'DRAFT',
    needsVerification: true,
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    isSample: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_ENGLISH_UNIT',
    textbookVersionId: 'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A',
    code: 'SAMPLE_ENGLISH_UNIT_01',
    title: '示例英语单元 01（待教材确认）',
    sortOrder: 1,
    sceneKey: 'sample-english-world',
    status: 'DRAFT',
    needsVerification: true,
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    isSample: true,
    verificationStatus: 'SAMPLE',
  },
]

export const unitById: ReadonlyMap<string, SampleRecord<Unit>> = new Map(
  sampleUnits.map((unit) => [unit.id, unit]),
)
