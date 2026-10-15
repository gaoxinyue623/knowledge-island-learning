<script setup lang="ts">
import LessonSourceNotes from '@/components/lesson-player/LessonSourceNotes.vue'
import {
  G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  gradeFourEnglishUpperDefinitions,
  gradeFourEnglishUpperReadingOnlyIds,
} from '@/data/curriculum/grade-4/english-shanghai-upper-2022'
import {
  G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  gradeFiveEnglishLowerDefinitions,
  gradeFiveEnglishLowerProjectIds,
} from '@/data/curriculum/grade-5/english-shanghai-lower'
import {
  G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  gradeSixEnglishLowerDefinitions,
  gradeSixEnglishLowerProjectIds,
} from '@/data/curriculum/grade-6/english-shanghai-lower'
import {
  G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  gradeSixEnglishUpperDefinitions,
  gradeSixEnglishUpperProjectIds,
} from '@/data/curriculum/grade-6/english-shanghai-upper-2022'
import {
  G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  gradeFiveEnglishUpperDefinitions,
  gradeFiveEnglishUpperProjectIds,
} from '@/data/curriculum/grade-5/english-shanghai-upper-2022'
import {
  G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  gradeFourEnglishLowerDefinitions,
  gradeFourEnglishLowerProjectIds,
} from '@/data/curriculum/grade-4/english-shanghai-lower-2022'
import {
  G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  gradeThreeEnglishLowerDefinitions,
  gradeThreeEnglishLowerProjectIds,
} from '@/data/curriculum/grade-3/english-shanghai-lower-2022'
import {
  G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  gradeThreeEnglishUpperDefinitions,
  gradeThreeEnglishUpperProjectIds,
} from '@/data/curriculum/grade-3/english-shanghai-upper-2022'
import { G6_BNU_MATH_S2_TEXTBOOK_ID } from '@/data/curriculum/grade-6/math-bnu-lower-2013'
import { G6_BNU_MATH_S1_TEXTBOOK_ID } from '@/data/curriculum/grade-6/math-bnu-upper-2022'
import { G5_BNU_MATH_S2_TEXTBOOK_ID } from '@/data/curriculum/grade-5/math-bnu-lower-2013'
import { G5_BNU_MATH_S1_TEXTBOOK_ID } from '@/data/curriculum/grade-5/math-bnu-upper'
import { G4_BNU_MATH_S2_TEXTBOOK_ID } from '@/data/curriculum/grade-4/math-bnu-lower'
import { G4_BNU_MATH_S1_TEXTBOOK_ID } from '@/data/curriculum/grade-4/math-bnu-upper-2022'
import { G3_BNU_MATH_S2_TEXTBOOK_ID } from '@/data/curriculum/grade-3/math-bnu-lower-2022'
import { G3_BNU_MATH_S1_TEXTBOOK_ID } from '@/data/curriculum/grade-3/math-bnu-upper-2022'
import {
  G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID,
  gradeSixChinese2019LowerReadingOnlyIds,
  gradeSixChinese2019LowerAppendixIds,
} from '@/data/curriculum/grade-6/chinese-pep-lower-2019'
import {
  G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID,
  gradeSixChinese2019ReadingOnlyIds,
  gradeSixChinese2019AppendixIds,
} from '@/data/curriculum/grade-6/chinese-pep-upper-2019'
import {
  G6_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeSixChineseReadingOnlyIds,
  gradeSixChineseAppendixIds,
} from '@/data/curriculum/grade-6/chinese-pep-upper'
import {
  G5_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeFiveChineseLowerReadingOnlyIds,
  gradeFiveChineseLowerAppendixIds,
} from '@/data/curriculum/grade-5/chinese-pep-lower'
import {
  G5_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeFiveChineseReadingOnlyIds,
  gradeFiveChineseAppendixIds,
} from '@/data/curriculum/grade-5/chinese-pep-upper'
import {
  G4_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeFourChineseLowerReadingOnlyIds,
  gradeFourChineseLowerAppendixIds,
} from '@/data/curriculum/grade-4/chinese-pep-lower'
import {
  G4_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeFourChineseReadingOnlyIds,
  gradeFourChineseAppendixIds,
} from '@/data/curriculum/grade-4/chinese-pep-upper'
import {
  G3_PEP_CHINESE_S2_TEXTBOOK_ID,
  gradeThreeChineseLowerReadingOnlyIds,
} from '@/data/curriculum/grade-3/chinese-pep-lower'
import { G3_PEP_CHINESE_S1_TEXTBOOK_ID } from '@/data/curriculum/grade-3/chinese-pep-upper'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PoetryLearningGuide from '@/components/lesson-player/PoetryLearningGuide.vue'
import LearningPath from '@/components/student-growth/LearningPath.vue'
import FormalAiPractice from '@/components/knowledge-point/FormalAiPractice.vue'
import { englishSyncSourceSheet } from '@/data/curriculum/grade-2/shenzhen-english-lower/synchronousExercises'
import { G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID } from '@/data/curriculum/grade-2/shenzhen-english-lower'
import {
  synchronousPracticeForLesson,
  synchronousPracticeNotice,
} from '@/services/curriculum/synchronousPractice'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import InteractiveActivityRenderer from '@/components/interactive-activity/InteractiveActivityRenderer.vue'
import KnowledgeChallengeCard from '@/components/knowledge-point/KnowledgeChallengeCard.vue'
import QuestTraining from '@/components/knowledge-point/QuestTraining.vue'
import LessonReadingPanel from '@/components/lesson-player/LessonReadingPanel.vue'
import ReadingEntry from '@/components/reading-islands/ReadingEntry.vue'
import {
  isEnglishPilotTextbook,
  isMathPilotTextbook,
  isPilotTextbook,
} from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { contentExpansionRepository, practiceModeLabel } from '@/services/content-expansion'
import { createReadingQuest, questReadingText } from '@/services/content-expansion/readingQuest'
import { questionEngineAdapter } from '@/services/question-engine'
import { lessonProgressPresentation } from '@/services/lesson-player/lessonProgressPresentation'
import { useLessonPlayerStore } from '@/stores/lessonPlayerStore'
import { useMasteryStore } from '@/stores/masteryStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useStudentStore } from '@/stores/studentStore'
import type {
  ActivityResult,
  AssessmentLaunchContext,
  Challenge,
  ContentExpansionBundle,
  ExtensionActivity,
  Id,
  LearningNodeStatus,
  LessonContentBlockViewModel,
  LessonLaunchContext,
  LessonPlayerDataset,
  SubjectCode,
  StructuredContent,
} from '@/types'

interface DetailChallenge {
  id: Id
  title: string
  prompt: string
  hint?: string
  referenceAnswer?: string
  eyebrow?: string
}

const DEFAULT_DEMO_CONTEXT: LessonLaunchContext = {
  textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
  unitId: 'DEMO_UNIT_01',
  lessonId: 'DEMO_LESSON_1_1',
  knowledgePointId: 'DEMO_KP_01',
}

