import type { ReadingQuest, QuestQuestionStage } from '@/types/reading-quest'
import { createMathQuestBuilder } from '../mathQuestBuilder'
import { mathPracticeTopics } from './topics'
import { mathPracticeItem } from './items'

export const MATH_PRACTICE_VARIANTS = 3
export const MATH_PRACTICE_SIZE = 9

export function createMathConsolidationQuest(
  base: ReadingQuest,
  variant: number,
): ReadingQuest | null {
  const topic = mathPracticeTopics.get(base.knowledgePointId)
  if (
    base.subject !== 'MATH' ||
    !topic ||
    topic.lessonId !== base.lessonId ||
    topic.textbookId !== base.textbookId
  )
    return null
  const v =
    ((Math.trunc(Number.isFinite(variant) ? variant : 0) % MATH_PRACTICE_VARIANTS) +
      MATH_PRACTICE_VARIANTS) %
    MATH_PRACTICE_VARIANTS
  const quest: ReadingQuest = {
    ...base,
    id: `math-consolidation-v1:${base.knowledgePointId}:${v}`,
    training: { variantIndex: v, variantCount: MATH_PRACTICE_VARIANTS },
    stages: [],
  }
  const titles = [
    '基础计算',
    '概念辨析',
    '方法检查',
    '换个条件',
    '找出错因',
    '检查结果',
    '生活应用',
    '条件迁移',
    '独立巩固',
  ]
  const builder = createMathQuestBuilder(quest, topic.topicKey, { titles })
  const grade = Number(topic.textbookId.match(/^G(\d)/)?.[1] ?? 2)
  for (let i = 0; i < MATH_PRACTICE_SIZE; i++) {
    const item = mathPracticeItem(topic.topicKey, v * MATH_PRACTICE_SIZE + i, grade)
    const visual = item.diagram
      ? { type: 'practice-diagram' as const, diagram: item.diagram }
      : undefined
    if (typeof item.answer === 'number') {
      if (i % 3 === 1) {
        const claimed = i % 2 === 0 ? item.answer : Math.round((item.answer + 1) * 10000) / 10000
        builder.judge(
          `${item.prompt}\n小同学的结果是${claimed}，这个结果正确吗？`,
          claimed === item.answer,
          item.explanation,
        )
      } else if (i % 3 === 2)
        builder.choice(
          item.prompt,
          [String(item.answer)],
          [
            String(Math.round((item.answer + 1) * 10000) / 10000),
            String(Math.round((item.answer + 2) * 10000) / 10000),
          ],
          item.explanation,
          undefined,
          visual,
        )
      else builder.calc(item.prompt, item.answer, item.explanation, undefined, visual)
    } else {
      if (i % 3 === 1) {
        const claimed = i % 2 === 0 ? item.answer : item.distractors![0]!
        builder.judge(
          `${item.prompt}\n小同学认为“${claimed}”，这个判断正确吗？`,
          claimed === item.answer,
          item.explanation,
        )
      } else
        builder.choice(
          item.prompt,
          [item.answer],
          item.distractors!,
          item.explanation,
          undefined,
          visual,
        )
    }
    const stage = quest.stages.at(-1)! as QuestQuestionStage
    stage.visual = visual
    stage.trainingBand = i < 3 ? 'foundation' : i < 6 ? 'reasoning' : 'transfer'
    stage.context = `${topic.title} · 第${v + 1}组巩固练习`
    stage.hints = [
      '先找本题给出的已知条件，确认单位与要解决的问题。',
      '回看本课的知识点，写出计算或判断的依据，再检查结果。',
    ]
    stage.question.tags = ['math-consolidation-v1', topic.topicKey, stage.trainingBand]
    stage.question.hints = stage.hints.map((text, hintIndex) => ({
      id: `${stage.id}:hint:${hintIndex + 1}`,
      order: hintIndex + 1,
      trigger: 'ON_REQUEST',
      content: [{ type: 'TEXT', text }],
    }))
    stage.question.verificationStatus = base.verificationStatus
    stage.question.status = 'PUBLISHED'
    stage.question.needsVerification = false
    if (stage.question.answerRule.ruleType === 'NUMERIC')
      stage.question.answerRule.tolerance = 0.000001
  }
  return quest
}
