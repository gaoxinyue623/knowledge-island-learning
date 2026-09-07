import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import KnowledgeChallengeCard from '@/components/knowledge-point/KnowledgeChallengeCard.vue'
import SelectRegionActivity from '@/components/interactive-activity/SelectRegionActivity.vue'
import {
  candidateContentExpansionBundles,
  candidateG1ShenzhenEnglishContentExpansionBundles,
  candidateG1ShenzhenEnglishLowerContentExpansionBundles,
  candidateG2ShenzhenEnglishUpperContentExpansionBundles,
  candidateG2ChineseContentExpansionBundles,
  candidateG2ChineseLowerContentExpansionBundles,
  candidateLowerChineseContentExpansionBundles,
  goldenContentExpansionBundles,
} from '@/data/content-expansion'
import {
  adaptExerciseInstance,
  generateExerciseInstances,
  validateGeneratedExerciseInstances,
} from '@/services/exercise-template'
import { activityRegistry, supportedActivityTypes } from '@/services/interactive-activity'
import {
  createInteractiveActivityStorage,
  type ActivityStorageLike,
} from '@/services/interactive-activity/activityStorage'
import {
  contentExpansionRepository,
  practiceService,
  StaticContentExpansionRepository,
  validateContentExpansionBundle,
} from '@/services/content-expansion'
import {
  isProductionExerciseTemplate,
  isProductionInteractiveActivity,
} from '@/services/production-readiness'
import type { ActivityProgress, ExerciseTemplate } from '@/types'

function memoryStorage(): ActivityStorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

const countBundle = goldenContentExpansionBundles[0]
if (!countBundle) throw new Error('Golden content fixture is empty')
const matchActivity = countBundle.activities.find((item) => item.activityType === 'drag_match')
if (!matchActivity || matchActivity.activityType !== 'drag_match')
  throw new Error('Match fixture is missing')
