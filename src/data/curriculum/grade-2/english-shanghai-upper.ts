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
  gradeOneShenzhenEnglishUpperRegions,
  gradeOneShenzhenEnglishUpperSubject,
} from '../grade-1/english-shanghai-upper'
import {
  G2_PEP_CHINESE_GRADE_ID,
  gradeTwoChineseUpperGrade,
  gradeTwoChineseUpperSemester,
} from './chinese-pep-upper'

/**
 * Grade 2 Shenzhen Shanghai-English upper-volume candidate curriculum.
 * Each supplied Unit is a knowledge island with one lesson-level node.
 * The bilingual textbook text stays in CourseContent, while the map keeps
 * stable lesson and knowledge-point identities.
 */
export const G2_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID = 'G2_SHENZHEN_ENGLISH_S1_DIRECTORY_TEXT'
export const G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID = 'G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_CONTENT'
export const G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID = 'G2_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE'
export const G2_SHENZHEN_ENGLISH_GRADE_ID = G2_PEP_CHINESE_GRADE_ID
export const G2_SHENZHEN_ENGLISH_SEMESTER_ID = 'SEMESTER_UPPER'
export const G2_SHENZHEN_ENGLISH_SUBJECT_ID = G1_SHENZHEN_ENGLISH_SUBJECT_ID
export const G2_SHENZHEN_REGION_ID = G1_SHENZHEN_REGION_ID

