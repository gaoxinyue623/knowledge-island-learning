import { gradeExtensionLessonById, type GradeExtensionLesson } from '@/data/grade-extension/gradeExtensionLessons'
import type { Question } from '@/types'
import type { QuestQuestionStage, ReadingPracticeQuest } from '@/types/reading-quest'

type QuestionSpec =
  | { type: 'calc'; prompt: string; answer: number; explanation: string; hint: string }
  | { type: 'choice'; prompt: string; answer: string; options: string[]; explanation: string; hint: string }

function variantIndex(value: number | undefined): 0 | 1 {
  return Number(value) === 1 ? 1 : 0
}

function languageSpecs(lesson: GradeExtensionLesson, variant: 0 | 1): QuestionSpec[] {
  const library = lesson.id === 'g3-chinese-library-note'
  const seeds = lesson.id === 'g3-chinese-seed-observation'
  const english = lesson.subject === 'ENGLISH'
  if (english) {
    const bank: Record<string, [QuestionSpec[], QuestionSpec[]]> = {
      'g3-english-my-bag': [[
        { type: 'choice', prompt: 'Where is the blue pencil case?', answer: 'In the school bag.', options: ['In the school bag.', 'On the desk.', 'Under the chair.'], explanation: 'The text says “My blue pencil case is in my school bag.”', hint: 'Find “pencil case” in the passage.' },
        { type: 'choice', prompt: 'What is on the desk?', answer: 'A red ruler.', options: ['A red ruler.', 'A blue bag.', 'Some books.'], explanation: 'The text says “A red ruler is on the desk.”', hint: 'Look for the word “desk”.' },
        { type: 'choice', prompt: 'When does Ben tidy his things?', answer: 'After class.', options: ['After class.', 'Before school.', 'On Sunday.'], explanation: 'The last sentence says “I tidy them after class.”', hint: 'Read the last sentence.' },
      ], [
        { type: 'choice', prompt: 'Where are Ben’s books?', answer: 'Under the chair.', options: ['Under the chair.', 'In the bag.', 'Behind the tree.'], explanation: 'The passage says “My books are under the chair.”', hint: 'Find “books”.' },
        { type: 'choice', prompt: 'Which colour is the ruler?', answer: 'Red.', options: ['Red.', 'Blue.', 'Green.'], explanation: 'The ruler is described as “A red ruler”.', hint: 'Read the ruler sentence.' },
        { type: 'choice', prompt: 'Who is speaking in the passage?', answer: 'Ben.', options: ['Ben.', 'Mia.', 'Tom.'], explanation: 'The first sentence is “I am Ben.”', hint: 'Look at the first sentence.' },
      ]],
      'g3-english-at-the-park': [[
        { type: 'choice', prompt: 'Who goes to the park with Mia?', answer: 'Her dad.', options: ['Her dad.', 'Her teacher.', 'Her brother.'], explanation: 'Mia says “I go to the park with my dad.”', hint: 'Find “with”.' },
        { type: 'choice', prompt: 'Where is Mia’s kite?', answer: 'Behind the tree.', options: ['Behind the tree.', 'In the box.', 'On the desk.'], explanation: 'The passage says “My kite is behind the tree.”', hint: 'Find “kite”.' },
        { type: 'choice', prompt: 'When are they happy?', answer: 'On Sunday.', options: ['On Sunday.', 'At three o’clock.', 'After class.'], explanation: 'The text ends with “We are happy on Sunday.”', hint: 'Read the last sentence.' },
      ], [
        { type: 'choice', prompt: 'What does Dad have?', answer: 'A ball.', options: ['A ball.', 'A kite.', 'A ruler.'], explanation: 'The text says “Dad has a ball in his hand.”', hint: 'Find “Dad”.' },
        { type: 'choice', prompt: 'Who is Mia with?', answer: 'Her dad.', options: ['Her dad.', 'Tom.', 'Ben.'], explanation: 'Mia goes to the park with her dad.', hint: 'Use the first two sentences.' },
        { type: 'choice', prompt: 'Which word tells the kite’s place?', answer: 'Behind.', options: ['Behind.', 'Under.', 'Next to.'], explanation: 'The kite is “behind the tree.”', hint: 'Read the kite sentence.' },
      ]],
      'g3-english-class-helper': [[
        { type: 'choice', prompt: 'Who is the class helper today?', answer: 'Tom.', options: ['Tom.', 'Mia.', 'Ben.'], explanation: 'The first sentence says Tom is the class helper today.', hint: 'Read the first sentence.' },
        { type: 'choice', prompt: 'Where is the box?', answer: 'Next to the door.', options: ['Next to the door.', 'Under the chair.', 'Behind the tree.'], explanation: 'The text says “The box is next to the door.”', hint: 'Find “box”.' },
        { type: 'choice', prompt: 'When does Tom give the crayons?', answer: 'At three o’clock.', options: ['At three o’clock.', 'On Sunday.', 'After class.'], explanation: 'The last sentence gives the time: “At three o’clock”.', hint: 'Read the last sentence.' },
      ], [
        { type: 'choice', prompt: 'What does Tom put in the box?', answer: 'The crayons.', options: ['The crayons.', 'The books.', 'The ball.'], explanation: 'Tom puts the crayons in the box.', hint: 'Find “puts”.' },
        { type: 'choice', prompt: 'Who gets the crayons?', answer: 'The art group.', options: ['The art group.', 'His dad.', 'The class helper.'], explanation: 'Tom gives the crayons to the art group.', hint: 'Find “gives”.' },
        { type: 'choice', prompt: 'Which word means “在……旁边”?', answer: 'Next to.', options: ['Next to.', 'Behind.', 'Under.'], explanation: 'The box is “next to the door”.', hint: 'Look at the box sentence.' },
      ]],
    }
    return bank[lesson.id]![variant]
  }
  if (library && variant === 0) return [
    { type: 'choice', prompt: '小川先做了什么？', answer: '查看借书卡', options: ['查看借书卡', '责怪小宁', '把书放回书架'], explanation: '短文写“小川没有着急，他先查看借书卡”。', hint: '注意“先”后面的行动。' },
    { type: 'choice', prompt: '纸条说，拿书是为了读给谁听？', answer: '小宁', options: ['小宁', '小川', '值日老师'], explanation: '纸条写“我拿去给生病的小宁读”，没有说明拿书人的姓名。', hint: '在纸条里找“给……读”。' },
    { type: 'choice', prompt: '小川为什么把纸条夹进借书卡？', answer: '纸条说明书下午会归还', options: ['纸条说明书下午会归还', '纸条很好看', '他想忘记这件事'], explanation: '纸条给出了拿书原因和“下午还”的信息。', hint: '看纸条最后两个字前的时间。' },
  ]
  if (library) return [
    { type: 'choice', prompt: '谁写了“下午还”的纸条？', answer: '拿书给小宁读的人', options: ['拿书给小宁读的人', '小川', '老师'], explanation: '纸条中的“我”说明拿书的人会在下午归还。', hint: '把纸条的“我”和拿书原因连起来。' },
    { type: 'choice', prompt: '小川没有马上找人责怪，说明他先怎样做？', answer: '依据借书卡和纸条核对信息', options: ['依据借书卡和纸条核对信息', '不关心图书', '已经找到新书'], explanation: '他先查看借书卡，又找到纸条，是在核对信息。', hint: '看小川连续做的两件事。' },
    { type: 'choice', prompt: '纸条明确提到小宁的什么情况？', answer: '小宁生病了', options: ['小宁生病了', '小宁把书藏起来了', '小宁写了纸条'], explanation: '纸条只说明小宁生病了，没有说小宁写了纸条或自己拿书。', hint: '找“小宁”前面的描述，不添加短文没有说的信息。' },
  ]
  if (seeds && variant === 0) return [
    { type: 'choice', prompt: '豆皮裂开一点是在什么时候？', answer: '星期三', options: ['星期一', '星期三', '星期五'], explanation: '日记写“星期三，她发现豆皮裂开了一点”。', hint: '按日记的日期找。' },
    { type: 'choice', prompt: '星期五观察到什么？', answer: '三粒绿豆都长出白色小根', options: ['三粒绿豆都长出白色小根', '绿豆变成花', '棉花变干'], explanation: '星期五的记录明确写出三粒绿豆都长出白色小根。', hint: '读星期五这一句。' },
    { type: 'choice', prompt: '悦悦的结论依据是什么？', answer: '绿豆放在湿棉花上后慢慢发芽', options: ['绿豆放在湿棉花上后慢慢发芽', '窗外下过雨', '她喜欢绿色'], explanation: '湿棉花和后来的发芽现象共同支持“需要水”的结论。', hint: '把开始做法和最后现象连起来。' },
  ]
  if (seeds) return [
    { type: 'choice', prompt: '最早的观察记录是哪一天？', answer: '星期一', options: ['星期一', '星期三', '星期五'], explanation: '日记按时间开始于星期一。', hint: '找第一条日期。' },
    { type: 'choice', prompt: '哪项变化发生在豆皮裂开之后？', answer: '长出白色小根', options: ['长出白色小根', '放在湿棉花上', '写下日期'], explanation: '星期三裂开，星期五才长出小根。', hint: '比较星期三和星期五。' },
    { type: 'choice', prompt: '日记中的“需要水”依据的是？', answer: '湿棉花上的绿豆后来发芽', options: ['湿棉花上的绿豆后来发芽', '绿豆颜色好看', '日记本是新的'], explanation: '做法中的湿棉花和结果中的发芽构成依据。', hint: '把实验条件和现象对应。' },
  ]
  if (variant === 0) return [
    { type: 'choice', prompt: '小安先做了什么？', answer: '把窗边的书移到桌里', options: ['把窗边的书移到桌里', '和小乐一起走', '借来一把伞'], explanation: '短文用“先”说明小安先把窗边的书移到桌里。', hint: '找“先”字。' },
    { type: 'choice', prompt: '小安为什么和小乐一起走？', answer: '小乐没有伞', options: ['小乐没有伞', '小乐想看书', '雨已经停了'], explanation: '原文写“小乐没有伞，便和小乐一起走”。', hint: '找小乐出现的句子。' },
    { type: 'choice', prompt: '到了小区门口，雨怎样了？', answer: '雨已经小了', options: ['雨已经小了', '雨更大了', '没有说'], explanation: '最后一句说“雨已经小了”。', hint: '读最后一句。' },
  ]
  return [
    { type: 'choice', prompt: '小安借伞发生在什么之后？', answer: '把书移到桌里之后', options: ['把书移到桌里之后', '到了小区门口之后', '雨停之后'], explanation: '叙述顺序是先移书，再借伞。', hint: '按“先……再……”排。' },
    { type: 'choice', prompt: '从哪句话能知道小安关心同学？', answer: '她和没有伞的小乐一起走', options: ['她和没有伞的小乐一起走', '雨点敲着窗', '雨已经小了'], explanation: '小乐没有伞时，小安和她一起走，这个行动是依据。', hint: '找人物的行动。' },
    { type: 'choice', prompt: '故事开头的天气是？', answer: '下雨', options: ['下雨', '下雪', '晴天'], explanation: '“雨点敲着窗”说明当时在下雨。', hint: '看第一句的景象。' },
  ]
}

