import type { Semester } from '@/types'

export const sampleSemesters: Semester[] = [
  {
    id: 'SAMPLE_SEMESTER_UPPER',
    code: 'UPPER',
    name: '上册',
    sortOrder: 1,
    status: 'ACTIVE',
  },
  {
    id: 'SAMPLE_SEMESTER_LOWER',
    code: 'LOWER',
    name: '下册',
    sortOrder: 2,
    status: 'ACTIVE',
  },
]

export const semesterById: ReadonlyMap<string, Semester> = new Map(
  sampleSemesters.map((semester) => [semester.id, semester]),
)
