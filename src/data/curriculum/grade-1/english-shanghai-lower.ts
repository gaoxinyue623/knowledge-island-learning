import type {
  ContentSource,
  CourseContent,
  Grade,
  KnowledgePoint,
  KnowledgePrerequisite,
  Lesson,
  LessonKnowledgePointRelation,
  Publisher,
  Region,
  RegionTextbookRelation,
  Semester,
  Subject,
  TextbookVersion,
  Unit,
} from '@/types'

import {
  G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
  G1_SHENZHEN_ENGLISH_SUBJECT_ID,
  G1_SHENZHEN_REGION_ID,
  gradeOneShanghaiEnglishPublisher,
  gradeOneShenzhenEnglishUpperGrade,
  gradeOneShenzhenEnglishUpperRegions,
  gradeOneShenzhenEnglishUpperSubject,
} from './english-shanghai-upper'

/**
 * Grade 1 Shenzhen Shanghai-English lower-volume candidate curriculum.
 * The supplied bilingual text is attached to CourseContent; map identities
 * remain stable lesson-level knowledge points.
 */
export const G1_SHENZHEN_ENGLISH_S2_DIRECTORY_SOURCE_ID = 'G1_SHENZHEN_ENGLISH_S2_DIRECTORY_TEXT'
export const G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID = 'G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_CONTENT'
export const G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID = 'G1_SHENZHEN_SHANGHAI_ENGLISH_S2_2024_CANDIDATE'
export const G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID = 'SEMESTER_LOWER'

const TIMESTAMP = '2026-09-04T00:00:00+08:00'
const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeOneShenzhenEnglishLowerCurriculumData {
  grade: Grade
  semester: Semester
  subject: Subject
  sources: ContentSource[]
  regions: Region[]
  publishers: Publisher[]
  textbooks: TextbookVersion[]
  regionTextbookRelations: RegionTextbookRelation[]
  units: Unit[]
  lessons: Lesson[]
  knowledgePoints: KnowledgePoint[]
  lessonKnowledgePointRelations: LessonKnowledgePointRelation[]
  knowledgePrerequisites: KnowledgePrerequisite[]
  courseContents: CourseContent[]
}

export const gradeOneShenzhenEnglishLowerGrade = gradeOneShenzhenEnglishUpperGrade

export const gradeOneShenzhenEnglishLowerSemester: Semester = {
  id: G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
  code: 'LOWER',
  name: '下册',
  sortOrder: 2,
  status: 'ACTIVE',
}

export const gradeOneShenzhenEnglishLowerSubject = gradeOneShenzhenEnglishUpperSubject
export const gradeOneShenzhenEnglishLowerRegions = gradeOneShenzhenEnglishUpperRegions
export const gradeOneShenzhenEnglishLowerPublishers: Publisher[] = [
  gradeOneShanghaiEnglishPublisher,
]

