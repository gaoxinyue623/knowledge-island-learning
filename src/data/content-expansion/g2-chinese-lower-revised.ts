import {
  G2_REVISED_CHINESE_EXERCISE_SOURCE_ID,
  G2_REVISED_CHINESE_TEXTBOOK_ID,
} from '@/data/curriculum/grade-2/chinese-pep-lower-revised'
import type { ContentExpansionBundle, LearningContent, LessonContentBlockRecord } from '@/types'
import { revisedChinesePracticeRows } from './g2-chinese-lower-revised-practice'

const provenance = {
  sourceId: G2_REVISED_CHINESE_EXERCISE_SOURCE_ID,
  verificationStatus: 'UNVERIFIED' as const,
  isSample: false,
}
const timestamp = '2026-09-06T00:00:00+08:00'

export const candidateRevisedChineseLowerBundles: readonly ContentExpansionBundle[] =
  revisedChinesePracticeRows.map((row) => {
    const id = `${row.knowledgePointId}:original-practice:v1`
    const blocks: LessonContentBlockRecord[] = [
      {
        id: `${id}:intro`,
        block: { type: 'TEXT', text: `朗读${row.displayTitle}，想一想：${row.practice.prompt}` },
        stepType: 'intro',
        title: '带着问题读一读',
        sort: 1,
        isSample: false,
        verificationStatus: 'UNVERIFIED',
      },
      {
        id: `${id}:practice`,
        block: {
          type: 'TEXT',
          text: `拓展组词：${row.practice.words.join('、')}。${row.practice.expression}`,
        },
        stepType: 'practice',
        title: '字词与表达',
        sort: 2,
        isSample: false,
        verificationStatus: 'UNVERIFIED',
      },
    ]
    const learningContent: LearningContent = {
      id: `${id}:learning-content`,
      lessonId: row.lessonId,
      knowledgePointId: row.knowledgePointId,
      title: row.displayTitle,
      learningGoals: ['从文字中找到回答问题的依据。', '积累词语，尝试完整表达。'],
      steps: blocks.map((block) => ({
        id: `${block.id}:step`,
        type: block.stepType as 'intro' | 'practice',
        title: block.title,
        contentBlockIds: [block.id],
        required: true,
        sort: block.sort,
      })),
      blocks,
      ...provenance,
      status: 'AI_GENERATED',
      contentStatus: 'AI_GENERATED',
      currentVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    return {
      knowledgePointId: row.knowledgePointId,
      textbookId: G2_REVISED_CHINESE_TEXTBOOK_ID,
      unitId: row.unitId,
      lessonId: row.lessonId,
      learningContent,
      activities: [],
      exerciseTemplates: [],
      practiceSets: [],
      extensionActivities: [
        {
          id: `${id}:words`,
          knowledgePointId: row.knowledgePointId,
          title: '词语变成一句话',
          instruction: `从“${row.practice.words.join('、')}”中选一个词语，说或写一句完整的话。`,
          content: {
            blocks: [
              { type: 'hint', value: '想一想：谁在什么地方做什么？也可以介绍一个事物的样子。' },
            ],
          },
          referenceAnswer:
            '表达可以不同。检查词语意思是否合适、句子是否通顺；这道开放表达题不自动判分。',
          ...provenance,
        },
      ],
      challenges: [
        {
          id: `${id}:expression`,
          knowledgePointId: row.knowledgePointId,
          title: '读懂以后说一说',
          instruction: row.practice.expression,
          content: { blocks: [{ type: 'hint', value: '先回到文字找依据，再组织自己的语言。' }] },
          referenceAnswer: `阅读提示：${row.practice.answer}。开放表达没有唯一答案，可和家人一起交流。`,
          ...provenance,
        },
      ],
    }
  })
