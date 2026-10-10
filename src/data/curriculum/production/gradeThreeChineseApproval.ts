/** Owner-authorized import, with source limits preserved independently of older releases. */
export const G3_CHINESE_IMPORT_APPROVAL = 'OWNER_G3_CHINESE_UPPER_IMPORT_2026_10_08'
export const G3_CHINESE_IMPORTED_AT = '2026-10-08T09:00:00.000Z'
export const gradeThreeChineseImportRecord = {
  id: G3_CHINESE_IMPORT_APPROVAL,
  importedAt: G3_CHINESE_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '以上为3年级上人教版语文教材内容，接入',
  contentReviewer: 'Codex（导入结构、原文依据与开放表达边界校验）',
  note: '版次和篇目沿用用户提供文本，未与出版社原件核对；节选和缺失栏目明确标注。配套练习为项目原创，不代表出版社习题认证。',
  supplements: [
    {
      importedAt: '2026-10-10',
      request: '以用户本次完整来稿替换第10课小狗学叫概要及三个旧结局，附基础信息与字词资料。',
      confirmedPlacement: '第三单元·2022修订版，按用户本次明确标注。',
      note: '正文第3版，保持教材、单元、课文和知识点身份；独立存档完整来稿与哈希，原三题答案不变，解析依据更新为正文原句。用户完整来稿接入不等于出版社原页认证。',
    },
    {
      importedAt: '2026-10-10T01:56:42.000Z',
      request:
        '补入三上口语交际、习作、园地、快乐读书吧正文及小狗学叫三个结局，随后补入语文园地八。',
      confirmedPlacement:
        '我来编童话第四单元，续写故事第三单元，快乐读书吧第四单元；按标题匹配正文，保留现有单元归属。',
      note: '保留首批来源档案；新增来稿园地五，初试身手并入习作；补充文本未与出版社原书逐页核验，小狗学叫前半仍为原来提供的概要。',
    },
  ],
} as const
