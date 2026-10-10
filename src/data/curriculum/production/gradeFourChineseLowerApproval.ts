export const G4_CHINESE_LOWER_IMPORT_APPROVAL = 'OWNER_G4_CHINESE_LOWER_IMPORT_2026_10_09'
export const G4_CHINESE_LOWER_IMPORTED_AT = '2026-10-09T02:01:28.000Z'
export const gradeFourChineseLowerImportRecord = {
  id: G4_CHINESE_LOWER_IMPORT_APPROVAL,
  importedAt: G4_CHINESE_LOWER_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '人教版四年级下册语文教材所有内容以及字词表等的内容接入',
  correction: {
    request: '以用户提供的六张教材图片替换芦花鞋错误正文',
    correctedAt: '2026-10-09T02:09:22.000Z',
    note: '图片校正版替代初次文字附件中的第21课，恢复略读标记和阅读提示；原先数量疑点已由正确正文解释，撤下旧题并发布第2版题目。',
  },
  contentReviewer: 'Codex（附件结构、原文依据、上下册隔离与评分边界校验）',
  note: '按用户附件导入8个单元、28篇课文、2篇例文、20个栏目和3张字词表，不推定版次年份。初次附件的芦花鞋疑点已由图片校正版解决；园地括注及顿号例句疑点仍保留并标注。当前90道原创理解题包含新版芦花鞋3题。附录保留原分组与重复字词，不自动判分。',
} as const
