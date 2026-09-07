import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveProductionConfig } from '@/config/production'
import { curriculumData, G1_SHENZHEN_REGION_ID } from '@/data/curriculum'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { curriculumService } from '@/services/runtime'

afterEach(() => vi.useRealTimers())

describe('onboarding runtime curriculum', () => {
  it('exposes imported Shenzhen textbooks through the default runtime service', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-05T12:00:00+08:00'))
    expect(await curriculumService.getRegions()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: G1_SHENZHEN_REGION_ID })]),
    )
    const relations = curriculumData.regionTextbookRelations.filter(
      (relation) => relation.regionId === G1_SHENZHEN_REGION_ID,
    )
    expect(relations.length).toBeGreaterThan(0)
    for (const relation of relations) {
      const textbook = curriculumData.textbooks.find(
        (book) => book.id === relation.textbookVersionId,
      )!
      const result = await curriculumService.resolveAvailableTextbooks({
        regionId: G1_SHENZHEN_REGION_ID,
        gradeId: textbook.gradeId,
        semesterId: textbook.semesterId,
      })
      expect(Object.values(result).flatMap((subject) => subject.availableTextbooks)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: textbook.id })]),
      )
      expect(await curriculumService.getTextbookDisplay(textbook.id)).toMatchObject({
        textbook: { id: textbook.id },
      })
    }
  })

  it.each([
    { isProduction: false, environment: { VITE_ALLOW_UNREVIEWED_CURRICULUM: 'false' } },
    { isProduction: true, environment: { VITE_ALLOW_UNREVIEWED_CURRICULUM: 'true' } },
  ])('keeps candidate curriculum hidden when access is disabled: %j', async (input) => {
    const service = new MockCurriculumService({ accessPolicy: resolveProductionConfig(input) })
    expect(await service.getRegions()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: G1_SHENZHEN_REGION_ID })]),
    )
    const relation = curriculumData.regionTextbookRelations.find(
      (entry) => entry.regionId === G1_SHENZHEN_REGION_ID,
    )!
    expect(await service.getTextbookDisplay(relation.textbookVersionId)).toBeNull()
  })
})