const NODE_STATUS_LABELS: Record<LearningNodeStatus, string> = {
  locked: '尚未解锁',
  available: '可以开始',
  learning: '学习中',
  completed: '已完成',
  mastered: '已完成强化',
  perfect: '完成状态',
}

const MASTERY_STATE_LABELS = {
  not_started: '还没开始',
  learning: '正在掌握',
  weak: '需要巩固',
  mastered: '已经掌握',
} as const

const route = useRoute()
const router = useRouter()
const lessonPlayerStore = useLessonPlayerStore()
const masteryStore = useMasteryStore()
const studentStore = useStudentStore()
const preferencesStore = usePreferencesStore()

const primaryActionsVisible = ref(true)
let actionObserver: IntersectionObserver | undefined
onBeforeUnmount(() => actionObserver?.disconnect())
const invalidContextMessage = ref<string | null>(null)
const detailError = ref<string | null>(null)
const detailLoading = ref(false)
const practiceAvailable = ref<boolean | null>(null)
const expansionBundle = ref<ContentExpansionBundle | null>(null)
const selectedActivityId = ref<Id | null>(null)
const lastActivityMessage = ref<string | null>(null)
let loadToken = 0

const isDevRoute = computed(() => route.path.startsWith('/dev/knowledge-point'))
const knowledgePointId = computed(() => String(route.params.knowledgePointId ?? ''))
const isEnglishReview = computed(
  () =>
    (context.value?.textbookId === G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID &&
      knowledgePointId.value === 'G4_SHANGHAI_ENGLISH_S1_KP_09') ||
    (context.value?.textbookId === G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID &&
      knowledgePointId.value === 'G5_SHANGHAI_ENGLISH_S1_KP_11') ||
    (context.value?.textbookId === G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID &&
      knowledgePointId.value === 'G4_SHANGHAI_ENGLISH_S2_KP_11') ||
    (context.value?.textbookId === G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID &&
      knowledgePointId.value === 'G3_SHANGHAI_ENGLISH_S2_KP_11'),
)
const isEnglishDirectoryOnly = computed(
  () =>
    context.value?.textbookId === G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID &&
    gradeFiveEnglishLowerDefinitions.some(
      (d) =>
        d.kind === 'directory' &&
        d.missingSections.length > 0 &&
        d.knowledgePointId === knowledgePointId.value,
    ),
)
const isEnglishModuleReview = computed(
  () =>
    context.value?.textbookId === G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID &&
    gradeFiveEnglishLowerDefinitions.some(
      (d) =>
        d.sections.some((s) => s.kind === 'revision') &&
        d.knowledgePointId === knowledgePointId.value,
    ),
)
const isEnglishAppendix = computed(
  () =>
    (context.value?.textbookId === G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID &&
      gradeFiveEnglishLowerDefinitions.some(
        (d) => d.moduleNumber === 5 && d.knowledgePointId === knowledgePointId.value,
      )) ||
    (context.value?.textbookId === G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID &&
      gradeSixEnglishLowerDefinitions.some(
        (d) => d.kind === 'appendix' && d.knowledgePointId === knowledgePointId.value,
      )) ||
    (context.value?.textbookId === G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID &&
      gradeSixEnglishUpperDefinitions.some(
        (d) => d.kind === 'appendix' && d.knowledgePointId === knowledgePointId.value,
      )),
)
const isEnglishProject = computed(
  () =>
    [
      G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    ].includes(context.value?.textbookId ?? '') &&
    [
      ...gradeFourEnglishUpperDefinitions,
      ...gradeFiveEnglishLowerDefinitions,
      ...gradeSixEnglishLowerDefinitions,
      ...gradeSixEnglishUpperDefinitions,
      ...gradeFiveEnglishUpperDefinitions,
      ...gradeFourEnglishLowerDefinitions,
      ...gradeThreeEnglishUpperDefinitions,
      ...gradeThreeEnglishLowerDefinitions,
    ].some((d) => d.kind === 'project' && d.knowledgePointId === knowledgePointId.value),
)
const isImportedOpenActivity = computed(
  () =>
    [
      ...gradeFourEnglishUpperReadingOnlyIds,
      ...gradeFiveEnglishLowerProjectIds,
      ...gradeSixEnglishLowerProjectIds,
      ...gradeSixEnglishUpperProjectIds,
      ...gradeFiveEnglishUpperProjectIds,
      ...gradeFourEnglishLowerProjectIds,
      ...gradeThreeEnglishLowerProjectIds,
      ...gradeThreeEnglishUpperProjectIds,
      ...gradeFourChineseReadingOnlyIds,
      ...gradeFourChineseLowerReadingOnlyIds,
      ...gradeFiveChineseReadingOnlyIds,
      ...gradeSixChineseReadingOnlyIds,
      ...gradeSixChinese2019ReadingOnlyIds,
      ...gradeSixChinese2019LowerReadingOnlyIds,
      ...gradeFiveChineseLowerReadingOnlyIds,
    ].includes(knowledgePointId.value) &&
    ![
      ...gradeFourChineseAppendixIds,
      ...gradeFourChineseLowerAppendixIds,
      ...gradeFiveChineseAppendixIds,
      ...gradeSixChineseAppendixIds,
      ...gradeSixChinese2019AppendixIds,
      ...gradeSixChinese2019LowerAppendixIds,
      ...gradeFiveChineseLowerAppendixIds,
    ].includes(knowledgePointId.value),
)
const isLiteracyAppendix = computed(
  () =>
    gradeThreeChineseLowerReadingOnlyIds.includes(knowledgePointId.value) ||
    gradeFourChineseAppendixIds.includes(knowledgePointId.value) ||
    gradeFourChineseLowerAppendixIds.includes(knowledgePointId.value) ||
    gradeFiveChineseAppendixIds.includes(knowledgePointId.value) ||
    gradeSixChineseAppendixIds.includes(knowledgePointId.value) ||
    gradeSixChinese2019AppendixIds.includes(knowledgePointId.value) ||
    gradeSixChinese2019LowerAppendixIds.includes(knowledgePointId.value) ||
    gradeFiveChineseLowerAppendixIds.includes(knowledgePointId.value),
)

