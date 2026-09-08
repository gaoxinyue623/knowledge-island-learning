import { describe, expect, it } from 'vitest'
import {
  gradeOneShenzhenMathUpperCurriculum,
  gradeOneShenzhenMathUpperDefinitions,
} from '@/data/curriculum/grade-1/math-bnu-upper'
import { gradeOneShenzhenMathLowerCurriculum } from '@/data/curriculum/grade-1/math-bnu-lower'
import { candidateG1ShenzhenMathUpperContentExpansionBundles } from '@/data/content-expansion/g1-shenzhen-math-upper'
import { createEarlyMathQuest } from '@/services/content-expansion/earlyMathQuest'
import { createMathTrainingQuest } from '@/services/content-expansion/mathTrainingQuest'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import { validateInteractiveActivity } from '@/services/validation/contentExpansionValidation'
import { checkQuestAnswer } from '@/services/content-expansion/readingQuest'

function visibleValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(visibleValue)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        ['id', 'questionId', 'knowledgePointId'].includes(key) ? [] : [[key, visibleValue(item)]],
      ),
    )
  return value
}

describe('student-facing grade 1 math curriculum', () => {
  it('sets observable goals for all three lessons in the start unit', () => {
    const startUnitDefinitions = gradeOneShenzhenMathUpperDefinitions.filter(
      (definition) => definition.unitIndex === 0,
    )
    const startUnitGoals = gradeOneShenzhenMathUpperCurriculum.knowledgePoints
      .slice(0, startUnitDefinitions.length)
      .map((knowledgePoint) => knowledgePoint.learningObjective.join(' '))

    expect(startUnitDefinitions.map((definition) => definition.family)).toEqual([
      'welcome',
      'count',
      'ordinal',
    ])
    expect(startUnitGoals[0]).toMatch(/倾听|举手|整理/)
    expect(startUnitGoals[0]).not.toMatch(/点数|摆物/)
    expect(startUnitGoals[1]).toMatch(/一个一个|不漏数|总数/)
    expect(startUnitGoals[2]).toMatch(/方向|第几个|位置/)
  })

  it('gives every start-unit foundation stage two concrete, non-answer hints', () => {
    const startUnitBundles = candidateG1ShenzhenMathUpperContentExpansionBundles.slice(0, 3)
    const expectedClues = [
      /同伴|课堂|文具|发言|说话/,
      /圆点|逐个|物品|数字|数/,
      /方向|左|右|队伍|位置/,
    ]

    for (const [index, bundle] of startUnitBundles.entries()) {
      const quest = createEarlyMathQuest(bundle)!
      expect(quest.stages).toHaveLength(8)
      for (const stage of quest.stages) {
        expect(stage.hints).toHaveLength(2)
        expect(stage.hints![0]).toContain('观察')
        expect(stage.hints!.join(' ')).not.toMatch(
          /先说说题目要你找什么|用一个小例子检验|先找到开始的那一步/,
        )
      }
      expect(quest.stages.flatMap((stage) => stage.hints ?? []).join(' ')).toMatch(
        expectedClues[index]!,
      )
    }
  })

  it('keeps start-unit reinforcement aligned and provides progressive help', () => {
    const startUnitBundles = candidateG1ShenzhenMathUpperContentExpansionBundles.slice(0, 3)
    const expectedClues = [
      /同伴|课堂|文具|发言|说话/,
      /圆点|逐个|物品|数字|数/,
      /方向|左|右|队伍|位置/,
    ]

    for (const [index, bundle] of startUnitBundles.entries()) {
      const training = createMathTrainingQuest(createEarlyMathQuest(bundle)!, 0)!
      expect(training.stages).toHaveLength(9)
      for (const stage of training.stages) {
        expect(stage.hints).toHaveLength(2)
        expect(stage.hints![0]).toContain('观察')
      }
      expect(training.stages.flatMap((stage) => stage.hints ?? []).join(' ')).toMatch(
        expectedClues[index]!,
      )
    }
  })

  it('varies each start-unit reinforcement set while keeping every answer and activity usable', () => {
    const startUnitBundles = candidateG1ShenzhenMathUpperContentExpansionBundles.slice(0, 3)

    for (const bundle of startUnitBundles) {
      const variants = [0, 1, 2].map((variant) =>
        createMathTrainingQuest(createEarlyMathQuest(bundle)!, variant)!,
      )
      const visibleContent = variants.map((quest) => JSON.stringify(visibleValue(quest.stages)))
      expect(new Set(visibleContent).size).toBe(3)

      for (const quest of variants)
        for (const stage of quest.stages) {
          if (stage.kind === 'question')
            expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
              'correct',
            )
          else expect(validateInteractiveActivity(stage.activity).success).toBe(true)
        }
    }
  })

  it('does not point students to a nonexistent lower hands-on section', () => {
    const contents = [
      ...gradeOneShenzhenMathUpperCurriculum.courseContents,
      ...gradeOneShenzhenMathLowerCurriculum.courseContents,
    ]

    for (const content of contents) {
      const text = (content.body.blocks as Array<{ text?: string }>)
        .map((block) => block.text ?? '')
        .join('\n')
      expect(text).not.toContain('到下方“动手探究”')
    }
  })
})
