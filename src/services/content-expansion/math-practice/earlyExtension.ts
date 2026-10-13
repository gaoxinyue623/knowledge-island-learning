import type { ReadingQuest, MathQuestVisual } from '@/types/reading-quest'
import { createMathQuestBuilder } from '../mathQuestBuilder'
import { makeNumberGrid } from '@/data/content-expansion/math-lower-visuals'

/** Extra tasks for the existing grade 1/2 generators; keep their authored first nine tasks intact. */
export function extendEarlyMathTraining(
  quest: ReadingQuest,
  family: string,
  limit: number,
  factor?: number,
): ReadingQuest {
  const v = quest.training?.variantIndex ?? 0
  quest.id += ':expanded-v2'
  const original = quest.stages.length
  const builder = createMathQuestBuilder(quest, family, {
    titles: [...quest.stages.map((s) => s.title), '再练一题', '换个条件', '巩固检查'],
  })
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
  const choice = (
    prompt: string,
    answer: string,
    wrong: string[],
    explanation: string,
    visual?: MathQuestVisual,
  ) => builder.choice(prompt, [answer], wrong, explanation, undefined, visual)
  if (family === 'zero') {
    builder.calc('空盒中没有圆片，用哪个数字记录数量？', 0, '没有物品，用0表示。')
    builder.calc(
      `桌上的${3 + v}颗圆片全部收走，还剩几颗？`,
      0,
      '全部拿走后没有剩余，用0表示。',
      undefined,
      { type: 'counters', first: 3 + v, removed: 3 + v },
    )
    choice(`0和${3 + v}相比，哪个更小？`, '0', [String(3 + v), '一样大'], '0比这些正整数小。')
  } else if (family === 'shopping') {
    builder.calc(
      `${1 + v}元${2 + v}角合多少角？`,
      10 * (1 + v) + 2 + v,
      `1元＝10角，先把元换成角，再加余下的角。`,
    )
    builder.calc(
      `付出10元，买文具花了${5 + v}元，应找回几元？`,
      5 - v,
      `付出的钱减商品价格：10－${5 + v}＝${5 - v}。`,
    )
    choice(
      `预算8元，玩具6元、铅笔3元，能同时买这两样吗？`,
      '不能',
      ['能', '只要先买玩具就能'],
      '两样合计9元，超过8元预算。',
    )
  } else if (family === 'decompose' || family === 'ten-game') {
    const total = family === 'ten-game' ? 10 : Math.max(2, Math.min(10, factor ?? 6)),
      known = 1 + (v % (total - 1))
    builder.calc(
      `${total}可以分成${known}和几？`,
      total - known,
      `总数减去已知的一部分：${total}－${known}＝${total - known}。`,
      undefined,
      { type: 'part-whole', total, known },
    )
    builder.calc(
      `把${total - known}个和${known}个合起来，共有几个？`,
      total,
      `${total - known}＋${known}＝${total}。`,
      undefined,
      { type: 'counters', first: total - known, second: known },
    )
    choice(
      `把${total}个圆片分成两堆，应该怎样检查？`,
      '两堆合起来仍是原来的总数',
      ['只看较大的一堆', '两堆一定要一样多'],
      '检查部分合起来是否等于总数。',
    )
  } else if (arithmetic.includes(family)) {
    const first = quest.stages.find(
      (s) => s.kind === 'question' && s.question.answerRule.ruleType === 'NUMERIC',
    )
    const match =
      first?.kind === 'question'
        ? first.question.stem
            .map((b) => b.text ?? '')
            .join('')
            .match(/(\d+)[＋](\d+)|(\d+)[－](\d+)/)
        : null
    if (!match) throw new Error(`数学计算课缺少可扩展条件：${quest.knowledgePointId}`)
    const subtract = Boolean(match[3]),
      x = Number(match[3] ?? match[1]),
      oldY = Number(match[4] ?? match[2])
    let y = ['round', 'tens', 'review100'].includes(family) ? oldY + 10 : oldY + 1
    if (subtract && y > x) y = Math.max(0, oldY - 1)
    if (!subtract && x + y > limit) y = Math.max(0, oldY - 1)
    if (family === 'zero-math') y = 0
    const answer = subtract ? x - y : x + y,
      sign = subtract ? '－' : '＋',
      inverse = subtract ? '＋' : '－'
    const visual: MathQuestVisual =
      x <= 20 && x + y <= 20
        ? { type: 'counters', first: x, ...(subtract ? { removed: y } : { second: y }) }
        : { type: 'place-value', value: x }
    builder.calc(
      `${x}${sign}${y}＝？`,
      answer,
      `${x}${sign}${y}＝${answer}。用${answer}${inverse}${y}＝${x}检查。`,
      undefined,
      visual,
    )
    const change = answer > 0 ? -1 : 1,
      next = answer + change
    builder.calc(
      `接着上题的结果${answer}，${change < 0 ? '再拿走' : '再添上'}1个，现在有几个？`,
      next,
      `${answer}${change < 0 ? '－' : '＋'}1＝${next}。`,
    )
    choice(
      `哪道用相反运算的算式可以检查${x}${sign}${y}＝${answer}？`,
      `${answer}${inverse}${y}＝${x}`,
      [`${answer}${sign}${y}＝${x}`, '只比较两个数的大小'],
      '检查整体与两部分的关系，使用相反的运算。',
    )
  } else if (['groups', 'table', 'divide', 'multiple', 'review'].includes(family)) {
    const each = Math.max(2, Math.min(9, factor ?? 3)),
      groups = 6 + v,
      total = each * groups
    builder.calc(
      `每盘${each}块饼干，共${groups}盘，一共有几块？`,
      total,
      `${each}×${groups}＝${total}。`,
      undefined,
      { type: 'array', rows: groups, columns: each },
    )
    builder.calc(
      `${total}块饼干，每${each}块分一盘，可以分几盘？`,
      groups,
      `${total}÷${each}＝${groups}。`,
    )
    builder.calc(
      `${total}是${each}的几倍？`,
      groups,
      `求里面有几个${each}，${total}÷${each}＝${groups}。`,
    )
  } else if (family === 'count') {
    const total = 7 + v
    builder.calc('逐个数图里的圆点，一共有几个？', total, `逐个点数，共${total}个。`, undefined, {
      type: 'counters',
      first: total,
    })
    builder.calc(
      `${total}个圆片拿走2个，还剩几个？`,
      total - 2,
      `${total}－2＝${total - 2}。`,
      undefined,
      { type: 'counters', first: total, removed: 2 },
    )
    choice(
      `把${total}个圆片从一排摆成一个圈，总数怎样变化？`,
      '不变',
      ['多1个', '少1个'],
      '没有添加或拿走，重新逐个数，数量仍然相同。',
    )
  } else if (family === 'ordinal' || family === 'position') {
    const names = ['小红', '小黄', '小蓝', '小绿', '小紫'],
      queue = [...names.slice(v), ...names.slice(0, v)]
    const visual: MathQuestVisual = { type: 'queue', labels: queue }
    choice(
      '看队伍，从左往右数，第3位是谁？',
      queue[2]!,
      [queue[0]!, queue[4]!],
      '先确定从左端开始，再逐个数位置。',
      visual,
    )
    choice(
      '同一队伍，从右往左数，第2位是谁？',
      queue[3]!,
      [queue[0]!, queue[2]!],
      '从右端数，第2位是原来从左数第4位。',
      visual,
    )
    builder.calc('这支队伍一共有几位？', 5, '位置与总数不同，队伍总共有5位。', undefined, visual)
  } else if (family === 'measure' || family === 'campus') {
    const start = 5 + v,
      end = 10 + v
    builder.calc('蓝色线段长几厘米？', end - start, `${end}－${start}＝5厘米。`, undefined, {
      type: 'ruler',
      start,
      end,
      max: 15,
    })
    builder.calc(
      `${20 + v * 10}厘米长的纸条，剪去5厘米，还剩几厘米？`,
      15 + v * 10,
      `${20 + v * 10}－5＝${15 + v * 10}。`,
    )
    choice(
      '同一条纸条移动了位置，长度会改变吗？',
      '不会',
      ['一定增长', '一定缩短'],
      '只改变位置，没有剪短或接长，长度不变。',
    )
  } else if (family === 'grid') {
    const puzzle = makeNumberGrid((v + 2) % 3, v * 3)
    builder.calc(
      '每行每列都有1、2、3，新的问号应填几？',
      puzzle.answer,
      '先排除这一行已有的数，再检查所在列。',
      undefined,
      { type: 'number-grid', cells: puzzle.cells },
    )
    choice('一列已经有2和3，还缺哪个数字？', '1', ['2', '3'], '同一列要把1、2、3各用一次。')
    builder.judge(
      '只把数字写得整齐，就一定满足方格里的数字规则。',
      false,
      '还必须按要求检查行和列的数字。',
    )
  } else if (family === 'solid') {
    builder.calc('观察正方体，它有几个平面？', 6, '正方体有6个平面。', undefined, {
      type: 'solids',
      shapes: ['cube'],
    })
    choice('下面哪个立体图形没有平面？', '球', ['正方体', '圆柱'], '球的表面是曲面，没有平面。', {
      type: 'solids',
      shapes: ['cube', 'sphere', 'cylinder'],
    })
    builder.calc('一个圆柱有几个圆形平面？', 2, '圆柱上下有2个圆形平面。', undefined, {
      type: 'solids',
      shapes: ['cylinder'],
    })
  } else if (family === 'tangram') {
    builder.calc('七巧板里有几个三角形？', 5, '七巧板有5个三角形。', undefined, { type: 'tangram' })
    builder.calc(
      '七巧板里，正方形与斜平行四边形合起来有几块？',
      2,
      '各有1块，合起来2块。',
      undefined,
      { type: 'tangram' },
    )
    choice(
      '把七块换位置拼图，不重叠、不缺块，总面积怎样变化？',
      '不变',
      ['增大', '减小'],
      '移动纸片不改变每一块的面积。',
    )
  } else if (['plane', 'stamp', 'join', 'fold', 'decorate'].includes(family)) {
    const visual: MathQuestVisual = {
      type: 'plane-cards',
      shapes: ['triangle', 'square', 'triangle', 'rectangle', 'circle'],
    }
    builder.calc('这组图形卡片共有几张？', 5, '逐张数，共5张。', undefined, visual)
    builder.calc(
      '按形状分类，三角形有几张？',
      2,
      '只数有三条边围成的卡片，共2张。',
      undefined,
      visual,
    )
    choice(
      '把正方形卡片转一个方向后，仍然叫什么？',
      '正方形',
      ['三角形', '圆'],
      '转动不改变边和角的特征。',
    )
  } else if (family === 'shape') {
    choice(
      '看图，两个箭头保持朝向，沿直线改变位置，这是哪种运动？',
      '平移',
      ['旋转', '轴对称'],
      '平移改变位置，不改变朝向。',
      { type: 'motion', mode: 'translation' },
    )
    choice(
      '看图，箭头绕中心转动，属于哪种运动？',
      '旋转',
      ['平移', '把图形变大'],
      '旋转有固定的中心。',
      { type: 'motion', mode: 'rotation' },
    )
    choice(
      '看图，沿中间虚线对折，两边完全重合，是什么关系？',
      '轴对称',
      ['只有平移', '形状完全不同'],
      '完全重合的两边互为镜像。',
      { type: 'motion', mode: 'reflection' },
    )
  } else if (family === 'welcome') {
    choice(
      '发现同伴漏数了一个物品，怎样交流更合适？',
      '友好地提醒，一起重新数',
      ['大声嘲笑', '把物品藏起来'],
      '一起重新观察和检查，可以帮助双方发现问题。',
    )
    choice(
      '数学活动开始前，发现桌上还少一张卡片，应怎样做？',
      '先检查并说明情况',
      ['直接假装有了', '拿走同伴的卡片'],
      '先检查条件是否齐全，再开始活动。',
    )
    builder.judge(
      '听到同伴用了不同的方法，可以先听完，再一起比较。',
      true,
      '完整倾听有助于发现不同的思考方法。',
    )
  } else if (family === 'classify') {
    choice(
      '把红色铅笔和蓝色铅笔放一组，把红色积木放另一组，是按什么分？',
      '用途',
      ['颜色', '只看大小'],
      '两支铅笔同样用于书写，积木用于拼搭。',
    )
    builder.judge(
      '按颜色分类时，颜色相同但用途不同的物品可以放同一组。',
      true,
      '分类要遵守这一次约定的标准。',
    )
    choice(
      '已经按用途分好，现在改成按颜色分，需要怎样做？',
      '重新按新标准检查每件物品',
      ['完全不能移动', '只移动最小的一件'],
      '标准变化后，分组结果也可能变化。',
    )
  } else if (family === 'day' || family === 'record') {
    builder.calc(
      `今天上午记录${2 + v}次读书，下午又记录2次，今天共记录几次？`,
      4 + v,
      `同一天的记录相加，${2 + v}＋2＝${4 + v}。`,
    )
    builder.judge(
      '统计今天的次数时，要把昨天的次数也加进去。',
      false,
      '先明确记录的日期，今天与昨天分别统计。',
    )
    builder.order(['起床', '吃早餐', '去上学'], '按今天早晨发生的先后排列。')
  } else {
    const small = limit <= 10 || family === 'place20',
      start = family === 'place20' ? 15 + v : small ? (limit <= 5 ? 1 : 5) + v : 44 + v * 10,
      gap = small ? 1 : 10
    builder.calc(
      `${start}、${start + gap}、□，每次增加${gap}，□填几？`,
      start + 2 * gap,
      `在${start + gap}上再加${gap}，得${start + 2 * gap}。`,
    )
    choice(
      `哪个数比${start}大、比${start + 2 * gap}小？`,
      String(start + gap),
      [String(start), String(start + 2 * gap)],
      '两个条件必须同时满足。',
    )
    builder.calc(`${start + gap}比${start}多多少？`, gap, `${start + gap}－${start}＝${gap}。`)
  }
  quest.stages.slice(original).forEach((stage) => {
    stage.trainingBand = 'transfer'
    stage.context = '换一个情境，再练习本课的方法。'
    stage.hints = [stage.hint, '先独立想一想，再回看本课的例子检查。']
    if (stage.kind === 'question') stage.question.tags = ['quest-training-v2', family, 'transfer']
  })
  return quest
}