const regionActivity = goldenContentExpansionBundles[3]?.activities.find(
  (item) => item.activityType === 'select_region',
)
if (!regionActivity || regionActivity.activityType !== 'select_region')
  throw new Error('Region fixture is missing')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Content Expansion 01.1 domain and registry', () => {
  it('keeps Golden bundles structurally complete and internally referenced', () => {
    expect(goldenContentExpansionBundles).toHaveLength(4)
    for (const bundle of goldenContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.learningContent.blocks).toHaveLength(2)
      expect(bundle.activities).toHaveLength(2)
      expect(new Set(bundle.practiceSets.map((set) => set.mode))).toEqual(
        new Set(['basic', 'reinforce', 'application']),
      )
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges).toHaveLength(1)
      expect(
        bundle.activities.every(
          (item) => item.isSample && item.verificationStatus === 'UNVERIFIED',
        ),
      ).toBe(true)
    }
  })

  it('covers every Grade 1 Chinese lesson with two original candidate exercises', async () => {
    expect(candidateContentExpansionBundles).toHaveLength(45)
    for (const bundle of candidateContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G1_PEP_CHINESE_S1_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G1_PEP_CHINESE_S1_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
    expect(await contentExpansionRepository.listBundles('candidate')).toHaveLength(357)
  })

  it('covers every Shenzhen Grade 1 English lesson with spelling and introduction practice', () => {
    expect(candidateG1ShenzhenEnglishContentExpansionBundles).toHaveLength(16)
    for (const bundle of candidateG1ShenzhenEnglishContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G1_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.title).toBe('单词拼写')
      expect(bundle.extensionActivities[0]?.title).toBe('句子介绍')
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G1_SHENZHEN_ENGLISH_S1_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
  })

  it('covers every Shenzhen Grade 1 English lower-volume lesson with spelling and introduction practice', () => {
    expect(candidateG1ShenzhenEnglishLowerContentExpansionBundles).toHaveLength(16)
    for (const bundle of candidateG1ShenzhenEnglishLowerContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G1_SHENZHEN_SHANGHAI_ENGLISH_S2_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.title).toBe('单词拼写')
      expect(bundle.extensionActivities[0]?.title).toBe('句子介绍')
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G1_SHENZHEN_ENGLISH_S2_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
  })

  it('covers every Shenzhen Grade 2 English upper-volume lesson with spelling and introduction practice', () => {
    expect(candidateG2ShenzhenEnglishUpperContentExpansionBundles).toHaveLength(6)
    for (const bundle of candidateG2ShenzhenEnglishUpperContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G2_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.title).toBe('单词拼写')
      expect(bundle.extensionActivities[0]?.title).toBe('句子介绍')
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G2_SHENZHEN_ENGLISH_S1_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
  })

  it('covers every Grade 1 Chinese lower-volume lesson with candidate exercises', async () => {
    expect(candidateLowerChineseContentExpansionBundles).toHaveLength(38)
    for (const bundle of candidateLowerChineseContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G1_PEP_CHINESE_S2_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G1_PEP_CHINESE_S2_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
  })

  it('covers every Grade 2 Chinese upper-volume lesson with candidate exercises', () => {
    expect(candidateG2ChineseContentExpansionBundles).toHaveLength(37)
    for (const bundle of candidateG2ChineseContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G2_PEP_CHINESE_S1_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G2_PEP_CHINESE_S1_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
  })

  it('covers every Grade 2 Chinese lower-volume lesson with candidate exercises', () => {
    expect(candidateG2ChineseLowerContentExpansionBundles).toHaveLength(38)
    for (const bundle of candidateG2ChineseLowerContentExpansionBundles) {
      const report = validateContentExpansionBundle(bundle)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(bundle.textbookId).toBe('G2_PEP_CHINESE_S2_2024_CANDIDATE')
      expect(bundle.activities).toEqual([])
      expect(bundle.exerciseTemplates).toEqual([])
      expect(bundle.practiceSets).toEqual([])
      expect(bundle.challenges).toHaveLength(1)
      expect(bundle.extensionActivities).toHaveLength(1)
      expect(bundle.challenges[0]?.referenceAnswer).toBeTruthy()
      expect(bundle.extensionActivities[0]?.referenceAnswer).toBeTruthy()
      expect(
        [...bundle.challenges, ...bundle.extensionActivities].every(
          (item) =>
            item.isSample === false &&
            item.verificationStatus === 'UNVERIFIED' &&
            item.sourceId === 'G2_PEP_CHINESE_S2_ORIGINAL_EXERCISES_V1',
        ),
      ).toBe(true)
    }
  })

  it('registers all twelve activity types while exposing six renderers', () => {
    expect(Object.keys(activityRegistry)).toHaveLength(12)
    expect(supportedActivityTypes).toHaveLength(6)
    expect(
      supportedActivityTypes.every(
        (type) => activityRegistry[type].supported && activityRegistry[type].component,
      ),
    ).toBe(true)
    expect(activityRegistry.build_object.supported).toBe(false)
    expect(activityRegistry.timed_challenge.supported).toBe(false)
  })

  it('keeps activity records out of the profile dataset until reviewed', async () => {
    expect(await contentExpansionRepository.listBundles('profile')).toEqual([])
    expect(await contentExpansionRepository.listBundles('golden')).toHaveLength(4)
    expect(isProductionInteractiveActivity(matchActivity)).toBe(false)
  })
})

describe('Interactive activity progress boundary', () => {
  it('persists schemaVersion 1 progress and isolates profiles', () => {
    const storage = memoryStorage()
    const repository = createInteractiveActivityStorage(storage)
    const progress: ActivityProgress = {
      profileId: 'student-a',
      activityId: matchActivity.id,
      status: 'completed',
      attempts: 2,
      updatedAt: '2026-09-04T00:00:00.000Z',
      completedAt: '2026-09-04T00:01:00.000Z',
    }
    repository.upsert(progress)

    expect(repository.get('student-a', matchActivity.id)).toEqual(progress)
    expect(repository.get('student-b', matchActivity.id)).toBeNull()
    expect(
      JSON.parse(storage.getItem('knowledge-island.interactive-activity-progress') ?? '{}'),
    ).toMatchObject({ schemaVersion: 1 })
    repository.clearProfile('student-a')
    expect(repository.get('student-a', matchActivity.id)).toBeNull()
  })

  it('falls back safely when progress storage is corrupt', () => {
    const storage = memoryStorage()
    storage.setItem('knowledge-island.interactive-activity-progress', '{broken')
    const repository = createInteractiveActivityStorage(storage)

    expect(repository.load()).toEqual({ schemaVersion: 1, progress: [] })
    expect(repository.getLastWarning()).toContain('损坏')
    expect(storage.getItem('knowledge-island.interactive-activity-progress')).toBeNull()
  })
})

describe('Interactive activity renderers', () => {
  it('completes drag matching through pointer-friendly button actions', async () => {
    const wrapper = mount(DragMatchActivity, { props: { activity: matchActivity } })
    const sources = wrapper.findAll('section').at(0)?.findAll('button') ?? []
    const targets = wrapper.findAll('section').at(1)?.findAll('button') ?? []
    const targetById = new Map(
      matchActivity.config.targets.map((target, index) => [target.id, targets[index]]),
    )
    for (const match of matchActivity.config.matches) {
      await sources[
        matchActivity.config.sources.findIndex((source) => source.id === match.sourceId)
      ]?.trigger('click')
      await targetById.get(match.targetId)?.trigger('click')
    }
    expect(wrapper.emitted('complete')?.[0]?.[0]).toMatchObject({ status: 'completed' })
  })

  it('allows select-region activities to be completed with visible buttons', async () => {
    const wrapper = mount(SelectRegionActivity, { props: { activity: regionActivity } })
    const buttons = wrapper.findAll('.region-board__button')
    await buttons[0]?.trigger('click')
    await buttons[2]?.trigger('click')
    await wrapper.find('.activity-check-button').trigger('click')
    expect(wrapper.emitted('complete')?.[0]?.[0]).toMatchObject({ status: 'completed' })
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true')
  })
})

describe('Knowledge challenge reference thinking', () => {
  it('shows original reference thinking only after a response is submitted', async () => {
    const challenge = candidateContentExpansionBundles[0]?.challenges[0]
    if (!challenge) throw new Error('Chinese candidate challenge is missing')
    const wrapper = mount(KnowledgeChallengeCard, {
      props: {
        challengeId: challenge.id,
        title: challenge.title,
        prompt: challenge.instruction,
        hint: '提示',
        referenceAnswer: challenge.referenceAnswer,
      },
    })

    expect(wrapper.text()).not.toContain(challenge.referenceAnswer)
    await wrapper.find('textarea').setValue('我的回答')
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('参考思路')
    expect(wrapper.text()).toContain(challenge.referenceAnswer)
  })
})

describe('Exercise Template Engine', () => {
  const templates = goldenContentExpansionBundles.flatMap((bundle) => bundle.exerciseTemplates)

  it('validates every Golden template and generates stable IDs for every type', () => {
    const types = new Set<ExerciseTemplate['templateType']>()
    for (const template of templates) {
      types.add(template.templateType)
      const count =
        template.templateType === 'addition_range' || template.templateType === 'subtraction_range'
          ? 6
          : 4
      const instances = generateExerciseInstances(template, 'seed-a', count)
      const report = validateGeneratedExerciseInstances(template, instances)
      expect(report.valid, report.issues.join('; ')).toBe(true)
      expect(new Set(instances.map((instance) => instance.id)).size).toBe(instances.length)
      expect(
        instances.every(
          (instance) => instance.isSample && instance.verificationStatus === 'UNVERIFIED',
        ),
      ).toBe(true)
    }
    expect(types).toEqual(
      new Set([
        'addition_range',
        'subtraction_range',
        'compare_numbers',
        'missing_number',
        'number_order',
        'picture_count',
        'word_problem_simple',
        'equation_match',
      ]),
    )
  })

  it('is deterministic for the same seed and changes with a different seed', () => {
    const template = templates.find((item) => item.templateType === 'addition_range')
    if (!template) throw new Error('Addition template is missing')
    expect(generateExerciseInstances(template, 'same-seed', 5)).toEqual(
      generateExerciseInstances(template, 'same-seed', 5),
    )
    expect(generateExerciseInstances(template, 'same-seed', 5)).not.toEqual(
      generateExerciseInstances(template, 'other-seed', 5),
    )
  })

  it('validates a large sample without storing it and adapts instances with provenance', () => {
    const template = templates.find((item) => item.templateType === 'picture_count')
    if (!template) throw new Error('Picture template is missing')
    const instances = generateExerciseInstances(template, 'large-sample', 1000)
    expect(validateGeneratedExerciseInstances(template, instances).valid).toBe(true)
    const adapted = adaptExerciseInstance(instances[0] as (typeof instances)[number])
    expect(adapted.provenance.marker).toBe('GENERATED_FROM_VERIFIED_TEMPLATE')
    expect(adapted.question.sourceId).toBe('GENERATED_FROM_VERIFIED_TEMPLATE')
    expect(adapted.question.isSample).toBe(true)
  })

  it('allows production generation only for reviewed, non-sample templates', () => {
    const template = templates[0]
    if (!template) throw new Error('Template fixture is missing')
    expect(isProductionExerciseTemplate(template)).toBe(false)
    expect(
      isProductionExerciseTemplate({
        ...template,
        isSample: false,
        verificationStatus: 'REVIEWED',
      }),
    ).toBe(true)
  })
})

describe('Practice integration boundary', () => {
  it('builds a generated QuestionSession without changing Mastery or Strategy contracts', async () => {
    const practice = countBundle.practiceSets[0]
    if (!practice) throw new Error('Practice fixture is missing')
    const generated = await practiceService.buildGeneratedPracticeSession({
      practiceSetId: practice.id,
      context: {
        textbookId: countBundle.textbookId,
        unitId: countBundle.unitId,
        lessonId: countBundle.lessonId,
        knowledgePointId: countBundle.knowledgePointId,
        source: 'dev',
      },
      studentId: 'student-generated',
      seed: 'session-seed',
      count: 3,
      dataset: 'golden',
    })
    expect(generated.session.id).toContain('session-seed')
    expect(generated.definition.questionIds).toEqual(
      generated.questions.map((question) => question.id),
    )
    expect(generated.questionKnowledgePoints.every((mapping) => mapping.weight === 1)).toBe(true)
    expect(
      generated.questions.every(
        (question) => question.sourceId === 'GENERATED_FROM_VERIFIED_TEMPLATE',
      ),
    ).toBe(true)
  })

  it('can use an isolated repository for content migration tests', async () => {
    const repository = new StaticContentExpansionRepository(
      goldenContentExpansionBundles.slice(0, 1),
    )
    expect(await repository.listBundles('golden')).toHaveLength(1)
    expect(await repository.getBundle('MISSING_KP', 'golden')).toBeNull()
  })
})
