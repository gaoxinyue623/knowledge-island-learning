export const G3_BNU_MATH_SYNC_APPROVAL = 'OWNER_G3_BNU_MATH_UNIT_TESTS_2026_10_09'
export const G3_BNU_MATH_SYNC_IMPORTED_AT = '2026-10-09T07:21:52.974713Z'
export const gradeThreeBnuMathSyncImportRecord = {
  id: G3_BNU_MATH_SYNC_APPROVAL,
  importedAt: G3_BNU_MATH_SYNC_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '上下册单元测验分别添加到对应教材内容',
  contentReviewer: 'Codex（原题与答案核对、乱码修复、单元归属与评分边界校验）',
  note: '上册10组72题，下册9组45题，共117题，其中92题自动核对、25题人工核对。原稿保留，分值不一致不换算100分；图形配图缺失与题面条件调整均有记录。不将整套单元题纳入单课掌握度或AI基础题池。',
} as const
