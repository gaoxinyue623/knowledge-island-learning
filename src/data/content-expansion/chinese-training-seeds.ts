interface ReasoningTask {
  prompt: string
  answer: string
  distractors: string[]
  explanation: string
}

export interface ChineseTrainingSeed {
  title: string
  evidence: string
  reasoning: ReasoningTask
  transfer: ReasoningTask
}

// Original reading exercises. A seed is usable only when its evidence exists in the current text.
export const chineseTrainingSeeds: ChineseTrainingSeed[] = [
  {
    title: '春夏秋冬',
    evidence: '鱼出水，鸟入林',
    reasoning: {
      prompt: '把“鱼出水”改成“鱼入水”，哪个信息变了？',
      answer: '鱼运动的方向',
      distractors: ['鱼的数量', '鱼的颜色'],
      explanation: '“出”和“入”方向相反，换一个动作词，画面就不同了。',
    },
    transfer: {
      prompt: '小鸟从树林里飞向外面，哪个表达与这个新画面相符？',
      answer: '鸟出林',
      distractors: ['鸟入林', '鱼出水'],
      explanation: '先确定是谁，再看动作方向；新情境不能直接照抄“鸟入林”。',
    },
  },
  {
    title: '乌鸦喝水',
    evidence: '水渐渐升高',
    reasoning: {
      prompt: '石子放进瓶子后，为什么乌鸦能喝到原来喝不到的水？',
      answer: '石子占了一些空间，让水面逐渐升高',
      distractors: ['石子变成了水', '瓶口突然变大了'],
      explanation: '要把“放石子”“水面升高”“喝到水”连成因果关系。',
    },
    transfer: {
      prompt: '故事里若只在瓶子旁边摆石子，不放进去，能用同样的办法使水面升高吗？',
      answer: '不能，石子没有进入瓶子',
      distractors: ['能，只要石子在附近', '一定能，乌鸦更努力了'],
      explanation: '关键条件是石子进入瓶子。这里讨论故事，不要求自己做实验。',
    },
  },
  {
    title: '小马过河',
    evidence: '既不像老牛说的那样浅',
    reasoning: {
      prompt: '为什么老牛和松鼠对同一条河有不同感受？',
      answer: '它们身体大小不同，判断的角度不同',
      distractors: ['河水每听一句话就变深', '它们一定都在说谎'],
      explanation: '把动物自身的条件与它们说的话联系起来，不能只看结论。',
    },
    transfer: {
      prompt: '同一张桌子，有人觉得高，有人觉得矮。怎样理解比较合理？',
      answer: '他们身高可能不同，要结合各自情况',
      distractors: ['觉得高的人一定说错了', '桌子的高度不断改变'],
      explanation: '同一事物在不同条件下感受不同；不要把故事理解成可以独自涉水。',
    },
  },
  {
    title: '我不是最弱小的',
    evidence: '轻轻地遮在蔷薇花上',
    reasoning: {
      prompt: '萨沙后来为什么不再认为自己是最弱小的？',
      answer: '他发现自己也能保护更弱小的花',
      distractors: ['他突然比哥哥长得高', '妈妈给了他一件更大的雨衣'],
      explanation: '他的行动证明了自己有能力帮助别人，不是身体突然变大。',
    },
    transfer: {
      prompt: '小朋友力气小，看到桌边的小盆栽快被碰倒，怎样做更符合故事里的关爱？',
      answer: '提醒身边的大人，一起把盆栽放稳',
      distractors: ['说自己小，什么也不用管', '故意把盆栽推倒'],
      explanation: '选择力所能及且安全的帮助，不需要逞强。',
    },
  },
  {
    title: '一匹出色的马',
    evidence: '拾起一根又长又细的枝条',
    reasoning: {
      prompt: '题目中的“马”实际是什么？为什么能帮助妹妹？',
      answer: '一根枝条，想象成马让她有了走路的兴致',
      distractors: ['一匹真的马替她走路', '爸爸把她一路抱回家'],
      explanation: '联系物品和妹妹后来的变化，理解“马”的特别含义。',
    },
    transfer: {
      prompt: '收拾玩具时，小朋友把收纳盒想象成“玩具的家”，这和故事有什么相似之处？',
      answer: '用想象增加做事的兴趣',
      distractors: ['收纳盒真的变成房子', '可以不收拾玩具了'],
      explanation: '想象可以让一件事更有趣，但仍要自己完成行动。',
    },
  },
  {
    title: '千人糕',
    evidence: '很多很多人的劳动',
    reasoning: {
      prompt: '“千人糕”强调的是什么？',
      answer: '一块普通米糕背后有许多人的劳动',
      distractors: ['每块糕必须正好由一千人制作', '糕必须比桌子大'],
      explanation: '从种植、加工、运送等环节理解名字，而不是只看大小或字面数字。',
    },
    transfer: {
      prompt: '一件衣服从棉花到穿在身上，也要经历多个环节。哪种想法与课文相通？',
      answer: '珍惜物品，也珍惜许多人的劳动',
      distractors: ['衣服是商店自己长出来的', '只需感谢最后递给衣服的人'],
      explanation: '把“多个环节的合作”迁移到身边的物品。',
    },
  },
  {
    title: '寓言二则',
    evidence: '从此，他的羊再也没有丢过',
    reasoning: {
      prompt: '第二次丢羊后，哪项行动真正解决了继续丢羊的问题？',
      answer: '堵住窟窿，把羊圈修牢',
      distractors: ['只后悔，不行动', '每天多看羊一眼却不修羊圈'],
      explanation: '后悔之后采取改正行动，才消除了问题的原因。',
    },
    transfer: {
      prompt: '发现书包破洞，已经掉了一支笔。哪种做法最符合“亡羊补牢”？',
      answer: '及时请家人帮忙修好，避免继续掉东西',
      distractors: ['已经丢了就永远不用修', '只买更多笔，洞留着'],
      explanation: '出现问题后及时改正，仍然有用。',
    },
  },
  {
    title: '画杨桃',
    evidence: '看的角度不同',
    reasoning: {
      prompt: '老师为什么让同学们到“我”的座位上看杨桃？',
      answer: '让他们从同一角度观察，再作判断',
      distractors: ['只为了换座位', '要求所有人不看实物只凭记忆画'],
      explanation: '先核对观察条件，而不是因为与自己印象不同就嘲笑。',
    },
    transfer: {
      prompt: '你和朋友从不同方向看积木，描述不一样。下一步怎样做更合适？',
      answer: '交换位置观察，了解对方看到的样子',
      distractors: ['立刻说朋友胡说', '谁声音大就听谁'],
      explanation: '了解不同角度，靠观察和证据判断。',
    },
  },
  {
    title: '小猴子下山',
    evidence: '空着手回家',
    reasoning: {
      prompt: '小猴子明明得到过许多东西，为什么最后空手回家？',
      answer: '每次见到新的东西，就丢掉已有的去追逐',
      distractors: ['从来没遇到过食物', '所有东西都被别人偷走'],
      explanation: '把前后几次“扔了……去……”连起来看，才能理解结局。',
    },
    transfer: {
      prompt: '做手工时总是没做完就换新的，怎样改进更合适？',
      answer: '先确定一件事，认真完成后再换',
      distractors: ['准备更多材料不停更换', '每一步都做到一半就放弃'],
      explanation: '这道拓展题练习有计划地坚持，不是说永远不能改变计划。',
    },
  },
  {
    title: '青蛙卖泥塘',
    evidence: '自己住挺好的',
    reasoning: {
      prompt: '青蛙最后为什么改变了卖泥塘的决定？',
      answer: '他不断改善环境，泥塘已经变得适合自己住',
      distractors: ['牌子被风吹走了', '泥塘一直没有任何变化'],
      explanation: '联系种草、引水、栽树等行动与最后环境的变化。',
    },
    transfer: {
      prompt: '嫌阅读角杂乱，整理后发现舒服多了。这与课文有什么相似？',
      answer: '通过行动改善环境，也可能改变自己的想法',
      distractors: ['什么都不做环境也必定变好', '原来的问题永远不能解决'],
      explanation: '从问题出发采取行动，再重新观察结果。',
    },
  },
  {
    title: '大禹治水',
    evidence: '采用疏导的办法治水',
    reasoning: {
      prompt: '禹与鲧的方法最主要有什么不同？',
      answer: '禹疏通河道引水，鲧只筑坝挡水',
      distractors: ['禹完全不需要别人帮忙', '禹只是在原来的坝上涂颜色'],
      explanation: '比较“挡”与“疏导”，关注方法，而不只记人名。',
    },
    transfer: {
      prompt: '按传说的叙述，禹面对原来失败的办法，做了什么值得学习的事？',
      answer: '吸取教训，重新分析并改进办法',
      distractors: ['不管结果，只重复同样动作', '把问题留给别人就结束'],
      explanation: '这是阅读传说得出的思考方法，不是让孩子实践治水。',
    },
  },
  {
    title: '树和喜鹊',
    evidence: '树有了邻居，喜鹊也有了邻居',
    reasoning: {
      prompt: '课文从“孤单”写到“快乐”，关键变化是什么？',
      answer: '树和喜鹊有了邻居和伙伴',
      distractors: ['所有邻居都离开了', '它们得到了一台电视'],
      explanation: '联系开头与结尾，找到情感变化的原因。',
    },
    transfer: {
      prompt: '新同学课间独自坐着，哪种做法更能帮助他感受到伙伴的温暖？',
      answer: '友善邀请他一起玩，也尊重他的意愿',
      distractors: ['嘲笑他不说话', '强迫他马上参加所有游戏'],
      explanation: '把关心同伴用在生活里，同时尊重不同人的选择。',
    },
  },
]
