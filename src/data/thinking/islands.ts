import type {
  ThinkingIsland,
  ThinkingMission,
  ThinkingPuzzle,
  ThinkingToken,
} from '@/types/thinking'
import { reasoningMissions } from './reasoningMissions'
import { THINKING_SOURCE } from '@/types/thinking'

export const thinkingIslands: ThinkingIsland[] = [
  {
    id: 'patterns',
    title: '规律发现岛',
    subtitle: '给变化找一个小秘密',
    description: '从颜色、形状和数字里发现重复与变化，把规则说清楚。',
    color: '#486f56',
    softColor: '#e8f2df',
    skill: '观察 · 归纳 · 检验',
  },
  {
    id: 'logic',
    title: '逻辑侦探岛',
    subtitle: '每条线索都有用',
    description: '给线索配对、排除不可能，试着区分“知道”与“猜到”。',
    color: '#725b86',
    softColor: '#f0e9f7',
    skill: '分类 · 推理 · 判断',
  },
  {
    id: 'space',
    title: '空间想象岛',
    subtitle: '换个方向看世界',
    description: '转一转、照镜子、走方格，想好路线再出发。',
    color: '#366e85',
    softColor: '#e2f1f5',
    skill: '方向 · 镜像 · 路线',
  },
  {
    id: 'strategy',
    title: '策略工坊岛',
    subtitle: '先想一想，再动手',
    description: '预测联动灯光、挑战更少步数、组合材料，在多条规则下找到可行方案。',
    color: '#92603f',
    softColor: '#fbecd7',
    skill: '规划 · 组合 · 解决问题',
  },
]

const t = (
  label: string,
  shape?: ThinkingToken['shape'],
  color?: ThinkingToken['color'],
): ThinkingToken => ({ label, shape, color })
const circle = t('绿圆', 'circle', 'mint'),
  triangle = t('黄三角', 'triangle', 'gold'),
  square = t('蓝方块', 'square', 'blue')
const diamond = t('红菱形', 'diamond', 'coral'),
  blank = t('？')
const cards = (labels: string[]) => labels.map((label, i) => ({ id: String(i), label }))
type PuzzleInput = ThinkingPuzzle extends infer P
  ? P extends ThinkingPuzzle
    ? Omit<P, 'id'>
    : never
  : never
const pick = (
  title: string,
  prompt: string,
  options: string[],
  correct: number[],
  explanation: string,
  tokens?: ThinkingToken[],
  optionTokens?: ThinkingToken[][],
): PuzzleInput => ({
  kind: 'pick',
  title,
  prompt,
  options: cards(options).map((card, i) => ({ ...card, tokens: optionTokens?.[i] })),
  correctIds: correct.map(String),
  explanation,
  tokens,
  hints: [
    '把已经知道的条件逐条读一遍，先别急着选。',
    '把候选答案放回题目，检查能否同时符合每条规则。',
  ],
})
const order = (
  title: string,
  prompt: string,
  labels: string[],
  before: [number, number][],
  explanation: string,
): PuzzleInput => ({
  kind: 'order',
  title,
  prompt,
  cards: cards(labels),
  before: before.map(([a, b]) => [String(a), String(b)]),
  explanation,
  hints: [
    '先找必须最先做、或者必须等另一件事完成后才能做的任务。',
    '先安排有先后要求的两张卡；没有规定先后的卡片可以交换。',
  ],
})
const assign = (
  title: string,
  people: string[],
  items: string[],
  clues: [number, 'is' | 'is-not', number][],
  explanation: string,
): PuzzleInput => ({
  kind: 'assign',
  title,
  prompt: '每位伙伴只选一个，每个选项也只属于一位伙伴。根据线索完成配对。',
  people: cards(people),
  items: cards(items),
  clues: clues.map(([p, relation, i]) => ({ personId: String(p), relation, itemId: String(i) })),
  explanation,
  hints: [
    '先用明确的线索，或找已经排除两个选项的伙伴。',
    '确定一对后，其他伙伴不能再用同一个选项。继续排除，最后检查所有线索。',
  ],
})
const path = (
  title: string,
  rows: number,
  columns: number,
  start: number,
  goal: number,
  blocked: number[],
  via: number[],
  maxSteps: number,
): PuzzleInput => ({
  kind: 'path',
  title,
  prompt: `每次只能走到上下左右相邻的格子，不能穿过石头。${via.length ? '经过所有补给站，最后停在终点。' : '从团子的位置走到终点。'}最多走${maxSteps}步。`,
  rows,
  columns,
  start,
  goal,
  blocked,
  via,
  maxSteps,
  hints: [
    '先看起点、终点、石头和补给站的位置，在心里试着走一遍。',
    '遇到石头要绕开；先规划经过补给站的路线。可以撤一步重新试。',
  ],
  explanation:
    '路线要同时满足相邻移动、避开石头、经过补给站和步数限制。符合规则的不同路线都可以通过。',
})
const pack = (title: string, target: number, costs: number[], count?: number): PuzzleInput => ({
  kind: 'pack',
  title,
  prompt: `选择材料，让总长度正好是${target}格。每张卡最多用一次。${count ? `必须恰好用${count}张。` : '张数不限。'}`,
  target,
  count,
  items: costs.map((cost, i) => ({
    id: String(i),
    label: `材料${String.fromCharCode(65 + i)}`,
    cost,
  })),
  hints: [
    '先选一张，想想离目标还差多少；可以取消已选卡片。',
    count
      ? '总长度和材料张数要同时满足。若凑满了却张数不对，试着换一种组合。'
      : '把目标拆成几部分，再看看手里有没有这些长度的材料。',
  ],
  explanation:
    '相加正好达到目标，并满足卡片使用规则就通过。这里可能有多种组合，不要求与某个示例完全相同。',
})
function mission(
  islandId: string,
  id: string,
  title: string,
  level: ThinkingMission['level'],
  description: string,
  puzzles: PuzzleInput[],
): ThinkingMission {
  return {
    islandId,
    id,
    title,
    level,
    description,
    sourceId: THINKING_SOURCE.id,
    version: 1,
    puzzles: puzzles.map((p, i) => ({ ...p, id: `thinking:${id}:${i + 1}` })),
  }
}