function queryString(key: string): string | null {
  const value = route.query[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

const dataset = computed<LessonPlayerDataset>(() => {
  if (!isDevRoute.value) return 'profile'
  const requested = queryString('dataset')
  return requested === 'demo' || requested === 'golden' || requested === 'profile'
    ? requested
    : 'demo'
})

const context = computed<LessonLaunchContext | null>(() => {
  const values = {
    textbookId: queryString('textbookId'),
    unitId: queryString('unitId'),
    lessonId: queryString('lessonId'),
    knowledgePointId: queryString('knowledgePointId'),
  }
  const hasAnyContextValue = Object.values(values).some(Boolean)
  if (
    Object.values(values).every((value): value is string => typeof value === 'string') &&
    values.knowledgePointId === knowledgePointId.value
  ) {
    return values as LessonLaunchContext
  }
  if (!hasAnyContextValue && isDevRoute.value && knowledgePointId.value === 'DEMO_KP_01') {
    return DEFAULT_DEMO_CONTEXT
  }
  return null
})

const { profileId: learningProfileId } = useLearningProfile()
const profileId = computed(() =>
  isDevRoute.value ? (studentStore.profile?.id ?? 'local-profile') : learningProfileId.value,
)

const returnPath = computed(() => {
  const requested = queryString('returnTo')
  const allowed = ['/home', '/tasks', '/dev/home', '/learning-map', '/dev/learning-map']
  if (
    requested &&
    (allowed.includes(requested) || /^\/(?:dev\/)?knowledge-point\/[^/]+$/.test(requested))
  ) {
    return requested
  }
  return isDevRoute.value ? '/dev/learning-map' : '/learning-map'
})
const mapSubject = computed<SubjectCode | null>(() => {
  const requested = queryString('subject')?.toUpperCase()
  return requested === 'CHINESE' || requested === 'MATH' || requested === 'ENGLISH'
    ? requested
    : null
})

const returnLabel = computed(() =>
  ['/home', '/tasks', '/dev/home'].includes(returnPath.value) ? '返回首页' : '返回知识地图',
)

const mapNodeId = computed(() => queryString('mapNodeId'))
const detailPath = computed(
  () =>
    `${isDevRoute.value ? '/dev' : ''}/knowledge-point/${encodeURIComponent(knowledgePointId.value)}`,
)

const viewModel = computed(() => lessonPlayerStore.viewModel)
const knowledgePointDescription = computed(() => {
  const description = viewModel.value?.knowledgePoint.description?.trim()
  if (!description || isEditorialSourceText(description)) {
    return '先阅读内容，再用自己的话说出一个发现。'
  }
  return description
})
const lessonProgress = computed(() => {
  const loaded = viewModel.value?.context
  const matches =
    context.value &&
    loaded &&
    ['textbookId', 'unitId', 'lessonId', 'knowledgePointId'].every(
      (key) =>
        loaded[key as keyof LessonLaunchContext] ===
        context.value?.[key as keyof LessonLaunchContext],
    ) &&
    lessonPlayerStore.activeStudentId === profileId.value &&
    lessonPlayerStore.dataset === dataset.value
  return lessonProgressPresentation(
    matches ? viewModel.value?.session : undefined,
    queryString('nodeStatus') === 'locked',
  )
})
const nodeStatus = computed(() => lessonProgress.value.status)
const nodeProgress = computed(() => lessonProgress.value.progress)
const isFormalPilot = computed(() => isPilotTextbook(context.value?.textbookId))
const isEnglishSubject = computed(() => isEnglishPilotTextbook(context.value?.textbookId))
const isMathSubject = computed(() => isMathPilotTextbook(context.value?.textbookId))
const synchronousPractice = computed(() => synchronousPracticeForLesson(context.value))
const unitPracticeNotice = computed(() => synchronousPracticeNotice(synchronousPractice.value))
const visiblePracticeSets = computed(() => {
  const sets = [...(expansionBundle.value?.practiceSets ?? [])]
  if (synchronousPractice.value && !sets.some((p) => p.id === synchronousPractice.value!.id))
    sets.unshift(synchronousPractice.value)
  return sets
})
const masteryRecord = computed(() => masteryStore.getByKnowledgePoint(knowledgePointId.value))
const canShowDetail = computed(
  () =>
    Boolean(viewModel.value) &&
    ['ready', 'completed'].includes(lessonPlayerStore.status) &&
    !invalidContextMessage.value,
)
const pageError = computed(
  () =>
    invalidContextMessage.value ??
    detailError.value ??
    (lessonPlayerStore.status === 'error' ? lessonPlayerStore.error : null),
)

const contentBlocks = computed<LessonContentBlockViewModel[]>(() => {
  const blocks = viewModel.value?.steps.flatMap((step) => step.contentBlocks) ?? []
  return blocks.sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
})

const readingQuest = computed(() =>
  createReadingQuest({
    bundle: expansionBundle.value,
    title: viewModel.value?.lesson.title ?? '',
    text: questReadingText(contentBlocks.value),
  }),
)

const contentChallenge = computed<DetailChallenge>(() => {
  const practiceBlock = contentBlocks.value.find((block) =>
    block.content?.trim().startsWith('小练习：'),
  )
  const prompt = practiceBlock?.content?.replace(/^小练习：\s*/, '').trim()
  const firstGoal = viewModel.value?.learningGoals[0]
  return {
    id: `${knowledgePointId.value || 'knowledge-point'}:content-challenge`,
    title: '说说你的发现',
    prompt:
      prompt ||
      `用自己的话说一说：${firstGoal || viewModel.value?.knowledgePoint.name || '你今天学到的内容'}`,
    hint:
      firstGoal ||
      viewModel.value?.knowledgePoint.description ||
      '先说出你观察到的对象，再说出你的发现。',
    eyebrow: '阅读后挑战',
  }
})

const transferChallenge = computed<DetailChallenge>(() => ({
  id: `${knowledgePointId.value || 'knowledge-point'}:transfer-challenge`,
  title: '把知识用起来',
  prompt: `不看提示，用一句完整的话说说“${viewModel.value?.lesson.title || '这一课'}”和你的生活有什么联系。`,
  hint: '可以先说出一个身边的对象，再说出你发现的相同点或不同点。',
  eyebrow: '生活连接',
}))

function structuredContentText(
  content: StructuredContent,
  type?: StructuredContent['blocks'][number]['type'],
): string {
  return content.blocks
    .filter((block) => !type || block.type === type)
    .map((block) => block.value.trim())
    .filter(Boolean)
    .join(' · ')
}

function expansionChallenge(record: Challenge | ExtensionActivity): DetailChallenge {
  const contentText = structuredContentText(record.content, 'text')
  const hint = structuredContentText(record.content, 'hint')
  return {
    id: record.id,
    title: record.title,
    prompt: record.instruction,
    ...(record.referenceAnswer ? { referenceAnswer: record.referenceAnswer } : {}),
    ...(hint || contentText
      ? { hint: hint || `可以先写下：${contentText}` }
      : { hint: '先说出你的方法，再检查每一步是否清楚。' }),
    eyebrow: record.id.includes('EXTENSION') ? '生活拓展' : '知识挑战',
  }
}

const challengeCards = computed<DetailChallenge[]>(() => {
  const bundle = expansionBundle.value
  if (!bundle) return [contentChallenge.value, transferChallenge.value]
  const records = [...bundle.challenges, ...bundle.extensionActivities].sort((left, right) =>
    left.id.localeCompare(right.id),
  )
  return records.length ? records.map(expansionChallenge) : [contentChallenge.value]
})

const activities = computed(() =>
  [...(expansionBundle.value?.activities ?? [])].sort(
    (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
  ),
)
const selectedActivity = computed(
  () => activities.value.find((activity) => activity.id === selectedActivityId.value) ?? null,
)

const lessonActionLabel = computed(() => {
  const status = viewModel.value?.session.status
  if (status === 'completed') return '回看课程'
  if (status === 'in_progress') return '继续学习'
  return '先学一学'
})

const masteryStateLabel = computed(() =>
  masteryRecord.value ? MASTERY_STATE_LABELS[masteryRecord.value.state] : '',
)

function isEditorialSourceText(text: string): boolean {
  return (
    /(?:用户.{0,12}(?:提供|附件|标注|确认|上传)|来稿|附件|来源说明|来源\s*[:：])/.test(text) &&
    /(?:接入|整理|学习|保留|核对|核验|版次|出版社原版|原版)/.test(text)
  )
}

function sourceNotice(): string {
  if (viewModel.value?.flags.isDemo)
    return '这是开发样本，用来验证详情页和挑战组件，不代表正式教材内容。'
  if (viewModel.value?.flags.isSample) return '这是示例内容，只用于开发验证。'
  if (isFormalPilot.value) {
    if (context.value?.textbookId === G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID)
      return '下面展示本课原文和配套学习活动，读一读，再完成下面的挑战。'
    if (context.value?.textbookId === G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID)
      return '六年级上册2019版已接入第1—8单元所提供内容及字词表。第六单元已更正为18《古诗三首》、19《只有一个地球》、20《青山不老》、21《三黑和土地》；第17项《盼》引用本版第15课，供习作阅读。理解题为原创配套内容，导语、习作、口语交际、园地和附录不自动判分。'
    if (context.value?.textbookId === G6_PEP_CHINESE_S1_TEXTBOOK_ID)
      return '六年级上册2022版已接入附件提供的八个单元、习作例文和字词表。按附件顺序学习，理解题为原创配套内容；第22课已按提供的三页教材图片补齐并校正。开放栏目和字词附录不自动判分。2022年份沿用用户标注；来稿目录与人教社2022年同步字词手册的公开目录不同，仍需对照原书版权页和目录核对版次。'
    if (context.value?.textbookId === G5_PEP_CHINESE_S2_TEXTBOOK_ID)
      return '2019版五年级下册已接入附件提供的八个单元和字词附录，并补入习作例文、口语交际和习作正文。快乐读书吧已按两张教材图片补齐；2019年份由用户明确确认。理解题为原创配套内容；综合性学习、开放栏目和字词附录不自动判分，尚缺的材料或图片已有说明。'
    if (context.value?.textbookId === G5_PEP_CHINESE_S1_TEXTBOOK_ID)
      return '五年级上册已接入附件提供的八个单元、习作例文和字词表，按附件篇目顺序学习。理解题为原创配套内容；导语、开放栏目和字词附录不自动判分，字词表数量差异已注明。'
    if (context.value?.textbookId === G4_PEP_CHINESE_S2_TEXTBOOK_ID)
      return '四年级下册已接入附件提供的八个单元、习作例文及字词附录。理解题为原创配套内容；开放栏目和字词附录不自动判分，文本疑点在对应内容中注明。'
    if (context.value?.textbookId === G4_PEP_CHINESE_S1_TEXTBOOK_ID)
      return '四年级上册已接入第一至第八单元及字词附录，按附件提供的篇目和文本学习。课文理解题为原创配套内容，口语交际、习作、园地、读书吧和字词附录不自动判分。'
    if (context.value?.textbookId === G4_BNU_MATH_S2_TEXTBOOK_ID)
      return '四年级下册按本次提供的知识点整理，包含六个单元、数学好玩和总复习，并配有单元同步自测。讲解与基础题为原创配套；竖式、解方程过程、画图等由老师或家长核对。来稿未注明年份及页码。'
    if (context.value?.textbookId === G5_BNU_MATH_S1_TEXTBOOK_ID)
      return '五年级上册按本次提供的知识点整理，包含八个单元、两项综合实践、数学好玩和总复习，并配有11组单元自测。讲解与基础题为原创配套；竖式、解方程过程、公式表达、画图等由老师或家长核对。来稿未注明年份及页码。'
    if (context.value?.textbookId === G5_BNU_MATH_S2_TEXTBOOK_ID)
      return '五年级下册按用户标注的北师大2013版知识点整理，包含八个单元、数学好玩和总复习，并配有9组单元自测。讲解与基础题为原创配套；过程、公式、简答及拓展题由老师或家长核对。版本年份来自附件，来稿未提供页码。'
    if (context.value?.textbookId === G6_BNU_MATH_S1_TEXTBOOK_ID)
      return '六年级上册按用户标注的北师大2022新课标修订版知识点整理，包含九个单元、两项综合实践、数学好玩和总复习，并配有12组单元自测。讲解与基础题为原创配套；过程、公式及开放任务由老师或家长核对。版本年份来自附件，来稿未提供页码。'
    if (context.value?.textbookId === G6_BNU_MATH_S2_TEXTBOOK_ID)
      return '六年级下册按用户标注的北师大2013版知识点整理，包含四个单元、数学好玩、整理与复习、总复习，并配有5组单元自测。讲解与基础题为原创配套；公式、解题过程及开放回答由老师或家长核对。版本年份来自用户提供材料，未提供页码。'
    if (context.value?.textbookId === G4_BNU_MATH_S1_TEXTBOOK_ID)
      return '四年级上册按提供的2022新课标修订知识点整理，包含八个单元、编码、数图形、导航实践和总复习。专题配有原创讲解与练习；画图、设计和数据采集不自动判分，专题标题不代表教材原有课名。'
    if (context.value?.textbookId === G3_BNU_MATH_S2_TEXTBOOK_ID)
      return '三年级下册按提供的2022新课标修订知识点整理，包含七个单元、综合实践、图书排序和总复习。学习专题配有原创讲解与练习；操作和表达活动不自动判分，专题标题不代表教材原有课名。'
    if (context.value?.textbookId === G3_BNU_MATH_S1_TEXTBOOK_ID)
      return '本册按提供的2022新课标修订目录与知识重点整理，包含八个单元、综合实践、数学好玩和总复习。展示知识提要与原创配套讲解、练习；操作和表达活动不自动判分。'
    if (isMathSubject.value)
      return '已接入所选北师大版数学教材的知识讲解与原创配套练习。先理解方法，再动手闯关；二年级下册按所选旧版或新版目录学习。'
    if (context.value?.textbookId === G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID)
      return '《英语口语交际》二年级下册按用户目录登记为广东省2025复审版·深圳2026春，已接入六个单元及补充栏目。Unit 5 Extend已调整为身边的英雄，Unit 6 Chant已调整为农场与狼的歌谣；Unit 2语音例词疑点在对应页注明。基础练习为项目原创，活动任务不自动判分。'
    if (context.value?.textbookId === G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID)
      return '本册按用户提供的沪教牛津四年级上册2022版双语文本整理，词汇、音标、句型与配套题已接入。两个Project已接入：Places near my home与A fancy party，包含思考、制作、示范介绍和课堂分享；开放作品不自动判分，基础闯关为项目原创。'
    if (context.value?.textbookId === G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID)
      return '本册登记为沪教牛津五年级下册（三年级起点·2013版），年份由用户明确确认。已补入Unit 10—12的句型和语音示例、Revision 1—3的复习提要与任务、Project 1—4及四个附录栏目。Project 1—3按最新来稿展示变化、假期计划和校园开放日；双语课文和原有练习保留，基础闯关为项目原创。'
    if (context.value?.textbookId === G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID)
      return '本册按用户明确确认登记为沪教牛津六年级下册（三年级起点·2013版，深圳用）。4个Module、12个Unit、4个Project及6个附录已接入；Unit 12句子语调规则、4个示例句和3个练习句已补齐，升降调以文字标记为准。跟读为设备合成语音；错位原句附核对说明，基础训练与补充表达为项目原创，未独立核对出版社原页。'
    if (context.value?.textbookId === G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID)
      return '本册按来稿登记为沪教版六年级上册2022课标修订版。Unit 1—6已加入用户提供的Communicate听力文本、口语对话与写作任务，可听读并进行开放表达。Unit 4—6已按最新修正稿替换为力与运动、简易发明和临水城市，并展示填空答案与匹配。单元页码和原版录音未提供；基础练习为项目原创，开放表达由老师或家长核对，未独立核对出版社原页。'
    if (context.value?.textbookId === G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID)
      return '本册按用户提供的沪教牛津五年级上册2022版双语文本整理，词汇、音标、句型、语音栏目、Project与配套题已接入。基础闯关为项目原创；来稿未提供原版示范音频。'
    if (context.value?.textbookId === G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID)
      return isEnglishProject.value
        ? '用学过的词句制作作息或职业海报并交流，作品不自动判分。'
        : '本册目录包含8个Unit、Project 1与Project 2，以及Unit checklist和Word list。单元目录列出Get ready、Explore、Communicate和Extend*，可据此安排学习与复习；语音补充资料独立列在册末。'
    if (context.value?.textbookId === G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID)
      return isEnglishProject.value
        ? '运用已学词句制作海报并交流，作品不自动判分。'
        : '本册按用户提供的沪教牛津2022版下册文本整理，保留音标、双语课文、句型和Sounds字母范围。配套练习在单独入口完成，基础闯关为项目原创。综合练习栏目可直接打开配套练习。'
    if (context.value?.textbookId === G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID)
      return isEnglishProject.value
        ? '运用已学英语制作作品并交流。本栏目为开放活动，不自动判分。'
        : '本册按用户提供的沪教牛津2022版双语文本学习，年份和页码沿用来稿。词汇、课文与中文翻译已接入，配套练习为项目原创。'
    if (isEnglishSubject.value) {
      return '已接入沪教版英语课文与配套拓展练习。拓展练习用于帮助理解，不会直接修改掌握度。'
    }
    if (context.value?.textbookId === G3_PEP_CHINESE_S2_TEXTBOOK_ID)
      return isLiteracyAppendix.value
        ? '三张字词表已按8页教材图片补齐，保留原图课号、语文园地分组和条目顺序。识字表逐字标注拼音，蓝色为图片中的多音字；写字表250字，词语表271词。可展开原图对照。'
        : '本册按附件提供的单元顺序与文本学习，标题调整已有说明。阅读练习为原创配套内容，开放表达不自动判分。'
    if (context.value?.textbookId === G3_PEP_CHINESE_S1_TEXTBOOK_ID)
      return '本册按已导入的目录和文本学习，口语交际、习作、语文园地及快乐读书吧已补入用户提供内容；《小狗学叫》按最新来稿展示全文和三个结局。阅读练习为原创配套内容，开放表达不自动判分。'
    return '已接入人教版语文课文与配套拓展练习。拓展练习用于帮助理解，不会直接修改掌握度。'
  }
  if (viewModel.value?.flags.isUnverified) {
    return '当前内容已经接入课程库，但仍需完成内容审核；正式教材原文需要在获得授权后开放。'
  }
  return '当前内容来自已接入的课程内容库。'
}

async function checkPracticeAvailability(activeContext: LessonLaunchContext): Promise<void> {
  const assessmentContext: AssessmentLaunchContext = {
    ...activeContext,
    source: isDevRoute.value ? 'dev' : 'lesson_practice',
  }
  try {
    practiceAvailable.value = await questionEngineAdapter.getAssessmentAvailability(
      assessmentContext,
      { dataset: dataset.value, studentId: profileId.value },
    )
  } catch {
    practiceAvailable.value = false
  }
}

async function loadDetail(): Promise<void> {
  const token = ++loadToken
  invalidContextMessage.value = null
  detailError.value = null
  practiceAvailable.value = null
  expansionBundle.value = null
  selectedActivityId.value = null
  lastActivityMessage.value = null

  const activeContext = context.value
  if (!activeContext) {
    detailLoading.value = false
    invalidContextMessage.value = '请从知识地图进入一个有效的知识点。'
    return
  }

  detailLoading.value = true
  try {
    await Promise.all([
      lessonPlayerStore.loadLesson(activeContext, {
        dataset: dataset.value,
        studentId: profileId.value,
      }),
      masteryStore.load(profileId.value),
    ])
    if (token !== loadToken) return

    if (['ready', 'completed'].includes(lessonPlayerStore.status)) {
      const expansionDataset = dataset.value === 'profile' ? 'profile' : 'golden'
      expansionBundle.value = await contentExpansionRepository.getBundle(
        activeContext.knowledgePointId,
        expansionDataset,
      )
      if (token !== loadToken) return
      await checkPracticeAvailability(activeContext)
    }
  } catch {
    if (token === loadToken) detailError.value = '知识点详情暂时无法加载，请重新试一次。'
  } finally {
    if (token === loadToken) {
      detailLoading.value = false
      if (route.hash === '#knowledge-challenges') {
        await nextTick()
        document.getElementById('knowledge-challenges')?.scrollIntoView({ block: 'start' })
      }
    }
  }
}

function returnToPrevious(): void {
  const focus = mapNodeId.value
  const shouldFocusMap = ['/learning-map', '/dev/learning-map'].includes(returnPath.value)
  void router.push({
    path: returnPath.value,
    ...(shouldFocusMap
      ? {
          query: {
            ...(mapSubject.value ? { subject: mapSubject.value } : {}),
            ...(focus ? { focusNodeId: focus } : {}),
          },
        }
      : {}),
  })
}

function openLesson(): void {
  if (!context.value || nodeStatus.value === 'locked') return
  void router.push({
    path: isDevRoute.value ? '/dev/lesson-player' : '/lesson',
    query: {
      ...context.value,
      ...(isDevRoute.value ? { dataset: dataset.value } : {}),
      ...(mapSubject.value ? { subject: mapSubject.value } : {}),
      ...(mapNodeId.value ? { mapNodeId: mapNodeId.value } : {}),
      nodeStatus: nodeStatus.value,
      nodeProgress: String(nodeProgress.value),
      returnTo: detailPath.value,
      detailReturnTo: returnPath.value,
    },
  })
}

function openAssessment(practiceSetId?: string): void {
  const fixedPractice =
    typeof practiceSetId === 'string' && practiceSetId === synchronousPractice.value?.id
      ? synchronousPractice.value
      : null
  if (!context.value || (!fixedPractice && practiceAvailable.value !== true)) return
  void router.push({
    path: isDevRoute.value ? '/dev/question-engine' : '/assessment',
    query: {
      ...context.value,
      ...(fixedPractice
        ? {
            textbookId: fixedPractice.textbookId,
            unitId: fixedPractice.unitId,
            lessonId: fixedPractice.lessonId,
            knowledgePointId: fixedPractice.knowledgePointId,
          }
        : {}),
      source: isDevRoute.value ? 'dev' : 'lesson_practice',
      ...(typeof practiceSetId === 'string' && practiceSetId === synchronousPractice.value?.id
        ? { practiceSetId }
        : {}),
      ...(fixedPractice
        ? {
            syncReturnLessonId: context.value.lessonId,
            syncReturnKnowledgePointId: context.value.knowledgePointId,
          }
        : {}),
      ...(isDevRoute.value ? { dataset: dataset.value } : {}),
      ...(mapSubject.value ? { subject: mapSubject.value } : {}),
      returnTo: detailPath.value,
      lessonReturnTo: returnPath.value,
      ...(mapNodeId.value && !fixedPractice ? { mapNodeId: mapNodeId.value } : {}),
    },
  })
}

function selectActivity(activityId: Id): void {
  selectedActivityId.value = activityId
  lastActivityMessage.value = null
}

function recordActivityResult(result: ActivityResult): void {
  lastActivityMessage.value =
    result.status === 'completed'
      ? '这项互动挑战完成了。结果只记录为活动进度，不改变掌握度。'
      : '这项活动暂时没有完成，请先看看提示再试一次。'
}

watch(
  () => activities.value.map((activity) => activity.id).join('|'),
  () => {
    selectedActivityId.value = activities.value[0]?.id ?? null
  },
  { immediate: true },
)
onMounted(() => void loadDetail())
watch(
  () => [route.fullPath, profileId.value],
  () => void loadDetail(),
)
watch(
  () => [canShowDetail.value, viewModel.value?.knowledgePoint.id],
  async () => {
    actionObserver?.disconnect()
    primaryActionsVisible.value = true
    await nextTick()
    if (typeof IntersectionObserver === 'undefined') return
    const element = document.getElementById('knowledge-primary-actions')
    if (!element) return
    actionObserver = new IntersectionObserver(([entry]) => {
      primaryActionsVisible.value = entry?.isIntersecting ?? true
    })
    actionObserver.observe(element)
  },
  { flush: 'post' },
)
</script>

<template>
  <AppShell
    :show-bottom-nav="false"
    :context="isDevRoute ? 'DEV / 知识点详情' : '知识点详情'"
    class="knowledge-detail-shell"
  >
    <div class="knowledge-detail-page content-container">
      <div class="knowledge-detail">
        <header class="knowledge-detail__header">
          <RouterLink
            class="knowledge-detail__back"
            :to="returnPath"
            @click.prevent="returnToPrevious"
          >
            <AppIcon name="arrow-left" :size="18" decorative />
            {{ returnLabel }}
          </RouterLink>
          <div class="knowledge-detail__header-copy">
            <p class="curriculum-eyebrow">知识小站 · 读一读，想一想</p>
            <h1>{{ viewModel?.knowledgePoint.name || '正在准备知识点详情' }}</h1>
            <p v-if="viewModel">{{ viewModel.unit.title }} · {{ viewModel.lesson.title }}</p>
          </div>
          <div v-if="viewModel" class="knowledge-detail__badges" aria-label="内容状态">
            <span
              v-if="viewModel.flags.isDemo || viewModel.flags.isSample"
              class="knowledge-detail__badge knowledge-detail__badge--sample"
            >
              {{ viewModel.flags.isDemo ? '开发样本' : '示例内容' }}
            </span>
            <span
              v-if="viewModel.flags.isUnverified && !isFormalPilot"
              class="knowledge-detail__badge knowledge-detail__badge--warning"
            >
              未审核
            </span>
          </div>
        </header>

        <AppLoading v-if="detailLoading" label="正在准备知识点详情" />
        <template v-else-if="pageError">
          <AppErrorState
            title="知识点详情暂时打不开"
            :description="pageError"
            @retry="loadDetail"
          />
          <AppButton variant="ghost" icon-left="arrow-left" @click="returnToPrevious">
            {{ returnLabel }}
          </AppButton>
        </template>
        <AppEmptyState
          v-else-if="lessonPlayerStore.status === 'not_available'"
          title="这部分内容暂未开放"
          description="课程内容还需要完成审核，暂时不能展示详情。"
          :action-label="returnLabel"
          @action="returnToPrevious"
        />
        <AppEmptyState
          v-else-if="lessonPlayerStore.status === 'empty'"
          title="这部分内容正在准备中"
          description="这个知识点已经在地图上，但可阅读内容还没有准备好。"
          :action-label="returnLabel"
          @action="returnToPrevious"
        />

        <template v-else-if="canShowDetail && viewModel">
          <LearningPath
            :read="viewModel.session.status === 'completed'"
            :checked="Boolean(masteryRecord?.evidenceCount)"
            :practice-available="practiceAvailable"
            :has-challenge="Boolean(readingQuest)"
          />
          <section
            id="knowledge-primary-actions"
            class="knowledge-detail__actions knowledge-detail__actions--primary"
            aria-label="知识点操作"
          >
            <AppButton
              :disabled="nodeStatus === 'locked'"
              icon-right="arrow-right"
              @click="
                viewModel.session.status === 'completed' && practiceAvailable
                  ? openAssessment()
                  : openLesson()
              "
            >
              {{
                viewModel.session.status === 'completed' && practiceAvailable
                  ? '检查理解'
                  : lessonActionLabel
              }}
            </AppButton>
            <a v-if="readingQuest" href="#knowledge-challenges" class="reading-quest__entry"
              >巩固与拓展</a
            >
            <details v-if="practiceAvailable" class="learning-options">
              <summary>已经学过？直接检查理解</summary>
              <p>做几道教材练习，看看哪些地方还需要帮助。答题后会更新掌握记录和错题本。</p>
              <AppButton variant="secondary" @click="openAssessment()">开始教材练习</AppButton>
            </details>
            <p
              v-if="practiceAvailable === false && !readingQuest"
              class="knowledge-detail__practice-note"
            >
              {{
                isImportedOpenActivity
                  ? '本栏目供阅读、交流和写作，可按提示完成开放活动。'
                  : isLiteracyAppendix
                    ? '这是全册字词附录，可按表认读、书写和复习。'
                    : '教材练习正在准备中，可以先完成下方开放活动。'
              }}
            </p>
            <p v-if="nodeStatus === 'locked'" role="status">先完成前置知识，再进入完整学习。</p>
          </section>

          <div
            class="knowledge-detail__source-notice"
            :class="{
              'knowledge-detail__source-notice--sample':
                viewModel.flags.isDemo || viewModel.flags.isSample,
            }"
            role="status"
          >
            <AppIcon name="info" :size="20" decorative />
            <p>{{ sourceNotice() }}</p>
          </div>
          <LessonSourceNotes :key="knowledgePointId" :notes="viewModel.sourceNotes" />

          <section class="knowledge-detail__summary" aria-labelledby="knowledge-summary-title">
            <div class="knowledge-detail__summary-copy">
              <p class="curriculum-eyebrow">当前知识点</p>
              <h2 id="knowledge-summary-title">{{ viewModel.knowledgePoint.name }}</h2>
              <p>{{ knowledgePointDescription }}</p>
            </div>
            <div class="knowledge-detail__progress">
              <div class="knowledge-detail__progress-heading">
                <span>{{ NODE_STATUS_LABELS[nodeStatus] }}</span>
                <strong>{{ Math.round(nodeProgress) }}%</strong>
              </div>
              <AppProgress :value="nodeProgress" label="本课学习进度" />
              <small>记录本课学习步骤的完成情况，不代表知识掌握度。</small>
            </div>
            <dl class="knowledge-detail__facts">
              <div>
                <dt>教材</dt>
                <dd>{{ viewModel.textbook.title }}</dd>
              </div>
              <div>
                <dt>单元</dt>
                <dd>{{ viewModel.unit.title }}</dd>
              </div>
              <div>
                <dt>课程</dt>
                <dd>{{ viewModel.lesson.title }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="masteryRecord"
            class="knowledge-detail__mastery"
            aria-labelledby="knowledge-mastery-title"
          >
            <div>
              <p class="curriculum-eyebrow">看看自己的学习进展</p>
              <h2 id="knowledge-mastery-title">掌握度记录</h2>
              <p>{{ masteryStateLabel }} · 来自已经提交的题目证据</p>
            </div>
            <strong>{{ Math.round(masteryRecord.masteryScore) }}%</strong>
            <small>查看详情不会改变掌握度。</small>
          </section>

          <section
            class="knowledge-detail__panel knowledge-detail__goals"
            aria-labelledby="knowledge-goals-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">带着好奇心出发</p>
                <h2 id="knowledge-goals-title">今天要发现什么</h2>
              </div>
            </div>
            <ul>
              <li v-for="goal in viewModel.learningGoals" :key="goal">{{ goal }}</li>
              <li v-if="!viewModel.learningGoals.length">先阅读内容，再用自己的话说出一个发现。</li>
            </ul>
          </section>

          <LessonReadingPanel
            :key="`${profileId}:${knowledgePointId}`"
            :blocks="contentBlocks"
            :heading="
              isLiteracyAppendix ? '字词附录' : isImportedOpenActivity ? '栏目内容' : undefined
            "
            :muted="preferencesStore.preferences.muted"
            :subject="isMathSubject ? 'math' : isEnglishSubject ? 'english' : 'chinese'"
            :show-diagnostics="isDevRoute"
            :practice-available="practiceAvailable"
            @start-assessment="openAssessment"
          >
            <template #note>
              <template v-if="isFormalPilot">
                <template v-if="isMathSubject">
                  根据本课知识提要学习方法，再用下面的原创闯关练习试一试。图示帮助理解，开放探究鼓励不同解法。
                </template>
                <template v-else-if="isEnglishProject">
                  按活动要求制作作品，用学过的英语介绍；完成后请同伴或家长一起核对表达。
                </template>
                <template v-else-if="isEnglishModuleReview">
                  按模块复习提要回顾词汇、句型和语音，完成所列交流任务；请同伴、老师或家长核对。
                </template>
                <template v-else-if="isEnglishReview">
                  点击下方配套练习入口，完成本册综合小练习并核对答案。
                </template>
                <template v-else-if="isEnglishAppendix">
                  阅读册末材料，复习单词、语法或完成自查；由老师、家长或自己核对。
                </template>
                <template v-else-if="isEnglishDirectoryOnly">
                  来稿仅提供栏目名称和页码，正文尚未提供。
                </template>
                <template v-else-if="isEnglishSubject">
                  这里是已接入的英语学习文本和配套练习，先听读，再完成单词拼写和句子介绍。
                </template>
                <template v-else-if="isLiteracyAppendix">
                  这里是全册字词附录，按附件中的标题分组查阅，读一读、写一写，标记还不熟悉的字词。
                </template>
                <template v-else>
                  这里是课文原文和配套学习内容，读一读，再完成下面的挑战。
                </template>
              </template>
              <template v-else>
                当前展示课程库已接入的学习文本、重点和活动提示；完整教材原文将在获得授权并完成审核后接入。
              </template>
            </template>
          </LessonReadingPanel>
          <PoetryLearningGuide
            v-if="
              context?.textbookId === 'G2_PEP_CHINESE_S2_2024_CANDIDATE' &&
              knowledgePointId === 'G2_PEP_CHINESE_S2_KP_01'
            "
          />
          <details v-if="!isDevRoute && context" class="learning-options knowledge-detail__panel">
            <summary>想再练一组？让 AI 帮你安排</summary>
            <p>这是额外练习，答题结果辅助学习建议；课程掌握记录以教材练习为准。</p>
            <FormalAiPractice
              :textbook-id="context.textbookId"
              :knowledge-point-id="context.knowledgePointId"
            />
          </details>

          <section
            id="knowledge-challenges"
            class="knowledge-detail__panel knowledge-detail__challenges"
            aria-labelledby="knowledge-challenges-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">读完了，带着发现出发</p>
                <h2 id="knowledge-challenges-title">
                  {{ isMathSubject ? '数学闯关' : readingQuest ? '课后闯关' : '知识挑战' }}
                </h2>
              </div>
              <span>{{
                readingQuest
                  ? '基础与强化 · 分层训练'
                  : challengeCards.length + activities.length + ' 项挑战'
              }}</span>
            </div>
            <QuestTraining
              v-if="readingQuest"
              :key="profileId + ':' + readingQuest.id"
              :quest="readingQuest"
              :bundle="expansionBundle"
              :title="viewModel?.lesson.title ?? ''"
              :text="questReadingText(contentBlocks)"
              :profile-id="profileId"
              :muted="preferencesStore.preferences.muted"
            />
            <p v-else class="knowledge-detail__section-intro">
              <template v-if="isFormalPilot">
                <template v-if="isLiteracyAppendix">
                  选出需要巩固的字词，记录自己的发现或疑问。此处为开放表达，不自动判分。
                </template>
                <template v-else-if="isEnglishProject">
                  展示你的作品，说说选择这些词句的理由。作品没有唯一答案，不自动判分。
                </template>
                <template v-else-if="isEnglishModuleReview">
                  按复习提要练习问答、表达和语音，记录自己的发现或疑问；此处为开放复习，不自动判分。
                </template>
                <template v-else-if="isEnglishReview">
                  点击下方配套练习入口，完成本册综合小练习并核对答案。
                </template>
                <template v-else-if="isEnglishAppendix">
                  阅读册末材料，复习单词、语法或完成自查；由老师、家长或自己核对。
                </template>
                <template v-else-if="isEnglishDirectoryOnly">
                  来稿仅提供栏目名称和页码，正文尚未提供。
                </template>
                <template v-else-if="isEnglishSubject">
                  这里包含单词拼写、句子介绍和听读表达。先读出答案，再查看提示和参考思路；不会直接修改掌握度。
                </template>
                <template v-else>
                  这里包含阅读理解、生字组词、拼音练习和生活表达。先写下答案，再查看提示和参考思路；不会直接修改掌握度。
                </template>
              </template>
              <template v-else>
                先想一想、写下理由，再查看提示。这里的互动只帮助你表达理解，不会直接修改掌握度。
              </template>
            </p>

            <div v-if="activities.length" class="knowledge-detail__activity-area">
              <div class="knowledge-detail__subheading">
                <div>
                  <p class="curriculum-eyebrow">动手试一试</p>
                  <h3>动手挑战</h3>
                </div>
                <span>{{ activities.length }} 项互动</span>
              </div>
              <nav class="knowledge-detail__activity-tabs" aria-label="选择互动挑战">
                <button
                  v-for="activity in activities"
                  :key="activity.id"
                  class="knowledge-detail__activity-tab"
                  type="button"
                  :class="{
                    'knowledge-detail__activity-tab--current': activity.id === selectedActivity?.id,
                  }"
                  @click="selectActivity(activity.id)"
                >
                  <strong>{{ activity.title }}</strong>
                  <small>{{ activity.difficulty }} · {{ activity.activityType }}</small>
                </button>
              </nav>
              <InteractiveActivityRenderer
                v-if="selectedActivity"
                :activity="selectedActivity"
                :profile-id="profileId"
                @result="recordActivityResult"
              />
              <p v-if="lastActivityMessage" class="knowledge-detail__activity-result" role="status">
                {{ lastActivityMessage }}
              </p>
            </div>

            <details v-if="readingQuest" class="reading-quest__expression">
              <summary>
                {{ isMathSubject ? '动手探究 · 讲讲你的解法' : '再说一说 · 开放表达' }}
                <span>没有唯一答案，也可以先说给身边的人听</span>
              </summary>
              <div class="knowledge-detail__challenge-grid">
                <KnowledgeChallengeCard
                  v-for="challenge in challengeCards"
                  :key="profileId + challenge.id"
                  :profile-id="isDevRoute ? undefined : profileId"
                  :challenge-id="challenge.id"
                  :title="challenge.title"
                  :prompt="challenge.prompt"
                  :hint="challenge.hint"
                  :reference-answer="challenge.referenceAnswer"
                  :eyebrow="challenge.eyebrow"
                />
              </div>
            </details>
            <div v-else class="knowledge-detail__challenge-grid">
              <KnowledgeChallengeCard
                v-for="challenge in challengeCards"
                :key="challenge.id"
                :profile-id="isDevRoute ? undefined : profileId"
                :challenge-id="challenge.id"
                :title="challenge.title"
                :prompt="challenge.prompt"
                :hint="challenge.hint"
                :reference-answer="challenge.referenceAnswer"
                :eyebrow="challenge.eyebrow"
              />
            </div>
          </section>

          <section
            v-if="visiblePracticeSets.length"
            class="knowledge-detail__panel knowledge-detail__practice"
            aria-labelledby="knowledge-practice-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">练一练，记得更牢</p>
                <h2 id="knowledge-practice-title">练习集合</h2>
              </div>
              <span>{{ visiblePracticeSets.length }} 组</span>
            </div>
            <div class="knowledge-detail__practice-list">
              <article v-for="practice in visiblePracticeSets" :key="practice.id">
                <span>{{ practiceModeLabel(practice.mode) }}</span>
                <strong>{{ practice.title }}</strong>
                <small
                  >{{ practice.targetCount }} 题 · 难度 {{ practice.difficultyRange.min }}—{{
                    practice.difficultyRange.max
                  }}</small
                >
                <template v-if="practice.id === synchronousPractice?.id">
                  <small
                    >{{ synchronousPractice.autoCount }} 题自动判分 ·
                    {{ synchronousPractice.manualCount }} 题对照参考答案</small
                  >
                  <small v-if="unitPracticeNotice">{{ unitPracticeNotice }}</small>
                  <AppButton
                    :disabled="nodeStatus === 'locked'"
                    @click="openAssessment(practice.id)"
                    >开始单元同步练习</AppButton
                  >
                </template>
              </article>
            </div>
            <details v-if="synchronousPractice && isEnglishSubject">
              <summary>本册核心句型 · 背诵与默写</summary>
              <ol>
                <li v-for="pattern in englishSyncSourceSheet.corePatterns" :key="pattern">
                  {{ pattern }}
                </li>
              </ol>
            </details>
          </section>

          <ReadingEntry
            v-if="!isMathSubject && !isDevRoute"
            compact
            :language="isEnglishSubject ? 'english' : 'chinese'"
          />

          <RouterLink
            class="knowledge-detail__footer-back"
            :to="returnPath"
            @click.prevent="returnToPrevious"
          >
            <AppIcon name="arrow-left" :size="18" decorative />
            {{ returnLabel }}，继续探索其他知识点
          </RouterLink>
        </template>
      </div>
    </div>
    <div
      v-if="canShowDetail && viewModel && !primaryActionsVisible"
      class="knowledge-detail__floating-action"
    >
      <AppButton
        :disabled="nodeStatus === 'locked'"
        full-width
        @click="
          viewModel.session.status === 'completed' && practiceAvailable
            ? openAssessment()
            : openLesson()
        "
        >{{
          viewModel.session.status === 'completed' && practiceAvailable
            ? '检查理解'
            : lessonActionLabel
        }}</AppButton
      >
    </div>
  </AppShell>
</template>
