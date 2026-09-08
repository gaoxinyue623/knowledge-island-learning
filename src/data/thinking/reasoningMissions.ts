import { THINKING_SOURCE, type ThinkingMission, type ThinkingPuzzle } from '@/types/thinking'

type SwitchPuzzle = Extract<ThinkingPuzzle, { kind: 'switches' }>
function switches(
  id: string,
  title: string,
  initial: boolean[],
  target: boolean[],
  affects: number[][],
  maxMoves: number,
  hints: [string, string],
  explanation: string,
): SwitchPuzzle {
  return {
    id,
    kind: 'switches',
    title,
    initial,
    target,
    maxMoves,
    hints,
    explanation,
    prompt: `每个开关会让连着的灯反转：亮变暗，暗变亮。观察开关说明，在${maxMoves}次以内把当前灯光变成目标。可以重复按同一个开关。`,
    switches: affects.map((cells, i) => ({
      id: String(i),
      label: `开关${String.fromCharCode(65 + i)}`,
      affects: cells,
    })),
  }
}
const on = true,
  off = false
const introId = 'switch-discovery',
  advancedId = 'switch-planner',
  sudokuId = 'mini-sudoku'
export const reasoningMissions: ThinkingMission[] = [
  {
    id: introId,
    islandId: 'strategy',
    title: '联动灯光实验室',
    level: '入门',
    suggestedGrades: '建议一至三年级，可由家长读题',
    description: '按一个开关，多盏灯一起变。观察、预测，再动手验证。',
    sourceId: THINKING_SOURCE.id,
    version: 1,
    puzzles: [
      switches(
        `thinking:${introId}:1`,
        '一个开关影响谁',
        [off, off, off],
        [on, on, off],
        [
          [0, 1],
          [1, 2],
          [0, 2],
        ],
        1,
        ['先比较当前和目标，找出需要变化的灯。', '第3盏灯要保持暗，找一个不影响它的开关。'],
        'A只改变第1、2盏灯，正好留下第3盏灯不变。先比较差异，再选择动作。',
      ),
      switches(
        `thinking:${introId}:2`,
        '中间的灯亮两次吗',
        [off, off, off],
        [on, off, on],
        [
          [0, 1],
          [1, 2],
        ],
        2,
        ['第1盏灯和第3盏灯分别由哪个开关控制？', '同一盏灯反转两次，会回到原来的状态。'],
        'A和B各按一次，第2盏灯经历暗→亮→暗。两个动作都影响它，却互相抵消。',
      ),
      switches(
        `thinking:${introId}:3`,
        '从亮灯开始',
        [on, off, on, off],
        [off, on, on, on],
        [[0, 1], [1, 2], [3]],
        2,
        [
          '已经符合目标的第3盏灯尽量保持不变。',
          '先解决只有一个开关能控制的第4盏灯，再检查前两盏。',
        ],
        'A和C各按一次就能完成。亮灯也可以被关掉，不能只数有几盏灯亮。',
      ),
      switches(
        `thinking:${introId}:4`,
        '先想好两步',
        [off, off, off, off],
        [on, on, on, on],
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
        2,
        [
          '要让第1盏和第4盏亮起来，分别必须按哪个开关？',
          '把这两个开关的影响放在一起看，是否刚好覆盖四盏灯？',
        ],
        'A与C各按一次，分别控制前两盏和后两盏。用两步完成，不需要把每个开关都按一遍。',
      ),
    ],
  },
  {
    id: advancedId,
    islandId: 'strategy',
    title: '最少步数挑战',
    level: '挑战',
    suggestedGrades: '建议四至六年级',
    description: '从目标倒推，利用重复反转的抵消，寻找更省步骤的方案。',
    sourceId: THINKING_SOURCE.id,
    version: 1,
    puzzles: [
      switches(
        `thinking:${advancedId}:1`,
        '只留一盏灯',
        [off, off, off, off],
        [on, off, off, off],
        [
          [0, 1, 2],
          [1, 2],
          [2, 3],
        ],
        2,
        ['目标只让第1盏改变，但没有只控制它的开关。', '找两个开关，让不需要改变的灯恰好反转两次。'],
        'A、B共同控制第2、3盏，反转两次抵消，只留下第1盏亮起。',
      ),
      switches(
        `thinking:${advancedId}:2`,
        '五盏灯的连锁',
        [off, off, off, off, off],
        [on, off, off, off, on],
        [
          [0, 1],
          [1, 2, 3],
          [2, 3, 4],
          [1, 3],
        ],
        3,
        ['第1盏和第5盏分别只受一个开关影响。', '先考虑A、C，再寻找能修复中间三盏的开关。'],
        'A、B、C各一次，两端反转一次，中间三盏各反转两次。先抓住只能由一个开关改变的灯。',
      ),
      switches(
        `thinking:${advancedId}:3`,
        '混合起点也能倒推',
        [on, off, on, off, on],
        [on, on, on, on, off],
        [
          [0, 1, 2],
          [1, 3],
          [2, 4],
          [0, 3],
        ],
        3,
        ['先把需要反转的位置记下来：2、4、5。', '第5盏需要C；它改变的第3盏还需要另一个开关恢复。'],
        'A、C、D各一次可达目标。先比较起点与目标，再追踪每盏灯反转的次数。',
      ),
      switches(
        `thinking:${advancedId}:4`,
        '六灯终极规划',
        [off, off, off, off, off, off],
        [on, off, off, off, off, on],
        [
          [0, 1],
          [1, 2],
          [2, 3, 4],
          [3, 4, 5],
          [1, 3],
        ],
        4,
        ['从最两端开始，哪些开关一定要用？', '从第1盏沿着相邻的灯往后推，让中间的灯各反转两次。'],
        'A、B、C、D各一次，只留下两端亮起。E会打乱抵消，不是开关越多越好。',
      ),
    ],
  },
  {
    id: sudokuId,
    islandId: 'logic',
    title: '四宫数独侦探',
    level: '进阶',
    suggestedGrades: '建议二至六年级，从多线索逐步到少线索',
    description: '每行、每列、每个小宫都不能重复，用排除法填满数字。',
    sourceId: THINKING_SOURCE.id,
    version: 1,
    puzzles: [
      {
        id: `thinking:${sudokuId}:1`,
        kind: 'sudoku',
        title: '先找缺少的数字',
        prompt:
          '把1、2、3、4填进空格。每一行、每一列、每个粗线围成的2×2小宫里，这四个数字都只能出现一次。深色数字是固定线索。',
        givens: [4, 0, 3, 0, 0, 1, 2, 4, 2, 0, 0, 0, 0, 3, 4, 0],
        hints: [
          '先找数字最多的一行、一列或一个小宫，想想还缺哪些数字。',
          '选一个空格，把同行、同列、同小宫已有的数字都排除；若还剩多种可能，先去找别的确定空格。',
        ],
        explanation:
          '你让每行、每列、每个小宫都集齐了1、2、3、4。把行、列和小宫的线索合起来，就能逐步排除不可能的数字。',
      },
      {
        id: `thinking:${sudokuId}:2`,
        kind: 'sudoku',
        title: '行列交叉排除',
        prompt:
          '把1、2、3、4填进空格。每一行、每一列、每个粗线围成的2×2小宫里，这四个数字都只能出现一次。深色数字是固定线索。',
        givens: [2, 0, 0, 0, 3, 4, 0, 0, 0, 2, 1, 0, 1, 0, 4, 0],
        hints: [
          '先找数字最多的一行、一列或一个小宫，想想还缺哪些数字。',
          '选一个空格，把同行、同列、同小宫已有的数字都排除；若还剩多种可能，先去找别的确定空格。',
        ],
        explanation:
          '你让每行、每列、每个小宫都集齐了1、2、3、4。把行、列和小宫的线索合起来，就能逐步排除不可能的数字。',
      },
      {
        id: `thinking:${sudokuId}:3`,
        kind: 'sudoku',
        title: '小宫也有线索',
        prompt:
          '把1、2、3、4填进空格。每一行、每一列、每个粗线围成的2×2小宫里，这四个数字都只能出现一次。深色数字是固定线索。',
        givens: [0, 0, 4, 0, 0, 4, 0, 0, 3, 2, 0, 0, 0, 0, 3, 2],
        hints: [
          '先找数字最多的一行、一列或一个小宫，想想还缺哪些数字。',
          '选一个空格，把同行、同列、同小宫已有的数字都排除；若还剩多种可能，先去找别的确定空格。',
        ],
        explanation:
          '你让每行、每列、每个小宫都集齐了1、2、3、4。把行、列和小宫的线索合起来，就能逐步排除不可能的数字。',
      },
      {
        id: `thinking:${sudokuId}:4`,
        kind: 'sudoku',
        title: '少一点线索，多一步推理',
        prompt:
          '把1、2、3、4填进空格。每一行、每一列、每个粗线围成的2×2小宫里，这四个数字都只能出现一次。深色数字是固定线索。',
        givens: [0, 0, 0, 0, 2, 3, 0, 0, 0, 0, 0, 2, 0, 0, 3, 4],
        hints: [
          '先找数字最多的一行、一列或一个小宫，想想还缺哪些数字。',
          '选一个空格，把同行、同列、同小宫已有的数字都排除；若还剩多种可能，先去找别的确定空格。',
        ],
        explanation:
          '你让每行、每列、每个小宫都集齐了1、2、3、4。把行、列和小宫的线索合起来，就能逐步排除不可能的数字。',
      },
    ],
  },
]
