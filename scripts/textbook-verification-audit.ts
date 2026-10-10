import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { productionCurriculumIndex as catalog } from '../src/data/curriculum/production'

// Human-facing completeness review. A valid release is not an original-page certificate.
const date = '2026-10-10'
const out = resolve('doc/curriculum')
const structure = JSON.parse(
  readFileSync(resolve(out, 'TEXTBOOK_CATALOG_AUDIT_2026-10-09.json'), 'utf8'),
)
const curated = JSON.parse(
  readFileSync(resolve(out, `TEXTBOOK_VERIFICATION_RULES_${date}.json`), 'utf8'),
)
if (
  structure.totals.books !== catalog.textbooks.length ||
  structure.totals.nodes !== catalog.knowledgePoints.length
)
  throw new Error('Refresh npm run curriculum:audit before the completeness review.')
const units = new Map(catalog.units.map((x) => [x.id, x]))
const lessons = new Map(catalog.lessons.map((x) => [x.id, x]))
const sources = new Map(catalog.contentSources.map((x) => [x.id, x]))
const assets = new Map(catalog.mediaAssets.map((x) => [x.id, x]))
const subjectNames: Record<string, string> = {
  SUBJECT_CHINESE: '语文',
  SUBJECT_MATH: '数学',
  SUBJECT_ENGLISH: '英语',
}
const flattenStrings = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(flattenStrings)
      : value && typeof value === 'object'
        ? Object.values(value).flatMap(flattenStrings)
        : []
const tableText = (value: unknown) =>
  String(value ?? '')
    .replaceAll('|', '｜')
    .replaceAll('\n', '<br>')
