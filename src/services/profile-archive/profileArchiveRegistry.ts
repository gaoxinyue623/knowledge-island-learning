import { ACHIEVEMENT_STORAGE_KEY, achievementStoragePayloadSchema } from '@/services/achievement/achievementStorage'
import { QUEST_CHOICE_PREFIX, QUEST_PROGRESS_PREFIX, questChoiceSchema, questProgressSchema } from '@/services/content-expansion/questProgressStorage'
import { GROWTH_STORAGE_KEY, growthStoragePayloadSchema, KNOWLEDGE_ENERGY_STORAGE_KEY, knowledgeEnergyStoragePayloadSchema } from '@/services/growth/growthStorage'
import { DAILY_PLAN_STORAGE_KEY, dailyPlanStoragePayloadSchema } from '@/services/home/dailyPlanStorage'
import { interactiveActivityStorageKey } from '@/services/interactive-activity/activityStorage'
import { activityHistoryKey, activityHistoryPayloadSchema } from '@/services/learning-activity/activityHistory'
import { LEARNING_HISTORY_STORAGE_KEY, learningHistoryStoragePayloadSchema } from '@/services/learning-history/learningHistoryStorage'
import { LEARNING_MAP_PROGRESS_STORAGE_KEY, parseLearningMapProgressStoragePayload } from '@/services/learning-map/learningMapStorage'
import { LESSON_SESSION_STORAGE_KEY, parseLessonSessionStoragePayload } from '@/services/lesson-player/lessonSessionStorage'
import { learningEvidenceStorageKey, learningEvidenceStoragePayloadSchema, masteryRecordStorageKey, masteryRecordStoragePayloadSchema } from '@/services/mastery/masteryStorage'
import { PET_DATABASE_NAME } from '@/services/pet/petDatabase'
import { validatePetAccount } from '@/services/pet/petPolicy'
import { petStoryPayloadSchema, petStoryStorageKey } from '@/services/pet-stories/petStoryService'
import { questionSessionStorageKey, questionSessionStoragePayloadSchema } from '@/services/question-engine/questionSessionStorage'
import { REVIEW_QUEUE_STORAGE_KEY, reviewQueueStoragePayloadSchema } from '@/services/review-queue/reviewQueueStorage'
import { REWARD_EVENT_STORAGE_KEY, rewardEventStoragePayloadSchema } from '@/services/reward/rewardEventStorage'
import { curriculumProfileStorageKey } from '@/services/storage/curriculumProfileRepository'
import { SPACED_REVIEW_STORAGE_PREFIX, spacedReviewPayloadSchema } from '@/services/student-growth/spacedReview'
import { THINKING_PROGRESS_PREFIX, thinkingProgressSchema } from '@/services/thinking/thinkingProgressStorage'
import { weeklyPlanStoragePayloadSchema } from '@/services/weekly-plan/weeklyPlanService'
import { WEEKLY_PLAN_STORAGE_KEY } from '@/services/weekly-plan/weeklyPlanTypes'
import { WRONG_BOOK_STORAGE_KEY, wrongBookStoragePayloadSchema } from '@/services/wrong-book/wrongBookStorage'
import { activityProgressStoragePayloadSchema, storagePayloadSchema } from '@/services/validation'
import { isValidStudentProfilePayload, STUDENT_STORAGE_KEY } from '@/stores/studentStore'
import type { ProfileArchiveSectionKind } from './profileArchiveSchema'

export type ArchiveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & Partial<Pick<Storage, 'key' | 'length'>>
type Schema = { safeParse(value: unknown): { success: boolean } }
export type ArchiveKeyKind = 'fixed' | 'profile-namespace' | 'map-namespace' | 'indexeddb'
export interface ArchiveSectionAdapter { kind: ProfileArchiveSectionKind; schemaVersion: number; required: boolean; keyKind: ArchiveKeyKind; key: (profileId: string) => string; collection?: string; ownerField?: 'profileId' | 'studentProfileId'; schema?: Schema; validate?: (value: unknown) => boolean; rekeyIdFormat?: string }
const fixed = (key: string) => () => key
const scoped = (prefix: string) => (profileId: string) => `${prefix}${encodeURIComponent(profileId)}`

