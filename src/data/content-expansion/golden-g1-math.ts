import type {
  ActivityDifficulty,
  Challenge,
  ContentExpansionBundle,
  ExtensionActivity,
  ExerciseTemplate,
  InteractiveActivity,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
  PracticeSet,
  StructuredContent,
} from '@/types'

const textbookId = 'B01_SZ_G1_MATH_S1_BNUP_2024_TEXTBOOK_CANDIDATE'
const sourceId = 'BATCH01_G1_MATH_CONTENT_EXPANSION_PENDING'
const generatedAt = '2026-09-04T00:00:00.000Z'

const kp = {
  count10: 'B01_KP_MAT_COUNT_WITHIN_10',
  compare: 'B01_KP_MAT_COMPARE_QUANTITY',
  addSub10: 'B01_KP_MAT_ADD_SUB_WITHIN_10',
  shape: 'B01_KP_MAT_SHAPE_IDENTIFY_BASIC',
} as const

const baseRecord = {
  sourceId,
  verificationStatus: 'UNVERIFIED' as const,
  isSample: true,
}

function structured(...blocks: StructuredContent['blocks']): StructuredContent {
  return { blocks }
}

function learningContent(
  knowledgePointId: string,
  lessonId: string,
  title: string,
  goals: string[],
  intro: string,
  concept: string,
): LearningContent {
  const firstBlock: LessonContentBlockRecord = {
    id: `${knowledgePointId}:learning:intro`,
    block: { type: 'TEXT', text: intro },
    stepType: 'intro',
    title: '先来认识一下',
    sort: 1,
    isSample: true,
    verificationStatus: 'UNVERIFIED',
  }
  const secondBlock: LessonContentBlockRecord = {
    id: `${knowledgePointId}:learning:concept`,
    block: { type: 'TEXT', text: concept },
    stepType: 'concept',
    title: '发现规律',
    sort: 2,
    isSample: true,
    verificationStatus: 'UNVERIFIED',
  }
  const steps: LessonStep[] = [
    {
      id: `${knowledgePointId}:learning:intro:step`,
      type: 'intro',
      title: firstBlock.title,
      contentBlockIds: [firstBlock.id],
      required: true,
      sort: 1,
    },
    {
      id: `${knowledgePointId}:learning:concept:step`,
      type: 'concept',
      title: secondBlock.title,
      contentBlockIds: [secondBlock.id],
      required: true,
      sort: 2,
    },
  ]
  return {
    id: `${knowledgePointId}:learning-content:v1`,
    lessonId,
    knowledgePointId,
    title,
    learningGoals: goals,
    steps,
    blocks: [firstBlock, secondBlock],
    sourceId,
    status: 'AI_GENERATED',
    currentVersion: 1,
    isSample: true,
    verificationStatus: 'UNVERIFIED',
    contentStatus: 'AI_GENERATED',
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }
}

function activity<T extends InteractiveActivity>(record: T): T {
  return record
}

function template<T extends ExerciseTemplate>(record: T): T {
  return record
}

function practice(
  id: string,
  knowledgePointId: string,
  title: string,
  mode: PracticeSet['mode'],
  templateIds: string[],
  targetCount: number,
  min: ActivityDifficulty,
  max: ActivityDifficulty,
): PracticeSet {
  return {
    id,
    knowledgePointId,
    title,
    mode,
    templateIds,
    targetCount,
    difficultyRange: { min, max },
    ...baseRecord,
  }
}

function extension(
  id: string,
  knowledgePointId: string,
  title: string,
  instruction: string,
  content: StructuredContent,
): ExtensionActivity {
  return { id, knowledgePointId, title, instruction, content, ...baseRecord }
}

function challenge(
  id: string,
  knowledgePointId: string,
  title: string,
  instruction: string,
  content: StructuredContent,
): Challenge {
  return { id, knowledgePointId, title, instruction, content, ...baseRecord }
}

