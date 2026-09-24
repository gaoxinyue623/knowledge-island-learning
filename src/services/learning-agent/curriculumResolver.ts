import type { LearningAgentSnapshot, AgentCurriculumContext } from '@/types/learning-agent'
import { isCurriculumRecordReadable } from '@/services/curriculum/accessPolicy'
import { productionConfig } from '@/config/production'

/** Validate the full context before inspecting learning facts or invoking providers. */
export class CurriculumResolver {
  resolve(
    snapshot: LearningAgentSnapshot,
    profileId: string,
    textbookId: string,
    now: string,
  ): AgentCurriculumContext {
    const { profile, curriculum: c } = snapshot
    if (snapshot.dataset === 'demo' && !productionConfig.devRoutes)
      throw new Error('AGENT_DEMO_DISABLED')
    const policy = {
      allowSampleCurriculum: snapshot.dataset === 'demo',
      allowUnreviewedCurriculum: snapshot.dataset === 'demo',
    }
    const selected = {
      CHINESE: profile.chineseTextbookVersionId,
      MATH: profile.mathTextbookVersionId,
      ENGLISH: profile.englishTextbookVersionId,
    }[c.subject.code]
    if (
      !profileId ||
      profile.studentId !== profileId ||
      !profile.confirmedAt ||
      !profile.regionId ||
      selected !== textbookId ||
      c.textbook.id !== textbookId ||
      profile.gradeId !== c.textbook.gradeId ||
      profile.semesterId !== c.textbook.semesterId ||
      c.grade.id !== profile.gradeId ||
      c.semester.id !== profile.semesterId ||
      c.subject.id !== c.textbook.subjectId ||
      c.publisher?.id !== c.textbook.publisherId
    )
      throw new Error('AGENT_CURRICULUM_CONTEXT_MISMATCH')
    const relation = snapshot.regionTextbookRelations.find(
      (r) =>
        // Formal profiles explicitly select any released textbook in onboarding.
        // Region is personal context, not a restriction on that selection.
        (snapshot.dataset === 'profile' || r.regionId === profile.regionId) &&
        r.textbookVersionId === textbookId &&
        r.effectiveFrom <= now.slice(0, 10) &&
        (!r.effectiveTo || r.effectiveTo >= now.slice(0, 10)) &&
        isCurriculumRecordReadable(r, policy),
    )
    if (!relation || !isCurriculumRecordReadable(c.textbook, policy))
      throw new Error('AGENT_CURRICULUM_GUARD')
    if ([c.grade, c.semester, c.subject, c.publisher!].some((r) => r.status !== 'ACTIVE'))
      throw new Error('AGENT_CATALOG_INACTIVE')
    for (const record of [
      ...c.units,
      ...c.lessons,
      ...c.knowledgePoints,
      ...c.lessonKnowledgePoints,
    ]) {
      if (!isCurriculumRecordReadable(record, policy)) throw new Error('AGENT_CURRICULUM_GUARD')
    }
    const units = new Set(c.units.map((r) => r.id)),
      lessons = new Set(c.lessons.map((r) => r.id)),
      points = new Set(c.knowledgePoints.map((r) => r.id))
    if (
      !points.size ||
      c.units.some((r) => r.textbookVersionId !== textbookId) ||
      c.lessons.some((r) => !units.has(r.unitId)) ||
      c.knowledgePoints.some(
        (r) =>
          r.subjectId !== c.subject.id ||
          c.grade.sortOrder < r.gradeScope.minGrade ||
          c.grade.sortOrder > r.gradeScope.maxGrade ||
          (r.gradeScope.explicitGradeIds && !r.gradeScope.explicitGradeIds.includes(c.grade.id)),
      ) ||
      c.lessonKnowledgePoints.some(
        (r) => !lessons.has(r.lessonId) || !points.has(r.knowledgePointId),
      )
    )
      throw new Error('AGENT_CURRICULUM_REFERENCES')
    // Prerequisites have their own VERIFIED structural status in the existing domain.
    for (const r of c.knowledgePrerequisites) {
      if (
        !points.has(r.prerequisiteKnowledgePointId) ||
        !points.has(r.dependentKnowledgePointId) ||
        r.status === 'ARCHIVED' ||
        !isCurriculumRecordReadable({ ...r, status: undefined }, policy)
      )
        throw new Error('AGENT_PREREQUISITE_GUARD')
    }
    return {
      regionId: profile.regionId,
      grade: c.grade.id,
      semester: c.semester.id,
      subject: c.subject.code,
      subjectId: c.subject.id,
      publisher: c.publisher!.id,
      textbookId,
    }
  }
}
