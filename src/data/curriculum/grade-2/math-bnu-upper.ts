import type {
  ContentSource,
  CourseContent,
  KnowledgePoint,
  KnowledgePrerequisite,
  Lesson,
  LessonKnowledgePointRelation,
  Publisher,
  RegionTextbookRelation,
  Subject,
  TextbookVersion,
  Unit,
} from '@/types'
import { G1_SHENZHEN_REGION_ID } from '../grade-1/english-shanghai-upper'
import { gradeTwoChineseUpperGrade, gradeTwoChineseUpperSemester } from './chinese-pep-upper'

export const G2_SHENZHEN_MATH_S1_TEXTBOOK_ID = 'G2_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE'
export const G2_SHENZHEN_MATH_S1_SOURCE_ID = 'G2_SHENZHEN_BNU_MATH_S1_USER_OUTLINE'
export const G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID =
  'G2_SHENZHEN_BNU_MATH_S1_ORIGINAL_EXERCISES_V1'
const PREFIX = 'G2_SHENZHEN_MATH_S1'
const timestamp = '2026-09-05T00:00:00+08:00'
const verification = { needsVerification: true, verificationStatus: 'UNVERIFIED' as const }

export type MathFamily =
  | 'add'
  | 'subtract'
  | 'guess'
  | 'measure'
  | 'groups'
  | 'table'
  | 'divide'
  | 'multiple'
  | 'shape'
  | 'campus'
  | 'shopping'
  | 'review'
export interface MathLessonDefinition {
  title: string
  family: MathFamily
  a: number
  b: number
  explanation: string
  discovery: string
  discoveryAnswer: string
  unitIndex: number
  lessonId: string
  knowledgePointId: string
}
type LessonSeed = Omit<MathLessonDefinition, 'unitIndex' | 'lessonId' | 'knowledgePointId'>
function topic(
  title: string,
  family: MathFamily,
  a: number,
  b: number,
  explanation: string,
  discovery: string,
  discoveryAnswer: string,
): LessonSeed {
  return { title, family, a, b, explanation, discovery, discoveryAnswer }
}