const csv = (rows: unknown[][]) =>
  '\ufeff' +
  rows
    .map((row) =>
      row.map((value) => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(','),
    )
    .join('\r\n') +
  '\r\n'
const texts = (body: Record<string, unknown>) =>
  (Array.isArray(body.blocks) ? body.blocks : [])
    .map((block) =>
      block && typeof block === 'object' && 'text' in block ? String(block.text ?? '') : '',
    )
    .join('\n')
const records = catalog.knowledgePoints.map((point) => {
  const relation = catalog.lessonKnowledgePointRelations.find(
    (x) => x.knowledgePointId === point.id,
  )!
  const lesson = lessons.get(relation.lessonId)!
  const unit = units.get(lesson.unitId)!
  const book = catalog.textbooks.find((x) => x.id === unit.textbookVersionId)!
  const contents = catalog.contents.filter((x) => x.knowledgePointId === point.id)
  const questions = catalog.questions.filter((x) => x.knowledgePointId === point.id)
  const referenced = flattenStrings([...contents.map((x) => x.body), ...questions])
  const mediaIds = [...new Set(referenced.filter((value) => assets.has(value)))]
  const media = mediaIds.map((id) => assets.get(id)!)
  const localUrls = [
    ...new Set([
      ...referenced.filter((value) => value.startsWith('/curriculum/')),
      ...media.map((x) => x.url),
    ]),
  ]
  const text = contents.map((x) => texts(x.body)).join('\n')
  const hasImage =
    media.some((x) => x.mediaType === 'IMAGE') ||
    localUrls.some((url) => /\.(png|jpe?g|webp|svg)$/i.test(url))
  const pictureLines = text
    .split('\n')
    .filter((line) => /看图|下图|图中|观察图|读图|下面的图|[三两四234]幅图|图上|连线图/.test(line))
    .filter((line) => !/来源说明|原稿|附件|未与|图片第|已按用户|教材图|AI生成/.test(line))
  return { point, unit, book, contents, questions, media, localUrls, text, hasImage, pictureLines }
})
const byId = new Map(records.map((x) => [x.point.id, x]))
const sortedBooks = [...catalog.textbooks].sort(
  (a, b) =>
    Number(a.gradeId.slice(6)) - Number(b.gradeId.slice(6)) ||
    (a.semesterId === 'SEMESTER_UPPER' ? 0 : 1) - (b.semesterId === 'SEMESTER_UPPER' ? 0 : 1) ||
    ['SUBJECT_CHINESE', 'SUBJECT_MATH', 'SUBJECT_ENGLISH'].indexOf(a.subjectId) -
      ['SUBJECT_CHINESE', 'SUBJECT_MATH', 'SUBJECT_ENGLISH'].indexOf(b.subjectId) ||
    a.versionName.localeCompare(b.versionName),
)
type Issue = {
  id: string
  priority: string
  bookId: string
  nodeId: string
  grade: number
  semester: string
  subject: string
  version: string
  location: string
  category: string
  status: string
  issue: string
  evidence: string
  action: string
  urls: string[]
  sourceIds: string[]
}
const issues: Issue[] = []
const processed: Issue[] = []
function add(input: Partial<Issue> & { issue: string }, closed = false) {
  const node = input.nodeId ? byId.get(input.nodeId) : undefined
  const book = node?.book ?? catalog.textbooks.find((b) => b.id === input.bookId)
  if (!book) throw new Error(`Unknown book for ${input.issue}`)
  const row = {
    id: '',
    priority: 'P2',
    nodeId: '',
    location: '全册',
    category: '原书核验',
    status: '待核对',
    evidence: '',
    action: '',
    urls: [],
    sourceIds: [],
    ...input,
    bookId: book.id,
    grade: Number(book.gradeId.slice(6)),
    semester: book.semesterId === 'SEMESTER_UPPER' ? '上册' : '下册',
    subject: subjectNames[book.subjectId]!,
    version: book.versionName,
    ...(node
      ? {
          location: input.location ?? `${node.unit.title} / ${node.point.name}`,
          sourceIds: input.sourceIds ?? node.contents.map((c) => c.sourceId),
        }
      : {}),
  } as Issue
  ;(closed ? processed : issues).push(row)
}
for (const rule of curated.rules) {
  const { resolved, ...entry } = rule
  let nodeId = byId.has(rule.nodeId) ? rule.nodeId : undefined
  if (!nodeId && rule.matchTitle)
    nodeId = records.find(
      (x) => x.book.id === rule.bookId && x.point.name.includes(rule.matchTitle),
    )?.point.id
  if (rule.nodeId && !nodeId) throw new Error(`Curated location missing: ${rule.nodeId}`)
  if (rule.matchTitle && !nodeId)
    throw new Error(`Curated title missing: ${rule.bookId} / ${rule.matchTitle}`)
  add({ ...entry, nodeId }, resolved === true)
}
// Generic original-book verification status is excluded at the user's request.
// Mathematics retains its separate version and knowledge-point coverage review.
for (const book of sortedBooks.filter((b) => b.subjectId === 'SUBJECT_MATH')) {
  add({
    bookId: book.id,
    priority: 'P3',
    category: '版本与知识点覆盖',
    status: '版本与知识点覆盖待核',
    location: '全册版本、单元归属与知识点',
    issue:
      typeof book.editionYear === 'number'
        ? '登记版本、单元归属与知识点覆盖尚待核对'
        : '教材年份未明确或使用非年份标签',
    evidence: `当前登记年份：${book.editionYear ?? '未注明'}。数学以知识点和配套练习为接入范围，不要求接入教材原文。`,
    action: '核对教材版本、单元归属、知识点覆盖与练习条件。',
  })
}
for (const node of records) {
  for (const content of node.contents) {
    const body = content.body
    const missing = Array.isArray(body.missingSections) ? body.missingSections : []
    if (missing.length)
      add({
        nodeId: node.point.id,
        priority: 'P1',
        category: '登记缺项',
        status: '仍缺失',
        issue: missing.join('；'),
        evidence: '当前课程missingSections字段明确登记。',
        action: '取得同版原页并补入；核对后再解除缺项。',
      })
    if (
      node.book.subjectId === 'SUBJECT_ENGLISH' &&
      (body.sounds || body.speechFeature || body.intonation) &&
      !body.soundExamples &&
      !body.speechExamples &&
      !(Array.isArray(body.phonicsExamples) && body.phonicsExamples.length)
    ) {
      add({
        nodeId: node.point.id,
        category: '语音栏目',
        status: '栏目文本范围待核',
        issue: '语音栏仅列字母组合、例词或名称，完整示范范围未核',
        evidence: `当前栏目：${String(body.sounds || body.speechFeature || body.intonation)}；未接入独立的该栏完整例句/韵文。`,
        action:
          node.book.id === 'G4_SHANGHAI_ENGLISH_S2_2022'
            ? '核对原8单元语音原页；新增12单元附录已接入但未与此单元建立同版对应。'
            : '核对该栏原页是否含例句、韵文或语调标记；有则逐项补入，不凭栏目名猜写。',
      })
    }
  }
  if (!node.hasImage && node.pictureLines.length)
    add({
      nodeId: node.point.id,
      category: '图文任务',
      status: '疑似缺图，待原页确认',
      issue: '文字要求读图，未找到当前课程或关联题的配图引用',
      evidence: node.pictureLines[0]!.slice(0, 260),
      action: '核对该任务原页；确认图片是题干必要条件、需学生自画，还是仅属活动提示。',
    })
  for (const url of node.localUrls)
    if (!existsSync(resolve('public', url.slice(1))))
      add({
        nodeId: node.point.id,
        priority: 'P1',
        category: '图片文件',
        status: '仍缺失',
        issue: '当前引用的媒体文件不存在',
        evidence: url,
        action: '恢复对应文件并检查页面渲染。',
      })
}
const resourceRows = [
  ['G3_PEP_CHINESE_S1_KP_WRITING_3', '生日续写三张AI图', '原教材插图未提供；当前已有3张AI素材。'],
  [
    'G4_PEP_CHINESE_S2_KP_READING_21',
    '芦花鞋冬景AI图',
    '当前已接入1张AI冬景图，教材原图归属尚未核。',
  ],
  ['G5_PEP_CHINESE_S2_KP_TRY_5', '课间教室观察AI图', '当前已接入1张AI观察插图；未声明为教材原图。'],
  [
    'G6_SHANGHAI_ENGLISH_S2_KP_08',
    'Reading signs街景及标识AI图',
    '当前已接入1张AI街景图，完整对话及5组标识含义已更新。',
  ],
] as const
for (const [nodeId, title, evidence] of resourceRows)
  add({
    nodeId,
    category: '配图来源',
    status: '配套已补，原图待核',
    issue: title,
    evidence,
    action: '对照同版原图确认人物、标识、图序及任务条件；AI素材继续按配套图片标注。',
  })
const animal = records.find(
  (x) =>
    x.book.id === 'G3_PEP_CHINESE_S2_USER_IMPORTED' &&
    x.questions.some((q) => flattenStrings(q).some((s) => s.includes('小猴子丢玉米'))),
)
if (!animal) throw new Error('Animal picture-story practice not found.')
add({
  nodeId: animal.point.id,
  location: '第二单元同步练习第28题 看图写故事',
  category: '配图来源',
  status: '配套已补，原图待核',
  issue: '四组动物故事AI图不能作为原题配图认证',
  evidence: '小猴子丢玉米、小熊送小白兔回家、小松鼠种花生、小狗认真练字均已接入，含6行写话区。',
  action: '核对原题配图、题干及故事结尾要求；区分自拟练习与原题。',
})
const cuboid = records.find(
  (x) =>
    x.book.id === 'G3_BNU_MATH_S1_2022_REVISED' && x.media.some((m) => m.id.includes('CUBOID')),
)
if (!cuboid) throw new Error('Cuboid practice image not found.')
add({
  nodeId: cuboid.point.id,
  location: '第四单元 我们生活的空间（一）单元自测第4题',
  category: '配图来源',
  status: '配套已补，原图待核',
  issue: '观察长方体AI连线图已接入，原题图仍待核',
  evidence: '当前用三位观察者与三个视图的AI图，原口述任务留档。',
  action: '核对观察方位、正侧面宽窄及斜角三面视图与同版原题一致。',
})
for (const nodeId of [
  'G5_PEP_CHINESE_S2_KP_INTEGRATED_FUN',
  'G5_PEP_CHINESE_S2_KP_INTEGRATED_LOVE',
  'G5_PEP_CHINESE_S2_KP_READING_11',
  'G5_PEP_CHINESE_S1_KP_READING_19',
  'G6_SHANGHAI_ENGLISH_S2_KP_08',
  'G6_PEP_CHINESE_S1_KP_LITERACY_RECOGNITION',
]) {
  const node = byId.get(nodeId)!
  add(
    {
      nodeId,
      category: '补充留痕',
      status: '已按来稿补入',
      issue: node.point.name + '补充已生效',
      evidence:
        node.contents.map((x) => `当前内容V${x.currentVersion}`).join('；') +
        `；关联图片${node.media.filter((x) => x.mediaType === 'IMAGE').length}张。`,
      action: '不再计为当前登记正文缺项；版次、局部缺字和原图身份仍按待核表单独复核。',
    },
    true,
  )
}
// Retain the raw vs revised questions, including conditions repaired without the original diagram.
function filesIn(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesIn(resolve(path, e.name)) : [resolve(path, e.name)],
  )
}
for (const path of filesIn(resolve('src/data/curriculum')).filter((p) =>
  p.endsWith('/papers.json'),
)) {
  const data = JSON.parse(readFileSync(path, 'utf8'))
  for (const paper of data.papers ?? [])
    for (const question of paper.questions ?? []) {
      if (!question.adjustment) continue
      const qSource = `${relative(process.cwd(), path)} / ${paper.topicKey} / 第${question.number}题`
      const stem = String(question.stem ?? '')
      const candidates = catalog.questions.filter(
        (q) => q.tags.includes('unit-sync-only') && flattenStrings(q.stem).join('').endsWith(stem),
      )
      const book =
        candidates.length === 1
          ? catalog.textbooks.find((b) => b.id === candidates[0]!.textbookVersionId)
          : undefined
      const archiveBook =
        book ??
        sortedBooks.find((b) => {
          const g = path.match(/grade-(\d)/)?.[1]
          const sub = path.includes('english') ? 'SUBJECT_ENGLISH' : 'SUBJECT_MATH'
          const semester = paper.semester ?? (path.includes('lower') ? 'LOWER' : 'UPPER')
          return (
            b.gradeId === `GRADE_${g}` &&
            b.subjectId === sub &&
            b.semesterId === `SEMESTER_${semester}` &&
            (g !== '2' || path.includes(String(b.editionYear)))
          )
        })
      if (!archiveBook) throw new Error(`Question book not found: ${qSource}`)
      const input = {
        bookId: archiveBook.id,
        nodeId: candidates.length === 1 ? candidates[0]!.knowledgePointId : undefined,
        category: '题目修订',
        status: '已整理，原题待核',
        location: `${paper.title} / 第${question.number}题`,
        issue: question.adjustment,
        evidence: `原题：${question.originalStem ?? stem}\n原答案：${question.originalReference ?? question.reference ?? ''}\n当前题：${stem}\n当前参考：${question.reference ?? ''}`,
        action: '条件修订已用于当前配套练习；原题与答案单列保留，核对同版原页后确认是否采用。',
        sourceIds: [qSource],
      }
      add(input, true)
      if (/未附|原题无图|缺图/.test(question.adjustment)) {
        const currentImages =
          candidates.length === 1
            ? candidates[0]!.media
                .filter((media) => media.usageType === 'STEM')
                .map((media) => assets.get(media.mediaAssetId))
                .filter(
                  (asset) =>
                    asset?.mediaType === 'IMAGE' &&
                    asset.url.startsWith('/curriculum/') &&
                    existsSync(resolve('public', asset.url.slice(1))),
                )
            : []
        add(
          {
            ...input,
            priority: 'P1',
            category: '原题配图',
            status: currentImages.length ? '配套题配图已接入' : '原图未提供，文字条件已改写',
            issue: currentImages.length
              ? '缺图任务已补入配套图'
              : '原题缺图，当前用补充条件使任务可操作',
            action: currentImages.length
              ? '已核对配套图与当前题目条件；原稿及原答案留存，生成图片按项目配套素材标注。'
              : '取得同版原题图核对形状、层数、坐标和计数规则；不要把补充条件当成教材原题。',
          },
          currentImages.length > 0,
        )
      }
    }
}
const bookOrder = new Map(sortedBooks.map((b, i) => [b.id, i]))
issues.sort(
  (a, b) =>
    a.priority.localeCompare(b.priority) ||
    bookOrder.get(a.bookId)! - bookOrder.get(b.bookId)! ||
    a.location.localeCompare(b.location),
)
issues.forEach((x, i) => (x.id = `待核${String(i + 1).padStart(3, '0')}`))
processed.forEach((x, i) => (x.id = `留痕${String(i + 1).padStart(3, '0')}`))
const nodeRows = records
  .map((node) => {
    const flags = issues.filter(
      (i) =>
        i.nodeId === node.point.id ||
        (!i.nodeId && i.bookId === node.book.id && i.category === '目录与版本'),
    )
    const body = node.contents[0]!.body
    const page =
      body.suppliedPage ?? body.printedPageStart ?? body.directoryPage ?? body.outlinePages ?? null
    return {
      bookId: node.book.id,
      nodeId: node.point.id,
      grade: Number(node.book.gradeId.slice(6)),
      semester: node.book.semesterId === 'SEMESTER_UPPER' ? '上册' : '下册',
      subject: subjectNames[node.book.subjectId]!,
      version: node.book.versionName,
      unit: node.unit.title,
      title: node.point.name,
      page: typeof page === 'number' || typeof page === 'string' ? page : null,
      contentVersion: node.contents.map((x) => x.currentVersion).join(' / '),
      sourceScope: String(body.sourceScope ?? '未注明'),
      imageCount: node.media.filter((x) => x.mediaType === 'IMAGE').length,
      status: flags.length
        ? [...new Set(flags.map((x) => x.status))].join('；')
        : node.book.subjectId === 'SUBJECT_MATH'
          ? '知识点已接入，未发现本地明确缺项'
          : '未发现本地明确缺项',
      issueIds: flags.map((x) => x.id).join('；'),
      notes: flags.map((x) => x.issue).join('；'),
      sourceIds: node.contents.map((x) => x.sourceId).join('；'),
    }
  })
  .sort((a, b) => bookOrder.get(a.bookId)! - bookOrder.get(b.bookId)!)
