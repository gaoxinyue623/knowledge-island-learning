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

export const G1_SHENZHEN_MATH_S2_TEXTBOOK_ID = 'G1_SHENZHEN_BNU_MATH_S2_2024_CANDIDATE'
export const G1_SHENZHEN_MATH_S2_SOURCE_ID = 'G1_SHENZHEN_BNU_MATH_S2_USER_OUTLINE'
export const G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID =
  'G1_SHENZHEN_BNU_MATH_S2_ORIGINAL_EXERCISES_V1'
const PREFIX = 'G1_SHENZHEN_MATH_S2'
const timestamp = '2026-09-05T00:00:00+08:00'
const verification = { needsVerification: true, verificationStatus: 'UNVERIFIED' as const }
export type LowerMathFamily =
  | 'place20'
  | 'add-plain'
  | 'make-ten'
  | 'stamp'
  | 'join'
  | 'fold'
  | 'decorate'
  | 'break-ten'
  | 'difference'
  | 'word20'
  | 'count100'
  | 'hundred'
  | 'place100'
  | 'compare100'
  | 'relative'
  | 'grid'
  | 'round'
  | 'subtract-plain'
  | 'tens'
  | 'column-add'
  | 'column-subtract'
  | 'more-less'
  | 'plane'
  | 'tangram'
  | 'comic'
  | 'review20'
  | 'review100'
export interface LowerMathLessonDefinition {
  title: string
  family: LowerMathFamily
  a: number
  b: number
  explanation: string
  discovery: string
  discoveryAnswer: string
  unitIndex: number
  lessonId: string
  knowledgePointId: string
}
type Seed = Omit<LowerMathLessonDefinition, 'unitIndex' | 'lessonId' | 'knowledgePointId'>
function topic(
  title: string,
  family: LowerMathFamily,
  a: number,
  b: number,
  explanation: string,
  discovery: string,
  discoveryAnswer: string,
): Seed {
  return { title, family, a, b, explanation, discovery, discoveryAnswer }
}

