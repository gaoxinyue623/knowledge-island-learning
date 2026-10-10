/** Authorization to import the owner's supplied synchronous exercise sheet. */
export const SHENZHEN_ENGLISH_SYNC_APPROVAL = 'OWNER_SHENZHEN_ENGLISH_SYNC_IMPORT_2026_10_08'
export const SHENZHEN_ENGLISH_SYNC_IMPORTED_AT = '2026-10-08T08:17:08.000Z'
export const shenzhenEnglishSyncImportRecord = {
  id: SHENZHEN_ENGLISH_SYNC_APPROVAL,
  requestedBy: '项目所有者（本次会话）',
  request:
    '以上为2年级下册的深圳专用｜沪教牛津 2024 新版，上海教育出版社教材的对应的练习，可以添加进去',
  importedAt: SHENZHEN_ENGLISH_SYNC_IMPORTED_AT,
  contentReviewer: 'Codex（同步题目、判分规则与开放表达边界校验）',
  note: '保留用户原始参考答案，不代表出版社原题认证；because/so 题补充原因条件，动物判断题限定为课文理解。开放表达不自动判分。',
} as const
