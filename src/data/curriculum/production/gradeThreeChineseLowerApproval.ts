/** Owner-authorized lower-volume import; original attachment and limits remain traceable. */
export const G3_CHINESE_LOWER_IMPORT_APPROVAL = 'OWNER_G3_CHINESE_LOWER_IMPORT_2026_10_08'
export const G3_CHINESE_LOWER_IMPORTED_AT = '2026-10-08T09:33:39.000Z'
export const G3_CHINESE_LOWER_LITERACY_IMPORTED_AT = '2026-10-08T09:44:55.000Z'
export const G3_CHINESE_LOWER_LITERACY_REVISED_AT = '2026-10-10T06:59:37.422Z'
export const gradeThreeChineseLowerImportRecord = {
  id: G3_CHINESE_LOWER_IMPORT_APPROVAL,
  importedAt: G3_CHINESE_LOWER_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '3年级下册人教版语文教材内容，接入项目',
  supplementRequest: '3年级下册人教版语文教材里的识字表部分也要添加进去',
  supplementNote:
    '补充附件包含识字表、写字表和词语表，原有分组、拼音及重复项保留；按实际条目计数，不按附件标称字数删补；课号与既有课文目录不同，作为独立附录，不自动对应课文。',
  imageRevision: {
    revisedAt: G3_CHINESE_LOWER_LITERACY_REVISED_AT,
    request:
      '按8张教材图片补齐识字表、写字表、词语表；识字表带拼音，多音字用不同颜色标注，不遗漏。',
    counts: { recognition: 275, newCharacters: 250, polyphonic: 25, writing: 250, words: 271 },
    note: '按原图课号和语文园地标签逐行录入；识字表保留250个生字及另列的25个蓝色多音字条目。旧来稿保存在导入记录的archive目录。原课文和学习节点ID保留。',
  },
  contentReviewer: 'Codex（附件结构、标题说明、原文依据与教材范围校验）',
  note: '按用户附件的单元顺序和提供文本学习，不作出版社完整原版认证，不推定版次年份。第10、23课按附件后续明确标题导入；原始附件字节保留。理解题为原创配套，开放表达不自动判分。',
} as const
