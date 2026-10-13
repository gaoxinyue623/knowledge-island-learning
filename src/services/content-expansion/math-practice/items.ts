import type { MathPracticeDiagram, MathPracticeItem } from '@/types/math-practice'
const round = (value: number) => Math.round(value * 10000) / 10000
const numeric = (
  prompt: string,
  answer: number,
  explanation: string,
  diagram?: MathPracticeDiagram,
): MathPracticeItem => ({ prompt, answer: round(answer), explanation, diagram })
const choice = (
  prompt: string,
  answer: string,
  distractors: string[],
  explanation: string,
  diagram?: MathPracticeDiagram,
): MathPracticeItem => ({ prompt, answer, distractors, explanation, diagram })

/** Each topic has its own conditions and formula; unsupported topics fail rather than receive unrelated arithmetic. */
export function mathPracticeItem(topic: string, index: number, grade: number): MathPracticeItem {
  const n = (index % 9) + 1,
    k = Math.floor(index / 9),
    mode = index % 3
  const a = 4 + n + k,
    b = 2 + ((n + k) % 4)
  const rect = (
    w: number,
    h: number,
  ): Extract<
    MathPracticeDiagram,
    { kind: 'rectangle' | 'parallelogram' | 'triangle' | 'trapezoid' }
  > => ({
    kind: 'rectangle',
    width: w,
    height: h,
    unit: '厘米',
  })
  const chart = (
    kind: 'bars' | 'line' = 'bars',
  ): Extract<MathPracticeDiagram, { kind: 'bars' | 'line' }> => ({
    kind,
    labels: ['周一', '周二', '周三'],
    values: [a, a + 2, a + 4],
    unit: '本',
  })
  const decimalA = (25 + 3 * n + k) / 10,
    decimalB = (11 + n + k) / 10
  switch (topic) {
    case 'divide':
    case 'column':
    case 'trial':
    case 'division-method':
    case 'division-use':
    case 'group':
    case 'buttons':
    case 'review-division':
    case 'waterpark': {
      const groups = 3 + (n % 6),
        total = groups * b
      return mode === 2
        ? numeric(
            `有${total}枚圆片，每${b}枚一组，可以分成几组？`,
            groups,
            `${total}÷${b}＝${groups}，分成${groups}组。`,
            { kind: 'grid', rows: groups, columns: b },
          )
        : numeric(`${total}÷${b}＝？`, groups, `用${groups}×${b}＝${total}检查商。`)
    }
    case 'remainder':
    case 'division-check': {
      const d = 3 + (n % 5),
        q = 4 + k + (n % 3),
        r = 1 + (n % (d - 1)),
        total = q * d + r
      return numeric(
        mode === 0
          ? `${total}÷${d}，商是多少？`
          : mode === 1
            ? `${total}÷${d}，余数是多少？`
            : `${q}×${d}＋${r}＝${total}，这道有余数除法的除数是多少？`,
        mode === 0 ? q : mode === 1 ? r : d,
        `${total}÷${d}＝${q}……${r}；余数${r}小于除数${d}。`,
      )
    }
    case 'boats': {
      const capacity = 3 + (n % 5),
        total = capacity * (3 + k) + 1 + (n % (capacity - 1))
      return numeric(
        `${total}人乘船，每条船最多坐${capacity}人，至少需要几条船？`,
        Math.ceil(total / capacity),
        `先求${total}÷${capacity}，有余数就再准备1条船，共${Math.ceil(total / capacity)}条。`,
      )
    }
    case 'hundreds':
    case 'carry':
    case 'continuous-carry':
    case 'chain-add':
    case 'big-add-subtract':
    case 'review-chains':
    case 'review-add-subtract': {
      const x = 236 + 17 * n + 5 * k,
        y = 178 + 9 * n
      return numeric(
        mode === 2
          ? `图书角有${x}本书，又收到${y}本，之后借出${a}本，现在还有几本？`
          : `${x}＋${y}＝？`,
        mode === 2 ? x + y - a : x + y,
        `相同数位对齐，满十进1。${x}＋${y}＝${x + y}${mode === 2 ? `，再减${a}得${x + y - a}` : ''}。`,
      )
    }
    case 'subtract':
    case 'continuous-borrow':
    case 'chain-sub':
    case 'review-subtract':
    case 'check':
    case 'review-check': {
      const x = 600 + 23 * n + 10 * k,
        y = 179 + 13 * n
      return numeric(
        mode === 2 ? `${x}张卡片送出${y}张后，又送出${a}张，还剩几张？` : `${x}－${y}＝？`,
        mode === 2 ? x - y - a : x - y,
        `不够减时从高一位退1。${x}－${y}＝${x - y}${mode === 2 ? `，再减${a}得${x - y - a}` : ''}。`,
      )
    }
    case 'mixed':
    case 'multiply-mix':
    case 'divide-mix':
    case 'brackets':
    case 'mixed-review': {
      const x = 20 + n + k
      if (topic === 'brackets')
        return numeric(
          `（${x}＋${a}）×${b}＝？`,
          (x + a) * b,
          `先算括号内${x}＋${a}＝${x + a}，再乘${b}。`,
        )
      if (topic === 'divide-mix')
        return numeric(
          `${a * b}÷${b}＋${x}＝？`,
          a + x,
          `先除后加，${a * b}÷${b}＝${a}，再加${x}。`,
        )
      return numeric(`${x}＋${a}×${b}＝？`, x + a * b, `先算乘法${a}×${b}＝${a * b}，再加${x}。`)
    }
    case 'mental-multiplication':
    case 'written-multiplication':
    case 'written-multiply':
    case 'multiplication-use':
    case 'multiply-use': {
      if (topic === 'multiply-use' && grade >= 5) {
        const total = 8 * a
        return numeric(`${total}米彩带的3/8是多少米？`, 3 * a, `${total}×3/8＝${3 * a}（米）。`)
      }
      const x = topic === 'written-multiply' ? 100 + 11 * n : 10 + n + k,
        y = 10 + b
      return numeric(
        mode === 2 ? `每盒有${x}支笔，${y}盒一共有几支？` : `${x}×${y}＝？`,
        x * y,
        `${x}×${y}＝${x * y}。可分成${x}×10和${x}×${b}再相加。`,
      )
    }
    case 'multiplication-estimate':
    case 'multiply-estimate': {
      const x = 19 + 10 * n,
        y = 21 + 2 * k,
        rx = Math.round(x / 10) * 10,
        ry = Math.round(y / 10) * 10
      return numeric(
        `把${x}和${y}都看作最接近的整十数，估算${x}×${y}约是多少？`,
        rx * ry,
        `${x}≈${rx}，${y}≈${ry}，估算为${rx}×${ry}＝${rx * ry}。`,
      )
    }
    case 'thousand':
    case 'ten-thousand':
    case 'tibet':
    case 'place-value':
    case 'read-write':
    case 'review-numbers': {
      const place = grade >= 4 ? 10000 : 100,
        x = ((n % 8) + 1) * place + (k + 2) * 10 + b
      if (topic === 'read-write')
        return numeric(
          `${(n % 8) + 1}个万、${k + 2}个十和${b}个一组成的数是多少？`,
          ((n % 8) + 1) * 10000 + (k + 2) * 10 + b,
          '把各个数位的数量相加，没有计数单位的位置写0。',
        )
      return numeric(
        `数${x}中，最左边的数字${(n % 8) + 1}表示多少？`,
        ((n % 8) + 1) * place,
        `它在${place === 10000 ? '万' : '百'}位，表示${(n % 8) + 1}个${place}，也就是${((n % 8) + 1) * place}。`,
      )
    }
    case 'compare':
    case 'compare-convert': {
      const x = grade >= 4 ? (2 + n) * 10000 : 1000 + 100 * n
      return numeric(
        grade >= 4
          ? `${x}改写成以“万”为单位的数是多少？（只填数值）`
          : `${x}比${x - a * 10}多多少？`,
        grade >= 4 ? x / 10000 : a * 10,
        grade >= 4 ? `${x}÷10000＝${x / 10000}（万）。` : `用较大数减较小数，差是${a * 10}。`,
      )
    }
    case 'estimate':
    case 'rounding': {
      const x = 1200 + 137 * n + 11 * k,
        place = topic === 'rounding' && grade >= 4 ? 1000 : 100
      return numeric(
        `${x}四舍五入到${place === 1000 ? '千' : '百'}位约是多少？`,
        Math.round(x / place) * place,
        `看${place === 1000 ? '百' : '十'}位，满5进1，不满5舍去，约为${Math.round(x / place) * place}。`,
      )
    }
    case 'codes':
      return choice(
        `图书编号为“${2020 + n}-0${b}-0${a}”，规则是“年份-书架-层数”。中间的0${b}表示什么？`,
        '书架编号',
        ['图书页数', '出版月份'],
        '编码的含义由约定决定，这里中间一段表示书架编号。',
        { kind: 'cards', labels: [`${2020 + n}`, `0${b}`, `0${a}`], caption: '年份 → 书架 → 层数' },
      )
    case 'animal-mass':
      return numeric(
        `${a}千克${b * 100}克合多少克？`,
        a * 1000 + b * 100,
        `1千克＝1000克，${a}×1000＋${b * 100}＝${a * 1000 + b * 100}克。`,
      )
    case 'mm-dm':
    case 'dm-mm':
    case 'length-review':
    case 'body-ruler':
      return numeric(
        `${a}分米${b}厘米合多少毫米？`,
        a * 100 + b * 10,
        `1分米＝100毫米，1厘米＝10毫米，所以${a}×100＋${b}×10＝${a * 100 + b * 10}。`,
      )
    case 'kilometre':
    case 'distance':
      return numeric(
        `${a}千米${b * 100}米合多少米？`,
        a * 1000 + b * 100,
        `1千米＝1000米，${a}×1000＋${b * 100}＝${a * 1000 + b * 100}（米）。`,
      )
    case 'estimate-length': {
      const objects = [
        '铅笔',
        '教室的门',
        '两个城市之间的公路',
        '橡皮',
        '教室的长',
        '长途旅行路线',
        '手指',
        '旗杆',
        '跨市铁路',
      ]
      const units = ['厘米', '米', '千米', '厘米', '米', '千米', '厘米', '米', '千米']
      const unit = units[index % 9]!
      return choice(
        `要记录${objects[index % 9]}的长度，选用哪个单位最合适？`,
        unit,
        ['厘米', '米', '千米'].filter((value) => value !== unit),
        '根据测量对象的大小选择合适的长度单位。',
      )
    }
    case 'rectangle':
    case 'perimeter-meaning':
    case 'rectangle-square-perimeter': {
      return numeric(
        `长方形长${a}厘米，宽${b}厘米，周长是多少厘米？`,
        2 * (a + b),
        `周长＝（长＋宽）×2＝（${a}＋${b}）×2＝${2 * (a + b)}厘米。`,
        rect(a, b),
      )
    }
    case 'joined-perimeter': {
      return numeric(
        `把两个边长${a}厘米的正方形沿一整条边拼成长方形，新图形周长是多少厘米？`,
        6 * a,
        `长变成${2 * a}厘米，宽是${a}厘米，周长＝（${2 * a}＋${a}）×2＝${6 * a}厘米。`,
        rect(2 * a, a),
      )
    }
    case 'angle':
    case 'angles':
    case 'right-angle':
    case 'protractor':
    case 'review-angles': {
      const degrees = [30, 60, 90, 120, 150][(n + k) % 5]!
      return choice(
        '看角的示意图，按标出的度数，这是什么角？',
        degrees < 90 ? '锐角' : degrees === 90 ? '直角' : '钝角',
        ['锐角', '直角', '钝角'].filter(
          (x) => x !== (degrees < 90 ? '锐角' : degrees === 90 ? '直角' : '钝角'),
        ),
        `这个角是${degrees}°，${degrees < 90 ? '小于90°，是锐角' : degrees === 90 ? '等于90°，是直角' : '大于90°且小于180°，是钝角'}。`,
        { kind: 'angle', degrees },
      )
    }
    case 'lines': {
      const facts: [string, string, string[], string][] = [
        ['一条线段有几个端点？', '2', ['0', '1'], '线段有两个端点，可以测量长度。'],
        ['一条射线有几个端点？', '1', ['0', '2'], '射线有一个端点，可以向一个方向无限延伸。'],
        ['一条直线有几个端点？', '0', ['1', '2'], '直线向两端无限延伸，没有端点。'],
        [
          '两条直线相交形成90°，有什么关系？',
          '互相垂直',
          ['互相平行', '永不相交'],
          '相交成直角的两条直线互相垂直。',
        ],
        [
          '同一平面内，两条直线永不相交，是什么关系？',
          '互相平行',
          ['互相垂直', '相交'],
          '同一平面内不相交的两条直线互相平行。',
        ],
        ['经过两个不同的点，可以画几条直线？', '1', ['2', '无数'], '两点确定一条直线。'],
        ['经过一个点，可以画多少条直线？', '无数', ['1', '2'], '方向不同就能画出不同直线。'],
        [
          '下面哪个对象可以测量确定的长度？',
          '线段',
          ['射线', '直线'],
          '线段有两个端点，长度是确定的。',
        ],
        [
          '从线段的一个端点向一端无限延长，得到什么？',
          '射线',
          ['直线', '圆'],
          '保留一个端点、只向一个方向无限延伸，是射线。',
        ],
      ]
      const f = facts[index % 9]!
      return choice(
        f[0],
        f[1],
        f[2],
        f[3],
        index % 9 === 3 ? { kind: 'angle', degrees: 90 } : undefined,
      )
    }
    case 'parallelogram':
    case 'quadrilaterals':
    case 'shapes':
    case 'shape-classify':
    case 'review-shapes':
    case 'review-old-geometry':
    case 'review-new-geometry':
    case 'review-geometry': {
      const labels = [
        '两组对边分别平行，四个角都是直角',
        '只有一组对边平行',
        '三条线段首尾相接围成',
      ][mode]!
      return choice(
        `一个图形${labels}，它是哪个图形？`,
        ['长方形', '梯形', '三角形'][mode]!,
        ['长方形', '梯形', '三角形'].filter((x) => x !== ['长方形', '梯形', '三角形'][mode]),
        '根据边和角的条件分类；只有一组对边平行的是梯形。',
        mode === 0
          ? rect(a, b)
          : mode === 1
            ? { kind: 'trapezoid', width: a, height: b, top: 3, unit: '厘米' }
            : { kind: 'triangle', width: a, height: b, unit: '厘米' },
      )
    }
    case 'heights':
    case 'triangle-heights':
      return choice(
        '图中蓝色虚线与标出的底边垂直，这条虚线表示什么？',
        '这条底边对应的高',
        ['一条斜边', '整个图形的周长'],
        '高是到对应底边所在直线的垂直距离。',
        {
          kind: topic === 'heights' ? 'parallelogram' : 'triangle',
          width: a,
          height: b,
          unit: '厘米',
        },
      )
    case 'triangle-angles':
    case 'triangle-properties': {
      const x = 30 + n,
        y = 50 + 2 * n + k
      return numeric(
        `三角形两个内角分别是${x}°和${y}°，第三个内角是多少度？`,
        180 - x - y,
        `三角形内角和是180°，180－${x}－${y}＝${180 - x - y}°。`,
      )
    }
    case 'triangle-sides': {
      const short = 3 + n + k,
        longest = index % 2 === 0 ? 2 * short : 2 * short + 2,
        can = 2 * short + 1 > longest
      return choice(
        `长度为${short}、${short + 1}、${longest}厘米的三根小棒能围成三角形吗？`,
        can ? '能' : '不能',
        can ? ['不能', '只有换颜色才行'] : ['能', '把最长边放下面就能'],
        `较短两边和${2 * short + 1}${can ? '大于' : '小于'}最长边${longest}，${can ? '能' : '不能'}围成三角形。`,
        {
          kind: 'cards',
          labels: [`${short}厘米`, `${short + 1}厘米`, `${longest}厘米`],
          caption: '三根小棒',
        },
      )
    }
    case 'decimal-reading':
    case 'decimal-meaning':
      return numeric(
        `${decimalA.toFixed(1)}中，小数点右边第一位数字表示多少个十分之一？`,
        (25 + 3 * n + k) % 10,
        '小数点右边第一位是十分位，数字几就表示几个十分之一。',
      )
    case 'decimal-compare':
      return choice(
        `在${decimalA.toFixed(2)}、${(decimalA + 0.03).toFixed(2)}、${(decimalA + 0.3).toFixed(2)}中，哪个最大？`,
        (decimalA + 0.3).toFixed(2),
        [decimalA.toFixed(2), (decimalA + 0.03).toFixed(2)],
        '先比较整数部分，再从十分位开始逐位比较。',
      )
    case 'decimal-add':
    case 'decimal-sum':
    case 'decimal-life':
    case 'sports':
      return numeric(
        mode === 2
          ? `跳远成绩分别是${decimalA.toFixed(1)}米和${decimalB.toFixed(1)}米，两次相差多少米？`
          : `${decimalA.toFixed(1)}＋${decimalB.toFixed(1)}＝？`,
        mode === 2 ? decimalA - decimalB : decimalA + decimalB,
        `把小数点对齐，按位${mode === 2 ? '相减' : '相加'}，结果是${round(mode === 2 ? decimalA - decimalB : decimalA + decimalB)}。`,
      )
    case 'decimal-mix':
      return numeric(
        `${decimalA.toFixed(1)}＋${decimalB.toFixed(1)}－0.6＝？`,
        decimalA + decimalB - 0.6,
        `同级运算从左到右，先相加，再减0.6，得${round(decimalA + decimalB - 0.6)}。`,
      )
    case 'decimal-shift':
      return numeric(
        `${decimalA.toFixed(1)}的小数点向右移动${mode === 0 ? 1 : 2}位，得到多少？`,
        decimalA * (mode === 0 ? 10 : 100),
        `向右移${mode === 0 ? 1 : 2}位，相当于乘${mode === 0 ? 10 : 100}。`,
      )
    case 'decimal-multiply':
    case 'decimal-laws':
      return numeric(
        `${decimalA.toFixed(1)}×${decimalB.toFixed(1)}＝？`,
        decimalA * decimalB,
        `先按整数相乘，再根据两个因数共2位小数确定小数点，得${round(decimalA * decimalB)}。`,
      )
    case 'addition-laws':
      return numeric(
        `${a}＋${b}＋${100 - a}＝？`,
        100 + b,
        `交换并结合${a}和${100 - a}，先凑成100，再加${b}。`,
      )
    case 'multiplication-laws':
    case 'distributive':
    case 'calculator':
      return numeric(`25×${a}×4＝？`, 100 * a, `利用乘法交换律和结合律，先算25×4＝100，再乘${a}。`)
    case 'letters':
    case 'equation-properties':
      return numeric(
        `正方形边长是a厘米，周长C＝4a。当a＝${a}时，C是多少厘米？`,
        4 * a,
        `把a＝${a}代入C＝4a，得${4 * a}厘米。`,
        rect(a, a),
      )
    case 'equation-meaning':
      return choice(
        '下面哪个式子是方程？',
        `${a}x＝${a * b}`,
        [`${a}＋${b}＝${a + b}`, `${a}x＋${b}`],
        '方程是含未知数的等式。第一项含x并且有等号。',
      )
    case 'solve-equations':
    case 'equation-solve':
      return numeric(
        `${b}x＋${a}＝${b * (a + 2) + a}，x＝？`,
        a + 2,
        `等式两边先减${a}，再除以${b}，x＝${a + 2}。代回检验相等。`,
      )
    case 'equation-use':
    case 'equation-quantities':
      return numeric(
        `小明有x张卡，小华有${b}x张，两人共${a * (b + 1)}张。小明有几张？`,
        a,
        `x＋${b}x＝${a * (b + 1)}，即${b + 1}x＝${a * (b + 1)}，解得x＝${a}。`,
      )
    case 'fraction-equation':
    case 'divide-use':
    case 'fraction-unknown':
      return numeric(
        `一条彩带的3/4长${3 * a}米，彩带全长多少米？`,
        4 * a,
        `设全长为x，3/4×x＝${3 * a}，x＝${3 * a}÷3/4＝${4 * a}米。`,
      )
    case 'fraction-add':
    case 'fraction-mix': {
      const x = n + 2 * k,
        y = 1 + ((n + k) % 2)
      return numeric(
        `${x}/4＋${y}/8${topic === 'fraction-mix' ? '－1/8' : ''}＝？（可填分数或小数）`,
        x / 4 + y / 8 - (topic === 'fraction-mix' ? 1 / 8 : 0),
        `先通分到分母8：${x}/4＝${2 * x}/8，再计算分子。`,
      )
    }
    case 'fraction-decimal':
    case 'percent-convert': {
      const numerator = 1 + ((n + k) % 7)
      return numeric(
        `${numerator}/8化成${topic === 'percent-convert' ? '百分数，百分号前的数' : '小数'}是多少？`,
        (numerator / 8) * (topic === 'percent-convert' ? 100 : 1),
        `分数化小数用分子÷分母，${numerator}÷8＝${numerator / 8}${topic === 'percent-convert' ? `，再乘100得${(numerator / 8) * 100}%` : ''}。`,
        { kind: 'fraction', parts: 8, shaded: numerator },
      )
    }
    case 'fraction-multiply':
      return numeric(
        `${a}/8×${b}/5＝？（可填分数或小数）`,
        (a * b) / 40,
        `分子相乘，分母相乘，结果为${a * b}/40，即${round((a * b) / 40)}。`,
      )
    case 'fraction-divide':
      return numeric(
        `${a}/8÷1/4＝？（可填分数或小数）`,
        a / 2,
        `除以1/4就是乘4，${a}/8×4＝${a}/2＝${a / 2}。`,
      )
    case 'reciprocal':
      return numeric(
        `一个数的倒数是1/${a}，这个数是多少？`,
        a,
        `乘积为1的两个数互为倒数，${a}×1/${a}＝1。`,
      )
    case 'fraction-known':
    case 'unit-one':
      return numeric(
        `图书角原有${8 * a}本书，新增的书是原来数量的1/4，现在共有几本？`,
        10 * a,
        `单位1是原来${8 * a}本，新增${8 * a}×1/4＝${2 * a}本，共${10 * a}本。`,
      )
    case 'percent-rates':
    case 'percent-use':
    case 'nutrition':
    case 'water-saving': {
      const percent = 10 + 5 * n,
        total = 200 + 100 * k
      return numeric(
        topic === 'water-saving'
          ? `原来每周用水${total}升，减少${percent}%后，每周少用多少升？`
          : `总量${total}，其中一部分占${percent}%，这一部分是多少？`,
        (total * percent) / 100,
        `部分量＝总量×百分率，${total}×${percent}%＝${(total * percent) / 100}。`,
      )
    }
    case 'ratio-meaning':
    case 'ratio-simplify':
      return choice(
        `把比${2 * a}∶${3 * a}化成最简单的整数比。`,
        '2∶3',
        ['3∶2', '2∶5'],
        `比的前项和后项都除以${a}，得到2∶3。`,
      )
    case 'ratio-share':
      return numeric(
        `把${5 * a}支铅笔按2∶3分给甲乙，甲分到几支？`,
        2 * a,
        `总份数2＋3＝5，每份${a}支，甲有2份，共${2 * a}支。`,
      )
    case 'area-units':
      return numeric(
        `${a}平方米合多少平方厘米？`,
        a * 10000,
        `1平方米＝10000平方厘米，${a}×10000＝${a * 10000}。`,
      )
    case 'parallelogram-area':
      return numeric(
        `平行四边形底${a}厘米，对应的高${b}厘米，面积是多少平方厘米？`,
        a * b,
        `面积＝底×高＝${a}×${b}＝${a * b}。`,
        { kind: 'parallelogram', width: a, height: b, unit: '厘米' },
      )
    case 'triangle-trapezoid-area':
    case 'compound-area': {
      if (mode === 0)
        return numeric(
          `三角形底${2 * a}厘米，高${b}厘米，面积是多少平方厘米？`,
          a * b,
          `底×高÷2＝${2 * a}×${b}÷2＝${a * b}。`,
          { kind: 'triangle', width: 2 * a, height: b, unit: '厘米' },
        )
      if (mode === 1)
        return numeric(
          `梯形上底${a}厘米，下底${a + 2}厘米，高${b}厘米，面积是多少平方厘米？`,
          (a + 1) * b,
          `（上底＋下底）×高÷2＝${(a + 1) * b}。`,
          { kind: 'trapezoid', width: a + 2, top: a, height: b, unit: '厘米' },
        )
      return numeric(
        `长${a}厘米、宽${b}厘米的长方形，剪去面积${b}平方厘米的小三角形后，剩余面积是多少？`,
        a * b - b,
        `长方形面积${a * b}，减去${b}，还剩${a * b - b}平方厘米。`,
      )
    }
    case 'hands-on':
    case 'leaves':
      return numeric(
        `在边长1厘米的方格纸上，完整格有${a}格，${2 * b}个半格可以合成${b}个整格，这个图形约有多少平方厘米？`,
        a + b,
        `每格1平方厘米，完整格加上合并后的半格，约${a + b}平方厘米。`,
      )
    case 'chicken-rabbit':
      return numeric(
        `鸡和兔共${a + b}只，一共${2 * a + 4 * b}条腿，其中兔有几只？`,
        b,
        `假设全是鸡，腿数少了${2 * b}，每换1只兔增加2条腿，所以兔有${b}只。`,
      )
    case 'factors':
      return numeric(
        `${b}×${a}＝${a * b}，${a * b}是${b}的多少倍？`,
        a,
        `${a * b}÷${b}＝${a}，所以是${a}倍。`,
      )
    case 'multiple-rules':
      return choice(
        `下面哪个数同时是2和5的倍数？`,
        String(10 * a),
        [String(10 * a + 2), String(10 * a + 5)],
        '同时是2和5的倍数，个位一定是0。',
      )
    case 'primes':
      return choice(
        `在${[11, 13, 17][mode]}、1、${12 + 2 * n}中，哪个是质数？`,
        String([11, 13, 17][mode]!),
        ['1', String(12 + 2 * n)],
        '质数只有1和它本身两个因数，1不是质数；给出的偶数大于2，是合数。',
      )
    case 'cuboid-features': {
      const facts: [string, string, string[], string][] = [
        ['长方体共有多少条棱？', '12', ['8', '6'], '共有12条棱，按方向分成3组。'],
        ['长方体共有多少个顶点？', '8', ['6', '12'], '上下各4个顶点，共8个。'],
        ['长方体共有多少个面？', '6', ['4', '8'], '上、下、前、后、左、右共6个面。'],
        ['长方体每组互相平行的棱有几条？', '4', ['2', '6'], '12条棱分成3组，每组4条。'],
        [
          '正方体的12条棱长度有什么关系？',
          '全部相等',
          ['只有4条相等', '都不相等'],
          '正方体12条棱都一样长。',
        ],
        [
          '长方体相对的面大小有什么关系？',
          '相等',
          ['一定不相等', '只看画图大小'],
          '长方体相对的面完全相同。',
        ],
        ['一个一般的长方体有几组相对的面？', '3', ['2', '6'], '上下、前后、左右共3组。'],
        [
          '正方体是不是特殊的长方体？',
          '是',
          ['不是', '看颜色决定'],
          '正方体具有长方体的特征，是长宽高相等的特殊长方体。',
        ],
        [
          '长方体的每个面一定是什么图形？',
          '长方形（可能是正方形）',
          ['三角形', '圆'],
          '长方体的6个面都是长方形，特殊情况下是正方形。',
        ],
      ]
      const f = facts[index % 9]!
      return choice(f[0], f[1], f[2], f[3], {
        kind: 'solid',
        shape: 'cuboid',
        a,
        b,
        c: a + 1,
        unit: '厘米',
      })
    }
    case 'edge-length':
      return numeric(
        `长方体长${a}厘米、宽${b}厘米、高${a + 1}厘米，棱长总和是多少厘米？`,
        4 * (2 * a + b + 1),
        `棱长总和＝（长＋宽＋高）×4＝${4 * (2 * a + b + 1)}厘米。`,
        { kind: 'solid', shape: 'cuboid', a, b, c: a + 1, unit: '厘米' },
      )
    case 'surface-area':
    case 'packaging':
      return numeric(
        `长方体长${a}厘米、宽${b}厘米、高${a + 1}厘米，六个面的总面积是多少平方厘米？`,
        2 * (a * b + a * (a + 1) + b * (a + 1)),
        `表面积＝（长×宽＋长×高＋宽×高）×2＝${2 * (a * b + a * (a + 1) + b * (a + 1))}。`,
        { kind: 'solid', shape: 'cuboid', a, b, c: a + 1, unit: '厘米' },
      )
    case 'volume-units':
      return numeric(
        `${a}立方分米合多少立方厘米？`,
        a * 1000,
        `1立方分米＝1000立方厘米，所以是${a * 1000}立方厘米。`,
      )
    case 'volume-formula':
      return numeric(
        `长方体长${a}厘米、宽${b}厘米、高${a + 1}厘米，体积是多少立方厘米？`,
        a * b * (a + 1),
        `体积＝长×宽×高＝${a}×${b}×${a + 1}＝${a * b * (a + 1)}。`,
        { kind: 'solid', shape: 'cuboid', a, b, c: a + 1, unit: '厘米' },
      )
    case 'displacement':
      return numeric(
        `长方体水箱底面积${10 * a}平方厘米，放入完全浸没的石块后水面升高${b}厘米。没有水溢出，石块体积是多少立方厘米？`,
        10 * a * b,
        `上升的水的体积等于石块体积，底面积×上升高度＝${10 * a * b}。`,
      )
    case 'nets': {
      if (mode === 0)
        return numeric(
          index % 9 === 0
            ? '图中的正方体展开图有几个正方形面？'
            : index % 9 === 3
              ? `每个正方形面的面积是${a}平方厘米，整个展开图面积是多少？`
              : `一个面边长${a}厘米，正方体表面积是多少平方厘米？`,
          index % 9 === 0 ? 6 : index % 9 === 3 ? 6 * a : 6 * a * a,
          index % 9 === 0
            ? '展开图包含6个面。'
            : index % 9 === 3
              ? `6个面的面积相加，${a}×6＝${6 * a}。`
              : `每个面面积${a * a}，共6个面，合计${6 * a * a}。`,
          { kind: 'net' },
        )
      const facts: [string, string, string[], string][] = [
        [
          '正方体展开图中的正方形，大小有什么关系？',
          '全部相同',
          ['只有两个相同', '全部不同'],
          '正方体的6个面是完全相同的正方形。',
        ],
        [
          '把展开图折回正方体，图形的总表面积会改变吗？',
          '不会',
          ['会变大', '会变小'],
          '只改变位置，不增减纸面面积。',
        ],
        ['正方体有几组相对的面？', '3', ['2', '6'], '上下面、前后面、左右面，共3组。'],
        [
          '一张展开图重复画了同一个面，漏掉另一个面，能拼出完整正方体吗？',
          '不能',
          ['能', '只要加大纸就能'],
          '6个面要分别对应，不能缺面或重叠。',
        ],
        ['图中的正方体展开图由几种形状的面组成？', '1', ['2', '3'], '所有面都是正方形。'],
        ['展开图折回正方体后，共有几个顶点？', '8', ['6', '12'], '折回后是正方体，有8个顶点。'],
      ]
      const f = facts[[1, 2, 4, 5, 7, 8].indexOf(index % 9)]!
      return choice(f[0], f[1], f[2], f[3], { kind: 'net' })
    }
    case 'circle-parts':
      return numeric(
        `圆的半径是${a}厘米，直径是多少厘米？`,
        2 * a,
        `同一个圆中，直径＝半径×2＝${2 * a}厘米。`,
        { kind: 'circle', radius: a, unit: '厘米' },
      )
    case 'circumference':
      return numeric(
        `圆的半径是${a}厘米，圆周长是多少厘米？（π取3.14）`,
        6.28 * a,
        `周长＝2πr＝2×3.14×${a}＝${round(6.28 * a)}厘米。`,
        { kind: 'circle', radius: a, unit: '厘米' },
      )
    case 'circle-area':
      return numeric(
        `圆的半径是${a}厘米，面积是多少平方厘米？（π取3.14）`,
        3.14 * a * a,
        `面积＝πr²＝3.14×${a}×${a}＝${round(3.14 * a * a)}。`,
        { kind: 'circle', radius: a, unit: '厘米' },
      )
    case 'annulus':
      return numeric(
        `圆环外半径${a + 2}厘米，内半径${a}厘米，面积是多少平方厘米？（π取3.14）`,
        3.14 * ((a + 2) ** 2 - a * a),
        `圆环面积＝外圆面积－内圆面积＝3.14×（${a + 2}²－${a}²）。`,
        { kind: 'circle', radius: a, outer: a + 2, unit: '厘米' },
      )
    case 'cylinder-parts': {
      const facts: [string, string, string[], string][] = [
        ['圆柱有几个圆形底面？', '2', ['1', '3'], '圆柱有上下2个圆形底面。'],
        [
          '圆柱两个底面的大小有什么关系？',
          '完全相同',
          ['上大下小', '一定不同'],
          '两个底面是完全相同的圆。',
        ],
        [
          '圆柱两个底面之间的垂直距离叫什么？',
          '高',
          ['半径', '直径'],
          '两底面之间的垂直距离是高。',
        ],
        [
          '沿圆柱的一条高剪开侧面，通常得到什么图形？',
          '长方形',
          ['三角形', '圆'],
          '长方形一边是底面周长，另一边是高。',
        ],
        ['圆锥有几个圆形底面？', '1', ['2', '3'], '圆锥有1个底面和1个侧面。'],
        [
          '圆柱的侧面是什么面？',
          '曲面',
          ['三角形面', '只有一个点'],
          '圆柱侧面是围绕底面的一片曲面。',
        ],
        [
          '圆柱可以画多少条高？',
          '无数条',
          ['1条', '2条'],
          '连接两底面对应点的垂直线段都可以是高。',
        ],
        [
          '圆锥的高是顶点到哪里的垂直距离？',
          '底面所在平面',
          ['底面圆周任意一点', '侧面边缘'],
          '高必须与底面所在平面垂直。',
        ],
        [
          '圆柱侧面展开图的长对应原图的哪个量？',
          '底面周长',
          ['底面面积', '半径'],
          '沿高展开，长方形的长围成底面一周。',
        ],
      ]
      const f = facts[index % 9]!
      return choice(f[0], f[1], f[2], f[3], {
        kind: 'solid',
        shape: index % 9 === 4 || index % 9 === 7 ? 'cone' : 'cylinder',
        a,
        b,
        c: a + 1,
        unit: '厘米',
      })
    }
    case 'cylinder-surface':
      return numeric(
        `圆柱底面半径${b}厘米，高${a}厘米。侧面积是多少平方厘米？（π取3.14）`,
        6.28 * a * b,
        `侧面积＝底面周长×高＝2×3.14×${b}×${a}。`,
        { kind: 'solid', shape: 'cylinder', a: b, b, c: a, unit: '厘米' },
      )
    case 'cylinder-volume':
      return numeric(
        `圆柱底面半径${b}厘米，高${a}厘米。体积是多少立方厘米？（π取3.14）`,
        3.14 * b * b * a,
        `体积＝底面积×高＝3.14×${b}²×${a}。`,
        { kind: 'solid', shape: 'cylinder', a: b, b, c: a, unit: '厘米' },
      )
    case 'cone-volume':
      return numeric(
        `圆锥底面积${3 * a}平方厘米，高${b}厘米，体积是多少立方厘米？`,
        a * b,
        `圆锥体积＝底面积×高÷3＝${3 * a}×${b}÷3＝${a * b}。`,
        { kind: 'solid', shape: 'cone', a, b, c: b, unit: '厘米', baseArea: 3 * a },
      )
    case 'proportion':
      return numeric(
        `${a}∶${b}＝x∶${2 * b}，x是多少？`,
        2 * a,
        `比例的两内项积等于两外项积，${b}x＝${a * 2 * b}，x＝${2 * a}。`,
      )
    case 'scale':
    case 'campus-plan':
      return numeric(
        `比例尺1∶1000，图上距离${a}厘米，实际距离是多少米？`,
        10 * a,
        `实际距离${a}×1000＝${a * 1000}厘米，再除以100换成米，得${10 * a}米。`,
      )
    case 'scale-shapes':
      return numeric(
        `长方形长${a}厘米，宽${b}厘米，按2∶1放大后，面积是多少平方厘米？`,
        4 * a * b,
        `长宽分别变成${2 * a}和${2 * b}厘米，面积${4 * a * b}；面积扩大4倍。`,
        rect(a, b),
      )
    case 'direct-proportion':
      return numeric(
        `单价固定为${b}元，买${a}件物品，总价是多少元？`,
        a * b,
        `总价＝单价×数量，${b}×${a}＝${a * b}。总价和数量的比值一定。`,
      )
    case 'inverse-proportion':
      return numeric(
        `一项工作由${b}人做需要${a * 2}天。如果每人的效率相同，改为${2 * b}人做，需要几天？`,
        a,
        `人数×天数一定，${b}×${2 * a}÷${2 * b}＝${a}天。`,
      )
    case 'proportion-judge': {
      const cases: [string, string, string][] = [
        ['速度固定，路程和时间', '正比例', '路程÷时间＝速度，比值一定。'],
        [`路程固定为${100 * a}千米，速度和时间`, '反比例', '速度×时间＝路程，乘积一定。'],
        [`单价固定为${b}元，总价和数量`, '正比例', '总价÷数量＝单价，比值一定。'],
        [`总价固定为${a * b}元，单价和数量`, '反比例', '单价×数量＝总价，乘积一定。'],
        ['正方形的面积和边长', '不成比例', '面积÷边长等于边长，比值不固定；乘积也不固定。'],
        ['正方形的周长和边长', '正比例', '周长÷边长＝4，比值一定。'],
        ['车轮周长固定，转动圈数和行进路程', '正比例', '路程÷圈数＝车轮周长，比值一定。'],
        ['一个人的年龄和身高', '不成比例', '年龄与身高的比值和乘积都不固定。'],
        [`长方形面积固定为${a * b}平方厘米，长和宽`, '反比例', '长×宽＝面积，乘积一定。'],
      ]
      const c = cases[index % 9]!
      return choice(
        `${c[0]}成什么关系？`,
        c[1],
        ['正比例', '反比例', '不成比例'].filter((v) => v !== c[1]),
        c[2],
      )
    }
    case 'meeting':
      return numeric(
        `两人同时相向而行，速度分别是${a}米/分和${b}米/分，${a + 1}分钟相遇。两地相距多少米？`,
        (a + b) * (a + 1),
        `相遇路程＝速度和×时间＝（${a}＋${b}）×${a + 1}。`,
      )
    case 'travel':
    case 'travel-plan':
    case 'applications':
    case 'review-applications':
      return numeric(
        `车的速度是${10 * a}千米/时，行驶${b}小时，路程是多少千米？`,
        10 * a * b,
        `路程＝速度×时间＝${10 * a}×${b}＝${10 * a * b}千米。`,
      )
    case 'price':
      return numeric(
        `每本练习本${b}元，买${a}本，付出${a * b + 2 * n + k}元，应找回多少元？`,
        2 * n + k,
        `总价＝${b}×${a}＝${a * b}元；${a * b + 2 * n + k}－${a * b}＝${2 * n + k}元。`,
      )
    case 'combinations':
      return numeric(
        `${b}件上衣与${a}条裤子，每次各选一件，有多少种不同搭配？`,
        a * b,
        `每件上衣能搭配${a}条裤子，共${b}×${a}＝${a * b}种。`,
      )
    case 'clock':
    case 'school-time':
    case 'duration':
    case 'navigation': {
      const start = (8 + k) * 60 + 10 + n,
        elapsed = 35 + 3 * n + 5 * k,
        end = start + elapsed
      return numeric(
        `从${Math.floor(start / 60)}时${start % 60}分到${Math.floor(end / 60)}时${end % 60}分，经过多少分钟？`,
        elapsed,
        `把两个时刻都换成从0时起的分钟数相减，${end}－${start}＝${elapsed}分。`,
        { kind: 'clock', hour: Math.floor(start / 60), minute: start % 60 },
      )
    }
    case 'seconds':
      return numeric(
        `${a}分${b}秒一共是多少秒？`,
        60 * a + b,
        `1分＝60秒，${a}×60＋${b}＝${60 * a + b}秒。`,
      )
    case 'calendar': {
      const year = 2024 + index,
        month = [2, 4, 7][mode]!,
        days = month === 2 ? (year % 4 === 0 ? 29 : 28) : month === 4 ? 30 : 31
      return numeric(
        `${year}年${month}月有多少天？`,
        days,
        `${month === 2 ? (year % 4 === 0 ? '这一年是闰年，2月有29天' : '这一年是平年，2月有28天') : month === 4 ? '4月是小月，有30天' : '7月是大月，有31天'}。`,
      )
    }
    case 'coordinate':
    case 'coordinates':
    case 'gomoku':
      return choice(
        `图中A在第${b}列、第${(a % 5) + 1}行，用数对（列，行）表示是哪个？`,
        `（${b}，${(a % 5) + 1}）`,
        [`（${(a % 5) + 1}，${b + 1}）`, `（${b + 1}，${(a % 5) + 1}）`],
        '数对的第一个数是列，第二个数是行。',
        { kind: 'grid', columns: 6, rows: 6, marked: [[b, (a % 5) + 1]], labels: true },
      )
    case 'directions':
    case 'eight-directions':
    case 'direction-distance':
    case 'position-drawing':
      return choice(
        '上北下南的路线图中，从大门先向北到路口，再向哪边到图书馆？',
        '东',
        ['西', '南'],
        '上北下南，左西右东。第二段从路口向右走，所以是向东。',
        { kind: 'route', first: 10 * a, second: 10 * b, unit: '米' },
      )
    case 'views':
    case 'cube-count':
    case 'reconstruct':
    case 'observe-one':
    case 'observe-two':
    case 'observation':
      return numeric(
        '图中三列小正方体只排一行，各列高度如图。搭建它们需要几个小正方体？',
        (a % 3) + 1 + b + 2,
        '只有一行，没有隐藏的后排，把三列的高度相加即可。',
        { kind: 'cubes', heights: [(a % 3) + 1, b, 2] },
      )
    case 'view-range':
      return choice(
        '同一个物体，观察位置变高后，通常更容易看见哪个面？',
        '上面',
        ['底面', '一定只能看见左面'],
        '提高观察位置通常更容易看到物体的上面；具体可见范围还要结合遮挡。',
        { kind: 'solid', shape: 'cuboid', a, b, c: a + 1, unit: '厘米' },
      )
    case 'count-figures':
      return numeric(
        `一条线段上按顺序标出${3 + (n % 4)}个点，任意两个点确定一条线段，共有多少条不同线段？`,
        ((3 + (n % 4)) * (2 + (n % 4))) / 2,
        '从第一个点起分别数，再依次从后面的点起数，避免重复。',
        {
          kind: 'cards',
          labels: Array.from({ length: 3 + (n % 4) }, (_, i) => String.fromCharCode(65 + i)),
          caption: '各点在同一直线上，顺序不变',
        },
      )
    case 'repeat':
    case 'repeat-pattern':
      return choice(
        `按“红、黄、蓝”不断重复，第${3 * a + mode + 1}个是什么颜色？`,
        ['红', '黄', '蓝'][mode]!,
        ['红', '黄', '蓝'].filter((x) => x !== ['红', '黄', '蓝'][mode]),
        `每3个一组，${3 * a + mode + 1}除以3余${mode + 1 === 3 ? 0 : mode + 1}，对应${['红', '黄', '蓝'][mode]}。`,
        { kind: 'cards', labels: ['红', '黄', '蓝', '红', '黄', '蓝', '…'], caption: '从左往右数' },
      )
    case 'quantity-pattern':
      return numeric(
        `数列${a}、${a + b}、${a + 2 * b}、□，每次增加${b}，□中填多少？`,
        a + 3 * b,
        `每一步加${b}，${a + 2 * b}＋${b}＝${a + 3 * b}。`,
      )
    case 'survey':
    case 'tally-data':
    case 'votes':
    case 'fruits':
    case 'bar-chart':
    case 'charts':
    case 'double-bar':
    case 'double-line':
    case 'average':
    case 'review-statistics': {
      const isAverage = topic === 'average' || topic === 'review-statistics',
        kind = topic === 'double-line' ? 'line' : 'bars'
      const diagram = chart(kind)
      if (topic === 'double-bar' || topic === 'double-line') diagram.second = [a + 1, a + 3, a + 5]
      return numeric(
        isAverage
          ? '图中三天借书数量的平均数是多少本？'
          : (topic.startsWith('double-') ? '图中绿色系列' : '图中') + '三天一共是多少本？',
        isAverage ? a + 2 : 3 * a + 6,
        isAverage
          ? `（${a}＋${a + 2}＋${a + 4}）÷3＝${a + 2}本。`
          : `${a}＋${a + 2}＋${a + 4}＝${3 * a + 6}本。`,
        diagram,
      )
    }
    case 'sector-chart':
      return numeric(
        `一个圆表示全班${4 * a}人，喜欢游泳的占1/4，有多少人？`,
        a,
        `总人数×所占比例＝${4 * a}×1/4＝${a}人。`,
        { kind: 'fraction', parts: 4, shaded: 1, circular: true },
      )
    case 'chart-choice': {
      const situations = [
        '比较三个班借书的数量',
        '观察一周气温的变化趋势',
        '表示三种活动人数占全班的比例',
        '比较四种水果销售数量',
        '观察植物一个月的身高变化',
        '表示各项支出占总支出的百分比',
        '比较各组收集废纸的质量',
        '观察一年每月用水量的变化趋势',
        '表示四类图书占全部图书的比例',
      ]
      const answer = ['条形统计图', '折线统计图', '扇形统计图'][mode]!
      return choice(
        `想${situations[index % 9]}，选择哪种统计图更合适？`,
        answer,
        ['条形统计图', '折线统计图', '扇形统计图'].filter((v) => v !== answer),
        '条形图便于比较数量，折线图便于观察变化，扇形图便于表示部分与整体的关系。',
      )
    }
    case 'chance':
    case 'fairness':
      return choice(
        `袋中有${a}个红球、${b}个蓝球，球的大小质地相同，任意摸一个，哪种颜色更可能摸到？`,
        '红球',
        ['蓝球', '两种机会相同'],
        `红球${a}个多于蓝球${b}个，摸到红球的可能性更大，但不是一定摸到。`,
      )
    case 'optimization':
      return numeric(
        `烧水需要${a}分钟，洗杯需要${b}分钟。烧水时可以洗杯，两件事都完成最少要几分钟？`,
        a,
        `两项可以同时进行，所需时间是较长的一项${a}分钟。`,
      )
    case 'mobius': {
      const facts: [string, string, string[], string][] = [
        ['莫比乌斯带有几个连续的面？', '1', ['2', '3'], '沿表面画线，不跨边缘就能走遍整个面。'],
        [
          '制作莫比乌斯带时，粘合前需要把一端扭转多少圈？',
          '半圈',
          ['一整圈', '不扭转'],
          '扭转半圈，即180°，再把两端粘合。',
        ],
        [
          '沿莫比乌斯带的边缘一直走，会找到几条连续的边界？',
          '1',
          ['2', '3'],
          '沿同一边缘连续走可以走遍整条边界。',
        ],
        [
          '纸带不扭转，直接粘成普通环，通常有几个面？',
          '2',
          ['1', '3'],
          '普通纸环有内侧和外侧两个面。',
        ],
        ['普通纸环不扭转，它有几条边界？', '2', ['1', '3'], '普通纸环的两条边界是分开的。'],
        [
          '验证莫比乌斯带只有一个面，哪种方法合适？',
          '沿表面连续画线',
          ['只看纸的颜色', '只测纸的长度'],
          '沿表面画线可以观察整个面的连通关系。',
        ],
        [
          '莫比乌斯带粘合完成后，还有未粘合的自由端吗？',
          '没有',
          ['有一个', '有两个'],
          '两个端头已经粘合成环，没有自由端。',
        ],
        ['半圈转动等于多少度？', '180', ['90', '360'], '一整圈360°，半圈180°。'],
        [
          '只把纸条换成另一种颜色，会改变莫比乌斯带的面数吗？',
          '不会',
          ['一定变成两个', '一定变成三个'],
          '颜色不改变纸带的连接方式。',
        ],
      ]
      const f = facts[index % 9]!
      return choice(`用长${a * 10}厘米的纸条做观察：${f[0]}`, f[1], f[2], f[3])
    }
    case 'book-order':
    case 'logic':
    case 'review-classification':
      return choice(
        `图书编号${a}、${a + 1}、${a + 2}依次递增，下一本编号应是多少？`,
        String(a + 3),
        [String(a + 4), String(a + 5)],
        `每次加1，下一个是${a + 3}。`,
      )
    case 'tulou':
    case 'tiling': {
      const f: [string, string, string[], string][] = [
        [
          '正方形能单独不留空隙、不重叠地铺满平面吗？',
          '能',
          ['不能', '只能用圆形'],
          '四个直角在一点拼成360°，正方形可以密铺。',
        ],
        [
          '同样大小的圆能单独不留空隙、不重叠地密铺平面吗？',
          '不能',
          ['能', '圆越大就一定能'],
          '圆与圆之间会留下空隙。',
        ],
        [
          '同样的三角形能密铺平面吗？',
          '能',
          ['不能', '只有正方形能'],
          '两个一样的三角形先拼成平行四边形，再排列密铺。',
        ],
        ['长方形能密铺平面吗？', '能', ['不能', '必须是正方形'], '长方形可以按行按列连续铺满。'],
        [
          '平行四边形能密铺平面吗？',
          '能',
          ['不能', '必须有直角'],
          '平行四边形的对边可以相接连续排列。',
        ],
        [
          '密铺需要同时满足什么条件？',
          '不留空隙且不重叠',
          ['只要好看', '允许重叠但不能留空隙'],
          '密铺是无空隙、不重叠地覆盖平面。',
        ],
        [
          '密铺时，围在同一顶点的一周，角度合计应是多少？',
          '360°',
          ['180°', '90°'],
          '平面上围着一点的一周是360°。',
        ],
        [
          `铺地每行${a}块，共${b}行，一共几块？`,
          String(a * b),
          [String(a * b + 1), String(a * b + 2)],
          `每行数量×行数＝${a * b}块。`,
        ],
        [
          `长方形小砖长${a}厘米、宽${b}厘米，单块面积是多少平方厘米？`,
          String(a * b),
          [String(a + b), String(2 * (a + b))],
          `长×宽＝${a}×${b}＝${a * b}平方厘米。`,
        ],
      ]
      const item = f[index % 9]!
      return choice(
        item[0],
        item[1],
        item[2],
        item[3],
        index % 9 === 7
          ? { kind: 'grid', rows: b, columns: a }
          : index % 9 === 8
            ? rect(a, b)
            : undefined,
      )
    }
    case 'fold':
    case 'symmetry':
    case 'design':
    case 'designer': {
      const facts: [string, string, string[], string][] = [
        [
          '一个非正方形的长方形有几条对称轴？',
          '2',
          ['1', '4'],
          '分别通过两组对边中点的直线是对称轴。',
        ],
        ['正方形有几条对称轴？', '4', ['2', '3'], '两条对角线和两条通过对边中点的直线，共4条。'],
        ['圆有多少条对称轴？', '无数条', ['1条', '2条'], '每一条直径所在的直线都是圆的对称轴。'],
        ['等边三角形有几条对称轴？', '3', ['1', '2'], '从每个顶点到对边中点的直线都是对称轴。'],
        [
          '非等边的等腰三角形有几条对称轴？',
          '1',
          ['2', '3'],
          '只有通过顶点和底边中点的直线是对称轴。',
        ],
        [
          '普通斜平行四边形（既不是矩形也不是菱形）有几条对称轴？',
          '0',
          ['1', '2'],
          '这种平行四边形不能沿任何直线折叠后完全重合。',
        ],
        [
          '沿直线对折后两边完全重合，说明图形具有什么特征？',
          '轴对称',
          ['只有平移', '一定是圆'],
          '两边完全重合，折痕所在直线是对称轴。',
        ],
        [
          `点A到对称轴距离${a}厘米，对应点B到对称轴距离多少厘米？`,
          String(a),
          [String(a + 1), String(2 * a)],
          '对应点到对称轴的距离相等。',
        ],
        [
          `两个对应点到对称轴的距离都是${a}厘米，它们之间的距离是多少厘米？`,
          String(2 * a),
          [String(a), String(a + 1)],
          `对应点在轴的两侧，距离相加，${a}＋${a}＝${2 * a}。`,
        ],
      ]
      const f = facts[index % 9]!
      return choice(
        f[0],
        f[1],
        f[2],
        f[3],
        index % 9 === 6 ? { kind: 'motion', mode: 'reflection' } : undefined,
      )
    }
    case 'translation': {
      const step = 1 + Math.floor(n / 3),
        left = mode === 1,
        col = left ? step + 1 + ((n + k) % 2) : 1 + ((n + k) % 4),
        answer = left ? col - step : col + step
      return numeric(
        `方格图中A在第${col}列，向${left ? '左' : '右'}平移${step}格后，会到第几列？`,
        answer,
        `向${left ? '左列数减少' : '右列数增加'}${step}，${col}${left ? '－' : '＋'}${step}＝${answer}。`,
        { kind: 'grid', columns: 9, rows: 4, marked: [[col, 2]], labels: true },
      )
    }
    case 'rotation':
    case 'motion':
    case 'transformations':
    case 'rotation-symmetry': {
      const directions = ['北', '东', '南', '西'],
        start = (n + k) % 4,
        turns = 1 + (n % 3),
        answer = directions[(start + turns) % 4]!
      return choice(
        `箭头原来朝${directions[start]}，顺时针旋转${turns * 90}°后朝哪个方向？`,
        answer,
        directions.filter((v) => v !== answer),
        `顺时针按北→东→南→西，每转90°前进一个方向，转${turns}个直角后朝${answer}。`,
        { kind: 'compass-turn', start, quarterTurns: turns },
      )
    }
    case 'tangram': {
      const facts: [string, string, string[], string][] = [
        ['标准七巧板里有几个三角形？', '5', ['4', '6'], '共有5个三角形。'],
        ['标准七巧板里有几个正方形？', '1', ['2', '3'], '只有1个正方形。'],
        ['标准七巧板里有几个平行四边形（不计正方形）？', '1', ['2', '3'], '只有1个斜平行四边形。'],
        [
          '标准七巧板一共分成几块？',
          '7',
          ['6', '8'],
          '5个三角形、1个正方形、1个平行四边形，共7块。',
        ],
        ['七巧板中最大的三角形有几块？', '2', ['1', '3'], '有两块大三角形。'],
        ['七巧板中最小的三角形有几块？', '2', ['1', '3'], '有两块小三角形。'],
        ['七巧板中中等大小的三角形有几块？', '1', ['2', '3'], '有一块中等大小的三角形。'],
        [
          '用七块拼出不同图案，不重叠、不缺块，总面积会变化吗？',
          '不会',
          ['变大', '变小'],
          '只是移动纸片，七块面积的和不变。',
        ],
        [
          '把七巧板收回原来的正方形，纸片之间应该怎样摆？',
          '不重叠、不留空隙',
          ['必须重叠', '可以随意留空隙'],
          '完整拼回时不重叠也不留空隙。',
        ],
      ]
      const f = facts[index % 9]!
      return choice(f[0], f[1], f[2], f[3], { kind: 'tangram' })
    }
    case 'sport':
    case 'campus':
    case 'review':
    case 'review-algebra':
    case 'review-first-half':
    case 'review-new-algebra':
    case 'review-old-algebra':
    case 'review-practice': {
      if (grade >= 5)
        return numeric(
          `一项活动共有${8 * a}人，其中3/8参加手工组，手工组有多少人？`,
          3 * a,
          `总人数×3/8＝${8 * a}×3/8＝${3 * a}。`,
        )
      if (grade === 4)
        return numeric(
          `长方形活动区长${a}米、宽${b}米，围一圈需要多少米绳子？`,
          2 * (a + b),
          `周长＝（长＋宽）×2＝${2 * (a + b)}米。`,
          { ...rect(a, b), unit: '米' },
        )
      return numeric(
        `每排${a}人，共有${b}排，合起来有多少人？`,
        a * b,
        `相同的${a}相加${b}次，用乘法${a}×${b}＝${a * b}。`,
      )
    }
    default:
      throw new Error(`未编写配套练习的数学专题：${topic}`)
  }
}
