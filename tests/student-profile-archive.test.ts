import { describe, expect, it } from 'vitest'
import { createProfileArchiveService } from '@/services/profile-archive/profileArchiveService'
import { FAMILY_PROFILE_REGISTRY_KEY } from '@/services/family/localFamilyProfiles'
import { adapterFor, profileArchiveRegistry, validateArchivePayload } from '@/services/profile-archive/profileArchiveRegistry'
import { createLessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import { createLearningMapProgressStorage } from '@/services/learning-map/learningMapStorage'
import { createQuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import { createSpacedReviewService } from '@/services/student-growth/spacedReview'
import { createWeeklyPlanStorage, defaultWeeklyPlan } from '@/services/weekly-plan'
import { freshPetAccount } from '@/services/pet/petPolicy'
import { ACTIVE_PROFILE_JOURNAL_KEY, recoverActiveProfileJournal } from '@/services/family/activeProfileStorage'
import { createPetStoryService } from '@/services/pet-stories/petStoryService'
import { createMasteryStorage } from '@/services/mastery/masteryStorage'
import { createWrongBookStorage } from '@/services/wrong-book/wrongBookStorage'
import { createReviewQueueStorage } from '@/services/review-queue/reviewQueueStorage'
import { validatePortableArchive } from '@/services/profile-archive/portableArchiveValidator'
import { recordLearningActivity, readActivityHistory } from '@/services/learning-activity/activityHistory'
import { createPinia, setActivePinia } from 'pinia'
import { useStudentStore } from '@/stores/studentStore'
import { createCurriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { vi } from 'vitest'

class MemoryStorage {
  values = new Map<string, string>()
  get length() { return this.values.size }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}
const locks = { request: async <T>(_name: string, _options: { mode: 'exclusive' }, callback: () => Promise<T>) => callback() }
const pet = { update: async () => { throw new Error('unused') }, read: async () => null, putNewProfile: async () => undefined, deleteProfile: async () => undefined }
function source(storage: MemoryStorage) {
  storage.setItem('knowledge-island.student.v1', JSON.stringify({ version: 1, profile: { id: 'alice', displayName: 'Alice' }, characterId: 'default-character' }))
  storage.setItem('knowledge-island.curriculum-profile', JSON.stringify({ schemaVersion: 1, profile: { studentId: 'alice', regionId: 'R', gradeId: 'G', semesterId: 'S', chineseTextbookVersionId: null, mathTextbookVersionId: 'M', englishTextbookVersionId: null, confirmedAt: '2026-09-01T00:00:00.000Z', source: 'USER_CONFIRMED' } }))
}

describe('student profile archive', () => {
  it('validates every registered localStorage payload with its owning module contract', () => {
    const sourceProfile = { studentId: 'alice', regionId: 'R', gradeId: 'G', semesterId: 'S', chineseTextbookVersionId: null, mathTextbookVersionId: 'M', englishTextbookVersionId: null, confirmedAt: '2026-09-01T00:00:00.000Z', source: 'USER_CONFIRMED' }
    const payloads: Partial<Record<string, unknown>> = {
      'student-profile': { version: 1, profile: { id: 'alice', displayName: 'Alice' }, characterId: 'default-character' },
      'curriculum-profile': { schemaVersion: 1, profile: sourceProfile }, 'lesson-sessions': { schemaVersion: 1, sessions: [] }, 'question-sessions': { schemaVersion: 1, sessions: [] },
      'mastery-records': { schemaVersion: 1, records: [] }, 'learning-evidence': { schemaVersion: 1, evidence: [] }, 'learning-history': { schemaVersion: 1, records: [] },
      'wrong-book': { schemaVersion: 1, records: [], processedAttemptIds: [] }, 'review-queue': { schemaVersion: 1, items: [] }, 'reward-events': { schemaVersion: 1, events: [] },
      'knowledge-energy': { schemaVersion: 1, balances: [] }, growth: { schemaVersion: 1, records: [] }, achievements: { schemaVersion: 1, unlocks: [] }, 'daily-plans': { schemaVersion: 1, plans: [] },
      'learning-map-progress': { schemaVersion: 1, textbookId: 'book', records: [] }, 'interactive-activity-progress': { schemaVersion: 1, progress: [] },
      'quest-progress': { schemaVersion: 1, profileId: 'alice', questId: 'q', contentRevision: 'r', passedIds: [], mistakeIds: [], helpedIds: [], completedStageIds: [], reviewIds: null, activeStageId: null, summaryVisible: false },
      'quest-choice': { schemaVersion: 1, profileId: 'alice', questId: 'q', mode: 'foundation', variant: 0 }, 'activity-history': { version: 1, records: [] },
      'thinking-progress': { schemaVersion: 1, profileId: 'alice', records: [] }, 'spaced-review': { schemaVersion: 1, attempts: [] }, 'pet-story-progress': { schemaVersion: 1, records: [] }, 'weekly-plan': { schemaVersion: 1, plans: [] },
    }
    for (const adapter of profileArchiveRegistry) {
      if (adapter.kind === 'pet-account') continue
      expect(validateArchivePayload(adapter, payloads[adapter.kind])).toBe(true)
    }
    expect(profileArchiveRegistry).toHaveLength(24)
    expect(adapterFor('activity-history').key('alice')).toBe('knowledge-island.activities.v1:alice')
  })

  it('exports populated records written through the owning storage APIs and preserves their scopes', async () => {
    const storage = new MemoryStorage(); source(storage)
    createLessonSessionStorage(storage).save({ id: 'lesson-session:alice:book:unit:lesson:kp', textbookId: 'book', unitId: 'unit', lessonId: 'lesson', knowledgePointId: 'kp', status: 'in_progress', currentStepIndex: 0, completedStepIds: [] })
    createQuestionSessionStorage(storage).save({ id: 'question-session:alice:assessment', assessmentId: 'assessment', textbookId: 'book', unitId: 'unit', lessonId: 'lesson', knowledgePointId: 'kp', questionIds: ['q'], currentQuestionIndex: 0, status: 'in_progress', attempts: [] })
    createLearningMapProgressStorage(storage).save('book', [{ nodeId: 'node', status: 'learning', progress: 50 }], { profileId: 'alice', dataset: 'profile' })
    createSpacedReviewService(storage).record({ attemptId: 'spaced:alice:one', profileId: 'alice', questId: 'quest', contentRevision: 'r1', courseHref: '/knowledge-point/kp#knowledge-challenges', title: '复习', subject: 'MATH', completedAt: '2026-09-01T00:00:00.000Z', stages: [{ stageId: 'stage', prompt: '题目', firstAttempt: 'independent' }] })
    const evidence = createSpacedReviewService(storage).listEvidence('alice')[0]!
    const stories = createPetStoryService(storage, () => '2026-09-02T00:00:00.000Z')
    expect(stories.open('alice', evidence)).toBe(true)
    expect(stories.selfReport('alice', 'quest', 'r1', 'expression')).toBe(true)
    createWeeklyPlanStorage(storage).save(defaultWeeklyPlan('alice', '2026-09-07', new Date('2026-09-07T00:00:00.000Z')))
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' })
    const archive = await service.exportArchive('alice')
    const counts = Object.fromEntries(archive.sections.map((section) => [section.kind, section.data === null ? 0 : 1]))
    expect(counts['lesson-sessions']).toBe(1)
    expect(counts['question-sessions']).toBe(1)
    expect(counts['learning-map-progress']).toBe(1)
    expect(counts['spaced-review']).toBe(1)
    expect(counts['weekly-plan']).toBe(1)
    expect(counts['pet-story-progress']).toBe(1)
    const preview = service.inspectArchive(archive)
    await service.restore(archive, preview)
    const lessons = JSON.parse(storage.getItem('knowledge-island.lesson-sessions')!).sessions
    expect(lessons).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'lesson-session:alice:book:unit:lesson:kp' }), expect.objectContaining({ id: 'lesson-session:copy:book:unit:lesson:kp' })]))
    expect(storage.getItem('knowledge-island.learning-map-progress.v2:["copy","profile","book"]')).not.toBeNull()
    expect(JSON.parse(storage.getItem('knowledge-island.spaced-review.v1:copy')!).attempts[0].profileId).toBe('copy')
    expect(createPetStoryService(storage).load('copy')[0]).toMatchObject({ profileId: 'copy', expressionCompletedAt: '2026-09-02T00:00:00.000Z' })
  })

  it('exports an explicit, credential-free inventory and restores it as an activated new profile', async () => {
    const storage = new MemoryStorage(); source(storage)
    storage.setItem('ki_session', 'secret')
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy', now: () => new Date('2026-09-08T00:00:00.000Z') })
    const archive = await service.exportArchive('alice')
    expect(JSON.stringify(archive)).not.toContain('secret')
    expect(archive.sections).toHaveLength(24)
    const preview = service.inspectArchive(archive)
    expect(preview.canRestore).toBe(true)
    await service.restore(archive, preview)
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('copy')
    expect(JSON.parse(storage.getItem('knowledge-island.curriculum-profile')!).profile.studentId).toBe('copy')
    expect(JSON.parse(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!).activeProfileId).toBe('copy')
  })

  it('rejects damaged, future-version, cross-scope and stale input without touching existing records', async () => {
    const storage = new MemoryStorage(); source(storage)
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' })
    const archive = await service.exportArchive('alice')
    const invalid = structuredClone(archive)
    invalid.sections.find((section) => section.kind === 'lesson-sessions')!.schemaVersion = 2
    expect(service.inspectArchive(invalid).canRestore).toBe(false)
    const cross = structuredClone(archive)
    const crossCurriculum = cross.sections.find((section) => section.kind === 'curriculum-profile')!.data as { profile: { studentId: string } }
    crossCurriculum.profile.studentId = 'mallory'
    expect(service.inspectArchive(cross).canRestore).toBe(false)
    const preview = service.inspectArchive(archive)
    expect(await service.restore(archive, { ...preview, digest: 'old' }).catch((error) => error.message)).toBe('PREVIEW_STALE')
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('alice')
  })

  it('refuses to overwrite a damaged family registry and journals an interrupted new scope', async () => {
    const storage = new MemoryStorage(); source(storage)
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' })
    const archive = await service.exportArchive('alice')
    const preview = service.inspectArchive(archive)
    storage.setItem(FAMILY_PROFILE_REGISTRY_KEY, '{bad')
    await expect(service.restore(archive, preview)).rejects.toThrow('目录损坏')
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('alice')
    storage.removeItem(FAMILY_PROFILE_REGISTRY_KEY)
    const set = storage.setItem.bind(storage)
    storage.setItem = (key: string, value: string) => {
      if (key === 'knowledge-island.curriculum-profile:copy') throw new Error('quota')
      set(key, value)
    }
    await expect(service.restore(archive, preview)).rejects.toThrow('quota')
    expect(JSON.parse(storage.getItem('knowledge-island.profile-restore-journal.v1:copy')!).phase).toBe('orphaned')
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('alice')
  })

  it('does not replace bytes of a damaged family registry during settings bootstrap', () => {
    const storage = new MemoryStorage(); source(storage)
    storage.setItem(FAMILY_PROFILE_REGISTRY_KEY, '{bad')
    const service = createProfileArchiveService({ storage, locks, pet })
    expect(service.bootstrapProfile({ id: 'alice', displayName: 'Alice', characterId: 'default-character', createdAt: '2026-09-01T00:00:00.000Z' })).toBeNull()
    expect(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)).toBe('{bad')
  })

  it('recovers a persisted interrupted activation before readers can observe mixed singleton identities', () => {
    const storage = new MemoryStorage(); source(storage)
    const originalStudent = storage.getItem('knowledge-island.student.v1')!
    const originalCurriculum = storage.getItem('knowledge-island.curriculum-profile')!
    storage.setItem('knowledge-island.student.v1', JSON.stringify({ version: 1, profile: { id: 'copy', displayName: 'Copy' }, characterId: 'default-character' }))
    storage.setItem(ACTIVE_PROFILE_JOURNAL_KEY, JSON.stringify({ student: originalStudent, curriculum: originalCurriculum, registry: null }))
    recoverActiveProfileJournal(storage as Storage)
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('alice')
    expect(JSON.parse(storage.getItem('knowledge-island.curriculum-profile')!).profile.studentId).toBe('alice')
    expect(storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)).toBeNull()
  })

  it('leaves every singleton untouched when an activation journal is malformed', () => {
    const storage = new MemoryStorage(); source(storage)
    const student = storage.getItem('knowledge-island.student.v1')!
    const curriculum = storage.getItem('knowledge-island.curriculum-profile')!
    const raw = JSON.stringify({ student, curriculum: 7, registry: null })
    storage.setItem(ACTIVE_PROFILE_JOURNAL_KEY, raw)
    expect(recoverActiveProfileJournal(storage as Storage)).toBe(false)
    expect(storage.getItem('knowledge-island.student.v1')).toBe(student)
    expect(storage.getItem('knowledge-island.curriculum-profile')).toBe(curriculum)
    expect(storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)).toBe(raw)
  })

  it.each(['knowledge-island.student.v1', 'knowledge-island.curriculum-profile', FAMILY_PROFILE_REGISTRY_KEY])('keeps readers on one old scope when activation write %s fails and rollback is unavailable', (failedKey) => {
    const storage = new MemoryStorage(); source(storage)
    const copyStudent = { version: 1, profile: { id: 'copy', displayName: 'Copy' }, characterId: 'default-character' }
    const copyCurriculum = { schemaVersion: 1, profile: { studentId: 'copy', regionId: 'R', gradeId: 'G', semesterId: 'S', chineseTextbookVersionId: null, mathTextbookVersionId: 'M', englishTextbookVersionId: null, confirmedAt: '2026-09-01T00:00:00.000Z', source: 'USER_CONFIRMED' } }
    storage.setItem('knowledge-island.student.v1:copy', JSON.stringify(copyStudent)); storage.setItem('knowledge-island.curriculum-profile:copy', JSON.stringify(copyCurriculum))
    storage.setItem(FAMILY_PROFILE_REGISTRY_KEY, JSON.stringify({ schemaVersion: 1, activeProfileId: 'alice', profiles: [{ id: 'alice', displayName: 'Alice', characterId: 'default-character', createdAt: '2026-09-01T00:00:00.000Z' }, { id: 'copy', displayName: 'Copy', characterId: 'default-character', createdAt: '2026-09-02T00:00:00.000Z' }] }))
    const write = storage.setItem.bind(storage)
    let broken = true
    storage.setItem = (key: string, value: string) => { if (broken && (key === failedKey || key === 'knowledge-island.student.v1' || key === 'knowledge-island.curriculum-profile' || key === FAMILY_PROFILE_REGISTRY_KEY)) throw new Error('write failed'); write(key, value) }
    const service = createProfileArchiveService({ storage, locks, pet })
    expect(() => service.activate('copy')).toThrow('write failed')
    expect(storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)).not.toBeNull()
    broken = false
    recoverActiveProfileJournal(storage as Storage)
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('alice')
    expect(JSON.parse(storage.getItem('knowledge-island.curriculum-profile')!).profile.studentId).toBe('alice')
    expect(JSON.parse(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!).activeProfileId).toBe('alice')
    expect(storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)).toBeNull()
  })

  it('does not publish a restored profile while activation and rollback writes keep failing', async () => {
    const storage = new MemoryStorage(); source(storage)
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' })
    service.bootstrapProfile({ id: 'alice', displayName: 'Alice', characterId: 'default-character', createdAt: '2026-09-01T00:00:00.000Z' })
    const beforeRegistry = storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!
    const archive = await service.exportArchive('alice')
    const preview = service.inspectArchive(archive)
    const write = storage.setItem.bind(storage)
    let broken = true
    storage.setItem = (key: string, value: string) => {
      if (broken && ['knowledge-island.student.v1', 'knowledge-island.curriculum-profile', FAMILY_PROFILE_REGISTRY_KEY].includes(key)) throw new Error('quota')
      write(key, value)
    }
    await expect(service.restore(archive, preview)).rejects.toThrow('quota')
    expect(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)).toBe(beforeRegistry)
    expect(JSON.parse(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!).activeProfileId).toBe('alice')
    expect(JSON.parse(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!).profiles.map((profile: { id: string }) => profile.id)).toEqual(['alice'])
    expect(storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)).not.toBeNull()
    broken = false
    expect(recoverActiveProfileJournal(storage as Storage)).toBe(true)
    expect(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)).toBe(beforeRegistry)
    expect(JSON.parse(storage.getItem('knowledge-island.student.v1')!).profile.id).toBe('alice')
    expect(JSON.parse(storage.getItem('knowledge-island.curriculum-profile')!).profile.studentId).toBe('alice')
  })

  it('does not publish a newly created profile when activation cannot write', async () => {
    const storage = new MemoryStorage(); source(storage)
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' })
    service.bootstrapProfile({ id: 'alice', displayName: 'Alice', characterId: 'default-character', createdAt: '2026-09-01T00:00:00.000Z' })
    const beforeRegistry = storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!
    const write = storage.setItem.bind(storage)
    storage.setItem = (key: string, value: string) => {
      if (key === 'knowledge-island.student.v1') throw new Error('quota')
      write(key, value)
    }
    await expect(service.createProfile({ displayName: 'Copy', characterId: 'default-character', copyCurriculum: true })).rejects.toThrow('quota')
    expect(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)).toBe(beforeRegistry)
    expect(JSON.parse(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!).activeProfileId).toBe('alice')
    expect(JSON.parse(storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)!).profiles.map((profile: { id: string }) => profile.id)).toEqual(['alice'])
  })

  it('rekeys the populated question-session evidence wrong-book and review foreign-key chain without changing source bytes', async () => {
    const storage = new MemoryStorage(); source(storage)
    const sessionId = 'question-session:alice:assessment'
    createQuestionSessionStorage(storage).save({ id: sessionId, assessmentId: 'assessment', textbookId: 'book', unitId: 'unit', lessonId: 'lesson', knowledgePointId: 'kp', questionIds: ['q'], currentQuestionIndex: 0, status: 'completed', attempts: [{ questionId: 'q', answer: { type: 'calculation', value: '1' }, submitted: true, result: { status: 'correct', score: 1, maxScore: 1 }, submittedAt: '2026-09-01T00:00:00.000Z' }] })
    const attemptId = 'question-attempt:alice:assessment:q'
    createMasteryStorage(storage).saveEvidence([{ id: 'evidence:alice:q', type: 'question_attempt', studentProfileId: 'alice', knowledgePointId: 'kp', source: { questionId: 'q', questionSessionId: sessionId, questionAttemptId: attemptId, assessmentId: 'assessment' }, outcome: 'correct', questionDifficulty: 1, knowledgeWeight: 1, evidenceWeight: 1, occurredAt: '2026-09-01T00:00:00.000Z' }])
    createWrongBookStorage(storage).save({ schemaVersion: 1, records: [{ id: 'wrong-question:alice:q', profileId: 'alice', questionId: 'q', knowledgePointIds: ['kp'], firstWrongAt: '2026-09-01T00:00:00.000Z', lastWrongAt: '2026-09-01T00:00:00.000Z', wrongCount: 1, status: 'active', source: { questionSessionIds: [sessionId] }, provenance: { isSampleDerived: false } }], processedAttemptIds: [attemptId] })
    createReviewQueueStorage(storage).save({ schemaVersion: 1, items: [{ id: 'review:alice:q', evidenceId: 'evidence:alice:q', profileId: 'alice', textbookId: 'book', knowledgePointId: 'kp', recommendationType: 'REINFORCE', priority: 1, reason: { code: 'WEAK_MASTERY', masteryScore: 1, confidence: 0.1, evidenceCount: 1, title: '复习', description: '复习' }, reasonCode: 'WEAK_MASTERY', status: 'active', sourceStrategyVersion: 'v1', sourceRecommendationId: 'r1', provenance: { isSampleDerived: false } }] })
    const sourceBytes = ['knowledge-island.question-sessions', 'knowledge-island.learning-evidence', 'knowledge-island.wrong-book', 'knowledge-island.review-queue'].map((key) => storage.getItem(key))
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' }); const archive = await service.exportArchive('alice'); const portable = validatePortableArchive(archive); expect(portable.ok ? 'ok' : portable.issue).toBe('ok'); const preview = service.inspectArchive(archive); expect(preview.canRestore).toBe(true); await service.restore(archive, preview)
    const copiedSession = createQuestionSessionStorage(storage).get('question-session:copy:assessment')!
    const copiedEvidence = createMasteryStorage(storage).loadEvidence().find((item) => item.studentProfileId === 'copy')!
    const copiedWrong = createWrongBookStorage(storage).load().records.find((item) => item.profileId === 'copy')!
    const copiedReview = createReviewQueueStorage(storage).load().items.find((item) => item.profileId === 'copy')!
    expect(copiedSession.id).toBe('question-session:copy:assessment')
    expect(copiedEvidence.source.questionSessionId).toBe(copiedSession.id)
    expect(copiedEvidence.source.questionAttemptId).toBe('question-attempt:copy:assessment:q')
    expect(copiedWrong.source.questionSessionIds).toEqual([copiedSession.id])
    expect(copiedWrong.source.questionSessionIds).not.toContain(sessionId)
    expect(copiedWrong.source.questionSessionIds).toEqual([copiedSession.id])
    expect(copiedWrong.id).toBe('wrong-question:copy:q')
    expect(createWrongBookStorage(storage).load().processedAttemptIds).toContain('question-attempt:copy:assessment:q')
    expect(copiedReview.evidenceId).toBe(copiedEvidence.id)
    expect(JSON.parse(storage.getItem('knowledge-island.question-sessions')!).sessions.find((item: { id: string }) => item.id === sessionId)).toEqual(JSON.parse(sourceBytes[0]!).sessions[0])
    expect(JSON.parse(storage.getItem('knowledge-island.learning-evidence')!).evidence.find((item: { id: string }) => item.id === 'evidence:alice:q')).toEqual(JSON.parse(sourceBytes[1]!).evidence[0])
    expect(JSON.parse(storage.getItem('knowledge-island.wrong-book')!).records.find((item: { id: string }) => item.id === 'wrong-question:alice:q')).toEqual(JSON.parse(sourceBytes[2]!).records[0])
    expect(JSON.parse(storage.getItem('knowledge-island.review-queue')!).items.find((item: { id: string }) => item.id === 'review:alice:q')).toEqual(JSON.parse(sourceBytes[3]!).items[0])
  })

  it('exports and restores non-empty activity history using its actual version:1 payload', async () => {
    const storage = new MemoryStorage(); source(storage)
    recordLearningActivity({ id: 'activity:alice:quest', profileId: 'alice', contentId: 'quest', contentVersion: 'r1', kind: 'quest', title: '活动', subject: 'MATH', occurredAt: '2026-09-01T00:00:00.000Z', completedCount: 1, mistakeCount: 0, href: '/knowledge-point/kp' }, storage)
    const service = createProfileArchiveService({ storage, locks, pet, uuid: () => 'copy' })
    const archive = await service.exportArchive('alice')
    expect(service.inspectArchive(archive).canRestore).toBe(true)
    await service.restore(archive, service.inspectArchive(archive))
    expect(readActivityHistory('copy', storage)).toEqual([expect.objectContaining({ profileId: 'copy', id: 'activity:copy:quest' })])
    expect(readActivityHistory('alice', storage)).toEqual([expect.objectContaining({ profileId: 'alice', id: 'activity:alice:quest' })])
  })

  it('keeps both real readers fail-closed while activation recovery cannot write, then recovers one original scope', () => {
    const studentBytes = JSON.stringify({ version: 1, profile: { id: 'alice', displayName: 'Alice' }, characterId: 'default-character' })
    const curriculumBytes = JSON.stringify({ schemaVersion: 1, profile: { studentId: 'alice', regionId: 'R', gradeId: 'G', semesterId: 'S', chineseTextbookVersionId: null, mathTextbookVersionId: 'M', englishTextbookVersionId: null, confirmedAt: '2026-09-01T00:00:00.000Z', source: 'USER_CONFIRMED' } })
    localStorage.clear(); localStorage.setItem('knowledge-island.student.v1', JSON.stringify({ version: 1, profile: { id: 'copy', displayName: 'Copy' }, characterId: 'default-character' })); localStorage.setItem('knowledge-island.curriculum-profile', curriculumBytes); localStorage.setItem(ACTIVE_PROFILE_JOURNAL_KEY, JSON.stringify({ student: studentBytes, curriculum: curriculumBytes, registry: null }))
    const originalJournal = localStorage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)!
    const originalStudent = localStorage.getItem('knowledge-island.student.v1')!
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    setActivePinia(createPinia())
    expect(useStudentStore().profile).toBeNull()
    expect(createCurriculumProfileRepository(localStorage).load()).toBeNull()
    expect(localStorage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)).toBe(originalJournal)
    expect(localStorage.getItem('knowledge-island.student.v1')).toBe(originalStudent)
    write.mockRestore()
    setActivePinia(createPinia())
    expect(useStudentStore().profile?.id).toBe('alice')
    expect(createCurriculumProfileRepository(localStorage).load()?.studentId).toBe('alice')
  })

  it('copies a validated IndexedDB pet account to the new profile without overwriting the source', async () => {
    const storage = new MemoryStorage(); source(storage)
    const accounts = new Map([['alice', freshPetAccount('alice')]])
    const petMemory = { update: async () => freshPetAccount('alice'), read: async (id: string) => accounts.get(id) ?? null, putNewProfile: async (id: string, account: ReturnType<typeof freshPetAccount>) => { if (accounts.has(id)) throw new Error('exists'); accounts.set(id, account) }, deleteProfile: async (id: string) => { accounts.delete(id) } }
    const service = createProfileArchiveService({ storage, locks, pet: petMemory, uuid: () => 'copy' })
    const archive = await service.exportArchive('alice')
    expect(archive.sections.find((section) => section.kind === 'pet-account')?.data).toMatchObject({ profileId: 'alice' })
    await service.restore(archive, service.inspectArchive(archive))
    expect(accounts.get('alice')?.profileId).toBe('alice')
    expect(accounts.get('copy')?.profileId).toBe('copy')
  })
})
