import type { AchievementDefinition } from '@/types'

/**
 * Small, fixed milestone vocabulary for the first motivation layer. Every
 * condition is derived from completed learning facts; none is time-, streak-,
 * or reward-randomness based.
 */
export const achievementDefinitions: readonly AchievementDefinition[] = [
  {
    id: 'achievement:first-lesson',
    code: 'FIRST_LESSON',
    title: '第一次完成学习',
    description: '完成第一节课程，留下你的第一个成长脚印。',
    category: 'learning',
    condition: { type: 'lesson_completed_count', target: 1 },
    iconKey: 'book-open',
    sort: 1,
    version: 'ACHIEVEMENT_V1',
  },
  {
    id: 'achievement:five-lessons',
    code: 'FIVE_LESSONS',
    title: '学习小能手',
    description: '完成 5 节课程，继续稳稳向前。',
    category: 'learning',
    condition: { type: 'lesson_completed_count', target: 5 },
    iconKey: 'star',
    sort: 2,
    version: 'ACHIEVEMENT_V1',
  },
  {
    id: 'achievement:first-assessment',
    code: 'FIRST_ASSESSMENT',
    title: '第一次完成练习',
    description: '完成第一次练习，把想法写下来。',
    category: 'practice',
    condition: { type: 'assessment_completed_count', target: 1 },
    iconKey: 'check-circle',
    sort: 3,
    version: 'ACHIEVEMENT_V1',
  },
  {
    id: 'achievement:first-mastery',
    code: 'FIRST_MASTERY',
    title: '掌握第一个知识点',
    description: '一个知识点已经进入掌握状态，真棒。',
    category: 'mastery',
    condition: { type: 'knowledge_mastered_count', target: 1 },
    iconKey: 'sparkles',
    sort: 4,
    version: 'ACHIEVEMENT_V1',
  },
  {
    id: 'achievement:first-review',
    code: 'FIRST_REVIEW',
    title: '第一次完成巩固',
    description: '完成第一次主动巩固，让知识更牢固。',
    category: 'review',
    condition: { type: 'review_completed_count', target: 1 },
    iconKey: 'book-open',
    sort: 5,
    version: 'ACHIEVEMENT_V1',
  },
  {
    id: 'achievement:first-wrong-resolve',
    code: 'FIRST_WRONG_RESOLVE',
    title: '解决第一道错题',
    description: '把一道错题重新做对，发现就是进步。',
    category: 'review',
    condition: { type: 'wrong_question_resolved_count', target: 1 },
    iconKey: 'check-circle',
    sort: 6,
    version: 'ACHIEVEMENT_V1',
  },
  {
    id: 'achievement:energy-50',
    code: 'ENERGY_50',
    title: '成长能量 50',
    description: '累计获得 50 点 KnowledgeEnergy。',
    category: 'growth',
    condition: { type: 'knowledge_energy', target: 50 },
    iconKey: 'sparkles',
    sort: 7,
    version: 'ACHIEVEMENT_V1',
  },
]

export function getAchievementDefinitions(): AchievementDefinition[] {
  return achievementDefinitions
    .slice()
    .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
    .map((definition) => ({
      ...definition,
      condition: { ...definition.condition },
    }))
}