// Chapter order follows the user's outline; extra subdivisions are local learning nodes.
const chapters: { title: string; pages: string; lessons: Seed[] }[] = [
  {
    title: '第一单元 · 20以内数与加法',
    pages: '2—17',
    lessons: [
      topic(
        '古人计数 · 认识11—20',
        'place20',
        14,
        0,
        '10个一可以捆成1个十。11是1个十和1个一，14是1个十和4个一，20是2个十。写数时十位在左、个位在右；20的个位没有剩下的一，要写0占位。',
        '用14根小棒捆一捆，再添到20根，说说捆数和剩下的根数。',
        '14根是1捆和4根；20根是2捆、剩0根。一捆始终代表10根。',
      ),
      topic(
        '搭积木 · 20以内不进位加法',
        'add-plain',
        13,
        2,
        '13＋2＝15。把13看成1个十和3个一，3个一加2个一是5个一，十位不变。这种方法用于个位相加没有满十的情况，不是任何加法都保持十位不变。',
        '用1捆小棒和3根小棒，摆出13＋2。',
        '只添2根单根小棒，成为1捆和5根，共15根。',
      ),
      topic(
        '有几瓶牛奶 · 9加几',
        'make-ten',
        9,
        5,
        '计算9＋5，可以把5分成1和4，先算9＋1＝10，再算10＋4＝14。这叫凑十法：先想离10还差几，再把另一个加数拆开；拆开的两部分要合回原来的数。',
        '摆两排圆片表示9＋5，移动1个给9，看看两组变成多少。',
        '变成10和4，总数仍是14。只移动位置，没有增加或拿走。',
      ),
      topic(
        '有几棵树 · 8加几',
        'make-ten',
        8,
        6,
        '8离10还差2，把6分成2和4：8＋2＝10，10＋4＝14。凑十时补的是2，不是每道题都补1。',
        '用8＋6和8＋5各摆一次，比较拆出的两部分。',
        '8＋6拆6为2和4；8＋5拆5为2和3。都是给8补2，剩下的数量不同。',
      ),
      topic(
        '快乐的小鸭 · 7加几',
        'make-ten',
        7,
        5,
        '7＋5，把5分成3和2，先凑成10，再加2得12。也可以算5＋7，交换两个加数的位置，和不变。要能说清每一步表示哪些小鸭。',
        '摆7只和5只小鸭，试试两种凑十方法。',
        '给7补3，剩2；或给5补5，剩2。两种方法都得到12。',
      ),
      topic(
        '快乐的小鸭 · 6加几',
        'make-ten',
        6,
        7,
        '6＋7，把7分成4和3：6＋4＝10，10＋3＝13。凑十不是猜一个得数，而是把原来的数量重新分组。',
        '用6＋7编一个合起来的故事，再用圆片检查。',
        '例如6只在水里、7只在岸上，共13只。把7里的4只和6只合成10只，还剩3只。',
      ),
    ],
  },
  {
    title: '第二单元 · 图形大变身（一）',
    pages: '18—23',
    lessons: [
      topic(
        '做一面小旗 · 描一描',
        'stamp',
        0,
        0,
        '把积木的一个平面贴在纸上，沿着这个面的边缘描一圈，可以留下平面的轮廓。我们描的是一个面，不是把整个立体变薄；本单元先观察变化，不要求背图形名称。',
        '用安全积木的平面在纸上描一圈，换一个面再描。',
        '不同的面可能留下不同轮廓。按住积木再沿边描，不能把球直接当作能贴平的面。',
      ),
      topic(
        '动手拼一拼 · 分开再组合',
        'join',
        0,
        0,
        '一张方纸沿对角方向分成两块，可以把这两块重新拼回去，也可以换摆法拼出新图案。不重叠、不留缝地拼回原纸时，纸片没有变多，也没有变少。',
        '请家人预先剪好两块纸片，把它们拼成原来的方纸，再试别的摆法。',
        '沿共同的斜边拼合，可以拼回方纸。允许多种图案，说明用了哪两块即可。',
      ),
      topic(
        '奇妙的折剪 · 对折与展开',
        'fold',
        0,
        0,
        '对折时让纸的两边对齐。在折好的纸上设计轮廓，请家人帮助剪，再展开观察。两层一起剪且图案连接折痕时，展开后两边能沿折痕重合；不能把任意剪法都说成一定得到连在一起的图案。',
        '先沿中线对折，再请家人帮助剪一个连着折痕的小图案，展开看看。',
        '可以得到左右对应的图案。使用儿童安全剪刀并由成人陪同，也可以只折纸、不剪。',
      ),
    ],
  },
  {
    title: '综合实践 · 设计教室装饰图',
    pages: '24—26',
    lessons: [
      topic(
        '装饰设计师 · 剪拼折的合作',
        'decorate',
        0,
        0,
        '先想装饰放在哪里，再选择纸片，设计重复的花纹。可以用剪、拼、折组合图案，也可以用预剪纸片。轮流取材料，合作后说说自己的方法，不攀爬安装装饰。',
        '用两种颜色的纸片设计一排装饰，给同伴介绍排列方法。',
        '例如蓝、黄、蓝、黄交替排列。还可以选择别的规律，先说明规则，再按规则检查。',
      ),
    ],
  },
  {
    title: '第三单元 · 20以内数与减法',
    pages: '27—43',
    lessons: [
      topic(
        '买铅笔 · 十几减9',
        'break-ten',
        15,
        9,
        '15－9，可以把15分成10和5，先从10里减9，剩1，再把1和原来的5合起来，得到6。这是破十法。也可以想9＋6＝15，所以15－9＝6。',
        '把15根小棒摆成10根和5根，从10根里拿走9根。',
        '这部分剩1根，加上原先没有动的5根，共6根。不要漏掉原先的5根。',
      ),
      topic(
        '捉迷藏 · 十几减8',
        'break-ten',
        13,
        8,
        '13－8，把13分成10和3，10－8＝2，2＋3＝5。也可以想8加几等于13。两种方法都要把每一部分数清楚。',
        '分别用破十法和想加算减解释13－8。',
        '破十：10－8＋3＝5；想加：8＋5＝13，所以13－8＝5。',
      ),
      topic(
        '快乐的小鸭 · 十几减7',
        'break-ten',
        14,
        7,
        '14－7，先算10－7＝3，再算3＋4＝7。不是用14的个位4直接减7，也不是只写10－7的结果。',
        '画14个圆点，先圈出10个，再在这10个里划掉7个。',
        '圈里剩3个，圈外有4个，剩下的一共7个。',
      ),
      topic(
        '快乐的小鸭 · 十几减6',
        'break-ten',
        12,
        6,
        '12－6，先把12分成10和2，10－6＝4，再加2得6。用6＋6＝12可以检查减法结果。',
        '用实物摆出12－6，再把拿走的放回去检查。',
        '剩6个，加回拿走的6个，回到12个。',
      ),
      topic(
        '跳伞表演 · 相差多少',
        'difference',
        14,
        6,
        '14人和6人比较，相差14－6＝8人。“14比6多多少”和“6比14少多少”，问的都是差，用较大数减较小数。注意区别：求“比6多8的数”是另一种问题。',
        '画两排圆片，上排14个、下排6个，一一对齐找多出的部分。',
        '能配成对的有6个，上排多出的8个就是两组的差。',
      ),
      topic(
        '美丽的田园 · 先提问再列式',
        'word20',
        14,
        5,
        '看图先找数量，再看要问什么。共有14只，里面5只在水里，岸上几只？14－5＝9。5只和9只合起来几只？5＋9＝14。同一幅图可以提出不同的问题。',
        '用14、5、9三个数编出一道加法和一道减法故事。',
        '例如5只白鸭与9只灰鸭合计14只；14只中5只是白鸭，灰鸭9只。问题与算式要对应。',
      ),
    ],
  },
  {
    title: '第四单元 · 100以内数的认识',
    pages: '44—59',
    lessons: [
      topic(
        '数花生 · 接着往下数',
        'count100',
        29,
        1,
        '可以一个一个、两个两个、五个五个、十个十个数。数到29后是30，59后是60。每次增加多少要事先约定，不能数着数着随意换步长。',
        '摆30个小物品，分别一个一个数、两个两个数、五个五个数。',
        '分组方式不同，总数相同。两个两个数得到2、4、6……30；五个五个数得到5、10……30。',
      ),
      topic(
        '数一数 · 认识一百',
        'hundred',
        100,
        10,
        '10个一是1个十，10个十是1个百。100写在百位的是1，十位和个位写0占位。1个百与10个十表示同样多，只是计数单位不同。',
        '画10捆小棒，每捆标10根，想一想共多少根。',
        '十个十合起来是100。可以按10、20、30……100数，不必一次背下很多算式。',
      ),
      topic(
        '数豆子 · 数位与0占位',
        'place100',
        53,
        0,
        '53的十位是5，表示5个十；个位是3，表示3个一。50的个位没有剩下的一，要写0占位。个位、十位、百位从右往左排列，不能交换。',
        '画计数器表示53和50，再比较它们的个位。',
        '十位都有5个十，53的个位是3，50的个位是0。50不能省掉0写成5。',
      ),
      topic(
        '谁的红果多 · 比较大小',
        'compare100',
        42,
        38,
        '比较100以内的非负整数，先看位数；两位数先比十位，十位相同再比个位。42＞38；57＜59；100＞99。读清完整的数，不只挑一个数字比较。',
        '用数位卡摆出42和38，说说为什么42更大。',
        '42有4个十，38只有3个十。不能只看个位2比8小。',
      ),
      topic(
        '小小养殖场 · 多一些与多得多',
        'relative',
        85,
        20,
        '85和20相比，可以说85多得多；32和28相比，可以说32多一些。这些是结合情境的相对描述，不是一个固定的“差几就算多得多”的规则。要联系比较的两个数理解。',
        '给20、22、85分别配养殖场卡片，说明谁与20差不多、谁多得多。',
        '22与20较接近，85比20多很多。解释比较的数量，不要求记住固定差值门槛。',
      ),
    ],
  },
  {
    title: '数学好玩 · 填数游戏',
    pages: '60—61',
    lessons: [
      topic(
        '方格侦探 · 横行和竖列',
        'grid',
        0,
        4,
        '这里的3行3列方格，每行、每列都要把1、2、3各用一次。先找已有的数字，再确定缺哪个。只使用题目写出的行列规则，不额外加对角线规则。',
        '做一张3行3列数字卡，先填完整，再盖住一个数请家人猜。',
        '例如第一行1、2、3，第二行2、3、1，第三行3、1、2。盖住中间的3，可同时检查所在行和列。',
      ),
      topic(
        '方格侦探 · 找唯一的数字',
        'grid',
        1,
        5,
        '先看空格所在横行缺什么，再检查竖列能不能放同一个数。答案要同时满足两条规则；填完再检查所有行和列有没有重复。',
        '把上一张完整方格换一种数字排列，再盖住不同位置。',
        '可以交换整行，或把所有1和2交换。要重新检查行和列，不仅靠记忆空格答案。',
      ),
    ],
  },
  {
    title: '第五单元 · 100以内数加与减（一）',
    pages: '62—75',
    lessons: [
      topic(
        '小兔请客 · 整十数加减',
        'round',
        20,
        30,
        '20＋30，把2个十与3个十合起来是5个十，得50；50－10得40。这里每个数都表示几个十，不能把20当作2个一。',
        '画长条，每条表示10，摆出20＋30和50－10。',
        '2条与3条合成5条，共50；拿走1条剩4条，共40。',
      ),
      topic(
        '采松果 · 两位数加一位数',
        'add-plain',
        25,
        4,
        '25＋4，个位5加4得9，十位仍是2，结果29。本单元的这类练习不进位；如果个位相加满十，就不能直接沿用“十位不变”。',
        '画2捆和5根小棒，再添4根。',
        '成为2捆和9根，共29根，个位没有满十。',
      ),
      topic(
        '采松果 · 两位数减一位数',
        'subtract-plain',
        25,
        4,
        '25－4，个位5减4得1，十位仍是2，结果21。本单元选个位够减的题，不引入100以内退位减法。',
        '用2捆和5根小棒，拿走4根单根小棒。',
        '剩2捆和1根，共21根。检查21＋4是否回到25。',
      ),
      topic(
        '青蛙吃虫子 · 加减整十数',
        'tens',
        34,
        20,
        '34＋20，把3个十加2个十，个位4不变，得54；65－40，把6个十减4个十，个位5不变，得25。整十数改变的是十的个数。',
        '用数位卡摆34，加上20后说说哪个数位变了。',
        '十位从3变成5，个位仍是4。不是把20加到个位。',
      ),
      topic(
        '拔萝卜 · 不进位竖式加法',
        'column-add',
        34,
        25,
        '34＋25，个位4加5得9，十位3加2得5，结果59。竖式要个位对个位、十位对十位，从个位算起；这道题没有进位。',
        '在方格纸上写34＋25，分别用两种颜色圈出个位和十位。',
        '4与5对齐，3与2对齐，结果是59。不能把25向左错移一格。',
      ),
      topic(
        '收玉米 · 不退位竖式减法',
        'column-subtract',
        57,
        42,
        '57－42，个位7减2得5，十位5减4得1，结果15。每一位都够减，数位对齐后从个位算起，再用15＋42＝57检查。',
        '用小棒或数位表解释57－42。',
        '5个十去掉4个十剩1个十；7个一去掉2个一剩5个一，共15。',
      ),
      topic(
        '回收废品 · 比一个数多几或少几',
        'more-less',
        23,
        4,
        '小明有23个，小红比小明多4个，求小红的数量用23＋4＝27。小丽比小明少3个，求小丽的数量用23－3＝20。若问27比23多多少，是27－23；不能只看到“多”就加。',
        '把“23个，多4个”和“23个，少3个”各画成一幅图。',
        '求较多的数量：23＋4＝27；求较少的数量：23－3＝20。求两个已知数量的差则用减法。',
      ),
    ],
  },
  {
    title: '第六单元 · 有趣的平面图形（一）',
    pages: '76—86',
    lessons: [
      topic(
        '认识正方形 · 边与角',
        'plane',
        0,
        0,
        '正方形是平面图形，有四条一样长的边、四个直角。把正方形转个方向，它仍然是正方形；正方体则是一个立体，不能与正方形混称。',
        '用方纸的角比一比图形的角，再转动方纸看看。',
        '方向变了，边的长度和角没有改变。不能只凭图形有没有斜着放来判断。',
      ),
      topic(
        '认识长方形 · 找对应的边',
        'plane',
        1,
        0,
        '长方形有四个直角，对边一样长。常见的长方形卡片有两条长边和两条短边；四条边都相等时，它也是正方形，所以不能说所有长方形都必须长短不同。',
        '观察书本封面的轮廓，找到一对对边和四个角。',
        '这里看的是封面的平面轮廓，不是整本书的立体形状。',
      ),
      topic(
        '认识三角形 · 三条边围起来',
        'plane',
        2,
        0,
        '三条直线段首尾相接围成三角形，有三个角。三角形可以尖朝上、尖朝下，也可以有不同的边长；方向和大小不是判断依据。',
        '用三根小棒首尾相接，试着围成一个三角形。',
        '需要围成封闭图形，没有缺口；不是任意长短的三根小棒都能围成。',
      ),
      topic(
        '认识圆 · 弯弯的轮廓',
        'plane',
        3,
        0,
        '圆的轮廓弯弯的，没有角。并不是每条弯曲的封闭线都叫圆，例如椭圆与圆不同。找生活中的圆，要看物体表面的轮廓，不把皮球直接叫作平面圆。',
        '描一个圆形盖子的边缘，与自己随手画的弯曲轮廓比较。',
        '用安全盖子描边能留下圆形轮廓；弯曲没有角只是观察线索，不能单独作为充分判断。',
      ),
      topic(
        '认识平行四边形 · 不只看斜不斜',
        'plane',
        4,
        0,
        '平行四边形有四条边，两组对边分别平行且相等。常见的斜四边形卡片可能没有直角，但不是斜着的四边形都符合。长方形、正方形也有两组平行的对边，本课先观察这些联系。',
        '把一张非直角的平行四边形卡片转动，看看它会不会变成长方形。',
        '不会。转动只改变朝向，不会把原来的角变成直角。',
      ),
      topic(
        '七巧板 · 七块拼世界',
        'tangram',
        0,
        0,
        '一副标准七巧板有7块：5块三角形、1块正方形、1块非直角的平行四边形。大小不同的三角形都要数进去。拼图时观察边的连接，不用重叠来填空。',
        '先观察七块，再用纸片试拼一座小房子或一只小船。',
        '拼法不唯一。数清使用的块数，能指出用了哪些图形；使用预剪卡片更安全。',
      ),
    ],
  },
  {
    title: '综合实践 · 画数学连环画',
    pages: '87—89',
    lessons: [
      topic(
        '数学小画家 · 给故事配算式',
        'comic',
        5,
        3,
        '挑一件生活小事，先画原来的数量，再画发生的变化，最后画结果。比如原有5本书，又添3本，一共8本，配5＋3＝8。把问什么讲清楚，不只写一个孤零零的得数。',
        '画三格连环画：原来有多少、后来怎样、现在多少。',
        '例如5本书，再来3本，共8本；也可以编一个减法故事，算式与每格图对应即可。',
      ),
    ],
  },
  {
    title: '总复习 · 数学方法串起来',
    pages: '90—96',
    lessons: [
      topic(
        '20以内加减 · 方法小挑战',
        'review20',
        8,
        7,
        '复习凑十法和破十法。8＋7先凑十得15；15－8可以想8加几等于15。先理解方法，再慢慢熟练，不用抢速度。',
        '给8＋7画一幅图，再用同一幅图解释15－8。',
        '8与7合起来15；从15中找出8，另一部分7。',
      ),
      topic(
        '100以内 · 数位与不进退位计算',
        'review100',
        65,
        20,
        '复习十位、个位、0占位与大小比较。65－20＝45，45＋20＝65；计算只改变几个十。两位数竖式必须相同数位对齐，本册这些题不进退位。',
        '用数位表检查65－20，再找一个个位为0的两位数。',
        '65去掉2个十剩45；例如50表示5个十和0个一，0要保留。',
      ),
      topic(
        '图形与应用 · 观察再说明',
        'plane',
        5,
        0,
        '复习平面图形、立体物体的表面、图形拼折与七巧板。说出观察依据：边、角、是否封闭，以及整体与一个面的区别。应用题先找数量关系，不靠“多、少”两个字猜运算。',
        '挑一个图形说出依据，再给家人讲一个数学连环画故事。',
        '例如三角形由三条边围成。故事中的总数、部分或差要和所选算式对应即可。',
      ),
    ],
  },
]

