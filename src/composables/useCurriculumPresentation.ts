import { curriculumService } from '@/services'
import type { Id, StudentCurriculumProfile, SubjectCode, TextbookDisplay } from '@/types'

export interface CurriculumPresentation {
  gradeName: string
  semesterName: string
  textbooks: Record<SubjectCode, TextbookDisplay | null>
}

const textbookIdsBySubject = (
  profile: StudentCurriculumProfile,
): Record<SubjectCode, Id | null> => ({
  CHINESE: profile.chineseTextbookVersionId,
  MATH: profile.mathTextbookVersionId,
  ENGLISH: profile.englishTextbookVersionId,
})

export async function getCurriculumPresentation(
  profile: StudentCurriculumProfile,
): Promise<CurriculumPresentation> {
  const [grades, semesters, ...displays] = await Promise.all([
    curriculumService.getGrades(),
    curriculumService.getSemesters(),
    ...Object.values(textbookIdsBySubject(profile)).map((textbookId) =>
      textbookId ? curriculumService.getTextbookDisplay(textbookId) : Promise.resolve(null),
    ),
  ])

  const textbookValues = displays as Array<TextbookDisplay | null>
  return {
    gradeName: grades.find((grade) => grade.id === profile.gradeId)?.name ?? '年级待确认',
    semesterName:
      semesters.find((semester) => semester.id === profile.semesterId)?.name ?? '学期待确认',
    textbooks: {
      CHINESE: textbookValues[0] ?? null,
      MATH: textbookValues[1] ?? null,
      ENGLISH: textbookValues[2] ?? null,
    },
  }
}
