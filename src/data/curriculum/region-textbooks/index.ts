import type { RegionTextbookRelation } from '@/types'

import type { SampleRecord } from '../types'

const relation = (
  id: string,
  regionId: string,
  textbookVersionId: string,
  usageType: RegionTextbookRelation['usageType'],
): SampleRecord<RegionTextbookRelation> => ({
  id,
  regionId,
  textbookVersionId,
  usageType,
  effectiveFrom: '2020-01-01',
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  status: 'DRAFT',
  needsVerification: true,
  isSample: true,
  verificationStatus: 'SAMPLE',
})

/**
 * The four scenarios are intentional test fixtures, not real regional
 * mappings. Region A has one default per subject; B has ambiguity; C has no
 * relations so the UI can exercise unsupported and not-available states.
 */
export const sampleRegionTextbookRelations: SampleRecord<RegionTextbookRelation>[] = [
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_A_CHINESE',
    'SAMPLE_REGION_A',
    'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A',
    'DEFAULT',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_A_MATH',
    'SAMPLE_REGION_A',
    'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A',
    'DEFAULT',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_A_ENGLISH',
    'SAMPLE_REGION_A',
    'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A',
    'DEFAULT',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_B_CHINESE',
    'SAMPLE_REGION_B',
    'SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_B',
    'DEFAULT',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_B_MATH_DEFAULT',
    'SAMPLE_REGION_B',
    'SAMPLE_MATH_TEXTBOOK_G3_UPPER_A',
    'DEFAULT',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_B_MATH_OPTIONAL',
    'SAMPLE_REGION_B',
    'SAMPLE_MATH_TEXTBOOK_G3_UPPER_B',
    'OPTIONAL',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_B_ENGLISH_SUPPORTED_A',
    'SAMPLE_REGION_B',
    'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A',
    'SUPPORTED',
  ),
  relation(
    'SAMPLE_REGION_TEXTBOOK_RELATION_B_ENGLISH_SUPPORTED_B',
    'SAMPLE_REGION_B',
    'SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_B',
    'SUPPORTED',
  ),
]

export const regionTextbookRelationsByRegionId = new Map<
  string,
  SampleRecord<RegionTextbookRelation>[]
>()
for (const relationRecord of sampleRegionTextbookRelations) {
  const records = regionTextbookRelationsByRegionId.get(relationRecord.regionId) ?? []
  records.push(relationRecord)
  regionTextbookRelationsByRegionId.set(relationRecord.regionId, records)
}
