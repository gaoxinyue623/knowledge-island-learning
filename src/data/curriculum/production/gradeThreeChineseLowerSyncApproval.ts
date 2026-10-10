export const G3_CHINESE_LOWER_SYNC_APPROVAL = 'OWNER_G3_CHINESE_LOWER_SYNC_IMPORT_2026_10_08'
export const G3_CHINESE_LOWER_SYNC_IMPORTED_AT = '2026-10-08T10:26:16.000Z'
export const gradeThreeChineseLowerSyncImportRecord = {
  id: G3_CHINESE_LOWER_SYNC_APPROVAL,
  importedAt: G3_CHINESE_LOWER_SYNC_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '这个是上面三年级下册人教版语文教材的配套练习，接入',
  contentReviewer: 'Codex（原题及答案、题干语境、教材范围、评分边界校验）',
  note: '按附件八个单元接入同步练习，原始文件和题目调整记录保留。缺少的配图明确标注；不足以回答问题的节选提示结合本册全文。组词、改写、语义解释、翻译、默写、习作等多解题人工点评；不作出版社原题认证，不将单元练习等同于单篇课文掌握。',
  pictureWritingSupplement: {
    date: '2026-10-10',
    request:
      '项目所有者要求为第二单元看图写故事生成小猴子丢玉米、小熊送小白兔回家、小松鼠种花生、小狗认真练字四组素材，图片下方提供4–6行写话区。',
    result:
      '保留原题编号与原始附件档案，题目发布版本更新为V2，接入四组AI生成四格图和6行横线写话区；选题及文字一并保存，仍按开放题人工点评。',
    boundary: '年份未注明；AI生成练习素材不表示补齐原题或出版社配图。',
  },
} as const
