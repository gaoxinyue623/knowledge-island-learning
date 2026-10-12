export const G4_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL =
  'OWNER_G4_SHANGHAI_ENGLISH_LOWER_2022_IMPORT_2026_10_09'
export const G4_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT = '2026-10-09T09:51:18.010589Z'
export const gradeFourEnglishLowerImportRecord = {
  id: G4_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
  importedAt: G4_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '沪教牛津四年级下册英语2022版双语内容接入',
  soundsSupplement: {
    date: '2026-10-10',
    request: '补充12单元语音例词、韵文、Revision 1与Intonation完整示范',
    result:
      '来稿12单元与既有8单元目录不同，作为独立语音及语调附录接入；保留原正文、目录及题目，韵文可跟读，显示升降调符号，设备语音不保证还原标记语调。',
  },
  directoryCorrection: {
    date: '2026-10-12',
    request: '按用户提供的两张2022新版目录图订正单元与栏目',
    result:
      '8个Unit补齐Get ready、Explore、Communicate和Extend*目录题目；Project 1/2标题按图展示；新增Unit checklist（85页）和Word list（86页）目录入口。目录题目与原有双语正文分别记录来源。',
  },
  contentReviewer: 'Codex（用户文本结构、词句与原创配套问题核对）',
  note: '8个Unit、2个Project及Unit checklist和Word list目录入口；另有综合练习和两份语音补充资料。55个核心词条、24道原创基础题和39道用户配套题；目录名称与页码按2026-10-12提供的两张图片订正，Project不自动评分。',
} as const
