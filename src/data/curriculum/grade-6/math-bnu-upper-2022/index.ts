import outline from './outlines.json'
import {
  G6_BNU_MATH_IMPORTED_AT,
  G6_BNU_MATH_IMPORT_APPROVAL,
} from '../../production/gradeSixBnuMathApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G6_BNU_MATH_S1_TEXTBOOK_ID = 'G6_BNU_MATH_S1_2022_USER_OUTLINE'
const reviewed = {
  verificationStatus: 'REVIEWED' as const,
  needsVerification: false,
  isSample: false,
  releaseApprovalId: G6_BNU_MATH_IMPORT_APPROVAL,
}
interface Topic {
  summary: string
  example: string
  activity: string
  goals: string[]
  questions: Array<{ stem: string; options: string[]; correctIndex: number; explanation: string }>
}
const topics: Record<string, Topic> = outline.topics
export interface GradeSixBnuMathLesson {
  title: string
  topicKey: string
  unitId: string
  lessonId: string
  knowledgePointId: string
  textbookId: string
  sourceId: string
  exerciseSourceId: string
  content: CourseContent
  questions: Question[]
}
export const gradeSixBnuMathLessons: GradeSixBnuMathLesson[] = []
export const gradeSixBnuMathCurriculum: Pick<
  CurriculumData,
  | 'textbooks'
  | 'units'
  | 'lessons'
  | 'knowledgePoints'
  | 'lessonKnowledgePointRelations'
  | 'knowledgePrerequisites'
  | 'courseContents'
  | 'sources'
