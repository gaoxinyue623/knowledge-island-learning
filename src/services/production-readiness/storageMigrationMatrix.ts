import type { StorageMigrationMatrixRow, StorageMigrationReport } from '@/types'

export const storageMigrationMatrix: StorageMigrationMatrixRow[] = [
  {
    storageName: 'StudentCurriculumProfile',
    storageKey: 'knowledge-island.curriculum-profile',
    currentVersion: 1,
    migrationPath: 'v1 直接读取；未知版本按空档案恢复',
    fallbackBehavior: '清除无效 payload，回到 onboarding，并保留诊断提示',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'LearningMap Progress',
    storageKey: 'knowledge-island.learning-map-progress',
    currentVersion: 1,
    migrationPath: 'v1 读取；未知版本丢弃不可解析记录',
    fallbackBehavior: '以空进度继续，地图事实从 Curriculum 重建',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'LessonSession',
    storageKey: 'knowledge-island.lesson-sessions',
    currentVersion: 1,
    migrationPath: 'v1 读取；非法会话整体回退为空白会话',
    fallbackBehavior: '不阻塞 LessonPlayer，允许重新开始',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'QuestionSession',
    storageKey: 'knowledge-island.question-sessions',
    currentVersion: 1,
    migrationPath: 'v1 读取；通过 schema 过滤非法作答结构',
    fallbackBehavior: '清除损坏会话，不修改题目事实',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'Mastery / Evidence',
    storageKey: 'knowledge-island.mastery-records; knowledge-island.learning-evidence',
    currentVersion: 1,
    migrationPath: 'v1 读取；Evidence 可由 QuestionSession 重建',
    fallbackBehavior: '安全恢复为空记录，算法版本不变',
    dataLossRisk: 'MEDIUM',
  },
  {
    storageName: 'LearningHistory',
    storageKey: 'knowledge-island.learning-history',
    currentVersion: 1,
    migrationPath: 'v1 读取；非法事实不进入 append store',
    fallbackBehavior: '恢复为空历史，并显示诊断信息',
    dataLossRisk: 'MEDIUM',
  },
  {
    storageName: 'WrongBook',
    storageKey: 'knowledge-island.wrong-book',
    currentVersion: 1,
    migrationPath: 'v1 读取；记录按 profile + question identity 校验',
    fallbackBehavior: '恢复为空错题本，不修改 QuestionAttempt',
    dataLossRisk: 'MEDIUM',
  },
  {
    storageName: 'ReviewQueue',
    storageKey: 'knowledge-island.review-queue',
    currentVersion: 1,
    migrationPath: 'v1 读取；队列项可从 Strategy 快照重新投影',
    fallbackBehavior: '恢复为空队列，Strategy 仍为只读来源',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'Reward Events',
    storageKey: 'knowledge-island.reward-events',
    currentVersion: 1,
    migrationPath: 'v1 读取；按 sourceId 去重',
    fallbackBehavior: '恢复为空事件，禁止生成重复奖励',
    dataLossRisk: 'MEDIUM',
  },
  {
    storageName: 'Growth / KnowledgeEnergy',
    storageKey: 'knowledge-island.growth; knowledge-island.knowledge-energy',
    currentVersion: 1,
    migrationPath: 'v1 读取；快照可从 Reward Events 重建',
    fallbackBehavior: '恢复为空快照，不改变 Reward 事实',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'Achievement',
    storageKey: 'knowledge-island.achievements',
    currentVersion: 1,
    migrationPath: 'v1 读取；解锁快照按 profile 校验',
    fallbackBehavior: '恢复为空里程碑记录',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'DailyPlan',
    storageKey: 'knowledge-island.daily-learning-plans',
    currentVersion: 1,
    migrationPath: 'v1 读取；计划可由 DAILY_PLAN_V1 重建',
    fallbackBehavior: '恢复为空计划，不改写 Strategy / Mastery',
    dataLossRisk: 'LOW',
  },
  {
    storageName: 'ParentReport Preferences',
    storageKey: 'knowledge-island.parent-report-preferences',
    currentVersion: 1,
    migrationPath: 'v1 读取；只保留范围和科目筛选偏好',
    fallbackBehavior: '恢复默认 7d / ALL 偏好',
    dataLossRisk: 'LOW',
  },
]

export function validateStorageMigrationMatrix(
  rows: readonly StorageMigrationMatrixRow[] = storageMigrationMatrix,
): StorageMigrationReport {
  const issues: string[] = []
  const names = new Set<string>()
  const keys = new Set<string>()
  for (const row of rows) {
    if (names.has(row.storageName)) issues.push(`重复 storageName: ${row.storageName}`)
    if (keys.has(row.storageKey)) issues.push(`重复 storageKey: ${row.storageKey}`)
    if (row.currentVersion < 1) issues.push(`无效 currentVersion: ${row.storageName}`)
    if (!row.migrationPath || !row.fallbackBehavior) issues.push(`缺失迁移说明: ${row.storageName}`)
    names.add(row.storageName)
    keys.add(row.storageKey)
  }
  return { valid: issues.length === 0, rows: rows.map((row) => ({ ...row })), issues }
}