const countActivities: InteractiveActivity[] = [
  activity({
    id: 'GOLDEN_G1_COUNT_ACTIVITY_MATCH',
    knowledgePointId: kp.count10,
    activityType: 'drag_match',
    title: '数量和数字牵手',
    instruction: '把数量和它对应的数字配在一起。',
    difficulty: 'L1',
    config: {
      sources: [
        { id: 'three', label: '● ● ●' },
        { id: 'five', label: '● ● ● ● ●' },
        { id: 'seven', label: '● ● ● ● ● ● ●' },
      ],
      targets: [
        { id: '3', label: '3' },
        { id: '5', label: '5' },
        { id: '7', label: '7' },
      ],
      matches: [
        { sourceId: 'three', targetId: '3' },
        { sourceId: 'five', targetId: '5' },
        { sourceId: 'seven', targetId: '7' },
      ],
    },
    learningGoal: '建立数量和数字之间的联系。',
    completionPolicy: 'all_items',
    ...baseRecord,
    sort: 1,
  }),
  activity({
    id: 'GOLDEN_G1_COUNT_ACTIVITY_LINE',
    knowledgePointId: kp.count10,
    activityType: 'number_line',
    title: '在数轴上找一找',
    instruction: '沿着数轴走到最后的位置。',
    difficulty: 'L2',
    config: {
      min: 0,
      max: 10,
      start: 2,
      operations: [{ direction: 'forward', steps: 4 }],
      target: 6,
    },
    learningGoal: '理解数在数轴上的位置。',
    completionPolicy: 'target_reached',
    ...baseRecord,
    sort: 2,
  }),
]

const compareActivities: InteractiveActivity[] = [
  activity({
    id: 'GOLDEN_G1_COMPARE_ACTIVITY_CLASSIFY',
    knowledgePointId: kp.compare,
    activityType: 'drag_classify',
    title: '把数量送回家',
    instruction: '看看两组数量，把它们放进合适的家。',
    difficulty: 'L2',
    config: {
      items: [
        { id: 'more', label: '左边更多' },
        { id: 'less', label: '右边更少' },
        { id: 'same', label: '两边一样多' },
      ],
      groups: [
        { id: 'more-group', label: '更多' },
        { id: 'less-group', label: '更少' },
        { id: 'same-group', label: '一样多' },
      ],
      answers: [
        { itemId: 'more', groupId: 'more-group' },
        { itemId: 'less', groupId: 'less-group' },
        { itemId: 'same', groupId: 'same-group' },
      ],
    },
    learningGoal: '用一一对应的方法比较多少。',
    completionPolicy: 'all_items',
    ...baseRecord,
    sort: 1,
  }),
  activity({
    id: 'GOLDEN_G1_COMPARE_ACTIVITY_TOWERS',
    knowledgePointId: kp.compare,
    activityType: 'simulation',
    title: '搭两座小塔',
    instruction: '观察两座塔，选择哪一座更高。',
    difficulty: 'L2',
    config: {
      templateKey: 'compare_towers',
      parameters: { leftCount: 4, rightCount: 6, target: 'right' },
    },
    learningGoal: '用数量关系表达比较结果。',
    completionPolicy: 'target_reached',
    ...baseRecord,
    sort: 2,
  }),
]

const addSubActivities: InteractiveActivity[] = [
  activity({
    id: 'GOLDEN_G1_ADDSUB_ACTIVITY_ORDER',
    knowledgePointId: kp.addSub10,
    activityType: 'sort_order',
    title: '算式小火车',
    instruction: '把数字卡片按从小到大的顺序排好。',
    difficulty: 'L2',
    config: {
      items: [
        { id: '2', label: '2' },
        { id: '5', label: '5' },
        { id: '8', label: '8' },
      ],
      correctOrder: ['2', '5', '8'],
    },
    learningGoal: '感受数量顺序，为计算做准备。',
    completionPolicy: 'all_items',
    ...baseRecord,
    sort: 1,
  }),
  activity({
    id: 'GOLDEN_G1_ADDSUB_ACTIVITY_WALK',
    knowledgePointId: kp.addSub10,
    activityType: 'simulation',
    title: '在数轴上跳一跳',
    instruction: '从起点向前跳，找到加法的结果。',
    difficulty: 'L2',
    config: {
      templateKey: 'number_line_walk',
      parameters: { min: 0, max: 10, start: 3, target: 8 },
    },
    learningGoal: '用数轴理解加法是向前走。',
    completionPolicy: 'target_reached',
    ...baseRecord,
    sort: 2,
  }),
]

