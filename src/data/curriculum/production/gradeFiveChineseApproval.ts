export const G5_CHINESE_IMPORT_APPROVAL = 'OWNER_G5_CHINESE_IMPORT_2026_10_09'
export const G5_CHINESE_IMPORTED_AT = '2026-10-09T02:20:48.000Z'
export const gradeFiveChineseImportRecord = {
  id: G5_CHINESE_IMPORT_APPROVAL,
  importedAt: G5_CHINESE_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '人教版五年级上册语文教材所有内容以及字词表等的内容接入',
  contentReviewer: 'Codex（附件结构、原文依据、年级隔离与评分边界校验）',
  note: '按附件导入8个单元、25篇课文、2篇例文、8个单元导语、19个栏目和3张字词表。81道理解题为项目原创。保留原篇目顺序，不推定版次年份。识字表与写字表实际条目数与标题不同，已标注；开放栏目和附录不自动判分。',
  literacyImageCorrection: {
    date: '2026-10-10',
    request:
      '按8张教材图片补齐识字表、写字表、词语表；识字表带拼音，多音字用不同颜色标注，不遗漏。',
    counts: { newCharacters: 200, polyphonic: 9, recognition: 209, writing: 220, words: 213 },
    note: '以本次图片替换旧简略附录，保留原图课号、语文园地和跨页续行；沿用原有学习节点ID，课程版本更新为V2。旧来稿保留在source-text.md和contents.json，当前展示使用literacy-tables.json。',
  },
  astronautLetterCorrection: {
    date: '2026-10-10',
    request: '五年级上册航天员写给孩子的信原文按三张附件图片更新。',
    result:
      '逐段转录三页，合并跨页段落，接入导读、刘洋书信全文、署名日期、作者注及图片会认字。保留旧来稿和三页来源图片及哈希，课程与原创理解题更新为V2；旧题停止发布，新题使用R2身份。',
    boundary: '按本次页面图片核对文字，信件署写日期不用于推定教材版次年份。',
  },
} as const
