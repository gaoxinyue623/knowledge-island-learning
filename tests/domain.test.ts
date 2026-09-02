import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { subjectTheme } from '@/data/subjectTheme'
import { useCurriculumStore } from '@/stores/curriculumStore'

describe('subjectTheme', () => {
  it('defines one shared theme contract for all three subjects', () => {
    expect(Object.keys(subjectTheme)).toEqual(['CHINESE', 'MATH', 'ENGLISH'])
    expect(subjectTheme.MATH.sceneKey).toBe('calculation-factory')
    expect(subjectTheme.CHINESE.icon).toBe('book-open')
    expect(subjectTheme.ENGLISH.softColor).toBe('var(--color-subject-english-soft)')
  })
})

describe('curriculumStore', () => {
  it('keeps three subject textbook choices separate', () => {
    setActivePinia(createPinia())
    const store = useCurriculumStore()

    store.setProfile({
      studentId: 'student-1',
      regionId: 'region-1',
      gradeId: 'grade-3',
      semesterId: 'semester-upper',
      chineseTextbookVersionId: 'textbook-chinese',
      mathTextbookVersionId: 'textbook-math',
      englishTextbookVersionId: 'textbook-english',
      confirmedAt: '2026-09-02T00:00:00+08:00',
      source: 'USER_CONFIRMED',
    })

    expect(store.isComplete).toBe(true)
    expect(store.mathTextbookVersionId).toBe('textbook-math')
    expect(store.chineseTextbookVersionId).not.toBe(store.mathTextbookVersionId)
    expect(store.englishTextbookVersionId).toBe('textbook-english')
  })
})
