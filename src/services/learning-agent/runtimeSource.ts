import type { LearningAgentSource, LearningAgentSnapshot } from '@/types/learning-agent'
import { curriculumService } from '@/services/runtime'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { masteryRepository } from '@/services/mastery/masteryRepository'
import { homeQuestionSessionReader } from '@/services/home/homeSessionReaders'
import { wrongBookRepository } from '@/services/wrong-book/wrongBookRepository'
import { reviewQueueRepository } from '@/services/review-queue/reviewQueueRepository'
import { learningHistoryRepository } from '@/services/learning-history/learningHistoryRepository'
import { dailyPlanStorage } from '@/services/home/dailyPlanStorage'
import { createLearningMapProgressStorage } from '@/services/learning-map/learningMapStorage'
import { contentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'

export class RuntimeLearningAgentSource implements LearningAgentSource {
  async load(profileId: string, textbookId: string): Promise<LearningAgentSnapshot> {
    const profile = await curriculumService.getCurriculumProfile(profileId)
    const textbook = await curriculumService.getTextbook(textbookId)
    if (!profile || profile.studentId !== profileId || !textbook)
      throw new Error('AGENT_PROFILE_NOT_FOUND')
    const [grades, semesters, subjects, publisher, units, bundles] = await Promise.all([
      curriculumService.getGrades(),
      curriculumService.getSemesters(),
      curriculumService.getSubjects(),
      curriculumService.getPublisher(textbook.publisherId),
      curriculumService.getUnitsByTextbookVersion(textbookId),
      contentExpansionRepository.listBundles('profile'),
    ])
    const grade = grades.find((g) => g.id === textbook.gradeId),
      semester = semesters.find((s) => s.id === textbook.semesterId),
      subject = subjects.find((s) => s.id === textbook.subjectId)
    if (!grade || !semester || !subject || !publisher) throw new Error('AGENT_CATALOG_INCOMPLETE')
    const lessons = (
      await Promise.all(units.map((u) => curriculumService.getLessonsByUnit(u.id)))
    ).flat()
    const points = (
      await Promise.all(lessons.map((l) => curriculumService.getKnowledgePointsByLesson(l.id)))
    ).flat()
    const knowledgePoints = [...new Map(points.map((k) => [k.id, k])).values()]
    const ids = new Set(knowledgePoints.map((k) => k.id)),
      lessonIds = new Set(lessons.map((l) => l.id))
    return {
      profile,
      dataset: 'profile',
      curriculum: {
        textbook,
        grade,
        semester,
        subject,
        publisher,
        units,
        lessons,
        knowledgePoints,
        lessonKnowledgePoints: productionCurriculumIndex.lessonKnowledgePointRelations.filter((r) =>
          lessonIds.has(r.lessonId),
        ),
        knowledgePrerequisites: productionCurriculumIndex.knowledgePrerequisites.filter(
          (r) => ids.has(r.prerequisiteKnowledgePointId) && ids.has(r.dependentKnowledgePointId),
        ),
      },
      regionTextbookRelations: [...productionCurriculumIndex.regionTextbookRelations],
      masteryRecords: masteryRepository.getMasteryRecords(profileId),
      evidence: masteryRepository.getEvidence(profileId),
      sessions: homeQuestionSessionReader
        .listByProfile(profileId)
        .filter(
          (s) => s.id.startsWith(`question-session:${profileId}:`) && s.textbookId === textbookId,
        ),
      questions: [...productionCurriculumIndex.questions],
      mappings: [...productionCurriculumIndex.questionKnowledgePoints],
      wrongBook: wrongBookRepository.listByTextbook(profileId, textbookId),
      reviewQueue: reviewQueueRepository.listByTextbook(profileId, textbookId),
      history: learningHistoryRepository.listByTextbook(profileId, textbookId),
      dailyPlan:
        dailyPlanStorage
          .loadAll()
          .filter(
            (p) =>
              p.profileId === profileId &&
              p.dataset === 'profile' &&
              Object.values(p.textbookIds).includes(textbookId),
          )
          .sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0] ?? null,
      progress: createLearningMapProgressStorage().load(textbookId, {
        profileId,
        dataset: 'profile',
      }),
      templates: bundles
        .flatMap((b) => b.exerciseTemplates)
        .filter((t) => ids.has(t.knowledgePointId)),
    }
  }
}
