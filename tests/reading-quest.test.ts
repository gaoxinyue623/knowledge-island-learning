import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QUEST_PROGRESS_PREFIX } from '@/services/content-expansion/questProgressStorage'
import { memoryQuestStorage } from './helpers/questStorage'

import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import SortOrderActivity from '@/components/interactive-activity/SortOrderActivity.vue'
import { productionConfig } from '@/config/production'
import { curriculumData } from '@/data/curriculum'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import {
  createReadingQuest,
  questReadingText,
  checkQuestAnswer,
  emptyQuestDraft,
} from '@/services/content-expansion/readingQuest'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import type { ContentBlock, ContentExpansionBundle } from '@/types'
import type {
  QuestActivityStage,
  QuestQuestionStage,
  ReadingQuest as Quest,
} from '@/types/reading-quest'

const repository = new StaticContentExpansionRepository()
const bundles = await repository.listBundles('candidate')

function inputFor(bundle: ContentExpansionBundle) {
  const content = curriculumData.courseContents
    .filter((content) => content.knowledgePointId === bundle.knowledgePointId)
    .sort((a, b) => b.currentVersion - a.currentVersion || a.id.localeCompare(b.id))[0]!
  const blocks = content.body['blocks'] as ContentBlock[]
  return {
    bundle,
    title: content.title,
    text: questReadingText(
      blocks.map((block, index) => ({
        id: String(index),
        type: 'intro',
        content: block.text,
        isSample: content.isSample,
        sort: index,
      })),
    ),
  }
}

const springBundle = bundles.find(
  (bundle) => bundle.knowledgePointId === 'G1_PEP_CHINESE_S2_KP_01',
)!
const springInput = inputFor(springBundle)
const springQuest = createReadingQuest(springInput)!

function questionStage(quest = springQuest): QuestQuestionStage {
  return quest.stages.find((stage): stage is QuestQuestionStage => stage.kind === 'question')!
}

function shortQuest(stages = springQuest.stages.slice(0, 2)): Quest {
  return { ...structuredClone(springQuest), stages: structuredClone(stages) }
}

