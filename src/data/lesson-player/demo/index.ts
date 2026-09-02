import { sampleMediaAssets } from '@/data/curriculum/media'
import type {
  ContentBlock,
  LessonContentBlockRecord,
  LessonContentInteraction,
  LessonPlayerSource,
  LessonStep,
  LessonMediaAsset,
} from '@/types'

const SAMPLE_STATUS = {
  isSample: true,
  verificationStatus: 'SAMPLE' as const,
}

const demoMediaAssets: LessonMediaAsset[] = sampleMediaAssets.map((asset) => ({
  id: asset.id,
  mediaType: asset.mediaType,
  url: asset.url,
  mimeType: asset.mimeType,
  width: asset.width,
  height: asset.height,
  durationSeconds: asset.durationSeconds,
  altText: asset.altText,
  transcript: asset.transcript,
  isAvailable: true,
}))

function textBlock(text: string): ContentBlock {
  return { type: 'TEXT', text }
}

const revealInteraction: LessonContentInteraction = {
  kind: 'REVEAL',
  prompt: '点击看看观察提示',
  revealText: '把数字分成两组，再逐组数一数，观察会更清楚。',
}

const processInteraction: LessonContentInteraction = {
  kind: 'STEP_DEMO',
  prompt: '按顺序展开观察步骤',
  processSteps: ['先找到要观察的对象', '再按同一种方法逐个记录', '最后说一说你发现的规律'],
}

const blocks: LessonContentBlockRecord[] = [
  {
    id: 'DEMO_CONTENT_BLOCK_01_INTRO',
    block: textBlock('今天，我们要用自己的眼睛和小手，发现数字排列里的规律。'),
    stepType: 'intro',
    title: '今天学什么',
    paragraphs: ['从一个熟悉的生活场景出发，试着说出你看到的变化。'],
    sort: 1,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_02_CONCEPT',
    block: textBlock('规律，就是一组对象按照某种相同的方式重复或变化。'),
    stepType: 'concept',
    title: '认识规律',
    highlights: ['找到相同的变化方式', '用自己的话说清楚它'],
    sort: 2,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_03_EXPLANATION',
    block: textBlock('观察时可以先看相邻的两个位置，再把这个变化和后面的位置对照起来。'),
    stepType: 'explanation',
    title: '一步一步观察',
    paragraphs: ['不要急着猜结论。', '先比较，再记录，最后回头检查。'],
    bullets: ['看清楚每一格', '找出重复或变化', '用完整句子表达发现'],
    interaction: processInteraction,
    sort: 3,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_04_EXAMPLE',
    block: textBlock('例子：红、蓝、红、蓝……，相邻颜色一直交替出现。'),
    stepType: 'example',
    title: '看一个例子',
    paragraphs: ['先圈出相邻的两个颜色，再向后观察是否保持同样的变化。'],
    highlights: ['重复的变化：红 → 蓝 → 红 → 蓝'],
    sort: 4,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_05_MEDIA',
    block: {
      type: 'IMAGE',
      mediaAssetId: 'SAMPLE_MEDIA_MAP',
      altText: '示例知识岛地图插图',
    },
    stepType: 'media',
    title: '用图来观察',
    paragraphs: ['看看图里的路线，再找一找哪些位置看起来有相似的变化。'],
    mediaAssetIds: ['SAMPLE_MEDIA_MAP'],
    sort: 5,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_06_INTERACTIVE',
    block: textBlock('点击切换两种排列，观察它们的变化方式。'),
    stepType: 'interactive',
    title: '动手观察',
    interaction: revealInteraction,
    sort: 6,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_07_PRACTICE',
    block: textBlock('先想一想：如果下一格继续变化，你会怎样描述自己的理由？'),
    stepType: 'practice',
    title: '轮到你想一想',
    paragraphs: ['可以在心里说一遍，也可以请家长听听你的想法。', '点击后查看思路提示。'],
    interaction: {
      kind: 'REVEAL',
      prompt: '查看思路提示',
      revealText: '先找相邻位置的变化，再检查这个变化有没有重复出现。',
    },
    sort: 7,
    ...SAMPLE_STATUS,
  },
  {
    id: 'DEMO_CONTENT_BLOCK_08_SUMMARY',
    block: textBlock('今天我们学会了：先观察，再比较，最后用自己的话说出规律。'),
    stepType: 'summary',
    title: '带走三个小发现',
    bullets: ['观察要有顺序', '规律要说清变化方式', '发现后记得回头检查'],
    sort: 8,
    ...SAMPLE_STATUS,
  },
]

const steps: LessonStep[] = blocks.map((block) => ({
  id: `DEMO_LESSON_STEP_${String(block.sort).padStart(2, '0')}`,
  type: block.stepType as LessonStep['type'],
  title: block.title,
  contentBlockIds: [block.id],
  estimatedSeconds: block.stepType === 'media' ? 20 : 35,
  required: true,
  sort: block.sort,
}))

export const demoLessonPlayerSource: LessonPlayerSource = {
  context: {
    textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
    unitId: 'DEMO_UNIT_01',
    lessonId: 'DEMO_LESSON_1_1',
    knowledgePointId: 'DEMO_KP_01',
  },
  textbook: {
    id: 'DEMO_TEXTBOOK_MATH_G3_S1',
    title: 'DEMO 数学知识海域（仅用于学习流程验证）',
  },
  unit: {
    id: 'DEMO_UNIT_01',
    title: '雾林起点',
  },
  lesson: {
    id: 'DEMO_LESSON_1_1',
    title: '探索区 1-1：发现变化',
  },
  knowledgePoint: {
    id: 'DEMO_KP_01',
    name: '演示知识点 01',
    description: '用有顺序的观察，说出一组对象的变化方式。',
  },
  mapping: {
    id: 'DEMO_LKP_01',
    lessonId: 'DEMO_LESSON_1_1',
    knowledgePointId: 'DEMO_KP_01',
  },
  learningGoals: ['能按顺序观察一组对象', '能用自己的话描述一个简单规律'],
  steps,
  blocks,
  mediaAssets: demoMediaAssets,
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  isSample: true,
  verificationStatus: 'SAMPLE',
  contentIsSample: true,
  contentVerificationStatus: 'SAMPLE',
  contentStatus: 'DRAFT',
  isDemo: true,
}

export const demoLessonPlayerSources: readonly LessonPlayerSource[] = [demoLessonPlayerSource]
