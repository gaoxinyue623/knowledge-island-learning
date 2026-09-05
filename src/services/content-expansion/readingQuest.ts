import { readingQuestionSeeds } from '@/data/content-expansion/reading-quest-seeds'
import { createMathQuest } from './mathQuest'
import { productionConfig } from '@/config/production'
import {
  gradeOneShenzhenEnglishUpperKnowledgePoints,
  gradeOneShenzhenEnglishUpperLessonPracticeDefinitions,
} from '@/data/curriculum/grade-1/english-shanghai-upper'
import {
  gradeOneShenzhenEnglishLowerKnowledgePoints,
  gradeOneShenzhenEnglishLowerLessonPracticeDefinitions,
} from '@/data/curriculum/grade-1/english-shanghai-lower'
import {
  gradeTwoShenzhenEnglishUpperKnowledgePoints,
  gradeTwoShenzhenEnglishUpperLessonPracticeDefinitions,
} from '@/data/curriculum/grade-2/english-shanghai-upper'
import {
  isQuestionAnswerComplete,
  validateQuestionAnswer,
} from '@/services/question-engine/answerValidator'
import type {
  ContentExpansionBundle,
  LessonContentBlockViewModel,
  Question,
  QuestionAnswerDraft,
} from '@/types'
import type { QuestActivityStage, QuestQuestionStage, ReadingQuest } from '@/types/reading-quest'

const englishDefinitions = new Map([
  ...gradeOneShenzhenEnglishUpperKnowledgePoints.map(
    (kp, i) => [kp.id, gradeOneShenzhenEnglishUpperLessonPracticeDefinitions[i]] as const,
  ),
  ...gradeOneShenzhenEnglishLowerKnowledgePoints.map(
    (kp, i) => [kp.id, gradeOneShenzhenEnglishLowerLessonPracticeDefinitions[i]] as const,
  ),
  ...gradeTwoShenzhenEnglishUpperKnowledgePoints.map(
    (kp, i) => [kp.id, gradeTwoShenzhenEnglishUpperLessonPracticeDefinitions[i]] as const,
  ),
])

function hash(value: string): number {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return result >>> 0
}

function shuffled<T>(items: T[], seed: string): T[] {
  const result = items
    .map((value, index) => ({ value, rank: hash(seed + ':' + index), index }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.value)
  if (items.length > 1 && result.every((item, i) => item === items[i])) result.push(result.shift()!)
  return result
}

export function questReadingText(blocks: readonly LessonContentBlockViewModel[]): string {
  return blocks
    .filter(
      (block) =>
        block.type !== 'practice' &&
        !/^(?:附录|识字表|写字表|词语表|常用偏旁|常用笔画)/.test(block.content?.trim() ?? ''),
    )
    .map(
      (block) =>
        (block.content ?? '').split(/\n(?:附录|识字表|写字表|词语表|常用偏旁|常用笔画)/)[0],
    )
    .join('\n')
}

function plainText(text: string, title: string): string {
  const titleText = title.replace(/^[\d\s]+/, '').replace(/[《》]/g, '')
  return text
    .replace(/\*\*/g, '')
    .split(/\n/)
    .filter((line) => {
      const value = line.trim()
      return (
        value &&
        value !== titleText &&
        !/^《[^》]+》$/.test(value) &&
        !/^(?:课后练习|小练习|附录|识字表|写字表|课本原文|教材页码|来源[：:]|学习目标|口语交际|和大人一起读)/.test(
          value,
        )
      )
    })
    .join('\n')
    .trim()
}

const vocabulary = [
  '春风',
  '夏雨',
  '秋霜',
  '冬雪',
  '青草',
  '红花',
  '游鱼',
  '飞鸟',
  '小鸟',
  '青蛙',
  '小鸡',
  '小狗',
  '小鸭',
  '小马',
  '松鼠',
  '乌鸦',
  '石子',
  '瓶子',
  '太阳',
  '月亮',
  '星星',
  '荷叶',
  '树叶',
  '树林',
  '雪人',
  '妈妈',
  '爸爸',
  '孩子',
  '朋友',
  '尾巴',
  '大象',
  '狐狸',
  '老虎',
  '花朵',
  '春天',
  '夏天',
  '秋天',
  '冬天',
  '高兴',
  '快乐',
  '美丽',
  '认真',
  '温暖',
  '劳动',
  '办法',
  '耳朵',
  '眼睛',
  '小草',
  '天空',
  '白云',
  '花',
  '鸟',
  '风',
  '雨',
  '水',
  '山',
  '人',
  '天',
  '地',
  '日',
  '月',
]
const unique = (items: string[]) => [...new Set(items)]

function phraseToken(phrase: string): string {
  return (
    vocabulary.find((word) => phrase.includes(word)) ?? phrase.match(/[\u4e00-\u9fff]/)?.[0] ?? ''
  )
}

export function emptyQuestDraft(question: Question): QuestionAnswerDraft {
  if (question.questionType === 'calculation') return { type: 'calculation', value: '' }
  if (question.questionType === 'multipleChoice') return { type: 'multipleChoice', optionIds: [] }
  if (question.questionType === 'trueFalse') return { type: 'trueFalse' }
  if (question.questionType === 'fillBlank') return { type: 'fillBlank', values: [''] }
  return { type: 'singleChoice' }
}

export function checkQuestAnswer(
  question: Question,
  draft: QuestionAnswerDraft,
): 'incomplete' | 'correct' | 'incorrect' | 'manual_review_required' {
  if (!isQuestionAnswerComplete(question, draft)) return 'incomplete'
  const ids =
    draft.type === 'multipleChoice'
      ? draft.optionIds
      : draft.type === 'singleChoice'
        ? [draft.optionId]
        : []
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !question.options?.some((option) => option.id === id))
  )
    return 'incorrect'
  return validateQuestionAnswer(question, draft).status
}