// Unit order and named lessons follow the supplied outline. Review/practice
// subdivisions are local learning nodes, not claims about printed lesson names.
const chapters: { title: string; pages: string; lessons: LessonSeed[] }[] = [
  {
    title: '第一单元 · 100以内数加与减（二）',
    pages: '2—17',
    lessons: [
      topic(
        '图书角 · 两位数加一位数',
        'add',
        28,
        4,
        '28本书又添4本：28＋4＝32。先把4分成2和2，28＋2凑成30，再加2得32。列竖式时相同数位对齐，先算个位；个位满十，向十位进1。',
        '28＋4还有别的算法吗？用小棒摆一摆，说出凑十的过程。',
        '可先算8＋4＝12，把12个一换成1个十和2个一，再与原来的2个十合起来，得到32。',
      ),
      topic(
        '摘苹果 · 进位加法',
        'add',
        26,
        38,
        '26＋38：个位6＋8＝14，写4向十位进1；十位2＋3＋1＝6，所以得64。进位的1表示1个十，不是1个一。',
        '小明把26＋38算成54，他可能漏了哪一步？',
        '个位满十后，十位还要加上进位的1，正确得数是64。',
      ),
      topic(
        '借阅图书 · 退位减法',
        'subtract',
        35,
        9,
        '35本借走9本，35－9＝26。5个一不够减9个一，把1个十换成10个一：15－9＝6，十位剩2，得到26。',
        '35－9能用“先减10再加1”来算吗？为什么？',
        '可以。35－10＝25，比要减的9多减了1，所以加回1，得到26。',
      ),
      topic(
        '收玉米 · 两位数减两位数',
        'subtract',
        52,
        28,
        '52－28：个位2不够减8，从十位退1，12－8＝4；十位退1后剩4个十，4－2＝2，所以得24。可以用24＋28＝52验算。',
        '52－28为什么不是34？画出退位前后的十位。',
        '十位的5已经退给个位1个十，必须用4减2。退位没有改变52的总大小。',
      ),
      topic(
        '跳绳 · 100减两位数',
        'subtract',
        100,
        48,
        '100－48：把1个百换成10个十，再把1个十换成10个一，变成9个十和10个一。个位10－8＝2，十位9－4＝5，得52。',
        '用“48加多少到100”检查100－48。',
        '48先加2到50，再加50到100，一共加52，因此100－48＝52。',
      ),
      topic(
        '套圈游戏 · 得分比较',
        'add',
        37,
        26,
        '先读懂“总共”还是“多多少”。两轮得分合起来用加法；比较两人的得分用减法。计算前可以先估一估：37＋26比60大，精确计算得63。',
        '小红得37分，小青得26分，两人总分与相差分数各是多少？',
        '总分37＋26＝63（分）；相差37－26＝11（分）。要看清问题，不是看到两个数就相加。',
      ),
      topic(
        '加减法整理与练习',
        'subtract',
        73,
        36,
        '加法先检查有没有进位，减法先检查够不够减。加法的和减去一个加数应等于另一个加数；减法的差加上减数应等于被减数。',
        '为73－36编一个问题，并用加法验算。',
        '例如73张贴纸送出36张，还剩37张。37＋36＝73，说明计算正确。',
      ),
    ],
  },
  {
    title: '数学好玩 · 猜数游戏',
    pages: '18—19',
    lessons: [
      topic(
        '猜数游戏 · 倒着想',
        'guess',
        23,
        8,
        '想一个数，先加8再减5，最后是26。倒着想：26先加5，再减8，原来的数是23。逆推时顺序要倒过来，每一步也要换成相反运算。',
        '设计一个两步猜数游戏，请同伴倒着算，再顺着验证。',
        '例如想23，加8减5得26。反推26＋5－8＝23；验证23＋8－5＝26。',
      ),
    ],
  },
  {
    title: '第二单元 · 测量（一）',
    pages: '20—29',
    lessons: [
      topic(
        '教室有多长 · 统一单位',
        'measure',
        2,
        6,
        '用书本或铅笔量同一张桌子，次数可能不同，因为工具长短不同。要比较测量结果，先统一单位；摆放时首尾相接，不留空隙，也不重叠。',
        '同一张桌子，用短铅笔和长铅笔量，哪种要量更多次？',
        '短铅笔要量更多次。桌子并没有变长，变化的是每次测量的单位长度。',
      ),
      topic(
        '课桌有多长 · 认识厘米',
        'measure',
        3,
        8,
        '厘米记作cm。尺子上0到1的距离是1厘米。测量时一端对准0刻度，另一端读数；若从3厘米量到8厘米，长度是8－3＝5厘米，不是8厘米。',
        '尺子前端坏了，还能测量吗？把物体放在2厘米到7厘米的位置试试看。',
        '能。记下两端刻度，用7－2＝5（厘米）。数的是两端之间有几个1厘米的间隔。',
      ),
      topic(
        '1米有多长 · 米和厘米',
        'measure',
        1,
        7,
        '米记作m，1米＝100厘米。橡皮、铅笔通常用厘米表示；门高、教室长度通常用米表示。估测是有依据地猜一个大约值，实际结果还要测量。',
        '找一根1米长的绳子，再估一估房门大约高几米。请大人陪同测量，不攀爬。',
        '普通房门高约2米，只是估计，实际长度以安全测量为准。1米绳子摆两次就是约200厘米。',
      ),
      topic(
        '测量练习 · 读尺与估测',
        'measure',
        4,
        10,
        '读尺前先看单位和起点。厘米刻度之间的每一大格表示1厘米。测量结果要带单位；同样的数字，写成米与厘米，长度差很多。',
        '小树高90厘米，再长10厘米就有多高？换成米说一说。',
        '90＋10＝100（厘米），100厘米＝1米。',
      ),
    ],
  },
  {
    title: '第三单元 · 数一数与乘法',
    pages: '30—42',
    lessons: [
      topic(
        '同数连加 · 几个几',
        'groups',
        3,
        2,
        '3组飞机，每组2架，是3个2相加：2＋2＋2＝6。把每组看作一个整体，再数有几组。加数不同的连加不能直接写成一个“几个相同数相加”的乘法。',
        '2＋2＋3能直接看作3个2吗？怎样改成3个2？',
        '不能，三个加数不全相同。把3改成2，才是2＋2＋2。',
      ),
      topic(
        '乘法的意义 · 乘数与积',
        'groups',
        3,
        5,
        '求几个相同加数的和，可以用乘法。3个5是5＋5＋5＝15，可以列3×5＝15或5×3＝15。×叫乘号，乘号两边的数叫乘数，得数叫积。说明情境时仍要讲清几组、每组几个。',
        '3个5与5个3有什么相同和不同？摆两幅图比较。',
        '总数都是15；前者3组每组5个，后者5组每组3个，分组方式不同。交换乘数，积不变。',
      ),
      topic(
        '方阵 · 横着看和竖着看',
        'groups',
        4,
        3,
        '4行点，每行3个，共12个。横着数是4个3，竖着数是3个4。4×3＝12，3×4＝12。同一幅图不必一个点一个点地数。',
        '把4行3列转着看，会变成几行几列？点的总数变了吗？',
        '变成3行4列，总数仍是12。只是观察的方向不同。',
      ),
      topic(
        '动物聚会 · 看图列式',
        'groups',
        4,
        2,
        '4张桌子，每桌2只小动物，可以用4×2求总数。如果有一桌多来1只，要在4×2后再加1，不能忽略这只小动物。',
        '4桌每桌2只，后来又来1只，一共有多少只？',
        '4×2＝8（只），8＋1＝9（只）。先算相同的部分，再补上不同的部分。',
      ),
      topic(
        '乘法入门整理与练习',
        'groups',
        5,
        3,
        '先判断每组数量是否相同，再找组数和每组个数。画图、连加和乘法可以互相对应；只写得数还不够，也要说明算式里的数表示什么。',
        '用5×3编两个分组方式不同的小故事。',
        '例如5袋糖每袋3颗，或3袋糖每袋5颗，两种总数都是15颗。',
      ),
    ],
  },
  {
    title: '第四单元 · 乘法口诀（一）',
    pages: '43—52',
    lessons: [
      ...[5, 2, 3, 4].map((n) =>
        topic(
          n + '的乘法口诀',
          'table',
          n,
          n === 5 ? 4 : 5,
          `每多一组${n}，总数就多${n}。可以用连加帮助理解口诀，再用口诀口算。交换两个乘数，积不变；两个乘数相同时，只有一道不同的乘法算式。`,
          `忘记${n}×6时，怎样借助${n}×5推算？`,
          `${n}×5＝${n * 5}，再加一组${n}，得${n * 6}。背口诀之前先弄懂每一组的意思。`,
        ),
      ),
      topic(
        '口诀规律 · 找邻居',
        'table',
        4,
        6,
        '相邻两组的总数相差一组。4×5＝20，4×6比它多4，得24。四四十六对应4×4＝16，不要把相同算式重复计数。',
        '已知4×5＝20，怎样分别算4×4和4×6？',
        '减少一组4得16，增加一组4得24。',
      ),
    ],
  },
  {
    title: '综合实践 · 画校园路线图',
    pages: '53—55',
    lessons: [
      topic(
        '校园小向导 · 路线与距离',
        'campus',
        20,
        30,
        '先确定图上的方向，再标出大门、教学楼、操场。路线长度要把经过的路段加起来。图中画得长短只是示意，实际距离以标注为准。',
        '从大门经过教学楼到操场有两段路：20米、30米。与一条60米的另一条路线相比，哪条短？',
        '经过教学楼的路线20＋30＝50（米），比60米短10米。出行选择还要考虑安全，不能只看距离。',
      ),
    ],
  },
  {
    title: '第五单元 · 分一分与除法',
    pages: '56—71',
    lessons: [
      topic(
        '平均分 · 每份一样多',
        'divide',
        3,
        4,
        '12个苹果平均分给3人，每人4个，12÷3＝4。平均分的关键是每份一样多，不能只看是不是分完了。÷叫除号，读作“除以”。',
        '12个苹果分成2、4、6三个盘子，是平均分吗？怎样调整？',
        '不是。可以从6个的盘子拿2个给2个的盘子，变成4、4、4。',
      ),
      topic(
        '每几个一份 · 能分几份',
        'divide',
        4,
        3,
        '12个苹果，每3个装一袋，可以装4袋：12÷3＝4。这里3是每袋个数，4是袋数。与“平均分给3人”的情境不同，要看清问题求什么。',
        '同样是12÷3＝4，分别编“求每份个数”和“求份数”的问题。',
        '12个苹果分给3人，每人4个；12个苹果每袋3个，能装4袋。算式相同，数量含义不同。',
      ),
      topic(
        '认识除法 · 用乘法检验',
        'divide',
        5,
        4,
        '20÷5＝4中，20叫被除数，5叫除数，4叫商。因为5×4＝20，所以20÷5＝4，也有20÷4＝5。可以用乘法检查平均分结果。',
        '用20、5、4写两道除法和两道乘法算式。',
        '20÷5＝4，20÷4＝5，5×4＝20，4×5＝20。',
      ),
      topic(
        '倍的认识 · 求几倍',
        'multiple',
        2,
        4,
        '红花8朵，黄花2朵，8里面有4个2，红花是黄花的4倍：8÷2＝4。倍表示数量关系，不是计量单位：算式结果不写“（倍）”，答句可以写“红花是黄花的4倍”。',
        '8朵与2朵相比是4倍；8朵与4朵相比还是4倍吗？',
        '不是，8÷4＝2，是2倍。作比较的标准数量变了，倍数也会变。',
      ),
      topic(
        '求一个数的几倍',
        'multiple',
        3,
        4,
        '蓝珠3颗，红珠是蓝珠的4倍，红珠有4个3，即3×4＝12（颗）。求几倍用除法，求一个数的几倍是多少用乘法。',
        '蓝珠3颗，红珠是它的4倍；红珠比蓝珠多几颗？',
        '先算红珠3×4＝12（颗），再算12－3＝9（颗）。多几颗与几倍是不同问题。',
      ),
      topic(
        '分一分整理与练习',
        'divide',
        6,
        3,
        '先找总数，再看已知的是份数还是每份数量。把图画成同样大小的组，有助于列式。不要把“平均分成3份”和“每3个一份”混淆。',
        '18根小棒，平均分成6份与每6根一份，各怎样分？',
        '平均分成6份，每份3根；每6根一份，分成3份。',
      ),
    ],
  },
  {
    title: '第六单元 · 图形的运动（一）',
    pages: '72—76',
    lessons: [
      topic(
        '轴对称 · 折一折',
        'shape',
        0,
        0,
        '一个平面图形沿一条直线对折，两边能完全重合，就是轴对称图形。这条直线叫对称轴。判断时看能否完全重合，不只看“差不多”。',
        '把正方形纸对折，能找到几条不同的对称轴？剪纸请大人陪同。',
        '4条：横着、竖着、沿两条对角线折。一般长方形有2条，不一定有对角线对称轴。',
      ),
      topic(
        '平移 · 不转方向',
        'shape',
        1,
        0,
        '把图形沿直线搬到另一个位置，形状、大小和朝向不变，这样的运动是平移。推拉窗开合可以看作平移。先比较方向，再比较位置。',
        '把一张三角形卡片向右移动，再向上移动，尖角朝向变了吗？',
        '没有。两次平移改变位置，没有改变大小和朝向。',
      ),
      topic(
        '旋转 · 围着中心转',
        'shape',
        2,
        0,
        '风车、钟表指针绕固定点转动，是旋转。图形旋转后大小和形状不变，朝向通常改变；转满一整圈会回到原来的朝向。',
        '指针从12转到3，再从3转到6，一共转了几次四分之一圈？',
        '两次四分之一圈，也就是半圈。',
      ),
      topic(
        '图形小侦探 · 辨别运动',
        'shape',
        3,
        0,
        '看图比较两次位置：朝向没变而位置改变，可用平移；绕中心转向是旋转；沿折线两边重合是对称。运动与对称是不同的观察角度。',
        '为什么旋转半圈的箭头不能只用一次平移得到？',
        '平移不会改变箭头朝向，旋转半圈后朝向相反。',
      ),
    ],
  },
  {
    title: '第七单元 · 乘法口诀（二）',
    pages: '77—86',
    lessons: [
      ...[6, 7, 8, 9].map((n) =>
        topic(
          n + '的乘法口诀',
          'table',
          n,
          n === 9 ? 7 : 6,
          `借助已经会的口诀推算${n}的口诀。例如${n}×5＝${n * 5}，再多一组${n}就得${n}×6＝${n * 6}。练习时可以画方阵，把难记的结果拆成两块。`,
          n === 9 ? '9×7怎样用“10组7少1组7”计算？' : `把${n}×7拆成${n}×5和${n}×2试一试。`,
          n === 9
            ? '10×7＝70，70－7＝63。1到9的9的乘法结果，十位与个位数字之和是9。这个观察不能随意推广到所有乘数。'
            : `${n * 5}＋${n * 2}＝${n * 7}，两块方阵合起来是7组${n}。`,
        ),
      ),
      topic(
        '口诀综合 · 乘除互通',
        'table',
        8,
        7,
        '根据七八五十六，7×8＝56，可以得到56÷7＝8和56÷8＝7。用口诀时先看两个乘数或总数，不要只按记忆顺序猜答案。',
        '56÷8不会算时，可以想哪一句口诀？',
        '想七八五十六，8和7相乘得56，所以56÷8＝7。',
      ),
    ],
  },
  {
    title: '第八单元 · 乘除法的应用（一）',
    pages: '87—93',
    lessons: [
      topic(
        '乘法应用 · 几个几合起来',
        'groups',
        6,
        4,
        '6盒积木，每盒4块，求总数用6×4＝24（块）。先画组，再标每组数量；算完要回答问题，并检查总数是否比一组多。',
        '如果又添一盒同样的积木，不重新数，怎样求总数？',
        '在24块基础上加4块，得到28块。',
      ),
      topic(
        '除法应用 · 找到平均分',
        'divide',
        7,
        3,
        '21本书平均放在7层，每层3本；21本书每3本一包，能装7包。先在题目里标出总数、每份数、份数，再找未知的一个。',
        '“21本书分成7份”还缺少哪个条件，才能确定每份一样多？',
        '要说明平均分。只说分成7份，不保证每份数量相同。',
      ),
      topic(
        '两步问题 · 先求什么',
        'multiple',
        5,
        3,
        '一袋5颗糖，有3袋，吃掉4颗，先算总数5×3＝15，再算剩下15－4＝11（颗）。把两步各解决的问题说清楚，避免把不同单位的数混在一起。',
        '3袋每袋5颗糖，平均分给5人，每人几颗？',
        '先求总数3×5＝15（颗），再求每人15÷5＝3（颗）。',
      ),
      topic(
        '应用练习 · 检查条件',
        'review',
        4,
        6,
        '读题三步：知道什么、要求什么、数量有什么关系。总数不等于单价，倍数不等于多出的数量。计算后把答案放回题目验证。',
        '24个杯子，每盒6个，装4盒。怎样检查4盒是不是对的？',
        '用4×6＝24验证，并检查单位是盒，不是个。',
      ),
    ],
  },
  {
    title: '综合实践 · 参加欢乐购物活动',
    pages: '94—97',
    lessons: [
      topic(
        '认识元角 · 钱币换一换',
        'shopping',
        3,
        4,
        '1元＝10角。3元4角等于34角，34角也可以换成3元4角。一起计算前先统一单位，不能把3元与4角直接加成7元。',
        '用1元和5角付2元钱，有哪些方案？用纸卡模拟，不需要真实购物。',
        '可以2张1元；1张1元和2张5角；4张5角。',
      ),
      topic(
        '算总价与找零',
        'shopping',
        6,
        3,
        '每支铅笔6元，买3支总价18元。付20元找回2元。总价＝单价×数量；找零＝付的钱－总价，付钱必须足够。',
        '有20元，买3支每支6元的笔后，还能买一块3元的橡皮吗？',
        '剩2元，不够买3元的橡皮，还差1元。',
      ),
      topic(
        '购物方案 · 预算小能手',
        'shopping',
        4,
        5,
        '每本练习本4元，20元最多买5本。计划购物要先算钱够不够，再考虑需要什么；不是东西越多越好。多种付钱方式只要总额相同都可以。',
        '买4元的本子和5元的尺子，付10元应找回多少？还能用哪些钱付9元？',
        '4＋5＝9（元），10－9＝1（元）。例如5元＋4张1元也正好9元。',
      ),
    ],
  },
  {
    title: '总复习 · 数学探险回顾',
    pages: '98—104',
    lessons: [
      topic(
        '数与运算 · 多种方法',
        'review',
        6,
        7,
        '回顾进位加、退位减与乘除法。计算可以画图、口算或列竖式；选择自己理解的方法，并用逆运算检验。',
        '用6、7、42写一组互相验证的算式。',
        '6×7＝42，7×6＝42，42÷6＝7，42÷7＝6。',
      ),
      topic(
        '图形与测量 · 观察再判断',
        'measure',
        2,
        9,
        '回顾米和厘米、从非零刻度测量、平移旋转与对称。图上尺寸没有说明时，不靠屏幕大小猜长度；需要看标注。',
        '尺上2厘米到9厘米的一段，与0厘米到7厘米的一段，谁长？',
        '同样长，都是7厘米。起点不同不代表长度不同。',
      ),
      topic(
        '解决问题 · 数学在身边',
        'review',
        7,
        5,
        '把购物、分物、排队与测量中的数量关系画出来。两步问题先求中间量；答案要有合适单位，求倍数时说明比较关系。',
        '5组同学每组7人，再来3人，共多少人？',
        '先算5×7＝35（人），再算35＋3＝38（人）。',
      ),
      topic(
        '易错整理 · 我会解释',
        'subtract',
        81,
        47,
        '进位不漏加，退位记得减；测量用末端减起点；“多几”与“几倍”不同；相同加数可以写乘法，交换乘数积不变。发现错误后，要说出错在哪里。',
        '“8是2的4倍，所以8比2多4”对吗？',
        '不对。8÷2＝4说明是4倍；8－2＝6说明多6。',
      ),
    ],
  },
]