function mathSpecs(lesson: GradeExtensionLesson, variant: 0 | 1): QuestionSpec[] {
  if (lesson.id === 'g3-math-market-groups') return variant === 0 ? [
    { type: 'calc', prompt: '每袋6个，装4袋，一共有多少个苹果？', answer: 24, explanation: '4袋，每袋6个：6×4＝24（个）。', hint: '“每袋一样多”可以用乘法。' },
    { type: 'calc', prompt: '把24个苹果平均装进3个篮子，每个篮子多少个？', answer: 8, explanation: '24÷3＝8（个），每个篮子8个。', hint: '平均分成3份，用除法。' },
    { type: 'choice', prompt: '检查“每篮8个”时，哪一个算式合适？', answer: '8×3＝24', options: ['8×3＝24', '8＋3＝11', '24－8＝15'], explanation: '每篮8个、3个篮子，合起来应是8×3＝24。', hint: '把“每份”乘“份数”。' },
  ] : [
    { type: 'calc', prompt: '每袋5个，装6袋，一共有多少个苹果？', answer: 30, explanation: '5×6＝30（个）。', hint: '每袋数量相同，列乘法。' },
    { type: 'calc', prompt: '把30个苹果平均装进5个篮子，每个篮子多少个？', answer: 6, explanation: '30÷5＝6（个）。', hint: '想5乘几等于30。' },
    { type: 'choice', prompt: '“30个平均放进5个篮子”的结果单位是？', answer: '个/篮子', options: ['个/篮子', '篮子/个', '米'], explanation: '题目问每个篮子里的苹果数，单位应是个。', hint: '读清“每个篮子多少个”。' },
  ]
  if (lesson.id === 'g3-math-garden-perimeter') return variant === 0 ? [
    { type: 'calc', prompt: '长8米、宽5米的长方形菜园，一圈篱笆长多少米？', answer: 26, explanation: '四条边是8、5、8、5米，8＋5＋8＋5＝26（米）。', hint: '周长是四条边的总和。' },
    { type: 'calc', prompt: '同一个菜园，如果先算一条长和一条宽的和，再乘2，结果是多少？', answer: 26, explanation: '（8＋5）×2＝26（米）。', hint: '相对的两条边一样长。' },
    { type: 'choice', prompt: '为什么不能只算8＋5？', answer: '8＋5只是一条长和一条宽，不是一圈', options: ['8＋5只是一条长和一条宽，不是一圈', '因为不能加法', '因为菜园是圆形'], explanation: '围栏要走四周，8＋5只算了两条相邻边。', hint: '想想是否回到了起点。' },
  ] : [
    { type: 'calc', prompt: '长9米、宽4米的长方形花坛，一圈边线长多少米？', answer: 26, explanation: '（9＋4）×2＝26（米）。', hint: '长和宽各有两条。' },
    { type: 'calc', prompt: '周长26米、长9米，宽是多少米？', answer: 4, explanation: '半周长是26÷2＝13米，13－9＝4米。', hint: '先把一圈分成两组长加宽。' },
    { type: 'choice', prompt: '下列哪种走法表示围一圈？', answer: '沿四条边回到出发角', options: ['沿四条边回到出发角', '只走一条长边', '从中间穿过去'], explanation: '周长是图形边界一周的长度。', hint: '找“边界”和“回到起点”。' },
  ]
  return variant === 0 ? [
    { type: 'choice', prompt: '一块蛋糕平均分成8份，乐乐吃2份，乐乐吃了几分之几？', answer: '2/8', options: ['2/8', '8/2', '2/2'], explanation: '2份占8份，写作2/8，也可以化成1/4。', hint: '分母是总份数，分子是吃的份数。' },
    { type: 'choice', prompt: '安安吃3份，乐乐吃2份，谁吃得多？', answer: '安安', options: ['安安', '乐乐', '一样多'], explanation: '同一块蛋糕都分成8份，3份比2份多。', hint: '总份数相同，只比较取了几份。' },
    { type: 'choice', prompt: '为什么这次可以比较2/8和3/8？', answer: '两人说的是同一块、同样分成8份的蛋糕', options: ['两人说的是同一块、同样分成8份的蛋糕', '因为分子都是8', '因为蛋糕一定是圆的'], explanation: '整体相同，每一份大小相同，分数才可直接比较。', hint: '看题目对“同样大”的说明。' },
  ] : [
    { type: 'choice', prompt: '同一块蛋糕平均分成6份，取其中4份，写作？', answer: '4/6', options: ['4/6', '6/4', '4/4'], explanation: '总共6份写在分母，取4份写在分子。', hint: '先找总份数。' },
    { type: 'choice', prompt: '同一块蛋糕分成6份，5/6和2/6比较，哪个大？', answer: '5/6', options: ['5/6', '2/6', '一样大'], explanation: '分母相同，5份比2份多。', hint: '每份一样大。' },
    { type: 'choice', prompt: '把一块蛋糕分成4份和把另一块更大的蛋糕分成4份，能直接比较1/4吗？', answer: '不能，整体大小不同', options: ['不能，整体大小不同', '能，分母都为4', '能，分子都为1'], explanation: '整体不同，每一份的大小也可能不同。', hint: '先确认是不是同一个整体。' },
  ]
}