enableAutoUnmount(afterEach)
beforeEach(() => vi.stubGlobal('localStorage', memoryQuestStorage()))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Reading quest content projection', () => {
  it('supports short poems without padding with unrelated text', () => {
    const quest = createReadingQuest({
      ...springInput,
      title: '静夜思',
      text: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
    })!
    expect(quest.stages).toHaveLength(6)
    expect(questionStage(quest).explanation).toContain('想念家乡')
    expect(
      quest.stages.some(
        (stage) => stage.kind === 'activity' && stage.activity.activityType === 'drag_match',
      ),
    ).toBe(true)
  })

  it('does not invent questions for empty or insufficient reading content', () => {
    expect(createReadingQuest({ ...springInput, text: '读一读。' })).toBeNull()
  })

  it('never passes an open-ended response through automatic keyword grading', () => {
    const question = {
      ...questionStage().question,
      questionType: 'shortAnswer' as const,
      answerRule: { ruleType: 'MANUAL_REVIEW' as const, rubric: ['表达完整'] },
    }
    expect(checkQuestAnswer(question, { type: 'shortAnswer', value: '鱼出水，鸟入林' })).toBe(
      'manual_review_required',
    )
  })
  it('builds six varied, deterministic Chinese stages without mutating source records', () => {
    const before = JSON.stringify(springInput)
    expect(createReadingQuest(springInput)).toEqual(springQuest)
    expect(springQuest.stages).toHaveLength(6)
    expect(
      springQuest.stages.map((stage) =>
        stage.kind === 'question' ? stage.question.questionType : stage.activity.activityType,
      ),
    ).toEqual([
      'singleChoice',
      'fillBlank',
      'drag_match',
      'sort_order',
      'multipleChoice',
      'trueFalse',
    ])
    expect(JSON.stringify(springInput)).toBe(before)
    expect(questionStage().question.stem[0]?.text).toContain('鱼和鸟')
  })

  it('keeps original exercise provenance separate from textbook review state', () => {
    const bundle = structuredClone(springBundle)
    bundle.learningContent.verificationStatus = 'REVIEWED'
    const quest = createReadingQuest({ ...springInput, bundle })!
    expect(quest.verificationStatus).toBe('UNVERIFIED')
    expect(quest.sourceId).toBe(bundle.learningContent.sourceId)
    expect(quest.isSample).toBe(false)
    bundle.learningContent.isSample = true
    expect(createReadingQuest({ ...springInput, bundle })?.verificationStatus).toBe('SAMPLE')
  })

  it('does not bypass missing, mismatched, or production-guarded content', () => {
    expect(createReadingQuest({ ...springInput, bundle: null })).toBeNull()
    expect(createReadingQuest({ ...springInput, text: '' })).toBeNull()
    const broken = structuredClone(springBundle)
    broken.learningContent.lessonId = 'another-lesson'
    expect(createReadingQuest({ ...springInput, bundle: broken })).toBeNull()
    const previous = productionConfig.allowUnreviewedQuestions
    try {
      productionConfig.allowUnreviewedQuestions = false
      expect(createReadingQuest(springInput)).toBeNull()
    } finally {
      productionConfig.allowUnreviewedQuestions = previous
    }
  })

  it('separates textbook and content revisions in stable IDs', () => {
    const otherBook = { ...springBundle, textbookId: 'ANOTHER_CHINESE_TEXTBOOK' }
    expect(createReadingQuest({ ...springInput, bundle: otherBook })?.id).not.toBe(springQuest.id)
    expect(
      createReadingQuest({ ...springInput, text: springInput.text + '\n小鸟唱歌。' })?.id,
    ).not.toBe(springQuest.id)
    expect(new Set(springQuest.stages.map((stage) => stage.id)).size).toBe(
      springQuest.stages.length,
    )
  })

  it('uses comprehension seeds only when the corresponding passage evidence exists', () => {
    const quest = createReadingQuest({
      ...springInput,
      text: '一只小鸟在唱歌。两朵红花开放了。三个孩子在看书。',
    })!
    expect(questionStage(quest).question.stem[0]?.text).not.toContain('鱼和鸟')
  })

  it('excludes appendix blocks and practice instructions from reading questions', () => {
    const reading = questReadingText([
      {
        id: 'text',
        type: 'intro',
        content: '春风吹，夏雨落。\n秋霜降，冬雪飘。\n鱼出水，鸟入林。',
        isSample: false,
        sort: 0,
      },
      {
        id: 'appendix',
        type: 'concept',
        content: '附录\n只有附录才有这句话。\n识字表\n附录测试标记',
        isSample: false,
        sort: 1,
      },
      { id: 'practice', type: 'practice', content: '练习说明测试标记', isSample: false, sort: 2 },
    ])
    expect(reading).not.toContain('附录测试标记')
    const quest = createReadingQuest({
      ...springInput,
      text: reading + '\n课后练习：练习说明测试标记。',
    })!
    expect(JSON.stringify(quest.stages)).not.toContain('练习说明测试标记')
  })

  it('keeps every generated closed answer solvable across all eleven imported textbooks', () => {
    const coverage = new Map<string, { lessons: number; stages: number }>()
    for (const bundle of bundles) {
      const quest = createReadingQuest(inputFor(bundle))
      if (!quest) continue
      const current = coverage.get(quest.textbookId) ?? { lessons: 0, stages: 0 }
      coverage.set(quest.textbookId, {
        lessons: current.lessons + 1,
        stages: current.stages + quest.stages.length,
      })
      for (const stage of quest.stages) {
        if (stage.kind === 'question') {
          expect(checkQuestAnswer(stage.question, emptyQuestDraft(stage.question)), stage.id).toBe(
            'incomplete',
          )
          expect(
            checkQuestAnswer(stage.question, correctAnswerDraft(stage.question)),
            stage.id,
          ).toBe('correct')
          if (stage.tiles && stage.question.answerRule.ruleType === 'TEXT_BLANKS') {
            const answer = stage.question.answerRule.blanks[0]!.acceptedAnswers[0]!
            if (stage.tileMode === 'letters')
              expect([...stage.tiles].sort()).toEqual([...answer].sort())
            else expect(stage.tiles).toContain(answer)
          }
        } else if (stage.activity.activityType === 'drag_match') {
          const { sources, targets, matches } = stage.activity.config
          expect(new Set(sources.map((item) => item.label)).size).toBe(sources.length)
          expect(new Set(targets.map((item) => item.label)).size).toBe(targets.length)
          expect(matches).toHaveLength(sources.length)
        } else {
          const { items, correctOrder } = stage.activity.config
          expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
          expect([...correctOrder].sort()).toEqual(items.map((item) => item.id).sort())
          expect(items.map((item) => item.id)).not.toEqual(correctOrder)
        }
      }
    }
    expect(coverage.size).toBe(11)
    expect([...coverage.values()].every((item) => item.lessons >= 6)).toBe(true)
    console.info('Reading quest coverage', Object.fromEntries(coverage))
  })

  it('rejects unknown and duplicate choice IDs, and requires an exact multi-select answer', () => {
    const single = questionStage().question
    expect(checkQuestAnswer(single, { type: 'singleChoice', optionId: 'unknown' })).toBe(
      'incorrect',
    )
    const multiple = springQuest.stages.find(
      (stage): stage is QuestQuestionStage =>
        stage.kind === 'question' && stage.question.questionType === 'multipleChoice',
    )!.question
    const correct = correctAnswerDraft(multiple)
    if (correct.type !== 'multipleChoice') throw new Error('Expected multiple-choice draft')
    expect(
      checkQuestAnswer(multiple, { ...correct, optionIds: correct.optionIds.slice(0, 1) }),
    ).toBe('incorrect')
    expect(
      checkQuestAnswer(multiple, { ...correct, optionIds: [...correct.optionIds, 'unknown'] }),
    ).toBe('incorrect')
    expect(
      checkQuestAnswer(multiple, {
        ...correct,
        optionIds: [...correct.optionIds, correct.optionIds[0]!],
      }),
    ).toBe('incorrect')
  })
})

