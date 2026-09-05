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
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  gradeOneChineseUpperGrade,
  gradeOneChineseUpperSemester,
} from './chinese-pep-upper'

/**
 * Grade 1 Shenzhen Shanghai-English upper-volume candidate curriculum.
 * Module records become knowledge islands; Unit and Revision records become
 * the map's learning nodes. The supplied bilingual lesson text lives only in
 * course content, not in the knowledge-point records.
 */
export const G1_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID = 'G1_SHENZHEN_ENGLISH_S1_DIRECTORY_TEXT'
export const G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID = 'G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_CONTENT'
export const G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID = 'G1_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE'
export const G1_SHENZHEN_REGION_ID = 'G1_REGION_SHENZHEN'
export const G1_SHENZHEN_ENGLISH_GRADE_ID = G1_PEP_CHINESE_GRADE_ID
export const G1_SHENZHEN_ENGLISH_SEMESTER_ID = 'SEMESTER_UPPER'
export const G1_SHENZHEN_ENGLISH_SUBJECT_ID = 'SUBJECT_ENGLISH'
export const G1_SHANGHAI_ENGLISH_PUBLISHER_ID = 'G1_SHANGHAI_ENGLISH_PUBLISHER'

const TIMESTAMP = '2026-09-04T00:00:00+08:00'
const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeOneShenzhenEnglishUpperCurriculumData {
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

export const gradeOneShenzhenEnglishUpperGrade = gradeOneChineseUpperGrade
export const gradeOneShenzhenEnglishUpperSemester = gradeOneChineseUpperSemester

export const gradeOneShenzhenEnglishUpperSubject: Subject = {
  id: G1_SHENZHEN_ENGLISH_SUBJECT_ID,
  code: 'ENGLISH',
  name: '英语',
  themeKey: 'ENGLISH',
  status: 'ACTIVE',
}

export const gradeOneShenzhenRegion: Region = {
  id: G1_SHENZHEN_REGION_ID,
  code: 'CN-GD-SZ',
  name: '深圳市',
  parentRegionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  level: 'CITY',
  status: 'ACTIVE',
  verificationStatus: 'UNVERIFIED',
}

export const gradeOneShenzhenEnglishUpperRegions: Region[] = [gradeOneShenzhenRegion]

export const gradeOneShanghaiEnglishPublisher: Publisher = {
  id: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
  code: 'SHANGHAI_EDUCATION_PRESS',
  name: '沪教版',
  shortName: '沪教版',
  officialName: '上海教育出版社（牛津上海版）',
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}

export const gradeOneShenzhenEnglishUpperPublishers: Publisher[] = [
  gradeOneShanghaiEnglishPublisher,
]

export const gradeOneShenzhenEnglishUpperSources: ContentSource[] = [
  {
    id: G1_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的牛津上海版（深圳用）一年级上册英语目录与课程结构文本',
    publisher: '上海教育出版社',
    edition: '牛津上海版 / 深圳用 / 一年级上册（2024 新版）',
    sourceRef: 'user-provided://g1-shenzhen-shanghai-english-upper-table-of-contents',
    sourceVersion: 'USER_PROVIDED_SHENZHEN_ENGLISH_DIRECTORY_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供内容，仅用于本地个人开发；未提供公开再分发授权。',
    attribution: '用户在本轮提供的深圳用一年级上册英语课程文本',
    notes: '用于建立深圳市英语教材候选课程结构，不代表已完成出版物授权或外部版权核验。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的牛津上海版（深圳用）一年级上册英语完整课程文本',
    publisher: '上海教育出版社',
    edition: '牛津上海版 / 深圳用 / 一年级上册（2024 新版）',
    sourceRef: 'user-provided://g1-shenzhen-shanghai-english-upper-full-text',
    sourceVersion: 'USER_PROVIDED_SHENZHEN_ENGLISH_FULL_TEXT_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: '用户在本轮提供的深圳用一年级上册英语完整课程文本',
    notes:
      'Ready-Go、Chant、Story、单词和中文提示作为本地课程内容进入详情页；内部审计字段继续保留。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeOneShenzhenEnglishUpperTextbooks: TextbookVersion[] = [
  {
    id: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
    subjectId: G1_SHENZHEN_ENGLISH_SUBJECT_ID,
    gradeId: G1_SHENZHEN_ENGLISH_GRADE_ID,
    semesterId: G1_SHENZHEN_ENGLISH_SEMESTER_ID,
    publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
    versionName: '沪教版（牛津上海版）英语一年级上册（2024 新版·深圳用）',
    editionYear: 2024,
    curriculumStandard: '义务教育英语课程标准（2022 年版）',
    sourceId: G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
]

export const gradeOneShenzhenEnglishUpperRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G1_SHENZHEN_ENGLISH_S1_REGION_SHENZHEN',
    regionId: G1_SHENZHEN_REGION_ID,
    textbookVersionId: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2024-09-01',
    sourceId: G1_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
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
    title: 'Module 1 Getting to know you · 认识你',
    subtitle: '从家庭、感受和校园用品开始认识自己与身边的人。',
    lessons: [
      lesson(
        'Unit 1 What is your family like? · 你的家人是什么样的？',
        String.raw`
Ready-Go
Listen, then point and say
1. This is my grandma. 这是我的奶奶/外婆。
2. This is my dad. 这是我的爸爸。
3. This is my mum. 这是我的妈妈。
4. This is my brother. 这是我的兄弟。
5. This is my sister. 这是我的姐妹。
6. This is my grandpa. 这是我的爷爷/外公。
7. This is me. 这是我。

Listen and chant
Who is she? Who is she?
She’s my mum. Can you see?
She is kind and she loves me.
Who is he? Who is he?
He’s my dad. Can you see?
He is kind and he loves me.
（她是谁？她是谁？她是我的妈妈，你看见了吗？她很和蔼，她爱我。
他是谁？他是谁？他是我的爸爸，你看见了吗？他很和蔼，他爱我。）

Story: Grandma’s magic pot 奶奶的魔法锅
Grandma: This is my magic pot. 奶奶：这是我的魔法锅。
Pot: Cook, cook! 锅：煮啊煮！
Dad: Wow! Stop, stop! 爸爸：哇！停下，停下！
Pot: I like noodles! 锅：我喜欢面条！
Betty: Bye-bye! 贝蒂：拜拜！
Grandpa: Help! Stop, pot! 爷爷：救命！停下，锅！
Family: Let’s help! 全家人：我们来帮忙！
Pot: Stop! 锅：停下！
Grandma: Thank you. 奶奶：谢谢你。

本单元单词
grandma（外）祖母，grandpa（外）祖父，dad爸爸，mum妈妈，brother兄弟，sister姐妹，me我`,
        [
          { english: 'grandma', chinese: '祖母；外婆' },
          { english: 'grandpa', chinese: '祖父；外公' },
          { english: 'dad', chinese: '爸爸' },
          { english: 'mum', chinese: '妈妈' },
          { english: 'brother', chinese: '兄弟' },
          { english: 'sister', chinese: '姐妹' },
          { english: 'me', chinese: '我' },
        ],
        'This is my ...',
        '用 “This is my ...” 介绍一位家人。',
        'This is my mum.',
      ),
      lesson(
        'Unit 2 How are you today? · 你今天感觉怎么样？',
        String.raw`
Ready-Go
Listen, then point and say
Hi, kids! Welcome to my farm. 嗨，孩子们！欢迎来到我的农场。
—How are you? 你们好吗？
—I’m cold. 我冷。
—I’m hot. 我热。
—I’m hungry. 我饿。
—I’m thirsty. 我渴。

Listen and learn
An apple for you, Julie. 给你一个苹果，朱莉。
—Thank you. 谢谢你。
—You’re welcome. 不客气。
Some orange juice for you, Ann. 给你一些橙汁，安。
A fan for you, John. 给你一把扇子，约翰。

Listen and chant
Cold, cold. I’m cold. A coat for you.
Hot, hot. I’m hot. A fan for you.
Hungry, hungry. I’m hungry. An apple for you.
Thirsty, thirsty. I’m thirsty. Some juice for you.
（冷，冷。我很冷。给你一件外套。
热，热。我很热。给你一把扇子。
饿，饿。我很饿。给你一个苹果。
渴，渴。我很渴。给你一些果汁。）

Story: On the farm 在农场
Bobo: Woof! Woof! 波波：汪汪！
Oh! My trousers! 噢！我的裤子！
Mark: Look out, Robot! 马克：小心，机器人！
Robot: Thank you, Mark. 机器人：谢谢你，马克。

单词
cold冷，hot热，hungry饿，thirsty渴，apple苹果，orange juice橙汁，fan扇子`,
        [
          { english: 'cold', chinese: '冷' },
          { english: 'hot', chinese: '热' },
          { english: 'hungry', chinese: '饿' },
          { english: 'thirsty', chinese: '渴' },
          { english: 'apple', chinese: '苹果' },
          { english: 'orange juice', chinese: '橙汁' },
          { english: 'fan', chinese: '扇子' },
        ],
        'How are you? I’m ...',
        '用 “How are you?” 和 “I’m ...” 介绍自己今天的感觉。',
        'How are you? I’m happy.',
      ),
      lesson(
        'Unit 3 What do you take to school? · 你带什么去学校？',
        String.raw`
Ready-Go
Listen, then point and say
1. one pencil case 1个铅笔盒
2. two erasers 2块橡皮
3. three pencils 3支铅笔
4. four rulers 4把尺子

Look, what do you see? 看，你看见了什么？
—I see one pencil case. 我看见一个铅笔盒。
—I see two erasers. 我看见两块橡皮。
—I see three pencils. 我看见三支铅笔。
—I see four rulers. 我看见四把尺子。

Listen and chant
Pencil case, pencil case. One for you.
Eraser, eraser. Two for you.
Pencil, pencil. Three for you.
Ruler, ruler. Four for you.
（铅笔盒，铅笔盒。给你一个。
橡皮，橡皮。给你两块。
铅笔，铅笔。给你三支。
尺子，尺子。给你四把。）

Story: Mary’s pencil case 玛丽的铅笔盒
Mary: Oh no! Where is my pencil case?
玛丽：噢不！我的铅笔盒在哪里？
Tom: Look! A pencil case. 汤姆：看！一个铅笔盒。
Mary: Thank you! 玛丽：谢谢你！

单词
pencil case铅笔盒，eraser橡皮，pencil铅笔，ruler尺子`,
        [
          { english: 'pencil case', chinese: '铅笔盒' },
          { english: 'eraser', chinese: '橡皮' },
          { english: 'pencil', chinese: '铅笔' },
          { english: 'ruler', chinese: '尺子' },
        ],
        'I see ...',
        '用 “I see ...” 介绍你书包里的一件物品。',
        'I see one pencil case.',
      ),
      lesson(
        'Revision 1 · 复习1',
        String.raw`
Revision 1 复习1
复习 Module 1：家庭成员、身体感受、校园用品和核心句型。`,
        [
          { english: 'grandma', chinese: '祖母；外婆' },
          { english: 'cold', chinese: '冷' },
          { english: 'pencil', chinese: '铅笔' },
          { english: 'sister', chinese: '姐妹' },
        ],
        'This is my ... / How are you? / I see ...',
        '选择一个家庭成员、感受或校园用品，用本模块学过的句型介绍。',
        'This is my sister. I see a pencil.',
      ),
    ],
  },
  {
    key: 'module-02',
    title: 'Module 2 My family, my friends and me · 家庭、朋友和我',
    subtitle: '在才艺、动物和颜色中表达自己喜欢什么、会做什么。',
    lessons: [
      lesson(
        'Unit 4 What can you do? · 你会做什么？',
        String.raw`
Ready-Go
Listen, then point and say
1. I can draw. 我会画画。
2. I can write. 我会写字。
3. I can read. 我会阅读。
4. I can sing. 我会唱歌。
5. I can dance. 我会跳舞。

—What can you do? 你会做什么？
—I can sing. 我会唱歌。

Listen and chant
Draw, draw. I can draw. Draw a tree for you.
Write, write. I can write. Write for you.
Read, read. I can read. Read a book for you.
Sing, sing. I can sing. Sing a song for you.
Dance, dance. I can dance. Dance for you.
（画，画。我会画画，为你画一棵树。
写，写。我会写字，写给你。
读，读。我会读书，为你读书。
唱，唱。我会唱歌，为你唱一首歌。
跳，跳。我会跳舞，为你跳舞。）

Story: The talent show 才艺秀
Children: Talent show! Hooray! 孩子们：才艺秀！万岁！
Girl: I can dance. 女孩：我会跳舞。
Boy: I can sing. 男孩：我会唱歌。
Girl: I can draw. 女孩：我会画画。
All: Great! 全体：太棒了！

单词
draw画画，write写，read读，sing唱，dance跳舞`,
        [
          { english: 'draw', chinese: '画画' },
          { english: 'write', chinese: '写' },
          { english: 'read', chinese: '读' },
          { english: 'sing', chinese: '唱' },
          { english: 'dance', chinese: '跳舞' },
        ],
        'What can you do? I can ...',
        '用 “What can you do?” 和 “I can ...” 介绍自己会做的事。',
        'What can you do? I can sing.',
      ),
      lesson(
        'Unit 5 What is your favourite animal? · 你最喜欢什么动物？',
        String.raw`
Ready-Go
Listen, then point and say
1. I see a dog. 我看见一只狗。
2. I see a cat. 我看见一只猫。
3. I see a fish. 我看见一条鱼。
4. I see a bird. 我看见一只鸟。
5. I see a hamster. 我看见一只仓鼠。
6. I see a tortoise. 我看见一只乌龟。

Listen and chant
It’s a dog. Woof! 它是狗。汪汪！
It’s a cat. Meow! 它是猫。喵喵！
It’s a fish. Splash! 它是鱼。哗啦！
It’s a bird. Tweet! 它是鸟。啾啾！
—What is it? 它是什么？
—It’s a hamster. It’s a lovely hamster.
它是仓鼠，一只可爱的仓鼠。
—What is it? 它是什么？
—It’s a tortoise. It’s a lovely tortoise.
它是乌龟，一只可爱的乌龟。

Story: In the garden 在花园里
Coco: Tweet, tweet! What’s that, Grandpa?
可可：啾啾，啾啾！那是什么，爷爷？
Grandpa: Oh, it’s a baby bird.
爷爷：噢，是一只小鸟宝宝。
Coco: Grandpa, let’s help the bird!
可可：爷爷，我们帮帮小鸟吧！
Grandpa: Oh no! Look, a nest. Let’s put the bird in the nest.
爷爷：哦，不好！看，一个鸟窝。我们把小鸟放到鸟窝里。
Coco: Be careful, Grandpa!
可可：小心点，爷爷！
Grandpa: The baby bird is happy now.
爷爷：小鸟宝宝现在很开心。

单词
dog狗，cat猫，fish鱼，bird鸟，hamster仓鼠，tortoise乌龟`,
        [
          { english: 'dog', chinese: '狗' },
          { english: 'cat', chinese: '猫' },
          { english: 'fish', chinese: '鱼' },
          { english: 'bird', chinese: '鸟' },
          { english: 'hamster', chinese: '仓鼠' },
          { english: 'tortoise', chinese: '乌龟' },
        ],
        'What is it? It’s a ...',
        '用 “What is it?” 和 “It’s a ...” 介绍你喜欢的动物。',
        'What is it? It’s a cat.',
      ),
      lesson(
        'Unit 6 What colours can you see? · 你能看见什么颜色？',
        String.raw`
Ready-Go
Listen, then point and say
red红色，white白色，yellow黄色，green绿色，blue蓝色，black黑色

—I see red. 我看见红色。
—I see blue. 我看见蓝色。

Listen and chant
Red is an apple. Yellow is the sun.
Green is the grass. Blue is the sky.
Black is a ball. White is snow.
（红色是苹果，黄色是太阳。
绿色是小草，蓝色是天空。
黑色是皮球，白色是雪花。）

Story: In the park 在公园里
Kitty: Look! A red kite. 凯蒂：看！一只红色风筝。
Joe: Look! A yellow kite. 乔：看！一只黄色风筝。
All: Wow! So beautiful! 全体：哇！真漂亮！

单词
red红，white白，yellow黄，green绿，blue蓝，black黑`,
        [
          { english: 'red', chinese: '红' },
          { english: 'white', chinese: '白' },
          { english: 'yellow', chinese: '黄' },
          { english: 'green', chinese: '绿' },
          { english: 'blue', chinese: '蓝' },
          { english: 'black', chinese: '黑' },
        ],
        'I see ...',
        '用 “I see ...” 介绍你看见的一个颜色。',
        'I see blue.',
      ),
      lesson(
        'Revision 2 · 复习2',
        String.raw`
Revision 2 复习2
复习 Module 2：动作、动物、颜色和核心句型。`,
        [
          { english: 'draw', chinese: '画画' },
          { english: 'dog', chinese: '狗' },
          { english: 'red', chinese: '红' },
          { english: 'sing', chinese: '唱' },
        ],
        'I can ... / It’s a ... / I see ...',
        '选择一个动作、动物或颜色，用本模块学过的句型介绍。',
        'I can draw. It’s a dog. I see red.',
      ),
    ],
  },
  {
    key: 'module-03',
    title: 'Module 3 Places and activities · 地点和活动',
    subtitle: '在操场、水果店和小吃店中练习数数与礼貌表达。',
    lessons: [
      lesson(
        'Unit 7 Let’s count · 我们来数一数',
        String.raw`
Ready-Go
Listen, then point and say
one一，two二，three三，four四，five五，six六

—How many kites? 多少只风筝？
—One. 一只。
—How many balls? 多少个球？
—Three. 三个。

Listen and chant
One, two. One, two. I see two shoes.
Three, four. Three, four. I see four doors.
Five, six. Five, six. I see six sticks.
（一，二。一，二。我看见两只鞋子。
三，四。三，四。我看见四扇门。
五，六。五，六。我看见六根小木棍。）

Story: On the playground 在操场上
Children: One, two, three, four. Hooray!
孩子们：一、二、三、四。万岁！

单词
one1，two2，three3，four4，five5，six6`,
        [
          { english: 'one', chinese: '1' },
          { english: 'two', chinese: '2' },
          { english: 'three', chinese: '3' },
          { english: 'four', chinese: '4' },
          { english: 'five', chinese: '5' },
          { english: 'six', chinese: '6' },
        ],
        'How many ...? ...',
        '用 “How many ...?” 数一数身边的物品，再用英语回答。',
        'How many balls? Three.',
      ),
      lesson(
        'Unit 8 Apples, please! · 请给我苹果！',
        String.raw`
Ready-Go
Listen, then point and say
apple苹果，pear梨，orange橙子，banana香蕉

—An apple, please. 请给我一个苹果。
—Here you are. 给你。
—Thank you. 谢谢你。

Listen and chant
Apple, apple. Yum-yum-yum.
Pear, pear. Yum-yum-yum.
Orange, orange. Yum-yum-yum.
Banana, banana. Yum-yum-yum.
（苹果，苹果。真好吃。
梨，梨。真好吃。
橙子，橙子。真好吃。
香蕉，香蕉。真好吃。）

Story: At the fruit shop 在水果店
Girl: A pear, please. 女孩：请给我一个梨。
Shopman: Here you are. 店员：给你。
Girl: Thank you. 女孩：谢谢你。

单词
apple苹果，pear梨，orange橙子，banana香蕉`,
        [
          { english: 'apple', chinese: '苹果' },
          { english: 'pear', chinese: '梨' },
          { english: 'orange', chinese: '橙子' },
          { english: 'banana', chinese: '香蕉' },
        ],
        '... please. Here you are. Thank you.',
        '在水果店情境中，用英语礼貌地提出一个请求并回应。',
        'An apple, please. Here you are. Thank you.',
      ),
      lesson(
        'Unit 9 May I have a pie? · 可以给我一个馅饼吗？',
        String.raw`
Ready-Go
Listen, then point and say
pie馅饼，hamburger汉堡包，pizza比萨，cake蛋糕

—May I have a pie, please? 请给我一个馅饼好吗？
—Here you are. 给你。
—Thank you. 谢谢你。

Listen and chant
Pie, pie. Yummy pie.
Hamburger, hamburger. Yummy burger.
Pizza, pizza. Yummy pizza.
Cake, cake. Yummy cake.
（馅饼，馅饼。美味馅饼。
汉堡，汉堡。美味汉堡。
比萨，比萨。美味比萨。
蛋糕，蛋糕。美味蛋糕。）

Story: At the snack bar 在小吃店
Boy: May I have a cake? 男孩：可以给我一块蛋糕吗？
Waiter: Here you are. 服务员：给你。
Boy: Thank you. 男孩：谢谢你。

单词
pie馅饼，hamburger汉堡，pizza披萨，cake蛋糕`,
        [
          { english: 'pie', chinese: '馅饼' },
          { english: 'hamburger', chinese: '汉堡' },
          { english: 'pizza', chinese: '披萨' },
          { english: 'cake', chinese: '蛋糕' },
        ],
        'May I have a ...? Here you are. Thank you.',
        '在小吃店情境中，用 “May I have ...?” 礼貌地介绍自己想要的食物。',
        'May I have a cake, please? Thank you.',
      ),
      lesson(
        'Revision 3 · 复习3',
        String.raw`
Revision 3 复习3
复习 Module 3：数字、水果、食物和礼貌请求。`,
        [
          { english: 'one', chinese: '1' },
          { english: 'apple', chinese: '苹果' },
          { english: 'pie', chinese: '馅饼' },
          { english: 'thank you', chinese: '谢谢你' },
        ],
        'How many ...? / ... please. / May I have ...?',
        '数一数物品，或在商店情境中用英语提出请求。',
        'How many apples? Two. An apple, please. Thank you.',
      ),
    ],
  },
  {
    key: 'module-04',
    title: 'Module 4 The world around us · 我们周围的世界',
    subtitle: '在农场、动物园和公园里观察并介绍身边的事物。',
    lessons: [
      lesson(
        'Unit 10 On the farm · 在农场',
        String.raw`
Ready-Go
Listen, then point and say
cow奶牛，chick小鸡，duck鸭子，pig猪

—What’s this? 这是什么？
—It’s a cow. Moo-moo! 是奶牛，哞哞！
—What’s that? 那是什么？
—It’s a pig. Oink-oink! 是猪，哼哼！

Listen and chant
Cow, cow. Moo-moo-moo.
Chick, chick. Peep-peep-peep.
Duck, duck. Quack-quack-quack.
Pig, pig. Oink-oink-oink.
（奶牛哞哞叫，小鸡叽叽叫，鸭子嘎嘎叫，小猪哼哼叫。）

Story: Happy farm 快乐农场
Farmer: Welcome to my farm! 农夫：欢迎来到我的农场！
Children: Wow! So many animals! 孩子们：哇！好多小动物！

单词
cow奶牛，chick小鸡，duck鸭子，pig猪`,
        [
          { english: 'cow', chinese: '奶牛' },
          { english: 'chick', chinese: '小鸡' },
          { english: 'duck', chinese: '鸭子' },
          { english: 'pig', chinese: '猪' },
        ],
        'What’s this/that? It’s a ...',
        '用 “What’s this/that?” 和 “It’s a ...” 介绍一种农场动物。',
        'What’s this? It’s a cow.',
      ),
      lesson(
        'Unit 11 In the zoo · 在动物园',
        String.raw`
Ready-Go
Listen, then point and say
monkey猴子，bear熊，panda熊猫，tiger老虎

—What do you see? 你看见了什么？
—I see a panda. 我看见一只熊猫。

Listen and chant
Monkey, monkey. Jump, jump, jump.
Bear, bear. Big, big, big.
Panda, panda. Black and white.
Tiger, tiger. Run, run, run.
（猴子蹦蹦跳，熊体型大，熊猫黑白相间，老虎跑呀跑。）

Story: At the zoo 在动物园
Joe: Look! A monkey. 乔：看！一只猴子。
Kitty: Look! A panda. 凯蒂：看！一只熊猫。

单词
monkey猴子，bear熊，panda熊猫，tiger老虎`,
        [
          { english: 'monkey', chinese: '猴子' },
          { english: 'bear', chinese: '熊' },
          { english: 'panda', chinese: '熊猫' },
          { english: 'tiger', chinese: '老虎' },
        ],
        'What do you see? I see a ...',
        '用 “What do you see?” 和 “I see a ...” 介绍你在动物园看见的动物。',
        'What do you see? I see a panda.',
      ),
      lesson(
        'Unit 12 In the park · 在公园里',
        String.raw`
Ready-Go
Listen, then point and say
tree树，flower花，kite风筝，ball球

—What do you see in the park? 你在公园里看见什么？
—I see a tree. 我看见一棵树。

Listen and chant
In the park, in the park.
See a tree, see a flower.
Fly a kite, play with a ball.
Happy, happy, one and all.
（在公园，在公园。看见树，看见花。放风筝，玩皮球。大家都很开心。）

Story: A day in the park 公园的一天
Children: Let’s play! 孩子们：我们一起玩吧！

单词
tree树，flower花，kite风筝，ball球`,
        [
          { english: 'tree', chinese: '树' },
          { english: 'flower', chinese: '花' },
          { english: 'kite', chinese: '风筝' },
          { english: 'ball', chinese: '球' },
        ],
        'What do you see in the park? I see ...',
        '用英语介绍你在公园里看见的一件物品或正在进行的一项活动。',
        'What do you see in the park? I see a tree.',
      ),
      lesson(
        'Revision 4 · 复习4',
        String.raw`
Revision 4 复习4
复习 Module 4：农场动物、动物园动物、公园物品和观察表达。`,
        [
          { english: 'cow', chinese: '奶牛' },
          { english: 'panda', chinese: '熊猫' },
          { english: 'tree', chinese: '树' },
          { english: 'kite', chinese: '风筝' },
        ],
        'It’s a ... / I see a ...',
        '选择一个身边的动物或物品，用英语完整介绍它。',
        'It’s a panda. I see a kite.',
      ),
    ],
  },
]

const titleFor = (definition: EnglishLessonDefinition): string => definition.title

function summaryFor(definition: EnglishLessonDefinition): string {
  return `围绕${titleFor(definition)}学习生活中的英语词汇和基础交流句型，练习听读、拼写与口头介绍。`
}

function goalsFor(definition: EnglishLessonDefinition): string[] {
  return [
    `能听读并认读${titleFor(definition)}中的核心单词。`,
    `能用“${definition.sentencePattern}”完成简单的英语介绍或问答。`,
  ]
}

function focusFor(): string[] {
  return ['词汇认读', '单词拼写', '句子介绍', '听读表达']
}

function vocabularyText(definition: EnglishLessonDefinition): string {
  return definition.words.map((word) => `${word.english}（${word.chinese}）`).join('、')
}

const unitRecords: Unit[] = modules.map((module, index) => ({
  id: `G1_SHENZHEN_ENGLISH_S1_${module.key.toUpperCase().replaceAll('-', '_')}`,
  textbookVersionId: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  code: `G1_SHENZHEN_ENGLISH_S1_${module.key.toUpperCase().replaceAll('-', '_')}`,
  title: module.title,
  subtitle: module.subtitle,
  sortOrder: index + 1,
  sceneKey: `g1-shenzhen-english-upper-${module.key}`,
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRows = modules.flatMap((module, moduleIndex) => {
  const unitRecord = unitRecords[moduleIndex]
  if (!unitRecord) throw new Error(`G1_SHENZHEN_ENGLISH_MODULE_MISSING:${module.key}`)
  return module.lessons.map((definition, lessonIndex) => ({
    definition,
    unitRecord,
    lessonIndex,
  }))
})

const gradeOneShenzhenEnglishUpperAppendix = String.raw`
附录
Letters 字母
Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz

Picture dictionary 图片词典
Family：grandma 祖母/外婆，grandpa 祖父/外公，dad 爸爸，mum 妈妈，brother 兄弟，sister 姐妹，me 我。
Feelings：cold 冷，hot 热，hungry 饿，thirsty 渴。
Stationery：pencil case 铅笔盒，eraser 橡皮，pencil 铅笔，ruler 尺子。
Actions：draw 画画，write 写，read 读，sing 唱，dance 跳舞。
Animals：dog 狗，cat 猫，fish 鱼，bird 鸟，hamster 仓鼠，tortoise 乌龟。
Colours：red 红，white 白，yellow 黄，green 绿，blue 蓝，black 黑。
Numbers：one 一，two 二，three 三，four 四，five 五，six 六。
Fruit：apple 苹果，pear 梨，orange 橙子，banana 香蕉。
Food：pie 馅饼，hamburger 汉堡包，pizza 比萨，cake 蛋糕。
Farm animals：cow 奶牛，chick 小鸡，duck 鸭子，pig 猪。
Zoo animals：monkey 猴子，bear 熊，panda 熊猫，tiger 老虎。
Park objects：tree 树，flower 花，kite 风筝，ball 球。`

const lessonRecords: Lesson[] = lessonRows.map(
  ({ definition, unitRecord, lessonIndex }, index) => ({
    id: `G1_SHENZHEN_ENGLISH_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
    unitId: unitRecord.id,
    code: `G1_SHENZHEN_ENGLISH_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
    title: definition.title,
    sortOrder: lessonIndex + 1,
    status: 'ACTIVE',
    sourceId: G1_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
    ...UNVERIFIED,
  }),
)

const knowledgePointRecords: KnowledgePoint[] = lessonRows.map(({ definition }, index) => ({
  id: `G1_SHENZHEN_ENGLISH_S1_KP_${String(index + 1).padStart(2, '0')}`,
  code: `EN-G1-S1-${String(index + 1).padStart(2, '0')}`,
  name: `${definition.title} · 学习要点`,
  subjectId: G1_SHENZHEN_ENGLISH_SUBJECT_ID,
  gradeScope: {
    minGrade: 1,
    maxGrade: 1,
    explicitGradeIds: [G1_SHENZHEN_ENGLISH_GRADE_ID],
  },
  description: summaryFor(definition),
  learningObjective: goalsFor(definition),
  abilityTags: ['词汇认读', '句型表达', '听读交流', 'g1-english'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeOneShenzhenEnglishUpperLessons: Lesson[] = lessonRecords
export const gradeOneShenzhenEnglishUpperKnowledgePoints: KnowledgePoint[] = knowledgePointRecords

export const gradeOneShenzhenEnglishUpperLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G1_SHENZHEN_ENGLISH_S1_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeOneShenzhenEnglishUpperKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G1_SHENZHEN_ENGLISH_S1_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

export const gradeOneShenzhenEnglishUpperCourseContents: CourseContent[] = lessonRows.map(
  ({ definition }, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G1_SHENZHEN_ENGLISH_LESSON_CONTENT_MISSING:${index}`)

    const title = titleFor(definition)
    const bodyText = [
      title,
      '',
      definition.text,
      '',
      `核心单词：${vocabularyText(definition)}`,
      `核心句型：${definition.sentencePattern}`,
    ].join('\n')

    return {
      id: `G1_SHENZHEN_ENGLISH_S1_CONTENT_${String(index + 1).padStart(2, '0')}`,
      knowledgePointId,
      title,
      contentType: 'TEXTBOOK',
      contentFormat: 'TEXT',
      body: {
        lessonId,
        sourceScope: 'USER_PROVIDED_LOCAL',
        summary: summaryFor(definition),
        learningGoals: goalsFor(definition),
        focus: focusFor(),
        activity: `先跟读${title}，再完成单词拼写和句子介绍。`,
        blocks: [
          { type: 'TEXT' as const, text: bodyText },
          ...(index === lessonRows.length - 1
            ? [{ type: 'TEXT' as const, text: gradeOneShenzhenEnglishUpperAppendix }]
            : []),
          {
            type: 'TEXT' as const,
            text: `课后练习：单词拼写：根据中文提示写出本课单词；句子介绍：${definition.sentencePrompt}`,
          },
        ],
      },
      difficulty: 'FOUNDATION',
      sourceId: G1_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
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

export const gradeOneShenzhenEnglishUpperCurriculum: GradeOneShenzhenEnglishUpperCurriculumData = {
  grade: gradeOneShenzhenEnglishUpperGrade,
  semester: gradeOneShenzhenEnglishUpperSemester,
  subject: gradeOneShenzhenEnglishUpperSubject,
  sources: gradeOneShenzhenEnglishUpperSources,
  regions: gradeOneShenzhenEnglishUpperRegions,
  publishers: gradeOneShenzhenEnglishUpperPublishers,
  textbooks: gradeOneShenzhenEnglishUpperTextbooks,
  regionTextbookRelations: gradeOneShenzhenEnglishUpperRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeOneShenzhenEnglishUpperLessons,
  knowledgePoints: gradeOneShenzhenEnglishUpperKnowledgePoints,
  lessonKnowledgePointRelations: gradeOneShenzhenEnglishUpperLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeOneShenzhenEnglishUpperKnowledgePrerequisites,
  courseContents: gradeOneShenzhenEnglishUpperCourseContents,
}

export type ShenzhenEnglishLessonPracticeDefinition = EnglishLessonDefinition
export const gradeOneShenzhenEnglishUpperLessonPracticeDefinitions = modules.flatMap(
  (module) => module.lessons,
)
