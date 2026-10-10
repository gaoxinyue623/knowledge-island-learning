export const G5_CHINESE_LOWER_IMPORT_APPROVAL = 'OWNER_G5_CHINESE_LOWER_IMPORT_2026_10_09'
export const G5_CHINESE_LOWER_IMPORTED_AT = '2026-10-09T02:43:23.000Z'
export const gradeFiveChineseLowerImportRecord = {
  id: G5_CHINESE_LOWER_IMPORT_APPROVAL,
  importedAt: G5_CHINESE_LOWER_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '人教版五年级下册语文教材所有内容以及字词表等的内容接入',
  supplement: {
    importedAt: '2026-10-09T02:49:59.000Z',
    request: '补全第五单元例文及全册口语交际、习作',
    placement: '用户明确确认第四单元讲笑话、第七单元小小讲解员、第八单元即兴发言',
    note: '新增交流平台、初试身手与第八单元即兴发言，补全两篇例文并配6道原创理解题，保留第三单元既有阅读材料。',
  },
  readingBarSupplement: {
    importedAt: '2026-10-10T02:05:45.000Z',
    request: '五年级下册语文（部编人教），年份为2019年；补入快乐读书吧两张教材图片正文。',
    note: '2019年份按用户明确确认登记；原第二单元读书吧节点补文并更新内容版本，教材、课文和知识点ID保留。',
  },
  junshenImageCorrection: {
    date: '2026-10-10',
    request: '按四张附件补全第11课军神',
    result:
      '正文更新为V5，补齐姓名问答及结尾，附字词表、四项课后练习与完整丰碑。保留原课文ID及三道原创题，归档四张来源图片。',
  },
  contentReviewer: 'Codex（附件结构、原文依据、上下册隔离与评分边界校验）',
  unitThreeImageSupplement: {
    date: '2026-10-10',
    request:
      '用户指定2019版第三单元，图1—图4更新汉字真有趣，图5—图10更新我爱你，汉字，并提取书法作品放入对应位置。',
    result:
      '两个原节点正文更新为V4，完整转录活动建议、阅读材料与研究报告，合并跨页段落及续表；提取18张原图，包括三幅千字文书法、扇面书法、印章、剪纸、字谜图和古文字字形，按对应标题或段落插入。保留10张来源图片与裁剪框及哈希；两个栏目仍为开放活动，不自动判分。',
  },
  note: '按附件接入8个单元、23篇课文、2个综合性学习栏目、2个例文标题、18个其他栏目和3张字词表，共48个节点。69道理解题为项目原创。只有标题的例文及栏目不补写教材正文；保留阅读材料缺文说明、重复语句和字词原有分组，不推定版次年份，开放活动不自动判分。',
} as const