export function createReadingQuest(input: {
  bundle: ContentExpansionBundle | null
  title: string
  text: string
}): ReadingQuest | null {
  // Only project an already-readable repository bundle; never load or publish candidate content here.
  const { bundle, title } = input
  if (
    !productionConfig.allowUnreviewedQuestions ||
    (bundle?.learningContent.isSample && !productionConfig.allowSampleQuestions)
  )
    return null
  if (!bundle || !input.text.trim() || !bundle.learningContent.sourceId) return null
  if (
    bundle.learningContent.knowledgePointId !== bundle.knowledgePointId ||
    bundle.learningContent.lessonId !== bundle.lessonId
  )
    return null
  const english = englishDefinitions.get(bundle.knowledgePointId)
  if (bundle.textbookId.includes('BNU_MATH')) return createMathQuest(bundle)
  if (!english && !bundle.textbookId.includes('CHINESE')) return null
  const text = plainText(input.text, title)
  const quest: ReadingQuest = {
    id: 'reading-quest:v1:' + bundle.textbookId + ':' + bundle.knowledgePointId + ':' + hash(text),
    textbookId: bundle.textbookId,
    lessonId: bundle.lessonId,
    knowledgePointId: bundle.knowledgePointId,
    sourceId: bundle.learningContent.sourceId,
    isSample: bundle.learningContent.isSample,
    verificationStatus: bundle.learningContent.isSample ? 'SAMPLE' : 'UNVERIFIED',
    stages: [],
  }

  function question(
    title: string,
    prompt: string,
    rule: Question['answerRule'],
    type: Question['questionType'],
    explanation: string,
    hint: string,
  ): QuestQuestionStage {
    const id = quest.id + ':' + quest.stages.length
    const stage: QuestQuestionStage = {
      id,
      title,
      kind: 'question',
      hint,
      explanation,
      question: {
        id,
        questionType: type,
        stem: [{ type: 'TEXT', text: prompt }],
        answerRule: rule,
        knowledgePointId: quest.knowledgePointId,
        textbookVersionId: quest.textbookId,
        difficulty: 'FOUNDATION',
        contentType: 'EXTENSION',
        sourceId: quest.sourceId,
        status: 'AI_GENERATED',
        needsVerification: true,
        estimatedSeconds: 45,
        tags: ['reading-quest-v1'],
        media: [],
        hints: [],
        explanation: { summary: [{ type: 'TEXT', text: explanation }], steps: [] },
        isSample: quest.isSample,
        verificationStatus: quest.verificationStatus,
        questionVersion: 1,
      },
    }
    quest.stages.push(stage)
    return stage
  }

  function choice(
    label: string,
    prompt: string,
    answers: string[],
    distractors: string[],
    explanation: string,
    hint: string,
  ): void {
    const labels = unique([...answers, ...distractors]).filter(Boolean)
    if (labels.length <= answers.length) return
    const stage = question(
      label,
      prompt,
      answers.length === 1
        ? { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' }
        : { ruleType: 'MULTIPLE_OPTIONS', correctOptionKeys: [], selectionMode: 'EXACT_SET' },
      answers.length === 1 ? 'singleChoice' : 'multipleChoice',
      explanation,
      hint,
    )
    stage.question.options = shuffled(labels, stage.id).map((label, index) => ({
      id: stage.id + ':option:' + index,
      questionId: stage.id,
      optionKey: String.fromCharCode(65 + index),
      content: [{ type: 'TEXT', text: label }],
      sortOrder: index,
    }))
    const keys = stage.question.options
      .filter((option) => answers.includes(option.content[0]?.text ?? ''))
      .map((option) => option.optionKey)
    stage.question.answerRule =
      answers.length === 1
        ? { ruleType: 'SINGLE_OPTION', correctOptionKey: keys[0]! }
        : { ruleType: 'MULTIPLE_OPTIONS', correctOptionKeys: keys, selectionMode: 'EXACT_SET' }
  }

  function tiles(
    label: string,
    prompt: string,
    answer: string,
    bank: string[],
    mode: 'word' | 'letters',
    explanation: string,
    hint: string,
  ): void {
    const stage = question(
      label,
      prompt,
      {
        ruleType: 'TEXT_BLANKS',
        blanks: [
          { blankId: 'answer', acceptedAnswers: [answer], normalization: 'CASE_INSENSITIVE' },
        ],
      },
      'fillBlank',
      explanation,
      hint,
    )
    stage.tiles = shuffled(bank, stage.id)
    stage.tileMode = mode
  }

  function activityBase(title: string, instruction: string) {
    return {
      id: quest.id + ':' + quest.stages.length,
      knowledgePointId: quest.knowledgePointId,
      title,
      instruction,
      difficulty: 'L1' as const,
      learningGoal: instruction,
      completionPolicy: 'all_items' as const,
      sourceId: quest.sourceId,
      verificationStatus: quest.verificationStatus,
      isSample: quest.isSample,
      sort: quest.stages.length,
    }
  }

  function matching(
    pairs: [string, string][],
    sourceLabel: string,
    targetLabel: string,
    instruction: string,
  ): void {
    if (pairs.length < 2) return
    const base = activityBase('找到好搭档', instruction)
    const stage: QuestActivityStage = {
      id: base.id,
      title: base.title,
      kind: 'activity',
      sourceLabel,
      targetLabel,
      hint: '先选左边的一张卡片，再选右边对应的卡片。不会时可以回看课文。',
      explanation: pairs.map((pair) => pair.join(' → ')).join('；'),
      activity: {
        ...base,
        activityType: 'drag_match',
        config: {
          sources: pairs.map((pair, i) => ({ id: 'source-' + i, label: pair[0] })),
          targets: shuffled(
            pairs.map((pair, i) => ({ id: 'target-' + i, label: pair[1] })),
            base.id,
          ),
          matches: pairs.map((_, i) => ({ sourceId: 'source-' + i, targetId: 'target-' + i })),
        },
      },
    }
    quest.stages.push(stage)
  }

  function ordering(
    parts: string[],
    label: string,
    instruction: string,
    hint: string,
    explanation: string,
  ): void {
    if (parts.length < 3) return
    const base = activityBase(label, instruction)
    const items = parts.map((label, i) => ({ id: 'part-' + i, label }))
    quest.stages.push({
      id: base.id,
      title: label,
      kind: 'activity',
      hint,
      explanation,
      activity: {
        ...base,
        activityType: 'sort_order',
        config: { items: shuffled(items, base.id), correctOrder: items.map((item) => item.id) },
      },
    })
  }

  if (english) {
    const normalized = text.toLowerCase().replace(/[‑–—]/g, '-')
    const words = english.words.filter(
      (word, index, all) =>
        normalized.includes(word.english.toLowerCase().replace(/[‑–—]/g, '-')) &&
        all.findIndex((item) => item.english === word.english || item.chinese === word.chinese) ===
          index,
    )
    if (words.length < 3) return null
    const first = words[0]!
    const second = words[1]!
    choice(
      '单词侦探',
      '哪个单词表示“' + first.chinese + '”？',
      [first.english],
      words.slice(1, 4).map((word) => word.english),
      first.english + ' 的意思是“' + first.chinese + '”。读一遍，再记住它。',
      '回想这一课的单词表，也可以回看上面的中英对照。',
    )
    const spelling = words.filter((word) => /^[a-z]{2,10}$/i.test(word.english)).slice(0, 2)
    const spell = (word: typeof first) =>
      tiles(
        '字母拼拼乐',
        '按顺序点击字母，拼出“' + word.chinese + '”的英文单词。',
        word.english,
        [...word.english],
        'letters',
        word.english + '：' + word.chinese + '。把字母连起来读一读。',
        '它以 ' + word.english[0] + ' 开头，共 ' + word.english.length + ' 个字母。',
      )
    if (spelling[0]) spell(spelling[0])
    matching(
      words.slice(0, 3).map((word) => [word.english, word.chinese]),
      '英文单词',
      '中文意思',
      '给三个英文单词找到对应的中文伙伴。',
    )
    const sentence = english.sentenceAnswer.split(/(?<=[.!?])\s+/)[0]?.trim() ?? ''
    const parts = sentence.split(/\s+/)
    if (parts.length >= 3 && parts.length <= 12)
      ordering(
        parts,
        '句子小火车',
        '把词卡排成一句介绍。例句：' + sentence,
        '从大写字母开始，带句号或问号的词通常放在句尾。点击已排好的词可以移回去。',
        '完整例句：' + sentence + ' 试着连起来读，再用它介绍自己的想法。',
      )
    choice(
      '词义小能手',
      '“' + second.english + '”是什么意思？',
      [second.chinese],
      words
        .filter((word) => word !== second)
        .slice(0, 3)
        .map((word) => word.chinese),
      second.english + ' 的意思是“' + second.chinese + '”。',
      '先读出英文，再选择本课单词表中的意思。',
    )
    if (spelling[1]) spell(spelling[1])
    const wordInSentence = words.find((word) => sentence.includes(word.english))
    if (wordInSentence)
      tiles(
        '补全介绍',
        '照着例句选词补空：' +
          sentence.replace(wordInSentence.english, '____') +
          '\n例句：' +
          sentence,
        wordInSentence.english,
        unique([
          wordInSentence.english,
          ...words
            .filter((word) => word !== wordInSentence)
            .slice(0, 3)
            .map((word) => word.english),
        ]),
        'word',
        '完整例句：' + sentence,
        '留意句子里少了哪个单词，完成后把整句话读一遍。',
      )
  } else {
    let sentences = unique(
      text
        .split(/[。！？\n]+/)
        .map((part) => part.replace(/^[#\s\d.、]+/, '').trim())
        .filter(
          (part) =>
            part.length >= 4 &&
            part.length <= 90 &&
            /[\u4e00-\u9fff]/.test(part) &&
            !/^(?:识字加油站|书写提示|字词句运用|日积月累|和大人一起读|快乐读书吧|注[：:])/.test(
              part,
            ),
        ),
    )
    const originalSentences = sentences
    if (sentences.length < 3)
      sentences = unique(
        sentences.flatMap((sentence) => sentence.split('，').filter((part) => part.length >= 3)),
      )
    if (sentences.length < 3) return null
    const short = sentences.filter((part) => part.length <= 48)
    const selected = short.length >= 3 ? short : sentences
    const first = selected[0]!
    const seed = readingQuestionSeeds.find(
      (seed) => title.includes(seed.title) && text.includes(seed.evidence),
    )
    if (seed)
      choice(
        '阅读小侦探',
        seed.prompt,
        [seed.answer],
        seed.distractors,
        seed.explanation,
        '回到课文找一找与问题有关的句子，注意是谁、在哪里、做了什么。',
      )
    else {
      const token = phraseToken(first)
      const others = vocabulary.filter((word) => !first.includes(word)).slice(0, 3)
      choice(
        '阅读小侦探',
        '读一读：“' + first + '”。哪一个字词出现在这段文字里？',
        [token],
        others,
        '这段文字中出现了“' + token + '”。读的时候，试着用手指找到它。',
        '从头慢慢读一遍，找出与选项相同的字词。',
      )
    }
    const cloze = (phrase: string, label: string) => {
      const token = phraseToken(phrase)
      const distractors = vocabulary
        .filter((word) => word !== token && word.length === token.length)
        .slice(0, 3)
      tiles(
        label,
        '按课文原句，选一张字词卡补进空格：\n' + phrase.replace(token, '____'),
        token,
        [token, ...distractors],
        'word',
        '课文原句：' + phrase,
        '试着先读一读，再回到课文寻找这句话。',
      )
    }
    cloze(selected[1]!, '字词补给站')
    const pairs: [string, string][] = []
    for (const sentence of originalSentences) {
      const [left, ...rest] = sentence.split('，')
      const right = rest.join('，')
      if (
        left &&
        right &&
        left.length <= 25 &&
        right.length <= 35 &&
        !pairs.some((pair) => pair[0] === left || pair[1] === right)
      )
        pairs.push([left, right])
      if (pairs.length === 3) break
    }
    if (pairs.length >= 2)
      matching(
        pairs,
        '句子前半部分',
        '句子后半部分',
        '按课文原句，给前半句找到后半句。不用拖动，点两张卡片就能配对。',
      )
    else cloze(selected[2]!, '原句找一找')
    ordering(
      selected.slice(0, 3),
      '课文排排队',
      '按三张卡片的内容在课文中出现的先后，依次点击。',
      '回看课文开头，找到每句话的位置。点击已排好的卡片，可以移回待选区。',
      '原文顺序：' + selected.slice(0, 3).join(' → '),
    )
    const quote = selected[2]!
    const known = vocabulary.filter((word) => quote.includes(word))
    const answers = unique(
      known.length >= 2
        ? known
            .filter(
              (word, index) => !known.slice(0, index).some((previous) => previous.includes(word)),
            )
            .slice(0, 2)
        : [...quote].filter((char) => /[\u4e00-\u9fff]/.test(char)).slice(0, 4),
    ).slice(0, 2)
    if (answers.length === 2)
      choice(
        '火眼金睛',
        '读一读：“' + quote + '”。选出其中出现的两张字词卡。',
        answers,
        vocabulary.filter((word) => !quote.includes(word)).slice(0, 2),
        '这句话中能找到“' + answers.join('”和“') + '”。多选题要把两个答案都选上。',
        '这一关要选两个答案，每选一张都在句子里找找依据。',
      )
    else cloze(selected.at(-1)!, '字词再挑战')
    const original = selected.at(-1)!
    const token = phraseToken(original)
    const same = hash(quest.id) % 2 === 0
    const changed = original.replace(
      token,
      vocabulary.find((word) => !original.includes(word))!,
    )
    question(
      '原句辨一辨',
      '判断下面的话与课文原句是否一致：\n“' + (same ? original : changed) + '”',
      { ruleType: 'BOOLEAN', correctValue: same },
      'trueFalse',
      '课文原句是：“' +
        original +
        '”。' +
        (same ? '这次与原句一致。' : '有一个字词被换掉了，要仔细读。'),
      '回看课文中的这句话，逐字比较，不只看意思像不像。',
    )
  }
  return quest.stages.length >= 3 ? quest : null
}
