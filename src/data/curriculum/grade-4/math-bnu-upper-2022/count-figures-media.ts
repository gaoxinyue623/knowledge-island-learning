import illustrations from './count-figures-illustrations.json'
import { G4_BNU_MATH_IMPORT_APPROVAL } from '../../production/gradeFourBnuMathApproval'
import type { ContentSource, MediaAsset } from '@/types'

export const countFiguresIllustrationSource: ContentSource = {
  id: 'G4_BNU_MATH_S1_2022_COUNT_FIGURES_AI_IMAGES_V1',
  title: '数图形的学问：鼹鼠钻洞与菜地旅行AI配套图',
  sourceType: 'AI_GENERATED',
  sourceRef: 'project://curriculum/grade-4/math-bnu-upper-2022/count-figures-illustrations.json',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  releaseApprovalId: G4_BNU_MATH_IMPORT_APPROVAL,
  verifiedAt: illustrations.generatedAt,
  notes: illustrations.sourceNote,
}

const descriptions = [
  '鼹鼠钻洞：A、B、C、D四个洞口从左到右排列，鼹鼠只能向右前进；下方为四点线段示意。（AI生成配套图）',
  '菜地旅行：从左到右依次是红薯站、西红柿站、茄子站、胡萝卜站、土豆站，对应A、B、C、D、E五点；单程方向向右。（AI生成配套图）',
]
export const countFiguresMediaAssets: MediaAsset[] = illustrations.assets.map((asset, index) => ({
  id: `G4_BNU_MATH_S1_2022_COUNT_FIGURES_IMAGE_${index + 1}`,
  mediaType: 'IMAGE',
  storageKey: asset.url.slice(1),
  url: asset.url,
  mimeType: 'image/png',
  width: asset.width,
  height: asset.height,
  durationSeconds: null,
  altText: descriptions[index]!,
  transcript: null,
  sourceId: countFiguresIllustrationSource.id,
  copyrightStatus: 'CLEARED',
  license: null,
  status: 'ACTIVE',
  version: 1,
  needsVerification: false,
  verificationStatus: 'REVIEWED',
  createdAt: illustrations.generatedAt,
  updatedAt: illustrations.generatedAt,
}))

export const countFiguresPictureQuestions = [
  {
    stem: '鼹鼠钻洞：图中A、B、C、D是四个洞口。鼹鼠从其中一个洞口进入，只能向右前进，再从右边另一个洞口出来。只按进入和出来的洞口区分，共有几种不同的走法？',
    options: ['3种', '6种', '12种'],
    correctIndex: 1,
    explanation:
      '从A进入可从B、C、D出来，有3种；从B进入有2种；从C进入有1种；从D进入没有向右的出口。共3＋2＋1＝6种。',
    mediaAssetId: countFiguresMediaAssets[0]!.id,
  },
  {
    stem: '菜地旅行：图中从左到右有红薯站、西红柿站、茄子站、胡萝卜站、土豆站五个站点。单程车只向右行驶，任意一站都可以作为起点，终点必须在起点右边。按起点和终点区分，需要准备几种不同的车票？',
    options: ['4种', '10种', '20种'],
    correctIndex: 1,
    explanation:
      '从红薯站出发有4个终点，从西红柿站出发有3个，从茄子站出发有2个，从胡萝卜站出发有1个。共4＋3＋2＋1＝10种单程车票。',
    mediaAssetId: countFiguresMediaAssets[1]!.id,
  },
]
