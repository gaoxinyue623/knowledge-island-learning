import { gradeFourEnglishUpperDefinitions as englishFourUpper } from '../grade-4/english-shanghai-upper-2022'
import { gradeFiveEnglishLowerDefinitions as englishFiveLower } from '../grade-5/english-shanghai-lower'
import { gradeSixEnglishLowerDefinitions as englishSixLower } from '../grade-6/english-shanghai-lower'
import { gradeSixEnglishUpperDefinitions as englishSixUpper } from '../grade-6/english-shanghai-upper-2022'
import { gradeFiveEnglishUpperDefinitions as englishFiveUpper } from '../grade-5/english-shanghai-upper-2022'
import { gradeFourEnglishLowerDefinitions as englishFourLower } from '../grade-4/english-shanghai-lower-2022'
import { gradeThreeEnglishLowerDefinitions as englishThreeLower } from '../grade-3/english-shanghai-lower-2022'
import { gradeThreeEnglishUpperDefinitions as englishThreeUpper } from '../grade-3/english-shanghai-upper-2022'
import type { CurriculumData } from '../types'
import type { ContentSource, Question, QuestionKnowledgePoint, TextbookVersion } from '@/types'
import { gradeOneShenzhenEnglishUpperLessonPracticeDefinitions as englishOneUpper } from '../grade-1/english-shanghai-upper'
import { gradeOneShenzhenEnglishLowerLessonPracticeDefinitions as englishOneLower } from '../grade-1/english-shanghai-lower'
import { gradeTwoShenzhenEnglishUpperLessonPracticeDefinitions as englishTwoUpper } from '../grade-2/english-shanghai-upper'
import { shenzhenEnglishLowerDefinitions as englishTwoLower } from '../grade-2/shenzhen-english-lower'

export const comprehensiveSupplementSource: ContentSource = {
  id: 'COMPREHENSIVE_ORIGINAL_SUPPLEMENT_20261009_V1',
  title: '单元与期末测验原创补充题（语文综合运用、英语词汇）',
  sourceType: 'AI_GENERATED',
  sourceRef: 'local-original://comprehensive-assessment/2026-10-09/v1',
  sourceVersion: 'V1',
  copyrightStatus: 'CLEARED',
  verificationStatus: 'REVIEWED',
  verifiedAt: '2026-10-09T00:00:00.000Z',
  notes:
    '按用户要求补齐测验范围。项目原创题，依据已接入课程的标题、学习材料和核心词汇编写；开放题使用人工检查要点，不伪造未提供的教材原文，不表示出版社审核。',
}

type Task = { prompt: string; criteria: string }
const task = (prompt: string, criteria: string): Task => ({ prompt, criteria })