export const thinkingMissions: ThinkingMission[] = [
  mission(
    'patterns',
    'pattern-train',
    '图形接力站',
    '入门',
    '看清一小组怎样重复，再把接力队补完整。',
    [
      pick(
        '找重复的一组',
        '图形按同一组重复。问号处应该放什么？',
        ['黄三角', '绿圆', '蓝方块'],
        [1],
        '每组是“绿圆、黄三角”，下一组又从绿圆开始。',
        [circle, triangle, circle, triangle, blank],
        [[triangle], [circle], [square]],
      ),
      pick(
        '三位好朋友',
        '这一队每三张重复一次。空位是谁？',
        ['绿圆', '黄三角', '蓝方块'],
        [2],
        '重复组是绿圆、黄三角、蓝方块。',
        [circle, triangle, square, circle, triangle, blank],
        [[circle], [triangle], [square]],
      ),
      pick(
        '缺的是中间',
        '规则是“两个绿圆、一个黄三角”反复出现。补上空位。',
        ['黄三角', '蓝方块', '绿圆'],
        [2],
        '空位是第二组的第二个绿圆。',
        [circle, circle, triangle, circle, blank, triangle],
        [[triangle], [square], [circle]],
      ),
      pick(
        '规则不怕变长',
        '哪两队都按“一张圆、一张三角”交替？选出所有符合的队伍。',
        ['圆、三角、圆、三角', '圆、圆、三角、三角', '三角、圆、三角、圆', '圆、三角、三角、圆'],
        [0, 2],
        '交替要求相邻不同；可以从圆或三角开始。',
      ),
    ],
  ),
  mission(
    'patterns',
    'number-stairs',
    '数字阶梯',
    '进阶',
    '从变化的步长出发，发现藏在数列里的规则。',
    [
      pick(
        '同样的步长',
        '数字每次增加同样多。2、4、6之后接什么？',
        ['7', '8', '10'],
        [1],
        '每次加2，所以6后面是8。',
        [t('2'), t('4'), t('6'), blank],
      ),
      pick(
        '往回数',
        '从14开始，每次减少3。14、11、8之后是？',
        ['6', '4', '5'],
        [2],
        '8减3是5。不要继续使用上一题的加法规则。',
        [t('14'), t('11'), t('8'), blank],
      ),
      pick(
        '两条队伍交织',
        '单数位置是1、2、3；双数位置是4、5、6。缺少哪个数？',
        ['4', '6', '7'],
        [1],
        '把位置分成两队，最后一个是双数位置的6。',
        [t('1'), t('4'), t('2'), t('5'), t('3'), blank],
      ),
      pick(
        '找出换错的卡',
        '队伍应每次加3：3、6、10、12。哪张卡要改，改成什么？',
        ['10改成9', '6改成7', '12改成13'],
        [0],
        '3、6、9、12每次都增加3，要检查每一步。',
      ),
    ],
  ),
  mission(
    'patterns',
    'rule-lab',
    '双线索实验室',
    '挑战',
    '同时观察两个特征，检查规则有没有漏掉。',
    [
      pick(
        '两个条件一起看',
        '形状圆、方交替，颜色绿、黄交替。绿圆、黄方、绿圆之后是什么？',
        ['绿方', '黄圆', '黄方'],
        [2],
        '下一张既要是方形，又要是黄色。',
        [circle, t('黄方', 'square', 'gold'), circle, blank],
        [
          [t('绿方', 'square', 'mint')],
          [t('黄圆', 'circle', 'gold')],
          [t('黄方', 'square', 'gold')],
        ],
      ),
      pick(
        '方向在转弯',
        '箭头每次顺时针转四分之一圈。上、右、下之后是什么？',
        ['上', '左', '右'],
        [1],
        '上→右→下→左，再回到上。',
        [t('上', 'up'), t('右', 'right'), t('下', 'down'), blank],
        [[t('上', 'up')], [t('左', 'left')], [t('右', 'right')]],
      ),
      pick(
        '整组搬家',
        '每组是“蓝方、绿圆、红菱形”，完整重复两组。下一组前两张是什么？',
        ['绿圆、蓝方', '蓝方、绿圆', '红菱形、蓝方'],
        [1],
        '每组开头不变，仍是蓝方、绿圆。',
        [square, circle, diamond, square, circle, diamond, blank],
      ),
      pick(
        '不能只猜一个',
        '只看到2、4两个数，没有规定规则。下面哪种说法合理？',
        ['下一个一定是6', '下一个一定是8', '可能加2，也可能乘2，要补充线索'],
        [2],
        '有限的数字可能符合不同规则。先确定规则，再给结论。',
      ),
    ],
  ),
  ...reasoningMissions,
  mission('logic', 'clue-houses', '小屋分配员', '入门', '先找确定的一对，再把剩下的可能性排除。', [
    assign(
      '谁住哪间屋',
      ['小青', '小蓝', '小红'],
      ['圆顶屋', '方顶屋', '尖顶屋'],
      [
        [0, 'is', 1],
        [1, 'is-not', 1],
        [1, 'is-not', 2],
      ],
      '小青住方顶屋，小蓝排除方顶和尖顶后住圆顶屋，小红住尖顶屋。',
    ),
    assign(
      '点心小线索',
      ['团子', '兔兔', '小熊'],
      ['苹果', '梨', '桃'],
      [
        [0, 'is-not', 0],
        [0, 'is-not', 1],
        [1, 'is', 0],
      ],
      '团子选桃，兔兔选苹果，剩下的梨属于小熊。',
    ),
    pick(
      '知道的与猜到的',
      '盒子里只有红球或蓝球。已经确定不是红球，可以得到什么结论？',
      ['一定是蓝球', '可能是绿球', '还一定有一个红球'],
      [0],
      '在只有两个可能的条件下，排除一个就留下另一个。',
    ),
    pick(
      '别多加一条线索',
      '小青说：“我今天带了书。”仅凭这句话，哪项一定成立？',
      ['她带的是故事书', '她带了至少一本书', '她只带了一本书'],
      [1],
      '原话没有说明书的类别和确切数量。',
    ),
  ]),
  mission(
    'logic',
    'queue-detective',
    '排队小侦探',
    '进阶',
    '把“在前面”连起来，不替题目增加没说过的条件。',
    [
      order(
        '谁先到桥边',
        '小兔在小熊前面，小熊在团子前面。按从前往后排列。',
        ['团子', '小熊', '小兔'],
        [
          [2, 1],
          [1, 0],
        ],
        '由两条线索连接成“小兔、小熊、团子”。',
      ),
      order(
        '四张位置卡',
        '从左到右：红在蓝左边，蓝在绿左边，绿在黄左边。',
        ['黄卡', '绿卡', '红卡', '蓝卡'],
        [
          [2, 3],
          [3, 1],
          [1, 0],
        ],
        '把三条左右关系连起来：红、蓝、绿、黄。',
      ),
      pick(
        '先后不能倒过来',
        '已知小青在小蓝前面，小蓝在小红前面。哪项一定成立？',
        ['小红在小青前面', '小青在小红前面', '小蓝排在最后'],
        [1],
        '把两条先后关系连接起来即可。',
      ),
      order(
        '不止一种排法',
        '小熊必须排在团子前面，小兔也必须排在团子前面。小熊和小兔之间没有顺序要求。',
        ['团子', '小兔', '小熊'],
        [
          [1, 0],
          [2, 0],
        ],
        '小兔和小熊谁先都可以，团子在他们后面即可。',
      ),
    ],
  ),
  mission(
    'logic',
    'combined-clues',
    '线索合并室',
    '挑战',
    '同时满足多条线索，寻找唯一配对，也学会识别信息不足。',
    [
      assign(
        '没有直接答案',
        ['小青', '小蓝', '小红'],
        ['书', '积木', '拼图'],
        [
          [0, 'is-not', 0],
          [0, 'is-not', 1],
          [1, 'is-not', 0],
        ],
        '小青只能选拼图；小蓝不能选书，也不能再选拼图，所以选积木；小红选书。',
      ),
      assign(
        '三把钥匙',
        ['兔兔', '小熊', '团子'],
        ['圆钥匙', '方钥匙', '三角钥匙'],
        [
          [1, 'is-not', 0],
          [1, 'is-not', 2],
          [2, 'is-not', 2],
        ],
        '小熊拿方钥匙，团子排除三角和已用的方钥匙后拿圆钥匙，兔兔拿三角钥匙。',
      ),
      pick(
        '真的能确定吗',
        '三人各住红、蓝、绿一间屋，只知道小青不住红屋。能确定小青住哪间吗？',
        ['能，一定是蓝屋', '能，一定是绿屋', '不能，蓝屋和绿屋都还可能'],
        [2],
        '排除一项后仍有两个可能，需要其他线索。',
      ),
      pick(
        '条件要一起成立',
        '挑选一张“是蓝色，而且不是圆形”的卡。哪些符合？',
        ['蓝方形', '蓝圆形', '绿三角形', '蓝三角形'],
        [0, 3],
        '“而且”表示两个条件都要符合，不能只检查颜色。',
        undefined,
        [
          [square],
          [t('蓝圆', 'circle', 'blue')],
          [t('绿三角', 'triangle', 'mint')],
          [t('蓝三角', 'triangle', 'blue')],
        ],
      ),
    ],
  ),
  mission(
    'space',
    'direction-guide',
    '方向小向导',
    '入门',
    '固定从屏幕上方看地图，用方向按钮一步一步走。',
    [
      path('直角小路', 3, 3, 6, 2, [], [], 4),
      path('避开第一块石头', 3, 3, 6, 2, [4], [], 4),
      path('顺路取补给', 3, 3, 6, 2, [4], [0], 4),
      path('换个起点', 3, 3, 0, 8, [1, 4], [6], 4),
    ],
  ),
  mission(
    'space',
    'mirror-workshop',
    '镜像工作室',
    '进阶',
    '留意左右位置和朝向，区分移动、转动与镜像。',
    [
      pick(
        '左右照镜子',
        '一排是“圆、三角、方”。左右镜像后，从左到右是哪一排？',
        ['圆、方、三角', '方、三角、圆', '三角、圆、方'],
        [1],
        '左右镜像让左右顺序反过来，中间仍在中间。',
        [circle, triangle, square],
        [
          [circle, square, triangle],
          [square, triangle, circle],
          [triangle, circle, square],
        ],
      ),
      pick(
        '箭头照镜子',
        '向右的箭头做左右镜像，会朝哪边？',
        ['右', '上', '左'],
        [2],
        '左右交换，所以向右变为向左。',
        [t('原来朝右', 'right')],
        [[t('右', 'right')], [t('上', 'up')], [t('左', 'left')]],
      ),
      pick(
        '不是每次都变方向',
        '向上的箭头做左右镜像，会朝哪边？',
        ['上', '下', '右'],
        [0],
        '只交换左右，上下不交换。',
        [t('原来朝上', 'up')],
        [[t('上', 'up')], [t('下', 'down')], [t('右', 'right')]],
      ),
      pick(
        '平移与旋转',
        '向上的箭头先向右平移，再顺时针转四分之一圈，最后朝哪里？',
        ['上', '左', '右'],
        [2],
        '平移不改变朝向；顺时针转四分之一圈后朝右。',
        [t('原来朝上', 'up')],
        [[t('上', 'up')], [t('左', 'left')], [t('右', 'right')]],
      ),
    ],
  ),
  mission(
    'space',
    'detour-engineer',
    '绕路工程师',
    '挑战',
    '补给、障碍和步数一起考虑，多种合规路线都能通关。',
    [
      path('石墙两侧', 4, 4, 12, 3, [5, 9], [0], 6),
      path('先取两份补给', 4, 4, 12, 3, [5, 6], [8, 10], 8),
      path('别漏掉角落', 4, 4, 0, 15, [5, 9], [3, 12], 12),
      path('回头不一定多余', 4, 4, 12, 3, [5, 6, 9], [0, 15], 12),
    ],
  ),
  mission(
    'strategy',
    'planning-team',
    '整理小队',
    '入门',
    '先找事情之间的依赖，有些步骤可以交换先后。',
    [
      order(
        '播种计划',
        '必须先装土，再放种子，最后浇适量的水。',
        ['浇适量的水', '装土', '放种子'],
        [
          [1, 2],
          [2, 0],
        ],
        '先准备土，再放种子，最后浇水。',
      ),
      order(
        '出发前的小检查',
        '读清单后才能装水壶、装画本；两样都装好后再检查书包。装水壶与装画本谁先都可以。',
        ['检查书包', '装画本', '读清单', '装水壶'],
        [
          [2, 1],
          [2, 3],
          [1, 0],
          [3, 0],
        ],
        '先读清单，中间两步可交换，最后检查。',
      ),
      order(
        '材料先准备',
        '先领纸，再折纸；先折纸，最后把作品贴好。',
        ['贴好作品', '领纸', '折纸'],
        [
          [1, 2],
          [2, 0],
        ],
        '先后关系来自任务规则，不是卡片摆放的顺序。',
      ),
      pack('补齐六格桥', 6, [1, 2, 3, 4], 2),
    ],
  ),
  mission(
    'strategy',
    'packing-studio',
    '背包配装师',
    '进阶',
    '总量要刚刚好，有时还要同时限制材料张数。',
    [
      pack('八格小桥', 8, [1, 2, 3, 5, 6]),
      pack('两张卡的办法', 8, [1, 2, 3, 5, 6], 2),
      pack('三张卡的办法', 10, [1, 2, 3, 4, 6], 3),
      pack('换一种组合', 12, [2, 3, 4, 5, 7], 3),
    ],
  ),
  mission(
    'strategy',
    'plan-and-check',
    '先想再行动',
    '挑战',
    '先制定方案，再检查有没有遗漏条件。',
    [
      order(
        '小展览开场',
        '先确定主题，再准备画作和标题；两样都准备好才能布置展板，最后邀请伙伴参观。',
        ['邀请伙伴', '准备标题', '确定主题', '布置展板', '准备画作'],
        [
          [2, 1],
          [2, 4],
          [1, 3],
          [4, 3],
          [3, 0],
        ],
        '画作与标题的准备可以交换，但布置展板必须等两者都完成。',
      ),
      pack('双条件桥梁', 14, [2, 3, 4, 5, 6, 8], 3),
      path('计划中的一站', 4, 4, 12, 3, [5, 6, 9], [14], 6),
      pick(
        '怎么检查方案',
        '已经找到一个办法，提交前哪些检查有用？',
        [
          '逐条核对题目条件',
          '只看自己最喜欢的那一步',
          '代回情境看看能否完成任务',
          '忽略不方便满足的条件',
        ],
        [0, 2],
        '可行方案要符合所有要求，不是只满足其中一条。',
      ),
    ],
  ),
]

export const findThinkingIsland = (id: string) => thinkingIslands.find((island) => island.id === id)
export const findThinkingMission = (islandId: string, missionId: string) =>
  thinkingMissions.find((mission) => mission.islandId === islandId && mission.id === missionId)
