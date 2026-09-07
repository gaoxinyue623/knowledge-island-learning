import type { LessonContentBlockViewModel, Question } from '@/types'
import { READING_ISLANDS_SOURCE, type ReadingStory } from '@/types/reading-islands'
import type {
  QuestActivityStage,
  QuestQuestionStage,
  ReadingPracticeQuest,
} from '@/types/reading-quest'

export function readingStoryBlocks(story: ReadingStory): LessonContentBlockViewModel[] {
  return [
    {
      id: `reading-islands:${story.id}:text`,
      type: 'intro',
      title: `《${story.title}》`,
      content: story.paragraphs.join('\n\n'),
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      sort: 0,
    },
  ]
}

export function readingStorySpeechBlocks(story: ReadingStory): LessonContentBlockViewModel[] {
  if (story.language !== 'english') return []
  return [
    {
      ...readingStoryBlocks(story)[0]!,
      content: `Story: ${story.title}\n${story.paragraphs.join('\n\n')}`,
    },
    {
      id: `reading-islands:${story.id}:words`,
      type: 'concept',
      content: 'Word list\n' + story.vocabulary.map((v) => `${v.word} ${v.meaning}`).join('\n'),
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      sort: 1,
    },
  ]
}

function shuffled<T>(items: readonly T[], seed: string): T[] {
  let hash = 0
  for (const ch of seed) hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0
    const j = hash % (i + 1)
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  if (result.length > 1 && result.every((item, i) => item === items[i]))
    result.push(result.shift()!)
  return result
}

export function createStoryPractice(story: ReadingStory): ReadingPracticeQuest {
  const scope = `reading-islands:v1:${story.id}`
  const quest: ReadingPracticeQuest = { id: scope, stages: [] }
  const context = (refs: number[]) => `线索：故事第 ${refs.join('、')} 段。可以先回看，再作答。`
  function questionBase(
    id: string,
    prompt: string,
    rule: Question['answerRule'],
    type: Question['questionType'],
    explanation: string,
  ): Question {
    // Reuse the pure validator without claiming a textbook or curriculum knowledge point.
    return {
      id,
      questionType: type,
      stem: [{ type: 'TEXT', text: prompt }],
      answerRule: rule,
      sourceId: READING_ISLANDS_SOURCE.id,
      difficulty: 'FOUNDATION',
      contentType: 'EXTENSION',
      status: 'AI_GENERATED',
      needsVerification: true,
      estimatedSeconds: 60,
      tags: ['extracurricular-reading'],
      media: [],
      hints: [],
      explanation: { summary: [{ type: 'TEXT', text: explanation }], steps: [] },
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      questionVersion: 1,
    }
  }
  function choice(key: string, title: string, task: ReadingStory['detail']) {
    const id = `${scope}:${key}`
    const options = shuffled(task.options, id).map((label, i) => ({
      id: `${id}:option:${i}`,
      questionId: id,
      optionKey: String.fromCharCode(65 + i),
      content: [{ type: 'TEXT' as const, text: label }],
      sortOrder: i,
    }))
    const keys = options
      .filter((o) => task.answers.includes(o.content[0]!.text))
      .map((o) => o.optionKey)
    const rule: Question['answerRule'] =
      keys.length === 1
        ? { ruleType: 'SINGLE_OPTION', correctOptionKey: keys[0]! }
        : { ruleType: 'MULTIPLE_OPTIONS', correctOptionKeys: keys, selectionMode: 'EXACT_SET' }
    quest.stages.push({
      id,
      title,
      kind: 'question',
      hint: task.hint,
      context: context(task.evidence),
      explanation: task.explanation,
      question: {
        ...questionBase(
          id,
          task.prompt,
          rule,
          keys.length === 1 ? 'singleChoice' : 'multipleChoice',
          task.explanation,
        ),
        options,
      },
    })
  }
  function activityBase(id: string, title: string, instruction: string) {
    return {
      id,
      title,
      instruction,
      knowledgePointId: scope,
      learningGoal: instruction,
      difficulty: 'L1' as const,
      completionPolicy: 'all_items' as const,
      sourceId: READING_ISLANDS_SOURCE.id,
      verificationStatus: 'UNVERIFIED' as const,
      isSample: false,
      sort: quest.stages.length,
    }
  }
  function order(
    key: string,
    title: string,
    items: string[],
    prompt: string,
    hint: string,
    refs: number[],
    explanation: string,
  ) {
    const id = `${scope}:${key}`
    const cards = items.map((label, i) => ({ id: `${id}:${i}`, label }))
    quest.stages.push({
      id,
      title,
      kind: 'activity',
      hint,
      context: context(refs),
      explanation,
      activity: {
        ...activityBase(id, title, prompt),
        activityType: 'sort_order',
        config: { items: shuffled(cards, id), correctOrder: cards.map((card) => card.id) },
      },
    })
  }
  choice('detail', '线索小侦探', story.detail)
  const matchId = `${scope}:vocabulary`
  const match: QuestActivityStage = {
    id: matchId,
    kind: 'activity',
    title: '词语找朋友',
    hint: '先选词语，再选它的意思；可以打开本页的词语袋找帮助。',
    explanation: story.vocabulary.map((v) => `${v.word}：${v.meaning}`).join('；'),
    sourceLabel: story.language === 'english' ? 'English words' : '词语',
    targetLabel: '意思',
    context: '线索：本页词语袋。先理解，再配对。',
    activity: {
      ...activityBase(matchId, '词语找朋友', '把四个词语和它们的意思配对。'),
      activityType: 'drag_match',
      config: {
        sources: story.vocabulary.map((v, i) => ({ id: `word-${i}`, label: v.word })),
        targets: shuffled(
          story.vocabulary.map((v, i) => ({ id: `meaning-${i}`, label: v.meaning })),
          matchId,
        ),
        matches: story.vocabulary.map((_, i) => ({
          sourceId: `word-${i}`,
          targetId: `meaning-${i}`,
        })),
      },
    },
  }
  quest.stages.push(match)
  order(
    'sequence',
    '故事小导演',
    story.sequence.events,
    '按故事发生的先后顺序，点击事件卡片。',
    story.sequence.hint,
    story.sequence.evidence,
    story.sequence.events.join(' → '),
  )
  choice('reasoning', '多想一步', story.reasoning)
  const word = story.wordPractice,
    wordId = `${scope}:word`
  const wordStage: QuestQuestionStage = {
    id: wordId,
    kind: 'question',
    title: story.language === 'english' ? '单词拼写岛' : '字词运用岛',
    hint: word.hint,
    context: context(word.evidence),
    explanation: word.explanation,
    tileMode: story.language === 'english' ? 'letters' : 'word',
    tiles: shuffled(word.tiles, wordId),
    question: questionBase(
      wordId,
      word.prompt,
      {
        ruleType: 'TEXT_BLANKS',
        blanks: [
          { blankId: 'answer', acceptedAnswers: [word.answer], normalization: 'CASE_INSENSITIVE' },
        ],
      },
      'fillBlank',
      word.explanation,
    ),
  }
  quest.stages.push(wordStage)
  if (story.sentence) {
    const sentence = story.sentence
    order(
      'sentence',
      '句子搭建师',
      sentence.chunks,
      `把词块连成一句话：${sentence.meaning}`,
      '先找表示“谁”的开头，再找动作和后面的内容。带句号的词块放在最后。',
      sentence.evidence,
      `${sentence.chunks.join(' ')} ${sentence.meaning}`,
    )
  }
  choice('transfer', '读懂故事的意思', story.transfer)
  return quest
}
