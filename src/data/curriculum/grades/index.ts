import type { Grade } from '@/types'

export const sampleGrades: Grade[] = Array.from({ length: 6 }, (_, index) => {
  const grade = index + 1
  return {
    id: `SAMPLE_GRADE_${grade}`,
    code: `G${grade}`,
    name: `${grade}年级`,
    sortOrder: grade,
    status: 'ACTIVE',
  }
})

export const gradeById: ReadonlyMap<string, Grade> = new Map(
  sampleGrades.map((grade) => [grade.id, grade]),
)