function specsFor(lesson: GradeExtensionLesson, variant: 0 | 1): QuestionSpec[] {
  return lesson.subject === 'MATH' ? mathSpecs(lesson, variant) : languageSpecs(lesson, variant)
}

function stage(quest: ReadingPracticeQuest, lessonId: string, spec: QuestionSpec, index: number): QuestQuestionStage {
  const id = `${quest.id}:stage:${index + 1}`
  const base: Omit<Question, 'questionType' | 'answerRule'> = {
    id, stem: [{ type: 'TEXT', text: spec.prompt }],
    difficulty: index < 2 ? 'FOUNDATION' : 'ADVANCED', contentType: 'EXTENSION', sourceId: 'grade-extension:original:v1', status: 'AI_GENERATED', needsVerification: true, estimatedSeconds: 60, tags: ['grade-extension-v1', lessonId], media: [], hints: [], explanation: { summary: [{ type: 'TEXT', text: spec.explanation }], steps: [] }, isSample: false, verificationStatus: 'UNVERIFIED', questionVersion: 1,
  }
  const question: Question = spec.type === 'calc' ? { ...base, questionType: 'calculation', answerRule: { ruleType: 'NUMERIC', value: spec.answer } } : {
    ...base, questionType: 'singleChoice', answerRule: { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' },
    options: (() => {
      const offset = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % spec.options.length
      return [...spec.options.slice(offset), ...spec.options.slice(0, offset)].map((label, optionIndex) => ({ id: `${id}:option:${optionIndex}`, questionId: id, optionKey: String.fromCharCode(65 + optionIndex), content: [{ type: 'TEXT' as const, text: label }], sortOrder: optionIndex }))
    })(),
  }
  if (spec.type === 'choice') question.answerRule = { ruleType: 'SINGLE_OPTION', correctOptionKey: question.options!.find((option) => option.content[0]?.text === spec.answer)!.optionKey }
  return { id, title: index === 0 ? '基础理解' : index === 1 ? '线索推理' : '迁移练习', kind: 'question', hint: spec.hint, hints: [spec.hint, quest.subject === 'MATH' ? '把题目给出的数量和要找的数量分开写，再逐步计算或比较。' : '回看短课，找到题目提到的人物或物品，再检查每个选项是否有原文依据。'], explanation: spec.explanation, trainingBand: index === 0 ? 'foundation' : index === 1 ? 'reasoning' : 'transfer', question }
}

export function createGradeExtensionQuest(lessonId: string, variant?: number): ReadingPracticeQuest | null {
  const lesson = gradeExtensionLessonById(lessonId)
  if (!lesson) return null
  const selectedVariant = variantIndex(variant)
  const quest: ReadingPracticeQuest = {
    id: `grade-extension:v1:${lesson.id}:variant:${selectedVariant}`, ...(lesson.subject === 'MATH' ? { subject: 'MATH' as const } : {}), training: { variantIndex: selectedVariant, variantCount: 2 }, stages: [],
  }
  const specs = specsFor(lesson, selectedVariant)
  if (!specs) throw new Error(`No extension question specs for ${lesson.id}`)
  quest.stages = specs.map((spec, index) => stage(quest, lesson.id, spec, index))
  return quest
}
