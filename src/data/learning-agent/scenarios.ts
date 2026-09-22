import type { ExerciseTemplate, Question } from '@/types'
import type { LearningAction, LearningAgentSnapshot } from '@/types/learning-agent'
import { createQuestionSession } from '@/services/question-engine/questionEngineAdapter'
import { extractLearningEvidenceFromQuestionSession } from '@/services/mastery/evidenceExtractor'
import { rebuildMasteryFromEvidence } from '@/services/mastery/masteryEngine'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery/masteryPolicy'
import { buildLearningMapSourceFromDomain } from '@/services/learning-map/curriculumSource'
import { buildLearningMapViewModel } from '@/services/learning-map/learningMapAdapter'

export const AGENT_SIMULATION_TIME = '2026-09-17T08:00:00.000Z'
export const AGENT_SCENARIOS: Array<{
  id: string
  label: string
  expected: LearningAction | 'BLOCKED'
}> = [
  { id: 'A', label: 'A · 低掌握度', expected: 'REINFORCE' },
  { id: 'B', label: 'B · 连续失败', expected: 'SIMPLIFY' },
  { id: 'C', label: 'C · 前置知识薄弱', expected: 'REMEDIATE' },
  { id: 'D', label: 'D · 复习到期', expected: 'REVIEW' },
  { id: 'E', label: 'E · 准备进入下一步', expected: 'NEXT' },
  { id: 'F', label: 'F · 准备挑战', expected: 'CHALLENGE' },
  { id: 'G', label: 'G · 初次学习', expected: 'CONTINUE' },
  { id: 'H', label: 'H · 课程闸门拒绝', expected: 'BLOCKED' },
]
export function simulationQuestion(id = 'agent-example', operation: '+' | '-' = '-'): Question {
  return {
    id,
    questionType: 'calculation',
    stem: [{ type: 'FORMULA', text: operation === '-' ? '52 − 27 = ?' : '25 + 37 = ?' }],
    knowledgePointId: 'AGENT_KP_CURRENT',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AGENT_SAMPLE',
    status: 'AI_GENERATED',
    needsVerification: true,
    estimatedSeconds: 30,
    tags: [],
    media: [],
    hints: [],
    explanation: { summary: [{ type: 'TEXT', text: '按数位计算，再检查。' }], steps: [] },
    answerRule: { ruleType: 'NUMERIC', value: operation === '-' ? 25 : 62 },
    isSample: true,
    verificationStatus: 'SAMPLE',
    gradeId: 'AGENT_G2',
    semesterId: 'AGENT_S1',
    subjectId: 'AGENT_MATH',
    textbookVersionId: 'AGENT_TEXTBOOK',
  }
}
export function simulationMapping(q: Question, kp = 'AGENT_KP_CURRENT') {
  return {
    id: `mapping:${q.id}`,
    questionId: q.id,
    knowledgePointId: kp,
    relationType: 'PRIMARY' as const,
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: q.sourceId,
    status: 'DRAFT' as const,
    needsVerification: true,
    isSample: true,
    verificationStatus: 'SAMPLE' as const,
  }
}
export function createAgentScenario(id: string): LearningAgentSnapshot {
  const now = AGENT_SIMULATION_TIME
  const meta = {
    status: 'ACTIVE' as const,
    needsVerification: true,
    verificationStatus: 'SAMPLE' as const,
    sourceId: 'AGENT_SAMPLE',
  }
  const points = ['BASE', 'CURRENT', 'NEXT'].map((key, index) => ({
    ...meta,
    id: `AGENT_KP_${key}`,
    code: `agent-${key}`,
    name: ['基础加法', '退位减法', '减法巩固'][index],
    subjectId: 'AGENT_MATH',
    gradeScope: { minGrade: 2, maxGrade: 2 },
    description: '原创开发样本，不代表正式教材。',
    learningObjective: ['检查运算过程'],
    abilityTags: ['arithmetic'],
    difficultyLevel: 'STANDARD' as const,
  }))
  const snapshot: LearningAgentSnapshot = {
    profile: {
      studentId: 'AGENT_STUDENT',
      regionId: 'AGENT_REGION',
      gradeId: 'AGENT_G2',
      semesterId: 'AGENT_S1',
      chineseTextbookVersionId: null,
      mathTextbookVersionId: 'AGENT_TEXTBOOK',
      englishTextbookVersionId: null,
      confirmedAt: now,
      source: 'USER_CONFIRMED',
    },
    dataset: 'demo',
    curriculum: {
      textbook: {
        ...meta,
        id: 'AGENT_TEXTBOOK',
        subjectId: 'AGENT_MATH',
        gradeId: 'AGENT_G2',
        semesterId: 'AGENT_S1',
        publisherId: 'AGENT_PUBLISHER',
        versionName: 'Agent 原创数学模拟教材',
        createdAt: now,
        updatedAt: now,
      },
      grade: { id: 'AGENT_G2', code: 'G2', name: '二年级', sortOrder: 2, status: 'ACTIVE' },
      semester: { id: 'AGENT_S1', code: 'UPPER', name: '上学期', sortOrder: 1, status: 'ACTIVE' },
      subject: { id: 'AGENT_MATH', code: 'MATH', name: '数学', themeKey: 'math', status: 'ACTIVE' },
      publisher: { ...meta, id: 'AGENT_PUBLISHER', name: '开发样本', officialName: '开发样本' },
      units: [
        {
          ...meta,
          id: 'AGENT_UNIT',
          textbookVersionId: 'AGENT_TEXTBOOK',
          code: 'unit',
          title: '数与运算',
          sortOrder: 1,
        },
      ],
      lessons: points.map((p, i) => ({
        ...meta,
        id: `AGENT_LESSON_${i}`,
        unitId: 'AGENT_UNIT',
        code: `lesson-${i}`,
        title: p.name,
        sortOrder: i + 1,
      })),
      knowledgePoints: points,
      lessonKnowledgePoints: points.map((p, i) => ({
        ...meta,
        id: `AGENT_REL_${i}`,
        lessonId: `AGENT_LESSON_${i}`,
        knowledgePointId: p.id,
        relationType: 'CORE',
        order: 1,
        isPrimary: true,
      })),
      knowledgePrerequisites:
        id === 'C'
          ? [
              {
                ...meta,
                id: 'AGENT_PREREQUISITE',
                prerequisiteKnowledgePointId: 'AGENT_KP_BASE',
                dependentKnowledgePointId: 'AGENT_KP_CURRENT',
                relationType: 'REQUIRED',
                status: 'DRAFT',
              },
            ]
          : [],
    },
    regionTextbookRelations: [
      {
        ...meta,
        id: 'AGENT_REGION_REL',
        regionId: 'AGENT_REGION',
        textbookVersionId: 'AGENT_TEXTBOOK',
        usageType: 'DEFAULT',
        effectiveFrom: '2026-01-01',
      },
    ],
    progress: [],
    masteryRecords: [],
    sessions: [],
    evidence: [],
    questions: [],
    mappings: [],
    wrongBook: [],
    reviewQueue: [],
    history: [],
    dailyPlan: null,
    currentKnowledgePointId: 'AGENT_KP_CURRENT',
    templates: [],
  }
  for (const kp of points) {
    for (let level = 1; level <= 5; level++) {
      const base = {
        id: `AGENT_TEMPLATE_${kp.id}_${level}`,
        knowledgePointId: kp.id,
        difficulty: `L${level}` as ExerciseTemplate['difficulty'],
        sourceId: 'AGENT_SAMPLE',
        verificationStatus: 'SAMPLE' as const,
        isSample: true,
        version: 1,
      }
      const max = [9, 19, 49, 79, 99][level - 1]
      snapshot.templates.push(
        kp.id === 'AGENT_KP_BASE'
          ? {
              ...base,
              templateType: 'addition_range',
              config: {
                minAddend: 1,
                maxAddend: max,
                maxResult: max * 2,
                allowZero: false,
                noCarry: false,
                noDuplicatePair: true,
              },
            }
          : {
              ...base,
              templateType: 'subtraction_range',
              config: {
                minMinuend: 2,
                maxMinuend: max,
                minSubtrahend: 1,
                maxSubtrahend: max,
                allowZero: false,
                nonNegative: true,
                noDuplicatePair: true,
              },
            },
      )
    }
  }
  const outcomes =
    id === 'G' || id === 'H'
      ? []
      : id === 'A'
        ? [false, false, false, false, true, false, true, false, false, true]
        : id === 'B' || id === 'C'
          ? [
              true,
              true,
              true,
              true,
              true,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              true,
              false,
              true,
              false,
              true,
              false,
              false,
              false,
            ]
          : id === 'E'
            ? [
                false,
                false,
                ...Array<boolean>(15).fill(true),
                false,
                ...Array<boolean>(7).fill(true),
              ]
            : Array<boolean>(10).fill(true)
  const question = simulationQuestion()
  snapshot.questions.push(question)
  snapshot.mappings.push(simulationMapping(question))
  outcomes.forEach((correct, index) => {
    const at = new Date(Date.parse(now) - (outcomes.length - index) * 60000).toISOString()
    const session = createQuestionSession(
      {
        textbookId: 'AGENT_TEXTBOOK',
        unitId: 'AGENT_UNIT',
        lessonId: 'AGENT_LESSON_1',
        knowledgePointId: 'AGENT_KP_CURRENT',
        source: 'dev',
      },
      {
        id: 'AGENT_INITIAL',
        knowledgePointId: 'AGENT_KP_CURRENT',
        questionIds: [question.id],
        mode: 'practice',
      },
      'AGENT_STUDENT',
      `initial-${index}`,
    )
    session.status = 'completed'
    session.completedAt = at
    session.attempts = [
      {
        questionId: question.id,
        answer: { type: 'calculation', value: correct ? '25' : '26' },
        submitted: true,
        result: { status: correct ? 'correct' : 'incorrect', score: correct ? 1 : 0, maxScore: 1 },
        submittedAt: at,
      },
    ]
    snapshot.sessions.push(session)
    snapshot.evidence.push(
      ...extractLearningEvidenceFromQuestionSession(
        {
          studentProfileId: 'AGENT_STUDENT',
          session,
          attempts: session.attempts,
          questions: [question],
          mappings: snapshot.mappings,
          policy: DEFAULT_MASTERY_POLICY,
        },
        {
          accessPolicy: {
            allowSampleCurriculum: true,
            allowUnreviewedCurriculum: true,
            allowSampleQuestions: true,
          },
        },
      ).evidence,
    )
  })
  if (outcomes.length)
    snapshot.masteryRecords.push(
      rebuildMasteryFromEvidence(
        'AGENT_STUDENT',
        'AGENT_KP_CURRENT',
        snapshot.evidence,
        undefined,
        DEFAULT_MASTERY_POLICY,
        now,
      ),
    )
  if (id === 'C' || id === 'E') {
    const map = buildLearningMapViewModel(buildLearningMapSourceFromDomain(snapshot.curriculum))
    snapshot.progress = map.islands
      .flatMap((u) => u.lessons.flatMap((l) => l.nodes))
      .filter(
        (n) =>
          n.knowledgePointId === 'AGENT_KP_BASE' ||
          (id === 'E' && n.knowledgePointId === 'AGENT_KP_CURRENT'),
      )
      .map((n) => ({ nodeId: n.id, status: 'completed', progress: 100 }))
  }
  if (id === 'D')
    snapshot.reviewQueue.push({
      id: 'AGENT_DUE',
      profileId: 'AGENT_STUDENT',
      textbookId: 'AGENT_TEXTBOOK',
      knowledgePointId: 'AGENT_KP_CURRENT',
      recommendationType: 'REINFORCE',
      priority: 1,
      reason: {
        code: 'WEAK_MASTERY',
        masteryScore: 100,
        confidence: 1,
        evidenceCount: 10,
        title: '到期复习',
        description: '模拟到期任务',
      },
      reasonCode: 'WEAK_MASTERY',
      status: 'active',
      sourceStrategyVersion: 'STRATEGY_V1',
      sourceRecommendationId: 'AGENT_REVIEW',
      provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
      dueAt: '2026-09-16T08:00:00.000Z',
    })
  if (id === 'H') snapshot.curriculum.textbook.verificationStatus = 'REJECTED'
  return snapshot
}
