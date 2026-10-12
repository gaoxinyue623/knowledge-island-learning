import type { CurriculumData } from '../types'

// Corrections belong to the learning projection. Imported source files and IDs
// remain available for provenance; reference articles are never textbook text.
export const textbookResearchDate = '2026-10-10'
export const textbookResearch = [
  {
    pointId: 'G4_PEP_CHINESE_S1_KP_LITERACY_RECOGNITION',
    status: 'CORRECTED_REFERENCE',
    issue: '来稿两处拼音错误',
    note: '字典核对：辫读biàn，崛读jué。学习显示已校正这两处；原始来稿保留。其余字表尚未逐项核验。',
    urls: ['https://zdic.net/hans/%E8%BE%AB', 'https://zdic.net/hans/%E5%B4%9B'],
    replacements: [
      ['bàn 辫', 'biàn 辫'],
      ['qǐ 崛', 'jué 崛'],
    ],
  },
  {
    pointId: 'G5_SHANGHAI_ENGLISH_S2_KP_02',
    status: 'CORRECTED_REFERENCE',
    issue: '说话角色与称呼错位',
    note: '已将角色错误的“Why, Sally?”改为符合上下文的“Why?”；按项目校正后的学习文本显示，原来稿仍保留在 source-text.md 供溯源，尚未取得同版教材原页。',
    urls: [],
    replacements: [],
  },
  {
    pointId: 'G2_SHENZHEN_ENGLISH_S2_KP_02',
    status: 'CORRECTED_REFERENCE',
    issue: '语音例词分类错误',
    note: '拼写核对：part、art含ar；hot、pot不含ar。语音学习显示已分组，不把hot、pot作为ar组合例词。它们的具体口音发音及教材归属仍待原页核验。',
    urls: [],
    replacements: [['part, art, hot, pot', 'ar组合例词：part, art\n其他例词（不含ar）：hot, pot']],
  },
  {
    pointId: 'G3_PEP_CHINESE_S1_KP_READING_10',
    status: 'NEEDS_MATCHING_EDITION',
    issue: '完整来稿已接入；版次外部核验待完成',
    note: '本次用户提供的完整正文及三个结局已替换旧概要。出版社教学研究可用于学习预测方法；2022年精品课名单使用第14课，与当前第10课不同。第三单元和2022修订版按用户明确标注保留，出版社同版原页核验仍待完成。',
    urls: [
      'https://www.pep.com.cn/bks/xxyw/jzjd/202506/W020250624356987921486.pdf',
      'https://v1.ykt.cbern.com.cn/65/document/2ca6040e6c5e496783f11589a89b7d1b/pdf.pdf',
      'https://www.fuzhou.gov.cn/zgfzzt/jy/zdjy/202304/P020230425641760880849.pdf',
    ],
    replacements: [],
  },
  {
    pointId: 'G5_PEP_CHINESE_S2_KP_READING_11',
    status: 'REFERENCE_ONLY',
    issue: '姓名揭示对话已按教材图片补齐',
    note: '四张用户提供教材图片已补齐真实姓名问答、结尾、字词表、课后题及《丰碑》。资料中心人物介绍保留为背景参考。',
    urls: ['https://cpc.people.com.cn/GB/64162/126778/126780/7490151.html'],
    replacements: [],
  },
  {
    pointId: 'G5_PEP_CHINESE_S2_KP_INTEGRATED_LOVE',
    status: 'REFERENCE_ONLY',
    issue: '阅读材料及作品图已按教材图片补齐',
    note: '当前V4已按用户提供的第三单元教材图片补入阅读材料、字形演变表、书法作品和研究报告。甲骨文发现的资料仅保留为延伸背景，不替代已接入的教材正文及作品原图。',
    urls: ['https://cpc.people.com.cn/n/2014/0819/c83083-25493198.html'],
    replacements: [],
  },
] as const

export function applyTextbookResearch(curriculum: CurriculumData): CurriculumData {
  const byPoint = new Map<string, (typeof textbookResearch)[number]>(
    textbookResearch.map((item) => [item.pointId, item]),
  )
  return {
    ...curriculum,
    courseContents: curriculum.courseContents.map((content) => {
      const research = byPoint.get(content.knowledgePointId)
      if (!research) return content
      const originalBlocks = content.body['blocks']
      if (!Array.isArray(originalBlocks)) return content
      const blocks = originalBlocks.map((block: Record<string, unknown>) => {
        if (typeof block['text'] !== 'string') return block
        let text = block['text']
        // Do not rewrite quoted import notes or the archived source explanation.
        if (!/^(?:内容核对说明|来源说明|补充稿核对说明)/.test(text))
          for (const [from, to] of research.replacements) text = text.replaceAll(from, to)
        return { ...block, text }
      })
      blocks.push({
        type: 'TEXT',
        text: `资料核对与项目校正（${textbookResearchDate}）\n${research.note}${research.urls.length ? '\n查阅来源（非教材补文）：\n' + research.urls.map((url) => `来源：${url}`).join('\n') : ''}`,
      })
      return {
        ...content,
        body: {
          ...content.body,
          blocks,
          researchReview: { ...research, checkedAt: textbookResearchDate },
        },
      }
    }),
  }
}
