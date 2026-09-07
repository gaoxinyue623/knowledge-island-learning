import type {
  ContentSource,
  CourseContent,
  KnowledgePoint,
  KnowledgePrerequisite,
  Lesson,
  LessonKnowledgePointRelation,
  RegionTextbookRelation,
  TextbookVersion,
  Unit,
} from '@/types'
import { gradeOneChineseUpperGrade } from './chinese-pep-upper'
import { G1_SHENZHEN_REGION_ID } from './english-shanghai-upper'

export const G1_SHENZHEN_MATH_S1_TEXTBOOK_ID = 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE'
export const G1_SHENZHEN_MATH_S1_SOURCE_ID = 'G1_SHENZHEN_BNU_MATH_S1_USER_OUTLINE'
export const G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID =
  'G1_SHENZHEN_BNU_MATH_S1_ORIGINAL_EXERCISES_V1'
const PREFIX = 'G1_SHENZHEN_MATH_S1'
const timestamp = '2026-09-05T00:00:00+08:00'
const verification = { needsVerification: true, verificationStatus: 'UNVERIFIED' as const }
export type EarlyMathFamily =
  | 'welcome'
  | 'count'
  | 'ordinal'
  | 'zero'
  | 'compare'
  | 'add'
  | 'subtract'
  | 'zero-math'
  | 'mixed'
  | 'decompose'
  | 'add-pattern'
  | 'subtract-pattern'
  | 'position'
  | 'classify'
  | 'ten-game'
  | 'solid'
  | 'day'
  | 'record'
export interface EarlyMathLessonDefinition {
  title: string
  family: EarlyMathFamily
  total: number
  part: number
  explanation: string
  discovery: string
  discoveryAnswer: string
  unitIndex: number
  lessonId: string
  knowledgePointId: string
}
type Seed = Omit<EarlyMathLessonDefinition, 'unitIndex' | 'lessonId' | 'knowledgePointId'>
function topic(
  title: string,
  family: EarlyMathFamily,
  total: number,
  part: number,
  explanation: string,
  discovery: string,
  discoveryAnswer: string,
): Seed {
  return { title, family, total, part, explanation, discovery, discoveryAnswer }
}

