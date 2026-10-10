import type {
  LearningAgentSnapshot,
  StudentKnowledgeState,
  LearningPlannerConfig,
  LearningErrorPattern,
} from '@/types/learning-agent'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from './plannerConfig'
import { detectLearningErrors } from './errorDetectors'

export class StudentKnowledgeStateBuilder {
  build(
    snapshot: LearningAgentSnapshot,
    now: string,
    config: LearningPlannerConfig = DEFAULT_LEARNING_PLANNER_CONFIG,
  ): StudentKnowledgeState {
    const profileId = snapshot.profile.studentId,
      textbookId = snapshot.curriculum.textbook.id
    const points = snapshot.curriculum.knowledgePoints
      .map((kp) => {
        const mastery = snapshot.masteryRecords.find(
          (r) => r.studentProfileId === profileId && r.knowledgePointId === kp.id,
        )
        const questionIds = new Set(
          snapshot.mappings.filter((m) => m.knowledgePointId === kp.id).map((m) => m.questionId),
        )
        const attempts = snapshot.sessions
          .filter((s) => s.textbookId === textbookId)
          .flatMap((s) =>
            s.attempts
              .filter(
                (a) =>
                  s.questionIds.includes(a.questionId) &&
                  questionIds.has(a.questionId) &&
                  a.submitted &&
                  ['correct', 'incorrect'].includes(a.result?.status ?? ''),
              )
              .map((a) => ({ ...a, key: `${s.id}:${a.questionId}` })),
          )
        const ai = (snapshot.aiSignals ?? []).filter(
          (a) =>
            a.profileId === profileId &&
            a.textbookId === textbookId &&
            a.knowledgePointId === kp.id,
        )
        const aiAttempts = ai.map((a) => ({
          key: a.id,
          questionId: a.questionId,
          submittedAt: a.occurredAt,
          answer: { type: 'shortAnswer' as const, value: a.answer },
          result: {
            status: a.correct ? ('correct' as const) : ('incorrect' as const),
            score: a.correct ? 1 : 0,
            maxScore: 1,
          },
          errorPatterns: [],
        }))
        const unique = [
          ...new Map([...attempts, ...aiAttempts].map((a) => [a.key, a])).values(),
        ].sort(
          (a, b) =>
            (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '') || a.key.localeCompare(b.key),
        )
        const recent = unique.slice(-config.recentWindow)
        const correctCount = unique.filter((a) => a.result?.status === 'correct').length
        const streak = (status: string) => {
          let count = 0
          for (const a of [...unique].reverse()) {
            if (a.result?.status !== status) break
            count++
          }
          return count
        }
        const errorPatterns: LearningErrorPattern[] = []
        for (const a of recent.filter((a) => a.result?.status === 'incorrect')) {
          const question = snapshot.questions.find((q) => q.id === a.questionId)
          if (question)
            errorPatterns.push(
              ...(a.errorPatterns ??
                detectLearningErrors(question, a.answer, snapshot.curriculum.subject.code)),
            )
        }
        const lastStudiedAt = [
          ...unique.map((a) => a.submittedAt),
          mastery?.lastEvidenceAt,
          ...snapshot.history.filter((h) => h.knowledgePointId === kp.id).map((h) => h.occurredAt),
        ]
          .filter((t): t is string => Boolean(t))
          .sort()
          .at(-1)
        // AI practice informs recommendations with bounded weight; it cannot alone certify course mastery.
        const aiWeight = Math.min(ai.length * 0.2, 1)
        const formalWeight = (mastery?.confidence ?? 0) * 5
        const aiRate = ai.length ? ai.filter((a) => a.correct).length / ai.length : 0
        const score = aiWeight
          ? (((mastery?.masteryScore ?? 0) / 100) * formalWeight + aiRate * aiWeight) /
            (formalWeight + aiWeight)
          : (mastery?.masteryScore ?? 0) / 100
        const weaknessSignals = [
          ...(mastery && score < config.lowMastery ? ['LOW_MASTERY'] : []),
          ...(streak('incorrect') >= config.consecutiveErrors ? ['CONSECUTIVE_ERRORS'] : []),
          ...(snapshot.wrongBook.some(
            (w) => w.status === 'active' && w.knowledgePointIds.includes(kp.id),
          )
            ? ['ACTIVE_WRONG_QUESTION']
            : []),
        ]
        return {
          knowledgePointId: kp.id,
          masteryScore: score,
          attemptCount: unique.length,
          correctCount,
          incorrectCount: unique.length - correctCount,
          correctRate: unique.length ? correctCount / unique.length : 0,
          recentCorrectRate: recent.length
            ? recent.filter((a) => a.result?.status === 'correct').length / recent.length
            : 0,
          consecutiveCorrect: streak('correct'),
          consecutiveIncorrect: streak('incorrect'),
          lastStudiedAt,
          weaknessSignals,
          errorPatterns: [...new Map(errorPatterns.map((p) => [p.code, p])).values()],
          confidence: mastery?.confidence ?? Math.min(aiWeight / 5, 0.2),
        }
      })
      .sort((a, b) => a.knowledgePointId.localeCompare(b.knowledgePointId))
    const experienced = points.filter((p) => p.attemptCount || p.confidence > 0)
    const ranked = [...experienced].sort(
      (a, b) =>
        a.masteryScore - b.masteryScore || a.knowledgePointId.localeCompare(b.knowledgePointId),
    )
    return {
      profileId,
      textbookId,
      knowledgePoints: points,
      strongestKnowledgePoints: [...ranked]
        .reverse()
        .slice(0, 3)
        .map((p) => p.knowledgePointId),
      weakestKnowledgePoints: ranked.slice(0, 3).map((p) => p.knowledgePointId),
      reviewCandidates: snapshot.reviewQueue
        .filter((r) => r.status === 'active' && r.dueAt && Date.parse(r.dueAt) <= Date.parse(now))
        .map((r) => r.knowledgePointId),
      remediationCandidates: experienced
        .filter((p) => p.masteryScore < config.prerequisiteThreshold)
        .map((p) => p.knowledgePointId),
      challengeCandidates: experienced
        .filter(
          (p) =>
            p.masteryScore >= config.challengeMastery &&
            p.recentCorrectRate >= config.challengeRecentRate &&
            p.attemptCount >= config.minimumAttempts &&
            p.confidence >= config.minimumConfidence,
        )
        .map((p) => p.knowledgePointId),
      generatedAt: now,
    }
  }
}
