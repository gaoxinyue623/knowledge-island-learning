import type {
  ProfileArchiveSectionKind,
  SectionPreviewStatus,
} from '@/services/profile-archive/profileArchiveSchema'

export const archiveSectionLabels: Record<ProfileArchiveSectionKind, string> = {
  'student-profile': '孩子资料',
  'curriculum-profile': '教材设置',
  'lesson-sessions': '课程进度',
  'question-sessions': '答题记录',
  'mastery-records': '知识点掌握记录',
  'learning-evidence': '学习证据',
  'learning-history': '学习足迹',
  'wrong-book': '错题本',
  'review-queue': '待巩固清单',
  'reward-events': '成长奖励记录',
  'knowledge-energy': '知识能量',
  growth: '成长进度',
  achievements: '成就',
  'daily-plans': '每日学习安排',
  'learning-map-progress': '知识岛地图',
  'interactive-activity-progress': '互动练习',
  'quest-progress': '闯关进度',
  'quest-choice': '练习版本选择',
  'activity-history': '探索活动记录',
  'thinking-progress': '思维训练',
  'pet-account': '宠物小屋与收支',
  'spaced-review': '间隔复习证据',
  'pet-story-progress': '团子的知识故事',
  'weekly-plan': '每周学习计划',
}

export const archiveStatusLabels: Record<SectionPreviewStatus, string> = {
  READY: '可恢复',
  EMPTY: '暂无记录',
  REBUILD_REQUIRED: '需重新整理',
  INVALID: '记录无法识别',
  UNSUPPORTED_VERSION: '版本暂不支持',
  MISSING_REQUIRED: '缺少必要资料',
}