const bookRows = sortedBooks.map((book) => {
  const ns = records.filter((x) => x.book.id === book.id)
  const rows = issues.filter((i) => i.bookId === book.id)
  return {
    id: book.id,
    grade: Number(book.gradeId.slice(6)),
    semester: book.semesterId === 'SEMESTER_UPPER' ? '上册' : '下册',
    subject: subjectNames[book.subjectId]!,
    version: book.versionName,
    editionYear: book.editionYear ?? null,
    units: [...new Set(ns.map((x) => x.unit.title))],
    nodeCount: ns.length,
    registeredMissing: ns.reduce(
      (count, n) =>
        count +
        n.contents.reduce(
          (c, v) => c + (Array.isArray(v.body.missingSections) ? v.body.missingSections.length : 0),
          0,
        ),
      0,
    ),
    specificIssues: rows.filter((x) => x.priority !== 'P3').length,
    possibleMissingPictures: rows.filter((x) => x.status === '疑似缺图，待原页确认').length,
    imageCount: new Set(
      ns.flatMap((n) => n.media.filter((x) => x.mediaType === 'IMAGE').map((x) => x.id)),
    ).size,
    audioCount: new Set(
      ns.flatMap((n) => n.media.filter((x) => x.mediaType === 'AUDIO').map((x) => x.id)),
    ).size,
    textScope: book.subjectId === 'SUBJECT_MATH' ? '知识点及配套练习' : '',
    sourceNotes: [
      ...new Set(
        ns.flatMap((n) =>
          n.contents.map((x) => String(x.body.sourceNote ?? sources.get(x.sourceId)?.notes ?? '')),
        ),
      ),
    ],
    nextAction:
      book.subjectId === 'SUBJECT_MATH'
        ? '核对知识点覆盖、单元归属、题意与配图'
        : book.subjectId === 'SUBJECT_ENGLISH'
          ? '优先核对版本、语音栏目文字及标识配图'
          : '优先核对目录、字词表、存疑段落及图文任务',
  }
})
const counts = (items: Issue[], key: keyof Issue) =>
  Object.fromEntries(
    [...new Set(items.map((x) => String(x[key])))].map((value) => [
      value,
      items.filter((x) => String(x[key]) === value).length,
    ]),
  )
