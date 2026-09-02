import type { IconName, SubjectCode } from '@/types'

export interface SubjectTheme {
  code: SubjectCode
  label: string
  color: string
  softColor: string
  icon: IconName
  sceneKey: string
}

export const subjectTheme: Record<SubjectCode, SubjectTheme> = {
  CHINESE: {
    code: 'CHINESE',
    label: '语文',
    color: 'var(--color-subject-chinese)',
    softColor: 'var(--color-subject-chinese-soft)',
    icon: 'book-open',
    sceneKey: 'story-forest',
  },
  MATH: {
    code: 'MATH',
    label: '数学',
    color: 'var(--color-subject-math)',
    softColor: 'var(--color-subject-math-soft)',
    icon: 'route',
    sceneKey: 'calculation-factory',
  },
  ENGLISH: {
    code: 'ENGLISH',
    label: '英语',
    color: 'var(--color-subject-english)',
    softColor: 'var(--color-subject-english-soft)',
    icon: 'navigation',
    sceneKey: 'language-harbor',
  },
}
