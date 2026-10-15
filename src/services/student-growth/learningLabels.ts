import { productionCurriculumIndex } from '@/data/curriculum/production'
import { subjectTheme } from '@/data/subjectTheme'

export function knowledgeLabel(knowledgePointId: string): string {
  return (
    productionCurriculumIndex.knowledgePoints.find((item) => item.id === knowledgePointId)?.name ??
    '原课程知识点'
  )
}
export function courseLabel(context: {
  lessonId?: string
  unitId?: string
  knowledgePointIds?: string[]
}): string {
  const lesson = productionCurriculumIndex.lessons.find((item) => item.id === context.lessonId)
  const unit = productionCurriculumIndex.units.find(
    (item) => item.id === (context.unitId ?? lesson?.unitId),
  )
  const textbook = productionCurriculumIndex.textbooks.find(
    (item) => item.id === unit?.textbookVersionId,
  )
  const subject = productionCurriculumIndex.subjects.find((item) => item.id === textbook?.subjectId)
  return (
    [
      subject ? subjectTheme[subject.code].label : '',
      unit?.title,
      lesson?.title ?? context.knowledgePointIds?.map(knowledgeLabel).join('、'),
    ]
      .filter(Boolean)
      .join(' → ') || '回到原课程练习'
  )
}