const report = {
  generatedAt: new Date().toISOString(),
  catalogGeneratedAt: structure.generatedAt,
  scope: curated.scope,
  boundary:
    '覆盖当前39册、全部1190节点及已接入同步题。数学按知识点、配套练习及图表检查，不要求接入教材原文；英语原版音频不列为待核问题。语文和英语仍核对文本与栏目范围。检查涉及本地结构、媒体引用、来源记录和内部一致性；疑似缺图不等于已确认原版缺图。',
  totals: {
    ...structure.totals,
    issueRows: issues.length,
    processedRows: processed.length,
    registeredMissingSections: bookRows.reduce((c, b) => c + b.registeredMissing, 0),
    referencedImages: catalog.mediaAssets.filter((x) => x.mediaType === 'IMAGE').length,
    referencedAudio: catalog.mediaAssets.filter((x) => x.mediaType === 'AUDIO').length,
    priorities: counts(issues, 'priority'),
    statuses: counts(issues, 'status'),
  },
  books: bookRows,
  issues,
  processed,
  nodes: nodeRows,
  exclusions: [
    {
      title: '未完成同版原书核验的通用状态',
      status: '按用户要求不列为缺失或存疑',
      action: '不生成语文和英语全册通用核验行；具体文本、目录、字词、栏目及配图问题继续单列。',
    },
    {
      title: '全部英语教材的原版音频接入',
      status: '按用户要求不列为缺失或存疑',
      action: '保留语音栏目文字、韵文及语调标记的核对事项，不要求补入原版录音。',
    },
    {
      title: '全部数学教材的原文接入完整性',
      status: '按用户要求不列为缺失或存疑',
      action: '数学仅核对知识点、配套练习、必要配图和教材版本，不要求逐页教材原文。',
    },
    {
      title: '五四学制六年级下册语文',
      status: '已按用户要求退出当前教材及题源',
      action: '历史文件保留，不列入39册统计或当前缺项。',
    },
  ],
  externalEvidence: [
    {
      title: '人教社语文六年级上册同步字词学习手册',
      url: 'https://www.pep.com.cn/products/zhytu/gjshnj/csxp/tbzc/202306/t20230630_1984178.shtml',
      checkedAt: date,
      note: '本次检索可见2022年3月出版信息及目录，用于对照少数课号，不替代用户书的版权页。',
    },
    {
      title: '2022年教育部基础教育精品课名单',
      url: 'https://www.fuzhou.gov.cn/zgfzzt/jy/zdjy/202304/P020230425641760880849.pdf',
      checkedAt: date,
      note: '当前可检索到三上第三单元我来编童话、第四单元14小狗学叫及续写故事。仅作为单元归属差异证据。',
    },
  ],
}
if (report.books.length !== 39 || report.nodes.length !== 1190)
  throw new Error('Coverage changed; review report boundary and workbook before publishing.')
