import type { Subject } from '@/types'

export const sampleSubjects: Subject[] = [
  {
    id: 'SAMPLE_SUBJECT_CHINESE',
    code: 'CHINESE',
    name: '语文',
    themeKey: 'CHINESE',
    status: 'ACTIVE',
  },
  {
    id: 'SAMPLE_SUBJECT_MATH',
    code: 'MATH',
    name: '数学',
    themeKey: 'MATH',
    status: 'ACTIVE',
  },
  {
    id: 'SAMPLE_SUBJECT_ENGLISH',
    code: 'ENGLISH',
    name: '英语',
    themeKey: 'ENGLISH',
    status: 'ACTIVE',
  },
]

export const subjectById: ReadonlyMap<string, Subject> = new Map(
  sampleSubjects.map((subject) => [subject.id, subject]),
)

export const subjectByCode = new Map(sampleSubjects.map((subject) => [subject.code, subject]))