const shapeActivities: InteractiveActivity[] = [
  activity({
    id: 'GOLDEN_G1_SHAPE_ACTIVITY_REGION',
    knowledgePointId: kp.shape,
    activityType: 'select_region',
    title: '找出圆形朋友',
    instruction: '在图中点出所有圆形。',
    difficulty: 'L1',
    config: {
      assetKey: 'golden-shapes-board',
      coordinateSystem: 'normalized',
      regions: [
        { id: 'circle', label: '圆形', x: 0.08, y: 0.2, width: 0.22, height: 0.32 },
        { id: 'triangle', label: '三角形', x: 0.39, y: 0.2, width: 0.22, height: 0.32 },
        { id: 'circle-small', label: '圆形', x: 0.7, y: 0.2, width: 0.2, height: 0.32 },
      ],
      targetRegionIds: ['circle', 'circle-small'],
    },
    learningGoal: '在不同位置辨认圆形。',
    completionPolicy: 'all_items',
    ...baseRecord,
    sort: 1,
  }),
  activity({
    id: 'GOLDEN_G1_SHAPE_ACTIVITY_BUILD',
    knowledgePointId: kp.shape,
    activityType: 'simulation',
    title: '搭一座形状小屋',
    instruction: '选择形状积木，想一想怎样搭得稳。',
    difficulty: 'L3',
    config: {
      templateKey: 'shape_builder',
      parameters: { targetShape: 'triangle', availablePieces: 3 },
    },
    learningGoal: '观察图形的外形特征。',
    completionPolicy: 'manual_check',
    ...baseRecord,
    sort: 2,
  }),
]

const templates: ExerciseTemplate[] = [
  template({
    id: 'GOLDEN_G1_COUNT_TEMPLATE_PICTURE',
    knowledgePointId: kp.count10,
    templateType: 'picture_count',
    difficulty: 'L1',
    config: { minCount: 1, maxCount: 10, objectLabels: ['苹果', '积木', '小球'] },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_COUNT_TEMPLATE_ORDER',
    knowledgePointId: kp.count10,
    templateType: 'number_order',
    difficulty: 'L2',
    config: { min: 0, max: 10, count: 4, direction: 'ascending' },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_COMPARE_TEMPLATE_NUMBERS',
    knowledgePointId: kp.compare,
    templateType: 'compare_numbers',
    difficulty: 'L2',
    config: { min: 0, max: 10, allowEqual: true },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_COMPARE_TEMPLATE_ORDER',
    knowledgePointId: kp.compare,
    templateType: 'number_order',
    difficulty: 'L2',
    config: { min: 1, max: 10, count: 3, direction: 'descending' },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_ADDSUB_TEMPLATE_ADD',
    knowledgePointId: kp.addSub10,
    templateType: 'addition_range',
    difficulty: 'L2',
    config: {
      minAddend: 1,
      maxAddend: 9,
      maxResult: 10,
      allowZero: false,
      noCarry: true,
      noDuplicatePair: true,
    },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_ADDSUB_TEMPLATE_SUB',
    knowledgePointId: kp.addSub10,
    templateType: 'subtraction_range',
    difficulty: 'L2',
    config: {
      minMinuend: 1,
      maxMinuend: 10,
      minSubtrahend: 1,
      maxSubtrahend: 9,
      allowZero: false,
      nonNegative: true,
      noDuplicatePair: true,
    },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_ADDSUB_TEMPLATE_MISSING',
    knowledgePointId: kp.addSub10,
    templateType: 'missing_number',
    difficulty: 'L3',
    config: { operation: 'addition', min: 1, max: 9, maxResult: 10, excludeZero: true },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_ADDSUB_TEMPLATE_WORD',
    knowledgePointId: kp.addSub10,
    templateType: 'word_problem_simple',
    difficulty: 'L3',
    config: {
      operation: 'addition',
      maxResult: 10,
      contexts: [
        { subject: '篮子里', verb: '又有' },
        { subject: '花园里', verb: '来了' },
      ],
    },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_SHAPE_TEMPLATE_EQUATION',
    knowledgePointId: kp.shape,
    templateType: 'equation_match',
    difficulty: 'L2',
    config: { maxNumber: 5, optionsPerQuestion: 3, operation: 'addition' },
    ...baseRecord,
    version: 1,
  }),
  template({
    id: 'GOLDEN_G1_SHAPE_TEMPLATE_COUNT',
    knowledgePointId: kp.shape,
    templateType: 'picture_count',
    difficulty: 'L1',
    config: { minCount: 1, maxCount: 5, objectLabels: ['圆形', '三角形'] },
    ...baseRecord,
    version: 1,
  }),
]

