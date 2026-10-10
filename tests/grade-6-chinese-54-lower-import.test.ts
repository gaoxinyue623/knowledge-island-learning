import { describe, it, expect } from 'vitest'
import { productionCurriculumData as catalog } from '@/data/curriculum/production'
import { curriculumService } from '@/services/runtime'

describe('retired five-four-system grade six textbook', () => {
  it('removes the book, lessons, points, questions and sources from production', () => {
    for (const items of [
      catalog.textbooks,
      catalog.units,
      catalog.lessons,
      catalog.knowledgePoints,
      catalog.courseContents,
      catalog.questions,
      catalog.sources,
    ]) {
      expect(items.some((item) => item.id.startsWith('G6_PEP_54_CHINESE'))).toBe(false)
    }
  })
  it('does not offer the retired book to accounts', async () => {
    const result = await curriculumService.resolveAvailableTextbooks({
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_LOWER',
      regionId: 'unlisted',
    })
    expect(result.chinese.availableTextbooks.map((book) => book.id)).not.toContain(
      'G6_PEP_54_CHINESE_2024_S2_USER_IMPORTED',
    )
    expect(result.chinese.availableTextbooks.map((book) => book.id)).toContain(
      'G6_PEP_CHINESE_2019_S2_USER_IMPORTED',
    )
  })
})