/** Closed, source-backed inventory: no wildcard dump may add credentials or unrelated preferences. */
export const profileArchiveRegistry: readonly ArchiveSectionAdapter[] = [
  { kind: 'student-profile', schemaVersion: 1, required: true, keyKind: 'fixed', key: fixed(STUDENT_STORAGE_KEY), validate: isValidStudentProfilePayload, ownerField: 'profileId', rekeyIdFormat: 'profile.id exact' },
  { kind: 'curriculum-profile', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(curriculumProfileStorageKey), schema: storagePayloadSchema, ownerField: 'studentProfileId', rekeyIdFormat: 'profile.studentId exact' },
  { kind: 'lesson-sessions', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(LESSON_SESSION_STORAGE_KEY), collection: 'sessions', validate: (value) => parseLessonSessionStoragePayload(value) !== null, rekeyIdFormat: 'lesson-session:<profile>:<textbook>:<unit>:<lesson>:<kp>' },
  { kind: 'question-sessions', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(questionSessionStorageKey), collection: 'sessions', schema: questionSessionStoragePayloadSchema },
  { kind: 'mastery-records', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(masteryRecordStorageKey), collection: 'records', ownerField: 'studentProfileId', schema: masteryRecordStoragePayloadSchema },
  { kind: 'learning-evidence', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(learningEvidenceStorageKey), collection: 'evidence', ownerField: 'studentProfileId', schema: learningEvidenceStoragePayloadSchema },
  { kind: 'learning-history', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(LEARNING_HISTORY_STORAGE_KEY), collection: 'records', ownerField: 'profileId', schema: learningHistoryStoragePayloadSchema },
  { kind: 'wrong-book', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(WRONG_BOOK_STORAGE_KEY), collection: 'records', ownerField: 'profileId', schema: wrongBookStoragePayloadSchema },
  { kind: 'review-queue', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(REVIEW_QUEUE_STORAGE_KEY), collection: 'items', ownerField: 'profileId', schema: reviewQueueStoragePayloadSchema },
  { kind: 'reward-events', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(REWARD_EVENT_STORAGE_KEY), collection: 'events', ownerField: 'profileId', schema: rewardEventStoragePayloadSchema },
  { kind: 'knowledge-energy', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(KNOWLEDGE_ENERGY_STORAGE_KEY), collection: 'balances', ownerField: 'profileId', schema: knowledgeEnergyStoragePayloadSchema },
  { kind: 'growth', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(GROWTH_STORAGE_KEY), collection: 'records', ownerField: 'profileId', schema: growthStoragePayloadSchema },
  { kind: 'achievements', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(ACHIEVEMENT_STORAGE_KEY), collection: 'unlocks', ownerField: 'profileId', schema: achievementStoragePayloadSchema },
  { kind: 'daily-plans', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(DAILY_PLAN_STORAGE_KEY), collection: 'plans', ownerField: 'profileId', schema: dailyPlanStoragePayloadSchema },
  { kind: 'learning-map-progress', schemaVersion: 1, required: false, keyKind: 'map-namespace', key: (profileId) => `${LEARNING_MAP_PROGRESS_STORAGE_KEY}.v2:${JSON.stringify([profileId, 'profile'])}`, validate: (value) => parseLearningMapProgressStoragePayload(value) !== null, rekeyIdFormat: 'key tuple [profileId,dataset,textbookId]' },
  { kind: 'interactive-activity-progress', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(interactiveActivityStorageKey), collection: 'progress', ownerField: 'profileId', schema: activityProgressStoragePayloadSchema },
  { kind: 'quest-progress', schemaVersion: 1, required: false, keyKind: 'profile-namespace', key: scoped(QUEST_PROGRESS_PREFIX), schema: questProgressSchema, ownerField: 'profileId', rekeyIdFormat: 'key <encoded profile>:<encoded quest>' },
  { kind: 'quest-choice', schemaVersion: 1, required: false, keyKind: 'profile-namespace', key: scoped(QUEST_CHOICE_PREFIX), schema: questChoiceSchema, ownerField: 'profileId', rekeyIdFormat: 'key <encoded profile>:<encoded quest>' },
  { kind: 'activity-history', schemaVersion: 1, required: false, keyKind: 'profile-namespace', key: activityHistoryKey, collection: 'records', ownerField: 'profileId', schema: activityHistoryPayloadSchema },
  { kind: 'thinking-progress', schemaVersion: 1, required: false, keyKind: 'profile-namespace', key: scoped(THINKING_PROGRESS_PREFIX), schema: thinkingProgressSchema, ownerField: 'profileId' },
  { kind: 'pet-account', schemaVersion: 2, required: false, keyKind: 'indexeddb', key: () => PET_DATABASE_NAME, validate: (value) => { try { const profileId = (value as { profileId?: unknown })?.profileId; return typeof profileId === 'string' && Boolean(validatePetAccount(value, profileId)) } catch { return false } }, ownerField: 'profileId', rekeyIdFormat: 'IndexedDB accounts key/profileId exact' },
  { kind: 'spaced-review', schemaVersion: 1, required: false, keyKind: 'profile-namespace', key: scoped(SPACED_REVIEW_STORAGE_PREFIX), collection: 'attempts', ownerField: 'profileId', schema: spacedReviewPayloadSchema },
  { kind: 'pet-story-progress', schemaVersion: 1, required: false, keyKind: 'profile-namespace', key: petStoryStorageKey, collection: 'records', ownerField: 'profileId', schema: petStoryPayloadSchema },
  { kind: 'weekly-plan', schemaVersion: 1, required: false, keyKind: 'fixed', key: fixed(WEEKLY_PLAN_STORAGE_KEY), collection: 'plans', ownerField: 'profileId', schema: weeklyPlanStoragePayloadSchema },
]
export function validateArchivePayload(adapter: ArchiveSectionAdapter, value: unknown): boolean { return adapter.validate ? adapter.validate(value) : adapter.schema?.safeParse(value).success === true }
export function assertArchiveRegistryComplete(): void { const kinds = profileArchiveRegistry.map((entry) => entry.kind); if (new Set(kinds).size !== kinds.length) throw new Error('Duplicate profile archive adapter'); if (kinds.length !== 24) throw new Error('Profile archive registry is incomplete') }
export function adapterFor(kind: ProfileArchiveSectionKind): ArchiveSectionAdapter { const adapter = profileArchiveRegistry.find((candidate) => candidate.kind === kind); if (!adapter) throw new Error(`Unregistered archive section: ${kind}`); return adapter }