/** Distinct skills, not six paraphrases of one question. All are open responses. */
function chineseTasks(title: string): Task[] {
  if (/识字表|写字表/.test(title))
    return [
      task(
        '从本课字表中选两个字，写出各自的读音，并分别组一个词。',
        '选字来自字表；读音正确，多音字的读音与所组词一致；组词成立。',
      ),
      task(
        '选一个容易混淆的字，指出它的部件或字形特点，再组两个词。',
        '选字来自字表；部件或字形说明准确；两个词都成立，无错别字。',
      ),
      task(
        '从字表选一个字，写出它的一个形近字，比较字形并分别组词。',
        '形近字与所选字在字形上有相似处；能指出不同部件或笔画；组词正确。',
      ),
      task(
        '从字表选两个字，各组一个词，再用这两个词写一段两到三句话的小片段。',
        '所选字来自字表；组词、用词准确；片段具体，句子通顺、连贯。',
      ),
      task(
        '从字表选一个字，写出一个同音字，用两个词说明这两个字的使用区别。',
        '两个字在所组词中的读音相同；组词成立；说明区别涉及词义或使用情境。',
      ),
      task(
        '用字表中的字设计一道认字或组词题，写出参考答案和容易出错的地方。',
        '题目使用字表中的字；题干清楚；答案正确；错误提醒具体。',
      ),
    ]
  if (/识字表|写字表|词语表|字词|词汇/.test(title))
    return [
      task(
        '从本课字词材料中选两个词，解释词义，并分别写一句话。',
        '词语来自本课；释义符合语境；两个句子完整，使用词语恰当。',
      ),
      task(
        '选一个容易写错的字，说明需要注意的笔画或部件，再组两个词。',
        '字来自本课；笔画或部件说明准确；组词成立，无错别字。',
      ),
      task(
        '从本课选三个词，按你自己的标准分类，并解释分类理由。',
        '三个词均来自材料；分类标准明确；分类与理由一致。',
      ),
      task(
        '选两个词写一段两到三句话的小片段，描写一个具体场景。',
        '用词符合词义；场景具体；句子通顺且前后连贯。',
      ),
      task(
        '选一个词，写出它适合出现的情境，再写出一个使用它不恰当的情境并说明原因。',
        '两个情境明确；正确情境符合词义；能解释错误情境中的词义或搭配问题。',
      ),
      task(
        '设计一道本课字词复习题，写出题目、参考答案和容易出错的地方。',
        '题目使用材料中的字词；题干清楚；参考答案正确；错误提醒具体。',
      ),
    ]
  if (/口语交际|请教|即兴发言/.test(title))
    return [
      task(
        '围绕本课交际主题，写出一段三到五句话的发言。',
        '紧扣主题；观点清楚；有具体例子；表达连贯、礼貌。',
      ),
      task(
        '为本课主题设计两个提问，一个了解事实，一个询问对方的想法。',
        '问题与主题相关；事实问题与观点问题有区别；语言清楚、尊重对方。',
      ),
      task(
        '设想同学对你的观点有不同意见。写出你的回应，先复述对方观点，再说明自己的理由。',
        '准确复述不同意见；回应有理由；不打断、不攻击对方。',
      ),
      task(
        '写出一次交流的开场白和结束语，并说明它们适合怎样的听众。',
        '开场能引出主题；结束能收束交流；语气适合所选听众。',
      ),
      task(
        '写一段本课主题的对话，至少四轮，包含一次追问和一次回应。',
        '双方轮流表达；追问承接前文；回应解决问题；围绕同一主题。',
      ),
      task(
        '选一种本课交流场景，写出你需要提前准备的两条信息和一种倾听方法。',
        '准备信息具体、相关；倾听方法可实行，例如记录关键词、复述确认或等待对方说完。',
      ),
    ]
  if (/习作|写作|初试身手/.test(title))
    return [
      task(
        '围绕本课习作主题，写一个提纲：准备写什么、按什么顺序写、重点写哪一部分。',
        '主题明确；顺序合理；重点具体；提纲各部分相关。',
      ),
      task(
        '写一段与本课习作主题相关的片段，用动作、语言或场景细节表现内容。',
        '片段切题；至少包含一种具体细节；句子完整、通顺。',
      ),
      task(
        '为你的习作写一个开头和一个结尾，说明它们怎样呼应主题。',
        '开头引入内容；结尾收束；呼应关系能说清，避免与主题无关的套话。',
      ),
      task(
        '写一句笼统的描述，再把它修改成具体的描述，说明修改了什么。',
        '原句与改句表达同一内容；改句增加可观察的细节；能解释修改效果。',
      ),
      task(
        '列出两个可用于本课习作的素材，选择其中一个并说明选择理由。',
        '素材与主题相关；两个素材有区别；选择理由涉及真实感、细节或主题表达。',
      ),
      task(
        '围绕本课习作主题写一段短文，检查后修改一处，标出修改前后并解释原因。',
        '短文切题、连贯；修改真实且有改善；说明涉及用词、顺序、细节或表达准确性。',
      ),
    ]
  if (
    /诗|诵读|卜算子|采薇|送元二使|春夜喜雨|早春呈水|江上渔者|泊船瓜洲|游园不值|浣溪沙|清平乐|长歌行|绝句|观书有感|淮中晚泊/.test(
      title,
    )
  )
    return [
      task(
        '从本课诗词中选一句，写出诗句，并用自己的话解释意思。',
        '诗句抄写准确；释义符合诗句语境，不把自己的联想说成原文事实。',
      ),
      task(
        '选一句有画面感的诗句，写出你想象的画面，并指出依据哪个词语。',
        '画面与诗句相关；明确引用依据；区分原文描写和个人想象。',
      ),
      task(
        '选一个你认为用得好的字词，说明它描写了什么，有怎样的效果。',
        '字词来自本课；分析联系上下文；效果说明具体。',
      ),
      task(
        '选两句诗，标出你建议的朗读停顿，并说明一处停顿的理由。',
        '所选诗句准确；停顿不破坏词语或句意；理由联系节奏或理解。',
      ),
      task(
        '这首诗让你体会到怎样的情感？写出判断，并用一句诗作为依据。',
        '情感判断合理；引用的诗句准确；能解释诗句与情感的联系。',
      ),
      task(
        '用两到三句话比较本课诗词中的两个景物、动作或意象。',
        '两项比较对象确实出现在诗中；有明确相同点或不同点；解释符合文本。',
      ),
    ]
  if (/综合性学习|专题|遨游汉字|汉字真有趣|我爱你，汉字|难忘小学|回忆往事/.test(title))
    return [
      task(
        '为本课专题设计一个小调查，写出调查问题、调查对象和记录方式。',
        '问题紧扣主题；对象可接触；记录方式能保留调查结果。',
      ),
      task(
        '列出一项专题活动的三个步骤，并写出所需材料。',
        '步骤有先后顺序、可执行；材料与活动匹配；关注安全和礼貌。',
      ),
      task(
        '设计一张资料记录卡，填写资料名称、来源、关键信息和需要核对的问题。',
        '四项齐全；来源可追溯；把事实、个人感想和待核实信息分开。',
      ),
      task(
        '为一次小组专题活动安排三个角色，说明分工和如何合作。',
        '角色职责清楚；任务互相衔接；有沟通或检查进度的方法。',
      ),
      task(
        '为专题成果写一段展示介绍，说明主题、做法和一个收获。',
        '三部分齐全；收获具体；没有把尚未完成的活动编写成真实结果，可标明为计划。',
      ),
      task(
        '写出一种可能遇到的活动困难，提出两个解决办法并比较。',
        '困难具体；办法可执行；比较涉及时间、资料、合作或效果。',
      ),
    ]
  if (/园地|交流平台|单元导语/.test(title))
    return [
      task(
        '从本单元已学内容中选一个表达方法，说明方法并举一个例子。',
        '方法说得清楚；例子来自已学内容或标明为原创；能说明例子怎样体现方法。',
      ),
      task(
        '用本单元学过的两个词写一段话，检查用词是否恰当，并说明一处用词的作用。',
        '词语确实学过；语段连贯；词义、搭配正确；作用说明具体。',
      ),
      task(
        '回顾本单元两篇内容，比较它们在人物、场景或表达方式上的一个异同。',
        '所选内容明确；比较角度一致；有文本依据。',
      ),
      task(
        '选择本单元的一句话，说明你从中读懂了什么，以及怎样找到依据。',
        '引用准确；理解合理；说明依据与理解之间的联系。',
      ),
      task(
        '为本单元设计一道复习题，给出参考答案，并说明它检查什么。',
        '问题具体可作答；答案与已学内容一致；考查目标清楚。',
      ),
      task(
        '写出本单元一个容易混淆的知识点，举例说明区别，再写一个检查办法。',
        '混淆点真实、具体；例子能表现区别；检查办法可以操作。',
      ),
    ]
  return [
    task(
      '概括本课材料的主要内容，再列出两条支持概括的细节。',
      '概括包含主要人物、事物或事件；两条细节来自材料且相关。',
    ),
    task(
      '找出本课材料中一个重要细节，说明它帮助你理解了什么。',
      '细节引用准确；理解与细节存在明确联系。',
    ),
    task(
      '选一句你印象深刻的话，解释含义并说明选择理由。',
      '引用来自本课；解释符合上下文；理由具体。',
    ),
    task(
      '提出一个读完材料后的问题，写出你准备怎样寻找答案。',
      '问题与材料相关；寻找答案的方法具体；不把猜测当作结论。',
    ),
    task(
      '比较材料中的两个事物、人物或场景，写出一个异同并给出依据。',
      '比较对象确实在材料中；角度一致；依据可靠。',
    ),
    task(
      '联系本课材料，写一个生活中的例子，并说明它与材料的联系。',
      '例子具体；联系能解释清楚；能区分个人经历与材料事实。',
    ),
  ]
}

