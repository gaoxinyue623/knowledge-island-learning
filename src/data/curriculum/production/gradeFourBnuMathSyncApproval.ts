export const G4_BNU_MATH_SYNC_APPROVAL = 'OWNER_G4_BNU_MATH_UNIT_TESTS_2026_10_09'
export const G4_BNU_MATH_SYNC_IMPORTED_AT = '2026-10-09T07:44:36.538037Z'
export const gradeFourBnuMathSyncImportRecord = {
  id: G4_BNU_MATH_SYNC_APPROVAL,
  importedAt: G4_BNU_MATH_SYNC_IMPORTED_AT,
  requestedBy: '项目所有者（本次会话）',
  request: '四年级上册北师大数学单元自测接入对应单元',
  coordinateIllustration: {
    connectedAt: '2026-10-10',
    request: '为第四单元第7题生成与题目条件相符的位置图',
    note: '按小明（3，2）、小红右边一列且同行的条件生成AI配套方格图，明确列号向右、行号向上递增，题目仍按列与行两空核对，答案为4、2。',
  },
  contentReviewer: 'Codex（题目答案核对、条件补全、平均数错误答案修正及判分边界校验）',
  note: '11组97题，77题自动核对、20题人工核对；原题与原答案另存，补充整数取值、同平面、45度方位、共顶点射线、估算方法；全相等数据为平均数判断题提供反例。原稿部分分值不一致，不换算100分。',
} as const