if (report.books.some((x) => /五四/.test(x.version)))
  throw new Error('Excluded five-four book reappeared.')
mkdirSync(out, { recursive: true })
writeFileSync(
  resolve(out, `TEXTBOOK_VERIFICATION_${date}.json`),
  JSON.stringify(report, null, 2) + '\n',
)
const issueHeaders = [
  '编号',
  '优先级',
  '年级',
  '册次',
  '学科',
  '教材版本',
  '单元 / 课文 / 栏目',
  '问题类型',
  '当前状态',
  '具体问题',
  '核对依据 / 当前内容',
  '需要核对或补充',
  '外部依据',
  '节点ID',
]
const issueRows = (items: Issue[]) =>
  items.map((x) => [
    x.id,
    x.priority,
    x.grade,
    x.semester,
    x.subject,
    x.version,
    x.location,
    x.category,
    x.status,
    x.issue,
    x.evidence,
    x.action,
    x.urls.join('\n'),
    x.nodeId,
  ])
writeFileSync(
  resolve(out, `TEXTBOOK_VERIFICATION_ISSUES_${date}.csv`),
  csv([issueHeaders, ...issueRows(issues)]),
)
const md = [
  '# 全部教材缺失与存疑核对表',
  `\n复查日期：${date}。覆盖当前${bookRows.length}册、${records.length}个学习节点、${structure.totals.questions}道题。五四学制六年级已退出，历史材料不计入。`,
  `\n结构检查${structure.totals.errors}个错误，登记缺项${report.totals.registeredMissingSections}项；仍需复核${issues.length}行，补充和题目修订留痕${processed.length}行。两类统计口径不同，登记为零不代表已完成全部核对。`,
  '\n数学教材按知识点及配套练习接入，不要求教材原文；原文未接入不列为缺失或存疑。数学部分保留知识点、题目、必要配图与版本方面的核对事项。',
  '\n英语教材的原版音频接入不列为缺失或存疑；语音栏目文字、韵文及语调标记仍按具体问题核对。',
  '\n语文教材的单元归属按用户确认的现有目录处理，不再列为存疑；相关确认保存在已处理记录中。',
  '\n全册通用原书核验状态按用户要求不列为缺失或存疑；保留已发现的具体问题。',
  '\nP1：优先补齐或核对影响正文、题意、版本的项目。P2：核对栏目范围、疑似缺图、字词与说明。P3：数学核对版本与知识点覆盖。',
  '\n“疑似缺图”仅表示当前文本要求读图且未找到配图引用；需查看原页确定是漏图、自画任务或活动提示。“栏目是否应有待核”也不直接算正文缺失。AI素材单独标识，不视为教材原图。',
  '\n## 教材总览\n',
  '| 年级 | 册次 | 学科 | 教材版本 | 节点 | 明确登记缺项 | 其他待核行 | 图片 | 已接入范围 |',
  '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |',
  ...bookRows.map(
    (b) =>
      `| ${b.grade} | ${b.semester} | ${b.subject} | ${tableText(b.version)} | ${b.nodeCount} | ${b.registeredMissing} | ${b.specificIssues} | ${b.imageCount} | ${b.textScope} |`,
  ),
  '\n## 缺失、未完整接入与存疑明细\n',
  '| 编号 | 优先级 | 年级册次 | 科目 / 版本 | 单元、课文、栏目 | 状态 | 具体问题及依据 | 核对动作 |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...issues.map(
    (x) =>
      `| ${x.id} | ${x.priority} | ${x.grade}年级${x.semester} | ${tableText(x.subject + ' / ' + x.version)} | ${tableText(x.location)} | ${x.status} | ${tableText(x.issue + '。' + x.evidence)}${x.urls.map((url) => ` [对照来源](${url})`).join('')} | ${tableText(x.action)} |`,
  ),
  '\n## 已补入和已处理项目\n',
  '| 年级册次 | 科目 | 单元、课文、栏目 | 当前状态 | 核对说明 |',
  '| --- | --- | --- | --- | --- |',
  ...processed
    .filter((x) => x.category !== '题目修订')
    .map(
      (x) =>
        `| ${x.grade}年级${x.semester} | ${x.subject} | ${tableText(x.location)} | ${x.status} | ${tableText(x.evidence)} |`,
    ),
  '\n其余同步题的原题、原答案、当前题、当前参考和整理理由逐题保存在Excel“已处理与修订”页。不会把经过补充条件改写的题目称为教材原题。',
  '\n完整1190节点的年级、版本、单元、题目、页码、图片数、待核编号及状态列在Excel“节点索引”页。数学按知识点范围标注，语文和英语节点仅展示具体待核状态或本地明确缺项检查结果。',
  '\n本次外部对照仅用于发现目录差异，未据此更换用户教材或课文归属。所有问题可以通过待核编号追溯到结构化JSON。',
]
writeFileSync(resolve(out, `TEXTBOOK_VERIFICATION_${date}.md`), md.join('\n') + '\n')
console.log(JSON.stringify(report.totals))
console.log(`Report: ${resolve(out, `TEXTBOOK_VERIFICATION_${date}.md`)}`)