const englishDefinitionsByBook = new Map<
  string,
  ReadonlyArray<{ title: string; words: ReadonlyArray<{ english: string; chinese: string }> }>
>([
  [
    'G4_SHANGHAI_ENGLISH_S1_2022',
    englishFourUpper.map((d) => ({
      ...d,
      words: d.kind === 'unit' ? [...d.words, ...d.readingWords] : [],
    })),
  ],
  ['G5_SHANGHAI_ENGLISH_S2_USER_TEXT', englishFiveLower],
  [
    'G6_SHANGHAI_ENGLISH_S2_USER_TEXT',
    englishSixLower.map((d) => ({ ...d, words: [...d.words, ...d.readingWords] })),
  ],
  [
    'G6_SHANGHAI_ENGLISH_S1_2022',
    englishSixUpper.map((d) => ({ ...d, words: [...d.words, ...d.readingWords] })),
  ],
  ['G5_SHANGHAI_ENGLISH_S1_2022', englishFiveUpper],
  ['G4_SHANGHAI_ENGLISH_S2_2022', englishFourLower],
  ['G3_SHANGHAI_ENGLISH_S2_2022', englishThreeLower],
  ['G1_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE', englishOneUpper],
  ['G1_SHENZHEN_SHANGHAI_ENGLISH_S2_2024_CANDIDATE', englishOneLower],
  ['G2_SHENZHEN_SHANGHAI_ENGLISH_S1_2024_CANDIDATE', englishTwoUpper],
  ['G2_SHENZHEN_SHANGHAI_ENGLISH_S2_2024', englishTwoLower],
  [
    'G3_SHANGHAI_ENGLISH_S1_2022',
    englishThreeUpper.map((d) => ({ ...d, words: [...d.words, ...d.aliases] })),
  ],
])

