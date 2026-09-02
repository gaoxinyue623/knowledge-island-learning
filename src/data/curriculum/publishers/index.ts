import type { Publisher } from '@/types'

import type { SampleRecord } from '../types'

export const samplePublishers: SampleRecord<Publisher>[] = [
  {
    id: 'SAMPLE_PUBLISHER_A',
    name: '示例出版社 A',
    shortName: '示例 A',
    officialName: '示例出版社 A（待核验）',
    status: 'DRAFT',
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    needsVerification: true,
    isSample: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_PUBLISHER_B',
    name: '示例出版社 B',
    shortName: '示例 B',
    officialName: '示例出版社 B（待核验）',
    status: 'DRAFT',
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    needsVerification: true,
    isSample: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_PUBLISHER_C',
    name: '示例出版社 C',
    shortName: '示例 C',
    officialName: '示例出版社 C（待核验）',
    status: 'DRAFT',
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    needsVerification: true,
    isSample: true,
    verificationStatus: 'SAMPLE',
  },
]

export const publisherById: ReadonlyMap<string, SampleRecord<Publisher>> = new Map(
  samplePublishers.map((publisher) => [publisher.id, publisher]),
)
