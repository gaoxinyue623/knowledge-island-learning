import type { ReadingQuest } from '@/types/reading-quest'
import { chineseTrainingSeeds } from '@/data/content-expansion/chinese-training-seeds'
import { readingQuestionSeeds } from '@/data/content-expansion/reading-quest-seeds'
import { englishPracticeFor } from './readingQuest'
import { createTrainingBuilder } from './trainingQuestBuilder'

const distinct = (values: string[]) => [...new Set(values)]
const rotate = <T>(values: T[], offset: number) => [
  ...values.slice(offset),
  ...values.slice(0, offset),
]

export function createLanguageTrainingQuest(
  base: ReadingQuest,
  title: string,
  text: string,
  variant: number,
): ReadingQuest | null {
  const english = englishPracticeFor(base.knowledgePointId)
  const b = createTrainingBuilder(base, variant)
  const v = b.variantIndex
  const spell = (word: { english: string; chinese: string }, label: string) => {
    const answer = word.english
    const stage = b.question(
      `按中文“${word.chinese}”拼出英文。字母卡有多余的，不需要全部用完。`,
      'fillBlank',
      {
        ruleType: 'TEXT_BLANKS',
        blanks: [
          { blankId: 'answer', acceptedAnswers: [answer], normalization: 'CASE_INSENSITIVE' },
        ],
      },
      `${answer}：${word.chinese}。注意字母顺序，重复字母也不能少。`,
      '先想发音和词义，不要按卡片出现的顺序拼。',
    )
    const extras = ['a', 'e', 'i', 'o', 'u', 's', 't', 'r', 'x', 'z']
      .filter((letter) => !answer.toLowerCase().includes(letter))
      .slice(0, 2)
    stage.tiles = rotate([...answer, ...extras].reverse(), v + 1)
    stage.tileMode = 'letters'
    stage.hints = [
      '先尝试回想单词的发音。多余字母不要选。',
      `开头是${answer[0]}，目标单词共${answer.length}个字母。`,
    ]
    b.last(label)
  }
  if (english) {
    const words = english.words.filter(
      (word, index, all) =>
        text.toLowerCase().includes(word.english.toLowerCase()) &&
        all.findIndex((x) => x.english === word.english || x.chinese === word.chinese) === index,
    )
    if (words.length < 3) return null
    const selected = rotate(words, v % words.length)
    const first = selected[0]!,
      second = selected[1]!,
      third = selected[2]!
    const spelling = rotate(
      words.filter((word) => /^[a-z]{2,12}$/i.test(word.english)),
      v % Math.max(1, words.filter((word) => /^[a-z]{2,12}$/i.test(word.english)).length),
    )
    const wordTask = (word: typeof first, label: string) => {
      if (/^[a-z]{2,12}$/i.test(word.english)) spell(word, label)
      else {
        b.order(word.english.split(/\s+/), `根据中文“${word.chinese}”，把词卡组成一个短语。`)
        b.last(label)
      }
    }
    wordTask(spelling[0] ?? first, '拼写挑战 · 排除干扰')
    b.choice(
      `给“${second.chinese}”选择英文名片。`,
      [second.english],
      selected
        .filter((x) => x !== second)
        .slice(0, 3)
        .map((x) => x.english),
      `${second.english}表示${second.chinese}。`,
    )
    b.last('词义辨析')
    b.match(selected.slice(0, 4).map((word) => [word.english, word.chinese]))
    const match = b.last('词汇联结')
    if (match.kind === 'activity') {
      match.sourceLabel = '英文'
      match.targetLabel = '中文'
    }
    wordTask(spelling[1] ?? third, '拼写挑战 · 再进一步')
    const repair = spelling[0] ?? first
    const wrong = repair.english.slice(1)
    b.choice(
      `单词维修站：“${repair.chinese}”应该怎样拼？`,
      [repair.english],
      [wrong, repair.english + 's'.repeat(2)],
      `正确拼写是${repair.english}。检查是否漏了开头、顺序错误或添了多余字母。`,
    )
    b.last('拼写维修站')
    const sentences = english.sentenceAnswer
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().split(/\s+/).length >= 3)
    const sentence = (
      sentences.find((s) => !s.trim().endsWith('?')) ??
      sentences[0] ??
      english.sentenceAnswer
    ).trim()
    const parts = sentence.split(/\s+/)
    const task = english.sentencePrompt
      .replace(/“[^”]*”(?:\s*和\s*“[^”]*”)*/g, '本课句型')
      .replace(/[A-Za-z][A-Za-z\s'’\-.,!?…]*/g, '本课句型')
    b.order(parts, `表达情境：${task} 本关用所有词卡，先完成其中一句表达。`)
    b.last('独立组句')
    b.last().hints = [
      '找句子的开头，再看谁、做什么或是什么。',
      '从大写开头排起，把带句末标点的词放在最后。',
    ]
    const scene = `表达任务：${task}`
    const alternatives = [
      [parts[1], parts[0], ...parts.slice(2)].join(' '),
      [...parts].reverse().join(' '),
    ].filter((s) => s !== sentence)
    b.choice(
      '检查下面的词序与标点，哪一句与本课句型一致、表达完整？',
      [sentence],
      alternatives,
      `本次参考表达：${sentence}`,
      '先确定是介绍信息、表达喜好，还是打招呼。',
    )
    b.last(undefined, scene)
    b.choice(
      `想再介绍本课的“${third.chinese}”，应选择哪个词或短语？`,
      [third.english],
      selected
        .filter((x) => x !== third)
        .slice(0, 3)
        .map((x) => x.english),
      `${third.english}：${third.chinese}。完整句子还要注意单复数和搭配。`,
    )
    b.last(undefined, scene)
    wordTask(spelling[2] ?? second, '情境任务 · 记住新词')
    b.last(undefined, `最后给“${(spelling[2] ?? second).chinese}”制作英文词卡。`)
  } else {
    let lines = distinct(
      text
        .split(/[。！？\n]+/)
        .map((s) => s.replace(/^[\s\d#、.]+/, '').trim())
        .filter(
          (s) =>
            s.length >= 5 &&
            s.length <= 90 &&
            /[\u4e00-\u9fff]/.test(s) &&
            !/^(?:《|附录|识字表|写字表|词语表|书写提示|日积月累|字词句运用|识字加油站|常用偏旁)/.test(
              s,
            ),
        ),
    )
    if (lines.length < 3) {
      lines = distinct(lines.flatMap((line) => line.split('，')).filter((line) => line.length >= 3))
    }
    if (lines.length < 3) return null
    const selected = rotate(lines, v % lines.length)
    const seed = readingQuestionSeeds.find(
      (s) =>
        (!s.textbookId || s.textbookId === base.textbookId) &&
        title.includes(s.title) &&
        text.includes(s.evidence),
    )
    const reasoning = chineseTrainingSeeds.find(
      (s) => title.includes(s.title) && text.includes(s.evidence),
    )
    const firstIndex = v % Math.max(1, lines.length - 2)
    const evidence = seed?.evidence ?? lines[firstIndex]!
    const choices = selected
      .filter((s) => !s.includes(evidence) && !evidence.includes(s))
      .slice(0, 3)
    if (choices.length < 2) return null
    if (seed)
      b.choice(
        seed.prompt,
        [seed.answer],
        seed.distractors,
        seed.explanation,
        '先想一想，再到课文中验证。',
      )
    else
      b.choice(
        '下面三项都来自课文。哪一项在文中出现得最早？',
        [lines[firstIndex]!],
        lines.slice(firstIndex + 1, firstIndex + 3),
        `按课文顺序，先出现：“${lines[firstIndex]}”。`,
      )
    b.last('读懂信息')
    b.choice(
      seed ? `要回答“${seed.prompt}”，下面哪项直接包含所需线索？` : '为上一关找到同一条原文依据。',
      [evidence],
      choices,
      `相关依据：“${evidence}”。结论要能回到文字里找到支持。`,
    )
    b.last('结论要有依据')
    const pairs = selected
      .flatMap((line) => {
        const [left, ...rest] = line.split('，')
        const right = rest.join('，')
        return left && right && left.length <= 25 && right.length <= 35
          ? [[left, right] as [string, string]]
          : []
      })
      .filter((p, i, all) => all.findIndex((x) => x[0] === p[0] || x[1] === p[1]) === i)
      .slice(0, 4)
    if (pairs.length >= 2) {
      b.match(pairs)
      const s = b.last('句意联结')
      if (s.kind === 'activity') {
        s.sourceLabel = '前半句'
        s.targetLabel = '后半句'
      }
    } else {
      b.order(lines.slice(0, 4), '回想内容在文中的先后，把四张（不足四张时用全部）卡片排好。')
      b.last('顺序与结构')
    }
    const phrase = selected[1]!
    const tokens = [...phrase].filter((char) => /[\u4e00-\u9fff]/.test(char))
    const answer = tokens.slice(0, 2).join('')
    const position = phrase.indexOf(answer)
    const target = position >= 0 ? answer : tokens[0]!
    const stage = b.question(
      `根据课文补完整，不提供候选词：\n${phrase.replace(target, '____')}`,
      'fillBlank',
      {
        ruleType: 'TEXT_BLANKS',
        blanks: [{ blankId: 'answer', acceptedAnswers: [target], normalization: 'TRIM' }],
      },
      `原句：“${phrase}”。`,
      '读通整个句子，联系上下文，必要时回看课文。',
    )
    stage.tiles = rotate(
      [...target, ...['花', '树', '风', '雨'].filter((x) => !target.includes(x)).slice(0, 3)],
      v + 1,
    )
    stage.tileMode = 'characters'
    stage.question.stem[0]!.text = `回想课文，依次选字补完整。卡片中有多余的字：\n${phrase.replace(target, '____')}`
    b.last('字词组合 · 排除干扰')
    const r = reasoning?.reasoning
    if (r)
      b.choice(
        r.prompt,
        [r.answer],
        r.distractors,
        r.explanation,
        '把文中的行动、条件和结果联系起来。',
      )
    else
      b.choice(
        '有个判断只与课文有几个字相同，却改变了人物或事情。怎样检查才可靠？',
        ['核对人物、动作、条件和结果是否一致'],
        ['只看有几个字一样', '选最长的句子'],
        '字面相似不等于意思相同，要核对完整信息。',
      )
    b.last('推理实验室')
    b.order(
      lines.slice(v, v + 5).length >= 3 ? lines.slice(v, v + 5) : lines.slice(0, 5),
      '按这些内容在课文中出现的先后排队。先找到开头，再连起后续。',
    )
    b.last('结构挑战 · 句段排队')
    const scene = reasoning
      ? `把《${reasoning.title}》中的发现，用到新的问题里。`
      : '小读者要介绍这一课，请帮他把介绍准备清楚。'
    if (reasoning) {
      const r = reasoning.transfer
      b.choice(
        r.prompt,
        [r.answer],
        r.distractors,
        r.explanation,
        '找新情境与课文中相同的关系，不直接照搬人物名字。',
      )
    } else
      b.choice(
        '介绍课文时，哪种做法可靠？',
        ['先说主要信息，再用相关原文说明'],
        ['把没写的事当作原文事实', '只报出课题就不再介绍'],
        '区分原文、自己的理解和想象。',
      )
    b.last('情境任务 · 举一反三', scene)
    const supporting = reasoning?.evidence ?? evidence
    b.choice(
      '回到课文，哪条原文与刚才讨论的关键事件直接相关？',
      [supporting],
      lines.filter((s) => !s.includes(supporting) && !supporting.includes(s)).slice(0, 3),
      `原文线索：“${supporting}”。`,
      '不是任意一句原文都能支持同一个问题。',
    )
    b.last('情境任务 · 回到证据', scene)
    b.choice(
      `准备交流时，哪些做法能帮助把想法讲清楚？`,
      ['先说自己的判断', '说明相关依据或理由'],
      ['不同意别人就不用听', '把猜想说成书里已经写明的事实'],
      '表达既要有观点，也要有依据。开放表达没有唯一答案，这道题只判断明确的交流方法。',
    )
    b.last('情境任务 · 表达检查', scene)
  }
  return b.finish()
}
