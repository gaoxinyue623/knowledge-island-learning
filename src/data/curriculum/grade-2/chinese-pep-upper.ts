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
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_PEP_CHINESE_PUBLISHER_ID,
  gradeOneChineseUpperPublishers,
  gradeOneChineseUpperRegions,
  gradeOneChineseUpperSemester,
  gradeOneChineseUpperSubject,
} from '../grade-1/chinese-pep-upper'

/**
 * Grade 2 Chinese upper-volume curriculum entered from the user-provided
 * textbook text. Content stays attached to course-content records so the map
 * only carries stable learning-point identities.
 */
export const G2_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID = 'G2_PEP_CHINESE_S1_DIRECTORY_TEXT'
export const G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID = 'G2_PEP_CHINESE_S1_TEXTBOOK_CONTENT'
export const G2_PEP_CHINESE_S1_TEXTBOOK_ID = 'G2_PEP_CHINESE_S1_2024_CANDIDATE'
export const G2_PEP_CHINESE_GRADE_ID = 'GRADE_2'
export const G2_PEP_CHINESE_S1_SEMESTER_ID = 'SEMESTER_UPPER'
export const G2_PEP_CHINESE_SEMESTER_ID = G2_PEP_CHINESE_S1_SEMESTER_ID
export const G2_PEP_CHINESE_SUBJECT_ID = 'SUBJECT_CHINESE'

