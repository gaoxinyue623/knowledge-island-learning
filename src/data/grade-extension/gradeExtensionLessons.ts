export type GradeExtensionSubject = 'CHINESE' | 'MATH' | 'ENGLISH'

export interface GradeExtensionLesson {
  id: string
  subject: GradeExtensionSubject
  title: string
  objective: string
  body: string
  sourceType: '项目原创'
  contentVersion: 1
  teacherReviewStatus: '暂未教师校审'
}

const original = {
  sourceType: '项目原创' as const,
  contentVersion: 1 as const,
  teacherReviewStatus: '暂未教师校审' as const,
}

export const gradeExtensionLessons: readonly GradeExtensionLesson[] = [
  {
    ...original,
    id: 'g3-chinese-rainy-window', subject: 'CHINESE', title: '窗边的雨声',
    objective: '按事情发生的顺序提取短文信息，并用原文说明依据。',
    body: '放学时，雨点敲着窗。小安先把窗边的书移到桌里，再借来一把伞。她走到门口时，看见小乐没有伞，便和小乐一起走。到了小区门口，雨已经小了。',
  },
  {
    ...original,
    id: 'g3-chinese-library-note', subject: 'CHINESE', title: '图书角的纸条',
    objective: '从人物行动中判断原因，区分事实和自己的感受。',
    body: '午休前，图书角的《昆虫记》少了一本。值日生小川没有着急，他先查看借书卡，又在窗台找到一张纸条：“我拿去给生病的小宁读，下午还。”小川把纸条夹进借书卡，等小宁回来。',
  },
  {
    ...original,
    id: 'g3-chinese-seed-observation', subject: 'CHINESE', title: '种子观察日记',
    objective: '根据短文中的时间和现象整理信息，找到表达结论的依据。',
    body: '星期一，悦悦把三粒绿豆放在湿棉花上。星期三，她发现豆皮裂开了一点。星期五，三粒绿豆都长出了白色小根。她在日记里写：种子需要水，才能慢慢发芽。',
  },
  {
    ...original,
    id: 'g3-math-market-groups', subject: 'MATH', title: '水果摊分组',
    objective: '用乘法和除法解决等量分组问题，并检查单位和余数。',
    body: '水果摊把苹果按每袋6个装袋。上午装了4袋，下午把同样多的苹果平均装进3个篮子。先找总数，再想每个篮子里有多少个。',
  },
  {
    ...original,
    id: 'g3-math-garden-perimeter', subject: 'MATH', title: '菜园围栏',
    objective: '理解长方形周长，能在变化情境中说明计算方法。',
    body: '学校菜园是长方形，长8米，宽5米。大家要沿四周围一圈矮篱笆，篱笆从一个角开始，最后回到原来的角。',
  },
  {
    ...original,
    id: 'g3-math-sharing-cake', subject: 'MATH', title: '同一块蛋糕',
    objective: '在同一个整体内比较简单分数，并用“平均分成几份”解释。',
    body: '一块同样大的圆蛋糕平均分成8份。乐乐吃了其中2份，安安吃了其中3份。比较时，两人说的是同一块蛋糕、同样大小的每一份。',
  },
  {
    ...original,
    id: 'g3-english-my-bag', subject: 'ENGLISH', title: 'My School Bag',
    objective: '从日常英语短文中提取物品和位置的信息。',
    body: 'I am Ben. My blue pencil case is in my school bag. A red ruler is on the desk. My books are under the chair. I tidy them after class.',
  },
  {
    ...original,
    id: 'g3-english-at-the-park', subject: 'ENGLISH', title: 'At the Park',
    objective: '理解简单人物介绍和位置表达，依据原句选择答案。',
    body: 'Hello! I am Mia. I go to the park with my dad. My kite is behind the tree. Dad has a ball in his hand. We are happy on Sunday.',
  },
  {
    ...original,
    id: 'g3-english-class-helper', subject: 'ENGLISH', title: 'Class Helper',
    objective: '从英语短文中找出人物、物品和时间信息。',
    body: 'Tom is our class helper today. He puts the crayons in the box. The box is next to the door. At three o’clock, Tom gives the crayons to the art group.',
  },
]

export function gradeExtensionLessonById(id: string): GradeExtensionLesson | undefined {
  return gradeExtensionLessons.find((lesson) => lesson.id === id)
}
