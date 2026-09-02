import type { SampleContentSource } from '../types'

export const sampleSource: SampleContentSource = {
  id: 'SAMPLE_SOURCE_UNVERIFIED',
  sourceType: 'TEACHER_CREATED',
  title: '示例来源（未核验）',
  sourceRef: 'sample://unverified',
  sourceVersion: 'SAMPLE_1',
  copyrightStatus: 'PENDING',
  license: '仅限本地开发占位使用，待核验',
  notes: '不是教材事实来源，不能用于发布。',
  isSample: true,
  needsVerification: true,
  verificationStatus: 'SAMPLE',
}

export const sampleSources: SampleContentSource[] = [sampleSource]

export const sourceById: ReadonlyMap<string, SampleContentSource> = new Map(
  sampleSources.map((source) => [source.id, source]),
)