export const gradeOneShenzhenEnglishLowerSources: ContentSource[] = [
  {
    id: G1_SHENZHEN_ENGLISH_S2_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的深圳专用英语一年级下册目录与课程结构文本',
    publisher: '上海教育出版社',
    edition: '牛津上海版 / 深圳用 / 一年级下册（2024 新版）',
    sourceRef: 'user-provided://g1-shenzhen-shanghai-english-lower-table-of-contents',
    sourceVersion: 'USER_PROVIDED_SHENZHEN_ENGLISH_LOWER_DIRECTORY_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供内容，仅用于本地个人开发；未提供公开再分发授权。',
    attribution: '用户在本轮提供的深圳专用一年级下册英语课程文本',
    notes: '用于建立深圳市英语下册候选课程结构，不代表已完成出版物授权或外部版权核验。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的深圳专用英语一年级下册完整课程文本',
    publisher: '上海教育出版社',
    edition: '牛津上海版 / 深圳用 / 一年级下册（2024 新版）',
    sourceRef: 'user-provided://g1-shenzhen-shanghai-english-lower-full-text',
    sourceVersion: 'USER_PROVIDED_SHENZHEN_ENGLISH_LOWER_FULL_TEXT_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: '用户在本轮提供的深圳专用一年级下册英语完整课程文本',
    notes:
      'Ready-Go、Chant、Story、单词和中文提示作为本地课程内容进入详情页；内部审计字段继续保留。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeOneShenzhenEnglishLowerTextbooks: TextbookVersion[] = [
  {
    id: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
    subjectId: G1_SHENZHEN_ENGLISH_SUBJECT_ID,
    gradeId: gradeOneShenzhenEnglishLowerGrade.id,
    semesterId: G1_SHENZHEN_ENGLISH_S2_SEMESTER_ID,
    publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
    versionName: '沪教版（牛津上海版）英语一年级下册（2024 新版·深圳用）',
    editionYear: 2024,
    curriculumStandard: '义务教育英语课程标准（2022 年版）',
    sourceId: G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
]

export const gradeOneShenzhenEnglishLowerRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G1_SHENZHEN_ENGLISH_S2_REGION_SHENZHEN',
    regionId: G1_SHENZHEN_REGION_ID,
    textbookVersionId: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2024-09-01',
    sourceId: G1_SHENZHEN_ENGLISH_S2_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
]

interface EnglishVocabularyWord {
  english: string
  chinese: string
}

interface EnglishLessonDefinition {
  title: string
  text: string
  words: EnglishVocabularyWord[]
  sentencePattern: string
  sentencePrompt: string
  sentenceAnswer: string
}

interface EnglishModuleDefinition {
  key: string
  title: string
  subtitle: string
  lessons: EnglishLessonDefinition[]
}

const lesson = (
  title: string,
  text: string,
  words: EnglishVocabularyWord[],
  sentencePattern: string,
  sentencePrompt: string,
  sentenceAnswer: string,
): EnglishLessonDefinition => ({
  title,
  text: text.trim(),
  words,
  sentencePattern,
  sentencePrompt,
  sentenceAnswer,
})

const modules: EnglishModuleDefinition[] = [
  {
    key: 'module-01',
    title: 'Module 1 Using my five senses · 运用五官',
    subtitle: '观察动物、教室和食物，练习看、尝和闻的英语表达。',
    lessons: [
      lesson(
        'Unit 1 Look and see · 看一看',
        String.raw`
Ready-Go
Listen, then point and say
1. I see a frog. 我看见一只青蛙。
2. I see a butterfly. 我看见一只蝴蝶。
3. I see a duck. 我看见一只鸭子。
4. I see a goldfish. 我看见一条金鱼。
5. I see a tortoise. 我看见一只乌龟。

—What do you see? 你看见了什么？
—I see a frog. 我看见一只青蛙。

Listen and chant
Frog, frog. Jump, jump, jump.
Butterfly, butterfly. Fly, fly, fly.
Duck, duck. Swim, swim, swim.
Goldfish, goldfish. Swim with me.
翻译：
青蛙，青蛙。跳，跳，跳。
蝴蝶，蝴蝶。飞，飞，飞。
鸭子，鸭子。游，游，游。
金鱼，金鱼。和我一起游。

Story：Little Tadpole 小蝌蚪
Tadpole: Hello, Goldfish. How are you?
小蝌蚪：你好，金鱼。你好吗？
Goldfish: I’m fine. Thank you.
金鱼：我很好，谢谢你。
Tadpole: Hello, Tortoise. How are you?
小蝌蚪：你好，乌龟。你好吗？
Tortoise: I’m fine. Thank you.
乌龟：我很好，谢谢你。
Tadpole: I’m little Tadpole in the pond. Happy every day!
小蝌蚪：我是池塘里的小蝌蚪，天天开心！

单词：frog青蛙，butterfly蝴蝶，duck鸭子，goldfish金鱼，tortoise乌龟`,
        [
          { english: 'frog', chinese: '青蛙' },
          { english: 'butterfly', chinese: '蝴蝶' },
          { english: 'duck', chinese: '鸭子' },
          { english: 'goldfish', chinese: '金鱼' },
          { english: 'tortoise', chinese: '乌龟' },
        ],
        'What do you see? I see a ...',
        '用 “What do you see?” 和 “I see a ...” 介绍你看见的一种动物。',
        'What do you see? I see a frog.',
      ),
      lesson(
        'Unit 2 What do we do in the classroom? · 教室里做什么',
        String.raw`
Ready-Go
Listen, then point and say
1. This is a window. 这是一扇窗户。
2. This is a door. 这是一扇门。
3. This is a blackboard. 这是一块黑板。
4. This is a desk. 这是一张书桌。
5. This is a chair. 这是一把椅子。
6. This is a schoolbag. 这是一个书包。

Open the door. 打开门。
Close the window. 关上窗户。

Listen and chant
Window, window. Open the window.
Door, door. Close the door.
Desk, desk. Clean the desk.
Chair, chair. Sit on the chair.
翻译：
窗户，窗户。打开窗户。
门，门。关上门。
书桌，书桌。擦书桌。
椅子，椅子。坐在椅子上。

Story：Leon in the classroom 里昂在教室
Ted: Where’s Leon? Let’s find him, Emily.
泰德：里昂在哪里？艾米丽，我们去找他。
Emily: Close the door, please. Look at this schoolbag. Is Leon in it?
艾米丽：请关上门。看这个书包，里昂在里面吗？
Ted: No. Put the schoolbag in the desk.
泰德：不在。把书包放进书桌。
Emily: Clean the blackboard, please.
艾米丽：请擦黑板。
Ted: OK.
泰德：好的。
Emily: Oh no! It’s my picture.
艾米丽：哦不！那是我的画。
Ted: Oh, sorry. Don’t draw on the blackboard, please.
泰德：哦对不起，请不要在黑板上画画。

单词：window窗户，door门，blackboard黑板，desk书桌，chair椅子，schoolbag书包，open打开，close关上`,
        [
          { english: 'window', chinese: '窗户' },
          { english: 'door', chinese: '门' },
          { english: 'blackboard', chinese: '黑板' },
          { english: 'desk', chinese: '书桌' },
          { english: 'chair', chinese: '椅子' },
          { english: 'schoolbag', chinese: '书包' },
          { english: 'open', chinese: '打开' },
          { english: 'close', chinese: '关上' },
        ],
        'This is a ... / Open ... / Close ...',
        '用 “This is a ...” 介绍教室里的物品，再用英语说一个简单指令。',
        'This is a window. Open the window.',
      ),
      lesson(
        'Unit 3 Taste and smell · 尝一尝，闻一闻',
        String.raw`
Ready-Go
Listen, then point and say
1. It’s sweet. 它甜甜的。
2. It’s sour. 它酸酸的。
3. It’s salty. 它咸咸的。
4. It’s yummy. 它很美味。

—Taste it. How is it? 尝一尝。味道怎么样？
—It’s sweet. 甜甜的。

Listen and chant
Sweet, sweet. Yummy sweet.
Sour, sour. Nice and sour.
Salty, salty. Good to eat.
Taste the food, yummy treat.
翻译：
甜，甜。甜甜的真好吃。
酸，酸。酸酸的真不错。
咸，咸。吃起来真好。
尝尝食物，美味佳肴。

Story：Tasty fruit 美味的水果
Mum: Taste this apple. How is it?
妈妈：尝尝这个苹果，味道怎么样？
Kid: It’s sweet!
孩子：甜甜的！
Mum: Smell the lemon.
妈妈：闻闻柠檬。
Kid: It’s sour!
孩子：酸酸的！
Mum: Great!
妈妈：太棒啦！

单词：taste尝，smell闻，sweet甜，sour酸，salty咸，yummy美味的`,
        [
          { english: 'taste', chinese: '尝' },
          { english: 'smell', chinese: '闻' },
          { english: 'sweet', chinese: '甜' },
          { english: 'sour', chinese: '酸' },
          { english: 'salty', chinese: '咸' },
          { english: 'yummy', chinese: '美味的' },
        ],
        'Taste it. How is it? It’s ...',
        '用 “Taste it. How is it?” 和 “It’s ...” 介绍一种食物的味道。',
        'Taste it. How is it? It’s sweet.',
      ),
      lesson(
        'Revision 1 · 复习1',
        String.raw`
Revision 1 复习1
复习 Module 1：动物、教室物品、五官感受和核心句型。`,
        [
          { english: 'frog', chinese: '青蛙' },
          { english: 'window', chinese: '窗户' },
          { english: 'sweet', chinese: '甜' },
          { english: 'duck', chinese: '鸭子' },
        ],
        'I see a ... / This is a ... / It’s ...',
        '选择一种动物、教室物品或味道，用本模块学过的英语句型介绍。',
        'I see a duck. It’s sweet.',
      ),
    ],
  },
  {
    key: 'module-02',
    title: 'Module 2 My favourite things · 我最喜欢的事物',
    subtitle: '介绍喜欢的玩具、食物和饮品，练习表达个人喜好。',
    lessons: [
      lesson(
        'Unit 4 Toys I like · 我喜欢的玩具',
        String.raw`
Ready-Go
Listen, then point and say
1. a ball 一个球
2. a doll 一个洋娃娃
3. a kite 一只风筝
4. a bicycle 一辆自行车

—I like the ball. 我喜欢球。
—I like the doll. 我喜欢洋娃娃。

Listen and chant
Ball, ball. Bounce the ball.
Doll, doll. Hug the doll.
Kite, kite. Fly the kite.
Bicycle, bicycle. Ride the bicycle.
翻译：
球，球。拍皮球。
娃娃，娃娃。抱抱娃娃。
风筝，风筝。放风筝。
自行车，自行车。骑自行车。

Story：At the toy shop 在玩具店
Girl: I like this kite.
女孩：我喜欢这只风筝。
Shopkeeper: Here you are.
店员：给你。
Girl: Thank you.
女孩：谢谢你。
Boy: I like my bicycle.
男孩：我喜欢我的自行车。

单词：ball球，doll洋娃娃，kite风筝，bicycle自行车`,
        [
          { english: 'ball', chinese: '球' },
          { english: 'doll', chinese: '洋娃娃' },
          { english: 'kite', chinese: '风筝' },
          { english: 'bicycle', chinese: '自行车' },
        ],
        'I like the ...',
        '用 “I like the ...” 介绍你喜欢的一种玩具。',
        'I like the kite.',
      ),
      lesson(
        'Unit 5 Food I like · 我喜欢的食物',
        String.raw`
Ready-Go
Listen, then point and say
1. rice 米饭
2. noodles 面条
3. egg 鸡蛋
4. biscuit 饼干
5. jelly 果冻

—What food do you like? 你喜欢什么食物？
—I like noodles. 我喜欢面条。

Listen and chant
Rice, rice. Yum-yum rice.
Noodles, noodles. Nice noodles.
Egg, egg. Yummy egg.
Biscuit, biscuit. Crunchy biscuit.
翻译：
米饭，米饭。香香米饭。
面条，面条。好吃面条。
鸡蛋，鸡蛋。美味鸡蛋。
饼干，饼干。脆脆饼干。

Story：Lunch time 午餐时间
Mum: Have some rice.
妈妈：吃点米饭。
Kid: Thank you. I like rice.
孩子：谢谢，我喜欢米饭。
Mum: Have some noodles.
妈妈：吃点面条。
Kid: Great!
孩子：太棒了！

单词：rice米饭，noodles面条，egg鸡蛋，biscuit饼干，jelly果冻`,
        [
          { english: 'rice', chinese: '米饭' },
          { english: 'noodles', chinese: '面条' },
          { english: 'egg', chinese: '鸡蛋' },
          { english: 'biscuit', chinese: '饼干' },
          { english: 'jelly', chinese: '果冻' },
        ],
        'What food do you like? I like ...',
        '用 “What food do you like?” 和 “I like ...” 介绍你喜欢的食物。',
        'What food do you like? I like noodles.',
      ),
      lesson(
        'Unit 6 Drinks I like · 我喜欢的饮品',
        String.raw`
Ready-Go
Listen, then point and say
1. water 水
2. juice 果汁
3. milk 牛奶
4. cola 可乐

—What drink do you like? 你喜欢喝什么？
—I like milk. 我喜欢牛奶。

Listen and chant
Water, water. Drink some water.
Juice, juice. Sweet juice.
Milk, milk. Fresh milk.
Cola, cola. Cold cola.
翻译：
水，水。喝点水。
果汁，果汁。甜甜的果汁。
牛奶，牛奶。新鲜牛奶。
可乐，可乐。冰可乐。

Story：Drink time 喝水时间
Dad: Some juice for you.
爸爸：给你果汁。
Kid: Thank you. I like juice.
孩子：谢谢，我喜欢果汁。
Dad: Drink some water, too.
爸爸：也要喝点水。

单词：water水，juice果汁，milk牛奶，cola可乐`,
        [
          { english: 'water', chinese: '水' },
          { english: 'juice', chinese: '果汁' },
          { english: 'milk', chinese: '牛奶' },
          { english: 'cola', chinese: '可乐' },
        ],
        'What drink do you like? I like ...',
        '用 “What drink do you like?” 和 “I like ...” 介绍你喜欢的饮品。',
        'What drink do you like? I like milk.',
      ),
      lesson(
        'Revision 2 · 复习2',
        String.raw`
Revision 2 复习2
复习 Module 2：玩具、食物、饮品和核心句型。`,
        [
          { english: 'ball', chinese: '球' },
          { english: 'noodles', chinese: '面条' },
          { english: 'milk', chinese: '牛奶' },
          { english: 'kite', chinese: '风筝' },
        ],
        'I like ... / What food do you like? / What drink do you like?',
        '选择一种玩具、食物或饮品，用英语介绍自己的喜好。',
        'I like the ball. I like milk.',
      ),
    ],
  },
  {
    key: 'module-03',
    title: 'Module 3 Things around us · 我们周围的事物',
    subtitle: '认识季节、天气和衣物，学习描述周围的变化。',
    lessons: [
      lesson(
        'Unit 7 Seasons · 季节',
        String.raw`
Ready-Go
Listen, then point and say
1. spring 春天
2. summer 夏天
3. autumn 秋天
4. winter 冬天

—What season is it? 这是什么季节？
—It’s spring. 是春天。

Listen and chant
Spring, spring. Flowers are bright.
Summer, summer. Hot and sunny.
Autumn, autumn. Leaves fall down.
Winter, winter. Cold all around.
翻译：
春天，春天。花儿朵朵艳。
夏天，夏天。炎热阳光足。
秋天，秋天。树叶落下来。
冬天，冬天。到处冷冰冰。

Story：Four seasons 四季
Spring: I’m spring. I bring pretty flowers.
春天：我是春天，我带来漂亮的花。
Summer: I’m summer. It is hot. We can swim.
夏天：我是夏天，天气很热，我们可以游泳。
Autumn: I’m autumn. Leaves turn yellow.
秋天：我是秋天，树叶变黄。
Winter: I’m winter. It is cold.
冬天：我是冬天，天气寒冷。

单词：spring春天，summer夏天，autumn秋天，winter冬天`,
        [
          { english: 'spring', chinese: '春天' },
          { english: 'summer', chinese: '夏天' },
          { english: 'autumn', chinese: '秋天' },
          { english: 'winter', chinese: '冬天' },
        ],
        'What season is it? It’s ...',
        '用 “What season is it?” 和 “It’s ...” 介绍一个季节。',
        'What season is it? It’s spring.',
      ),
      lesson(
        'Unit 8 Weather · 天气',
        String.raw`
Ready-Go
Listen, then point and say
1. sunny 晴朗的
2. cloudy 多云的
3. rainy 下雨的
4. windy 刮风的

—How’s the weather? 天气怎么样？
—It’s sunny. 天气晴朗。

Listen and chant
Sunny, sunny. Sun is bright.
Cloudy, cloudy. Grey sky.
Rainy, rainy. Pitter-patter rain.
Windy, windy. Wind blows high.
翻译：
晴天，晴天。太阳亮亮。
多云，多云。天空灰灰。
下雨，下雨。雨点滴滴答。
刮风，刮风。风儿高高吹。

Story：A nice day 美好的一天
Kid: How’s the weather?
孩子：天气怎么样？
Mum: It’s windy. Let’s fly a kite.
妈妈：有风，我们去放风筝。
Kid: Hooray!
孩子：太棒啦！

单词：sunny晴朗，cloudy多云，rainy下雨，windy刮风`,
        [
          { english: 'sunny', chinese: '晴朗' },
          { english: 'cloudy', chinese: '多云' },
          { english: 'rainy', chinese: '下雨' },
          { english: 'windy', chinese: '刮风' },
        ],
        'How’s the weather? It’s ...',
        '用 “How’s the weather?” 和 “It’s ...” 介绍今天的天气。',
        'How’s the weather? It’s sunny.',
      ),
      lesson(
        'Unit 9 Clothes · 衣服',
        String.raw`
Ready-Go
Listen, then point and say
1. T-shirt T恤衫
2. dress 连衣裙
3. shorts 短裤
4. blouse 女式衬衫

—I need a T-shirt. 我需要一件T恤衫。
—I need a dress. 我需要一条连衣裙。

Listen and chant
T-shirt, T-shirt. Wear my T-shirt.
Dress, dress. Pretty dress.
Shorts, shorts. Cool shorts.
Blouse, blouse. Nice blouse.
翻译：
T恤衫，T恤衫。穿上我的T恤衫。
连衣裙，连衣裙。漂亮连衣裙。
短裤，短裤。凉凉的短裤。
衬衫，衬衫。好看的衬衫。

Story：Shopping for clothes 买衣服
Girl: Mum, I need a new dress.
女孩：妈妈，我想要一条新连衣裙。
Mum: OK. Here you are.
妈妈：好的，给你。
Girl: Thank you. It’s nice.
女孩：谢谢，真好看。

单词：T-shirtT恤，dress连衣裙，shorts短裤，blouse女衬衫，need需要`,
        [
          { english: 'T-shirt', chinese: 'T恤' },
          { english: 'dress', chinese: '连衣裙' },
          { english: 'shorts', chinese: '短裤' },
          { english: 'blouse', chinese: '女衬衫' },
          { english: 'need', chinese: '需要' },
        ],
        'I need a ...',
        '用 “I need a ...” 介绍你需要的一件衣服。',
        'I need a dress.',
      ),
      lesson(
        'Revision 3 · 复习3',
        String.raw`
Revision 3 复习3
复习 Module 3：季节、天气、衣物和核心句型。`,
        [
          { english: 'spring', chinese: '春天' },
          { english: 'sunny', chinese: '晴朗' },
          { english: 'dress', chinese: '连衣裙' },
          { english: 'windy', chinese: '刮风' },
        ],
        'It’s ... / How’s the weather? / I need a ...',
        '选择一个季节、天气或衣物，用英语完整介绍。',
        'It’s sunny. I need a dress.',
      ),
    ],
  },
  {
    key: 'module-04',
    title: 'Module 4 Things we enjoy · 我们喜爱的活动',
    subtitle: '表达喜欢的活动，认识新年和故事中的人物。',
    lessons: [
      lesson(
        'Unit 10 Activities · 活动',
        String.raw`
Ready-Go
Listen, then point and say
1. run 跑
2. jump 跳
3. hop 单脚跳
4. skip 跳绳

—What can you do? 你会做什么？
—I can run. 我会跑。

Listen and chant
Run, run. Run so fast.
Jump, jump. Jump and blast.
Hop, hop. Hop along.
Skip, skip. Skip and song.
翻译：
跑，跑。跑得飞快。
跳，跳。高高跳起。
单脚跳，单脚跳。一路蹦跳。
跳绳，跳绳。边跳边唱。

Story：Playground fun 操场欢乐时光
Children: Run! Jump! Hop! Skip! Hooray!
孩子们：跑！跳！单脚跳！跳绳！太棒啦！

单词：run跑，jump跳，hop单脚跳，skip跳绳`,
        [
          { english: 'run', chinese: '跑' },
          { english: 'jump', chinese: '跳' },
          { english: 'hop', chinese: '单脚跳' },
          { english: 'skip', chinese: '跳绳' },
        ],
        'What can you do? I can ...',
        '用 “What can you do?” 和 “I can ...” 介绍你会做的活动。',
        'What can you do? I can run.',
      ),
      lesson(
        'Unit 11 New Year’s Day · 新年',
        String.raw`
Ready-Go
Listen, then point and say
1. gift 礼物
2. card 贺卡
3. firework 烟花
4. firecracker 鞭炮

—Happy New Year! 新年快乐！
—Happy New Year! 新年快乐！

Listen and chant
New Year, New Year. Happy New Year.
Gift for you, card for me.
Fireworks bright, what a cheer!
Happy, happy New Year!
翻译：
新年，新年。新年快乐。
礼物送给你，贺卡送给我。
烟花闪闪亮，多热闹！
开开心心过新年！

Story：Happy New Year 新年快乐
Kid: Happy New Year!
孩子：新年快乐！
Grandpa: Happy New Year! A gift for you.
爷爷：新年快乐！送你一份礼物。
Kid: Thank you!
孩子：谢谢您！

单词：gift礼物，card贺卡，firework烟花，firecracker鞭炮`,
        [
          { english: 'gift', chinese: '礼物' },
          { english: 'card', chinese: '贺卡' },
          { english: 'firework', chinese: '烟花' },
          { english: 'firecracker', chinese: '鞭炮' },
        ],
        'Happy New Year!',
        '用 “Happy New Year!” 向家人或朋友送上新年祝福。',
        'Happy New Year! A gift for you.',
      ),
      lesson(
        'Unit 12 A boy and a wolf · 男孩和狼',
        String.raw`
Ready-Go
Listen, then point and say
wolf狼，boy男孩，sheep绵羊，help帮助

Listen and chant
Wolf, wolf. Big bad wolf.
Boy, boy. Little boy.
Sheep, sheep. Sleep, sleep.
Help, help! Help me please!
翻译：
狼，狼。坏大灰狼。
男孩，男孩。小小男孩。
绵羊，绵羊。睡呀睡。
救命，救命！请帮帮我！

Story：A boy and a wolf 男孩和狼
Boy: Wolf! Wolf! Help! Help!
男孩：狼！狼！救命！救命！
Villagers: Where is the wolf?
村民：狼在哪里？
Boy: Ha-ha! No wolf.
男孩：哈哈，没有狼。
Wolf: Woof-woof!
狼：嗷呜！
Boy: Help! Help!
男孩：救命！救命！

单词：wolf狼，boy男孩，sheep绵羊，help帮助`,
        [
          { english: 'wolf', chinese: '狼' },
          { english: 'boy', chinese: '男孩' },
          { english: 'sheep', chinese: '绵羊' },
          { english: 'help', chinese: '帮助' },
        ],
        'Wolf! Help! Help me please!',
        '用角色扮演的方式说出故事中的求助句子，并介绍故事人物。',
        'Wolf! Help! Help me please!',
      ),
      lesson(
        'Revision 4 · 复习4',
        String.raw`
Revision 4 复习4
复习 Module 4：活动、新年、故事人物和核心表达。`,
        [
          { english: 'run', chinese: '跑' },
          { english: 'gift', chinese: '礼物' },
          { english: 'wolf', chinese: '狼' },
          { english: 'help', chinese: '帮助' },
        ],
        'I can ... / Happy New Year! / Help me please!',
        '选择一个活动、节日物品或故事人物，用英语完整介绍或表达。',
        'I can jump. Happy New Year!',
      ),
    ],
  },
]

const gradeOneShenzhenEnglishLowerAppendix = String.raw`
附录
Letters 字母表 Aa-Zz
Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz

Picture Dictionary 图片词典
动物：frog青蛙，butterfly蝴蝶，duck鸭子，goldfish金鱼，tortoise乌龟，wolf狼，sheep绵羊。
教室物品：window窗户，door门，blackboard黑板，desk书桌，chair椅子，schoolbag书包。
感官味道：taste尝，smell闻，sweet甜，sour酸，salty咸，yummy美味的。
玩具：ball球，doll洋娃娃，kite风筝，bicycle自行车。
食物：rice米饭，noodles面条，egg鸡蛋，biscuit饼干，jelly果冻。
饮品：water水，juice果汁，milk牛奶，cola可乐。
季节天气：spring春天，summer夏天，autumn秋天，winter冬天，sunny晴朗，cloudy多云，rainy下雨，windy刮风。
衣物：T-shirtT恤，dress连衣裙，shorts短裤，blouse女衬衫。
动作：run跑，jump跳，hop单脚跳，skip跳绳。
新年：gift礼物，card贺卡，firework烟花，firecracker鞭炮。`

const unitRecords: Unit[] = modules.map((module, index) => ({
  id: `G1_SHENZHEN_ENGLISH_S2_${module.key.toUpperCase().replaceAll('-', '_')}`,
  textbookVersionId: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
  code: `G1_SHENZHEN_ENGLISH_S2_${module.key.toUpperCase().replaceAll('-', '_')}`,
  title: module.title,
  subtitle: module.subtitle,
  sortOrder: index + 1,
  sceneKey: `g1-shenzhen-english-lower-${module.key}`,
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_ENGLISH_S2_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRows = modules.flatMap((module, moduleIndex) => {
  const unitRecord = unitRecords[moduleIndex]
  if (!unitRecord) throw new Error(`G1_SHENZHEN_ENGLISH_LOWER_MODULE_MISSING:${module.key}`)
  return module.lessons.map((definition, lessonIndex) => ({
    definition,
    unitRecord,
    lessonIndex,
  }))
})

const lessonRecords: Lesson[] = lessonRows.map(
  ({ definition, unitRecord, lessonIndex }, index) => ({
    id: `G1_SHENZHEN_ENGLISH_S2_LESSON_${String(index + 1).padStart(2, '0')}`,
    unitId: unitRecord.id,
    code: `G1_SHENZHEN_ENGLISH_S2_LESSON_${String(index + 1).padStart(2, '0')}`,
    title: definition.title,
    sortOrder: lessonIndex + 1,
    status: 'ACTIVE',
    sourceId: G1_SHENZHEN_ENGLISH_S2_DIRECTORY_SOURCE_ID,
    ...UNVERIFIED,
  }),
)

const knowledgePointRecords: KnowledgePoint[] = lessonRows.map(({ definition }, index) => ({
  id: `G1_SHENZHEN_ENGLISH_S2_KP_${String(index + 1).padStart(2, '0')}`,
  code: `EN-G1-S2-${String(index + 1).padStart(2, '0')}`,
  name: `${definition.title} · 学习要点`,
  subjectId: G1_SHENZHEN_ENGLISH_SUBJECT_ID,
  gradeScope: {
    minGrade: 1,
    maxGrade: 1,
    explicitGradeIds: [gradeOneShenzhenEnglishLowerGrade.id],
  },
  description: `围绕${definition.title}学习生活中的英语词汇和基础交流句型，练习听读、拼写与口头介绍。`,
  learningObjective: [
    `能听读并认读${definition.title}中的核心单词。`,
    `能用“${definition.sentencePattern}”完成简单的英语介绍或问答。`,
  ],
  abilityTags: ['词汇认读', '单词拼写', '句子介绍', '听读表达', 'g1-english'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeOneShenzhenEnglishLowerLessons: Lesson[] = lessonRecords
export const gradeOneShenzhenEnglishLowerKnowledgePoints: KnowledgePoint[] = knowledgePointRecords

export const gradeOneShenzhenEnglishLowerLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G1_SHENZHEN_ENGLISH_S2_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeOneShenzhenEnglishLowerKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G1_SHENZHEN_ENGLISH_S2_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

function vocabularyText(definition: EnglishLessonDefinition): string {
  return definition.words.map((word) => `${word.english}（${word.chinese}）`).join('、')
}

export const gradeOneShenzhenEnglishLowerCourseContents: CourseContent[] = lessonRows.map(
  ({ definition }, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G1_SHENZHEN_ENGLISH_LOWER_LESSON_CONTENT_MISSING:${index}`)

    const bodyText = [
      definition.title,
      '',
      definition.text,
      '',
      `核心单词：${vocabularyText(definition)}`,
      `核心句型：${definition.sentencePattern}`,
    ].join('\n')

    return {
      id: `G1_SHENZHEN_ENGLISH_S2_CONTENT_${String(index + 1).padStart(2, '0')}`,
      knowledgePointId,
      title: definition.title,
      contentType: 'TEXTBOOK',
      contentFormat: 'TEXT',
      body: {
        lessonId,
        sourceScope: 'USER_PROVIDED_LOCAL',
        summary: `围绕${definition.title}学习生活中的英语词汇和基础交流句型，练习听读、拼写与口头介绍。`,
        learningGoals: [
          `能听读并认读${definition.title}中的核心单词。`,
          `能用“${definition.sentencePattern}”完成简单的英语介绍或问答。`,
        ],
        focus: ['词汇认读', '单词拼写', '句子介绍', '听读表达'],
        activity: `先跟读${definition.title}，再完成单词拼写和句子介绍。`,
        blocks: [
          { type: 'TEXT' as const, text: bodyText },
          ...(index === lessonRows.length - 1
            ? [{ type: 'TEXT' as const, text: gradeOneShenzhenEnglishLowerAppendix }]
            : []),
          {
            type: 'TEXT' as const,
            text: `课后练习：单词拼写：根据中文提示写出本课单词；句子介绍：${definition.sentencePrompt}`,
          },
        ],
      },
      difficulty: 'FOUNDATION',
      sourceId: G1_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
      needsVerification: true,
      status: 'DRAFT',
      currentVersion: 1,
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    }
  },
)

export const gradeOneShenzhenEnglishLowerCurriculum: GradeOneShenzhenEnglishLowerCurriculumData = {
  grade: gradeOneShenzhenEnglishLowerGrade,
  semester: gradeOneShenzhenEnglishLowerSemester,
  subject: gradeOneShenzhenEnglishLowerSubject,
  sources: gradeOneShenzhenEnglishLowerSources,
  regions: gradeOneShenzhenEnglishLowerRegions,
  publishers: gradeOneShenzhenEnglishLowerPublishers,
  textbooks: gradeOneShenzhenEnglishLowerTextbooks,
  regionTextbookRelations: gradeOneShenzhenEnglishLowerRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeOneShenzhenEnglishLowerLessons,
  knowledgePoints: gradeOneShenzhenEnglishLowerKnowledgePoints,
  lessonKnowledgePointRelations: gradeOneShenzhenEnglishLowerLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeOneShenzhenEnglishLowerKnowledgePrerequisites,
  courseContents: gradeOneShenzhenEnglishLowerCourseContents,
}

export type ShenzhenEnglishLowerLessonPracticeDefinition = EnglishLessonDefinition
export const gradeOneShenzhenEnglishLowerLessonPracticeDefinitions = modules.flatMap(
  (module) => module.lessons,
)