export const gradeOneShenzhenMathLowerDefinitions: LowerMathLessonDefinition[] = []
const units: Unit[] = chapters.map((chapter, unitIndex) => {
  chapter.lessons.forEach((seed) => {
    const code = String(gradeOneShenzhenMathLowerDefinitions.length + 1).padStart(2, '0')
    gradeOneShenzhenMathLowerDefinitions.push({
      ...seed,
      unitIndex,
      lessonId: `${PREFIX}_LESSON_${code}`,
      knowledgePointId: `${PREFIX}_KP_${code}`,
    })
  })
  return {
    id: `${PREFIX}_UNIT_${String(unitIndex + 1).padStart(2, '0')}`,
    textbookVersionId: G1_SHENZHEN_MATH_S2_TEXTBOOK_ID,
    code: `MATH-G1-S2-U${unitIndex + 1}`,
    title: chapter.title,
    subtitle: '数一数、摆一摆，发现身边的数学。',
    sortOrder: unitIndex + 1,
    sceneKey: `g1-math-lower-adventure-${unitIndex + 1}`,
    status: 'ACTIVE',
    sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
    ...verification,
  }
})
const definitions = gradeOneShenzhenMathLowerDefinitions
const lessons: Lesson[] = definitions.map((d, i) => ({
  id: d.lessonId,
  unitId: units[d.unitIndex]!.id,
  code: `${PREFIX}-L${i + 1}`,
  title: d.title,
  sortOrder: definitions.filter((x) => x.unitIndex === d.unitIndex).indexOf(d) + 1,
  status: 'ACTIVE',
  sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
  ...verification,
}))
const knowledgePoints: KnowledgePoint[] = definitions.map((d, i) => ({
  id: d.knowledgePointId,
  code: `MATH-G1-S2-${i + 1}`,
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
  sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
  ...verification,
}))
const lessonKnowledgePointRelations: LessonKnowledgePointRelation[] = definitions.map((d, i) => ({
  id: `${PREFIX}_LKP_${String(i + 1).padStart(2, '0')}`,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  relationType: 'CORE',
  order: 1,
  isPrimary: true,
  sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
  status: 'ACTIVE',
  ...verification,
}))
const knowledgePrerequisites: KnowledgePrerequisite[] = definitions.slice(1).map((d, i) => ({
  id: `${PREFIX}_PRE_${i + 1}`,
  prerequisiteKnowledgePointId: definitions[i]!.knowledgePointId,
  dependentKnowledgePointId: d.knowledgePointId,
  relationType: 'RECOMMENDED',
  sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
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
        text: `动手探索\n${d.discovery}\n\n先自己试一试。可以和家人说说你的做法；需要时，请家人读题并和你一起回看前面的学习内容。`,
      },
    ],
  },
  difficulty: 'FOUNDATION',
  sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
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
    id: G1_SHENZHEN_MATH_S2_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的北师大版一年级下册数学目录与知识提要',
    sourceRef: 'user-provided://shenzhen-bnu-math-g1-lower-outline',
    sourceVersion: 'USER_OUTLINE_2026-09-05',
    publisher: '北京师范大学出版社',
    edition: '一年级下册（用户标注2024新版）',
    copyrightStatus: 'PENDING',
    attribution: '用户本轮提供的目录与知识说明',
    notes:
      '按用户提要整理，非逐页课本全文，未核验页码与版本。沿用本地深圳地区接入范围；学习节点含本地拆分。求差与求较多或较少数量区分；平面图形按边角性质判断，不以倾斜朝向分类。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID,
    sourceType: 'AI_GENERATED',
    title: '一年级数学原创图示闯关与开放探究',
    sourceRef: 'local-original://math-g1-lower-quest/v1',
    sourceVersion: 'LOWER_MATH_QUEST_V1',
    copyrightStatus: 'PENDING',
    attribution: '项目依据用户知识提要新编的练习、图示与解析',
    notes: '20以内进退位、100以内不进退位和图形观察，不限时的本地拓展；未修改生产审核状态。',
    verificationStatus: 'UNVERIFIED',
  },
]
const textbooks: TextbookVersion[] = [
  {
    id: G1_SHENZHEN_MATH_S2_TEXTBOOK_ID,
    subjectId: 'SUBJECT_MATH',
    gradeId: gradeOneChineseUpperGrade.id,
    semesterId: 'SEMESTER_LOWER',
    publisherId: 'PUBLISHER_BNU',
    versionName: '北师大版数学一年级下册（2024新版·深圳用）',
    editionYear: 2024,
    sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
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
    textbookVersionId: G1_SHENZHEN_MATH_S2_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-05',
    sourceId: G1_SHENZHEN_MATH_S2_SOURCE_ID,
    status: 'ACTIVE',
    ...verification,
  },
]
export const gradeOneShenzhenMathLowerCurriculum = {
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