const practiceSets: PracticeSet[] = [
  practice(
    'GOLDEN_G1_COUNT_PRACTICE_BASIC',
    kp.count10,
    '数一数基础练习',
    'basic',
    ['GOLDEN_G1_COUNT_TEMPLATE_PICTURE'],
    12,
    'L1',
    'L2',
  ),
  practice(
    'GOLDEN_G1_COUNT_PRACTICE_REINFORCE',
    kp.count10,
    '数的顺序再练练',
    'reinforce',
    ['GOLDEN_G1_COUNT_TEMPLATE_ORDER'],
    12,
    'L2',
    'L3',
  ),
  practice(
    'GOLDEN_G1_COUNT_PRACTICE_APPLICATION',
    kp.count10,
    '生活中的数量',
    'application',
    ['GOLDEN_G1_COUNT_TEMPLATE_PICTURE'],
    6,
    'L2',
    'L3',
  ),
  practice(
    'GOLDEN_G1_COMPARE_PRACTICE_BASIC',
    kp.compare,
    '比较多少基础练习',
    'basic',
    ['GOLDEN_G1_COMPARE_TEMPLATE_NUMBERS'],
    12,
    'L1',
    'L2',
  ),
  practice(
    'GOLDEN_G1_COMPARE_PRACTICE_REINFORCE',
    kp.compare,
    '比较关系再练练',
    'reinforce',
    ['GOLDEN_G1_COMPARE_TEMPLATE_ORDER'],
    12,
    'L2',
    'L3',
  ),
  practice(
    'GOLDEN_G1_COMPARE_PRACTICE_APPLICATION',
    kp.compare,
    '小小数量调查',
    'application',
    ['GOLDEN_G1_COMPARE_TEMPLATE_NUMBERS'],
    6,
    'L2',
    'L3',
  ),
  practice(
    'GOLDEN_G1_ADDSUB_PRACTICE_BASIC',
    kp.addSub10,
    '10以内加法基础练习',
    'basic',
    ['GOLDEN_G1_ADDSUB_TEMPLATE_ADD', 'GOLDEN_G1_ADDSUB_TEMPLATE_SUB'],
    16,
    'L1',
    'L2',
  ),
  practice(
    'GOLDEN_G1_ADDSUB_PRACTICE_REINFORCE',
    kp.addSub10,
    '算式关系再练练',
    'reinforce',
    ['GOLDEN_G1_ADDSUB_TEMPLATE_MISSING'],
    14,
    'L2',
    'L3',
  ),
  practice(
    'GOLDEN_G1_ADDSUB_PRACTICE_APPLICATION',
    kp.addSub10,
    '生活里的加减',
    'application',
    ['GOLDEN_G1_ADDSUB_TEMPLATE_WORD'],
    6,
    'L3',
    'L4',
  ),
  practice(
    'GOLDEN_G1_SHAPE_PRACTICE_BASIC',
    kp.shape,
    '图形辨认基础练习',
    'basic',
    ['GOLDEN_G1_SHAPE_TEMPLATE_COUNT'],
    12,
    'L1',
    'L2',
  ),
  practice(
    'GOLDEN_G1_SHAPE_PRACTICE_REINFORCE',
    kp.shape,
    '图形特征再观察',
    'reinforce',
    ['GOLDEN_G1_SHAPE_TEMPLATE_EQUATION'],
    12,
    'L2',
    'L3',
  ),
  practice(
    'GOLDEN_G1_SHAPE_PRACTICE_APPLICATION',
    kp.shape,
    '图形就在身边',
    'application',
    ['GOLDEN_G1_SHAPE_TEMPLATE_COUNT'],
    6,
    'L3',
    'L4',
  ),
]

const extensionActivities: ExtensionActivity[] = [
  extension(
    'GOLDEN_G1_COUNT_EXTENSION',
    kp.count10,
    '整理你的玩具',
    '选一类玩具数一数，再用数字记录下来。',
    structured(
      { type: 'text', value: '我数到 ____ 个。' },
      { type: 'hint', value: '可以一边指一边数。' },
    ),
  ),
  extension(
    'GOLDEN_G1_COMPARE_EXTENSION',
    kp.compare,
    '谁的东西更多',
    '和家人找两组物品，用一一对应的方法比较。',
    structured({ type: 'text', value: '我发现 ____ 比 ____ 多（少）。' }),
  ),
  extension(
    'GOLDEN_G1_ADDSUB_EXTENSION',
    kp.addSub10,
    '小小商店',
    '用不超过10件物品摆一个小商店，讲一个合并或拿走的故事。',
    structured({ type: 'text', value: '原来有 ____，又有（拿走）____，现在有 ____。' }),
  ),
  extension(
    'GOLDEN_G1_SHAPE_EXTENSION',
    kp.shape,
    '寻找形状',
    '在教室或家里找出三种形状，画下它们的轮廓。',
    structured({ type: 'text', value: '我找到的形状有：____。' }),
  ),
]