export function buildComprehensiveSupplement(
  curriculum: CurriculumData,
  questions: readonly Question[],
  mappings: readonly QuestionKnowledgePoint[],
) {
  const addedQuestions: Question[] = []
  const addedMappings: QuestionKnowledgePoint[] = []
  const questionById = new Map(questions.map((q) => [q.id, q]))
  const existingByPoint = new Map<string, Question[]>()
  for (const mapping of mappings) {
    const q = questionById.get(mapping.questionId)
    if (!q || q.tags.includes('unit-sync-only')) continue
    const pool = existingByPoint.get(mapping.knowledgePointId) ?? []
    pool.push(q)
    existingByPoint.set(mapping.knowledgePointId, pool)
  }
  const points = new Map(curriculum.knowledgePoints.map((p) => [p.id, p]))
  const contents = new Map(curriculum.courseContents.map((c) => [c.knowledgePointId, c]))
  const books = new Map(curriculum.textbooks.map((b) => [b.id, b]))
  const units = new Map(curriculum.units.map((u) => [u.id, u]))
  const relations = new Map<string, string[]>()
  for (const r of curriculum.lessonKnowledgePointRelations) {
    const list = relations.get(r.lessonId) ?? []
    list.push(r.knowledgePointId)
    relations.set(r.lessonId, list)
  }
  const seen = new Set<string>()
  function add(
    book: TextbookVersion,
    point: string,
    seed: Task,
    suffix: string,
    word?: { english: string; chinese: string },
    kind = 0,
  ) {
    const id = `COMP_V1:${book.id}:${point}:${suffix}`
    const q: Question = {
      id,
      textbookVersionId: book.id,
      knowledgePointId: point,
      gradeId: book.gradeId,
      semesterId: book.semesterId,
      subjectId: book.subjectId,
      questionType: 'shortAnswer',
      stem: [{ type: 'TEXT', text: word ? `${seed.criteria}\n${seed.prompt}` : seed.prompt }],
      answerRule: { ruleType: 'MANUAL_REVIEW' },
      difficulty: 'STANDARD',
      contentType: 'EXTENSION',
      sourceId: comprehensiveSupplementSource.id,
      status: 'PUBLISHED',
      needsVerification: false,
      verificationStatus: 'REVIEWED',
      isSample: false,
      estimatedSeconds: 180,
      tags: ['comprehensive-only', 'original-assessment-supplement'],
      media: [],
      hints: [],
      explanation: { summary: [{ type: 'TEXT', text: `检查要点：${seed.criteria}` }], steps: [] },
      questionVersion: 1,
    }
    if (word) {
      q.estimatedSeconds = 45
      if (kind === 0) {
        q.questionType = 'fillBlank'
        q.answerRule = {
          ruleType: 'TEXT_BLANKS',
          blanks: [
            {
              blankId: `${id}:blank`,
              acceptedAnswers: (englishDefinitionsByBook.get(book.id) ?? [])
                .find((d) => d.title === seed.criteria)
                ?.words.filter((w) => w.chinese === word.chinese)
                .map((w) => w.english) ?? [word.english],
              normalization: 'ENGLISH_TEXT',
            },
          ],
        }
      } else {
        const definition = (englishDefinitionsByBook.get(book.id) ?? []).find(
          (d) => d.title === seed.criteria,
        )
        const alternatives = [
          ...new Set(
            definition?.words
              .filter((w) =>
                kind === 1
                  ? w.english.toLowerCase() !== word.english.toLowerCase()
                  : w.chinese !== word.chinese,
              )
              .map((w) => (kind === 1 ? w.chinese : w.english)) ?? [],
          ),
        ]
          .filter((label) => label !== (kind === 1 ? word.chinese : word.english))
          .slice(0, 3)
        if (!alternatives.length) return
        const correct = kind === 1 ? word.chinese : word.english
        const labels = [correct, ...alternatives]
        const offset =
          suffix.split('').reduce((total, c) => total + c.charCodeAt(0), 0) % labels.length
        const shuffled = [...labels.slice(offset), ...labels.slice(0, offset)]
        q.questionType = 'singleChoice'
        q.options = shuffled.map((label, i) => ({
          id: `${id}:option:${i}`,
          questionId: id,
          optionKey: String.fromCharCode(65 + i),
          content: [{ type: 'TEXT', text: label }],
          sortOrder: i,
        }))
        q.answerRule = {
          ruleType: 'SINGLE_OPTION',
          correctOptionKey: String.fromCharCode(65 + shuffled.indexOf(correct)),
        }
      }
      q.explanation = {
        summary: [
          {
            type: 'TEXT',
            text: `${word.english}：${word.chinese}。词汇来自本课已接入的核心单词表。`,
          },
        ],
        steps: [],
      }
    }
    addedQuestions.push(q)
    addedMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: point,
      relationType: 'PRIMARY',
      weight: 1,
      order: addedMappings.length + 1,
      isPrimary: true,
      sourceId: q.sourceId,
      status: 'ACTIVE',
      needsVerification: false,
      verificationStatus: 'REVIEWED',
      isSample: false,
    })
  }
  for (const lesson of curriculum.lessons) {
    const book = books.get(units.get(lesson.unitId)?.textbookVersionId ?? '')
    if (!book) continue
    for (const pointId of relations.get(lesson.id) ?? []) {
      if (seen.has(`${book.id}:${pointId}`)) continue
      seen.add(`${book.id}:${pointId}`)
      const pool = (existingByPoint.get(pointId) ?? []).filter(
        (q) => q.textbookVersionId === book.id,
      )
      if (book.subjectId === 'SUBJECT_CHINESE' && pool.length === 0) {
        const title = points.get(pointId)?.name ?? lesson.title
        const content = contents.get(pointId)
        const blocks = content?.body.blocks as Array<{ text?: string }> | undefined
        // Source notes are not learning material. Directory-only lessons use explicitly original tasks.
        const material =
          blocks
            ?.map((b) => b.text ?? '')
            .filter(
              (text) =>
                text && text !== content?.body.summary && !text.startsWith('项目原创学习提示'),
            )
            .join('\n') ?? ''
        for (const [i, seed] of chineseTasks(title).entries()) {
          const prefix = `项目原创综合运用题 · ${title}\n`
          const context = material
            ? `学习材料节选：\n${material.slice(0, 1200)}\n\n`
            : '本题为主题实践题，请联系本课与本单元已学内容作答。\n'
          add(
            book,
            pointId,
            { prompt: `${prefix}${context}${seed.prompt}`, criteria: seed.criteria },
            `CN${i + 1}`,
          )
        }
      }
      if (book.subjectId === 'SUBJECT_ENGLISH') {
        const definition = (englishDefinitionsByBook.get(book.id) ?? []).find(
          (d) => d.title === lesson.title,
        )
        if (!definition) throw new Error(`英语测验缺少词汇来源：${lesson.id}`)
        for (const [i, word] of definition.words.entries()) {
          add(
            book,
            pointId,
            task(`根据中文提示，写出本课学过的英语单词或词组：${word.chinese}`, definition.title),
            `EN${i + 1}_SPELL`,
            word,
          )
          add(
            book,
            pointId,
            task(`“${word.english}”在本课中的中文意思是什么？`, definition.title),
            `EN${i + 1}_MEANING`,
            word,
            1,
          )
          add(
            book,
            pointId,
            task(`选择与“${word.chinese}”对应的英语单词或词组。`, definition.title),
            `EN${i + 1}_RECOGNIZE`,
            word,
            2,
          )
        }
      }
    }
  }
  return { questions: addedQuestions, mappings: addedMappings }
}
