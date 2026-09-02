import type { LearningMap, MapNode } from '@/types'

import type { SampleRecord } from '../types'

export const sampleLearningMaps: SampleRecord<LearningMap>[] = [
  {
    id: 'SAMPLE_MAP_CHINESE',
    unitId: 'SAMPLE_CHINESE_UNIT',
    title: '示例语文世界地图',
    themeKey: 'sample-story-world',
    status: 'DRAFT',
    version: 1,
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_MAP_MATH',
    unitId: 'SAMPLE_MATH_UNIT',
    title: '示例数学世界地图',
    themeKey: 'sample-math-world',
    status: 'DRAFT',
    version: 1,
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
  },
  {
    id: 'SAMPLE_MAP_ENGLISH',
    unitId: 'SAMPLE_ENGLISH_UNIT',
    title: '示例英语世界地图',
    themeKey: 'sample-english-world',
    status: 'DRAFT',
    version: 1,
    sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
  },
]

const mapNode = (
  id: string,
  mapId: string,
  order: number,
  nodeType: MapNode['nodeType'],
  title: string,
  knowledgePointId: string,
  contentId: string,
): SampleRecord<MapNode> => ({
  id,
  mapId,
  nodeType,
  title,
  order,
  position: { x: order * 100, y: order * 60 },
  knowledgePointIds: [knowledgePointId],
  contentIds: [contentId],
  questionPoolConfig: { questionIds: ['SAMPLE_QUESTION_SINGLE_CHOICE'] },
  unlockRule: { type: 'SAMPLE_PREVIOUS_COMPLETE' },
  completionRule: { type: 'SAMPLE_COMPLETE' },
  rewardConfig: { type: 'SAMPLE_REWARD' },
  status: 'DRAFT',
  isSample: true,
  needsVerification: true,
  verificationStatus: 'SAMPLE',
})

export const sampleMapNodes: SampleRecord<MapNode>[] = [
  mapNode(
    'SAMPLE_MAP_NODE_CHINESE_01',
    'SAMPLE_MAP_CHINESE',
    1,
    'START',
    '示例语文起点',
    'SAMPLE_CHINESE_KP_01',
    'SAMPLE_CONTENT_01',
  ),
  mapNode(
    'SAMPLE_MAP_NODE_MATH_01',
    'SAMPLE_MAP_MATH',
    1,
    'START',
    '示例数学起点',
    'SAMPLE_MATH_KP_01',
    'SAMPLE_CONTENT_05',
  ),
  mapNode(
    'SAMPLE_MAP_NODE_ENGLISH_01',
    'SAMPLE_MAP_ENGLISH',
    1,
    'START',
    '示例英语起点',
    'SAMPLE_ENGLISH_KP_01',
    'SAMPLE_CONTENT_09',
  ),
]