const TIMESTAMP = '2026-09-04T00:00:00+08:00'
const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeTwoShenzhenEnglishUpperCurriculumData {
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

export const gradeTwoShenzhenEnglishUpperGrade = gradeTwoChineseUpperGrade
export const gradeTwoShenzhenEnglishUpperSemester = gradeTwoChineseUpperSemester
export const gradeTwoShenzhenEnglishUpperSubject = gradeOneShenzhenEnglishUpperSubject
export const gradeTwoShenzhenEnglishUpperRegions = gradeOneShenzhenEnglishUpperRegions
export const gradeTwoShenzhenEnglishUpperPublishers: Publisher[] = [
  gradeOneShanghaiEnglishPublisher,
]

export const gradeTwoShenzhenEnglishUpperSources: ContentSource[] = [
  {
    id: G2_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的深圳专用英语二年级上册目录与课程结构文本',
    publisher: '上海教育出版社',
    edition: '牛津上海版 / 深圳用 / 二年级上册（2024 新版）',
    sourceRef: 'user-provided://g2-shenzhen-shanghai-english-upper-table-of-contents',
    sourceVersion: 'USER_PROVIDED_SHENZHEN_ENGLISH_G2_UPPER_DIRECTORY_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供内容，仅用于本地个人开发；未提供公开再分发授权。',
    attribution: '用户在本轮提供的深圳专用二年级上册英语课程文本',
    notes: '用于建立深圳市二年级英语候选课程结构，不代表已完成出版物授权或外部版权核验。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的深圳专用英语二年级上册完整课程文本',
    publisher: '上海教育出版社',
    edition: '牛津上海版 / 深圳用 / 二年级上册（2024 新版）',
    sourceRef: 'user-provided://g2-shenzhen-shanghai-english-upper-full-text',
    sourceVersion: 'USER_PROVIDED_SHENZHEN_ENGLISH_G2_UPPER_FULL_TEXT_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: '用户在本轮提供的深圳专用二年级上册英语完整课程文本',
    notes:
      'Ready? Go!、Chant、Story、单词和 Word list 1 作为本地课程内容进入详情页；内部审计字段继续保留。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeTwoShenzhenEnglishUpperTextbooks: TextbookVersion[] = [
  {
    id: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
    subjectId: G2_SHENZHEN_ENGLISH_SUBJECT_ID,
    gradeId: gradeTwoShenzhenEnglishUpperGrade.id,
    semesterId: G2_SHENZHEN_ENGLISH_SEMESTER_ID,
    publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
    versionName: '沪教版（牛津上海版）英语二年级上册（2024 新版·深圳用）',
    editionYear: 2024,
    curriculumStandard: '义务教育英语课程标准（2022 年版）',
    sourceId: G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
]

export const gradeTwoShenzhenEnglishUpperRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G2_SHENZHEN_ENGLISH_S1_REGION_SHENZHEN',
    regionId: G2_SHENZHEN_REGION_ID,
    textbookVersionId: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2024-09-01',
    sourceId: G2_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
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

const lessons: EnglishLessonDefinition[] = [
  lesson(
    'Unit 1 Big Question: What can you do with your five senses? · 你能用五官做什么？',
    String.raw`
Page 2

Ready? Go!
Listen, then point and say

1. I can feel the rabbit. 我可以摸小兔子。
2. I can see an ant. 我能看见一只蚂蚁。
3. I can smell the flowers. 我能闻到花香。
4. I can hear the birds. 我能听见小鸟叫。
5. I can taste the lollipop. 我能品尝棒棒糖。

核心问答
—What can you do with your hands? 你的手能做什么？
—I can feel. 我可以触摸。

拓展句型
I can touch and feel with my hands and fingers. 我用手和手指触摸感受。
I can see and hear with my eyes and ears. 我用眼睛看、耳朵听。
I can smell and taste with my nose and tongue. 我用鼻子闻、舌头品尝。

Listen and chant
Feel, feel. Feel soft things.
See, see. See nice things.
Smell, smell. Smell sweet things.
Hear, hear. Hear fun things.
Taste, taste. Taste yummy things.

歌谣翻译
摸一摸，摸摸软软的东西。
看一看，看看美好的事物。
闻一闻，闻闻香香的东西。
听一听，听听有趣的声音。
尝一尝，尝尝美味的食物。

Story：A magic show 一场魔术表演
Magician: Welcome to my magic show!
魔术师：欢迎来到我的魔术表演！
Magician: Feel this box. What’s in it?
魔术师：摸摸这个盒子，里面有什么？
Girl: It’s soft.
女孩：软软的。
Magician: Look! A little rabbit!
魔术师：看！一只小兔子！
Children: Wow! Hooray!
小朋友们：哇！太棒啦！

Unit1单词
feel 触摸
see 看见
smell 闻；嗅
hear 听见
taste 品尝
rabbit 兔子
ant 蚂蚁
flower 花
bird 小鸟
lollipop 棒棒糖`,
    [
      { english: 'feel', chinese: '触摸' },
      { english: 'see', chinese: '看见' },
      { english: 'smell', chinese: '闻；嗅' },
      { english: 'hear', chinese: '听见' },
      { english: 'taste', chinese: '品尝' },
      { english: 'rabbit', chinese: '兔子' },
      { english: 'ant', chinese: '蚂蚁' },
      { english: 'flower', chinese: '花' },
      { english: 'bird', chinese: '小鸟' },
      { english: 'lollipop', chinese: '棒棒糖' },
    ],
    'What can you do with your ...? I can ...',
    '选择一种五官，用 “I can ...” 介绍你能做什么，并说一说使用的身体部位。',
    'I can see and hear with my eyes and ears.',
  ),
  lesson(
    'Unit 2 Big Question: What do you like about your family? · 你喜欢家人哪些地方？',
    String.raw`
Page 10

Ready? Go!
Listen, then point and say

1. This is my uncle. 这是我的叔叔。
2. This is my aunt. 这是我的阿姨。
3. This is my cousin. 这是我的堂/表兄弟姐妹。
4. He is old. 他年纪大。
5. She is young. 她很年轻。
6. He is cute. 他很可爱。

核心问答
—Who is he? 他是谁？
—He is my cousin. He is cute. 他是我的表弟，他很可爱。

Listen and chant
Uncle, uncle. Tall and strong.
Aunt, aunt. Nice and kind.
Cousin, cousin. Young and cute.
Family, family, I love you.

歌谣翻译
叔叔，叔叔，高大强壮。
阿姨，阿姨，友善和蔼。
表亲，表亲，年轻可爱。
家人家人，我爱你们。

Story：At Uncle Bob’s party 在鲍勃叔叔的派对
Girl: Who is he? He’s my cousin Henry.
女孩：他是谁？他是我的表弟亨利。
Girl: Who is she? She’s Henry’s sister, Ann.
女孩：她是谁？她是亨利的妹妹安。
Girl: Look here! Say “Cheese!”
女孩：看这里！说“茄子！”
Children: Cheese!
孩子们：茄子！
Girl: Where is Uncle Bob? Let’s look for him.
女孩：鲍勃叔叔在哪里？我们去找他。
Uncle Bob: Hello, children! Welcome to my party.
鲍勃叔叔：你们好孩子们！欢迎来到我的派对。
All: This party is great! Let’s have fun.
全体：派对太棒了！我们玩得开心。

Unit2单词
uncle 叔叔；伯父；舅舅
aunt 阿姨；姑姑；舅妈
cousin 堂/表兄弟姐妹
old 年老的；年纪大的
young 年轻的
cute 可爱的
party 派对
look for 寻找`,
    [
      { english: 'uncle', chinese: '叔叔；伯父；舅舅' },
      { english: 'aunt', chinese: '阿姨；姑姑；舅妈' },
      { english: 'cousin', chinese: '堂/表兄弟姐妹' },
      { english: 'old', chinese: '年老的；年纪大的' },
      { english: 'young', chinese: '年轻的' },
      { english: 'cute', chinese: '可爱的' },
      { english: 'party', chinese: '派对' },
      { english: 'look for', chinese: '寻找' },
    ],
    'Who is he/she? He/She is my ... He/She is ...',
    '选择一位家人，用 “Who is he/she?” 和 “He/She is ...” 介绍他或她。',
    'Who is he? He is my cousin. He is cute.',
  ),
  lesson(
    'Unit 3 Big Question: What is your favourite toy? · 你最喜欢什么玩具？',
    String.raw`
Page 18

Ready? Go!
Listen, then point and say

1. a doll 洋娃娃
2. a toy plane 玩具飞机
3. a toy bear 玩具熊
4. a ball 皮球
5. a robot 机器人
6. a jigsaw puzzle 拼图玩具

核心问答
—What’s your favourite toy? 你最喜欢的玩具是什么？
—My favourite toy is the robot. 我最喜欢机器人。

Listen and chant
Doll, doll. Pretty doll.
Toy plane, toy plane. Fly high.
Toy bear, toy bear. Hug you tight.
Robot, robot. Turn around.
Jigsaw puzzle, puzzle piece. Put them on the ground.

歌谣翻译
洋娃娃，漂亮洋娃娃。
玩具飞机，高高飞翔。
玩具小熊，紧紧抱抱。
机器人，转个圈圈。
拼图玩具，拼块散落地上。

Story：The lost toy 丢失的玩具
Girl: Oh no! Where is my toy bear? It’s lost!
女孩：哦不！我的玩具熊去哪里了？它丢了！
Boy: Is it under the desk?
男孩：它在书桌下面吗？
Girl: No.
女孩：不在。
Boy: Is it behind the sofa?
男孩：它在沙发后面吗？
Girl: Yes! There it is. Thank you so much!
女孩：是的！找到了，太谢谢你啦！

Unit3单词
doll 洋娃娃
toy plane 玩具飞机
toy bear 玩具熊
ball 球
robot 机器人
jigsaw puzzle 拼图玩具
lost 丢失的
under 在……下面
behind 在……后面
sofa 沙发`,
    [
      { english: 'doll', chinese: '洋娃娃' },
      { english: 'toy plane', chinese: '玩具飞机' },
      { english: 'toy bear', chinese: '玩具熊' },
      { english: 'ball', chinese: '球' },
      { english: 'robot', chinese: '机器人' },
      { english: 'jigsaw puzzle', chinese: '拼图玩具' },
      { english: 'lost', chinese: '丢失的' },
      { english: 'under', chinese: '在……下面' },
      { english: 'behind', chinese: '在……后面' },
      { english: 'sofa', chinese: '沙发' },
    ],
    "What's your favourite toy? My favourite toy is the ...",
    '用 “What’s your favourite toy?” 和 “My favourite toy is ...” 介绍你最喜欢的玩具。',
    'What’s your favourite toy? My favourite toy is the robot.',
  ),
  lesson(
    'Unit 4 Big Question: What is around your home? · 你家周边有什么？',
    String.raw`
Page 26

Ready? Go!
Listen, then point and say

1. pet shop 宠物店
2. fruit shop 水果店
3. cinema 电影院
4. zoo 动物园
5. park 公园
6. toy shop 玩具店

核心问答
—What is around your home? 你家附近有什么？
—There is a park around my home. 我家旁边有一个公园。

Listen and chant
Pet shop, pet shop. Lovely pets.
Fruit shop, fruit shop. Sweet fruit.
Cinema, cinema. Watch a show.
Zoo, zoo. Animals go.
Park, park. Run and play.
Toy shop, toy shop. Hooray-hooray!

歌谣翻译
宠物店，可爱小动物。
水果店，甜甜的水果。
电影院，看一场演出。
动物园，动物到处走。
公园，奔跑玩耍。
玩具店，开心欢呼。

Story：Around my new home 在我的新家周边
Girl: This is my new home.
女孩：这是我的新家。
Girl: Look! There is a zoo near my home.
女孩：看！我家旁边有个动物园。
Boy: Is there a toy shop?
男孩：有玩具店吗？
Girl: Yes! And there is a fruit shop too.
女孩：有的，还有一家水果店。
Boy: Great! We can buy some fruit.
男孩：太棒啦！我们可以买点水果。

Unit4单词
pet shop 宠物店
fruit shop 水果店
cinema 电影院
zoo 动物园
park 公园
toy shop 玩具店
new home 新家
around 在……周围
near 在……附近`,
    [
      { english: 'pet shop', chinese: '宠物店' },
      { english: 'fruit shop', chinese: '水果店' },
      { english: 'cinema', chinese: '电影院' },
      { english: 'zoo', chinese: '动物园' },
      { english: 'park', chinese: '公园' },
      { english: 'toy shop', chinese: '玩具店' },
      { english: 'new home', chinese: '新家' },
      { english: 'around', chinese: '在……周围' },
      { english: 'near', chinese: '在……附近' },
    ],
    'What is around your home? There is a ... near/around my home.',
    '介绍你家附近的一个地方，用 “There is a ... near/around my home.” 说一说。',
    'What is around your home? There is a park around my home.',
  ),
  lesson(
    'Unit 5 Big Question: What do you like about farms? · 农场什么地方你最喜欢？',
    String.raw`
Page 34

Ready? Go!
Listen, then point and say

1. cow 奶牛
2. sheep 绵羊
3. duck 鸭子
4. chick 小鸡
5. chicken 母鸡；鸡肉
6. pig 猪

核心问答
—What animals do you see on the farm? 在农场你看见什么动物？
—I see sheep. They are white. 我看见绵羊，它们白白的。

Listen and chant
Cow, cow. Moo-moo-moo.
Sheep, sheep. Baa-baa-baa.
Duck, duck. Quack-quack-quack.
Chick, chick. Peep-peep-peep.
Chicken, chicken. Cluck-cluck-cluck.
Pig, pig. Oink-oink-oink.

歌谣翻译（动物叫声）
奶牛哞哞叫，绵羊咩咩叫，
鸭子嘎嘎叫，小鸡叽叽叫，
母鸡咯咯叫，小猪哼哼叫。

Story：On the farm 在农场
Farmer: Welcome to my farm!
农夫：欢迎来到我的农场！
Girl: Look at the sheep! They are white.
女孩：看绵羊，雪白雪白。
Boy: I see fat pigs and cute chicks.
男孩：我看见胖胖的小猪和可爱小鸡。
Farmer: Enjoy your day on the farm!
农夫：祝你们在农场玩得开心！

Unit5单词
cow 奶牛
sheep 绵羊
duck 鸭子
chick 小鸡
chicken 母鸡；鸡肉
pig 猪
farm 农场
fat 胖的`,
    [
      { english: 'cow', chinese: '奶牛' },
      { english: 'sheep', chinese: '绵羊' },
      { english: 'duck', chinese: '鸭子' },
      { english: 'chick', chinese: '小鸡' },
      { english: 'chicken', chinese: '母鸡；鸡肉' },
      { english: 'pig', chinese: '猪' },
      { english: 'farm', chinese: '农场' },
      { english: 'fat', chinese: '胖的' },
    ],
    'What animals do you see on the farm? I see ... They are ...',
    '介绍你在农场看到的动物，用 “I see ... They are ...” 说出动物和它们的特点。',
    'What animals do you see on the farm? I see sheep. They are white.',
  ),
  lesson(
    'Unit 6 Big Question: How do people celebrate the Mid-Autumn Festival? · 人们怎样过中秋节？',
    String.raw`
Page 42

Ready? Go!
Listen, then point and say

1. play with lanterns 玩灯笼
2. eat mooncakes 吃月饼
3. solve riddles 猜灯谜
4. look at the moon 赏月

核心问答
—What do you do at Mid-Autumn Festival? 中秋节你做什么？
—I eat mooncakes and look at the moon. 我吃月饼、赏月。

Listen and chant
Mid-Autumn, Mid-Autumn. Bright round moon.
Lanterns bright, riddles fun.
Mooncakes sweet for me and you.
Look at moon, happy too!

歌谣翻译
中秋节，圆圆的明亮月亮。
灯笼闪闪，灯谜有趣。
月饼香甜送给你我。
仰望月亮，满心欢喜。

Story：The Mid-Autumn Festival 中秋节
Mum: Happy Mid-Autumn Festival!
妈妈：中秋节快乐！
Dad: Let’s look at the big round moon.
爸爸：我们一起来赏圆圆的大月亮。
Kid: I want to play with my lantern. Can we eat mooncakes?
孩子：我想玩灯笼，我们可以吃月饼吗？
Mum: Sure! Let’s solve riddles together.
妈妈：当然！我们一起来猜灯谜。

Unit6单词
play with lanterns 玩灯笼
eat mooncakes 吃月饼
solve riddles 猜灯谜
look at the moon 赏月
Mid-Autumn Festival 中秋节
lantern 灯笼
mooncake 月饼
riddle 谜语
moon 月亮

Word list 1 完整全部单词汇总

感官 Unit1
feel 触摸
see 看见
smell 闻；嗅
hear 听见
taste 品尝
rabbit 兔子
ant 蚂蚁
flower 花
bird 小鸟
lollipop 棒棒糖

家庭成员 Unit2
uncle 叔叔；伯父；舅舅
aunt 阿姨；姑姑；舅妈
cousin 堂/表兄弟姐妹
old 年老的；年纪大的
young 年轻的
cute 可爱的
party 派对
look for 寻找

玩具 Unit3
doll 洋娃娃
toy plane 玩具飞机
toy bear 玩具熊
ball 球
robot 机器人
jigsaw puzzle 拼图玩具
lost 丢失的
under 在……下面
behind 在……后面
sofa 沙发

周边场所 Unit4
pet shop 宠物店
fruit shop 水果店
cinema 电影院
zoo 动物园
park 公园
toy shop 玩具店
new home 新家
around 在……周围
near 在……附近

农场动物 Unit5
cow 奶牛
sheep 绵羊
duck 鸭子
chick 小鸡
chicken 母鸡；鸡肉
pig 猪
farm 农场
fat 胖的

中秋节 Unit6
play with lanterns 玩灯笼
eat mooncakes 吃月饼
solve riddles 猜灯谜
look at the moon 赏月
Mid-Autumn Festival 中秋节
lantern 灯笼
mooncake 月饼
riddle 谜语
moon 月亮

重点词汇串联
feel, see, smell, hear, taste, rabbit, ant, flower, bird, uncle, aunt, cousin, old, young, cute, doll, toy plane, toy bear, ball, robot, jigsaw puzzle, pet shop, fruit shop, cinema, zoo, park, toy shop, cow, sheep, duck, chick, chicken, pig, play with lanterns, eat mooncakes, solve riddles, look at the moon`,
    [
      { english: 'play with lanterns', chinese: '玩灯笼' },
      { english: 'eat mooncakes', chinese: '吃月饼' },
      { english: 'solve riddles', chinese: '猜灯谜' },
      { english: 'look at the moon', chinese: '赏月' },
      { english: 'Mid-Autumn Festival', chinese: '中秋节' },
      { english: 'lantern', chinese: '灯笼' },
      { english: 'mooncake', chinese: '月饼' },
      { english: 'riddle', chinese: '谜语' },
      { english: 'moon', chinese: '月亮' },
    ],
    'What do you do at Mid-Autumn Festival? I ... and ...',
    '介绍你在中秋节会做的两件事，用 “I ... and ...” 完成节日介绍。',
    'What do you do at Mid-Autumn Festival? I eat mooncakes and look at the moon.',
  ),
]

const unitRecords: Unit[] = lessons.map((definition, index) => ({
  id: `G2_SHENZHEN_ENGLISH_S1_UNIT_${String(index + 1).padStart(2, '0')}`,
  textbookVersionId: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  code: `G2_SHENZHEN_ENGLISH_S1_UNIT_${String(index + 1).padStart(2, '0')}`,
  title: definition.title,
  subtitle: `围绕${definition.title}学习核心词汇、句型和生活中的英语表达。`,
  sortOrder: index + 1,
  sceneKey: `g2-shenzhen-english-upper-unit-${String(index + 1).padStart(2, '0')}`,
  status: 'ACTIVE',
  sourceId: G2_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRecords: Lesson[] = lessons.map((definition, index) => ({
  id: `G2_SHENZHEN_ENGLISH_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
  unitId: unitRecords[index]?.id ?? '',
  code: `G2_SHENZHEN_ENGLISH_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
  title: definition.title,
  sortOrder: 1,
  status: 'ACTIVE',
  sourceId: G2_SHENZHEN_ENGLISH_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const knowledgePointRecords: KnowledgePoint[] = lessons.map((definition, index) => ({
  id: `G2_SHENZHEN_ENGLISH_S1_KP_${String(index + 1).padStart(2, '0')}`,
  code: `EN-G2-S1-${String(index + 1).padStart(2, '0')}`,
  name: `${definition.title} · 学习要点`,
  subjectId: G2_SHENZHEN_ENGLISH_SUBJECT_ID,
  gradeScope: {
    minGrade: 2,
    maxGrade: 2,
    explicitGradeIds: [gradeTwoShenzhenEnglishUpperGrade.id],
  },
  description: `围绕${definition.title}学习生活中的英语词汇和基础交流句型，练习听读、拼写与口头介绍。`,
  learningObjective: [
    `能听读并认读${definition.title}中的核心单词。`,
    `能用“${definition.sentencePattern}”完成简单的英语介绍或问答。`,
  ],
  abilityTags: ['词汇认读', '单词拼写', '句子介绍', '听读表达', 'g2-english'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeTwoShenzhenEnglishUpperLessons = lessonRecords
export const gradeTwoShenzhenEnglishUpperKnowledgePoints = knowledgePointRecords

export const gradeTwoShenzhenEnglishUpperLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G2_SHENZHEN_ENGLISH_S1_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeTwoShenzhenEnglishUpperKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G2_SHENZHEN_ENGLISH_S1_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

function vocabularyText(definition: EnglishLessonDefinition): string {
  return definition.words.map((word) => `${word.english}（${word.chinese}）`).join('、')
}

export const gradeTwoShenzhenEnglishUpperCourseContents: CourseContent[] = lessons.map(
  (definition, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G2_SHENZHEN_ENGLISH_LESSON_CONTENT_MISSING:${index}`)

    const bodyText = [
      definition.title,
      '',
      definition.text,
      '',
      `核心单词：${vocabularyText(definition)}`,
      `核心句型：${definition.sentencePattern}`,
    ].join('\n')

    return {
      id: `G2_SHENZHEN_ENGLISH_S1_CONTENT_${String(index + 1).padStart(2, '0')}`,
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
          {
            type: 'TEXT' as const,
            text: `课后练习：单词拼写：根据中文提示写出本课单词；句子介绍：${definition.sentencePrompt}`,
          },
        ],
      },
      difficulty: 'FOUNDATION',
      sourceId: G2_SHENZHEN_ENGLISH_S1_CONTENT_SOURCE_ID,
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

export const gradeTwoShenzhenEnglishUpperCurriculum: GradeTwoShenzhenEnglishUpperCurriculumData = {
  grade: gradeTwoShenzhenEnglishUpperGrade,
  semester: gradeTwoShenzhenEnglishUpperSemester,
  subject: gradeTwoShenzhenEnglishUpperSubject,
  sources: gradeTwoShenzhenEnglishUpperSources,
  regions: gradeTwoShenzhenEnglishUpperRegions,
  publishers: gradeTwoShenzhenEnglishUpperPublishers,
  textbooks: gradeTwoShenzhenEnglishUpperTextbooks,
  regionTextbookRelations: gradeTwoShenzhenEnglishUpperRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeTwoShenzhenEnglishUpperLessons,
  knowledgePoints: gradeTwoShenzhenEnglishUpperKnowledgePoints,
  lessonKnowledgePointRelations: gradeTwoShenzhenEnglishUpperLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeTwoShenzhenEnglishUpperKnowledgePrerequisites,
  courseContents: gradeTwoShenzhenEnglishUpperCourseContents,
}

export type ShenzhenEnglishUpperLessonPracticeDefinition = EnglishLessonDefinition
export const gradeTwoShenzhenEnglishUpperLessonPracticeDefinitions = lessons
