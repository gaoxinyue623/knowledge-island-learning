import { gradeOneShenzhenMathUpperDefinitions } from '@/data/curriculum/grade-1/math-bnu-upper'
import { gradeOneShenzhenMathLowerDefinitions } from '@/data/curriculum/grade-1/math-bnu-lower'
import { gradeTwoShenzhenMathUpperDefinitions } from '@/data/curriculum/grade-2/math-bnu-upper'
import { makeNumberGrid } from '@/data/content-expansion/math-lower-visuals'
import type { ReadingQuest } from '@/types/reading-quest'
import { createTrainingBuilder } from './trainingQuestBuilder'

export function createMathTrainingQuest(base: ReadingQuest, variant: number): ReadingQuest | null {
  const early = gradeOneShenzhenMathUpperDefinitions.find(
    (d) => d.knowledgePointId === base.knowledgePointId,
  )
  const lower = gradeOneShenzhenMathLowerDefinitions.find(
    (d) => d.knowledgePointId === base.knowledgePointId,
  )
  const upper = gradeTwoShenzhenMathUpperDefinitions.find(
    (d) => d.knowledgePointId === base.knowledgePointId,
  )
  const definition = early ?? lower ?? upper
  if (!definition || definition.lessonId !== base.lessonId) return null
  const b = createTrainingBuilder(base, variant)
  const v = b.variantIndex
  const family = definition.family
  if (early?.unitIndex === 0) {
    const welcomeContexts = ['同伴正在介绍自己', '小组伙伴正在分享作品', '老师请同学说说今天的发现']
    const countTotals = [4, 5, 6]
    const ordinalPrompts = [
      '从左往右数队伍，先观察什么？',
      '从右往左数队伍，先观察什么？',
      '要找队伍中间的位置，先观察什么？',
    ]
    const guide = (first: string, second: string) => {
      const stage = b.last()
      stage.hint = first
      stage.hints = [first, second]
    }
    if (family === 'welcome') {
      b.choice(
        `${welcomeContexts[v]}时，先观察什么？`,
        ['谁正在说话'],
        ['谁的文具最多', '谁跑得最快'],
        '先看清谁在发言，才能认真倾听。',
      )
      guide('观察课堂里是谁正在说话。', '把注意力放在说话的同伴身上，等他说完再想回应。')
      b.choice(
        '想分享想法前，先做哪个准备动作？',
        ['举手示意'],
        ['立刻大喊', '敲同伴桌子'],
        '举手能让老师安排发言顺序。',
      )
      guide('观察题目问的是发言前的课堂动作。', '先做让老师看见的准备动作，再等轮到自己。')
      b.match([
        ['课本', '阅读和学习'],
        ['铅笔', '书写'],
        ['书包', '收好学习用品'],
      ])
      guide('观察每件文具在课堂里的用途。', '先配最熟悉的文具，再说说它为什么需要整理好。')
      b.order(['取出课本和铅笔', '把文具摆整齐', '安静等待上课'], '把上课前的准备动作按顺序排好。')
      guide('观察哪些课堂准备动作必须先完成。', '先准备学习用品，再检查桌面是否整齐。')
      b.judge('认真倾听同伴的介绍，可以帮助认识新朋友。', true, '认真听能了解同伴的想法。')
      guide('观察题目说的是倾听带来的课堂收获。', '想一想认真听时，能不能知道同伴的想法。')
      b.choice(
        '整理文具时，应该先检查什么？',
        ['会不会弄坏物品或影响同伴'],
        ['颜色够不够鲜艳', '谁整理得最快'],
        '整理要爱护物品，也要留意身边同伴。',
      )
      guide('观察每种做法会不会爱护课堂文具。', '先排除可能弄坏物品或影响同伴的做法。')
      b.choice(
        '和新同伴交流时，哪种开场更合适？',
        ['礼貌地问候'],
        ['抢走对方的笔', '拒绝对方说话'],
        '礼貌问候能让交流开始得更舒服。',
      )
      guide('观察哪种做法能让同伴愿意继续交流。', '先找礼貌的开场，再想怎样清楚介绍自己。')
      b.choice(
        '发现桌面乱了，下一步更适合做什么？',
        ['把课本和铅笔放回合适的位置'],
        ['把物品丢在地上', '继续玩文具'],
        '把学习用品放好，方便下一次学习。',
      )
      guide('观察桌面上的文具需要回到哪里。', '先把同类学习用品放整齐，再检查有没有遗漏。')
      b.choice(
        '同伴说完后想补充想法，应该怎样做？',
        ['举手等待'],
        ['同时大声打断', '转身离开'],
        '等轮到自己再说，大家都能被听见。',
      )
      guide(
        '观察现在是谁在说话，以及什么时候轮到自己。',
        '先等同伴说完，再用课堂约定的方式请求发言。',
      )
    } else if (family === 'count') {
      const total = countTotals[v]!
      b.calc(
        `桌上有${total}支铅笔，逐个点数后共有几支？`,
        total,
        `逐个点数，最后一个数${total}表示总数。`,
      )
      guide(
        '观察要数的是桌上的铅笔，手指逐个点。',
        '每点一个物品就说一个数字，最后一个数字是总数。',
      )
      b.choice(
        '点数物品时，怎样避免重复数？',
        ['每个物品只点一次'],
        ['喜欢的多点一次', '只看物品排得多长'],
        '逐个点数能避免漏数和重复。',
      )
      guide('观察哪些物品已经数过，哪些还没有。', '数过一个就做记号，再继续数下一个物品。')
      b.order(['点第一个物品', '继续点下一个物品', '说出总数'], '把点数物品的步骤排好。')
      guide('观察点数从第一个物品开始的顺序。', '逐个数完整组物品后，再说最后一个数字。')
      b.match([
        ['2个圆点', '2'],
        ['3个圆点', '3'],
        ['4个圆点', '4'],
      ])
      guide('观察圆点的个数和数字卡的对应关系。', '先配最确定的一组，再逐个数其他圆点检查。')
      b.judge(
        '把4支铅笔排成一排后，物品总数会改变。',
        false,
        '只换位置，没有增加或拿走物品，总数不变。',
      )
      guide('观察物品只是换了位置，数量有没有改变。', '重新逐个数一遍，比较前后的总数。')
      b.choice(
        '数“一盒彩笔”时，题目在数什么？',
        ['一整盒物品'],
        ['盒里每一支笔', '彩笔的颜色'],
        '先看清数的是整体还是里面的物品。',
      )
      guide('观察题目把哪一个整体当作一个物品。', '先圈出要数的单位，再开始逐个点数。')
      b.calc(
        `${total + 1}枚圆片移开1枚后，桌上还剩几枚？`,
        total,
        `逐个点桌上剩下的圆片，共${total}枚。`,
      )
      guide(
        '先摆出圆片并移开1枚，观察桌上还剩下哪些圆片。',
        '不要沿用原来的总数；重新逐个点桌上剩下的圆片。',
      )
      b.choice(
        '数完一组物品后，最后一个数字表示什么？',
        ['这一组的总数'],
        ['第一个物品的位置', '物品的颜色'],
        '最后一个数表示这组物品一共有多少。',
      )
      guide('观察题目问的是总数还是位置。', '回想从第一个物品数到最后一个时说出的数字。')
      b.choice(
        '把圆点换成积木后，点数的方法应怎样做？',
        ['仍然逐个点数'],
        ['只数最大的积木', '随便猜一个数字'],
        '物品换了，逐个点数的方法不变。',
      )
      guide('观察每块积木都是一个需要数的物品。', '用同样的逐个点数方法检查每一块积木。')
    } else {
      b.choice(
        ordinalPrompts[v]!,
        ['从哪一边开始'],
        ['谁的名字最长', '谁的衣服最亮'],
        '先确定方向，才能判断位置。',
      )
      guide('观察队伍从左还是从右开始数。', '先确定方向，再从起点逐个数位置。')
      b.choice(
        '题目问“第几个”时，要找什么？',
        ['队伍里的位置'],
        ['队伍总人数', '物品颜色'],
        '“第几个”表示位置，不是总数。',
      )
      guide('观察题目里的“第几个”是在问位置。', '从确定的方向逐个数，到指定位置再停。')
      b.order(['确定左边起点', '从左往右数', '说出指定位置'], '把找队伍位置的步骤排好。')
      guide('观察找位置前要先确定哪一边是起点。', '从起点逐个数，不要跳过队伍里的朋友。')
      b.match([
        ['有几个朋友', '问总数'],
        ['第几个朋友', '问位置'],
        ['从哪边数', '先定方向'],
      ])
      guide('观察每张卡是在问总数、位置还是方向。', '先读关键词，再找含义相同的搭档。')
      b.judge('从右边开始数时，最右边的朋友是第一位。', true, '起点换到右边后，第一位也在右端。')
      guide('观察这次队伍从哪一边开始数。', '把起点当作第一位，再沿着方向逐个数。')
      b.choice(
        '“有4个朋友”和“第4个朋友”相同吗？',
        ['不相同'],
        ['完全相同', '都只问颜色'],
        '一个说总数，一个说位置。',
      )
      guide(
        '观察一句话有没有“第”字，以及它是在问什么。',
        '一个问完整队伍的数量，一个问队伍中的位置。',
      )
      b.choice(
        '换成从右往左数后，队伍总数会怎样？',
        ['保持不变'],
        ['多一个', '少一个'],
        '数的方向变了，朋友总数没有变。',
      )
      guide('观察队伍里的朋友有没有增加或离开。', '先数完整队伍，再判断总数会不会随方向改变。')
      b.choice(
        '要找从左数第2位，先做什么？',
        ['从左端开始逐个数'],
        ['从右端直接猜', '只数最后一位'],
        '先从左端开始，数到第二位。',
      )
      guide('观察题目明确给出的方向是左边。', '从左端起逐个数，数到第二位时停下。')
      b.choice(
        '同一位朋友换方向数后，位置可能怎样？',
        ['会改变'],
        ['一定不变', '变成总数'],
        '起点改变后，同一位朋友的位置可能不同。',
      )
      guide(
        '观察起点改变后，数的位置是否还从同一侧开始。',
        '分别从左右两端逐个数，比较同一位朋友的位置。',
      )
    }
    return b.finish()
  }
  const arithmetic = [
    'add',
    'subtract',
    'zero-math',
    'mixed',
    'decompose',
    'ten-game',
    'add-pattern',
    'subtract-pattern',
    'add-plain',
    'subtract-plain',
    'make-ten',
    'break-ten',
    'round',
    'tens',
    'column-add',
    'column-subtract',
    'word20',
    'more-less',
    'difference',
    'review20',
    'review100',
    'guess',
    'shopping',
    'comic',
  ]

  if (arithmetic.includes(family)) {
    const subtract = [
      'subtract',
      'zero-math',
      'subtract-pattern',
      'subtract-plain',
      'break-ten',
      'column-subtract',
      'difference',
      'review100',
    ].includes(family)
    let left: number, right: number
    if (early) {
      const limit = early.unitIndex === 2 ? 5 : 10
      right = 2 + (v % 2)
      left = subtract ? limit - 1 - (v === 2 ? 1 : 0) : limit - 1 - right - (v === 2 ? 1 : 0)
    } else if (lower && ['make-ten', 'review20'].includes(family)) {
      left = Math.min(9, Math.max(6, lower.a))
      right = 11 - left + ((((lower.b - (11 - left) + v) % (left - 1)) + (left - 1)) % (left - 1))
    } else if (lower && family === 'break-ten') {
      left = 13 + v
      right = 8 + (v % 2)
    } else if (lower && family === 'add-plain' && lower.unitIndex === 0) {
      left = 11 + v
      right = 3
    } else if (lower && ['difference', 'word20', 'comic'].includes(family)) {
      left = subtract ? 15 + v : 7 + v
      right = 5
    } else if (lower) {
      const round = ['round', 'tens', 'review100'].includes(family)
      left = round ? (family === 'round' ? 30 : 34) + v * 10 : subtract ? 67 + v * 10 : 23 + v * 10
      right = round ? 20 : ['column-add', 'column-subtract'].includes(family) ? 12 : 2
    } else {
      left = subtract ? 52 + v * 10 : 28 + v * 10
      right = subtract ? 28 : 7
    }
    const result = subtract ? left - right : left + right
    const sign = subtract ? '－' : '＋'
    const inverse = subtract ? '＋' : '－'
    b.calc(
      `${left}${sign}${right}＝？这次先独立算，再检查。`,
      result,
      `${left}${sign}${right}＝${result}；用${result}${inverse}${right}＝${left}检验。`,
      '先看数位；需要时把一个数分开计算。',
    )
    b.last().hints = [
      '先看个位，想一想能否直接计算。',
      family === 'make-ten'
        ? `${left}离10还差${10 - left}，从另一个数里拿出这么多。`
        : '把整体与两部分画出来，或按相同数位对齐。',
    ]
    b.calc(
      `□${sign}${right}＝${result - 1}，缺少的数是多少？`,
      left - 1,
      `${left - 1}${sign}${right}＝${result - 1}，代回原式两边相等。`,
      '从结果往回想，用相反的运算试一试。',
    )
    const step = lower && ['round', 'tens', 'review100'].includes(family) ? 10 : 1
    b.match(
      [0, 1, 2].map((i) => [
        `${left}${sign}${right - i * step}`,
        String(subtract ? result + i * step : result - i * step),
      ]),
    )
    const carry = (left % 10) + (right % 10) >= 10
    const borrow = left % 10 < right % 10
    const method = subtract
      ? borrow
        ? '先从十位退1个十，再算个位'
        : '相同数位分别相减'
      : carry
        ? '个位满十，把10个一换成1个十'
        : '相同数位分别相加'
    b.choice(
      `计算${left}${sign}${right}，哪种方法适合这道题？`,
      [method],
      [
        subtract ? '个位不够减就把两个数字倒过来减' : '把两个数的数字连在一起',
        '十位和个位随意混着算',
      ],
      `${method}。${left}${sign}${right}＝${result}。`,
      '观察个位是否满十或不够减。',
    )
    b.choice(
      `团子算出${left}${sign}${right}＝${result + 1}。下面哪项检验能说明这个结果错了？`,
      [`${result + 1}${inverse}${right}＝${left + 1}，不能回到${left}`],
      [
        `${result + 1}${inverse}${right}＝${left}，所以原结果正确`,
        `把${left}${sign}${right}＝${result + 1}原样重写，就完成了检验`,
      ],
      `正确结果是${result}；反向检验应回到原来的${left}。`,
      '把算出的结果代回去，看能不能回到原来的数量。',
    )
    const equation = `${left}${sign}${right}＝${result}`
    const building = b.question(
      `算式工坊：${subtract ? `原有${left}个，拿走${right}个，求剩余` : `把${left}个和${right}个合起来，求总数`}。以${left}开头，依次拼出“数字、运算符、数字、等号、结果”。有一张符号卡不用选。`,
      'fillBlank',
      {
        ruleType: 'TEXT_BLANKS',
        blanks: [{ blankId: 'answer', acceptedAnswers: [equation], normalization: 'TRIM' }],
      },
      `${equation}。每个数和符号都要与故事里的变化对应。`,
      '先判断数量增加还是减少，再选运算符；等号后放结果。',
    )
    building.tiles = ['＝', String(right), inverse, String(result), String(left), sign]
    building.tileMode = 'sequence'
    b.last('算式工坊 · 自己搭建')
    const take = Math.min(2, result - 1)
    const scene = subtract
      ? `图书角原有${left}本书，上午借走${right}本，下午又借走${take}本。`
      : `图书角原有${left}本书，又收到${right}本，随后借走${take}本。`
    b.choice(
      '先求上午结束后（或收到新书后）有几本，应选哪个算式？',
      [`${left}${sign}${right}`],
      [`${left}${inverse}${right}`, `只数后来借出的${take}本`],
      `先处理${left}本与${right}本的变化，再处理后来借走的${take}本。`,
      '按发生的先后读一遍，不把最后的变化提前。',
    )
    b.last(undefined, scene)
    b.calc(
      '接着处理最后一次借书。现在图书角还剩几本书？',
      result - take,
      `先得${result}本，再借走${take}本：${result}－${take}＝${result - take}（本）。`,
      '这是两次变化，别漏掉最后一次。',
    )
    b.last(undefined, scene)
    b.calc(
      '在刚才的基础上，又还回来1本。现在有几本？',
      result - take + 1,
      `${result - take}＋1＝${result - take + 1}（本）。还回来使数量增加。`,
      '以你上一步算出的剩余数量为起点。',
    )
    b.last(undefined, scene)
  } else if (upper && ['groups', 'table', 'divide', 'multiple', 'review'].includes(family)) {
    const each = Math.max(2, Math.min(9, upper.a))
    const groups = 3 + v,
      total = each * groups
    b.calc(`每盒${each}支笔，${groups}盒一共几支？`, total, `${each}×${groups}＝${total}（支）。`)
    b.calc(
      `□×${each}＝${total + each}，□是多少？`,
      groups + 1,
      `${total + each}÷${each}＝${groups + 1}。`,
    )
    b.match([1, 2, 3].map((i) => [`${each * i}÷${each}`, String(i)]))
    b.choice(
      `有${total}支笔，每${each}支装一盒。哪两项说法正确？`,
      [`用${total}÷${each}求盒数`, `能装${groups}盒`],
      [`要用${total}×${each}`, '盒数与每盒支数无关'],
      '这是按每份数量求份数的平均分。',
    )
    b.choice(
      `团子说：“${total}是${each}的几倍，用${total}－${each}。”错在哪里？`,
      ['求几倍是看里面有几个同样多，要用除法'],
      ['看到“大”就用加法', '只要得数小就正确'],
      `${total}÷${each}＝${groups}，${total}是${each}的${groups}倍。`,
    )
    b.calc(`一盒增加1支，${groups}盒一共增加几支？`, groups, '每盒多1支，有几盒就多几支。')
    const scene = `手工课有${groups}组，每组需要${each}张卡纸，老师准备了${total + each}张。`
    b.choice(
      '先算全班需要多少张卡纸，选哪种方法？',
      [`${groups}×${each}`],
      [`${groups}＋${each}`, `${total + each}－${groups}`],
      '每组同样多，求总数用乘法。',
    )
    b.last(undefined, scene)
    b.calc('发完后，老师还剩多少张？', each, `${total + each}－${total}＝${each}（张）。`)
    b.last(undefined, scene)
    b.calc('剩余卡纸按每组同样的数量发，还够增加几组？', 1, `${each}÷${each}＝1（组）。`)
    b.last(undefined, scene)
  } else if (family === 'measure' || family === 'campus') {
    const start = 2 + v,
      end = 9 + v,
      length = end - start
    b.calc(
      `纸条从尺子的${start}厘米处到${end}厘米处，长几厘米？`,
      length,
      `${end}－${start}＝${length}（厘米），读末端刻度不等于长度。`,
      '起点不是0，要去掉前面的部分。',
      { type: 'ruler', start, end, max: 15 },
    )
    b.calc(
      `一条长${length}厘米的纸条从${start + 1}厘米处放起，末端应对着几？`,
      end + 1,
      `${start + 1}＋${length}＝${end + 1}。`,
    )
    b.match([
      ['铅笔长度', '厘米'],
      ['操场长度', '米'],
      ['1米', '100厘米'],
    ])
    b.choice(
      '测量同一张桌子，为什么不能直接比较用铅笔数和用橡皮数得出的数？',
      ['每一个测量单位长度不同'],
      ['桌子一定变长了', '次数多就一定量得准'],
      '需要统一测量单位才能直接比较。',
    )
    b.choice(
      `团子把从${start}到${end}的纸条说成长${end}厘米，哪里错了？`,
      ['把末端刻度当长度，忘了减起点'],
      ['纸条不是从0开始就不能测量', '只要加1就好'],
      `${end}－${start}＝${length}厘米。`,
    )
    b.judge('纸条整体向右平移1厘米，长度也会增加1厘米。', false, '位置变了，纸条长度没有变。')
    const scene = `装饰纸条长${20 + v * 10}厘米。先剪去6厘米，再剪去4厘米。`
    b.choice(
      '要算总共剪去多少，应选哪个算式？',
      ['6＋4'],
      ['6－4', '20＋6'],
      '两次剪去的长度合起来。',
    )
    b.last(undefined, scene)
    b.calc('纸条最后还剩几厘米？', 10 + v * 10, `${20 + v * 10}－6－4＝${10 + v * 10}（厘米）。`)
    b.last(undefined, scene)
    b.calc('若要把剩余长度补到原长，还需几厘米？', 10, '原长减剩余，等于刚才共剪去的10厘米。')
    b.last(undefined, scene)
  } else if (family === 'grid') {
    const puzzle = makeNumberGrid(v, v + 1)
    b.calc(
      '问号中填哪个数，才能让每行、每列都有1、2、3？',
      puzzle.answer,
      `同时检查横行和竖列，应填${puzzle.answer}。`,
      '找出这一行缺什么，再检查这一列。',
      { type: 'number-grid', cells: puzzle.cells },
    )
    const next = makeNumberGrid((v + 1) % 3, (v + 4) % 9)
    b.calc(
      '换一个位置，这个问号应填几？',
      next.answer,
      `满足行列要求的是${next.answer}。`,
      '不能只沿用上一题答案。',
      { type: 'number-grid', cells: next.cells },
    )
    b.match([
      ['已有1、2', '缺3'],
      ['已有1、3', '缺2'],
      ['已有2、3', '缺1'],
    ])
    b.choice(
      '检查填数答案时，必须检查哪两项？',
      ['所在横行不重复', '所在竖列不重复'],
      ['对角线必须一样', '数字一定从小到大'],
      '只使用题目规定的规则。',
    )
    b.choice(
      '团子填完横行就说通过了，还缺哪一步？',
      ['检查竖列是否也符合规则'],
      ['把所有数改成同一个', '只检查字体'],
      '横行、竖列要同时满足。',
    )
    b.judge(
      '如果一行只有一个空，只需找出缺的那个数，再检查所在列。',
      true,
      '用排除法，并交叉验证。',
    )
    const scene =
      '一张3×3方格，每行每列都要把1、2、3各用一次。第一行是“1、□、3”，第二行是“2、3、□”。'
    b.choice('先填第一行，应选择哪张卡？', ['2'], ['1', '3'], '第一行缺2。')
    b.last(undefined, scene)
    b.calc('第二行的空格填几？', 1, '第二行已有2、3，缺1。')
    b.last(undefined, scene)
    b.calc('第三列现在是3、1、□。第三行第三列填几？', 2, '第三列已有3和1，缺2。')
    b.last(undefined, scene)
  } else if (family === 'shape') {
    const examples = [
      '推拉窗沿直轨道滑动',
      '风车的叶片绕中心转动',
      '图形沿一条直线对折后两边完全重合',
    ]
    const concepts = ['平移', '旋转', '轴对称']
    b.choice(
      `“${examples[v]}”体现了什么？`,
      [concepts[v]!],
      concepts.filter((_, i) => i !== v),
      `关键线索是${examples[v]}。`,
    )
    b.choice(
      '风车叶片转动时，哪些说法正确？',
      ['绕着一个中心转动', '叶片本身的形状没有改变'],
      ['每个位置都只沿同一直线移动', '叶片越转越大'],
      '旋转有中心，物体本身的形状和大小不因此改变。',
    )
    b.match(examples.map((example, i) => [example, concepts[i]!]))
    b.choice(
      '判断是不是轴对称图形，最可靠的方法是什么？',
      ['试着沿一条直线对折，看两边能否完全重合'],
      ['只看两边颜色是否一样', '只要有四条边就算'],
      '对折后完全重合才符合这个特征。',
    )
    b.choice(
      '团子说：“风车和推拉窗都在动，所以都是平移。”他漏看了什么？',
      ['移动的方式：是否绕中心转动'],
      ['物体的颜色', '移动时有没有声音'],
      '运动不只一种，要区分沿直线移动与绕中心转动。',
    )
    b.judge('向右平移一张箭头卡片，箭头原来的朝向保持不变。', true, '平移改变位置，不改变方向。')
    const scene = `图案工作室：一张箭头朝上的卡片，先沿直线向右平移${2 + v}格，再绕卡片中心顺时针转半圈。`
    b.choice(
      '完成第一步后，箭头朝向哪里？',
      ['仍朝上'],
      ['变成朝右', '变成朝下'],
      '平移不改变朝向。',
    )
    b.last(undefined, scene)
    b.choice(
      '接着转半圈后，箭头朝向哪里？',
      ['朝下'],
      ['仍朝上', '朝右'],
      '转半圈后，朝向与原来相反。',
      '半圈相当于从钟面12走到6。',
    )
    b.last(undefined, scene)
    b.choice(
      '如果只沿直线把这张卡片移回左边，能恢复最初朝上的方向吗？',
      ['不能，还需要再转动卡片'],
      ['能，回到左边就朝上', '能，移动几格都一样'],
      '位置回去并不代表方向也恢复，平移不能代替旋转。',
    )
    b.last(undefined, scene)
  } else if (['solid', 'plane', 'tangram', 'stamp', 'join', 'fold', 'decorate'].includes(family)) {
    const solid = family === 'solid'
    const targets = solid ? ['正方体', '圆柱', '球'] : ['三角形', '正方形', '长方形']
    const focus = targets[v]!
    const clues = solid
      ? [
          '6个面都是一样大的正方形',
          '有两个圆形平面和一个弯曲的侧面',
          '表面是曲面，向各个方向都能滚',
        ]
      : [
          '有三条边、三个角',
          '四条边一样长，四个角都是直角',
          '四个角是直角，两组对边分别相等，相邻两条边不一样长',
        ]
    b.choice(
      `神秘图形线索：${clues[v]}。它最符合哪个名称？`,
      [focus],
      targets.filter((x) => x !== focus),
      `按这些特征判断，是${focus}。`,
    )
    b.choice(
      solid ? '球和圆柱有哪些相同点？' : '正方形和长方形有哪些相同点？',
      solid ? ['都能滚动'] : ['都有四个直角'],
      solid ? ['都没有平面', '都有六个相同的面'] : ['四条边一定都不等', '都有三条边'],
      solid ? '球能滚，圆柱侧放也能滚；但它们的表面不同。' : '比较共同特征，不只看大小与方向。',
    )
    b.match(
      solid
        ? [
            ['魔方的形状', '正方体'],
            ['易拉罐的形状', '圆柱'],
            ['皮球的形状', '球'],
          ]
        : [
            ['三条边', '三角形'],
            ['四边相等且四个直角', '正方形'],
            ['没有直边', '圆'],
          ],
    )
    b.choice(
      solid ? '圆柱和球都能滚，怎样再区分？' : '图形旋转后，你应该用什么来认出它？',
      [solid ? '看有没有圆形平面' : '边和角的特征'],
      ['只看颜色', '只看谁更大'],
      '位置、颜色和大小不是唯一的分类依据。',
    )
    b.choice(
      solid ? '团子把魔方叫作正方形，混淆了什么？' : '团子说正方形转一下就不再是正方形，哪里不对？',
      [solid ? '整个立体与其中的平面' : '方向变了，边角特征没有变'],
      solid
        ? ['把不同颜色当成不同形状', '把滚动和滑动当成一样']
        : ['图形只要转动就会增加边', '只看图形摆放时的朝向就能分类'],
      solid ? '魔方整体近似正方体，一个面是正方形。' : '转动不改变图形种类。',
    )
    b.judge(
      solid ? '把球转个方向，它就变成圆柱了。' : '把一个图形平移后，它的形状和大小都不变。',
      !solid,
      '平移、转动改变位置或方向，不会凭空改变基本形状。',
    )
    const count = 3 + v
    const scene = solid
      ? `积木工坊有${count}块正方体积木和2个球。颜色不同也按立体形状分类。`
      : `图形工坊有${count}张三角形卡片和2张正方形卡片。颜色不同也按形状分类。`
    b.choice(
      '为了按形状分类，应该看什么？',
      [solid ? '各个面和曲面的特征' : '边和角'],
      ['只看红色还是蓝色', '只看哪张先拿到'],
      '先确定分类标准。',
    )
    b.last(undefined, scene)
    b.calc(
      solid ? '正方体类放几块积木？' : '三角形类放几张卡片？',
      count,
      solid ? `题目给出${count}块正方体积木。` : `题目给出${count}张三角形。`,
    )
    b.last(undefined, scene)
    b.choice(
      solid ? '一块正方体被转了方向，应该放在哪里？' : '一张三角形被转了方向，应该放在哪里？',
      [solid ? '仍放正方体类' : '仍放三角形类'],
      ['另放成一个新形状类', solid ? '放球类' : '放正方形类'],
      solid ? '转动不改变它的6个面都是同样大的正方形这个特征。' : '方向变化不改变它的三条边。',
    )
    b.last(undefined, scene)
  } else if (['classify', 'position', 'ordinal', 'day', 'welcome', 'record'].includes(family)) {
    const items = ['书本', '铅笔', '积木']
    const chosen = items[v]!
    const sequence = ['整理书包', '到教室', '上课']
    b.choice(
      `要把${chosen}归类，第一步应该做什么？`,
      ['先说清按用途还是其他标准分'],
      ['随便放，分完再猜标准', '只看谁拿得快'],
      '同一组物品可以有不同分类，先确定规则。',
      '想一想：按颜色分和按用途分，会得到同样的结果吗？要先告诉大家这次用哪种标准。',
    )
    b.order(sequence, '按上学前准备、到校、开始学习的时间顺序排队。')
    b.match([
      ['书本和铅笔', '学习用品'],
      ['积木和皮球', '玩具'],
      ['衣服和帽子', '穿戴用品'],
    ])
    b.choice(
      '按用途分类时，红色铅笔与红色积木一定放一起吗？',
      ['不一定，它们用途不同'],
      ['必须，只要都是红色', '都不能放'],
      '用途与颜色是两种不同标准。',
      '先说说铅笔用来做什么、积木用来做什么。题目要求看用途，还是看颜色？',
    )
    b.choice(
      '团子记“今天读了2次书”，但把昨天的1次也算入今天，问题是什么？',
      ['混用了不同日期的记录'],
      ['次数必须越多越好', '昨天不能读书'],
      '先确定记录哪一天。',
      '圈出“今天”和“昨天”。这两次读书发生在同一天吗？',
    )
    b.judge('描述左右位置时，需要说明观察方向或站位。', true, '换个朝向，左右可能不同。')
    const names =
      v === 0
        ? ['小青', '小红', '小蓝']
        : v === 1
          ? ['小红', '小蓝', '小青']
          : ['小蓝', '小青', '小红']
    const scene = `从左往右，三张座位卡依次是${names.join('、')}。`
    b.choice('谁坐在中间？', [names[1]!], [names[0]!, names[2]!], '中间是第二张卡。')
    b.last(undefined, scene)
    b.choice(`${names[0]}右边紧挨着谁？`, [names[1]!], [names[2]!, '没有人'], '“紧挨着”要求相邻。')
    b.last(undefined, scene)
    b.choice(
      '把最左和最右两张卡交换，中间的座位卡会怎样？',
      ['仍是原来的那张'],
      ['一定变成最左的人', '一定变成最右的人'],
      '只交换两端，中间没动。',
    )
    b.last(undefined, scene)
  } else {
    // Number sense: apply simultaneous constraints, rather than copy a displayed number.
    const small = Boolean(early || family === 'place20')
    const start = family === 'place20' ? 11 + v : small ? 2 + v : 20 + v * 10
    const gap = small ? 1 : 10
    const middle = start + gap,
      end = middle + gap
    b.calc(`每次增加${gap}：${start}、${middle}、□。空格填几？`, end, `${middle}＋${gap}＝${end}。`)
    b.calc(
      `从${end}开始，每次减少${gap}，连续减少两次到几？`,
      start,
      `${end}－${gap}－${gap}＝${start}。`,
    )
    b.match([
      [`${start}再多${gap}`, String(middle)],
      [`${middle}再多${gap}`, String(end)],
      [`${middle}再少${gap}`, String(start)],
    ])
    b.choice(
      `一个数比${start}大，又比${end}小。哪个候选数符合？`,
      [String(middle)],
      [String(start), String(end)],
      '两个条件要同时满足。',
    )
    b.choice(
      `团子把“比${start}大且比${end}小”理解成“只要大于${start}就行”。漏掉了什么？`,
      [`还要小于${end}`],
      ['没有漏条件', '还要大于100'],
      '只满足一个条件还不够。',
    )
    b.order(
      [String(end), String(middle), String(start)],
      '这次从大到小排列，不要沿用从小到大的习惯。',
    )
    const scene = `秘密数比${start}大，比${end}小。候选卡片只有${start}、${middle}、${end}。`
    b.choice(
      `先用“大于${start}”排除哪张卡？`,
      [String(start)],
      [String(middle), String(end)],
      '等于不属于大于。',
    )
    b.last(undefined, scene)
    b.calc('再同时检查两个条件，秘密数是哪张卡？', middle, `${middle}同时满足两个条件。`)
    b.last(undefined, scene)
    b.calc(`秘密数再减少${gap}，变成几？`, start, `${middle}－${gap}＝${start}。`)
    b.last(undefined, scene)
  }
  return b.finish()
}
