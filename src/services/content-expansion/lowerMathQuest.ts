import { isLocallyApproved } from '../../data/curriculum/localApproval'
import {
  G1_SHENZHEN_MATH_S2_TEXTBOOK_ID,
  G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID,
  gradeOneShenzhenMathLowerCurriculum,
  gradeOneShenzhenMathLowerDefinitions,
} from '@/data/curriculum/grade-1/math-bnu-lower'
import {
  makeNumberGrid,
  PLANE_SHAPES,
  PLANE_LABELS,
  TANGRAM_PIECES,
} from '@/data/content-expansion/math-lower-visuals'
import { productionConfig } from '@/config/production'
import type { ContentExpansionBundle } from '@/types'
import type { MathQuestVisual, ReadingQuest } from '@/types/reading-quest'
import { createMathQuestBuilder } from './mathQuestBuilder'

export function createLowerMathQuest(bundle: ContentExpansionBundle): ReadingQuest | null {
  const d = gradeOneShenzhenMathLowerDefinitions.find(
    (item) =>
      item.knowledgePointId === bundle.knowledgePointId && item.lessonId === bundle.lessonId,
  )
  if (
    !d ||
    (!isLocallyApproved(bundle.learningContent) && !productionConfig.allowUnreviewedQuestions) ||
    bundle.textbookId !== G1_SHENZHEN_MATH_S2_TEXTBOOK_ID ||
    bundle.unitId !== gradeOneShenzhenMathLowerCurriculum.units[d.unitIndex]?.id ||
    bundle.learningContent.sourceId !== G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID ||
    bundle.learningContent.isSample ||
    bundle.learningContent.lessonId !== d.lessonId ||
    bundle.learningContent.knowledgePointId !== d.knowledgePointId
  )
    return null
  const quest: ReadingQuest = {
    id: 'lower-math-quest:v1:' + bundle.textbookId + ':' + d.knowledgePointId,
    textbookId: bundle.textbookId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    sourceId: G1_SHENZHEN_MATH_S2_EXERCISE_SOURCE_ID,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    subject: 'MATH',
    stages: [],
  }
  const { calc, choice, judge, match, order, tiles } = createMathQuestBuilder(quest, d.family, {
    foundationOnly: true,
    titles: [
      '看图出发',
      '方法小侦探',
      '动脑找一找',
      '配对小能手',
      '步骤排排队',
      '纠错小老师',
      '生活小挑战',
      '再想一步',
    ],
  })
  const { family, a, b } = d
  const limit = d.unitIndex === 0 || d.unitIndex === 3 || family === 'review20' ? 20 : 100
  const number = (prompt: string, answer: number, explanation: string, visual?: MathQuestVisual) =>
    tiles(
      prompt,
      String(answer),
      [
        String(answer),
        String(answer === limit ? answer - 2 : answer + 1),
        String(answer === 0 ? 2 : answer - 1),
      ],
      explanation,
      '先理解每个数表示什么，再点一张数字卡。',
      visual,
    )
  const abacus = (value: number, places: 2 | 3 = value === 100 ? 3 : 2): MathQuestVisual => ({
    type: 'abacus',
    value,
    places,
  })

  if (family === 'place20' || family === 'hundred' || family === 'place100') {
    const small = family === 'place20',
      hundred = family === 'hundred'
    number(
      '看计数器，这个数是多少？',
      a,
      hundred
        ? '1个百，0个十，0个一，写作100。'
        : Math.floor(a / 10) + '个十和' + (a % 10) + '个一，组成' + a + '。',
      abacus(a),
    )
    number(
      hundred ? '10个十可以换成几个百？' : '这个数的十位上有几个十？',
      hundred ? 1 : Math.floor(a / 10),
      hundred ? '10个十是1个百。' : '十位数字表示几个十。',
    )
    number(
      small ? '2个十、0个一，写作多少？' : '5个十、0个一，写作多少？',
      small ? 20 : 50,
      '个位的0占着位置，不能省掉。',
      abacus(small ? 20 : 50),
    )
    match(
      small
        ? [
            ['1个十和1个一', '11'],
            ['1个十和4个一', '14'],
            ['2个十', '20'],
          ]
        : [
            ['1个百', '100'],
            ['3个十', '30'],
            ['5个一', '5'],
          ],
    )
    order(
      small ? ['10', '14', '20'] : hundred ? ['80', '90', '100'] : ['3', '30', '53'],
      '把这些数从小到大排好。',
    )
    judge(
      small ? '20的个位没有珠子，可以只写2。' : '50的个位没有珠子，可以只写5。',
      false,
      '0用来占位，省掉0就变成另一个数了。',
    )
    number(
      small ? '一捆10根小棒，再放3根，共几根？' : '4捆小棒，每捆10根，共几根？',
      small ? 13 : 40,
      small ? '1个十和3个一是13。' : '4个十是40。',
    )
    number(
      small
        ? '20里有几个十？'
        : hundred
          ? '99后面的一个数是几？'
          : '把53的十位和个位交换，得到几？',
      small ? 2 : hundred ? 100 : 35,
      small ? '20是2个十。' : hundred ? '99后面是100。' : '3在十位、5在个位，写作35。',
    )
  } else if (family === 'make-ten' || family === 'review20') {
    const need = 10 - a,
      left = b - need,
      sum = a + b
    calc(
      a + '＋' + b + '＝？',
      sum,
      '把' + b + '分成' + need + '和' + left + '，先凑10，再加' + left + '得' + sum + '。',
      '点图上的按钮，观察重新分组。',
      { type: 'ten-bridge', a, b, operation: 'add' },
    )
    number(a + '离10还差几？', need, a + '＋' + need + '＝10。')
    number(
      '把' + b + '分成' + need + '和□，空格填几？',
      left,
      need + '＋' + left + '＝' + b + '，两部分要合回原数。',
    )
    match([
      [a + '＋' + need, '10'],
      ['10＋' + left, String(sum)],
      [a + '＋' + (b - 1), String(sum - 1)],
    ])
    order(
      [
        '把' + b + '分成' + need + '和' + left,
        '先算' + a + '＋' + need + '＝10',
        '再算10＋' + left + '＝' + sum,
      ],
      '按这次给' + a + '凑十的方法排队。',
    )
    judge(a + '＋' + b + '与' + b + '＋' + a + '的得数一样。', true, '交换两个加数的位置，和不变。')
    calc(
      '有' + a + '只小鸭，又来' + (b + 1) + '只，一共有几只？',
      sum + 1,
      a + '＋' + (b + 1) + '＝' + (sum + 1) + '（只）。',
      '再用一次凑十法。',
    )
    number(
      family === 'review20'
        ? sum + '－' + a + '＝□，空格填几？'
        : a + '＋□＝' + sum + '，空格填几？',
      b,
      a + '＋' + b + '＝' + sum + '，根据整体与部分来检查。',
    )
  } else if (family === 'break-ten') {
    const ones = a - 10,
      tenLeft = 10 - b,
      answer = a - b
    calc(
      a + '－' + b + '＝？',
      answer,
      '先算10－' + b + '＝' + tenLeft + '，再加原来的' + ones + '，得到' + answer + '。',
      '点按钮，把从10里拿走的部分划掉。',
      { type: 'ten-bridge', a, b, operation: 'subtract' },
    )
    number(a + '分成10和几？', ones, '10＋' + ones + '＝' + a + '。')
    number(
      '先从10里拿走' + b + '，这部分还剩几？',
      tenLeft,
      '10－' + b + '＝' + tenLeft + '，还要记得另外的' + ones + '。',
    )
    match([
      [a + '－' + b, String(answer)],
      [a - 1 + '－' + b, String(answer - 1)],
      [a + 1 + '－' + b, String(answer + 1)],
    ])
    order(
      [
        '把' + a + '分成10和' + ones,
        '先算10－' + b + '＝' + tenLeft,
        '再算' + tenLeft + '＋' + ones + '＝' + answer,
      ],
      '按照破十法的步骤排队。',
    )
    judge(
      '算完10－' + b + '，就已经算完' + a + '－' + b + '了。',
      false,
      '还要加上原来没动的' + ones + '个一，不能漏掉。',
    )
    calc(
      '有' + a + '支笔，借走' + (b - 1) + '支，还剩几支？',
      answer + 1,
      a + '－' + (b - 1) + '＝' + (answer + 1) + '（支）。',
      '比刚才少借走1支。',
    )
    number(
      b + '＋□＝' + a + '，空格填几？',
      answer,
      '想加算减：' + b + '＋' + answer + '＝' + a + '。',
    )
  } else if (
    family === 'add-plain' ||
    family === 'subtract-plain' ||
    family === 'column-add' ||
    family === 'column-subtract' ||
    family === 'round' ||
    family === 'tens' ||
    family === 'review100'
  ) {
    const add =
      family === 'add-plain' || family === 'column-add' || family === 'round' || family === 'tens'
    const sign = add ? '＋' : '－',
      answer = add ? a + b : a - b
    const round = family === 'round',
      tens = round || family === 'tens' || family === 'review100',
      early = d.unitIndex === 0,
      step = tens ? 10 : 1
    const result = (right: number) => (add ? a + right : a - right)
    calc(
      a + sign + b + '＝？',
      answer,
      a +
        sign +
        b +
        '＝' +
        answer +
        '。' +
        (tens ? '整十数表示几个十。' : '相同数位分别计算，这道题不进退位。'),
      '看清十位和个位。',
      family === 'column-add' || family === 'column-subtract'
        ? { type: 'column-calculation', a, b, operation: add ? 'add' : 'subtract' }
        : abacus(a),
    )
    choice(
      early
        ? '摆小棒算13＋2，先把哪些小棒合起来？'
        : tens
          ? '加减整十数，主要改变什么？'
          : '按竖式计算，哪种对齐方式正确？',
      [early ? '3根单根与2根单根' : tens ? '十的个数' : '个位对个位，十位对十位'],
      [
        early ? '把1捆和2根都当成整捆' : tens ? '把整十数当成几个一' : '数字随便错开一格',
        '只看数字写得大不大',
      ],
      early
        ? '先算3个一加2个一，原来的一捆10根不动。'
        : tens
          ? '一个十是10个一，不能混成同一个单位。'
          : '相同数位表示相同计数单位，才能对齐计算。',
    )
    number(
      '看结果' + answer + '，个位数字是几？',
      answer % 10,
      '个位在最右边，数字是' + (answer % 10) + '。',
      abacus(answer),
    )
    match([0, 1, 2].map((i) => [a + sign + (b - i * step), String(result(b - i * step))]))
    order(
      early
        ? ['把13分成10和3', '先算3＋2＝5', '再算10＋5＝15']
        : round
          ? ['看清原来有几个十', '计算十的个数', '把结果说成几十']
          : ['个位对齐，十位对齐', '从个位算起', '再算十位，写下结果'],
      early
        ? '按拆数、相加、合起来的方法排队。'
        : round
          ? '按用整十数计算的方法排队。'
          : '按这次竖式计算的步骤排队。',
    )
    judge(
      tens
        ? '加上20，应该在个位上加2。'
        : add
          ? '这道加法的个位相加没有满十。'
          : '这道减法的个位够减，不需要退位。',
      !tens,
      tens
        ? '20表示2个十，改变十位，不是个位加2。'
        : add
          ? '个位相加不满十，再算十位。'
          : '先检查个位够减，再从相同数位中相减。',
    )
    if (family === 'tens')
      calc('有65张卡，送出40张，还剩几张？', 25, '65－40＝25（张），6个十减4个十。')
    else if (round) calc('有50个果子，送出10个，还剩几个？', 40, '50－10＝40（个），5个十减1个十。')
    else
      calc(
        '原来有' + a + '本书，' + (add ? '又添了' : '借走了') + b + '本，现在有几本？',
        answer,
        a + sign + b + '＝' + answer + '（本）。',
      )
    number(
      '□' + sign + b + '＝' + answer + '，原来的数是几？',
      a,
      '可以用' + answer + (add ? '－' : '＋') + b + '＝' + a + '检查。',
    )
  } else if (family === 'difference' || family === 'more-less') {
    const difference = family === 'difference',
      higher = difference ? a : a + b,
      lower = difference ? b : a,
      gap = higher - lower
    calc(
      difference
        ? higher + '比' + lower + '多多少？'
        : '小明有' + a + '个，小红比他多' + b + '个，小红有几个？',
      difference ? gap : higher,
      difference
        ? higher + '－' + lower + '＝' + gap + '，求的是差。'
        : a + '＋' + b + '＝' + higher + '，求的是较多的数量。',
    )
    number(
      difference ? lower + '比' + higher + '少多少？' : '小丽比有23个的小明少3个，小丽有几个？',
      difference ? gap : 20,
      difference ? '换个问法，问的仍然是两者的差。' : '23－3＝20，求较少的数量。',
    )
    number(
      difference ? '比' + lower + '多' + gap + '的数是几？' : '27比23多多少？',
      difference ? higher : 4,
      difference
        ? lower + '＋' + gap + '＝' + higher + '。'
        : '27－23＝4，问差用减法，虽然有“多”字。',
    )
    match(
      difference
        ? [
            ['14比6多多少', '14－6'],
            ['比6多8的数', '6＋8'],
            ['比14少5的数', '14－5'],
          ]
        : [
            ['比23多4的数', '23＋4'],
            ['比23少3的数', '23－3'],
            ['27比23多多少', '27－23'],
          ],
    )
    order(
      ['先找已经知道的数量', '看清问题要求什么', '按数量关系选择算式'],
      '按读题、审题、列式的顺序排队。',
    )
    judge(
      '题目中只要有“多”字，就一定用加法。',
      false,
      '求相差多少用减法；求较多数量才可能用加法，先看已知与未知。',
    )
    calc(
      difference
        ? '小乐有12张卡，小安有7张，小乐比小安多几张？'
        : '小乐有47张卡，小安有23张，小乐比小安多几张？',
      difference ? 5 : 24,
      difference ? '12－7＝5（张）。' : '47－23＝24（张），这道题不退位。',
      '这里问的是两者相差多少。',
    )
    number(
      difference
        ? '小安有7张，小乐比他多5张，小乐有几张？'
        : '小红有27个，比小明多4个，小明有几个？',
      difference ? 12 : 23,
      difference ? '7＋5＝12（张）。' : '27－4＝23（个）。已知较多的，求原来的较少数量。',
    )
  } else if (family === 'word20' || family === 'comic') {
    const comic = family === 'comic',
      whole = comic ? a + b : a,
      first = comic ? a : b,
      second = whole - first
    number(
      comic ? '原来5本书，又添3本，一共有几本？' : '共有14只鸭，水里5只，岸上几只？',
      comic ? whole : second,
      comic ? '5＋3＝8（本）。' : '14－5＝9（只）。',
      comic
        ? { type: 'counters', first: 5, second: 3 }
        : { type: 'part-whole', total: whole, known: first },
    )
    choice(
      '求两部分合起来一共有多少，选哪种方法？',
      ['加法'],
      ['减法', '只数其中一部分'],
      '求整体，把两部分相加。',
    )
    number(
      '一共' + whole + '个，拿走' + second + '个，还剩几个？',
      first,
      whole + '－' + second + '＝' + first + '。',
    )
    match([
      [first + '＋' + second, String(whole)],
      [whole + '－' + first, String(second)],
      [whole + '－' + second, String(first)],
    ])
    order(
      ['先画原来的数量', '再画发生的变化', '最后画结果并配算式'],
      '给这次三格数学连环画排顺序。',
    )
    judge(
      '只要得数写对，故事里的数量和算式不对应也没关系。',
      false,
      '每个数都要说得出表示什么，图、问题与算式要一致。',
    )
    calc('有8支铅笔，借出3支，还剩几支？', 5, '8－3＝5（支）。')
    choice(
      '原有5本书，又添3本。哪些问题与这个故事有关？',
      ['现在一共有几本书', '后来增加了几本书'],
      ['明天天气怎样'],
      '从给出的信息提出能回答的数学问题。',
    )
  } else if (family === 'count100') {
    number('28、29、□、31，空格填几？', 30, '29之后是30。')
    number('每次多2：24、26、28、□。', 30, '两个两个数，28后接30。')
    number('每次多5：15、20、25、□。', 30, '五个五个数，25后接30。')
    match([
      ['29后面的数', '30'],
      ['59后面的数', '60'],
      ['99后面的数', '100'],
    ])
    order(['70', '80', '90', '100'], '十个十个地顺着数，给这些数排队。')
    judge('一个一个数，59后面是50。', false, '59再往后是60，不是退回50。')
    number('10根小棒一捆，6捆表示多少根？', 60, '6个十是60。')
    number('倒着一个一个数：42、41、□、39。', 40, '41前面是40，倒着数每次少1。')
  } else if (family === 'compare100' || family === 'relative') {
    const relative = family === 'relative'
    if (relative)
      choice(
        '与20只小鸡相比，哪一群数量最接近？',
        ['22只'],
        ['58只', '85只'],
        '22与20相差最小，可以说差不多。',
      )
    else tiles('42 □ 38，选合适的符号。', '＞', ['＞', '＜', '＝'], '先比十位，4个十比3个十多。')
    choice(
      relative ? '85与20相比，哪个说法更合适？' : '42和38比较大小，先比哪一位？',
      [relative ? '85比20多得多' : '十位'],
      [relative ? '85比20少一些' : '个位', relative ? '两个数一样多' : '谁的字写得大'],
      relative ? '结合这两个数比较，85比20多很多。' : '两个都是两位数，先比十位。',
    )
    tiles(
      '57 □ 59，选合适的符号。',
      '＜',
      ['＞', '＜', '＝'],
      '十位一样，个位7小于9。',
      '先比十位，再比个位。',
      abacus(57),
    )
    match([
      ['42比38大', '42＞38'],
      ['57比59小', '57＜59'],
      ['50与50一样多', '50＝50'],
    ])
    order(['20', '22', '58', '85'], '把数量从少到多排好。')
    judge(
      relative
        ? '“多得多”在所有情境中都有同一个固定差值。'
        : '42的个位2比38的个位8小，所以42更小。',
      false,
      relative ? '这些描述要结合比较的数量理解，不能背固定门槛。' : '先比较十位，不能只看个位。',
    )
    choice(
      '甲组28个，乙组32个，哪个描述合适？',
      ['乙组比甲组多一些'],
      ['乙组比甲组少一些', '甲乙一样多'],
      '32比28多，数量比较接近。',
    )
    tiles('100 □ 99，选合适的符号。', '＞', ['＞', '＜', '＝'], '100比99大。')
  } else if (family === 'grid') {
    const puzzle = makeNumberGrid(a, b),
      visual: MathQuestVisual = { type: 'number-grid', cells: puzzle.cells }
    tiles(
      '问号里应填几？',
      String(puzzle.answer),
      ['1', '2', '3'],
      '同时检查问号所在的横行和竖列，缺少的是' + puzzle.answer + '。',
      '先看同一行，再检查同一列。',
      visual,
    )
    choice(
      '哪一横行把1、2、3各用了一次？',
      ['2、3、1'],
      ['1、1、3', '2、2、3'],
      '顺序可以变，但每个数只能出现一次。',
    )
    const next = makeNumberGrid((a + 1) % 3, (b + 2) % 9)
    tiles(
      '换个问号位置，这次应填几？',
      String(next.answer),
      ['1', '2', '3'],
      '这一行和这一列缺少的都是' + next.answer + '。',
      '两条规则要同时满足。',
      { type: 'number-grid', cells: next.cells },
    )
    match([
      ['横行已有1和2', '缺3'],
      ['横行已有2和3', '缺1'],
      ['横行已有1和3', '缺2'],
    ])
    order(
      ['先看问号所在行', '再检查问号所在列', '填好后检查整张方格'],
      '按本次行、列、整体检查的顺序排队。',
    )
    judge(
      '这张方格还要求两条对角线也不能重复。',
      false,
      '题目只规定每行、每列，不加没有写出的规则。',
    )
    choice(
      '横行不重复，但同一竖列出现两个2，算完成了吗？',
      ['没有，还要改'],
      ['算完成了', '只要数字写得好看就行'],
      '答案必须同时满足横行和竖列的规则。',
    )
    choice(
      '不确定能不能填2时，可以做哪两件事？',
      ['查同一横行有没有2', '查同一竖列有没有2'],
      ['看2写得漂不漂亮'],
      '按明确的规则检查，不猜颜色或外观。',
    )
  } else if (
    family === 'stamp' ||
    family === 'join' ||
    family === 'fold' ||
    family === 'decorate'
  ) {
    const mode = family === 'stamp' ? 'stamp' : family === 'fold' ? 'fold' : 'join'
    choice(
      family === 'stamp'
        ? '图中的积木描到纸上，描的是什么？'
        : family === 'fold'
          ? '沿中间虚线对折时，要注意什么？'
          : '把图里的两块拼回原纸，应怎样摆？',
      [family === 'stamp' ? '一个面的边缘' : family === 'fold' ? '让两边对齐' : '不重叠、不留缝'],
      [family === 'stamp' ? '整个立体都变薄了' : '随便重叠在一起', '闭眼随便画'],
      family === 'stamp'
        ? '纸上留下平面轮廓，积木仍然是立体。'
        : family === 'fold'
          ? '沿折痕对折，让两边对应。'
          : '这两块可以沿共同的斜边拼回原来的方纸。',
      '操作图上的按钮或观察前后变化。',
      { type: 'paper-change', mode },
    )
    choice(
      '纸片操作时，哪两种做法安全？',
      ['使用预剪好的纸片', '请家人陪同使用安全剪刀'],
      ['拿剪刀追跑'],
      '剪纸要有成人陪同，也可以只拼摆预剪纸片。',
    )
    number(
      '一张纸分成图中的两块，又把两块拼回去，一共用了几块？',
      2,
      '仍是原来的2块，移动没有增加纸片。',
      { type: 'paper-change', mode: 'join' },
    )
    match([
      ['沿物体边缘画', '描一描'],
      ['把纸片组合', '拼一拼'],
      ['两边对齐叠起来', '折一折'],
    ])
    order(
      family === 'decorate'
        ? ['先想装饰放在哪里', '选择纸片设计图案', '合作完成并介绍方法']
        : family === 'stamp'
          ? ['选一个平面贴在纸上', '按稳物体，沿边描画', '移开物体看轮廓']
          : family === 'fold'
            ? ['沿中线对折并对齐', '请家人帮助按轮廓剪', '展开观察图案']
            : ['观察两块纸片的边', '试着沿共同的边拼合', '检查有没有缝隙或重叠'],
      '按照本课的方法给操作步骤排队。',
    )
    judge(
      family === 'stamp' ? '描出的轮廓与整个积木是同一个立体。' : '纸片只是换了位置，块数不会变。',
      family !== 'stamp',
      family === 'stamp' ? '轮廓在平面上，积木是立体的。' : '没有添加、剪开或拿走，纸片块数不变。',
    )
    tiles(
      '装饰按蓝、黄、蓝、黄、蓝、□排列，空格是哪种颜色？',
      '黄',
      ['蓝', '黄', '红'],
      '蓝黄交替，下一个是黄。',
    )
    choice(
      '同一批纸片能不能设计不同图案？',
      ['可以，换摆法试一试'],
      ['不可以，只能照着一张图摆', '一定要再买纸片'],
      '可以尝试不同组合，并说明自己的想法。',
    )
  } else if (family === 'plane') {
    const focus = PLANE_SHAPES[a % 5]!,
      visual: MathQuestVisual = { type: 'plane-cards', shapes: PLANE_SHAPES }
    const clues = [
      '四条边一样长、四个直角',
      '四个直角，长短边不同',
      '只有三条直边围成',
      '是圆形轮廓',
      '两组对边分别平行，而且没有直角',
    ]
    choice(
      '图中哪号图形' + clues[a % 5] + '？',
      [String((a % 5) + 1) + '号'],
      PLANE_SHAPES.flatMap((_, i) => (i === a % 5 ? [] : [String(i + 1) + '号'])),
      '这是' + PLANE_LABELS[focus] + '，按边和角观察。',
      '不只看图形摆放的方向。',
      visual,
    )
    choice(
      '选出图中所有有四个直角的图形。',
      ['1号', '2号'],
      ['3号', '5号'],
      '正方形和长方形都有四个直角。',
      '可以用方纸的角比一比。',
      visual,
    )
    choice(
      '图形转了方向，哪号仍然是正方形？',
      ['1号'],
      ['2号', '3号', '5号'],
      '1号的边和角没有变，仍然是正方形。',
      '不要把倾斜方向当作类别。',
      { ...visual, rotated: true },
    )
    match([
      ['三条直边围成', '三角形'],
      ['四边等长且四个直角', '正方形'],
      ['本图没有角的圆形轮廓', '圆'],
    ])
    order(['先观察边', '再观察角', '综合特点说名称'], '按这次“先边、再角、后命名”的观察顺序排队。')
    judge(
      focus === 'circle'
        ? '只要弯弯的、封闭又没有角，就一定是圆。'
        : '正方形斜着放，就不再是正方形。',
      false,
      focus === 'circle' ? '椭圆也没有角，不能只凭这一点判断。' : '转方向不会改变边长和角。',
    )
    choice(
      '说“书本封面的轮廓”，主要在观察什么？',
      ['一个平面图形'],
      ['整本书的立体', '书本重量'],
      '封面的轮廓与整本书的立体外形要区分。',
    )
    number('下图一共有几个三角形？每块独立，不数组合。', 3, '1、3、4号是三角形，共3个。', {
      type: 'plane-cards',
      shapes: ['triangle', 'square', 'triangle', 'triangle'],
    })
  } else if (family === 'tangram') {
    number('图中七巧板一共有几块？', 7, '一副七巧板共有7块。', { type: 'tangram' })
    const triangleIds = TANGRAM_PIECES.filter((p) => p.shape === 'triangle').map((p) => p.id + '号')
    choice(
      '选出所有三角形纸片。',
      triangleIds,
      ['5号', '7号'],
      '1、2、3、4、6号都由三条边围成。',
      '可以展开形状线索帮助观察。',
      { type: 'tangram' },
    )
    number('这些纸片中有几块三角形？', 5, '大小不同的三角形也要数进去，一共5块。', {
      type: 'tangram',
    })
    match([
      ['5号纸片', '正方形'],
      ['7号纸片', '非直角的平行四边形'],
      ['1号纸片', '三角形'],
    ])
    quest.stages[3]!.visual = { type: 'tangram' }
    order(['1号', '3号', '5号', '7号'], '把这些纸片编号从小到大排队。')
    judge('七巧板有7块，所以7块都是三角形。', false, '有5块三角形，另外2块不是三角形。')
    choice(
      '用全部7块拼成小船后，没有再剪开，块数是多少？',
      ['仍是7块'],
      ['变成8块', '只剩1块'],
      '图案变了，纸片数量没有变。',
    )
    choice(
      '这副七巧板包含哪些图形？',
      ['三角形', '正方形', '非直角的平行四边形'],
      ['圆'],
      '标准七巧板由这三类纸片组成。',
    )
  }
  return quest
}
