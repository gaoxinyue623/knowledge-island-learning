export const G4_CHINESE_IMPORT_APPROVAL = 'OWNER_G4_CHINESE_IMPORT_2026_10_09'
export const G4_CHINESE_IMPORTED_AT = '2026-10-09T01:34:37.000Z'
export const G4_CHINESE_SUPPLEMENT_IMPORTED_AT = '2026-10-09T01:42:50.000Z'
export const G4_CHINESE_FINAL_IMPORTED_AT = '2026-10-09T01:54:43.000Z'
export const G4_CHINESE_TUOLUO_CORRECTED_AT = '2026-10-10T06:58:23.000Z'
export const gradeFourChineseImportRecord = {
  id: G4_CHINESE_IMPORT_APPROVAL,
  importedAt: G4_CHINESE_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '人教版四年级上册语文教材一、二单元的内容先接入',
  supplementRequest: '人教版四年级上册语文教材第三至第五单元的内容接入',
  supplementedAt: G4_CHINESE_SUPPLEMENT_IMPORTED_AT,
  supplementNote:
    '续篇独立保存原文与来源哈希，追加9篇课文、2篇例文、7个开放栏目及33道原创理解题；原有节点标识保持稳定。',
  finalRequest: '人教版四年级上册语文教材第六至第八单元以及字词表等内容接入',
  finalImportedAt: G4_CHINESE_FINAL_IMPORTED_AT,
  finalNote:
    '追加11篇课文、8个栏目、3个全册字词附录及33道原创理解题；保留原拼音及待核对提示，不对附录自动判分。',
  tuoluoCorrection: {
    request: '按用户提供的四页标准教材截图完整更新四年级上册第22课《陀螺》',
    correctedAt: G4_CHINESE_TUOLUO_CORRECTED_AT,
    source: 'tuoluo-correction-source-text.md',
    note: '旧第六至第八单元来稿与哈希原样保留；本课单独登记四页附件修订来源，当前正文为V2，补齐13段正文、默读提示、作者脚注及12个注音生字。教材、单元、课文、知识点及三道理解题标识保持稳定；三道题的原文依据仍有效。',
  },
  contentReviewer: 'Codex（附件结构、原文依据、部分单元范围与评分边界校验）',
  peasCorrection: {
    request: '按用户提供的五张教材图片补充四年级上册第4课《一个豆荚里的五粒豆》',
    correctedAt: '2026-10-10',
    source: 'lesson-04-source-text.md',
    note: '正文V2恢复24个自然段及完整结尾，补入阅读提示、两条脚注、12个会认字和11个会写字。校正数量叙述及花色，同步更新三道理解题依据。旧来稿及哈希保留供追溯。',
  },
  note: '按附件接入第一、二单元，不推定版次年份，不作出版社完整原版认证。第4课已按2026年10月10日教材图片校正。口语交际、习作、园地用于阅读和开放活动，不自动判分。',
} as const
