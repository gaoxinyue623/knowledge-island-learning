export const G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL =
  'OWNER_G6_SHANGHAI_ENGLISH_LOWER_IMPORT_2026_10_09'
export const G6_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT = '2026-10-09T10:56:57.163261Z'
export const gradeSixEnglishLowerImportRecord = {
  id: G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
  importedAt: G6_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '沪教牛津六年级下册（三年级起点）双语内容接入',
  readingSignsSupplement: {
    date: '2026-10-10',
    request: '更新Unit 8 Reading signs对话与5组标识含义，生成并接入插图',
    result:
      '课文内容更新为V3，原节点及Look and read、三道理解题保留；对话语调标记及五条标识含义完整保存，六组标识AI配图插入Look and learn前；中文译文为项目整理，图片注明AI配套。',
  },
  contentReviewer: 'Codex（来稿结构、词句及原创配套问题核对）',
  note: '4个Module、12个Unit、4个Project、6个附录；58个核心词条、3个按本课中译整理的补充词条、36道原创基础题。保留并标注错位原句和动词分类，未填写未提供的版次年份。',
  intonationSupplement: {
    updatedAt: '2026-10-10T02:35:02.000Z',
    editionYear: 2013,
    confirmedBy: '项目所有者（本次会话明确指定2013年、三年级起点、深圳用）',
    request: '补齐Unit 12 The five peas的Sounds语调示例',
    note: '补入语调规则、4个示例句、3个朗读练习及提示；原22个节点与题目ID保留，原始栏目名称另存。补充文本单独登记来源，核对页面展示和英文跟读过滤，未认证为出版社原页。',
  },
} as const
