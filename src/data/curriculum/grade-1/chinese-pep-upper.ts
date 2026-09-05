import type {
  ContentSource,
  CourseContent,
  Grade,
  KnowledgePoint,
  KnowledgePrerequisite,
  Lesson,
  LessonKnowledgePointRelation,
  Publisher,
  Region,
  RegionTextbookRelation,
  Semester,
  Subject,
  TextbookVersion,
  Unit,
} from '@/types'

import {
  importedGradeOneChineseUpperContentSources,
  importedGradeOneChineseUpperCourseContents,
} from '../imported/g1-chinese-content-import'

/**
 * Grade 1 Chinese upper-volume candidate data.
 *
 * The directory is transcribed from the user-provided textbook images. The
 * lesson cards are original learning explanations aligned to those titles;
 * they are not a reproduction of the textbook text.
 */
export const G1_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID = 'G1_PEP_CHINESE_S1_DIRECTORY_IMAGES'
export const G1_PEP_CHINESE_S1_PUBLIC_SOURCE_ID = 'G1_PEP_CHINESE_S1_PUBLIC_PRODUCT'
export const G1_PEP_CHINESE_S1_CONTENT_SOURCE_ID = 'G1_PEP_CHINESE_S1_ORIGINAL_CONTENT'
export const G1_PEP_CHINESE_S1_TEXTBOOK_ID = 'G1_PEP_CHINESE_S1_2024_CANDIDATE'
export const G1_PEP_CHINESE_PUBLISHER_ID = 'G1_PEP_CHINESE_PUBLISHER'
export const G1_PEP_CHINESE_GUANGDONG_REGION_ID = 'G1_REGION_GUANGDONG'
export const G1_PEP_CHINESE_HUBEI_REGION_ID = 'G1_REGION_HUBEI'
export const G1_PEP_CHINESE_GRADE_ID = 'GRADE_1'
export const G1_PEP_CHINESE_SEMESTER_ID = 'SEMESTER_UPPER'
export const G1_PEP_CHINESE_SUBJECT_ID = 'SUBJECT_CHINESE'

const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeOneChineseUpperCurriculumData {
  grade: Grade
  semester: Semester
  subject: Subject
  sources: ContentSource[]
  regions: Region[]
  publishers: Publisher[]
  textbooks: TextbookVersion[]
  regionTextbookRelations: RegionTextbookRelation[]
  units: Unit[]
  lessons: Lesson[]
  knowledgePoints: KnowledgePoint[]
  lessonKnowledgePointRelations: LessonKnowledgePointRelation[]
  knowledgePrerequisites: KnowledgePrerequisite[]
  courseContents: CourseContent[]
}

export const gradeOneChineseUpperGrade: Grade = {
  id: G1_PEP_CHINESE_GRADE_ID,
  code: 'G1',
  name: '一年级',
  sortOrder: 1,
  status: 'ACTIVE',
}

export const gradeOneChineseUpperSemester: Semester = {
  id: G1_PEP_CHINESE_SEMESTER_ID,
  code: 'UPPER',
  name: '上册',
  sortOrder: 1,
  status: 'ACTIVE',
}

export const gradeOneChineseUpperSubject: Subject = {
  id: G1_PEP_CHINESE_SUBJECT_ID,
  code: 'CHINESE',
  name: '语文',
  themeKey: 'CHINESE',
  status: 'ACTIVE',
}