const challenges: Challenge[] = [
  challenge(
    'GOLDEN_G1_COUNT_CHALLENGE',
    kp.count10,
    '数量小侦探',
    '不重新数，想办法判断两组物品是不是一样多。',
    structured({ type: 'text', value: '说说你的判断方法。' }),
  ),
  challenge(
    'GOLDEN_G1_COMPARE_CHALLENGE',
    kp.compare,
    '排一排',
    '把三组数量按从少到多排好，并说明你先比较了哪两组。',
    structured({ type: 'text', value: '我的顺序是：____。' }),
  ),
  challenge(
    'GOLDEN_G1_ADDSUB_CHALLENGE',
    kp.addSub10,
    '凑成10',
    '找出两种不同的加法，让结果正好是10。',
    structured({ type: 'formula', value: '____ + ____ = 10' }),
  ),
  challenge(
    'GOLDEN_G1_SHAPE_CHALLENGE',
    kp.shape,
    '图形拼拼看',
    '用两种不同的图形拼出一个新图案，并说出用了什么形状。',
    structured({ type: 'text', value: '我用了 ____ 和 ____。' }),
  ),
]

function bundle(
  knowledgePointId: string,
  unitId: string,
  lessonId: string,
  title: string,
  goals: string[],
  intro: string,
  concept: string,
  activities: InteractiveActivity[],
): ContentExpansionBundle {
  const learning = learningContent(knowledgePointId, lessonId, title, goals, intro, concept)
  return {
    knowledgePointId,
    textbookId,
    unitId,
    lessonId,
    learningContent: learning,
    activities,
    exerciseTemplates: templates.filter((item) => item.knowledgePointId === knowledgePointId),
    practiceSets: practiceSets.filter((item) => item.knowledgePointId === knowledgePointId),
    extensionActivities: extensionActivities.filter(
      (item) => item.knowledgePointId === knowledgePointId,
    ),
    challenges: challenges.filter((item) => item.knowledgePointId === knowledgePointId),
  }
}

export const goldenContentExpansionBundles: readonly ContentExpansionBundle[] = [
  bundle(
    kp.count10,
    `${textbookId}_UNIT_02`,
    `${textbookId}_UNIT_02_LESSON_01`,
    '认识并表示10以内的数',
    ['能数出10以内的数量。', '能把数量和数字对应起来。'],
    '生活里到处都有数量：桌上的积木、窗边的小球，都可以数一数。',
    '数到最后一个物品时，这个数就表示这一组物品一共有多少个。',
    countActivities,
  ),
  bundle(
    kp.compare,
    `${textbookId}_UNIT_02`,
    `${textbookId}_UNIT_02_LESSON_02`,
    '比较数量的多少',
    ['能用一一对应比较两组数量。', '能说清楚哪组多、哪组少或一样多。'],
    '两组物品排一排，就能看出它们的数量关系。',
    '一个对一个地连起来，没有伙伴的一边就是更多的一边。',
    compareActivities,
  ),
  bundle(
    kp.addSub10,
    `${textbookId}_UNIT_05`,
    `${textbookId}_UNIT_05_LESSON_01`,
    '理解并解决10以内的加减问题',
    ['能看懂合并和减少的数量关系。', '能用算式表示生活中的加减问题。'],
    '把两组物品合在一起，数量会增加；拿走一些，数量会减少。',
    '加法可以想成向前走，减法可以想成向后退，数轴能帮助我们看清变化。',
    addSubActivities,
  ),
  bundle(
    kp.shape,
    `${textbookId}_UNIT_07`,
    `${textbookId}_UNIT_07_LESSON_01`,
    '辨认常见图形并描述特征',
    ['能辨认圆形、三角形等常见图形。', '能用外形特征描述图形。'],
    '图形朋友藏在积木、窗户和玩具里，转一转、找一找。',
    '观察边和外形，就能发现不同图形的特点。',
    shapeActivities,
  ),
]

export const goldenContentExpansionActivityIds = goldenContentExpansionBundles.flatMap((bundle) =>
  bundle.activities.map((item) => item.id),
)

export const unsupportedGoldenActivity: InteractiveActivity = {
  id: 'GOLDEN_UNSUPPORTED_ACTIVITY_PLACEHOLDER',
  knowledgePointId: kp.count10,
  activityType: 'timed_challenge',
  title: '限时挑战（占位）',
  instruction: '该活动类型已经登记，等待专用渲染器。',
  difficulty: 'L4',
  config: { timeLimitSeconds: 30, prompt: '请等待专用活动渲染器。' },
  learningGoal: '验证安全的未支持类型回退。',
  completionPolicy: 'manual_check',
  ...baseRecord,
  sort: 99,
}
