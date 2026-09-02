import type { Region } from '@/types'

import type { SampleRecord } from '../types'

export const sampleRegions: SampleRecord<Region>[] = [
  {
    id: 'SAMPLE_REGION_A',
    code: 'SAMPLE_A',
    name: '示例地区 A',
    level: 'PROVINCE',
    status: 'ACTIVE',
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_REGION_B',
    code: 'SAMPLE_B',
    name: '示例地区 B',
    level: 'PROVINCE',
    status: 'ACTIVE',
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_REGION_C',
    code: 'SAMPLE_C',
    name: '示例地区 C（暂未支持）',
    level: 'PROVINCE',
    status: 'ACTIVE',
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
  },
]

export const regionById: ReadonlyMap<string, SampleRecord<Region>> = new Map(
  sampleRegions.map((region) => [region.id, region]),
)
