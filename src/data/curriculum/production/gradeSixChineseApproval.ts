export const G6_CHINESE_IMPORT_APPROVAL = 'OWNER_G6_CHINESE_IMPORT_2026_10_09'
export const G6_CHINESE_IMPORTED_AT = '2026-10-09T03:15:00.000Z'
export const gradeSixChineseImportRecord = {
  id: G6_CHINESE_IMPORT_APPROVAL,
  importedAt: G6_CHINESE_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '人教版六年级上册语文教材所有内容以及字词表等的内容接入',
  recognitionSupplement: {
    date: '2026-10-10',
    request: '用户提供2022版独立识字表',
    result:
      '新增附录认读节点，保留八单元28篇分组、拼音及略读星号，不生成自动评分题；写字表和词语表原文保留。',
  },
  contentReviewer: 'Codex（附件结构、原文依据、年级隔离与评分边界校验）',
  note: '按附件篇目顺序导入8个单元、26篇编号课文、2篇例文、24个开放栏目及附录节点；84道理解题为项目原创。第22课初稿为续文，后依据用户提供的第103—105页图片补齐并校正，题目修订为第2版；附件未提供独立会认字表。版次按用户后续明确确认标注为2022版，不宣称已核验出版社原版。',
} as const
