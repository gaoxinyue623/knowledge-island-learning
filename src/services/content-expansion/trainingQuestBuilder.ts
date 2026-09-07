import { createMathQuestBuilder } from './mathQuestBuilder'
import type { ReadingQuest } from '@/types/reading-quest'

export const TRAINING_TITLES = [
  '独立解题',
  '换个角度',
  '线索配对',
  '方法实验室',
  '找出错因',
  '检查与验证',
  '情境任务 · 选方法',
  '情境任务 · 解问题',
  '情境任务 · 再想一步',
]

export function createTrainingBuilder(base: ReadingQuest, variant: number, count = 3) {
  const variantIndex =
    ((Math.trunc(Number.isFinite(variant) ? variant : 0) % count) + count) % count
  const quest: ReadingQuest = {
    ...base,
    id: base.id + ':training-v1:' + variantIndex,
    training: { variantIndex, variantCount: count },
    stages: [],
  }
  const builder = createMathQuestBuilder(quest, 'training', { titles: TRAINING_TITLES })
  function choice(...args: Parameters<typeof builder.choice>) {
    if (base.subject !== 'MATH' && !args[4]) args[4] = '先读懂任务，回想词义或文意，再逐项检查。'
    builder.choice(...args)
  }
  function last(title?: string, context?: string) {
    const stage = quest.stages.at(-1)!
    if (title) {
      stage.title = title
      if (stage.kind === 'activity') stage.activity.title = title
    }
    if (context) stage.context = context
    return stage
  }
  function finish() {
    quest.stages.forEach((stage, index) => {
      stage.trainingBand = index < 3 ? 'foundation' : index < 6 ? 'reasoning' : 'transfer'
      stage.hints ??= [
        stage.hint,
        '先在纸上试一种方法，再回看上面的学习内容检查。答案可以修改，不用着急。',
      ]
      if (stage.kind === 'question') {
        stage.question.tags = ['quest-training-v1', stage.trainingBand]
        stage.question.difficulty = index < 3 ? 'FOUNDATION' : 'ADVANCED'
      } else if (base.subject !== 'MATH') {
        stage.activity.instruction = stage.activity.instruction.replace('数学卡片', '词句卡片')
      }
    })
    return quest
  }
  return { ...builder, choice, quest, variantIndex, last, finish }
}
