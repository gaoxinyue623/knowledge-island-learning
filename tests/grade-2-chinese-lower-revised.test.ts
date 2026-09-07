import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import { productionConfig } from '@/config/production'
import { curriculumData, isChinesePilotTextbook } from '@/data/curriculum'
import { gradeTwoChineseLowerCurriculum as previous } from '@/data/curriculum/grade-2/chinese-pep-lower'
import {
  G2_REVISED_CHINESE_EXERCISE_SOURCE_ID,
  G2_REVISED_CHINESE_SOURCE_ID,
  G2_REVISED_CHINESE_TEXTBOOK_ID,
  revisedChineseImportNotes,
  revisedChineseLowerCurriculum as revised,
  revisedChineseLowerRows,
} from '@/data/curriculum/grade-2/chinese-pep-lower-revised'
import {
  revisedChineseAppendixCounts,
  revisedChineseLowerAppendix,
} from '@/data/curriculum/grade-2/chinese-pep-lower-revised-appendix'
import { revisedChinesePracticeRows } from '@/data/content-expansion/g2-chinese-lower-revised-practice'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import {
  checkQuestAnswer,
  createReadingQuest,
  emptyQuestDraft,
  questReadingText,
} from '@/services/content-expansion/readingQuest'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { MockLessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import {
  createLessonSession,
  validateLessonLaunchContext,
} from '@/services/lesson-player/lessonPlayerAdapter'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import { validateCurriculumData } from '@/services/validation'
import { validateInteractiveActivity } from '@/services/validation/contentExpansionValidation'
import type { QuestActivityStage } from '@/types/reading-quest'

const accessPolicy = {
  allowSampleCurriculum: false,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: false,
  allowUnreviewedLearningContent: true,
}
const curriculum = new MockCurriculumService({ accessPolicy })
const content = new MockLearningContentRepository({ accessPolicy })
const lessons = new MockLessonPlayerRepository({ accessPolicy, curriculum, content })
const expansion = new StaticContentExpansionRepository()
const contextFor = (row: (typeof revisedChineseLowerRows)[number]) => ({
  textbookId: G2_REVISED_CHINESE_TEXTBOOK_ID,
  unitId: row.unitId,
  lessonId: row.lessonId,
  knowledgePointId: row.knowledgePointId,
})
async function questFor(row: (typeof revisedChineseLowerRows)[number]) {
  const { source } = await lessons.getLessonPlayerSource(contextFor(row))
  if (!source) throw new Error(`Missing lesson: ${row.key}`)
  const bundle = await expansion.getBundle(row.knowledgePointId, 'candidate')
  const input = {
    bundle,
    // The detail page passes Lesson.title, not CourseContent.title.
    title: source.lesson.title,
    text: questReadingText(
      source.blocks.map((record) => ({
        id: record.id,
        type: record.stepType as 'intro' | 'concept',
        content: record.block.text,
        isSample: false,
        sort: record.sort,
      })),
    ),
  }
  return { source, bundle, input, quest: createReadingQuest(input)! }
}

afterEach(() => vi.restoreAllMocks())

describe('independent revised Grade 2 lower Chinese textbook', () => {
  it('matches the new directory without replacing the previous edition', () => {
    expect(revised.units).toHaveLength(8)
    expect(revised.lessons).toHaveLength(37)
    expect(revised.knowledgePoints).toHaveLength(37)
    expect(revised.courseContents).toHaveLength(37)
    expect(
      revised.units.map((unit) =>
        revised.lessons.filter((lesson) => lesson.unitId === unit.id).map((lesson) => lesson.title),
      ),
    ).toEqual([
      [
        '1 古诗二首',
        '2 找春天',
        '3 开满鲜花的小路',
        '4 邓小平爷爷植树',
        '语文园地一',
        '快乐读书吧：读读儿童故事',
      ],
      ['5 雷锋叔叔，你在哪里', '6 千人糕', '7 我不是最弱小的', '语文园地二'],
      ['1 神州谣', '2 传统节日', '3 “贝”的故事', '4 中国美食', '语文园地三'],
      ['8 彩色的梦', '9 一匹出色的马', '10 枫树上的喜鹊', '语文园地四'],
      ['11 寓言二则', '12 画杨桃', '13 小马过河', '语文园地五'],
      ['14 古诗二首', '15 雷雨', '16 要是你在野外迷了路', '17 太空生活趣事多', '语文园地六'],
      ['18 大象的耳朵', '19 蜘蛛开店', '20 青蛙卖泥塘', '21 小毛虫', '语文园地七'],
      ['22 羿射九日', '23 黄帝的传说', '24 大禹治水', '语文园地八'],
    ])
    expect(revised.lessons.filter((lesson) => /^\d/u.test(lesson.title))).toHaveLength(28)
    expect(previous.lessons).toHaveLength(38)
    expect(previous.lessons.some((lesson) => lesson.title === '7 一匹出色的马')).toBe(true)
    for (const name of ['沙滩上的童话', '我是一只小虫子', '祖先的摇篮', '当世界年纪还小的时候']) {
      expect(previous.lessons.some((lesson) => lesson.title.includes(name))).toBe(true)
      expect(revised.lessons.some((lesson) => lesson.title.includes(name))).toBe(false)
    }
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('\n')).toBe(true)
  })

  it('uses semantic identities disjoint from every previously imported record', () => {
    for (const collection of [
      'textbooks',
      'units',
      'lessons',
      'knowledgePoints',
      'lessonKnowledgePointRelations',
      'knowledgePrerequisites',
      'courseContents',
    ] as const) {
      const newIds = revised[collection].map((record) => record.id)
      const oldIds = new Set(previous[collection].map((record) => record.id))
      expect(new Set(newIds).size).toBe(newIds.length)
      expect(newIds.some((id) => oldIds.has(id))).toBe(false)
    }
    expect(revisedChineseLowerRows.find((row) => row.key === 'FINE_HORSE')).toMatchObject({
      unit: 4,
      lessonId: 'G2_PEP_CHINESE_S2_REVISED_LESSON_FINE_HORSE',
      knowledgePointId: 'G2_PEP_CHINESE_S2_REVISED_KP_FINE_HORSE',
    })
  })

  it('does not transfer map progress or sessions between editions', async () => {
    const oldSource = (await curriculum.getLearningMapCurriculum(previous.textbooks[0]!.id))!
    const newSource = (await curriculum.getLearningMapCurriculum(G2_REVISED_CHINESE_TEXTBOOK_ID))!
    const oldMap = buildLearningMapViewModel(oldSource)
    const oldNode = flattenKnowledgeNodes(oldMap.islands).find(
      (node) => node.knowledgePointId === previous.knowledgePoints[0]!.id,
    )!
    const progress = [{ nodeId: oldNode.id, status: 'completed' as const, progress: 100 }]
    const snapshot = JSON.stringify(progress)
    expect(
      flattenKnowledgeNodes(buildLearningMapViewModel(oldSource, progress).islands).find(
        (node) => node.id === oldNode.id,
      )?.progress,
    ).toBe(100)
    const newMap = buildLearningMapViewModel(newSource, progress)
    expect(newMap.islands).toHaveLength(8)
    const nodes = flattenKnowledgeNodes(newMap.islands)
    expect(nodes).toHaveLength(37)
    expect(nodes.every((node) => node.progress === 0)).toBe(true)
    expect(JSON.stringify(progress)).toBe(snapshot)
    const oldContext = {
      textbookId: oldSource.textbook.id,
      unitId: previous.units[0]!.id,
      lessonId: previous.lessons[0]!.id,
      knowledgePointId: previous.knowledgePoints[0]!.id,
    }
    const newContext = contextFor(revisedChineseLowerRows[0]!)
    const oldSession = createLessonSession(oldContext, 'child-a')
    const newSession = createLessonSession(newContext, 'child-a')
    expect(newSession.id).not.toBe(oldSession.id)
    expect(createLessonSession(newContext, 'child-b').id).not.toBe(newSession.id)
    expect(
      (await lessons.getLessonPlayerSource({ ...newContext, lessonId: oldContext.lessonId })).issue,
    ).toBe('INVALID_CONTEXT')
  })

  it('preserves supplied passages and explicitly tracks the small editorial changes', () => {
    const text = (key: string) => revisedChineseLowerRows.find((row) => row.key === key)!.text
    expect(text('NOT_WEAKEST')).toContain('轻轻地遮在蔷薇花上')
    expect(text('NOT_WEAKEST')).toContain('你是勇敢的孩子啦')
    expect(text('HUANGDI')).toContain('官员仓颉创造文字')
    expect(text('DAYU')).toContain('重新过上了幸福的生活')
    expect(text('MAPLE_MAGPIES')).toContain('从那天起，我一有空')
    expect(text('SPACE_LIFE')).toContain('鞋底带钩的鞋子')
    expect(text('SPRING_POEMS').indexOf('《咏柳》')).toBeLessThan(
      text('SPRING_POEMS').indexOf('《村居》'),
    )
    expect(text('SUMMER_POEMS').indexOf('《绝句》')).toBeLessThan(
      text('SUMMER_POEMS').indexOf('《晓出净慈寺送林子方》'),
    )
    expect(text('GARDEN_7')).toContain('见善则迁')
    expect(text('GARDEN_7')).not.toContain('予善则迁')
    expect(revisedChineseImportNotes.corrections[0]?.supplied).toBe('予善则迁，有过则改。')
    expect(text('STARFRUIT')).toContain('“不……像。”')
    expect(revisedChineseImportNotes.publicationEditionConfirmed).toBe(false)
    expect(revised.textbooks[0]?.editionYear).toBeUndefined()
  })

  it('keeps actual appendix counts instead of inventing the missing characters', async () => {
    expect(revisedChineseAppendixCounts.recognition.entries).toBeLessThan(450)
    expect(revisedChineseAppendixCounts.recognition.unique).toBeLessThan(
      revisedChineseAppendixCounts.recognition.entries,
    )
    expect(revisedChineseAppendixCounts.writing.entries).toBeLessThan(250)
    expect(revisedChineseAppendixCounts.writing.unique).toBeLessThan(
      revisedChineseAppendixCounts.writing.entries,
    )
    expect(revisedChineseLowerAppendix).not.toMatch(/450|250|完整词语|听写专用/u)
    expect(revisedChineseLowerAppendix).toContain('诗（古诗）')
    expect(revisedChineseLowerAppendix).toContain('母（母亲）')
    expect(revisedChineseLowerAppendix).toContain('母（母爱）')
    const { input, source, quest } = await questFor(revisedChineseLowerRows.at(-1)!)
    expect(source.blocks).toHaveLength(2)
    expect(source.blocks[1]!.block.text).toBe(revisedChineseLowerAppendix)
    expect(input.text).not.toContain('附录')
    expect(JSON.stringify(quest)).not.toContain('碧空如洗')
  })

  it('keeps the source guard and original practice provenance', async () => {
    expect(isChinesePilotTextbook(G2_REVISED_CHINESE_TEXTBOOK_ID)).toBe(true)
    expect(revised.regionTextbookRelations).toEqual([])
    expect(revised.textbooks[0]).toMatchObject({
      needsVerification: true,
      verificationStatus: 'UNVERIFIED',
    })
    const { bundle, quest } = await questFor(revisedChineseLowerRows[0]!)
    expect(bundle?.learningContent.sourceId).toBe(G2_REVISED_CHINESE_EXERCISE_SOURCE_ID)
    expect(quest.sourceId).toBe(G2_REVISED_CHINESE_EXERCISE_SOURCE_ID)
    expect(quest.sourceId).not.toBe(G2_REVISED_CHINESE_SOURCE_ID)
    const restricted = new MockCurriculumService({
      accessPolicy: { allowSampleCurriculum: false, allowUnreviewedCurriculum: false },
    })
    expect(await restricted.getTextbook(G2_REVISED_CHINESE_TEXTBOOK_ID)).toBeNull()
    const restrictedContent = new MockLearningContentRepository({
      accessPolicy: { allowSampleLearningContent: false, allowUnreviewedLearningContent: false },
    })
    expect(
      await restrictedContent.getByKnowledgePoint(revisedChineseLowerRows[0]!.knowledgePointId),
    ).toBeNull()
    vi.spyOn(productionConfig, 'isProduction', 'get').mockReturnValue(true)
    expect(
      await expansion.getBundle(revisedChineseLowerRows[0]!.knowledgePointId, 'candidate'),
    ).toBeNull()
  })

  it.each(revisedChinesePracticeRows)(
    'loads and builds seven solvable stages for $title',
    async (row) => {
      const { source, bundle, input, quest } = await questFor(row)
      expect(validateLessonLaunchContext(contextFor(row), source).valid).toBe(true)
      expect(source.blocks[0]?.block.text).toBe(`${row.displayTitle}\n\n${row.text}`)
      expect(source.sourceId).toBe(G2_REVISED_CHINESE_SOURCE_ID)
      expect(bundle?.challenges[0]?.instruction).toBe(row.practice.expression)
      expect(bundle?.extensionActivities[0]?.referenceAnswer).toContain('不自动判分')
      const snapshot = JSON.stringify(input)
      expect(quest?.stages).toHaveLength(7)
      expect(createReadingQuest(input)).toEqual(quest)
      expect(JSON.stringify(input)).toBe(snapshot)
      expect(row.text).toContain(row.practice.evidence)
      const first = quest.stages[0]!
      expect(first.kind === 'question' && first.question.stem[0]?.text).toBe(row.practice.prompt)
      for (const stage of quest.stages) {
        if (stage.kind === 'question') {
          expect(checkQuestAnswer(stage.question, emptyQuestDraft(stage.question))).toBe(
            'incomplete',
          )
          expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
            'correct',
          )
        } else expect(validateInteractiveActivity(stage.activity).success, stage.id).toBe(true)
      }
      const words = quest.stages.find(
        (stage): stage is QuestActivityStage =>
          stage.kind === 'activity' && stage.title === '生字组词配配对',
      )!
      expect(words.sourceLabel).toBe('汉字')
      expect(words.targetLabel).toBe('词语')
      if (words.activity.activityType !== 'drag_match') throw new Error('Expected word pairs')
      for (const source of words.activity.config.sources) {
        expect(row.text).toContain(source.label)
        expect(
          words.activity.config.targets.filter((target) => target.label!.includes(source.label!)),
        ).toHaveLength(1)
      }
      expect(new Set(quest.stages.map((stage) => stage.id)).size).toBe(7)
      expect(
        new Set(
          quest.stages.map((stage) =>
            stage.kind === 'question' ? stage.question.questionType : stage.activity.activityType,
          ),
        ).size,
      ).toBeGreaterThanOrEqual(5)
    },
  )

  it('never applies revised-only prompts or word cards to another book or missing evidence', async () => {
    const row = revisedChineseLowerRows.find((row) => row.key === 'NOT_WEAKEST')!
    const { input } = await questFor(row)
    const other = createReadingQuest({
      ...input,
      bundle: { ...input.bundle!, textbookId: previous.textbooks[0]!.id },
    })!
    expect(other.stages).toHaveLength(6)
    expect(other.stages[0]?.title).toBe('阅读小侦探')
    expect(JSON.stringify(other.stages)).not.toContain('用雨衣轻轻遮住花')
    const changed = createReadingQuest({
      ...input,
      text: '小鸟正在唱歌。蓝天飘着白云。我们高兴地笑了。',
    })!
    expect(changed.stages).toHaveLength(6)
    expect(JSON.stringify(changed.stages)).not.toContain('用雨衣轻轻遮住花')
  })

  it('plays the word-pair activity using clicks with no text input', async () => {
    const { quest } = await questFor(
      revisedChineseLowerRows.find((row) => row.key === 'NOT_WEAKEST')!,
    )
    const stage = quest.stages.find(
      (item): item is QuestActivityStage =>
        item.kind === 'activity' && item.title === '生字组词配配对',
    )!
    if (stage.activity.activityType !== 'drag_match') throw new Error('Expected word pairs')
    const wrapper = mount(DragMatchActivity, {
      props: {
        activity: stage.activity,
        sourceLabel: stage.sourceLabel,
        targetLabel: stage.targetLabel,
      },
    })
    expect(wrapper.find('input').exists()).toBe(false)
    for (const match of stage.activity.config.matches) {
      const source = stage.activity.config.sources.find((item) => item.id === match.sourceId)!
      const target = stage.activity.config.targets.find((item) => item.id === match.targetId)!
      await wrapper
        .findAll('button')
        .find((button) => button.text() === source.label)!
        .trigger('click')
      await wrapper
        .findAll('button')
        .find((button) => button.text() === target.label)!
        .trigger('click')
    }
    expect(wrapper.emitted('complete')?.[0]?.[0]).toMatchObject({
      status: 'completed',
      attempts: 3,
    })
    wrapper.unmount()
  })
})
