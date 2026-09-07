import { describe, expect, it, vi } from 'vitest'
import { createHomeService } from '@/services/home/homeService'
import type {
  LearningHistoryRecord,
  LearningMapCurriculumSource,
  StudentCurriculumProfile,
} from '@/types'

const profile: StudentCurriculumProfile = {
  studentId: 'home-learner',
  regionId: 'REGION_GUANGDONG',
  gradeId: 'GRADE_1',
  semesterId: 'SEMESTER_UPPER',
  chineseTextbookVersionId: null,
  englishTextbookVersionId: null,
  mathTextbookVersionId: 'LOCAL_MATH',
  source: 'USER_CONFIRMED',
  confirmedAt: '2026-09-06T08:00:00Z',
}
const record: LearningHistoryRecord = {
  id: 'home-completed',
  profileId: profile.studentId,
  textbookId: 'LOCAL_MATH',
  unitId: 'u',
  lessonId: 'l',
  knowledgePointId: 'kp',
  sourceId: 'lesson-session',
  type: 'lesson_completed',
  occurredAt: '2026-09-06T09:00:00Z',
  provenance: { isSampleDerived: false, verificationStatus: 'UNVERIFIED' },
}
const source: LearningMapCurriculumSource = {
  textbook: {
    id: 'LOCAL_MATH',
    title: '数学',
    grade: 1,
    semester: 1,
    subject: 'MATH',
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  },
  lessons: [
    {
      id: 'l',
      unitId: 'u',
      title: '整理教室',
      sort: 1,
      isSample: false,
      verificationStatus: 'UNVERIFIED',
    },
  ],
  units: [],
  knowledgePoints: [],
  lessonKnowledgePoints: [],
  knowledgeRelations: [],
  isSample: false,
  verificationStatus: 'UNVERIFIED',
}
describe('Home participation display', () => {
  it('shows actual learning without allowing unverified records into strategy or daily tasks', async () => {
    const resolve = vi.fn(() => {
      throw new Error('Unsafe strategy call')
    })
    const rows: LearningHistoryRecord[] = [
      record,
      { ...record, id: 'other-child', profileId: 'other' },
      {
        ...record,
        id: 'sample',
        provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
      },
      {
        ...record,
        id: 'rejected',
        provenance: { isSampleDerived: false, verificationStatus: 'REJECTED' },
      },
      { ...record, id: 'other-book', textbookId: 'OTHER_MATH' },
    ]
    const before = JSON.stringify(rows)
    const service = createHomeService({
      historyService: { listByProfile: () => rows, getLastWarning: () => null } as never,
      mapRepository: { getMapSource: async () => source },
      lessonSessionReader: { listByProfile: () => [] },
      strategyService: { resolve, resolveReviews: () => [] },
    })
    const home = await service.load(profile, { dataset: 'profile', now: '2026-09-06T10:00:00Z' })
    expect(home.recentLearning.map((item) => item.id)).toEqual(['home-completed'])
    expect(home.recentLearning[0]?.title).toContain('《整理教室》')
    expect(home.subjects.find((s) => s.code === 'MATH')).toMatchObject({
      mapStatus: 'unverified',
      progress: { total: 0 },
      completedLearningSessions: 1,
    })
    expect(home.today.tasks).toEqual([])
    expect(resolve).not.toHaveBeenCalled()
    expect(JSON.stringify(rows)).toBe(before)
  })
})