// The supplied outline is the upstream source. Additional practice subdivisions
// are local learning nodes, not independently verified printed lesson titles.
const chapters: { title: string; pages: string; lessons: Seed[] }[] = [
  {
    title: '我上学啦',
    pages: '2—11',
    lessons: [
      topic(
        '课堂准备 · 倾听与整理',
        'welcome',
        3,
        1,
        '欢迎来到小学！别人说话时先听一听，想发言时举起手。把书本、铅笔摆整齐，准备好再开始。可以说说自己的名字，认识新朋友；不着急做复杂计算。',
        '和家人演一演：同伴介绍自己时，你怎样听？想发言时怎样做？',
        '例如先听完，再举手；轮到自己时清楚地介绍名字。整理文具时轻拿轻放。',
      ),
      topic(
        '教室数一数 · 一个一个点',
        'count',
        4,
        1,
        '观察教室里的桌椅和书本。数一个，点一个，不漏数，也不重复数。最后数到的那个数，表示一共有几个。',
        '选不超过5件文具，先摆成一排数，再换一种摆法数。',
        '只改变摆放位置，不增加也不拿走，物品总数不会变。可以边点边说数字。',
      ),
      topic(
        '新朋友排排队 · 几个和第几',
        'ordinal',
        4,
        2,
        '一队有4位同学，说的是一共有几个。排在第2位，说的是某一位同学的位置。说“第几”前，要讲清从哪一边开始数。',
        '请家人和玩偶排队，说一说一共几个、从左数第2个是谁。',
        '先数总数，再从说好的方向找位置。换方向数，同一个玩偶的位置可能不同。',
      ),
    ],
  },
  {
    title: '第一单元 · 生活中的数',
    pages: '12—28',
    lessons: [
      topic(
        '快乐的家园 · 认识1—10',
        'count',
        5,
        1,
        '1、2、3、4、5、6、7、8、9、10，跟着物品一个一个数。1可以表示1只鸟，也可以表示1群鸟，要听清我们数的是什么。数字不仅能说出来，也可以试着写出来。',
        '找1本书、1盒彩笔。1盒彩笔为什么里面可以有很多支笔？',
        '数的是“盒”时，一整盒算1；数里面的“支”时，要把每支笔分别数出来。',
      ),
      topic(
        '小猫钓鱼 · 认识0',
        'zero',
        3,
        0,
        '小猫的篮子里一条鱼也没有，可以用0表示。0也能表示起点，比如尺子的0刻度。写0时沿着圆弯的路线写成一圈，不把它写成6。',
        '摆3张鱼卡，再把它们全部拿走。篮子里还有几条鱼？',
        '一条也没有，用0表示。也可以说“空了”，不是还剩1条。',
      ),
      topic(
        '文具 · 6—10的读写',
        'count',
        8,
        1,
        '6、7、8、9、10，数文具时把已经数过的轻轻移到一边。顺着数每次多1，倒着数每次少1。10是一个数，写成1和0两个数字。',
        '摆10支笔，从1数到10，再从10倒着数到1。练写6、7、8、9、10。',
        '顺数1、2、3、4、5、6、7、8、9、10；倒数反过来。握笔放松，写清楚比写得快更重要。',
      ),
      topic(
        '动物乐园 · 比大小',
        'compare',
        5,
        3,
        '把两组物品一个对一个配好，哪组有剩下的，哪组就多。5＞3，读作5大于3；2＜5，读作2小于5；4＝4，读作4等于4。开口朝大数，尖角对小数。',
        '摆5个圆片和3个方片，一一对应地排好，说说哪一组多。',
        '每个方片配一个圆片，还有圆片剩下，所以圆片多。5＞3，反过来写是3＜5。',
      ),
      topic(
        '生活中的数 · 数与位置练习',
        'ordinal',
        5,
        3,
        '“3个”表示数量，“第3个”表示位置。找位置时先确定方向，再一个一个数。比较两组物品的多少，看总数，不只看排得长不长。',
        '5颗纽扣摆成一排，圈出从右数第3颗，再圈出从左数第3颗。',
        '都是中间那一颗。这是这排有5颗时的结果，不能说任何一排从两边数第3颗都相同。',
      ),
    ],
  },
  {
    title: '第二单元 · 5以内数加与减',
    pages: '29—39',
    lessons: [
      topic(
        '一共有多少 · 认识加法',
        'add',
        5,
        2,
        '左边2个，右边3个，合起来有5个，写成2＋3＝5，读作2加3等于5。＋是加号。先找到两部分，再把它们合起来。',
        '用2＋3＝5讲一个小故事，换成别的物品再讲一次。',
        '例如2朵红花和3朵黄花，共5朵花。物品换了，合起来求总数的方法不变。',
      ),
      topic(
        '还剩下多少 · 认识减法',
        'subtract',
        5,
        2,
        '原来有5个，拿走2个，还剩3个：5－2＝3，读作5减2等于3。－是减号。要分清原来有多少、拿走多少和剩下多少。',
        '摆5块积木，移走2块，指一指哪部分是拿走的、哪部分是剩下的。',
        '总数是5，移走的是2，留下的是3。可以把移走的放回去，检查是不是又有5块。',
      ),
      topic(
        '0的加减法 · 数量没变',
        'zero-math',
        4,
        0,
        '3＋0＝3，表示没有添进来；4－0＝4，表示没有拿走。3－3＝0，表示全部拿走。遇到0时，先想一想事情发生了什么。',
        '讲讲4－0和4－4这两件不同的事。',
        '4－0是有4个，一个也没拿走，仍有4个；4－4是把4个全拿走，剩0个。',
      ),
      topic(
        '5以内加减 · 看图选方法',
        'mixed',
        4,
        1,
        '两部分合起来，求一共有多少用加法；知道一共多少，拿走一些或找缺少的一部分，用减法。本关只练0—5的数，不用抢着计时。',
        '同一幅1个红圆片、3个黄圆片的图，能提出什么加法问题和减法问题？',
        '加法：一共有几个？1＋3＝4。减法：一共4个，红的1个，黄的几个？4－1＝3。',
      ),
    ],
  },
  {
    title: '综合实践 · 介绍我的教室',
    pages: '40—42',
    lessons: [
      topic(
        '教室小向导 · 上下左右',
        'position',
        4,
        1,
        '观察门、窗户、黑板、桌椅和书架。说位置时，要讲清楚“谁在谁的哪边”。看图练习先约定按画面里的上下左右，不把自己的左右随意换成图中人物的左右。',
        '选两件安全的物品，用“在……上面”“在……左边”介绍。',
        '例如书在桌面上，书包在椅子左边。答案要和实际摆放一致。',
      ),
      topic(
        '介绍我的教室 · 数一数再说',
        'count',
        6,
        1,
        '用一句完整的话介绍你看到的物品：这里有几扇窗、几本书？先认真数，再记录。只记录真正观察到的数量，不照抄示例里的数。',
        '找教室或家中的一种物品，记录0—10以内的数量，并说清物品名称。',
        '例如“我看见4把椅子”。4只是例子，你的记录应以实际数到的结果为准。',
      ),
    ],
  },
  {
    title: '第三单元 · 整理与分类',
    pages: '43—47',
    lessons: [
      topic(
        '整理房间 · 按用途分类',
        'classify',
        0,
        0,
        '把有相同特点的物品放在一起，就是分类。整理房间时，可以把衣服、书本、玩具分别放好。先说分类标准，再动手整理，最后检查有没有放错。',
        '整理6件物品，先按用途分，给每一组起个名字。',
        '例如分成穿的、读的、玩的。能说明分类标准，并保持同一标准即可。',
      ),
      topic(
        '一起来分类 · 换个标准',
        'classify',
        1,
        0,
        '同一堆图形可以按颜色分，也可以按形状分。按颜色时只看颜色；按形状时只看形状。标准换了，分组可能不同，但物品总数没有变。',
        '准备蓝、黄两色的圆形和正方形卡片，先按颜色分，再按形状分。',
        '按颜色分为蓝色、黄色；按形状分为圆形、正方形。同一张卡片可以在不同标准下进入不同组。',
      ),
    ],
  },
  {
    title: '第四单元 · 10以内数加与减',
    pages: '48—69',
    lessons: [
      topic(
        '猜数游戏 · 6的分与合',
        'decompose',
        6,
        2,
        '6可以分成0和6、1和5、2和4、3和3，也可以交换两部分。盒里共6颗珠子，看见2颗，藏着的有6－2＝4颗。两部分合起来仍是6。',
        '摆6个圆片，把其中几个藏在纸下，让同伴猜藏了几个。',
        '说明一共有6个，再用6减去看得见的数量。每次可用把两部分合起来的方法检查。',
      ),
      topic(
        '背土豆 · 7的加减法',
        'decompose',
        7,
        3,
        '7可以分成0和7、1和6、2和5、3和4等。看一幅图，可以说两部分合起来有7，也可以从7里面找出其中一部分。',
        '用3个和4个土豆，讲出一道加法和一道减法。',
        '3＋4＝7；7－3＝4，或者7－4＝3。要说清每个数表示哪一部分。',
      ),
      topic(
        '可爱的企鹅 · 8的加减法',
        'decompose',
        8,
        3,
        '8只企鹅分成两部分，3只在左边，其余5只在右边：3＋5＝8，8－3＝5。大括号帮助表示整体与部分，要看标签所指的数量，不只记问号在上面还是下面。',
        '一共8只企鹅，只看见3只，还有几只被挡住？请画部分和整体的图。',
        '8－3＝5（只）。求缺少的一部分用减法；图横着画或竖着画，数量关系不变。',
      ),
      topic(
        '可爱的企鹅 · 9的加减法',
        'decompose',
        9,
        4,
        '9可以分成4和5，也可以分成3和6、2和7、1和8、0和9。求整体时把两部分相加；求缺少的部分时，从整体中减去已知部分。',
        '把9个圆片分成两组，每次左组多放1个，右组会怎样？',
        '右组要少1个，总数才仍是9。从0和9开始，可一直试到9和0。',
      ),
      topic(
        '小鸡吃食 · 10的好朋友',
        'decompose',
        10,
        4,
        '1和9、2和8、3和7、4和6、5和5，合起来都是10；0和10也能合成10。熟悉10的分与合，可以帮助心算。不要只背口诀，也要能摆出来。',
        '画两排共10个格子，涂4格，再看看还要涂几格才满。',
        '还要涂6格，4＋6＝10，10－4＝6。换不同的涂色数量，试着找更多凑十朋友。',
      ),
      topic(
        '做个加法表 · 找加法规律',
        'add-pattern',
        7,
        2,
        '把加法算式有规律地排列。保持一个加数不变，另一个加数多1，和就多1。例如2＋1＝3、2＋2＝4、2＋3＝5。这里的数与结果都不超过10。',
        '保持2不变，摆出2＋0到2＋5，用圆片看得数怎样变化。',
        '得数依次是2、3、4、5、6、7，每次多1。因为每次只多放进1个圆片。',
      ),
      topic(
        '做个减法表 · 找减法规律',
        'subtract-pattern',
        9,
        3,
        '保持原来的总数不变，每次多拿走1个，剩下的就少1个。例如9－1＝8、9－2＝7、9－3＝6。比较时，要先确认哪个数没有变。',
        '摆9个圆片，每次多拿走1个，把剩下的数量记下来。',
        '从不拿走开始，剩9、8、7、6……直到0。拿走得越多，剩下得越少。',
      ),
    ],
  },
  {
    title: '数学好玩 · 一起做游戏',
    pages: '70—71',
    lessons: [
      topic(
        '凑十对对碰',
        'ten-game',
        10,
        3,
        '用0—10数字卡玩找朋友。一张卡和另一张卡的数合起来是10，就能成为一对。遇到5要有两张5；还要记得0和10这一对。',
        '做两套0—10数字卡，每人翻一张，找它的凑十朋友。',
        '可配0和10、1和9、2和8、3和7、4和6、5和5。允许摆圆片帮助思考，不比速度。',
      ),
      topic(
        '堆一堆 · 积木探险',
        'solid',
        4,
        0,
        '用积木在平坦桌面上堆造型。观察哪些面平平的、哪些面弯弯的。球容易滚走；圆柱用平面朝下可以站立，横放时可以滚。不要把积木搭得过高。',
        '请家人陪同，用少量积木搭一个稳稳的小造型。',
        '例如用长方体平放作底，再放正方体。先看接触面是不是平稳，不把球硬塞在底部。',
      ),
    ],
  },
  {
    title: '第五单元 · 有趣的立体图形',
    pages: '72—77',
    lessons: [
      topic(
        '认识正方体',
        'solid',
        0,
        0,
        '正方体有6个一样大的正方形面，像方方正正的积木或魔方。正方体是立体的，正方形是平面的图形，它们不是同一个名称。',
        '拿一块正方体积木，摸一摸平面，找一找面和面的连接处。',
        '每个面都是一样大的正方形。这里观察完整的积木，不只看纸上的一个正方形。',
      ),
      topic(
        '认识长方体',
        'solid',
        1,
        0,
        '书本、长盒子的形状可以看作长方体。长方体有平平的面，有些面大小不同；有的长方体也有正方形的面。不要把一个长方形面当成整个立体。',
        '比较一本厚书和一块正方体积木，说一说外形哪里相同、哪里不同。',
        '都有平面；正方体6个面一样大，通常的厚书长方体不是6个面都一样大。',
      ),
      topic(
        '认识圆柱',
        'solid',
        2,
        0,
        '圆柱像笔筒或饮料罐，上下有两个圆形平面，侧面弯弯的。平面朝下时可以站立；横放时可以沿侧面滚动。有没有滚动，还与摆放方式有关。',
        '用空的、没有尖锐边缘的圆柱形容器，试试直立和横放的不同。',
        '直立时靠平面站稳，横放时可以滚。请在平坦桌面轻轻试，不把容器推落桌边。',
      ),
      topic(
        '认识球',
        'solid',
        3,
        0,
        '球像皮球，表面弯弯的，在平坦地面轻轻推动，可以向不同方向滚动。球是立体的；纸上画的圆是平面图形。',
        '比较皮球和圆形纸片，说说为什么不能都叫“圆”。',
        '皮球占有空间，能从不同方向观察，是球；纸上画的轮廓是圆。练习时要说完整名称。',
      ),
      topic(
        '立体图形 · 找生活中的朋友',
        'solid',
        4,
        1,
        '把魔方、长盒子、圆柱形罐子、皮球与四种立体图形对应。数一组积木时，一个一个标记，不漏数、不重复数；有遮挡时，要有足够线索才能判断隐藏的数量。',
        '在家找四种立体图形的朋友，也可以画出来介绍。',
        '例如正方体积木、长方体盒子、圆柱形笔筒、球形皮球。实际物品可能有细节差异，观察主要外形。',
      ),
    ],
  },
  {
    title: '综合实践 · 记录我的一天',
    pages: '78—80',
    lessons: [
      topic(
        '我的一天 · 先后顺序',
        'day',
        4,
        1,
        '想一想自己一天的活动，按照发生的先后顺序说出来。比如起床、上学、午饭、晚上睡觉。不同人的一天可能不同，要根据给出的故事或自己的真实经历记录。',
        '画3到4张活动卡，讲讲自己的一天，家人帮你写上简短文字。',
        '按真实发生的顺序排好，能说明“先……再……最后……”即可，本课不要求计算时刻或时长。',
      ),
      topic(
        '数字记录 · 我的生活小册',
        'record',
        4,
        1,
        '用小圆点和数字记录生活里发生的事，例如今天读了几本图画书。一个圆点对应一次或一个物品，记录要真实，不能为好看而多写。',
        '挑一件能数清的小事，画点记录，并写上0—10以内的数字。',
        '例如实际读了2本书，就画2个点，写2。只是示例，不是每天必须完成的数量。',
      ),
    ],
  },
  {
    title: '总复习 · 我会用数学',
    pages: '81—86',
    lessons: [
      topic(
        '数和算 · 10以内小挑战',
        'mixed',
        10,
        3,
        '复习0—10的数、组成和加减。先读清问题，必要时画图或摆物，再选择算式。做完用两部分合起来的方法检查，不把速度当成唯一目标。',
        '用10个圆片编一个加法故事，再编一个减法故事。',
        '例如3个红圆片和7个黄圆片，共10个；一共10个，拿走3个，剩7个。',
      ),
      topic(
        '图形与分类 · 换角度观察',
        'classify',
        1,
        1,
        '观察一组物品，可以先按颜色分，再按形状分。说出你用的标准，检查每件物品有没有正确归组。立体图形与平面图形要说清楚。',
        '给同一批积木设计两种整理方式，并说说数量变没变。',
        '可按颜色，也可按主要形状整理。没有增加或拿走积木，总数不变。',
      ),
      topic(
        '易错整理 · 几个与第几',
        'ordinal',
        5,
        4,
        '一共有几个，看总数；第几个，看方向和位置。求整体用加法，求缺少的部分用减法；大于号开口向大数；正方体和正方形不能混叫。',
        '排5个不同玩偶，从左数第4个，再从右找同一个玩偶是第几个。',
        '它是从右数第2个。改变数的方向会改变位置的说法，但玩偶总数还是5个。',
      ),
    ],
  },
]