export const gradeTwoShenzhenMathUpperDefinitions: MathLessonDefinition[] = []
const units: Unit[] = chapters.map((chapter, unitIndex) => {
  chapter.lessons.forEach((seed) => {
    const code = String(gradeTwoShenzhenMathUpperDefinitions.length + 1).padStart(2, '0')
    gradeTwoShenzhenMathUpperDefinitions.push({
      ...seed,
      unitIndex,
      lessonId: `${PREFIX}_LESSON_${code}`,
      knowledgePointId: `${PREFIX}_KP_${code}`,
    })
  })
  return {
    id: `${PREFIX}_UNIT_${String(unitIndex + 1).padStart(2, '0')}`,
    textbookVersionId: G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    code: `MATH-G2-S1-U${unitIndex + 1}`,
    title: chapter.title,
    subtitle: '看懂方法，动手探索，再来闯关。',
    sortOrder: unitIndex + 1,
    sceneKey: `math-adventure-${unitIndex + 1}`,
    status: 'ACTIVE',
    sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
    ...verification,
  }
})
const definitions = gradeTwoShenzhenMathUpperDefinitions
const lessons: Lesson[] = definitions.map((d, index) => ({
  id: d.lessonId,
  unitId: units[d.unitIndex]!.id,
  code: `${PREFIX}-L${index + 1}`,
  title: d.title,
  sortOrder: definitions.filter((x) => x.unitIndex === d.unitIndex).indexOf(d) + 1,
  status: 'ACTIVE',
  sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
  ...verification,
}))
const knowledgePoints: KnowledgePoint[] = definitions.map((d, index) => ({
  id: d.knowledgePointId,
  code: `MATH-G2-S1-${index + 1}`,
  name: d.title,
  subjectId: 'SUBJECT_MATH',
  gradeScope: { minGrade: 2, maxGrade: 2, explicitGradeIds: [gradeTwoChineseUpperGrade.id] },
  description: d.explanation,
  learningObjective: [
    '能说出本课的方法，并用图或实物解释。',
    '能把方法用于新的题目，检查答案是否合理。',
  ],
  abilityTags: ['数学理解', '动手观察', '生活应用', '推理表达'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
  ...verification,
}))
const lessonKnowledgePointRelations: LessonKnowledgePointRelation[] = definitions.map((d, i) => ({
  id: `${PREFIX}_LKP_${String(i + 1).padStart(2, '0')}`,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  relationType: 'CORE',
  order: 1,
  isPrimary: true,
  sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
  status: 'ACTIVE',
  ...verification,
}))
const knowledgePrerequisites: KnowledgePrerequisite[] = definitions.slice(1).map((d, i) => ({
  id: `${PREFIX}_PRE_${i + 1}`,
  prerequisiteKnowledgePointId: definitions[i]!.knowledgePointId,
  dependentKnowledgePointId: d.knowledgePointId,
  relationType: 'RECOMMENDED',
  sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
  status: 'DRAFT',
  ...verification,
}))

const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
export function multiplicationChant(n: number): string {
  return Array.from({ length: 9 }, (_, i) => {
    const factor = i + 1,
      product = n * factor
    const value =
      product < 10
        ? `得${digits[product]}`
        : product === 10
          ? '一十'
          : `${product < 20 ? '' : digits[Math.floor(product / 10)]}十${digits[product % 10]}`
    return `${digits[Math.min(n, factor)]}${digits[Math.max(n, factor)]}${value}`
  }).join('，')
}
const courseContents: CourseContent[] = definitions.map((d) => ({
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
    learningGoals: knowledgePoints.find((k) => k.id === d.knowledgePointId)!.learningObjective,
    blocks: [
      {
        type: 'TEXT',
        text: `${d.title}\n\n${d.explanation}${d.family === 'table' ? '\n\n口诀串联（1—9）：\n' + multiplicationChant(d.a) : ''}`,
      },
      {
        type: 'TEXT',
        text: `拓展探索\n${d.discovery}\n\n先自己想一想或摆一摆，再到下方“动手探究”查看参考思路。`,
      },
    ],
  },
  difficulty: 'FOUNDATION',
  sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
  needsVerification: true,
  status: 'DRAFT',
  currentVersion: 1,
  isSample: false,
  verificationStatus: 'UNVERIFIED',
  createdAt: timestamp,
  updatedAt: timestamp,
}))
const subject: Subject = {
  id: 'SUBJECT_MATH',
  code: 'MATH',
  name: '数学',
  themeKey: 'math',
  status: 'ACTIVE',
}
const publishers: Publisher[] = [
  {
    id: 'PUBLISHER_BNU',
    name: '北京师范大学出版社',
    shortName: '北师大版',
    officialName: '北京师范大学出版社',
    status: 'ACTIVE',
    sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
    ...verification,
  },
]
const sources: ContentSource[] = [
  {
    id: G2_SHENZHEN_MATH_S1_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的北师大版二年级上册数学目录与知识提要',
    sourceRef: 'user-provided://shenzhen-bnu-math-g2-upper-outline',
    sourceVersion: 'USER_OUTLINE_2026-09-05',
    publisher: '北京师范大学出版社',
    edition: '二年级上册（用户标注2024新版）',
    copyrightStatus: 'PENDING',
    attribution: '用户本轮提供的目录、例题与知识说明',
    notes:
      '页码与版本来自用户提要，未核验原书。学习节点含本地拆分；知识表述纠正了倍数答句及乘法交换的歧义。非逐页课本全文。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
    sourceType: 'AI_GENERATED',
    title: '二年级数学原创拓展闯关与探究',
    sourceRef: 'local-original://math-g2-upper-quest/v1',
    sourceVersion: 'MATH_QUEST_V1',
    copyrightStatus: 'PENDING',
    attribution: '项目依据用户知识提要新编的练习、图示和解析',
    notes: '原创拓展与教材提要分开；未写入生产审核状态。',
    verificationStatus: 'UNVERIFIED',
  },
]
const textbooks: TextbookVersion[] = [
  {
    id: G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    subjectId: subject.id,
    gradeId: gradeTwoChineseUpperGrade.id,
    semesterId: 'SEMESTER_UPPER',
    publisherId: publishers[0]!.id,
    versionName: '北师大版数学二年级上册（2024新版·深圳用）',
    editionYear: 2024,
    sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
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
    textbookVersionId: G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-05',
    sourceId: G2_SHENZHEN_MATH_S1_SOURCE_ID,
    status: 'ACTIVE',
    ...verification,
  },
]
export const gradeTwoShenzhenMathUpperCurriculum = {
  grade: gradeTwoChineseUpperGrade,
  semester: gradeTwoChineseUpperSemester,
  subject,
  publishers,
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
