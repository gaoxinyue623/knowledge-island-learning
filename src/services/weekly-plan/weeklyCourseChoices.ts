import { productionCurriculumIndex } from '@/data/curriculum/production'
import type { DailyLearningTask, SubjectHomeSummary } from '@/types'

/** Offer actual current courses from the selected textbooks; choosing one creates no learning fact. */
export function weeklyCourseChoices(
  profileId: string,
  dateKey: string,
  subjects: readonly SubjectHomeSummary[],
): DailyLearningTask[] {
  return subjects.flatMap((subject) => {
    if (!subject.textbookId || !subject.currentKnowledgePointTitle) return []
    const units = productionCurriculumIndex.units.filter(
      (unit) => unit.textbookVersionId === subject.textbookId,
    )
    const lessons = productionCurriculumIndex.lessons.filter((lesson) =>
      units.some((unit) => unit.id === lesson.unitId),
    )
    const relation = productionCurriculumIndex.lessonKnowledgePointRelations.find(
      (relation) =>
        lessons.some((lesson) => lesson.id === relation.lessonId) &&
        productionCurriculumIndex.knowledgePoints.some(
          (point) =>
            point.id === relation.knowledgePointId &&
            point.name === subject.currentKnowledgePointTitle,
        ),
    )
    const lesson = lessons.find((lesson) => lesson.id === relation?.lessonId)
    if (!relation || !lesson) return []
    const id = `weekly-choice:${profileId}:${dateKey}:${relation.knowledgePointId}`
    return [
      {
        id,
        profileId,
        type: 'next_learning',
        subject: subject.code,
        textbookId: subject.textbookId,
        knowledgePointId: relation.knowledgePointId,
        lessonId: lesson.id,
        sourceId: id,
        title: `${subject.label}：${lesson.title}`,
        description: '从当前教材继续学习，完成后按实际记录更新计划。',
        status: 'pending',
        priority: 100,
        action: {
          type: 'lesson',
          launchContext: {
            textbookId: subject.textbookId,
            unitId: lesson.unitId,
            lessonId: lesson.id,
            knowledgePointId: relation.knowledgePointId,
          },
        },
      } satisfies DailyLearningTask,
    ]
  })
}
