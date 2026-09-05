import {
  G2_SHENZHEN_MATH_S1_TEXTBOOK_ID,
  G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
  gradeTwoShenzhenMathUpperDefinitions,
} from '@/data/curriculum/grade-2/math-bnu-upper'
import type { ContentExpansionBundle } from '@/types'
import type { MathQuestVisual, ReadingQuest } from '@/types/reading-quest'
import { createMathQuestBuilder } from './mathQuestBuilder'
import { productionConfig } from '@/config/production'

// Deterministic local exercises; assessment, mastery and map progress stay untouched.
export function createMathQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  if (
    productionConfig.isProduction ||
    !productionConfig.allowUnreviewedQuestions ||
    bundle.learningContent.isSample ||
    bundle.learningContent.knowledgePointId !== bundle.knowledgePointId ||
    bundle.learningContent.lessonId !== bundle.lessonId
  )
    return null
  const d = gradeTwoShenzhenMathUpperDefinitions.find(
    (d) => d.knowledgePointId === bundle.knowledgePointId && d.lessonId === bundle.lessonId,
  )
  if (
    !d ||
    bundle.textbookId !== G2_SHENZHEN_MATH_S1_TEXTBOOK_ID ||
    bundle.learningContent.sourceId !== G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID
  )
    return null
  const quest: ReadingQuest = {
    id: `math-quest:v1:${bundle.textbookId}:${d.knowledgePointId}`,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G2_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    subject: 'MATH',
    stages: [],
  }
  const { calc, choice, judge, match, order } = createMathQuestBuilder(quest, d.family)
  const { a, b, family } = d
  if (family === 'add' || family === 'subtract') {
    const add = family === 'add',
      sign = add ? '＋' : '－',
      result = add ? a + b : a - b
    const onesA = a % 10,
      onesB = b % 10,
      carry = add ? onesA + onesB >= 10 : onesA < onesB
    calc(
      `${a}${sign}${b}＝？`,
      result,
      `${a}${sign}${b}＝${result}。${add ? `${result}－${b}＝${a}` : `${result}＋${b}＝${a}`}，可以反过来检查。`,
    )
    choice(
      `算${a}${sign}${b}时，个位${add ? '相加' : '相减'}要注意什么？`,
      [carry ? (add ? '满十，向十位进1' : '不够减，从高一位退1') : '不需要进位或退位'],
      [carry ? '不需要进位或退位' : '一定要进位或退位', '个位和十位随意对齐'],
      `${onesA}${sign}${onesB}${carry ? (add ? '满十' : '不够减') : '不用进退位'}。相同数位必须对齐。`,
    )
    const blocks = a === 100 ? 48 : a
    choice(
      '看数位图：一根长条表示一个十，一个小方块表示一个一。这些表示哪个数？',
      [String(blocks)],
      [String(blocks + 10), String(blocks - 10)],
      `${Math.floor(blocks / 10)}个十和${blocks % 10}个一，组成${blocks}。`,
      '先数十，再数一。',
      { type: 'place-value', value: blocks },
    )
    match([
      [`${a}${sign}${b}`, String(result)],
      [`${a}${sign}${b - 1}`, String(add ? result - 1 : result + 1)],
      [`${a}${sign}${b - 2}`, String(add ? result - 2 : result + 2)],
    ])
    order(
      add
        ? ['相同数位对齐', '先算个位，满十进1', '再算十位，加上进位', '用减法验算']
        : ['相同数位对齐', '先处理退位，再算个位', '计算剩下的高位', '用加法验算'],
      `给${add ? '进位加法' : '退位减法'}的计算步骤排队。`,
    )
    judge(
      add ? '进位的1表示1个十，算十位时不能漏加。' : '从十位退1给个位后，十位的数可以保持不变。',
      add,
      add
        ? '满10个一换成1个十，十位要加上这个十。'
        : '退走的是1个十，十位必须少1；个位增加10个一。',
    )
    calc(
      add
        ? `图书角原有${a}本，添了${b}本后，又借出3本，还剩几本？`
        : `有${a}张卡，送出${b}张，又收到3张，现在几张？`,
      add ? result - 3 : result + 3,
      add
        ? `先算${a}＋${b}＝${result}，再算${result}－3＝${result - 3}（本）。`
        : `先算${a}－${b}＝${result}，再加3得${result + 3}（张）。`,
    )
    calc(
      `神秘数${sign}${b}＝${result}，神秘数是多少？`,
      a,
      `用逆运算：${result}${add ? '－' : '＋'}${b}＝${a}。`,
      '想一想怎样把加上或减去的部分还原。',
    )
  } else if (family === 'guess') {
    const end = a + b - 5
    calc(
      `一个数先加${b}再减5，最后是${end}。原来是多少？`,
      a,
      `${end}＋5－${b}＝${a}。从最后一步倒着还原。`,
    )
    choice(
      '倒着还原“先加8，再减5”，第一步做什么？',
      ['先加5'],
      ['先减8', '先减5'],
      '原来最后减5，反推第一步加5。',
    )
    choice(
      '哪些两步操作会回到起点？',
      ['先加6再减6', '先减4再加4'],
      ['先加3再减2', '先加2再加2'],
      '一加一减同样的数，变化互相抵消。',
    )
    match([
      ['加7的反向操作', '减7'],
      ['减9的反向操作', '加9'],
      ['加4再减2，净变化', '加2'],
    ])
    order(
      [`从${end}开始`, '加回5', `减去${b}`, `用${a}顺着验证`],
      '把还原并检查这个猜数游戏的步骤排好。',
    )
    judge(
      '反推两步运算时，只换加减号，不用倒转先后顺序。',
      false,
      '必须倒着处理：先还原最后一步，再还原前一步。',
    )
    calc('一盒笔先拿走6支，再放入4支，最后有18支，原来几支？', 20, '18－4＋6＝20（支）。')
    calc(
      '小数谜：我加上自己，结果是18。我是多少？',
      9,
      '两个相同数的和是18，所以18÷2＝9。',
      '画两组同样多的圆点。',
    )
  } else if (family === 'measure') {
    const length = b - a,
      visual: MathQuestVisual = { type: 'ruler', start: a, end: b, max: 12 }
    calc(
      `看尺上蓝色线段，两端在${a}厘米和${b}厘米，长度是多少厘米？`,
      length,
      `${b}－${a}＝${length}（厘米）。量长度要数间隔，不是只读末端。`,
      '图是示意图，读标注刻度，不用真实尺子量屏幕。',
      visual,
    )
    choice(
      '要比较两人测出的桌子长度，应该先确认什么？',
      ['使用相同的长度单位'],
      ['谁量的次数多', '谁的铅笔更好看'],
      '不同长度的工具，每次表示的长度不同，不能直接比次数。',
    )
    choice(
      '物体两端都向右移1厘米，物体长度会怎样？',
      ['长度不变'],
      ['长1厘米', '短1厘米'],
      `两端变成${a + 1}和${b + 1}，相减仍是${length}。`,
      '两端一起移动，不是把物体拉长。',
      visual,
    )
    match([
      ['1米', '100厘米'],
      ['2米', '200厘米'],
      ['1米20厘米', '120厘米'],
    ])
    order(
      ['确认尺子的厘米单位', '把一端对准0刻度', '看另一端所对的刻度', '记录数值和厘米单位'],
      '从0刻度开始，给测量步骤排队。',
    )
    judge(
      '同一张桌子，用更短的铅笔首尾相接地量，通常要量更多次。',
      true,
      '桌子没变长，每次测量的单位更短，所以需要更多次。',
    )
    calc(
      `两段彩带分别长${length}厘米和${length + 3}厘米，不重叠地接起来长几厘米？`,
      length * 2 + 3,
      `${length}＋${length + 3}＝${length * 2 + 3}（厘米）。注意“不重叠”的条件。`,
    )
    choice(
      '选出单位合适的记录。',
      ['课桌高约70厘米', '房门高约2米'],
      ['铅笔长约18米', '教室长约8厘米'],
      '短小物品多用厘米，房屋等较长尺寸常用米。实际长度还需测量。',
    )
  } else if (family === 'groups' || family === 'table' || family === 'review') {
    const total = a * b,
      visual: MathQuestVisual = { type: 'array', rows: a, columns: b }
    calc(
      `${a}行圆点，每行${b}个，共几个？`,
      total,
      `${a}个${b}相加，${a}×${b}＝${total}。`,
      '可以横着一行一行数，也可以竖着一列一列数。',
      visual,
    )
    choice(
      `这幅图可以用哪些乘法算式求总数？${a === b ? '选一个。' : ''}`,
      [...new Set([`${a}×${b}`, `${b}×${a}`])],
      [`${a}＋${b}`, `${a}×${b + 1}`],
      `行数×每行个数，或列数×每列个数，都能得到${total}。交换乘数，积不变。`,
      '横着和竖着分别看。',
      visual,
    )
    choice(
      `每行${b}个，再添一行，总数增加几个？`,
      [String(b)],
      [String(a === b ? a + 1 : a), String(total)],
      `每多一行，就多${b}个，而不是多${a}个或多一整幅图。`,
      '增加的是一行，不是每行增加一个。',
      visual,
    )
    match([
      [`${a}×${b - 1}`, String(a * (b - 1))],
      [`${a}×${b}`, String(total)],
      [`${a}×${b + 1}`, String(a * (b + 1))],
    ])
    order(
      [`先求${a}组${b}有多少`, `用${a}×${b}得到${total}`, '再增加一组的数量', `得到${total + b}`],
      `已经有${a}组，每组${b}个，又来同样的一组。给这种解法排队。`,
    )
    judge(
      `${a}个${b}与${b}个${a}，总数相同，分组方式也一定相同。`,
      a === b,
      a === b
        ? `两个数相同，都是${a}组，每组${a}个。`
        : `总数相同，但${a}组每组${b}个与${b}组每组${a}个，分组方式不同。`,
    )
    calc(
      `${a}盒积木，每盒${b}块，拿走2块，还剩几块？`,
      total - 2,
      `先算${a}×${b}＝${total}，再减2，得${total - 2}（块）。`,
    )
    calc(
      `不用重新数：${a}行每行${b}个，拿走完整的一行，剩几个？`,
      total - b,
      `${total}－${b}＝${total - b}，也可用${a - 1}×${b}来算。`,
      '拿走一整行，行数少1，每行个数不变。',
    )
  } else if (family === 'divide' || family === 'multiple') {
    const total = a * b,
      visual: MathQuestVisual = { type: 'array', rows: a, columns: b }
    calc(
      `把${total}个圆点平均分成${a}份，每份几个？`,
      b,
      `${total}÷${a}＝${b}，因为${a}×${b}＝${total}。`,
      '看每行作为一份时有几个点。',
      visual,
    )
    choice(
      `同样的${total}个点，每${b}个一份，能分几份？`,
      [String(a)],
      [String(b === a ? b + 1 : b), String(total)],
      `求份数：${total}÷${b}＝${a}。商在这里表示份数。`,
    )
    choice(
      `${total}朵红花，${a}朵黄花。红花是黄花的几倍，怎样列式？`,
      [`${total}÷${a}＝${b}`],
      [`${total}－${a}＝${total - a}`, `${a}×${b}＝${total}`],
      `求${total}里有几个${a}，用除法。答：红花是黄花的${b}倍。算式结果不加“（倍）”。`,
      '求几倍，不是求多几朵。',
      visual,
    )
    match([
      ['每份数量×份数', '总数'],
      ['总数÷份数', '每份数量'],
      ['总数÷每份数量', '份数'],
    ])
    order(
      [`先确定总数是${total}`, `平均分成${a}份`, `算出每份${b}个`, `检查${a}×${b}＝${total}`],
      '按“求每份数量”的思路安排平均分与检查。',
    )
    judge(
      '求倍数时，算式结果不写“（倍）”，但答句可以说“是它的4倍”。',
      true,
      '倍表示关系，不是计量单位。答句用“4倍”说明比较关系是正确的。',
    )
    calc(
      `蓝珠${a}颗，红珠是蓝珠的${b}倍。红珠比蓝珠多几颗？`,
      total - a,
      `先求红珠${a}×${b}＝${total}，再求相差${total}－${a}＝${total - a}（颗）。`,
    )
    calc(
      `有${total}本书，每盒装${b}本。已经装好1盒，还能装几盒？`,
      a - 1,
      `一共能装${total}÷${b}＝${a}盒，已经装了1盒，所以还能装${a - 1}盒。`,
      '先求总盒数，再减去装好的盒数。',
    )
  } else if (family === 'shape') {
    const modes = ['reflection', 'translation', 'rotation', 'rotation'] as const
    const mode = modes[a]!,
      label = { reflection: '轴对称', translation: '平移', rotation: '旋转' }[mode]
    choice(
      '观察图示，这里展示了什么？',
      [label],
      ['轴对称', '平移', '旋转'].filter((x) => x !== label),
      mode === 'reflection'
        ? '沿中间虚线对折，两边能完全重合。'
        : mode === 'translation'
          ? '箭头位置改变，大小、形状和朝向不变。'
          : '箭头围绕中心转向，大小和形状不变。',
      '比较两边形状或前后朝向，按图上的虚线看。',
      { type: 'motion', mode },
    )
    choice(
      '哪些可以看作旋转？',
      ['钟表指针转动', '风车转动'],
      ['推拉窗沿轨道移动', '盒子沿桌面直直地推过去'],
      '旋转围绕中心，平移只是搬动位置。',
    )
    choice(
      '向右的箭头旋转半圈后指向哪里？',
      ['左'],
      ['右', '上'],
      '半圈是掉过头，右方的相反方向是左。',
      '先想指针从3走到9的方向变化。',
      { type: 'motion', mode: 'rotation' },
    )
    match([
      ['沿虚线对折完全重合', '轴对称'],
      ['搬动位置但朝向不变', '平移'],
      ['围绕中心转动', '旋转'],
    ])
    order(
      ['对折一张纸', '沿折边画半个图形', '请大人陪同沿线剪', '展开观察两边是否重合'],
      '给对称剪纸的安全操作排队。',
    )
    judge(
      '平移以后，图形的大小和朝向都不改变。',
      true,
      '平移改变位置，不把图形拉长，也不改变朝向。',
    )
    calc(
      '指针从12转到3是四分之一圈，从12转一整圈，共有几个四分之一圈？',
      4,
      '12到3、3到6、6到9、9到12，一共4个四分之一圈。',
    )
    choice(
      '把一般长方形纸（长和宽不相等）沿对角线对折，能完全重合吗？',
      ['不能'],
      ['能', '任何折法都能'],
      '一般长方形的对角线不是对称轴；正方形的对角线才可以这样对折。',
      '画一个较长的长方形，想象长边与短边叠起来。',
    )
  } else if (family === 'campus') {
    const visual: MathQuestVisual = { type: 'route', first: a, second: b, direct: 60 }
    calc(
      '从大门经过教学楼到操场，一共走几米？',
      a + b,
      `${a}＋${b}＝${a + b}（米）。路线总长是沿途路段相加。`,
      '看标注，不用尺子量屏幕。',
      visual,
    )
    choice(
      '按图上“上北下南”，操场在教学楼的什么方向？',
      ['东'],
      ['西', '南'],
      '图上右边是东，操场在教学楼的右边。',
      '先找北方，再确定东、西。',
      visual,
    )
    choice(
      '两条路线中，哪条较短？',
      ['经过教学楼'],
      ['沿60米路线', '一样长'],
      '20＋30＝50，小于60。',
      '比的是数字表示的实际距离。',
      visual,
    )
    match([
      ['图上向上', '北'],
      ['图上向右', '东'],
      ['图上向下', '南'],
    ])
    order(
      ['确定北方并画方向标', '标出大门、教学楼、操场', '连接要走的路段', '标注距离并检查路线'],
      '给画校园路线图的过程排队。',
    )
    judge(
      '路线图上画得更短的一条线，实际距离一定更短。',
      false,
      '示意图不一定按比例绘制，要根据距离标注来比较。',
    )
    calc(
      '去程走50米，回程走60米，两程相差几米？',
      10,
      '60－50＝10（米），这里求相差，不是求总路程。',
    )
    calc(
      '30米的路段每隔5米有一个标记，从起点到终点分成几段？',
      6,
      '30÷5＝6（段）。注意段数与包括起终点的标记个数不同。',
      '想一想30里面有几个5。',
    )
  } else if (family === 'shopping') {
    calc(
      `${a}元${b}角等于几角？`,
      a * 10 + b,
      `${a}元＝${a * 10}角，再加${b}角，共${a * 10 + b}角。`,
    )
    choice(
      `每件${a}元，买${b}件，求总价用哪个算式？`,
      [`${a}×${b}`],
      [`${a}＋${b}`, `${a}－${b}`],
      `有${b}个${a}元，用乘法求总价。`,
    )
    choice(
      '用1元和5角的钱卡，哪些方案正好付2元？',
      ['2张1元', '4张5角'],
      ['1张1元和1张5角', '3张5角'],
      '2元＝20角。两种正确方案都是20角。',
    )
    match([
      ['1元5角', '15角'],
      ['2元', '20角'],
      ['3元2角', '32角'],
    ])
    order(
      ['确认单价和数量', '用乘法算总价', '检查付的钱够不够', '付钱减总价，核对找零'],
      '给购物计算的过程排队。',
    )
    judge('3元加4角等于7元。', false, '先统一单位：30角＋4角＝34角，是3元4角。')
    const cost = a * b,
      paid = Math.ceil(cost / 10) * 10 + 10
    calc(
      `每件${a}元，买${b}件，付${paid}元，找回几元？`,
      paid - cost,
      `总价${a}×${b}＝${cost}元，找回${paid}－${cost}＝${paid - cost}（元）。`,
    )
    calc(
      `有${cost}元，每件${a}元，买好1件后，还能买几件？`,
      b - 1,
      `总共可以买${cost}÷${a}＝${b}件，减去买好的1件，剩${b - 1}件。`,
    )
  }
  return quest.stages.length === 8 ? quest : null
}