const TIMESTAMP = '2026-09-04T00:00:00+08:00'
const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeTwoChineseUpperCurriculumData {
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

export const gradeTwoChineseUpperGrade: Grade = {
  id: G2_PEP_CHINESE_GRADE_ID,
  code: 'G2',
  name: '二年级',
  sortOrder: 2,
  status: 'ACTIVE',
}

export const gradeTwoChineseUpperSemester = gradeOneChineseUpperSemester
export const gradeTwoChineseUpperSubject = gradeOneChineseUpperSubject
export const gradeTwoChineseUpperRegions = gradeOneChineseUpperRegions
export const gradeTwoChineseUpperPublishers = gradeOneChineseUpperPublishers

export const gradeTwoChineseUpperSources: ContentSource[] = [
  {
    id: G2_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的统编（人教版）语文二年级上册目录与课程结构文本',
    publisher: '人民教育出版社',
    edition: '统编版 / 二年级上册（用户提供文本）',
    sourceRef: 'user-provided://g2-chinese-upper-table-of-contents',
    sourceVersion: 'USER_PROVIDED_UPPER_DIRECTORY_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供内容，仅用于本地个人开发；未提供公开再分发授权。',
    attribution: '用户在本轮提供的二年级上册课程文本',
    notes: '用于建立广东省、湖北省的二年级语文上册课程结构，不代表已完成出版物授权或外部版权核验。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的统编（人教版）语文二年级上册完整课本文本',
    publisher: '人民教育出版社',
    edition: '统编版 / 二年级上册（用户提供文本）',
    sourceRef: 'user-provided://g2-chinese-upper-full-text',
    sourceVersion: 'USER_PROVIDED_FULL_TEXT_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: '用户在本轮提供的二年级上册完整课本文本',
    notes: '课文、语文园地和附录作为本地开发数据进入课程内容层；内部审计字段继续保留。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeTwoChineseUpperTextbooks: TextbookVersion[] = [
  {
    id: G2_PEP_CHINESE_S1_TEXTBOOK_ID,
    subjectId: G2_PEP_CHINESE_SUBJECT_ID,
    gradeId: G2_PEP_CHINESE_GRADE_ID,
    semesterId: G2_PEP_CHINESE_SEMESTER_ID,
    publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
    versionName: '人教版（统编版）语文二年级上册',
    curriculumStandard: '义务教育语文课程标准（2022 年版）',
    sourceId: G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
]

export const gradeTwoChineseUpperRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G2_PEP_CHINESE_S1_REGION_GUANGDONG',
    regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
    textbookVersionId: G2_PEP_CHINESE_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-04',
    sourceId: G2_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
  {
    id: 'G2_PEP_CHINESE_S1_REGION_HUBEI',
    regionId: G1_PEP_CHINESE_HUBEI_REGION_ID,
    textbookVersionId: G2_PEP_CHINESE_S1_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-04',
    sourceId: G2_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
]

interface UpperLessonDefinition {
  title: string
  text: string
  includeAppendix?: boolean
}

interface UpperUnitDefinition {
  key: string
  title: string
  subtitle: string
  lessons: UpperLessonDefinition[]
}

const lesson = (title: string, text: string, includeAppendix = false): UpperLessonDefinition => ({
  title,
  text: text.trim(),
  ...(includeAppendix ? { includeAppendix: true } : {}),
})

const units: UpperUnitDefinition[] = [
  {
    key: 'unit-01',
    title: '第一单元·课文',
    subtitle: '在自然观察、科学想象和童话阅读中发现生命的变化。',
    lessons: [
      lesson(
        '1 小蝌蚪找妈妈',
        String.raw`
池塘里有一群小蝌蚪，大大的脑袋，黑灰色的身子，甩着长长的尾巴，快活地游来游去。

小蝌蚪游哇游，过了几天，长出了两条后腿。他们看见鲤鱼妈妈在教小鲤鱼捕食，就迎上去，问：“鲤鱼阿姨，我们的妈妈在哪里？”鲤鱼妈妈说：“你们的妈妈有四条腿，宽嘴巴。你们到那边去找吧！”

小蝌蚪游哇游，过了几天，长出了两条前腿。他们看见一只乌龟摆动着四条腿在水里游，连忙追上去，叫着：“妈妈，妈妈！”乌龟笑着说：“我不是你们的妈妈。你们的妈妈头顶上有两只大眼睛，披着绿衣裳。你们到那边去找吧！”

小蝌蚪游哇游，过了几天，尾巴变短了。他们游到荷花旁边，看见荷叶上蹲着一只大青蛙，披着碧绿的衣裳，露着雪白的肚皮，鼓着一对大眼睛。

小蝌蚪游过去，叫着：“妈妈，妈妈！”青蛙妈妈低头一看，笑着说：“好孩子，你们已经长成青蛙了，快跳上来吧！”他们后腿一蹬，向前一跳，蹦到了荷叶上。

不知什么时候，小青蛙的尾巴已经不见了。他们跟着妈妈，天天去捉害虫。`,
      ),
      lesson(
        '2 我是什么',
        String.raw`
我会变。太阳一晒，我就变成汽。升到天空，我又变成无数极小极小的点儿，连成一片，在空中飘浮。有时候我穿着白衣服，有时候我穿着黑衣服，早晨和傍晚我又把红袍披在身上。人们叫我“云”。

我在空中越升越高，体温越来越低，变成了无数小水滴。小水滴聚在一起落下来，人们叫我“雨”。有时候我变成小硬球打下来，人们就叫我“冰雹”。到了冬天，我变成小花朵飘下来，人们又叫我“雪”。

平常我在池子里睡觉，在小溪里散步，在江河里奔跑，在海洋里跳舞、唱歌、开大会。

有时候我很温和，有时候我很暴躁。我做过许多好事，灌溉田地，发动机器，帮助人们工作。我也做过许多坏事，淹没庄稼，冲毁房屋，给人们带来灾害。人们想出种种办法管住我，让我光做好事，不做坏事。

小朋友，你们猜猜，我是什么？`,
      ),
      lesson(
        '3 植物妈妈有办法',
        String.raw`
孩子如果已经长大，
就得告别妈妈，四海为家。
牛马有脚，鸟有翅膀，
植物旅行又用什么办法？

蒲公英妈妈准备了降落伞，
把它送给自己的娃娃。
只要有风轻轻吹过，
孩子们就乘着风纷纷出发。

苍耳妈妈有个好办法，
她给孩子穿上带刺的铠甲。
只要挂住动物的皮毛，
孩子们就能去田野、山洼。

豌豆妈妈更有办法，
她让豆荚晒在太阳底下。
啪的一声，豆荚炸开，
孩子们就蹦着跳着离开妈妈。

植物妈妈的办法很多很多，
不信你就仔细观察。
那里有许许多多的知识，
粗心的小朋友却得不到它。

口语交际：有趣的动物`,
      ),
      lesson(
        '语文园地一',
        String.raw`
识字加油站：花园、果园、田野、小河

字词句运用：
例：(大大的)脑袋  (黑灰色的)身子
有时候……有时候……

书写提示：作、法、都、别

日积月累
梅花【宋】王安石
墙角数枝梅，凌寒独自开。
遥知不是雪，为有暗香来。`,
      ),
      lesson(
        '快乐读书吧：读读童话故事',
        String.raw`
快乐读书吧：读读童话故事`,
      ),
    ],
  },
  {
    key: 'unit-02',
    title: '第二单元·识字',
    subtitle: '在场景、树木、动物和农事中积累量词与词语。',
    lessons: [
      lesson(
        '1 场景歌',
        String.raw`
一只海鸥，一片沙滩。
一艘军舰，一条帆船。

一方鱼塘，一块稻田。
一行垂柳，一座花园。

一道小溪，一孔石桥。
一丛翠竹，一群飞鸟。

一面队旗，一把铜号。
一队“红领巾”，一片欢笑。`,
      ),
      lesson(
        '2 树之歌',
        String.raw`
杨树高，榕树壮，
梧桐树叶像手掌。
枫树秋天叶儿红，
松柏四季披绿装。
木棉喜暖在南方，
桦树耐寒守北疆。
银杏水杉活化石，
金桂开花满院香。`,
      ),
      lesson(
        '3 拍手歌',
        String.raw`
你拍一，我拍一，动物世界很新奇。
你拍二，我拍二，孔雀锦鸡是伙伴。
你拍三，我拍三，雄鹰飞翔云彩间。
你拍四，我拍四，天空雁群会写字。
你拍五，我拍五，丛林深处有猛虎。
你拍六，我拍六，黄鹂百灵唱不休。
你拍七，我拍七，竹林熊猫在嬉戏。
你拍八，我拍八，大小动物都有家。
你拍九，我拍九，人和动物是朋友。
你拍十，我拍十，保护动物是大事。`,
      ),
      lesson(
        '4 田家四季歌',
        String.raw`
春季里，春风吹，
花开草长蝴蝶飞。
麦苗儿多嫩，桑叶儿正肥。

夏季里，农事忙，
采了蚕桑又插秧。
早起勤耕作，归来戴月光。

秋季里，稻上场，
谷像黄金粒粒香。
身体虽辛苦，心里喜洋洋。

冬季里，雪初晴，
新制棉衣暖又轻。
一年农事了，大家笑盈盈。

口语交际：做手工`,
      ),
      lesson(
        '语文园地二',
        String.raw`
识字加油站：职业：教师、工程师、魔术师、理发师、演员、营业员

字词句运用：量词练习

书写提示：园、圆、园、孔

日积月累
己所不欲，勿施于人。——《论语》
与朋友交，言而有信。——《论语》
不以规矩，不能成方圆。——《孟子》`,
      ),
    ],
  },
  {
    key: 'unit-03',
    title: '第三单元·课文',
    subtitle: '在解决问题、书信交流和亲情观察中学习表达。',
    lessons: [
      lesson(
        '4 曹冲称象',
        String.raw`
古时候有个大官，叫曹操。别人送他一头大象，他很高兴，带着儿子和官员们一同去看。

大象又高又大，身子像一堵墙，腿像四根柱子。官员们一边看一边议论：“这么大的象，到底有多重呢？”

曹操问：“谁有办法把这头大象称一称？”有的说：“得造一杆大秤，砍一棵大树做秤杆。”有的说：“有了大秤也不行啊，谁有那么大的力气提得起这杆大秤呢？”曹操听了直摇头。

曹操的儿子曹冲才七岁，他站出来，说：“我有个办法。把大象赶到一艘大船上，看船身下沉多少，就沿着水面，在船舷上画一条线。再把大象赶上岸，往船上装石头，装到船下沉到画线的地方为止。然后称一称船上的石头。石头有多重，大象就有多重。”

曹操微笑着点了点头。他叫人照曹冲说的办法去做，果然称出了大象的重量。`,
      ),
      lesson(
        '5 玲玲的画',
        String.raw`
玲玲得意地端详着自己画的《我家的一角》。这幅画明天就要参加评奖了。

“玲玲，时间不早了，快去睡觉吧！”爸爸又在催她了。
“好的，爸爸，我把画笔收拾一下就去睡。”

就在这时候，水彩笔“啪”的一声掉到了纸上，把画弄脏了。玲玲伤心地哭了起来。

“怎么了，玲玲？”爸爸放下报纸问。
“我的画弄脏了，另画一张也来不及了。”

爸爸拿起画，仔细地看了看，说：“别哭，孩子。在这儿画点儿什么，不是很好吗？”

玲玲想了想，拿起笔，在弄脏的地方画了一只小花狗。小花狗眯着眼睛，懒洋洋地趴在楼梯上，整张画看上去更好了。玲玲满意地笑了。

爸爸看了，高兴地说：“看到了吧，孩子。好多事情并不像我们想象的那么糟。只要肯动脑筋，坏事有时也能变成好事。”`,
      ),
      lesson(
        '6 一封信',
        String.raw`
爸爸出国了，要过半年才能回来。今天，露西想给爸爸写一封信。

妈妈还在厂里，露西早早回到家。她打开空调，又洗了一些土豆，削好后放在锅里。她朝窗外望了一眼。好了，她想，现在可以开始写信了。她拿出一沓纸，一支圆珠笔。

“亲爱的爸爸，”露西写道，“你不在，我们很不开心。以前每天早上你一边刮胡子，一边逗我玩。还有，家里的台灯坏了，我们修不好。从早到晚，家里总是很冷清。”

这时，妈妈回来了。她拍拍露西的肩膀，问：“是在给爸爸写信吗？”
“是的，可是我写得不好。”露西把纸揉成一团。

“那我们一起重新写吧！”说着，妈妈在她身旁坐下来。

露西边说边写：“亲爱的爸爸……”
“我们过得挺好。”妈妈接着露西的话说。
露西写下：“太阳闪闪发光。阳光下，我们的希比希又蹦又跳。”

妈妈说：“请爸爸告诉我们，螺丝刀放在哪儿。”
露西写：“这样，我们就能自己修台灯了。”

“还有，下星期天我们去看电影。”妈妈说。
“爸爸，我们天天想你。”露西在信的结尾，画了一大束鲜花。`,
      ),
      lesson(
        '7 妈妈睡了',
        String.raw`
妈妈睡了。妈妈哄我午睡的时候，自己先睡着了，睡得好熟，好香。

睡梦中的妈妈真美丽。明亮的眼睛闭上了，紧紧地闭着；弯弯的眉毛，也在睡觉，睡在妈妈红润的脸上。

睡梦中的妈妈好温柔。妈妈微微地笑着。是的，她在微微地笑着，嘴巴、眼角都笑弯了，好像在睡梦中，妈妈又想好了一个故事，等会儿讲给我听……

睡梦中的妈妈好累。妈妈的呼吸那么沉。她乌黑的头发粘在微微渗出汗珠的额头上。窗外，小鸟在唱着歌，风儿在树叶间散步，发出沙沙的响声，可是妈妈全听不到。她干了好多活，累了，乏了，她真该好好睡一觉。

口语交际：我爱做手工`,
      ),
      lesson(
        '语文园地三',
        String.raw`
识字加油站：弹钢琴、练舞蹈、唱京戏、画图画、捏泥人、下围棋、滚铁环、荡秋千

字词句运用：“一边……一边……”

书写提示：每、次、仔、细

日积月累
小儿垂钓【唐】胡令能
蓬头稚子学垂纶，侧坐莓苔草映身。
路人借问遥招手，怕得鱼惊不应人。`,
      ),
    ],
  },
  {
    key: 'unit-04',
    title: '第四单元·课文',
    subtitle: '在名胜、山水和家乡物产中学习观察与介绍。',
    lessons: [
      lesson(
        '8 古诗二首',
        String.raw`
登鹳雀楼【唐】王之涣
白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。

望庐山瀑布【唐】李白
日照香炉生紫烟，遥看瀑布挂前川。
飞流直下三千尺，疑是银河落九天。`,
      ),
      lesson(
        '9 黄山奇石',
        String.raw`
中外闻名的黄山风景区在我国安徽省南部。那里景色秀丽神奇，尤其是那些怪石，有趣极了。

就说“仙桃石”吧，它好像从天上飞下来的一个大桃子，落在山顶的石盘上。

在一座陡峭的山峰上，有一只“猴子”。它两只胳膊抱着腿，一动不动地蹲在山头，望着翻滚的云海。这就是有趣的“猴子观海”。

“仙人指路”就更有趣了！远远望去，那巨石真像一位仙人站在高高的山峰上，伸着手臂指向前方。

每当太阳升起，有座山峰上的几块巨石，就变成了一只金光闪闪的雄鸡。它伸着脖子，对着天都峰不住地啼叫。不用说，这就是著名的“金鸡叫天都”了。

黄山的奇石还有很多，如“天狗望月”“狮子抢球”“仙女弹琴”。那些叫不出名字的奇形怪状的岩石，正等你去给它们起名字呢！`,
      ),
      lesson(
        '10 日月潭',
        String.raw`
日月潭很深，湖水碧绿。湖中央有个美丽的小岛，把湖水分成两半，北边像圆圆的太阳，叫日潭；南边像弯弯的月亮，叫月潭。

清晨，湖面上飘着薄薄的雾。天边的晨星和山上的点点灯光，隐隐约约地倒映在湖水中。

中午，太阳高照，整个日月潭的美景和周围的建筑，都清晰地展现在眼前。要是下起蒙蒙细雨，日月潭好像披上轻纱，周围的景物一片朦胧，就像童话中的仙境。

日月潭风光秀丽，吸引了许许多多的中外游客。`,
      ),
      lesson(
        '11 葡萄沟',
        String.raw`
新疆吐鲁番有个地方叫葡萄沟。那里盛产水果。五月有杏子，七八月有香梨、蜜桃、沙果，到了八九月份，人们最喜爱的葡萄成熟了。

葡萄种在山坡的梯田上。茂密的枝叶向四面展开，就像搭起了一个个绿色的凉棚。到了秋季，葡萄一大串一大串挂在绿叶底下，有红的、白的、紫的、淡绿的，五光十色，美丽极了。要是这时候你到葡萄沟去，热情好客的维吾尔族老乡，准会摘下最甜的葡萄，让你吃个够。

收下来的葡萄有的运到城市去，有的运到阴房里制成葡萄干。阴房修在山坡上，样子很像碉堡，四周留着许多小孔，里面钉着许多木架子。成串的葡萄挂在架子上，利用流动的热空气，把水分蒸发掉，就成了葡萄干。这里生产的葡萄干颜色鲜，味道甜，非常有名。

葡萄沟真是个好地方。`,
      ),
      lesson(
        '语文园地四',
        String.raw`
识字加油站：高楼、街道、港湾、沙滩

字词句运用：有名—著名  秀丽—美丽

书写提示：楼、依、尽、照

日积月累
有山皆图画，无水不文章。
一畦春韭绿，十里稻花香。
忠厚传家久，诗书继世长。`,
      ),
    ],
  },
  {
    key: 'unit-05',
    title: '第五单元·课文',
    subtitle: '在寓言故事中学习从不同角度看问题并踏实做事。',
    lessons: [
      lesson(
        '12 坐井观天',
        String.raw`
青蛙坐在井里。小鸟飞来，落在井沿上。

青蛙问小鸟：“你从哪儿来呀？”
小鸟回答说：“我从天上来，飞了一百多里，口渴了，下来找点儿水喝。”

青蛙说：“朋友，别说大话了！天不过井口那么大，还用飞那么远吗？”
小鸟说：“你弄错了。天无边无际，大得很哪！”

青蛙笑了，说：“朋友，我天天坐在井里，一抬头就能看见天。我不会弄错的。”
小鸟也笑了，说：“朋友，你是弄错了。不信，你跳出井来看一看吧。”`,
      ),
      lesson(
        '13 寒号鸟',
        String.raw`
山脚下有一堵石崖，崖上有一道缝，寒号鸟就把这道缝当作自己的窝。石崖前面有一条河，河边有一棵大杨树，杨树上住着喜鹊。寒号鸟和喜鹊面对面住着，成了邻居。

几阵秋风，树叶落尽，冬天快要到了。

有一天，天气晴朗。喜鹊一早飞出去，东寻西找，衔回来一些枯草，就忙着做窝，准备过冬。寒号鸟却整天出去玩，累了就回来睡觉。喜鹊说：“寒号鸟，别睡了，天气暖和，赶快做窝。”

寒号鸟不听劝告，躺在崖缝里对喜鹊说：“傻喜鹊，不要吵。太阳高照，正好睡觉。”

冬天说到就到，寒风呼呼地刮着。喜鹊住在温暖的窝里。寒号鸟在崖缝里冻得直打哆嗦，不停地叫着：“哆啰啰，哆啰啰，寒风冻死我，明天就做窝。”

第二天清早，风停了，太阳暖暖的，好像又是春天了。喜鹊来到崖缝前劝寒号鸟：“趁天晴，快做窝。现在懒惰，将来难过。”

寒号鸟还是不听劝告，伸伸懒腰，答道：“傻喜鹊，别啰嗦。天气暖和，得过且过。”

寒冬腊月，大雪纷飞。北风像狮子一样狂吼，崖缝里冷得像冰窖。寒号鸟重复着哀号：“哆啰啰，哆啰啰，寒风冻死我，明天就做窝。”

天亮了，太阳出来了，喜鹊在枝头呼唤寒号鸟。可是，寒号鸟已经在夜里冻死了。`,
      ),
      lesson(
        '14 我要的是葫芦',
        String.raw`
从前，有个人种了一棵葫芦。细长的葫芦藤上长满了绿叶，开出了几朵雪白的小花。花谢以后，藤上挂了几个小葫芦。多么可爱的小葫芦啊！那个人每天都要去看几次。

有一天，他看见叶子上爬着一些蚜虫，心里想，有几个虫子怕什么！他盯着小葫芦自言自语地说：“我的小葫芦，快长啊，快长啊！长得赛过大南瓜才好呢！”

一个邻居看见了，对他说：“你别光盯着葫芦了，叶子上生了蚜虫，快治一治吧！”那个人感到很奇怪，说：“什么？叶子上的虫还用治？我要的是葫芦。”

没过几天，叶子上的蚜虫更多了。小葫芦慢慢地变黄了，一个一个都落了。

口语交际：商量`,
      ),
      lesson(
        '语文园地五',
        String.raw`
识字加油站：锋、刀、剪、斧

字词句运用：区分“呢、吗、吧、呀”语气词

书写提示：观、渴、喝、话

日积月累
江雪【唐】柳宗元
千山鸟飞绝，万径人踪灭。
孤舟蓑笠翁，独钓寒江雪。`,
      ),
    ],
  },
  {
    key: 'unit-06',
    title: '第六单元·课文',
    subtitle: '在治水、劳动和历史故事中理解责任、奉献与勇气。',
    lessons: [
      lesson(
        '15 大禹治水',
        String.raw`
很久很久以前，洪水经常泛滥。大水淹没了田地，冲毁了房屋，毒蛇猛兽到处伤害百姓和牲畜，人们的生活痛苦极了。

洪水给百姓带来了无数的灾难，必须治好它。当时，一个名叫鲧的人领着大家治水。他只知道筑坝挡水，九年过去了，洪水仍然没有消退。他的儿子禹继续治水。

禹离开了家乡，一去就是十三年。这十三年里，他到处奔走，曾经三次路过自己家门口。可是他认为治水要紧，一次也没有走进家门看一看。

禹吸取了鲧治水失败的教训，采用疏导的办法治水。他和千千万万的人一起，疏通了很多河道，让洪水通过河道，最后流到大海里去。

洪水终于退了，毒蛇猛兽被驱赶走了，人们把家搬了回来。大家在被水淹过的土地上耕种，农业生产渐渐恢复了，百姓安居乐业，重新过上了幸福的生活。`,
      ),
      lesson(
        '16 朱德的扁担',
        String.raw`
1928年，朱德同志带领一支队伍到井冈山，跟毛主席的队伍会师。红军在山上，山下不远处就是敌人。

红军要巩固井冈山根据地，粉碎敌人的围攻，需要储备足够的粮食。井冈山上生产的粮食不多，常常要抽出一些人到山下茅坪去挑粮。从井冈山到茅坪，来回有五六十里，山高路陡，非常难走。可是每次挑粮，大家都争着去。

朱德同志也跟战士们一块儿去挑粮。他穿着草鞋，戴着斗笠，挑起粮食，跟大家一块儿爬山。白天挑粮爬山，晚上还常常整夜整夜地研究怎样跟敌人打仗。大家看了心疼，就把他那根扁担藏了起来。

不料，朱德同志又找来一根扁担，写上“朱德的扁担”五个字。

大家见了，越发敬爱朱德同志，不好意思再藏他的扁担了。`,
      ),
      lesson(
        '17 难忘的泼水节',
        String.raw`
1961年的泼水节，傣族人民特别高兴，因为敬爱的周恩来总理和他们一起过泼水节。

那天早晨，人们敲起象脚鼓，从四面八方赶来了。为了欢迎周总理，人们在地上撒满了凤凰花的花瓣，好像铺上了鲜红的地毯。一条条龙船驶过江面，一串串花炮升上天空。人们欢呼着：“周总理来了！”

周总理身穿对襟白褂，咖啡色长裤，头上包着一条水红色头巾，笑容满面地来到人群中。他接过一只象脚鼓，敲着欢乐的鼓点，踩着凤凰花铺成的“地毯”，同傣族人民一起跳舞。

开始泼水了。周总理一手端着盛满清水的银碗，一手拿着柏树枝蘸了水，向人们泼洒，为人们祝福。傣族人民一边欢呼，一边向周总理泼水，祝福他健康长寿。

清清的水，泼呀，洒呀！周总理和傣族人民笑哇，跳哇，是那么开心！

多么幸福哇，1961年的泼水节！
多么令人难忘啊，1961年的泼水节！`,
      ),
      lesson(
        '18 刘胡兰',
        String.raw`
1947年1月12日，国民党反动派包围了云周西村。由于叛徒的出卖，年轻的共产党员刘胡兰被捕了，关在一座庙里。

敌人想收买刘胡兰，对她说：“告诉我，村子里谁是共产党员，说出一个，给你一百块钱。”刘胡兰大声回答：“我不知道！”

敌人又威胁她说：“不说就枪毙你！”刘胡兰愤怒地回答：“不知道，就是不知道！”敌人把刘胡兰拉到庙门口的广场上，当着她和乡亲们的面，铡死了被捕的六个民兵。敌人指着血淋淋的铡刀说：“不说，也铡死你！”

刘胡兰挺起胸膛说：“要杀要砍由你们，怕死不是共产党员！”她迎着呼呼的北风，踏着烈士的鲜血，走到铡刀跟前。

刘胡兰光荣地牺牲了，那年她才十五岁。毛主席听到这个消息，亲笔为她题词：“生的伟大，死的光荣。”

口语交际：看图讲故事`,
      ),
      lesson(
        '语文园地六',
        String.raw`
识字加油站：车站、马车、道路、军队

字词句运用：AABB词语

书写提示：站、客、观、城

日积月累
数九歌
一九二九不出手，
三九四九冰上走，
五九六九，沿河看柳，
七九河开，八九雁来，
九九加一九，耕牛遍地走。`,
      ),
    ],
  },
  {
    key: 'unit-07',
    title: '第七单元·课文',
    subtitle: '在山寺、草原和童话故事中展开想象，学习互相帮助。',
    lessons: [
      lesson(
        '19 古诗二首',
        String.raw`
夜宿山寺【唐】李白
危楼高百尺，手可摘星辰。
不敢高声语，恐惊天上人。

敕勒歌（北朝民歌）
敕勒川，阴山下。
天似穹庐，笼盖四野。
天苍苍，野茫茫，风吹草低见牛羊。`,
      ),
      lesson(
        '20 雾在哪里',
        String.raw`
雾是个淘气的孩子。

有一天，雾飞到海上。
“我要把大海藏起来。”于是，他把大海藏了起来。无论是海水、船只，还是蓝色的远方，都看不见了。

“现在我要把天空连同太阳一起藏起来。”于是，他把天空连同太阳一起藏了起来。霎时，四周变暗了，无论是天空，还是天空中的太阳，都看不见了。

雾来到岸边。
“现在我要把海岸藏起来。”雾把海岸藏了起来，同时也把城市藏了起来。房屋、街道、树木、桥梁，甚至行人和小黑猫，雾把一切都藏了起来，什么都看不见了。

他躲在城市的上空，说道：“现在，我该把谁藏起来呢？”看来，再也没有可藏的了。
“我要把自己藏起来。”雾把自己藏了起来。

不久，大海连同船只和远方，天空连同太阳，海岸连同城市，街道连同房屋和桥梁，都露出来了。路上走着行人。小黑猫也出现了，它摇着黑尾巴，悠闲地散步。

雾呢？消失了，不知到哪里去了。`,
      ),
      lesson(
        '21 雪孩子',
        String.raw`
下了一夜的大雪。房子上、树上、地上一片白。

兔妈妈要出去找吃的。她堆了一个漂亮的雪孩子，让他和小白兔一起玩。

看着可爱的雪孩子，小白兔真高兴。他和雪孩子又唱又跳，玩得很开心。小白兔玩累了，就回家休息。屋子里很冷，他往火里加了一些柴，就上床睡觉了。

火把旁边的柴堆烧着了。小白兔睡得正香，他一点儿也不知道。

雪孩子看见小白兔家着火了，就飞快地跑了过去。雪孩子从大火中救出了小白兔，自己却化了。

雪孩子哪里去了呢？他飞到了空中，变成了一朵白云，一朵很美很美的白云。`,
      ),
      lesson(
        '语文园地七',
        String.raw`
识字加油站：海浪、沙滩、椰树、贝壳

字词句运用：“越……越……”

书写提示：敢、屋、散、野

日积月累
数不清的雨点儿，从云彩里飘落下来。
平常，我在池子里睡觉……`,
      ),
    ],
  },
  {
    key: 'unit-08',
    title: '第八单元·课文',
    subtitle: '在寓言、友谊和自然故事中学习判断与承担后果。',
    lessons: [
      lesson(
        '22 狐假虎威',
        String.raw`
在茂密的森林里，有只老虎正在寻找食物。一只狐狸从老虎身边窜过。老虎扑过去，把狐狸逮住了。

狐狸眼珠子骨碌碌一转，扯着嗓子问老虎：“你敢吃我？”
“为什么不敢？”老虎一愣。
“老天爷派我来管你们百兽，你吃了我，就是违抗了老天爷的命令。我看你有多大的胆子！”

老虎被蒙住了，松开了爪子。
狐狸摇了摇尾巴，说：“我带你到百兽面前走一趟，让你看看我的威风。”

老虎跟着狐狸朝森林深处走去。狐狸神气活现，摇头摆尾；老虎半信半疑，东张西望。

森林里的野猪啦，小鹿啦，兔子啦，看见狐狸大摇大摆地走过来，跟往常很不一样，都很纳闷。再往狐狸身后一看，呀，一只大老虎！大大小小的野兽吓得撒腿就跑。

老虎信以为真。其实他受骗了。原来，野兽们怕的不是狐狸，而是狐狸身后的老虎。`,
      ),
      lesson(
        '23 纸船和风筝',
        String.raw`
松鼠和小熊住在一座山上。松鼠住在山顶，小熊住在山脚。山上的小溪往下流，正好从小熊的家门口流过。

松鼠折了一只纸船，放在小溪里。纸船漂哇漂，漂到小熊家门口。

小熊拿起纸船一看，乐坏了。纸船里放着一个小松果，松果上挂着一张纸条，上面写着：“祝你快乐！”

小熊也想折一只纸船送给松鼠，可是纸船不能漂到山上去。怎么办呢？他想了想，就扎了一只风筝。风筝乘着风，飘哇飘，飘到了松鼠家门口。

松鼠一把抓住风筝的线一看，也乐坏了。风筝上挂着一个草莓，风筝的翅膀上写着：“祝你幸福！”

纸船和风筝让他们俩成了好朋友。

可是有一天，他们俩为了一点儿小事吵了一架。山顶上再也看不到飘荡的风筝，小溪里再也看不到漂流的纸船了。

松鼠很难过。他还是每天折一只纸船，但是不好意思放出去。小熊也很难过，他还是每天扎一只风筝，但是不好意思放飞。

过了好几天，松鼠再也受不了啦。他在一只折好的纸船上写了一句话：“如果你愿意和好，就放一只风筝吧！”他把这只纸船放进了小溪。

傍晚，松鼠看见一只美丽的风筝朝他飞来，高兴得哭了。他连忙爬上屋顶，取下纸船，把一只只纸船放到了小溪里。`,
      ),
      lesson(
        '24 风娃娃',
        String.raw`
风娃娃长大了。风妈妈说：“到田野里去吧，到那里，你可以帮人们做事情。”

风娃娃来到田野，看见一架大风车正在慢慢转动，抽上来的水断断续续地流着。他深深地吸了一口气，鼓起腮使劲向风车吹去。风车一下子转得飞快！抽上来的水奔跑着，哗啦哗啦向田里流去。秧苗喝足了水，笑着不住地点头。风娃娃高兴极了。

风娃娃又来到河边，看见许多船工正拉着一艘大船。他们弯着腰，流着汗，“嗨哟，嗨哟”喊着号子，可是船却走得很慢很慢。他急忙跑过去，对着船帆用力吹了口气，船飞快地跑了起来。船工们笑了，一边收起纤绳，一边向风娃娃表示感谢。

风娃娃想：帮助人们做好事，真容易，只要有力气就行。

他这么想着，来到一个广场上。那里有几个孩子正在放风筝。风娃娃看见了，赶紧过去用力吹。风筝在空中摇摇摆摆，有的还翻起了跟头。不一会儿，风筝被吹得无影无踪，孩子们伤心极了。

风娃娃却一点儿也不知道，他仍然东吹吹，西吹吹。吹跑了人们晒的衣服，折断了路边新栽的小树……人们都生气了，纷纷责怪他。

风娃娃不敢再去帮忙了，他委屈地在天上转着、想着：我帮人们做事情，为什么他们还责怪我呢？`,
      ),
      lesson(
        '语文园地八',
        String.raw`
识字加油站：狐狸、老虎、狗熊、梅花鹿

字词句运用：比喻句练习

书写提示：食、物、爷、就

日积月累
狼吞虎咽  惊弓之鸟  龙飞凤舞
漏网之鱼  如虎添翼  鸡犬不宁

和大人一起读：《王二小》`,
        true,
      ),
    ],
  },
]

export const gradeTwoChineseUpperAppendix = String.raw`
附录

识字表（会认450字）
塘、脑、袋、灰、捕、迎、阿、姨、宽、龟、顶、披、鼓、晒、极、傍、越、滴、溪、奔、洋、坏、淹、没、冲、毁、屋、猜、植、物、备、纷、刺、底、炸、离、察、粗、娃、滩、舰、帆、艘、翠、铜、号、梧、桐、枫、松、柏、装、桦、守、疆、银、杉、化、桂、拍、世、界、孔、雀、锦、雄、鹰、翔、雁、猛、休、灵、丛、牢、季、蝴、蝶、麦、苗、桑、肥、农、事、忙、归、戴、场、谷、粒、虽、辛、苦、年、了、称、官、员、根、柱、议、论、秤、砍、线、止、沉、柱、秤、岁、详、催、脏、报、另、及、拿、并、封、削、锅、朝、刮、胡、修、冷、肩、团、重、闭、紧、润、等、吸、粘、额、沙、粒、疲、楼、依、尽、欲、穷、层、瀑、布、炉、烟、遥、川、闻、名、省、部、秀、尤、其、陡、峰、位、巨、每、位、著、形、状、潭、湖、绕、茂、盛、围、岛、纱、童、境、引、客、沟、产、梨、份、枝、搭、淡、够、好、收、城、市、利、份、种、坡、梯、起、客、老、乡、份、治、洪、灾、难、道、认、被、业、产、扁、担、志、伍、师、军、战、士、忘、泼、度、敲、龙、驶、容、踩、铺、盛、碗、祝、福、健、康、悲、牺、牲、敌、遍、刀、吊、吓、勇、敢、于、危、敢、惊、阴、似、庐、盖、茫、苍、野、茫、于、论、岸、屋、街、梁、甚、至、切、躲、失、累、添、柴、烧、旺、渐、哎、冒、烫、终、浑、淋、灭、于、威、假、寻、爪、猪、违、抗、趟、纳、闷、受、扎、抓、幸、福、吵、架、却、愿、意、但、筝、纸、漂、扎、抓、幸、福、吵、受、扎、助、抽、秧、拉、表、摆、翻、摔、跑、责、怪

写字表（会写250字）
两、哪、宽、顶、眼、睛、肚、皮、孩、跳
变、极、片、海、洋、作、给、带
法、如、它、娃、她、知
园、孔、桥、群、队、旗、铜、号
杨、壮、桐、枫、松、柏、杉、桂
歌、丛、深、六、熊、猫、九
季、吹、肥、农、忙、归、戴、辛
称、柱、底、杆、秤、做、岁、站
画、报、纸、另、及、拿、并
封、信、今、写、圆、珠、笔、灯
闭、紧、润、等、吸、额
楼、依、尽、黄、层、照、炉、烟
南、部、些、巨、位、每、升、闪
名、胜、迹、央、丽、华、展、现
份、坡、起、客、老、乡
井、观、沿、答、渴、喝、话
面、阵、朗、枯、却、将、纷
棵、谢、想、盯、言、邻、治
洪、灾、难、道、认、被、业、产
扁、担、志、伍、师、军、战、士
忘、泼、度、龙、炮、穿、始
危、敢、惊、阴、似、野、苍、茫
于、论、岸、屋、街、梁、切、躲
于、累、添、柴、烧、旺、渐、冒
食、物、爷、就、爪、神、活、猪
纸、折、张、祝、扎、抓、但、哭
助、抽、秧、拉、表、摆、摔、责

常用偏旁名称表
贝 贝字旁：财、赔
殳 殳字旁：段、般
疋 疋字旁：蛋、登
衤 衣字旁：补、衫
钅 金字旁：铁、铜`

const titleWithoutNumber = (title: string): string =>
  title
    .replace(/^\d+\s*/u, '')
    .replace(/【[^】]+】.*$/u, '')
    .trim()

function titleWithBookMarks(title: string): string {
  return `《${titleWithoutNumber(title)}》`
}

function summaryFor(definition: UpperLessonDefinition): string {
  const title = titleWithBookMarks(definition.title)
  if (definition.title.startsWith('语文园地'))
    return `围绕${title}复习本单元的识字、朗读、词语和表达方法。`
  if (definition.title.startsWith('快乐读书吧')) return `围绕${title}建立课外阅读和分享习惯。`
  return `通过朗读和理解${title}，积累生字词语，练习从文字中发现信息并表达自己的想法。`
}

function goalsFor(definition: UpperLessonDefinition): string[] {
  const title = titleWithBookMarks(definition.title)
  if (definition.title.startsWith('语文园地'))
    return [`能完成${title}中的复习任务。`, '能用完整句子说出自己的学习发现。']
  return [`能正确朗读并理解${title}的主要内容。`, '能从课文中找出关键信息并用自己的话表达。']
}

function focusFor(definition: UpperLessonDefinition): string[] {
  if (definition.title.startsWith('语文园地')) return ['单元复习', '词语积累', '表达练习']
  if (definition.title.includes('古诗')) return ['朗读背诵', '画面想象', '词语积累']
  if (definition.title.includes('识字')) return ['识字方法', '词语积累', '生活表达']
  return ['朗读理解', '生字词语', '阅读表达']
}

function activityFor(definition: UpperLessonDefinition): string {
  return `朗读${titleWithBookMarks(definition.title)}，找出一个你喜欢的词语或句子，再用一句完整的话说说你的发现。`
}

const unitRecords: Unit[] = units.map((unit, index) => ({
  id: `G2_PEP_CHINESE_S1_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  textbookVersionId: G2_PEP_CHINESE_S1_TEXTBOOK_ID,
  code: `G2_PEP_CHINESE_S1_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  title: unit.title,
  subtitle: unit.subtitle,
  sortOrder: index + 1,
  sceneKey: `g2-chinese-upper-${unit.key}`,
  status: 'ACTIVE',
  sourceId: G2_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRows = units.flatMap((unit, unitIndex) => {
  const unitRecord = unitRecords[unitIndex]
  if (!unitRecord) throw new Error(`G2_CHINESE_UNIT_MISSING:${unit.key}`)
  return unit.lessons.map((definition, lessonIndex) => ({
    definition,
    unitRecord,
    lessonIndex,
  }))
})

const lessonRecords: Lesson[] = lessonRows.map(
  ({ definition, unitRecord, lessonIndex }, index) => ({
    id: `G2_PEP_CHINESE_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
    unitId: unitRecord.id,
    code: `G2_PEP_CHINESE_S1_LESSON_${String(index + 1).padStart(2, '0')}`,
    title: definition.title,
    sortOrder: lessonIndex + 1,
    status: 'ACTIVE',
    sourceId: G2_PEP_CHINESE_S1_DIRECTORY_SOURCE_ID,
    ...UNVERIFIED,
  }),
)

const knowledgePointRecords: KnowledgePoint[] = lessonRows.map(({ definition }, index) => ({
  id: `G2_PEP_CHINESE_S1_KP_${String(index + 1).padStart(2, '0')}`,
  code: `CN-G2-S1-${String(index + 1).padStart(2, '0')}`,
  name: `${definition.title} · 学习要点`,
  subjectId: G2_PEP_CHINESE_SUBJECT_ID,
  gradeScope: { minGrade: 2, maxGrade: 2, explicitGradeIds: [G2_PEP_CHINESE_GRADE_ID] },
  description: summaryFor(definition),
  learningObjective: goalsFor(definition),
  abilityTags: [
    definition.title.startsWith('语文园地') ? '复习迁移' : '阅读理解',
    '生字词语',
    'g2-chinese',
  ],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeTwoChineseUpperLessons: Lesson[] = lessonRecords
export const gradeTwoChineseUpperKnowledgePoints: KnowledgePoint[] = knowledgePointRecords

export const gradeTwoChineseUpperLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G2_PEP_CHINESE_S1_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeTwoChineseUpperKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G2_PEP_CHINESE_S1_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

export const gradeTwoChineseUpperCourseContents: CourseContent[] = lessonRows.map(
  ({ definition }, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G2_CHINESE_LESSON_CONTENT_MISSING:${index}`)

    const title = titleWithBookMarks(definition.title)
    const blocks = [
      { type: 'TEXT' as const, text: `${title}\n\n${definition.text}` },
      ...(definition.includeAppendix
        ? [{ type: 'TEXT' as const, text: gradeTwoChineseUpperAppendix }]
        : []),
      { type: 'TEXT' as const, text: `课后练习：${activityFor(definition)}` },
    ]

    return {
      id: `G2_PEP_CHINESE_S1_CONTENT_${String(index + 1).padStart(2, '0')}`,
      knowledgePointId,
      title,
      contentType: 'TEXTBOOK',
      contentFormat: 'TEXT',
      body: {
        lessonId,
        sourceScope: 'USER_PROVIDED_LOCAL',
        summary: summaryFor(definition),
        learningGoals: goalsFor(definition),
        focus: focusFor(definition),
        activity: activityFor(definition),
        blocks,
      },
      difficulty: 'FOUNDATION',
      sourceId: G2_PEP_CHINESE_S1_CONTENT_SOURCE_ID,
      needsVerification: true,
      status: 'DRAFT',
      currentVersion: 1,
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    }
  },
)

export const gradeTwoChineseUpperCurriculum: GradeTwoChineseUpperCurriculumData = {
  grade: gradeTwoChineseUpperGrade,
  semester: gradeTwoChineseUpperSemester,
  subject: gradeTwoChineseUpperSubject,
  sources: gradeTwoChineseUpperSources,
  regions: gradeTwoChineseUpperRegions,
  publishers: gradeTwoChineseUpperPublishers,
  textbooks: gradeTwoChineseUpperTextbooks,
  regionTextbookRelations: gradeTwoChineseUpperRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeTwoChineseUpperLessons,
  knowledgePoints: gradeTwoChineseUpperKnowledgePoints,
  lessonKnowledgePointRelations: gradeTwoChineseUpperLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeTwoChineseUpperKnowledgePrerequisites,
  courseContents: gradeTwoChineseUpperCourseContents,
}
