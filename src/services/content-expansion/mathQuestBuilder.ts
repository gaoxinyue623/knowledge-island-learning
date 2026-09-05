import type { Question } from '@/types'
import type { MathQuestVisual, QuestQuestionStage, ReadingQuest } from '@/types/reading-quest'

export function createMathQuestBuilder(quest: ReadingQuest, family: string, options: { titles?: string[]; foundationOnly?: boolean } = {}) {
  const provenance = {
    sourceId: quest.sourceId,
    isSample: false,
    verificationStatus: quest.verificationStatus,
  }
  const mix = <T>(items: T[]): T[] => {
    const offset = (quest.stages.length % (items.length - 1)) + 1
    return [...items.slice(offset), ...items.slice(0, offset)]
  }
  const titles = options.titles ?? [
    '热身出发',
    '方法侦探',
    '看图发现',
    '数学配对',
    '步骤排队',
    '纠错能手',
    '生活应用',
    '拓展挑战',
  ]
  function question(
    prompt: string,
    type: Question['questionType'],
    rule: Question['answerRule'],
    explanation: string,
    hint: string,
    visual?: MathQuestVisual,
  ): QuestQuestionStage {
    const id = `${quest.id}:${quest.stages.length + 1}`
    const stage: QuestQuestionStage = {
      id,
      title: titles[quest.stages.length]!,
      kind: 'question',
      explanation,
      hint,
      visual,
      question: {
        id,
        questionType: type,
        stem: [{ type: 'TEXT', text: prompt }],
        answerRule: rule,
        textbookVersionId: quest.textbookId,
        knowledgePointId: quest.knowledgePointId,
        contentType: 'EXTENSION',
        difficulty: options.foundationOnly || quest.stages.length < 6 ? 'FOUNDATION' : 'ADVANCED',
        status: 'AI_GENERATED',
        needsVerification: true,
        estimatedSeconds: 60,
        tags: ['math-quest-v1', family],
        media: [],
        hints: [],
        explanation: { summary: [{ type: 'TEXT', text: explanation }], steps: [] },
        questionVersion: 1,
        ...provenance,
      },
    }
    quest.stages.push(stage)
    return stage
  }
  function calc(
    prompt: string,
    answer: number,
    explanation: string,
    hint = '可以画图、摆小棒，或先写出中间一步。',
    visual?: MathQuestVisual,
  ) {
    question(
      prompt,
      'calculation',
      { ruleType: 'NUMERIC', value: answer },
      explanation,
      hint,
      visual,
    )
  }
  function choice(
    prompt: string,
    answers: string[],
    distractors: string[],
    explanation: string,
    hint = '看清问题里的数量和单位，先想一想每个数表示什么。',
    visual?: MathQuestVisual,
  ) {
    const stage = question(
      prompt,
      answers.length > 1 ? 'multipleChoice' : 'singleChoice',
      { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' },
      explanation,
      hint,
      visual,
    )
    stage.question.options = mix([...new Set([...answers, ...distractors])]).map((label, i) => ({
      id: `${stage.id}:o${i}`,
      questionId: stage.id,
      optionKey: String.fromCharCode(65 + i),
      content: [{ type: 'TEXT', text: label }],
      sortOrder: i,
    }))
    const keys = stage.question.options
      .filter((o) => answers.includes(o.content[0]!.text!))
      .map((o) => o.optionKey)
    stage.question.answerRule =
      keys.length > 1
        ? { ruleType: 'MULTIPLE_OPTIONS', correctOptionKeys: keys, selectionMode: 'EXACT_SET' }
        : { ruleType: 'SINGLE_OPTION', correctOptionKey: keys[0]! }
  }
  function judge(
    prompt: string,
    answer: boolean,
    explanation: string,
    hint = '用一个小例子检验，不只看得数或关键词。',
  ) {
    question(prompt, 'trueFalse', { ruleType: 'BOOLEAN', correctValue: answer }, explanation, hint)
  }
  function activityBase(instruction: string) {
    return {
      id: `${quest.id}:${quest.stages.length + 1}`,
      knowledgePointId: quest.knowledgePointId,
      title: titles[quest.stages.length]!,
      instruction,
      difficulty: 'L1' as const,
      learningGoal: instruction,
      completionPolicy: 'all_items' as const,
      sort: quest.stages.length + 1,
      ...provenance,
    }
  }
  function match(pairs: [string, string][]) {
    const base = activityBase('先点左边，再点右边，把有联系的数学卡片配在一起。')
    quest.stages.push({
      id: base.id,
      title: base.title,
      kind: 'activity',
      sourceLabel: '问题卡',
      targetLabel: '搭档卡',
      hint: '从最有把握的一对开始，先算或说出含义再配对。',
      explanation: pairs.map((p) => p.join(' → ')).join('；'),
      activity: {
        ...base,
        activityType: 'drag_match',
        config: {
          sources: pairs.map((p, i) => ({ id: `s${i}`, label: p[0] })),
          targets: mix(pairs.map((p, i) => ({ id: `t${i}`, label: p[1] }))),
          matches: pairs.map((_, i) => ({ sourceId: `s${i}`, targetId: `t${i}` })),
        },
      },
    })
  }
  function order(parts: string[], instruction: string) {
    const base = activityBase(instruction)
    const items = parts.map((label, i) => ({ id: `p${i}`, label }))
    quest.stages.push({
      id: base.id,
      title: base.title,
      kind: 'activity',
      hint: '先找到开始的那一步，再想下一步用到了什么。',
      explanation: parts.join(' → '),
      activity: {
        ...base,
        activityType: 'sort_order',
        config: { items: mix(items), correctOrder: items.map((i) => i.id) },
      },
    })
  }

  function tiles(prompt: string, answer: string, bank: string[], explanation: string, hint = '点一张卡片，把空格补完整。', visual?: MathQuestVisual) {
    const stage = question(prompt, 'fillBlank', {ruleType: 'TEXT_BLANKS', blanks: [{blankId: 'answer', acceptedAnswers: [answer], normalization: 'TRIM'}]}, explanation, hint, visual)
    stage.tiles = mix([...new Set(bank)])
    stage.tileMode = 'word'
  }
  return { question, calc, choice, judge, match, order, tiles }
}
