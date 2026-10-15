import { afterEach, describe, expect, it, vi } from 'vitest'
import { selectAccount } from '@/services/account/storage'

const catalog = vi.hoisted(() => ({
  loaded: vi.fn(),
  getTextbook: vi.fn(async (id: string) => ({ id })),
  saveProfile: vi.fn(async () => {
    throw new Error('教材版本不匹配')
  }),
  getMediaAsset: vi.fn(async (id: string) => ({ id })),
}))
vi.mock('@/services/runtimeCatalog', () => {
  catalog.loaded()
  return {
    curriculumService: {
      getTextbook: catalog.getTextbook,
      saveCurriculumProfile: catalog.saveProfile,
    },
    contentService: { getMediaAsset: catalog.getMediaAsset },
  }
})

afterEach(() => {
  selectAccount(null)
  localStorage.clear()
})

describe('deferred runtime curriculum', () => {
  it('reads isolated profiles without loading textbooks and shares the catalog on demand', async () => {
    const { curriculumService, contentService, studentService } = await import('@/services/runtime')
    selectAccount('lazy_parent_one')
    const profile = {
      studentId: 'lazy-child',
      gradeId: 'GRADE_2',
      semesterId: 'SEMESTER_LOWER',
      chineseTextbookVersionId: 'CHINESE_BOOK',
      mathTextbookVersionId: null,
      englishTextbookVersionId: null,
      confirmedAt: '2026-10-15T00:00:00.000Z',
      source: 'USER_CONFIRMED' as const,
    }
    await studentService.saveCurriculumProfile(profile)
    expect(await curriculumService.getCurriculumProfile('lazy-child')).toEqual(profile)
    selectAccount('lazy_parent_two')
    expect(await curriculumService.getCurriculumProfile('lazy-child')).toBeNull()
    expect(catalog.loaded).not.toHaveBeenCalled()

    const results = await Promise.all([
      curriculumService.getTextbook('BOOK_ONE'),
      curriculumService.getTextbook('BOOK_TWO'),
      contentService.getMediaAsset('PICTURE'),
    ])
    expect(results).toEqual([{ id: 'BOOK_ONE' }, { id: 'BOOK_TWO' }, { id: 'PICTURE' }])
    expect(catalog.loaded).toHaveBeenCalledOnce()
    await expect(curriculumService.saveCurriculumProfile(profile)).rejects.toThrow('教材版本不匹配')
    expect(catalog.saveProfile).toHaveBeenCalledWith(profile)
  })
})