describe('Reading quest interaction', () => {
  it('accepts interchangeable cards for repeated words in an English sentence', async () => {
    const base = springQuest.stages.find(
      (stage): stage is QuestActivityStage =>
        stage.kind === 'activity' && stage.activity.activityType === 'sort_order',
    )!
    const activity = {
      ...base.activity,
      activityType: 'sort_order' as const,
      config: {
        items: [
          { id: 'and-2', label: 'and' },
          { id: 'eyes', label: 'eyes' },
          { id: 'and-1', label: 'and' },
          { id: 'ears', label: 'ears' },
        ],
        correctOrder: ['eyes', 'and-1', 'ears', 'and-2'],
      },
    }
    const wrapper = mount(SortOrderActivity, { props: { activity } })
    const original = wrapper.findAll('.activity-choice')
    for (const index of [1, 0, 3, 2]) await original[index]!.trigger('click')
    await wrapper.find('.activity-check-button').trigger('click')
    expect(wrapper.emitted('complete')?.[0]?.[0]).toMatchObject({ status: 'completed' })
    expect(wrapper.find('.activity-order__item').attributes('aria-label')).toContain('eyes')
  })

  it('does not skip stages, retries incorrect choices and only advances explicitly', async () => {
    const wrapper = mount(ReadingQuest, { props: { quest: shortQuest(), profileId: 'child-a' } })
    const check = () => wrapper.findAll('button').find((button) => button.text() === '检查答案')!
    expect(check().attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('.reading-quest__trail button')[1]!.attributes('disabled')).toBeDefined()
    const question = questionStage().question
    const answer = correctAnswerDraft(question)
    if (answer.type !== 'singleChoice') throw new Error('Expected single choice')
    const wrong = question.options!.find((option) => option.id !== answer.optionId)!
    await wrapper.find('input[value="' + wrong.id + '"]').setValue(true)
    await check().trigger('click')
    expect(wrapper.text()).toContain('还差一点点')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    await wrapper.find('input[value="' + answer.optionId + '"]').setValue(true)
    await check().trigger('click')
    expect(wrapper.text()).toContain(questionStage().explanation)
    expect(wrapper.find('#quest-stage-title').text()).toBe('阅读小侦探')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '下一关')!
      .trigger('click')
    expect(wrapper.find('#quest-stage-title').text()).toBe('字词补给站')
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('supports tile selection, correction, summary and retrying only missed stages with independent practice storage', async () => {
    const stage = springQuest.stages[1] as QuestQuestionStage
    const quest = shortQuest([stage])
    const write = vi.spyOn(localStorage, 'setItem')
    const wrapper = mount(ReadingQuest, { props: { quest, profileId: 'child-a' } })
    const answer = correctAnswerDraft(stage.question)
    if (answer.type !== 'fillBlank') throw new Error('Expected fill blank')
    const tiles = () => wrapper.findAll('.reading-quest__tiles button')
    const check = () => wrapper.findAll('button').find((button) => button.text() === '检查答案')!
    await tiles()
      .find((button) => button.text() !== answer.values[0])!
      .trigger('click')
    await check().trigger('click')
    await tiles()
      .find((button) => button.text() === answer.values[0])!
      .trigger('click')
    await check().trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '查看闯关小结')!
      .trigger('click')
    expect(wrapper.text()).toContain('这一轮，全部通过')
    expect(wrapper.text()).toContain('有 1 关是重试后完成的')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '再练错过的关卡')!
      .trigger('click')
    expect(wrapper.text()).toContain('这些关卡，再来试试看')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(write).toHaveBeenCalled()
    expect(write.mock.calls.every(([key]) => key.startsWith(QUEST_PROGRESS_PREFIX))).toBe(true)
  })

  it('resets in-memory answers and progress on profile or textbook changes', async () => {
    const wrapper = mount(ReadingQuest, { props: { quest: shortQuest(), profileId: 'child-a' } })
    await wrapper.find('input').setValue(true)
    await wrapper.setProps({ profileId: 'child-b' })
    expect(
      wrapper.findAll('input').some((input) => (input.element as HTMLInputElement).checked),
    ).toBe(false)
    await wrapper.find('input').setValue(true)
    await wrapper.setProps({ quest: { ...shortQuest(), id: 'another-book:quest' } })
    expect(
      wrapper.findAll('input').some((input) => (input.element as HTMLInputElement).checked),
    ).toBe(false)
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
  })

  it('uses distinct tiles for repeated English letters and allows removing one tile', async () => {
    const english = bundles
      .map((bundle) => createReadingQuest(inputFor(bundle)))
      .find((quest) =>
        quest?.stages.some(
          (stage) =>
            stage.kind === 'question' &&
            stage.tileMode === 'letters' &&
            new Set(stage.tiles).size < stage.tiles!.length,
        ),
      )!
    const stage = english.stages.find(
      (stage): stage is QuestQuestionStage =>
        stage.kind === 'question' &&
        stage.tileMode === 'letters' &&
        new Set(stage.tiles).size < stage.tiles!.length,
    )!
    const wrapper = mount(ReadingQuest, {
      props: { quest: shortQuest([stage]), profileId: 'child-a' },
    })
    const answer = correctAnswerDraft(stage.question)
    if (answer.type !== 'fillBlank') throw new Error('Expected spelling')
    await wrapper.find('.reading-quest__tiles button').trigger('click')
    await wrapper.find('.reading-quest__answer-slot button').trigger('click')
    expect(wrapper.findAll('.reading-quest__answer-slot button')).toHaveLength(0)
    for (const letter of answer.values[0]!) {
      await wrapper
        .findAll('.reading-quest__tiles button')
        .find((button) => button.text() === letter && button.attributes('disabled') === undefined)!
        .trigger('click')
    }
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '检查答案')!
      .trigger('click')
    expect(wrapper.text()).toContain('这一关通过啦')
  })

  it('tracks wrong matching attempts, without completing early or accepting an unrelated completion', async () => {
    const stage = springQuest.stages[2] as QuestActivityStage
    if (stage.activity.activityType !== 'drag_match') throw new Error('Expected matching')
    const wrapper = mount(ReadingQuest, {
      props: { quest: shortQuest([stage]), profileId: 'child-a' },
    })
    const child = wrapper.findComponent(DragMatchActivity)
    child.vm.$emit('complete', { activityId: 'another', status: 'completed', attempts: 1 })
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    const sources = child.findAll('section')[0]!.findAll('button')
    const targets = child.findAll('section')[1]!.findAll('button')
    const config = stage.activity.config
    await sources[0]!.trigger('click')
    const wrongIndex = config.targets.findIndex(
      (target) => target.id !== config.matches[0]!.targetId,
    )
    await targets[wrongIndex]!.trigger('click')
    expect(wrapper.text()).toContain('还不是一对')
    for (const pair of config.matches) {
      await sources[config.sources.findIndex((source) => source.id === pair.sourceId)]!.trigger(
        'click',
      )
      await targets[config.targets.findIndex((target) => target.id === pair.targetId)]!.trigger(
        'click',
      )
    }
    expect(wrapper.text()).toContain('这一关通过啦')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '查看闯关小结')!
      .trigger('click')
    expect(wrapper.text()).toContain('有 1 关是重试后完成的')
  })

  it('keeps incomplete or incorrectly ordered cards in the current stage and supports correction', async () => {
    const stage = springQuest.stages[3] as QuestActivityStage
    if (stage.activity.activityType !== 'sort_order') throw new Error('Expected sorting')
    const wrapper = mount(ReadingQuest, {
      props: { quest: shortQuest([stage]), profileId: 'child-a' },
    })
    const child = wrapper.findComponent(SortOrderActivity)
    await child.find('.activity-check-button').trigger('click')
    expect(child.text()).toContain('先把每张卡片')
    for (const button of child.findAll('.activity-choice')) await button.trigger('click')
    await child.find('.activity-check-button').trigger('click')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    for (const button of child.findAll('.activity-order__item')) await button.trigger('click')
    for (const id of stage.activity.config.correctOrder) {
      const label = stage.activity.config.items.find((item) => item.id === id)!.label
      await child
        .findAll('.activity-choice')
        .find((button) => button.text() === label)!
        .trigger('click')
    }
    await child.find('.activity-check-button').trigger('click')
    expect(wrapper.text()).toContain('这一关通过啦')
  })
})
