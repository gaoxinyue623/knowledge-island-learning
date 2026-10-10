/** Local import authorization; edition labels and text come from the uploaded file. */
export const SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL =
  'OWNER_SHENZHEN_ENGLISH_LOWER_IMPORT_2026_10_08'
export const SHENZHEN_ENGLISH_LOWER_IMPORTED_AT = '2026-10-08T07:59:19.000Z'
export const shenzhenEnglishLowerImportRecord = {
  id: SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL,
  requestedBy: '项目所有者（本次会话）',
  request: '将这个2年级下册的深圳专用｜沪教牛津 2024 新版，上海教育出版社教材内容接入',
  importedAt: SHENZHEN_ENGLISH_LOWER_IMPORTED_AT,
  supplement: {
    importedAt: '2026-10-10T02:09:53.000Z',
    request: '补入Unit 2—5 Extend、Unit 6 Chant五个缺项栏目。',
    placement: '按用户指定编号补入，保留现有单元主题；Unit 5、6的主题差异另列核对说明。',
    note: '原始文本与补充稿独立保留。原18道基础题、6组同步练习及练习记录身份保持不变；新增开放活动不自动判分。',
  },
  directoryCorrection: {
    request: '按照用户最新目录调整Unit 5 Extend和Unit 6 Chant的主题错配。',
    edition: '广东省2025复审版·深圳2026春',
    placement: 'Unit 5 Extend使用Many heroes help others及身边英雄提问；Unit 6 Ready? Go!使用三行农场歌谣及C Guess and tick提示。',
    note: '保留教材、单元、知识点和题目ID；原补充稿留档，当前两处正文更新至V3。复审年份不替代出版年份。',
  },
  contentReviewer: 'Codex（用户文本完整性与原创配套题校验）',
  sourceScope: 'USER_PROVIDED_BILINGUAL_TEXT',
  note: '保留用户提供的英语及译文；版次未作出版社核验。新增词汇释义和练习为项目原创，不代表出版社原题或教师校审。',
} as const