> = {
  textbooks: [],
  units: [],
  lessons: [],
  knowledgePoints: [],
  lessonKnowledgePointRelations: [],
  knowledgePrerequisites: [],
  courseContents: [],
  sources: [],
}
export const gradeSixBnuMathQuestions: Question[] = []
export const gradeSixBnuMathMappings: QuestionKnowledgePoint[] = []
export const gradeSixBnuMathBundles: ContentExpansionBundle[] = []
for (const edition of outline.editions) {
  const textbookId = G6_BNU_MATH_S1_TEXTBOOK_ID
  const prefix = `G6_BNU_MATH_S1_${edition.edition}`
  const sourceId = `${prefix}_USER_OUTLINE`
  const exerciseSourceId = `${prefix}_ORIGINAL_PRACTICE_V1`
  gradeSixBnuMathCurriculum.textbooks.push({
    id: textbookId,
    subjectId: 'SUBJECT_MATH',
    gradeId: 'GRADE_6',
    semesterId: 'SEMESTER_UPPER',
    publisherId: 'PUBLISHER_BNU',
    versionName: edition.name,
    editionYear: 2022,
    sourceId,
    status: 'ACTIVE',
    createdAt: G6_BNU_MATH_IMPORTED_AT,
    updatedAt: G6_BNU_MATH_IMPORTED_AT,
    ...reviewed,
  })
  gradeSixBnuMathCurriculum.sources.push(
    {
      id: sourceId,
      sourceType: 'TEXTBOOK',
      title: `${edition.name}用户提供目录与知识提要`,
      sourceRef: `user-provided://bnu-math-g6-upper/${edition.edition}/2026-10-09`,
      edition: edition.name,
      sourceVersion: 'USER_OUTLINE_2026_10_09_V1',
      copyrightStatus: 'PENDING',
      notes: outline.editionNote,
      verifiedAt: G6_BNU_MATH_IMPORTED_AT,
      ...reviewed,
    },
    {
      id: exerciseSourceId,
      sourceType: 'AI_GENERATED',
      title: `${edition.name}原创讲解、例子与配套练习`,
      sourceRef: `local-original://bnu-math-g6-upper/${edition.edition}/v1`,
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据用户知识提要编写并校验，非教材原文或原题；不继承旧教材审核日期。',
      verifiedAt: G6_BNU_MATH_IMPORTED_AT,
      ...reviewed,
    },
  )
  let lessonIndex = 0
  for (const [unitIndex, chapter] of edition.chapters.entries()) {
    const unitId = `${prefix}_UNIT_${String(unitIndex + 1).padStart(2, '0')}`
    gradeSixBnuMathCurriculum.units.push({
      id: unitId,
      textbookVersionId: textbookId,
      code: `${prefix}-U${unitIndex + 1}`,
      title: chapter.title,
      subtitle: '用户提供知识提要与原创配套内容。',
      sortOrder: unitIndex + 1,
      sceneKey: `math-upper-${edition.edition}-${unitIndex + 1}`,
      sourceId,
      status: 'ACTIVE',
      ...reviewed,
    })
    let previousPoint: string | undefined
    for (const [position, entry] of chapter.lessons.entries()) {
      const code = String(++lessonIndex).padStart(2, '0')
      const lessonId = `${prefix}_LESSON_${code}`,
        knowledgePointId = `${prefix}_KP_${code}`
      const topic = topics[entry.topicKey]
      if (!topic) throw new Error(`Missing BNU grade 6 topic: ${entry.topicKey}`)
      gradeSixBnuMathCurriculum.lessons.push({
        id: lessonId,
        unitId,
        code: `${prefix}-L${code}`,
        title: entry.title,
        sortOrder: position + 1,
        sourceId,
        status: 'ACTIVE',
        ...reviewed,
      })
      gradeSixBnuMathCurriculum.knowledgePoints.push({
        id: knowledgePointId,
        code: `${prefix}-K${code}`,
        name: entry.title,
        subjectId: 'SUBJECT_MATH',
        gradeScope: { minGrade: 6, maxGrade: 6, explicitGradeIds: ['GRADE_6'] },
        description: topic.summary,
        learningObjective: [...topic.goals],
        abilityTags: ['数学理解', '方法解释', '生活应用'],
        difficultyLevel: 'FOUNDATION',
        sourceId,
        status: 'ACTIVE',
        ...reviewed,
      })
      gradeSixBnuMathCurriculum.lessonKnowledgePointRelations.push({
        id: `${prefix}_LKP_${code}`,
        lessonId,
        knowledgePointId,
        relationType: 'CORE',
        order: 1,
        isPrimary: true,
        sourceId,
        status: 'ACTIVE',
        ...reviewed,
      })
      // Recommended order only within a unit; changing versions does not create prerequisites across books.
      if (previousPoint)
        gradeSixBnuMathCurriculum.knowledgePrerequisites.push({
          id: `${prefix}_PRE_${code}`,
          prerequisiteKnowledgePointId: previousPoint,
          dependentKnowledgePointId: knowledgePointId,
          relationType: 'RECOMMENDED',
          sourceId,
          status: 'VERIFIED',
          ...reviewed,
        })
      previousPoint = knowledgePointId
      const content: CourseContent = {
        id: `${knowledgePointId}_CONTENT_V1`,
        knowledgePointId,
        title: entry.title,
        contentType: 'EXTENSION',
        contentFormat: 'TEXT',
        body: {
          lessonId,
          sourceScope: 'USER_OUTLINE_ORIGINAL_COMPANION',
          sourceNote: outline.editionNote,
          suppliedOutline: chapter.providedOutline,
          learningGoals: topic.goals,
          summary: topic.summary,
          blocks: [
            {
              type: 'TEXT',
              text: `${entry.title}\n\n用户提供的单元提要\n${chapter.providedOutline}\n\n学习目标\n${topic.goals.join('\n')}`,
            },
            { type: 'TEXT', text: `知识讲解\n${topic.summary}` },
            { type: 'TEXT', text: `原创例子与解法\n${topic.example}` },
            {
              type: 'TEXT',
              text: `动手探究\n${topic.activity}\n\n先自己试一试，表达和操作活动不自动判分。`,
            },
            {
              type: 'TEXT',
              text: `回顾与检查\n说出本课的方法，检查单位、数位、条件与结果是否一致。\n\n${outline.editionNote}`,
            },
          ],
        },
        difficulty: 'FOUNDATION',
        sourceId: exerciseSourceId,
        status: 'PUBLISHED',
        currentVersion: 1,
        createdAt: G6_BNU_MATH_IMPORTED_AT,
        updatedAt: G6_BNU_MATH_IMPORTED_AT,
        ...reviewed,
      }
      const questions: Question[] = topic.questions.map((seed, index) => {
        const id = `${knowledgePointId}_Q${index + 1}`
        const rotated = seed.options.map((label, optionIndex) => ({
          label,
          originalIndex: optionIndex,
        }))
        const offset = (lessonIndex + index) % rotated.length
        const options = [...rotated.slice(offset), ...rotated.slice(0, offset)]
        return {
          id,
          questionType: 'singleChoice',
          textbookVersionId: textbookId,
          knowledgePointId,
          gradeId: 'GRADE_6',
          semesterId: 'SEMESTER_UPPER',
          subjectId: 'SUBJECT_MATH',
          stem: [{ type: 'TEXT', text: seed.stem }],
          options: options.map((option, order) => ({
            id: `${id}:option:${order}`,
            questionId: id,
            optionKey: String.fromCharCode(65 + order),
            sortOrder: order,
            content: [{ type: 'TEXT', text: option.label }],
          })),
          answerRule: {
            ruleType: 'SINGLE_OPTION',
            correctOptionKey: String.fromCharCode(
              65 + options.findIndex((option) => option.originalIndex === seed.correctIndex),
            ),
          },
          difficulty: index === 0 ? 'FOUNDATION' : 'STANDARD',
          contentType: 'EXTENSION',
          sourceId: exerciseSourceId,
          status: 'PUBLISHED',
          estimatedSeconds: 60,
          tags: ['bnu-g6-upper-original', entry.topicKey],
          hints: [
            {
              id: `${id}:hint`,
              order: 1,
              trigger: 'ON_REQUEST',
              content: [
                {
                  type: 'TEXT',
                  text: '先读清条件，回看本课例子；用画图、列式或逐条排除说明依据。',
                },
              ],
            },
          ],
          explanation: { summary: [{ type: 'TEXT', text: seed.explanation }], steps: [] },
          media: [],
          questionVersion: 1,
          ...reviewed,
        }
      })
      const mappings: QuestionKnowledgePoint[] = questions.map((question, index) => ({
        id: `mapping:${question.id}`,
        questionId: question.id,
        knowledgePointId,
        relationType: 'PRIMARY',
        weight: 1,
        order: index + 1,
        isPrimary: true,
        sourceId: exerciseSourceId,
        status: 'ACTIVE',
        ...reviewed,
      }))
      const blocks: LearningContent['blocks'] = (
        content.body.blocks as Array<{ type: 'TEXT'; text: string }>
      ).map((block, index) => ({
        id: `${content.id}:block:${index}`,
        block,
        stepType: ['intro', 'concept', 'example', 'interactive', 'summary'][index]!,
        title: ['学习目标', '知识讲解', '原创例子', '动手探究', '回顾检查'][index]!,
        sort: index + 1,
        ...reviewed,
      }))
      const learningContent: LearningContent = {
        id: `${knowledgePointId}:learning:v1`,
        lessonId,
        knowledgePointId,
        title: entry.title,
        learningGoals: topic.goals,
        blocks,
        steps: blocks.map((block, index) => ({
          id: `${block.id}:step`,
          type: ['intro', 'concept', 'example', 'interactive', 'summary'][
            index
          ] as LearningContent['steps'][number]['type'],
          title: block.title,
          contentBlockIds: [block.id],
          required: true,
          sort: index + 1,
        })),
        sourceId: exerciseSourceId,
        status: 'PUBLISHED',
        contentStatus: 'PUBLISHED',
        currentVersion: 1,
        createdAt: G6_BNU_MATH_IMPORTED_AT,
        updatedAt: G6_BNU_MATH_IMPORTED_AT,
        ...reviewed,
      }
      gradeSixBnuMathLessons.push({
        title: entry.title,
        topicKey: entry.topicKey,
        textbookId,
        unitId,
        lessonId,
        knowledgePointId,
        sourceId,
        exerciseSourceId,
        content,
        questions,
      })
      gradeSixBnuMathCurriculum.courseContents.push(content)
      gradeSixBnuMathQuestions.push(...questions)
      gradeSixBnuMathMappings.push(...mappings)
      gradeSixBnuMathBundles.push({
        textbookId,
        unitId,
        lessonId,
        knowledgePointId,
        learningContent,
        activities: [],
        exerciseTemplates: [],
        practiceSets: [],
        challenges: [],
        extensionActivities: [
          {
            id: `${knowledgePointId}:explore:v1`,
            knowledgePointId,
            title: '动手探究 · 解释你的方法',
            instruction: topic.activity,
            referenceAnswer: topic.example,
            content: {
              blocks: [
                { type: 'hint', value: '操作与表达没有唯一呈现方式，由家长协助检查，不自动评分。' },
              ],
            },
            sourceId: exerciseSourceId,
            ...reviewed,
          },
        ],
      })
    }
  }
}