export const gradeOneShenzhenMathUpperDefinitions: EarlyMathLessonDefinition[] = []
const units: Unit[] = chapters.map((chapter, unitIndex) => {
  chapter.lessons.forEach((seed) => {
    const code = String(gradeOneShenzhenMathUpperDefinitions.length + 1).padStart(2, '0')
    gradeOneShenzhenMathUpperDefinitions.push({
      ...seed,
      unitIndex,
      lessonId: `${PREFIX}_LESSON_${code}`,
      knowledgePointId: `${PREFIX}_KP_${code}`,
    })
  })
  return {
    id: `${PREFIX}_UNIT_${String(unitIndex + 1).padStart(2, '0')}`,
    textbookVersionId: G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    code: `MATH-G1-S1-U${unitIndex + 1}`,
    title: chapter.title,
    subtitle: '数一数、摆一摆，发现身边的数学。',
    sortOrder: unitIndex + 1,
    sceneKey: `g1-math-adventure-${unitIndex + 1}`,
    status: 'ACTIVE',
    sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
    ...verification,
  }
})
const definitions = gradeOneShenzhenMathUpperDefinitions
const lessons: Lesson[] = definitions.map((d, i) => ({
  id: d.lessonId,
  unitId: units[d.unitIndex]!.id,
  code: `${PREFIX}-L${i + 1}`,
  title: d.title,
  sortOrder: definitions.filter((x) => x.unitIndex === d.unitIndex).indexOf(d) + 1,
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
  ...verification,
}))
const knowledgePoints: KnowledgePoint[] = definitions.map((d, i) => ({
  id: d.knowledgePointId,
  code: `MATH-G1-S1-${i + 1}`,
  name: d.title,
  subjectId: 'SUBJECT_MATH',
  gradeScope: { minGrade: 1, maxGrade: 1, explicitGradeIds: [gradeOneChineseUpperGrade.id] },
  description: d.explanation,
  learningObjective: [
    `能通过点数、摆物或观察，理解“${d.title}”中的方法。`,
    '能用一句话说出自己的发现，再检查一次。',
  ],
  abilityTags: ['数感', '观察比较', '动手操作', '数学表达'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
  ...verification,
}))
const lessonKnowledgePointRelations: LessonKnowledgePointRelation[] = definitions.map((d, i) => ({
  id: `${PREFIX}_LKP_${String(i + 1).padStart(2, '0')}`,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  relationType: 'CORE',
  order: 1,
  isPrimary: true,
  sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
  status: 'ACTIVE',
  ...verification,
}))
const knowledgePrerequisites: KnowledgePrerequisite[] = definitions.slice(1).map((d, i) => ({
  id: `${PREFIX}_PRE_${i + 1}`,
  prerequisiteKnowledgePointId: definitions[i]!.knowledgePointId,
  dependentKnowledgePointId: d.knowledgePointId,
  relationType: 'RECOMMENDED',
  sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
  status: 'DRAFT',
  ...verification,
}))
const courseContents: CourseContent[] = definitions.map((d, i) => ({
  id: `${d.knowledgePointId}_CONTENT_V1`,
  knowledgePointId: d.knowledgePointId,
  title: d.title,
  contentType: 'TEXTBOOK',
  contentFormat: 'TEXT',
  body: {
    lessonId: d.lessonId,
    sourceScope: 'USER_PROVIDED_LOCAL',
    outlinePages: chapters[d.unitIndex]!.pages,
    summary: d.explanation,
    learningGoals: knowledgePoints[i]!.learningObjective,
    blocks: [
      { type: 'TEXT', text: `${d.title}\n\n${d.explanation}` },
      {
        type: 'TEXT',
        text: `动手探索\n${d.discovery}\n\n先自己试一试，再到下方“动手探究”查看参考思路。`,
      },
    ],
  },
  difficulty: 'FOUNDATION',
  sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
  needsVerification: true,
  status: 'DRAFT',
  currentVersion: 1,
  isSample: false,
  verificationStatus: 'UNVERIFIED',
  createdAt: timestamp,
  updatedAt: timestamp,
}))
const sources: ContentSource[] = [
  {
    id: G1_SHENZHEN_MATH_S1_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的北师大版一年级上册数学目录与知识提要',
    sourceRef: 'user-provided://shenzhen-bnu-math-g1-upper-outline',
    sourceVersion: 'USER_OUTLINE_2026-09-05',
    publisher: '北京师范大学出版社',
    edition: '一年级上册（用户标注2024新版）',
    copyrightStatus: 'PENDING',
    attribution: '用户本轮提供的目录与知识说明',
    notes:
      '按用户提要整理，非逐页课本全文，未核验页码与版本。沿用本地深圳地区接入范围；学习节点含本地拆分。整体与部分按数量关系判断，不按问号方向；立体图形说明区分摆放方式。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
    sourceType: 'AI_GENERATED',
    title: '一年级数学原创图示闯关与开放探究',
    sourceRef: 'local-original://math-g1-upper-quest/v1',
    sourceVersion: 'EARLY_MATH_QUEST_V1',
    copyrightStatus: 'PENDING',
    attribution: '项目依据用户知识提要新编的练习、图示与解析',
    notes: '0—10以内、不限时的本地拓展；未修改生产审核状态。',
    verificationStatus: 'UNVERIFIED',
  },
]
const textbooks: TextbookVersion[] = [
  {
    id: G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    subjectId: 'SUBJECT_MATH',
    gradeId: gradeOneChineseUpperGrade.id,
    semesterId: 'SEMESTER_UPPER',
    publisherId: 'PUBLISHER_BNU',
    versionName: '北师大版数学一年级上册（2024新版·深圳用）',
    editionYear: 2024,
    sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
    status: 'ACTIVE',
    ...verification,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]
const regionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: `${PREFIX}_REGION_SHENZHEN`,
    regionId: G1_SHENZHEN_REGION_ID,
    textbookVersionId: G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-05',
    sourceId: G1_SHENZHEN_MATH_S1_SOURCE_ID,
    status: 'ACTIVE',
    ...verification,
  },
]
export const gradeOneShenzhenMathUpperCurriculum = {
  sources,
  textbooks,
  regionTextbookRelations,
  units,
  lessons,
  knowledgePoints,
  lessonKnowledgePointRelations,
  knowledgePrerequisites,
  courseContents,
}
