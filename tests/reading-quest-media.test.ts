import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import type { QuestionMedia } from '@/types'
import type { QuestQuestionStage, ReadingPracticeQuest } from '@/types/reading-quest'
import { memoryQuestStorage } from './helpers/questStorage'

vi.mock('@/services/curriculum/loadedCatalog', () => {
  return {
    loadedCurriculumCatalog: {
      value: {
        lessons: [],
        textbooks: [],
        subjects: [],
        mediaAssets: [
          { id: 'mole', mediaType: 'IMAGE', url: '/mole.png', altText: '一条有四个点的鼹鼠隧道' },
          {
            id: 'garden',
            mediaType: 'IMAGE',
            url: '/garden.png',
            altText: '标有起点和终点的菜地路线',
          },
          { id: 'diagram', mediaType: 'SVG', url: '/diagram.svg', altText: null },
          { id: 'solution', mediaType: 'IMAGE', url: '/solution.png', altText: '已标出答案的图' },
          { id: 'audio', mediaType: 'AUDIO', url: '/audio.mp3', altText: '讲解' },
        ],
      },
    },
  }
})

vi.mock('@/services/pet/petQuestRewards', () => ({
  settleQuestPetReward: vi.fn(async () => undefined),
}))

function questionStage(id: string, media: QuestionMedia[]): QuestQuestionStage {
  return {
    id,
    kind: 'question',
    title: id === 'mole-stage' ? '鼹鼠钻洞' : '菜地旅行',
    hint: '按顺序数一数。',
    explanation: '把每一条路线都数一次。',
    question: {
      id: `${id}-question`,
      questionType: 'singleChoice',
      stem: [{ type: 'TEXT', text: '看图选择路线的数量。' }],
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId: 'media-test-source',
      status: 'AI_GENERATED',
      needsVerification: true,
      estimatedSeconds: 60,
      tags: [],
      media,
      hints: [],
      explanation: { summary: [], steps: [] },
      isSample: false,
      answerRule: { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' },
      options: ['A', 'B'].map((optionKey, index) => ({
        id: `${id}-${optionKey}`,
        questionId: `${id}-question`,
        optionKey,
        content: [{ type: 'TEXT', text: String(index + 1) }],
        sortOrder: index,
      })),
    },
  }
}

function quest(
  stages = [
    questionStage('mole-stage', [{ mediaAssetId: 'mole', usageType: 'STEM', order: 0 }]),
    questionStage('garden-stage', [{ mediaAssetId: 'garden', usageType: 'STEM', order: 0 }]),
  ],
): ReadingPracticeQuest {
  return { id: 'question-media-quest', subject: 'MATH', stages }
}

function mountQuest(value = quest()) {
  return mount(ReadingQuest, {
    props: { quest: value, profileId: 'media-test-child' },
    global: { stubs: { StudentReadAloud: true } },
  })
}

async function clickButton(wrapper: VueWrapper, text: string) {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click')
}

async function answer(wrapper: VueWrapper, stageId: string, optionKey = 'A') {
  await wrapper.find(`input[value="${stageId}-${optionKey}"]`).setValue(true)
  await clickButton(wrapper, '检查答案')
}

enableAutoUnmount(afterEach)
beforeEach(() => vi.stubGlobal('localStorage', memoryQuestStorage()))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Reading quest question images', () => {
  it('resolves and orders only stem images, excluding hints, explanations and unsupported assets', () => {
    const media: QuestionMedia[] = [
      { mediaAssetId: 'garden', usageType: 'STEM', order: 2 },
      { mediaAssetId: 'solution', usageType: 'EXPLANATION', order: 0 },
      { mediaAssetId: 'solution', usageType: 'HINT', order: 0 },
      { mediaAssetId: 'solution', usageType: 'OPTION', order: 0 },
      { mediaAssetId: 'audio', usageType: 'STEM', order: 0 },
      { mediaAssetId: 'missing', usageType: 'STEM', order: 0 },
      { mediaAssetId: 'mole', usageType: 'STEM', order: 1 },
      { mediaAssetId: 'diagram', usageType: 'STEM', order: 3 },
    ]
    const before = structuredClone(media)
    const wrapper = mountQuest(quest([questionStage('mole-stage', media)]))
    const images = wrapper.findAll('.question-media__image')
    expect(images.map((image) => image.attributes('src'))).toEqual([
      '/mole.png',
      '/garden.png',
      '/diagram.svg',
    ])
    expect(images.map((image) => image.attributes('alt'))).toEqual([
      '一条有四个点的鼹鼠隧道',
      '标有起点和终点的菜地路线',
      '题目图片',
    ])
    expect(media).toEqual(before)
    expect(wrapper.find('audio').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('已标出答案的图')
    expect(wrapper.findAll('img[src="/solution.png"]')).toHaveLength(0)
  })

  it('updates the image with the active question and when retrying only missed stages', async () => {
    const wrapper = mountQuest()
    expect(wrapper.find('.question-media__image').attributes('src')).toBe('/mole.png')
    await answer(wrapper, 'mole-stage')
    await clickButton(wrapper, '下一关')
    expect(wrapper.findAll('.question-media__image')).toHaveLength(1)
    expect(wrapper.find('.question-media__image').attributes('src')).toBe('/garden.png')
    await answer(wrapper, 'garden-stage', 'B')
    await answer(wrapper, 'garden-stage')
    await clickButton(wrapper, '查看闯关小结')
    await clickButton(wrapper, '再练错过的关卡')
    expect(wrapper.find('#quest-stage-title').text()).toBe('菜地旅行')
    expect(wrapper.find('.question-media__image').attributes('src')).toBe('/garden.png')
    await answer(wrapper, 'garden-stage')
    await clickButton(wrapper, '查看闯关小结')
    await clickButton(wrapper, '全部再闯一次')
    expect(wrapper.find('#quest-stage-title').text()).toBe('鼹鼠钻洞')
    expect(wrapper.find('.question-media__image').attributes('src')).toBe('/mole.png')
  })

  it('resets the active image for a new review attempt and removes it for a question without media', async () => {
    const wrapper = mountQuest()
    await wrapper.setProps({ reviewAttemptId: 'review-one' })
    await answer(wrapper, 'mole-stage')
    await clickButton(wrapper, '下一关')
    expect(wrapper.find('.question-media__image').attributes('src')).toBe('/garden.png')
    await wrapper.setProps({ reviewAttemptId: 'review-two' })
    expect(wrapper.find('.question-media__image').attributes('src')).toBe('/mole.png')
    await wrapper.setProps({
      quest: { ...quest([questionStage('no-media', [])]), id: 'no-media-quest' },
    })
    expect(wrapper.find('.question-media-list').exists()).toBe(false)
  })
})