export const gradeOneChineseUpperSources: ContentSource[] = [
  {
    id: G1_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的人教版语文一年级上册目录图片',
    publisher: '人民教育出版社',
    edition: '人教版 / 统编版（2024 修订候选）',
    sourceRef: 'user-provided://g1-chinese-upper-table-of-contents',
    sourceVersion: '目录图片 2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供的目录证据；仅用于课程结构核对',
    attribution: '用户提供的三张目录截图',
    notes:
      '只作为目录结构候选证据。教材正文学习卡由项目原创，不复制整篇课文；地区适用范围和原书版权页仍需人工核对。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_PEP_CHINESE_S1_PUBLIC_SOURCE_ID,
    sourceType: 'PUBLIC_RESOURCE',
    title: '人民教育出版社语文一年级上册公开产品页',
    publisher: '人民教育出版社',
    edition: '人教版 / 统编版（2024 修订候选）',
    sourceRef: 'https://www.pep.com.cn/rjyc/kcjc/gjkc/tbjc/yw1s/',
    sourceVersion: '2024 修订候选',
    copyrightStatus: 'PENDING',
    notes: '公开产品信息只用于候选教材身份背景，不替代实物版权页或地区选用证明。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    sourceType: 'TEACHER_CREATED',
    title: '知识岛原创学习卡：人教版语文一年级上册',
    publisher: '知识岛项目',
    edition: '按用户提供目录对齐',
    sourceRef: 'local://knowledge-island/original/g1-chinese-s1',
    sourceVersion: 'G1_CHINESE_S1_CONTENT_V1',
    copyrightStatus: 'CLEARED',
    license: '项目原创学习讲解；待人工内容审核',
    attribution: '知识岛项目原创',
    notes: '仅提供概念讲解、学习目标和活动提示，不替代教材原文。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeOneChineseUpperRegions: Region[] = [
  {
    id: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
    code: 'CN-GD',
    name: '广东省',
    level: 'PROVINCE',
    status: 'ACTIVE',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_PEP_CHINESE_HUBEI_REGION_ID,
    code: 'CN-HB',
    name: '湖北省',
    level: 'PROVINCE',
    status: 'ACTIVE',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeOneChineseUpperPublishers: Publisher[] = [
  {
    id: G1_PEP_CHINESE_PUBLISHER_ID,
    code: 'PEP',
    name: '人民教育出版社',
    shortName: '人教版',
    officialName: '人民教育出版社',
    status: 'ACTIVE',
    sourceId: G1_PEP_CHINESE_S1_PUBLIC_SOURCE_ID,
    ...UNVERIFIED,
  },
]

export const gradeOneChineseUpperTextbooks: TextbookVersion[] = [
  {
    id: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
    subjectId: G1_PEP_CHINESE_SUBJECT_ID,
    gradeId: G1_PEP_CHINESE_GRADE_ID,
    semesterId: G1_PEP_CHINESE_SEMESTER_ID,
    publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
    versionName: '人教版（统编版）语文一年级上册（2024 修订版）',
    editionYear: 2024,
    curriculumStandard: '义务教育语文课程标准（2022 年版）',
    sourceId: G1_PEP_CHINESE_S1_PUBLIC_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: '2026-09-04T00:00:00+08:00',
    updatedAt: '2026-09-04T00:00:00+08:00',
  },
]

export const gradeOneChineseUpperRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G1_PEP_CHINESE_REGION_GUANGDONG',
    regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
    textbookVersionId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2024-09-01',
    sourceId: G1_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
  {
    id: 'G1_PEP_CHINESE_REGION_HUBEI',
    regionId: G1_PEP_CHINESE_HUBEI_REGION_ID,
    textbookVersionId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2024-09-01',
    sourceId: G1_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
]

type LessonDefinition = {
  key: string
  title: string
  page: number
  directoryNo?: string
  summary: string
  learningGoals: string[]
  focus: string[]
  activity: string
  abilityTags: string[]
}

type UnitDefinition = {
  key: string
  title: string
  subtitle: string
  lessons: LessonDefinition[]
}

const lesson = (
  key: string,
  title: string,
  page: number,
  summary: string,
  learningGoals: string[],
  focus: string[],
  activity: string,
  abilityTags: string[],
  directoryNo?: string,
): LessonDefinition => ({
  key,
  title,
  page,
  summary,
  learningGoals,
  focus,
  activity,
  abilityTags,
  ...(directoryNo ? { directoryNo } : {}),
})

const units: UnitDefinition[] = [
  {
    key: 'intro',
    title: '我上学了',
    subtitle: '认识学校、同伴和语文学习的第一步。',
    lessons: [
      lesson(
        'intro-chinese',
        '我是中国人',
        2,
        '从自我介绍和同伴交流开始，认识“我”和“我们”的表达场景，建立清楚、大方说话的学习习惯。',
        ['能在交流中介绍自己。', '能认真听同伴说话并作出回应。'],
        ['自我介绍', '倾听与回应', '完整表达'],
        '和家长或同伴轮流说出自己的姓名、年级和一个喜欢的活动。',
        ['口语表达', '倾听'],
      ),
      lesson(
        'intro-country',
        '我爱我们的祖国',
        4,
        '观察与祖国有关的图画和校园场景，学习用简单、真诚的话表达对祖国和家乡的亲近感。',
        ['能说出自己看到的祖国元素。', '能用一句完整的话表达感受。'],
        ['看图说话', '情感表达', '词语积累'],
        '观察一幅家乡或祖国的图片，说出“我看到了……，我觉得……”两句话。',
        ['观察', '表达'],
      ),
      lesson(
        'intro-student',
        '我是小学生',
        6,
        '认识教室、课本和同学等校园学习对象，理解按时上课、整理物品和有礼貌交流等基本习惯。',
        ['能说出校园学习中常见的物品。', '能为自己选择一条可执行的学习小习惯。'],
        ['校园词语', '学习习惯', '图文对应'],
        '整理书包后说一说每件物品的名称和用途。',
        ['识字准备', '生活观察'],
      ),
      lesson(
        'intro-language',
        '我爱学语文',
        7,
        '认识听、说、读、写是语文学习的四个伙伴，建立爱护课本、认真倾听和大胆表达的起步意识。',
        ['能分辨听说读写四种学习活动。', '能说出一条自己想养成的语文习惯。'],
        ['听说读写', '学习用品', '学习愿望'],
        '把听、说、读、写分别配到对应的学习画面，并说出你最喜欢的一项。',
        ['学习意识', '口语表达'],
      ),
    ],
  },
  {
    key: 'unit-01',
    title: '第一单元·识字',
    subtitle: '从身边的世界认识汉字。',
    lessons: [
      lesson(
        'u01-01',
        '1 天地人',
        8,
        '把“天、地、人”放回自然和生活的图景中，练习看图认字、听音认字和用词语指向真实事物。',
        ['认识天、地、人三个字。', '能把字音、字形和图景联系起来。'],
        ['看图识字', '字音辨认', '词语联想'],
        '指一指天空、地面和身边的人，再读出对应的字。',
        ['识字', '观察'],
      ),
      lesson(
        'u01-02',
        '2 金木水火土',
        9,
        '认识表示自然材料和元素的常用字，感受短句的节奏，并练习按顺序朗读和分类记忆。',
        ['认识金、木、水、火、土等字。', '能按节奏朗读短句并进行简单分类。'],
        ['自然词语', '节奏朗读', '分类识字'],
        '把五个字分别放到“自然材料”“自然现象”两个小组里，说说你的理由。',
        ['识字', '朗读'],
      ),
      lesson(
        'u01-03',
        '3 口耳目手足',
        11,
        '从身体部位和动作出发认识汉字，建立字词与身体经验的连接，学习在生活中主动识字。',
        ['认识口、耳、目、手、足等字。', '能用动作帮助记忆字义。'],
        ['身体部位', '动作识字', '生活词语'],
        '做“我说你做”：听到一个身体部位，就用手指一指并读出它。',
        ['识字', '听辨'],
      ),
      lesson(
        'u01-04',
        '4 日月山川',
        13,
        '观察日、月、山、川等自然景物的图形和汉字，发现象形线索，练习把景物词放进短语中。',
        ['认识日、月、山、川等字。', '能用景物词说一个短语。'],
        ['自然景物', '图文对应', '词语运用'],
        '从图中找出太阳、月亮、山和河流，再用两个词组成一个短语。',
        ['识字', '词语运用'],
      ),
      lesson(
        'u01-garden',
        '语文园地一',
        15,
        '综合复习本单元汉字，练习看图认字、口头组词和有节奏地朗读，把识字方法迁移到新的生活图片中。',
        ['能用图文联系的方法复习汉字。', '能用已学字说出简单词语。'],
        ['单元复习', '组词', '迁移识字'],
        '在教室或家里找三个已经学过的字，说出它们在哪里、可以组成什么词。',
        ['复习', '迁移'],
      ),
      lesson(
        'u01-reading',
        '快乐读书吧：读书真快乐',
        19,
        '认识图画书和阅读角，学习安静翻阅、看图猜想和分享喜欢的内容，建立每天阅读一点点的习惯。',
        ['能说出一本自己喜欢的书。', '能根据封面或插图猜想书中内容。'],
        ['阅读习惯', '看封面', '分享阅读'],
        '选一本图画书，只看封面和插图，先说说你猜到的故事，再翻开验证。',
        ['阅读', '表达'],
      ),
    ],
  },
  {
    key: 'unit-02',
    title: '第二单元·汉语拼音',
    subtitle: '认识单韵母和声母，打开拼音学习之门。',
    lessons: [
      lesson(
        'u02-01',
        '1 a o e',
        20,
        '认识三个单韵母，练习口形、声音和四声的变化，为拼读音节建立清楚的听辨基础。',
        ['能认读 a、o、e。', '能听辨并读出四声变化。'],
        ['单韵母', '口形', '四声'],
        '面对镜子读 a、o、e，再用手势表示声音由低到高或由高到低的变化。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u02-02',
        '2 i u ü',
        22,
        '继续学习三个单韵母，关注 i、u、ü 的发音口形和书写位置，练习准确读出四声。',
        ['能认读 i、u、ü。', '能在四线格中观察字母位置。'],
        ['单韵母', '发音口形', '书写位置'],
        '先看口形再发音，把 i、u、ü 的四声按顺序读一遍。',
        ['拼音', '书写准备'],
      ),
      lesson(
        'u02-03',
        '3 b p m f',
        24,
        '认识四个声母，比较 b 与 p 的发音差异，练习声母与单韵母相拼的基本方法。',
        ['能认读 b、p、m、f。', '能分辨 b 与 p 的发音差异并尝试拼读。'],
        ['声母', '送气与不送气', '两拼音节'],
        '把小纸条放在嘴前，读 b 和 p，观察气流变化，再试着拼读 ba、pa。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u02-04',
        '4 d t n l',
        26,
        '认识 d、t、n、l 四个声母，练习舌位和气流的听辨，并用熟悉韵母完成简单拼读。',
        ['能认读 d、t、n、l。', '能借助拼读口诀完成简单音节。'],
        ['声母', '舌位', '两拼音节'],
        '听老师读两个音节，判断它们开头是 d 还是 t，再读出自己的答案。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u02-garden',
        '语文园地二',
        28,
        '把已学声母和韵母放在一起复习，练习认读、拼读、连线和口头表达，形成稳定的拼音学习步骤。',
        ['能按“看清—慢拼—连读”的步骤拼读。', '能在图中找出含有目标音节的词语。'],
        ['拼音复习', '拼读步骤', '图文对应'],
        '任选三个音节，先分开读声母和韵母，再合起来读，最后找一个相应的生活词。',
        ['复习', '拼音'],
      ),
    ],
  },
  {
    key: 'unit-03',
    title: '第三单元·汉语拼音',
    subtitle: '继续认识声母，练习准确拼读。',
    lessons: [
      lesson(
        'u03-05',
        '5 g k h',
        32,
        '认识 g、k、h，比较相近音的发音位置，练习声母与韵母相拼并读得连贯。',
        ['能认读 g、k、h。', '能拼读以 g、k、h 开头的简单音节。'],
        ['声母', '发音位置', '拼读'],
        '用手摸一摸喉咙，比较 g、k、h 发音时的感觉，再完成两组三拼练习。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u03-06',
        '6 j q x',
        34,
        '认识 j、q、x，重点观察它们与 ü 相拼时的书写变化，建立规则意识。',
        ['能认读 j、q、x。', '能观察并说出与 ü 相拼时的书写变化。'],
        ['声母', '拼写规则', 'ü 的变化'],
        '把 j、q、x 和 ü 组合，先读一读，再观察书写时 ü 上两点发生了什么变化。',
        ['拼音', '规则发现'],
      ),
      lesson(
        'u03-07',
        '7 z c s',
        36,
        '认识 z、c、s，练习平舌音的发音和书写，借助生活词语提高拼读的准确度。',
        ['能认读 z、c、s。', '能区分平舌音的起始声音。'],
        ['平舌音', '声母书写', '音节拼读'],
        '听三个开头音，分别把它们放到 z、c、s 的小房子里，再读出对应音节。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u03-08',
        '8 zh ch sh r',
        38,
        '认识 zh、ch、sh、r，比较翘舌音与平舌音，练习把较长的声母整体认读清楚。',
        ['能认读 zh、ch、sh、r。', '能初步区分平舌音和翘舌音。'],
        ['翘舌音', '音近辨析', '整体认读'],
        '用小镜子观察舌头位置，轮流读 z—zh、c—ch、s—sh，听一听哪里不同。',
        ['拼音', '比较'],
      ),
      lesson(
        'u03-09',
        '9 y w',
        40,
        '认识 y、w，理解它们在音节中的连接作用，练习与单韵母组合并流畅读出音节。',
        ['能认读 y、w。', '能借助 y、w 读出相关音节。'],
        ['声母', '音节连接', '连读'],
        '把 y、w 看作“连接小桥”，将它们放到合适的音节前面并连读。',
        ['拼音', '拼读'],
      ),
      lesson(
        'u03-garden',
        '语文园地三',
        42,
        '综合复习本单元声母，整理平舌音、翘舌音和拼写规则，提升看图拼读与口头表达能力。',
        ['能按发音特点整理声母。', '能完成看图拼读并说出词语。'],
        ['声母整理', '音近辨析', '看图拼读'],
        '制作一张“平舌音和翘舌音”小卡片，分别写下声母并读给同伴听。',
        ['复习', '分类'],
      ),
    ],
  },
  {
    key: 'unit-04',
    title: '第四单元·汉语拼音',
    subtitle: '认识复韵母和鼻韵母，提升拼读连贯性。',
    lessons: [
      lesson(
        'u04-10',
        '10 ai ei ui',
        45,
        '认识 ai、ei、ui 三个复韵母，感受声音由一个位置滑向另一个位置的变化，练习四声。',
        ['能认读 ai、ei、ui。', '能读准复韵母的滑动口形和声调。'],
        ['复韵母', '口形变化', '声调'],
        '慢慢拉长声音读 ai、ei、ui，注意口形从前一个音滑向后一个音。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u04-11',
        '11 ao ou iu',
        47,
        '认识 ao、ou、iu，练习复韵母的连续发音，并在熟悉词语中检查拼读是否准确。',
        ['能认读 ao、ou、iu。', '能在音节中准确读出复韵母。'],
        ['复韵母', '四声', '词语拼读'],
        '听音找朋友：老师读一个复韵母，你从卡片中找出对应字母组合。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u04-12',
        '12 ie üe er',
        49,
        '认识 ie、üe、er，观察 üe 的拼写规则和 er 的特殊发音，练习准确认读。',
        ['能认读 ie、üe、er。', '能说出 üe 与 j、q、x 相拼时的书写变化。'],
        ['复韵母', '特殊韵母', '拼写规则'],
        '把 ie、üe、er 分成三组，分别读出声音并圈出最容易读错的地方。',
        ['拼音', '规则发现'],
      ),
      lesson(
        'u04-13',
        '13 an en in un ün',
        51,
        '认识五个前鼻韵母，练习鼻音结尾的听辨和拼读，建立看清韵母再连读的习惯。',
        ['能认读 an、en、in、un、ün。', '能听辨鼻韵母结尾的声音。'],
        ['前鼻韵母', '鼻音', '音节拼读'],
        '用手轻触鼻翼，比较读普通韵母和鼻韵母时的声音感觉，再完成听音辨认。',
        ['拼音', '听辨'],
      ),
      lesson(
        'u04-14',
        '14 ang eng ing ong',
        54,
        '认识四个后鼻韵母，比较前鼻韵母和后鼻韵母的声音差异，练习读准并运用到词语中。',
        ['能认读 ang、eng、ing、ong。', '能初步区分前鼻韵母和后鼻韵母。'],
        ['后鼻韵母', '前后鼻音', '词语拼读'],
        '把听到的音节放进“前鼻音”或“后鼻音”框里，再读出完整音节。',
        ['拼音', '比较'],
      ),
      lesson(
        'u04-garden',
        '语文园地四',
        56,
        '整理单韵母、复韵母和鼻韵母，练习带调拼读和看图说词，为进入阅读学习做好准备。',
        ['能按韵母类别整理拼音。', '能读出带调音节并尝试组词。'],
        ['韵母分类', '带调拼读', '组词'],
        '画三座小岛，分别写上单韵母、复韵母、鼻韵母，再把卡片送回正确的小岛。',
        ['复习', '分类'],
      ),
    ],
  },
  {
    key: 'unit-05',
    title: '第五单元·阅读',
    subtitle: '在季节、自然和童谣中开始阅读。',
    lessons: [
      lesson(
        'u05-01',
        '1 秋天',
        60,
        '借助秋天的景物变化学习观察季节，练习从图画和文字中找出明显信息，并按顺序表达。',
        ['能说出秋天的两个特点。', '能根据图文信息完成简单复述。'],
        ['季节观察', '信息提取', '朗读节奏'],
        '观察秋天的图片，按“天空—树木—田野”的顺序说出你看到的变化。',
        ['阅读', '观察'],
      ),
      lesson(
        'u05-02',
        '2 江南',
        62,
        '观察江南水乡的采莲画面，感受诗歌的节奏和画面感，练习用方位词描述景物位置。',
        ['能说出画面中的主要景物。', '能用简单方位词描述景物。'],
        ['诗歌节奏', '水乡景物', '方位表达'],
        '在图上找出水、荷叶和小船，用“上面、下面、旁边”等词说一说位置。',
        ['阅读', '口语表达'],
      ),
      lesson(
        'u05-03',
        '3 雪地里的小画家',
        64,
        '通过雪地脚印认识不同动物的行动特点，练习比较、观察和用“谁做什么”的句式表达。',
        ['能根据脚印猜测动物。', '能说出动物行动与留下痕迹的关系。'],
        ['动物脚印', '比较观察', '句式表达'],
        '给四种脚印找主人，再用“谁在雪地里做什么”说完整句子。',
        ['阅读', '推断'],
      ),
      lesson(
        'u05-04',
        '4 四季',
        66,
        '观察春夏秋冬的代表性景物，练习按季节排序和用拟人化口吻表达对自然的感受。',
        ['能按顺序说出四季。', '能为每个季节选择合适的景物。'],
        ['四季顺序', '景物分类', '朗读语气'],
        '把四季图片排成一条时间小路，并为每一季说一句自己的观察。',
        ['阅读', '分类'],
      ),
      lesson(
        'u05-garden',
        '语文园地五',
        68,
        '复习季节和自然主题词语，练习看图说话、朗读和简单的口语交际，把阅读发现说给别人听。',
        ['能按主题整理词语。', '能围绕一幅图说出两句连贯的话。'],
        ['主题识字', '看图说话', '口语交际'],
        '选择一个季节画小图，写或贴上两个关键词，再向同伴介绍。',
        ['复习', '表达'],
      ),
    ],
  },
  {
    key: 'unit-06',
    title: '第六单元·识字',
    subtitle: '在对韵、会意和校园生活中继续识字。',
    lessons: [
      lesson(
        'u06-05',
        '5 对韵歌',
        73,
        '在成对词语和有节奏的朗读中发现反义、对应和押韵关系，积累表示自然景物的词语。',
        ['能读出成对词语的节奏。', '能尝试说出一组相对应的词语。'],
        ['对韵', '反义对应', '节奏朗读'],
        '老师说“上”，你找一个相对应的词；再把两组词连起来读。',
        ['识字', '朗读'],
      ),
      lesson(
        'u06-06',
        '6 日月明',
        74,
        '观察由两个熟字组合成新字的现象，理解会意识字的思路，并练习用熟字帮助记住新字。',
        ['能发现部分会意字的构字线索。', '能用“熟字组合”方法记忆新字。'],
        ['会意字', '构字线索', '识字方法'],
        '把两个熟字卡片合在一起，猜一猜新字可能表示什么，再查卡片验证。',
        ['识字', '发现'],
      ),
      lesson(
        'u06-07',
        '7 小书包',
        76,
        '围绕书包里的学习用品识字，练习按类别整理物品，并用完整句子介绍物品的用途。',
        ['能认识常见学习用品词语。', '能按用途或位置整理书包。'],
        ['学习用品', '分类整理', '生活表达'],
        '打开书包做一次小整理，边整理边说“这是……，它用来……”。',
        ['识字', '生活实践'],
      ),
      lesson(
        'u06-08',
        '8 升国旗',
        78,
        '在校园升旗场景中认识相关词语，学习观察动作顺序，用庄重、清楚的语气表达尊重和祝愿。',
        ['能说出升旗场景中的主要人物和动作。', '能用合适的语气朗读相关语句。'],
        ['校园场景', '动作顺序', '朗读语气'],
        '按“准备—升旗—敬礼”的顺序排列图片，再说出每一步发生了什么。',
        ['识字', '表达'],
      ),
      lesson(
        'u06-garden',
        '语文园地六',
        80,
        '综合复习对韵词、会意字和校园词语，练习分类识字、看图表达和把方法用到新字上。',
        ['能用分类和构字线索复习汉字。', '能围绕校园图片说出连续动作。'],
        ['识字方法', '词语分类', '连续表达'],
        '从校园图片中找出三个词语，分别说出它们属于什么类别。',
        ['复习', '迁移'],
      ),
    ],
  },
  {
    key: 'unit-07',
    title: '第七单元·阅读',
    subtitle: '从儿童生活和想象中学习表达。',
    lessons: [
      lesson(
        'u07-05',
        '5 小小的船',
        84,
        '借助月亮、星星和夜空的图景展开想象，练习找出画面信息，用自己的话描述看到的景色。',
        ['能说出夜空图景中的主要事物。', '能用想象补充一个画面细节。'],
        ['夜空观察', '想象表达', '朗读语气'],
        '闭上眼想象自己来到夜空，说出你看见的两样东西和正在做的事情。',
        ['阅读', '想象'],
      ),
      lesson(
        'u07-06',
        '6 影子',
        86,
        '观察影子随光线和位置变化的现象，练习用“前后左右”描述关系，培养从生活中发现问题的习惯。',
        ['能说出影子出现的条件。', '能用方位词描述影子的位置。'],
        ['影子观察', '方位词', '生活发现'],
        '在阳光下观察自己和物体的影子，记录影子在不同时间的位置变化。',
        ['阅读', '观察'],
      ),
      lesson(
        'u07-07',
        '7 两件宝',
        88,
        '认识双手和大脑在学习与劳动中的作用，练习从短文中提取关键信息，并联系自己的行动表达计划。',
        ['能说出双手和大脑各自能做什么。', '能为一件小任务说出行动步骤。'],
        ['关键信息', '动手动脑', '行动计划'],
        '选择一个小任务，先说“我用脑子想什么”，再说“我用双手做什么”。',
        ['阅读', '计划'],
      ),
      lesson(
        'u07-garden',
        '语文园地七',
        90,
        '复习儿童生活主题词语和方位表达，练习按顺序讲述一件小事，提升从图片到句子的转换能力。',
        ['能用方位词和动作词描述画面。', '能按先后顺序讲一件小事。'],
        ['生活识字', '方位表达', '顺序表达'],
        '看三幅连续图，用“先……再……最后……”讲出小故事。',
        ['复习', '叙述'],
      ),
    ],
  },
  {
    key: 'unit-08',
    title: '第八单元·阅读',
    subtitle: '在观察和解决问题中练习阅读。',
    lessons: [
      lesson(
        'u08-08',
        '8 比尾巴',
        95,
        '观察不同动物的外形特点，练习比较长短、弯直等特征，并用问答方式清楚表达发现。',
        ['能说出动物尾巴的明显特点。', '能用问答句式进行比较。'],
        ['外形观察', '比较词', '问答表达'],
        '给动物尾巴按“长短、弯直、粗细”等特点分类，再说出比较结果。',
        ['阅读', '比较'],
      ),
      lesson(
        'u08-09',
        '9 乌鸦喝水',
        97,
        '跟随乌鸦解决喝水问题的过程，练习找出遇到的问题、想到的办法和最后的结果，学习尝试解决问题。',
        ['能按顺序复述故事中的问题和办法。', '能为生活中的小困难提出一个办法。'],
        ['故事顺序', '问题与办法', '简单推断'],
        '把“发现困难—尝试办法—解决问题”三张卡片排好，再说说你为什么这样排。',
        ['阅读', '推理'],
      ),
      lesson(
        'u08-10',
        '10 雨点儿',
        99,
        '观察雨点与土地、花草之间的联系，练习从对话和画面中找信息，表达对自然变化的发现。',
        ['能说出雨点给不同地方带来的变化。', '能根据图文信息完成简单回答。'],
        ['自然变化', '对话理解', '信息提取'],
        '观察下雨前后的图片，找出发生变化的地方，并用“因为……所以……”说一句话。',
        ['阅读', '观察'],
      ),
      lesson(
        'u08-garden',
        '语文园地八',
        101,
        '回顾本册阅读、识字和拼音方法，练习把观察、比较、排序和表达方法综合运用到新图景中。',
        ['能选择合适的方法阅读一幅新图。', '能用完整句子说出自己的发现。'],
        ['方法回顾', '综合表达', '阅读迁移'],
        '挑一幅没见过的图片，先观察，再提取三个信息，最后用两句话介绍它。',
        ['复习', '迁移'],
      ),
    ],
  },
]

const unitRecords: Unit[] = units.map((unit, index) => ({
  id: `G1_PEP_CHINESE_S1_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  textbookVersionId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
  code: `G1_PEP_CHINESE_S1_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  title: unit.title,
  subtitle: unit.subtitle,
  sortOrder: index + 1,
  sceneKey: `g1-chinese-${unit.key}`,
  status: 'ACTIVE',
  sourceId: G1_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRows = units.flatMap((unit, unitIndex) => {
  const unitRecord = unitRecords[unitIndex]
  if (!unitRecord) throw new Error(`G1_CHINESE_UNIT_MISSING:${unit.key}`)
  return unit.lessons.map((definition, lessonIndex) => ({
    definition,
    unit,
    unitRecord,
    lessonIndex,
  }))
})

const lessonRecords: Lesson[] = lessonRows.map(({ definition, unitRecord }, index) => ({
  id: `G1_PEP_CHINESE_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
  unitId: unitRecord.id,
  code: `G1_PEP_CHINESE_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
  title: definition.title,
  sortOrder: lessonRows[index]?.lessonIndex + 1 || 1,
  status: 'ACTIVE',
  sourceId: G1_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const knowledgePointRecords: KnowledgePoint[] = lessonRows.map(({ definition }, index) => ({
  id: `G1_PEP_CHINESE_S1_KP_${String(index + 1).padStart(2, '0')}`,
  code: `CN-G1-S1-${String(index + 1).padStart(2, '0')}`,
  name: `${definition.title} · 学习要点`,
  subjectId: G1_PEP_CHINESE_SUBJECT_ID,
  gradeScope: { minGrade: 1, maxGrade: 1, explicitGradeIds: [G1_PEP_CHINESE_GRADE_ID] },
  description: definition.summary,
  learningObjective: [...definition.learningGoals],
  abilityTags: [...definition.abilityTags, 'g1-chinese'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G1_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeOneChineseUpperLessons: Lesson[] = lessonRecords
export const gradeOneChineseUpperKnowledgePoints: KnowledgePoint[] = knowledgePointRecords

export const gradeOneChineseUpperLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G1_PEP_CHINESE_S1_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G1_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeOneChineseUpperKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G1_PEP_CHINESE_S1_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G1_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

export const gradeOneChineseUpperOriginalCourseContents: CourseContent[] =
  lessonRows.map<CourseContent>(({ definition }, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G1_CHINESE_LESSON_CONTENT_MISSING:${index}`)
    return {
      id: `G1_PEP_CHINESE_S1_CONTENT_${String(index + 1).padStart(2, '0')}`,
      knowledgePointId,
      title: `${definition.title} · 知识岛学习卡`,
      contentType: 'EXTENSION',
      contentFormat: 'TEXT',
      body: {
        lessonId,
        directoryPage: definition.page,
        directoryNumber: definition.directoryNo ?? null,
        summary: definition.summary,
        learningGoals: [...definition.learningGoals],
        focus: [...definition.focus],
        activity: definition.activity,
        blocks: [
          { type: 'TEXT', text: definition.summary },
          { type: 'TEXT', text: `学习重点：${definition.focus.join('；')}。` },
          { type: 'TEXT', text: `小练习：${definition.activity}` },
        ],
      },
      difficulty: 'FOUNDATION',
      sourceId: G1_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
      needsVerification: true,
      status: 'DRAFT',
      currentVersion: 1,
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      createdAt: '2026-09-04T00:00:00+08:00',
      updatedAt: '2026-09-04T00:00:00+08:00',
    }
  })

/**
 * A local PDF import is the current development content source. The original
 * learning-card fallback remains available only when no import has been
 * generated, so stale placeholder content cannot appear beside the imported
 * textbook pages.
 */
export const gradeOneChineseUpperCourseContents: CourseContent[] =
  importedGradeOneChineseUpperCourseContents.length > 0
    ? [...importedGradeOneChineseUpperCourseContents]
    : gradeOneChineseUpperOriginalCourseContents

export const gradeOneChineseUpperCurriculum: GradeOneChineseUpperCurriculumData = {
  grade: gradeOneChineseUpperGrade,
  semester: gradeOneChineseUpperSemester,
  subject: gradeOneChineseUpperSubject,
  sources: [...gradeOneChineseUpperSources, ...importedGradeOneChineseUpperContentSources],
  regions: gradeOneChineseUpperRegions,
  publishers: gradeOneChineseUpperPublishers,
  textbooks: gradeOneChineseUpperTextbooks,
  regionTextbookRelations: gradeOneChineseUpperRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeOneChineseUpperLessons,
  knowledgePoints: gradeOneChineseUpperKnowledgePoints,
  lessonKnowledgePointRelations: gradeOneChineseUpperLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeOneChineseUpperKnowledgePrerequisites,
  courseContents: gradeOneChineseUpperCourseContents,
}
