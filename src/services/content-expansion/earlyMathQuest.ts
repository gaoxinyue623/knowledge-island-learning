import {
  G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
  gradeOneShenzhenMathUpperCurriculum,
  gradeOneShenzhenMathUpperDefinitions,
} from '@/data/curriculum/grade-1/math-bnu-upper'
import { productionConfig } from '@/config/production'
import type { ContentExpansionBundle } from '@/types'
import type { EarlyMathQuestVisual, ReadingQuest, SolidShape } from '@/types/reading-quest'
import { createMathQuestBuilder } from './mathQuestBuilder'

// Local, untimed practice. It never writes assessment, mastery or map state.
export function createEarlyMathQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  const d = gradeOneShenzhenMathUpperDefinitions.find(
    (item) =>
      item.knowledgePointId === bundle.knowledgePointId && item.lessonId === bundle.lessonId,
  )
  if (
    productionConfig.isProduction ||
    !productionConfig.allowUnreviewedQuestions ||
    !d ||
    bundle.textbookId !== G1_SHENZHEN_MATH_S1_TEXTBOOK_ID ||
    bundle.unitId !== gradeOneShenzhenMathUpperCurriculum.units[d.unitIndex]?.id ||
    bundle.learningContent.sourceId !== G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID ||
    bundle.learningContent.isSample ||
    bundle.learningContent.knowledgePointId !== bundle.knowledgePointId ||
    bundle.learningContent.lessonId !== bundle.lessonId
  )
    return null
  const quest: ReadingQuest = {
    id: 'early-math-quest:v1:' + bundle.textbookId + ':' + d.knowledgePointId,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G1_SHENZHEN_MATH_S1_EXERCISE_SOURCE_ID,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    subject: 'MATH',
    stages: [],
  }
  const { choice, calc, judge, match, order, tiles } = createMathQuestBuilder(quest, d.family, {
    foundationOnly: true,
    titles: [
      '准备出发',
      '想一想',
      '看图发现',
      '配对小能手',
      '排排队',
      '辨一辨',
      '生活小挑战',
      '再想一步',
    ],
  })
  const { family, total: n, part: p } = d
  const rest = n - p
  const numberLimit = d.unitIndex === 2 ? 5 : 10
  const dots = (first: number, second = 0, removed = 0): EarlyMathQuestVisual => ({
    type: 'counters',
    first,
    second,
    removed,
  })
  const numberTiles = (
    prompt: string,
    value: number,
    explanation: string,
    visual?: EarlyMathQuestVisual,
  ) =>
    tiles(
      prompt,
      String(value),
      [
        String(value),
        String(value === numberLimit ? numberLimit - 2 : value + 1),
        String(value === 0 ? 2 : value - 1),
      ],
      explanation,
      '先观察，也可以边点边数，再选一张数字卡。',
      visual,
    )

  if (family === 'welcome') {
    choice(
      '同伴正在介绍自己，你可以怎样做？',
      ['先安静听完'],
      ['马上大声打断', '转身玩文具'],
      '先认真听，能更好地认识新朋友。',
    )
    choice(
      '想在课堂上发言，怎样做？',
      ['举手，等老师请我说'],
      ['一直大喊', '拍别人的桌子'],
      '举手示意，轮到自己再说。',
    )
    numberTiles('每个圆点代表一本书。一共有几本？', 3, '一个点一本书，共3本。', dots(3))
    match([
      ['铅笔', '写字用'],
      ['书包', '装文具'],
      ['椅子', '坐下用'],
    ])
    order(['取出课本和铅笔', '把它们摆整齐', '准备好，听老师讲'], '按这次准备活动的先后排队。')
    judge('听别人说话时，也可以学习新方法。', true, '认真听，能听到不同的想法。')
    choice(
      '整理书包时，选出两种好做法。',
      ['轻拿轻放', '把书本放整齐'],
      ['把书扔在地上'],
      '爱护自己的物品，也照顾身边的同伴。',
    )
    choice(
      '认识新朋友，可以怎样开口？',
      ['你好，我叫小乐。你叫什么名字？'],
      ['你不能跟我玩', '抢走对方的笔'],
      '清楚、有礼貌地介绍自己。',
    )
  } else if (family === 'count' || family === 'record') {
    numberTiles(
      family === 'record'
        ? '记录卡上一个圆点代表读了一本书，一共记录了几本？'
        : '点一点，图中有几个圆片？',
      n,
      '每个圆点数一次，一共有' + n + '个。',
      dots(n),
    )
    choice(
      '数数时，怎样做不容易数错？',
      ['每个物品只数一次'],
      ['看到喜欢的就多数一次', '只看这一排有多长'],
      '不漏数，不重复数。',
    )
    numberTiles(
      '顺着数：' + (n - 1) + '、' + n + '、□。空格填几？',
      n + 1,
      '顺着数，每次数下一个数。',
    )
    match([
      ['三个', '3'],
      ['五个', '5'],
      ['八个', '8'],
    ])
    order([String(n - 1), String(n), String(n + 1)], '把数字从小到大排好。')
    judge(
      '把这些圆片排得更松，只要没添也没拿走，总数就不变。',
      true,
      '摆放的位置变了，圆片没有变多或变少。',
    )
    choice(
      '今天实际读了2本书，记录卡应该怎么画？',
      ['画2个点'],
      ['画5个点更好看', '画3个点'],
      '一个点代表一本书，记录真实数量。',
    )
    choice(
      family === 'record' ? '今天没做这项活动，可以记什么？' : '“1盒彩笔”里的1，数的是什么？',
      [family === 'record' ? '0次' : '1个盒子'],
      family === 'record' ? ['1次', '随便记一个数'] : ['盒里一定只有1支笔', '盒里一定有10支笔'],
      family === 'record'
        ? '没有发生这项活动，就记录0次。'
        : '数的是整盒；要知道里面几支，还得分别数。',
    )
  } else if (family === 'ordinal') {
    const names = ['小兔', '小猫', '小狗', '小鸟', '小熊'].slice(0, n)
    const queue: EarlyMathQuestVisual = { type: 'queue', labels: names }
    choice(
      '按图上从左往右的方向数，第' + p + '位是谁？',
      [names[p - 1]!],
      names.filter((_, i) => i !== p - 1),
      '先确定左边起点，第' + p + '位是' + names[p - 1] + '。',
      '这里的左右是看图人的左右。',
      queue,
    )
    numberTiles('这一队一共有几位朋友？', n, '问“几位”看总数，不是只看某个位置。', queue)
    choice(
      '从右往左数，第1位是谁？',
      [names[n - 1]!],
      [names[0]!, names[1]!],
      '换了起点，从最右边开始数。',
      '从图的右端开始。',
      queue,
    )
    match([
      ['一共有几个', '问总数'],
      ['从左数第几个', '问位置'],
      ['从哪边数起', '先定方向'],
    ])
    order(names, '按刚才图中的从左到右顺序，给朋友排队。')
    judge('“有3个苹果”和“第3个苹果”，说的是同一个意思。', false, '3个说数量；第3个说位置。')
    numberTiles(
      '这队朋友没动，从左数第' + p + '位，从右数是第几位？',
      n - p + 1,
      '从最右边重新一个一个数，可以找到同一位朋友。',
      queue,
    )
    choice(
      '从另一边数，朋友总数会变吗？',
      ['不会，仍然是' + n + '位'],
      ['会多1位', '会少1位'],
      '改变数的方向，不增加也不减少朋友。',
    )
  } else if (family === 'zero') {
    numberTiles('篮子里一个圆片也没有，选哪个数字？', 0, '什么也没有，可以用0表示。', dots(0))
    choice(
      '尺子上的0还可以表示什么？',
      ['测量的起点'],
      ['有10厘米长', '不能读的数字'],
      '0不只表示没有，还可以表示起点。',
    )
    numberTiles('顺着数：0、□、2，空格填几？', 1, '0后面是1，再后面是2。')
    match([
      ['一个也没有', '0'],
      ['一个圆片', '1'],
      ['两个圆片', '2'],
    ])
    order(['0', '1', '2'], '把数字从小到大排好。')
    judge('空篮子里的鱼，可以记作1条。', false, '没有鱼应该记0条，不是1条。')
    numberTiles(
      '原来3个圆片，全拿走了。现在还有几个？',
      0,
      '全部拿走，一个也没留下。',
      dots(3, 0, 3),
    )
    choice('要表示“没有”，选哪张卡？', ['0'], ['6', '9'], '0写成一圈，别与6和9混淆。')
  } else if (family === 'compare') {
    tiles(
      '蓝色圆片的数量 □ 黄色圆片的数量，选合适的符号。',
      '＞',
      ['＞', '＜', '＝'],
      '蓝色5个、黄色3个，5＞3。',
      '一一配对，哪一组有剩余？',
      dots(5, 3),
    )
    choice('选出两句正确的比较。', ['5＞3', '3＜5'], ['3＞5'], '开口向大数，反过来比较也要换符号。')
    tiles(
      '图中两组圆片一样多：3 □ 3。',
      '＝',
      ['＞', '＜', '＝'],
      '两组都是3个，用等号。',
      '每个蓝色配一个黄色。',
      dots(3, 3),
    )
    match([
      ['4比2大', '4＞2'],
      ['1比3小', '1＜3'],
      ['2与2一样多', '2＝2'],
    ])
    order(['3', '4', '5'], '把数字从小到大排好。')
    judge('一排摆得长，一定比另一排多。', false, '可能只是间隔大。比较多少要数数或一一对应。')
    choice(
      '4把椅子坐4位小朋友，每人一把，够吗？',
      ['正好够'],
      ['不够', '还多一把'],
      '4和4一样多，每人正好一把。',
    )
    tiles('交换左右两组，再比较：3 □ 5。', '＜', ['＞', '＜', '＝'], '3＜5，开口仍朝5。')
  } else if (
    family === 'add' ||
    family === 'subtract' ||
    family === 'mixed' ||
    family === 'zero-math'
  ) {
    const subtract = family === 'subtract' || family === 'zero-math'
    numberTiles(
      subtract ? '原来' + n + '个，拿走' + p + '个，还剩几个？' : '两组圆片合起来，一共有几个？',
      subtract ? rest : n,
      subtract ? n + '－' + p + '＝' + rest : p + '＋' + rest + '＝' + n,
      subtract ? dots(n, 0, p) : dots(p, rest),
    )
    choice(
      subtract ? '从总数里拿走一些，求剩下的，用什么方法？' : '求两部分合起来有多少，用什么方法？',
      [subtract ? '减法' : '加法'],
      [subtract ? '加法' : '减法', '只数其中一部分'],
      '先想数量是合在一起，还是拿走了。',
    )
    numberTiles(
      family === 'zero-math'
        ? '4个圆片全部拿走，还剩几个？'
        : '一共' + n + '个，已知一部分' + p + '个，另一部分几个？',
      family === 'zero-math' ? 0 : rest,
      family === 'zero-math' ? '4－4＝0。' : n + '－' + p + '＝' + rest + '。',
      family === 'zero-math' ? dots(4, 0, 4) : { type: 'part-whole', total: n, known: p },
    )
    match(
      family === 'zero-math'
        ? [
            ['4＋0', '4'],
            ['3－3', '0'],
            ['2－0', '2'],
          ]
        : subtract
          ? [
              ['5－1', '4'],
              ['4－2', '2'],
              ['3－2', '1'],
            ]
          : [
              ['1＋1', '2'],
              ['1＋2', '3'],
              ['2＋2', '4'],
            ],
    )
    order(['先看一共有几个', '再看拿走几个', '最后数剩下几个'], '按这个摆物减法的过程排队。')
    judge('4－0和4－4的结果一样。', false, '4－0＝4，没拿走；4－4＝0，全拿走。')
    calc(
      '有' + n + '块积木，收起1块，还在外面几块？',
      n - 1,
      n + '－1＝' + (n - 1) + '（块）。',
      '拿走1块，再数剩下的。',
    )
    numberTiles(
      '□＋' + p + '＝' + n + '，缺少的是几？',
      rest,
      rest + '＋' + p + '＝' + n + '，可以摆出来检查。',
    )
  } else if (family === 'decompose' || family === 'ten-game') {
    numberTiles(
      '总共' + n + '颗珠子，露出' + p + '颗，藏着几颗？',
      rest,
      n + '－' + p + '＝' + rest + '。',
      { type: 'part-whole', total: n, known: p },
    )
    choice(
      '哪两组都能合成' + n + '？',
      ['1和' + (n - 1), '2和' + (n - 2)],
      ['1和' + (n - 2)],
      '把每组的两部分合起来检查。',
    )
    numberTiles('看图，两组圆片合起来有几个？', n, p + '＋' + rest + '＝' + n + '。', dots(p, rest))
    match([
      ['1的搭档', String(n - 1)],
      ['2的搭档', String(n - 2)],
      ['3的搭档', String(n - 3)],
    ])
    // The matching task needs its own target total, not a hidden lesson assumption.
    const matching = quest.stages[3]
    if (matching?.kind === 'activity')
      matching.activity.instruction = '合起来等于' + n + '，给每张数字卡找搭档。'
    order(['0', String(p), String(n)], '把这些数字从小到大排队。')
    judge('把一个圆片从左组移到右组，两组的总数不变。', true, '只是换了位置，没有增加或拿走。')
    numberTiles(
      '有' + n + '张贴纸，送给朋友1张，自己还有几张？',
      n - 1,
      n + '－1＝' + (n - 1) + '（张）。',
    )
    numberTiles(
      '左边摆0个，右边要摆几个，两组才能合成' + n + '？',
      n,
      '0和' + n + '也能合成' + n + '。',
    )
  } else if (family === 'add-pattern' || family === 'subtract-pattern') {
    const add = family === 'add-pattern',
      fixed = add ? 2 : n
    const result = (b: number) => (add ? fixed + b : fixed - b)
    const sign = add ? '＋' : '－'
    numberTiles(
      fixed + sign + '2＝□',
      result(2),
      fixed + sign + '2＝' + result(2) + '。',
      add ? dots(fixed, 2) : dots(fixed, 0, 2),
    )
    choice(
      add ? '2＋1变成2＋2，只多放1个，得数怎样变？' : '9－1变成9－2，多拿走1个，剩下怎样变？',
      [add ? '多1' : '少1'],
      [add ? '少1' : '多1', '不变'],
      add ? '多放1个，合起来多1。' : '多拿走1个，剩下少1。',
    )
    numberTiles(fixed + sign + '0＝□', fixed, '加0或减0，数量都不变。')
    match([0, 1, 2].map((b) => [fixed + sign + b, String(result(b))]))
    order(
      [String(result(1)), String(result(2)), String(result(3))],
      add ? '把得数从小到大排好。' : '把得数从大到小排好。',
    )
    judge(
      add ? '2＋3比2＋2多1。' : '9－3比9－2多1。',
      add,
      add ? '5比4多1。' : '6比7少1，不是多1。',
    )
    calc(
      fixed + sign + '3＝？',
      result(3),
      fixed + sign + '3＝' + result(3) + '。',
      '从上一道算式的结果想一想。',
    )
    choice(
      '找规律时，要先看看什么？',
      ['哪个数不变，哪个数在变'],
      ['只看算式写得漂不漂亮', '不用看算式'],
      '找出变化与不变，才能解释规律。',
    )
  } else if (family === 'classify') {
    const visual: EarlyMathQuestVisual = { type: 'classification' }
    choice(
      p === 1 ? '图中蓝色卡片共有几张？' : '按颜色分，蓝色圆形和谁一组？',
      [p === 1 ? '2张' : '蓝色正方形'],
      p === 1 ? ['1张', '4张'] : ['黄色圆形', '黄色正方形'],
      '按颜色分，只看颜色；蓝色卡片有两张。',
      '每张卡片都有颜色和形状名称。',
      visual,
    )
    choice(
      '按形状分，选出所有圆形卡片。',
      ['1号', '2号'],
      ['3号', '4号'],
      '1号和2号都是圆形，颜色不同也可以分在圆形组。',
      '这次只看形状。',
      visual,
    )
    numberTiles('按颜色分成两组后，这些卡片一共还是几张？', 4, '四张都在，只是分组不同。', visual)
    match(
      n === 0
        ? [
            ['故事书', '阅读用品'],
            ['外套', '衣服'],
            ['玩具车', '玩具'],
          ]
        : [
            ['圆形和正方形分开放', '按形状'],
            ['蓝色和黄色分开放', '按颜色'],
            ['大卡和小卡分开放', '按大小'],
          ],
    )
    order(['先确定分类标准', '按照这个标准分组', '检查每张卡放得对不对'], '给分类步骤排队。')
    judge('同一堆物品，只能有一种分类方法。', false, '可以换标准，但同一次分类要用说好的标准。')
    choice(
      '整理房间，哪些可以放在“衣服”一组？',
      ['上衣', '裤子'],
      ['图画书'],
      '按照用途，把穿的衣服放在一起。',
    )
    choice(
      '蓝色圆形和黄色圆形，什么相同？',
      ['形状'],
      ['颜色', '颜色和形状都不同'],
      '它们都是圆形。相同与不同要说清看的是哪个特点。',
      '比较两张圆形卡。',
      visual,
    )
  } else if (family === 'position') {
    const visual: EarlyMathQuestVisual = { type: 'classroom' }
    choice(
      '按画面的左右看，课桌左边是什么？',
      ['书包'],
      ['椅子', '黑板'],
      '同一排从左到右是书包、课桌、椅子。',
      '这里都按看图人的左右回答。',
      visual,
    )
    choice(
      '黑板在课桌的哪一边？',
      ['上面'],
      ['下面', '右边'],
      '这是位置图里的上面，不是在问真实教室的楼层。',
      '看画面里的上下。',
      visual,
    )
    choice(
      '课桌右边是什么？',
      ['椅子'],
      ['书包', '窗户'],
      '椅子在课桌同一排的右边。',
      '从课桌向右看。',
      visual,
    )
    match([
      ['课桌的上面', '黑板'],
      ['课桌的左边', '书包'],
      ['课桌的右边', '椅子'],
    ])
    order(['书包', '课桌', '椅子'], '按刚才图中下排的从左到右顺序排队。')
    judge('说“在左边”时，还要讲清楚在谁的左边。', true, '位置是相对的，要说清参照物和方向。')
    choice(
      '队伍前面到后面依次是小乐、小安、小雨。小安前面是谁？',
      ['小乐'],
      ['小雨', '没人'],
      '先看题目说的排队方向。',
    )
    choice(
      '图里书包的上面是什么？',
      ['书架'],
      ['窗户', '椅子'],
      '沿着书包所在的一列向上看。',
      '按画面位置找。',
      visual,
    )
  } else if (family === 'solid') {
    const shapes: SolidShape[] = ['cube', 'cuboid', 'cylinder', 'sphere']
    const labels = ['正方体', '长方体', '圆柱', '球']
    const focus = n < 4 ? n : 2
    const all: EarlyMathQuestVisual = { type: 'solids', shapes }
    choice(
      '找一找，哪号图形是' + labels[focus] + '？',
      [String(focus + 1) + '号'],
      shapes.flatMap((_, i) => (i === focus ? [] : [String(i + 1) + '号'])),
      String(focus + 1) + '号是' + labels[focus] + '，要观察整个立体。',
      '看看哪些面平平的，哪些地方弯弯的。',
      all,
    )
    choice(
      '下面哪句话说得对？',
      ['正方体有6个一样大的正方形面'],
      ['圆柱只有一个圆形平面', '球有6个平面'],
      '正方体的每个面都是一样大的正方形。',
    )
    numberTiles('图中能看见几个正方体？没有藏住的积木。', 2, '1号和3号是正方体，一共2个。', {
      type: 'solids',
      shapes: ['cube', 'sphere', 'cube', 'cylinder'],
    })
    match([
      ['魔方的主要外形', '正方体'],
      ['长盒子的主要外形', '长方体'],
      ['皮球的主要外形', '球'],
    ])
    order(
      ['拿一件安全的物品', '观察它的整个外形', '说说它像哪种立体'],
      '按这次观察活动的步骤排队。',
    )
    judge('纸上画的圆，和手里拿的球，是同一种图形名称。', false, '圆是平面图形，球是立体图形。')
    choice(
      '圆柱形空罐子，怎样摆通常更容易站稳？',
      ['圆形平面朝下'],
      ['横着轻推', '斜放在桌边'],
      '平面朝下能站立，横放时可以滚；还要远离桌边。',
      '观察两个平面和弯弯的侧面。',
      { type: 'solids', shapes: ['cylinder'] },
    )
    choice(
      '选出两种正确的观察。',
      ['球轻轻一推可以向不同方向滚', '圆柱横放时可以滚'],
      ['所有立体都不能滚'],
      '滚动还与摆放方式有关。用安全物品在平坦处轻轻试一试。',
    )
  } else if (family === 'day') {
    choice(
      '小乐的一天：起床、上学、吃午饭、晚上睡觉。哪件最先？',
      ['起床'],
      ['吃午饭', '晚上睡觉'],
      '根据题目给出的故事，起床最先。',
    )
    choice(
      '在刚才的故事里，吃午饭是在上学之前还是之后？',
      ['之后'],
      ['之前', '同时'],
      '按故事的先后顺序回答。',
    )
    numberTiles(
      '小乐读了图中圆点表示的这些书，一个点一本。他读了几本？',
      3,
      '数出3个点，记录3本。',
      dots(3),
    )
    match([
      ['最先做的事', '开始'],
      ['接着做的事', '然后'],
      ['排在末尾的事', '最后'],
    ])
    order(['起床', '上学', '吃午饭', '晚上睡觉'], '按小乐故事里的一天排队。')
    judge(
      '每个人一天做的事情，必须完全一样。',
      false,
      '每个人的一天可能不同，要记录真实发生的事情。',
    )
    choice(
      '记录自己的一天，应该怎么做？',
      ['按真实发生的先后记录'],
      ['照抄别人的记录', '只选最好看的数字'],
      '可以用图画、圆点、数字和短句记录。',
    )
    choice(
      '小安先收书，再装铅笔，最后合上书包。第二步是什么？',
      ['装铅笔'],
      ['收书', '合上书包'],
      '第二步就是排在中间的装铅笔。',
    )
  }
  return quest
}
