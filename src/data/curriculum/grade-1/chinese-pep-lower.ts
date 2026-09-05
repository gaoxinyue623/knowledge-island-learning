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
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_PEP_CHINESE_PUBLISHER_ID,
  G1_PEP_CHINESE_SUBJECT_ID,
  gradeOneChineseUpperGrade,
  gradeOneChineseUpperPublishers,
  gradeOneChineseUpperRegions,
  gradeOneChineseUpperSubject,
} from './chinese-pep-upper'

/**
 * Grade 1 Chinese lower-volume curriculum entered from the user-provided
 * textbook text. The lesson body is kept in the course-content layer so the
 * map can expose the supplied reading material without copying it into the
 * knowledge-point record.
 */
export const G1_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID = 'G1_PEP_CHINESE_S2_DIRECTORY_TEXT'
export const G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID = 'G1_PEP_CHINESE_S2_TEXTBOOK_CONTENT'
export const G1_PEP_CHINESE_S2_TEXTBOOK_ID = 'G1_PEP_CHINESE_S2_2024_CANDIDATE'
export const G1_PEP_CHINESE_S2_SEMESTER_ID = 'SEMESTER_LOWER'

const TIMESTAMP = '2026-09-04T00:00:00+08:00'
const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeOneChineseLowerCurriculumData {
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

export const gradeOneChineseLowerGrade = gradeOneChineseUpperGrade
export const gradeOneChineseLowerSubject = gradeOneChineseUpperSubject
export const gradeOneChineseLowerRegions = gradeOneChineseUpperRegions
export const gradeOneChineseLowerPublishers = gradeOneChineseUpperPublishers

export const gradeOneChineseLowerSemester: Semester = {
  id: G1_PEP_CHINESE_S2_SEMESTER_ID,
  code: 'LOWER',
  name: '下册',
  sortOrder: 2,
  status: 'ACTIVE',
}

export const gradeOneChineseLowerSources: ContentSource[] = [
  {
    id: G1_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的统编（人教版）语文一年级下册目录与课程结构文本',
    publisher: '人民教育出版社',
    edition: '统编版 / 一年级下册（用户提供文本）',
    sourceRef: 'user-provided://g1-chinese-lower-table-of-contents',
    sourceVersion: 'USER_PROVIDED_LOWER_DIRECTORY_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供内容，仅用于本地个人开发；未提供公开再分发授权。',
    attribution: '用户在本轮提供的一年级下册课程文本',
    notes: '用于建立广东省、湖北省的一年级语文下册课程结构，不代表已完成出版物授权或外部版权核验。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的统编（人教版）语文一年级下册完整课本文本',
    publisher: '人民教育出版社',
    edition: '统编版 / 一年级下册（用户提供文本）',
    sourceRef: 'user-provided://g1-chinese-lower-full-text',
    sourceVersion: 'USER_PROVIDED_FULL_TEXT_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: '用户在本轮提供的一年级下册完整课本文本',
    notes: '课文、语文园地和附录作为本地开发数据进入课程内容层；内部审计字段继续保留。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeOneChineseLowerTextbooks: TextbookVersion[] = [
  {
    id: G1_PEP_CHINESE_S2_TEXTBOOK_ID,
    subjectId: G1_PEP_CHINESE_SUBJECT_ID,
    gradeId: G1_PEP_CHINESE_GRADE_ID,
    semesterId: G1_PEP_CHINESE_S2_SEMESTER_ID,
    publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
    versionName: '人教版（统编版）语文一年级下册（最新审定版）',
    editionYear: '最新审定版',
    curriculumStandard: '义务教育语文课程标准（2022 年版）',
    sourceId: G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
]

export const gradeOneChineseLowerRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G1_PEP_CHINESE_S2_REGION_GUANGDONG',
    regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
    textbookVersionId: G1_PEP_CHINESE_S2_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-04',
    sourceId: G1_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
  {
    id: 'G1_PEP_CHINESE_S2_REGION_HUBEI',
    regionId: G1_PEP_CHINESE_HUBEI_REGION_ID,
    textbookVersionId: G1_PEP_CHINESE_S2_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-04',
    sourceId: G1_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
]

interface LowerLessonDefinition {
  title: string
  text: string
  includeAppendix?: boolean
}

interface LowerUnitDefinition {
  key: string
  title: string
  subtitle: string
  lessons: LowerLessonDefinition[]
}

const lesson = (title: string, text: string, includeAppendix = false): LowerLessonDefinition => ({
  title,
  text: text.trim(),
  ...(includeAppendix ? { includeAppendix: true } : {}),
})

const units: LowerUnitDefinition[] = [
  {
    key: 'unit-01',
    title: '第一单元·识字',
    subtitle: '在春夏秋冬、姓氏和字谜中认识汉字。',
    lessons: [
      lesson(
        '1 春夏秋冬',
        String.raw`
春风吹，夏雨落。
秋霜降，冬雪飘。

青草  红花  游鱼  飞鸟
池草青，山花红。
鱼出水，鸟入林。`,
      ),
      lesson(
        '2 姓氏歌',
        String.raw`
你姓什么？我姓李。
什么李？木子李。

他姓什么？他姓张。
什么张？弓长张。

古月胡，口天吴，
双人徐，言午许。

中国姓氏有很多，
赵、钱、孙、李，
周、吴、郑、王，
诸葛、东方，
上官、欧阳……`,
      ),
      lesson(
        '3 小青蛙',
        String.raw`
河水清清天气晴，
小小青蛙大眼睛。
保护禾苗吃害虫，
做了不少好事情。
请你爱护小青蛙，
好让禾苗不生病。`,
      ),
      lesson(
        '4 猜字谜',
        String.raw`
（一）
左边绿，右边红，
左右相遇起凉风。
绿的喜欢及时雨，
红的最怕水来攻。

（二）
“言”来互相尊重，
“心”至令人感动，
“日”出万里无云，
“水”到纯净透明。

口语交际：听故事，讲故事
一边看图，一边听老师讲《老鼠嫁女》的故事，然后自己讲讲这个故事。`,
      ),
      lesson(
        '语文园地一',
        String.raw`
识字加油站：阴、晴、雾、雷电、阵雨、暴雨、冰雹、霜冻、雨夹雪

字词句运用：背诵汉语拼音字母表

书写提示：全包围、半包围字：白、回、国

日积月累
春回大地，万物复苏。
柳绿花红，莺歌燕舞。
冰雪融化，泉水叮咚。
百花齐放，百鸟争鸣。
`,
      ),
      lesson(
        '快乐读书吧：读读童谣和儿歌',
        String.raw`
快乐读书吧：读读童谣和儿歌`,
      ),
    ],
  },
  {
    key: 'unit-02',
    title: '第二单元·课文',
    subtitle: '在故事、诗歌和生活表达中感受关爱与成长。',
    lessons: [
      lesson(
        '1 热爱中国共产党',
        String.raw`
花儿喜欢太阳，花儿在阳光下开放。
鸟儿喜欢蓝天，鸟儿在天空飞翔。
我们热爱中国共产党，
我们在党的怀抱里幸福成长。`,
      ),
      lesson(
        '2 吃水不忘挖井人',
        String.raw`
瑞金城外有个村子叫沙洲坝，毛主席在江西领导革命的时候，在那儿住过。

村子里没有水井，乡亲们吃水要到很远的地方去挑。毛主席就带领战士和乡亲们挖了一口井。

解放以后，乡亲们在井旁边立了一块石碑，上面刻着：吃水不忘挖井人，时刻想念毛主席。`,
      ),
      lesson(
        '3 我多想去看看',
        String.raw`
妈妈告诉我，沿着弯弯的小路，就会走出天山。遥远的北京城，有一座雄伟的天安门，广场上的升旗仪式非常壮观。我对妈妈说，我多想去看看，我多想去看看！

爸爸告诉我，沿着宽宽的公路，就会走出北京。遥远的新疆，有美丽的天山，雪山上盛开着洁白的雪莲。我对爸爸说，我多想去看看，我多想去看看！`,
      ),
      lesson(
        '4 一个接一个',
        String.raw`
月夜，正玩着踩影子，
就听大人叫着：“快回家睡觉！”
唉，我好想再多玩一会儿啊。
不过，回家睡着了，
倒可以做各种各样的梦呢！

正做着好梦，
又听见大人在叫：“该起床上学啦！”
唉，要是不上学就好了。
不过，去了学校，
就能见到小伙伴，多么开心哪！

正和小伙伴们玩着跳房子，
操场上却响起了上课铃声。
唉，要是没有上课铃就好了。
不过，听老师讲故事，
也是很快乐很有趣的呀！

别的孩子也是这样吗？
也像我一样，这么想吗？`,
      ),
      lesson(
        '语文园地二',
        String.raw`
识字加油站：职业：医生、教师、工人、农民

字词句运用：例：我多想去北京看看！多想。

书写提示：主、门、书、我

日积月累
春晓 【唐】孟浩然
春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。`,
      ),
    ],
  },
  {
    key: 'unit-03',
    title: '第三单元·课文',
    subtitle: '在伙伴相处和共同游戏中学习分享与合作。',
    lessons: [
      lesson(
        '5 小公鸡和小鸭子',
        String.raw`
小公鸡和小鸭子一块儿出去玩。

他们走进草地里。小公鸡找到了许多虫子，吃得很欢。小鸭子捉不到虫子，急得直哭。小公鸡看见了，捉到虫子就给小鸭子吃。

他们走到小河边。小鸭子说：“公鸡弟弟，我到河里捉鱼给你吃。”小公鸡说：“我也去。”小鸭子说：“不行，不行，你不会游泳，会淹死的！”小公鸡不信，偷偷地跟在小鸭子后面，也下了水。

小鸭子正在水里捉鱼，忽然听见小公鸡喊救命。他飞快地游到小公鸡身边，让小公鸡坐在自己的背上。小公鸡上了岸，笑着对小鸭子说：“鸭子哥哥，谢谢你。”`,
      ),
      lesson(
        '6 树和喜鹊',
        String.raw`
从前，这里只有一棵树，树上只有一个鸟窝，鸟窝里只有一只喜鹊。

树很孤单，喜鹊也很孤单。

后来，这里种了好多好多树，每棵树上都有鸟窝，每个鸟窝里都有喜鹊。

树有了邻居，喜鹊也有了邻居。

每天天一亮，喜鹊们叽叽喳喳叫几声，打着招呼一起飞出去了。天一黑，他们又叽叽喳喳地一起飞回窝里，安安静静地睡觉了。

树很快乐，喜鹊也很快乐。`,
      ),
      lesson(
        '7 怎么都快乐',
        String.raw`
一个人玩，很好！
独自一个，静悄悄的，
正好用纸折船，折马……
踢毽子，跳绳，搭积木，
当然还有看书，画画，听音乐……

两个人玩，很好！
讲故事得有人听才行，
你讲我听，我讲你听。
还有下象棋，打羽毛球，坐跷跷板……

三个人玩，很好！
讲故事多个人听更有劲，
你讲我们听，我讲你们听。
两个人甩绳子，
你跳，我跳，轮流跳。

四个人玩，很好！
五个人玩，很好！
许多人玩更好！
人多，什么游戏都能玩，
拔河，老鹰捉小鸡，
打排球，打篮球，踢足球……
连开运动会也可以。

口语交际：请你帮个忙`,
      ),
      lesson(
        '语文园地三',
        String.raw`
识字加油站：动作：玩、跳、踢、跑、拍、打

字词句运用：“一边____一边”造句

书写提示：请、情、清、气

日积月累
赠汪伦【唐】李白
李白乘舟将欲行，忽闻岸上踏歌声。
桃花潭水深千尺，不及汪伦送我情。`,
      ),
    ],
  },
  {
    key: 'unit-04',
    title: '第四单元·课文',
    subtitle: '在夜色、节日和想象中学习观察与表达。',
    lessons: [
      lesson(
        '8 静夜思【唐】李白',
        String.raw`
床前明月光，疑是地上霜。
举头望明月，低头思故乡。`,
      ),
      lesson(
        '9 夜色',
        String.raw`
我从前胆子很小很小，
天一黑就不敢往外瞧。
妈妈把勇敢的故事讲了又讲，
可我一看窗外心就乱跳……

爸爸晚上偏要拉我去散步，
原来花草都像白天一样微笑。
从此再黑再黑的夜晚，
我也能看见小鸟怎样在月光下睡觉……`,
      ),
      lesson(
        '10 端午粽',
        String.raw`
一到端午节，外婆总会煮好一锅粽子，盼着我们回去。

粽子是用青青的箬竹叶包的，里面裹着白白的糯米，中间有一颗红红的枣。外婆一掀开锅盖，煮熟的粽子就飘出一股清香来。剥开粽叶，咬一口粽子，真是又黏又甜。

外婆包的粽子十分好吃，花样也多。除了红枣粽，还有红豆粽和鲜肉粽。我们在外婆家美滋滋地吃了之后，外婆还会装一小篮粽子要我们带回去，分给邻居吃。

长大了我才知道，人们端午节吃粽子，据说是为了纪念爱国诗人屈原。`,
      ),
      lesson(
        '11 彩虹',
        String.raw`
雨停了，天上有一座美丽的桥。

爸爸，如果我提着你那把浇花用的水壶，走到桥上去，把水洒下来，不是我在下雨了吗？我把雨洒在山上的田地里，你就不用挑水去浇了，你高兴吗？

妈妈，如果我拿着你梳头用的那面圆圆的镜子，走到桥上去，天上不就多了一个月亮吗？我拿着月亮照你梳头，你高兴吗？

哥哥，如果我把你系在门前树上的秋千拿去挂在彩虹桥上，我坐着秋千荡来荡去，花裙子飘啊飘的，不就成了一朵彩云吗？你看见了，高兴吗？`,
      ),
      lesson(
        '语文园地四',
        String.raw`
识字加油站：五官身体：眉、鼻、嘴、脖子、手臂、肚子、小腿、脚尖

字词句运用：AABB词语：开开心心、高高兴兴

书写提示：思、床、前、光

日积月累
寻隐者不遇【唐】贾岛
松下问童子，言师采药去。
只在此山中，云深不知处。`,
      ),
    ],
  },
  {
    key: 'unit-05',
    title: '第五单元·识字',
    subtitle: '在动物、运动和传统文化中积累字词。',
    lessons: [
      lesson(
        '5 动物儿歌',
        String.raw`
蜻蜓半空展翅飞，
蝴蝶花间捉迷藏。
蚯蚓土里造宫殿，
蚂蚁地上运食粮。
蝌蚪池中游得欢，
蜘蛛房前结网忙。`,
      ),
      lesson(
        '6 古对今',
        String.raw`
古对今，圆对方。
严寒对酷暑，春暖对秋凉。

晨对暮，雪对霜。
和风对细雨，朝霞对夕阳。

桃对李，柳对杨。
莺歌对燕舞，鸟语对花香。`,
      ),
      lesson(
        '7 操场上',
        String.raw`
打球  拔河  拍皮球
跳高  跑步  踢足球

铃声响，下课了。
操场上，真热闹。
跳绳踢毽丢沙包，
天天锻炼身体好。`,
      ),
      lesson(
        '8 人之初（三字经节选）',
        String.raw`
人之初，性本善。
性相近，习相远。
苟不教，性乃迁。
教之道，贵以专。

子不学，非所宜。
幼不学，老何为。
玉不琢，不成器。
人不学，不知义。

口语交际：打电话`,
      ),
      lesson(
        '语文园地五',
        String.raw`
识字加油站：食物：饭、茶、饼、饱、泡

字词句运用：形近字辨析：青—清，在—再

书写提示：之、义、远、近

日积月累
小葱拌豆腐——一清（青）二白
竹篮子打水——一场空
芝麻开花——节节高
十五个吊桶打水——七上八下`,
      ),
    ],
  },
  {
    key: 'unit-06',
    title: '第六单元·课文',
    subtitle: '在夏日自然观察中学习发现和推断。',
    lessons: [
      lesson(
        '12 古诗二首',
        String.raw`
池上【唐】白居易
小娃撑小艇，偷采白莲回。
不解藏踪迹，浮萍一道开。

小池【宋】杨万里
泉眼无声惜细流，树阴照水爱晴柔。
小荷才露尖尖角，早有蜻蜓立上头。`,
      ),
      lesson(
        '13 荷叶圆圆',
        String.raw`
荷叶圆圆的，绿绿的。

小水珠说：“荷叶是我的摇篮。”小水珠躺在荷叶上，眨着亮晶晶的眼睛。

小蜻蜓说：“荷叶是我的停机坪。”小蜻蜓立在荷叶上，展开透明的翅膀。

小青蛙说：“荷叶是我的歌台。”小青蛙蹲在荷叶上，呱呱地放声歌唱。

小鱼儿说：“荷叶是我的凉伞。”小鱼儿在荷叶下笑嘻嘻地游来游去，捧起一朵朵很美很美的水花。`,
      ),
      lesson(
        '14 要下雨了',
        String.raw`
小白兔弯着腰在山坡上割草。天阴沉沉的，小白兔直起身子，伸了伸腰。

小燕子从他头上飞过。小白兔大声喊：“燕子，燕子，你为什么飞得这么低呀？”

燕子边飞边说：“要下雨了，空气很潮湿，虫子的翅膀沾了小水珠，飞不高。我正忙着捉虫子呢！”

是要下雨了吗？小白兔往前边池子里一看，小鱼都游到水面上来了。

小白兔跑过去，问：“小鱼，小鱼，今天怎么有空出来呀？”

小鱼说：“要下雨了，水里闷得很，我们到水面上来透透气。小白兔，你快回家吧，小心淋着雨。”

小白兔连忙挎起篮子往家跑。他看见路边有一大群蚂蚁，就把要下雨的消息告诉了蚂蚁。一只大蚂蚁说：“是要下雨了，我们正忙着搬东西呢！”

小白兔加快步子往家跑。他一边跑一边喊：“妈妈，妈妈，要下雨了！”

轰隆隆，天空响起了一阵雷声。哗，哗，哗，大雨真的下起来了！`,
      ),
      lesson(
        '语文园地六',
        String.raw`
识字加油站：夏天词语：冰棍、西瓜、蒲扇、蚊香、竹椅

字词句运用：“十分”造句

书写提示：朵、机、美、我

日积月累
朝霞不出门，晚霞行千里。
有雨山戴帽，无雨半山腰。
早晨下雨当日晴，晚上下雨到天明。
蚂蚁搬家蛇过道，大雨不久要来到。`,
      ),
    ],
  },
  {
    key: 'unit-07',
    title: '第七单元·课文',
    subtitle: '从日常习惯、时间和做事方法中学习成长。',
    lessons: [
      lesson(
        '15 文具的家',
        String.raw`
铅笔，只用了一次，不知丢到哪里去了。
橡皮，只擦了一回，再想擦，就找不着了。

贝贝一回到家，就向妈妈要新的铅笔、新的橡皮。妈妈说：“你怎么天天丢东西呢？”贝贝眨着一双大眼睛，对妈妈说：“我也不知道。”

妈妈说：“贝贝，你有一个家，每天放学后，你都平平安安地回家。你要想想办法，让你的铅笔、橡皮和转笔刀，也有自己的家呀。”

贝贝想起来了，她书包里的文具盒，就是这些文具的家。

从此，每天放学的时候，贝贝都要仔细检查，铅笔呀，橡皮呀，转笔刀哇，所有的小伙伴是不是都回家了。`,
      ),
      lesson(
        '16 一分钟',
        String.raw`
丁零零，闹钟响了。元元打了个哈欠，翻了个身，心想：再睡一分钟吧，就睡一分钟，不会迟到的。

过了一分钟，元元起来了。他很快地洗了脸，吃了早点，就背着书包上学去了。到了十字路口，他看见前面是绿灯，刚想走过去，红灯亮了。他叹了口气，说：“要是早一分钟就好了。”

他等了好一会儿，才走过十字路口。他向停在车站的公共汽车跑去，眼看就要到了，车子开了。他又叹了口气，说：“要是早一分钟就好了。”

他等啊等，一直不见公共汽车的影子，元元决定走到学校去。

到了学校，已经上课了。元元红着脸，低着头，坐到了自己的座位上。李老师看了看手表，说：“元元，今天你迟到了二十分钟。”

元元非常后悔。`,
      ),
      lesson(
        '17 动物王国开大会',
        String.raw`
动物王国要开大会，老虎让狗熊通知大家。

狗熊用喇叭大声喊：“大家注意，动物王国要开大会，请你们都参加！”一连说了十遍。

狐狸奔来了，对狗熊说：“你说一百遍，大会也开不起来。”
“为什么？”狗熊问。
“因为你没告诉大家，大会在哪一天开，是今天，还是明天，还是……”

狗熊一听，说：“对，对，对！”于是就去问老虎。
老虎说：“大会就在明天开，你快去通知大家吧！”

狗熊又用喇叭大声喊：“大家注意，动物王国要在明天开大会，请你们都参加！”一连说了十遍。

大灰狼跑来对狗熊说：“你说一百遍，大会也开不起来。”
“为什么？”狗熊问。
“因为你没告诉大家，明天什么时候开，上午还是下午，几点钟开。”

狗熊一听：“有道理，有道理！”于是又去问老虎。
老虎说：“大会就在明天上午八点开，你再去通知大家吧！”

狗熊又用喇叭大声喊：“大家注意，动物王国要在明天上午八点开大会，请你们都参加！”一连说了十遍。

梅花鹿奔来问狗熊：“大会在哪儿开呀？你得说清楚。”

狗熊捶捶自己的脑袋，说：“我怎么没问清楚呢？”于是又去问老虎。
老虎说：“哎呀！忘了说地点。大会在森林广场开，你再去通知大家吧！”

狗熊又用喇叭大声喊：“大家注意，动物王国要在明天上午八点，在森林广场开大会，请你们都参加！”一连说了十遍。

这一次，大家都听懂了。第二天上午，动物们都来到森林广场，准时参加了大会。`,
      ),
      lesson(
        '18 小猴子下山',
        String.raw`
有一天，小猴子下山来，走到一块玉米地里。他看见玉米结得又大又多，非常高兴，就掰了一个，扛着往前走。

小猴子扛着玉米，走到一棵桃树下。它看见满树的桃子又大又红，非常高兴，就扔了玉米，去摘桃子。

小猴子捧着几个桃子，走到一片瓜地里。他看见满地的西瓜又大又圆，非常高兴，就扔了桃子，去摘西瓜。

小猴子抱着一个大西瓜往回走。走着走着，看见一只小兔子蹦蹦跳跳的，真可爱。他非常高兴，就扔了西瓜，去追小兔子。

小兔子跑进树林里，不见了。小猴子只好空着手回家去。

口语交际：一起做游戏`,
      ),
      lesson(
        '语文园地七',
        String.raw`
识字加油站：家务：擦桌子、洗碗、扫地、拖地

字词句运用：“要是……就……”造句

书写提示：包、居、床、左

日积月累
敏而好学，不耻下问。——《论语》
不知则问，不能则学。——《荀子》
读书百遍，而义自见。——董遇
读万卷书，行万里路。——董其昌`,
      ),
    ],
  },
  {
    key: 'unit-08',
    title: '第八单元·课文',
    subtitle: '在动物故事和生活问题中学习观察、判断与解决问题。',
    lessons: [
      lesson(
        '19 棉花姑娘',
        String.raw`
棉花姑娘生病了，叶子上有许多可恶的蚜虫。她多么盼望有医生来给她治病啊！

燕子飞来了。棉花姑娘说：“请你帮我捉害虫吧！”燕子说：“对不起，我只会捉空中飞的害虫，你还是请别人帮忙吧！”

啄木鸟飞来了。棉花姑娘说：“请你帮我捉害虫吧！”啄木鸟说：“对不起，我只会捉树干里的害虫，你还是请别人帮忙吧！”

青蛙跳来了。棉花姑娘高兴地说：“请你帮我捉害虫吧！”青蛙说：“对不起，我只会捉田里的害虫，你还是请别人帮忙吧！”

忽然，一群圆圆的小虫子飞来了，很快就把蚜虫吃光了。棉花姑娘惊奇地问：“你们是谁呀？”小虫子说：“我们身上有七个斑点，就像七颗星星，大家叫我们七星瓢虫。”

不久，棉花姑娘的病好了，长出了碧绿碧绿的叶子，吐出了雪白雪白的棉花。她咧开嘴笑啦！`,
      ),
      lesson(
        '20 咕咚',
        String.raw`
木瓜熟了。一个木瓜从高高的树上掉进湖里，“咕咚”！

兔子吓了一跳，拔腿就跑。小猴子看见了，问他为什么跑。兔子一边跑一边叫：“不好啦，‘咕咚’可怕极了！”

小猴子一听，就跟着跑起来。他一边跑一边大叫：“不好啦，不好啦，‘咕咚’来了，大家快跑哇！”

这一下可热闹了。狐狸呀，山羊啊，小鹿哇，一个跟着一个跑起来。大伙一边跑一边叫：“快逃命啊，‘咕咚’来了！”

大象看见了，也跟着跑起来。野牛拦住他，问：“‘咕咚’在哪里，你看见了？”大象说：“没看见，大伙都说‘咕咚’来了。”野牛拦住大伙问，大伙都说没看见。最后问兔子，兔子说：“是我听见的，‘咕咚’就在那边的湖里。”

兔子领着大家来到湖边。正好又有一个木瓜从高高的树上掉进湖里，“咕咚”！

大伙你看看我，我看看你，都笑了。`,
      ),
      lesson(
        '21 小壁虎借尾巴',
        String.raw`
小壁虎在墙角捉蚊子，一条蛇咬住了他的尾巴。小壁虎一挣，挣断尾巴逃走了。

没有尾巴多难看哪！小壁虎想，向谁去借一条尾巴呢？

小壁虎爬呀爬，爬到小河边。他看见小鱼摇着尾巴，在河里游来游去。小壁虎说：“小鱼姐姐，您把尾巴借给我行吗？”小鱼说：“不行啊，我要用尾巴拨水呢。”

小壁虎爬呀爬，爬到大树上。他看见老牛甩着尾巴，在树下吃草。小壁虎说：“牛伯伯，您把尾巴借给我行吗？”老牛说：“不行啊，我要用尾巴赶蝇子呢。”

小壁虎爬呀爬，爬到房檐下。他看见燕子摆着尾巴，在空中飞来飞去。小壁虎说：“燕子阿姨，您把尾巴借给我行吗？”燕子说：“不行啊，我要用尾巴掌握方向呢。”

小壁虎借不到尾巴，心里很难过。他爬呀爬，爬回家里找妈妈。

小壁虎把借尾巴的事告诉了妈妈。妈妈笑着说：“傻孩子，你转过身子看看。”小壁虎转身一看，高兴得叫了起来：“我长出一条新尾巴啦！”`,
      ),
      lesson(
        '语文园地八',
        String.raw`
识字加油站：卫生间、厨房、客厅、卧室

字词句运用：“一____就”造句

书写提示：病、医

日积月累
画鸡【明】唐寅
头上红冠不用裁，满身雪白走将来。
平生不敢轻言语，一叫千门万户开。

和大人一起读：《孙悟空打妖怪》`,
        true,
      ),
    ],
  },
]

export const gradeOneChineseLowerAppendix = String.raw`
附录

识字表（会认，共400字）
春 风 冬 雪 花 飞 入 姓 什 么 双 国 王 方 青 清 气 晴 情 请 生 字 左 右 红 时 动 万 吃 忘 井 村 叫 毛 主 席 乡 亲 战 士 面 想 告 诉 路 京 安 门 广 非 常 壮 观 接 再 做 各 种 样 梦 趣 这 那 么 跳 绳 讲 排 球 篮 球 足 球 玩 很 当 音 讲 许 思 床 前 光 低 故 乡 胆 敢 往 外 勇 窗 乱 偏 散 像 微 笑 再 次 外 婆 煮 粽 叶 米 枣 飘 香 甜 知 道 据 说 纪 念 虹 座 浇 提 洒 挑 镜 拿 照 裙 飘 荡 蜻 蜓 迷 藏 蚯 蚓 造 蚂 蚁 粮 食 蝌 蚪 蜘 蛛 古 今 圆 严 寒 酷 暑 凉 晨 暮 朝 霞 夕 杨 莺 舞 鸟 语 打 拔 拍 跳 跑 踢 铃 闹 锻 炼 体 之 初 性 善 习 教 迁 贵 专 幼 玉 琢 器 义 池 塘 撑 艇 偷 采 莲 迹 浮 萍 泉 眼 惜 柔 荷 露 角 蜻 蜓 圆 珠 摇 躺 晶 停机坪 展 透 明 蹲 呱 嘻 捧 割 阴 沉 伸 潮 湿 虫 沾 珠 忙 闷 透 搬 响 轰 隆 哗 具 次 丢 哪 新 每 平 仔 检 查 钟 元 丁 零 哈 欠 元 背 刚 闹 迟 叹 悔 虎 熊 通 注 意 遍 百 兽 鬼 脸 准 第 物 瓜 扛 扔 摘 捧 抱 蹦 追 棵 空 病 医 治 别 干 奇 七 星 瓢 吐 啦 碧 绿 盼 恶 蚜 治 燕 子 啄 木 鸟 忽 然 斑 点 七 颗 盼 望 棉 花 姑 娘 木 瓜 熟 掉 吓 拔 腿 跟 着 叫 领 拦 野 猪 鹿 象 挣 断 壁 虎 墙 蚊 蛇 挣 断 您 拨 赶 蝇 檐 摆 甩 傻 转 身

写字表（要求会写，200字）
春、风、冬、雪、花、飞、入
姓、什、么、双、国、王、方
青、清、气、晴、情、请、生
字、左、右、红、时、动、万
吃、叫、主、江、住、没、以
会、走、北、京、门、广、过
各、种、样、梦、伙、伴、这
太、阳、片、金、秋、因、为
他、河、说、也、地、听、哥
单、居、招、呼、快、乐、玩
思、床、前、光、低、故、乡
色、外、看、爸、晚、笑、再
午、节、叶、米、真、分、豆
那、着、到、高、兴、千、成
间、迷、造、运、池、欢、网
古、细、凉、夕、李、语、香
打、拍、跑、足、声、身、体
之、义、远、近、习、玉、义
首、采、无、爱、尖、角、机
台、放、鱼、朵、美、直、呀
边、呢、吗、吧、要、连、还
文、找、平、办、让、包、次
钟、元、洗、共、已、经、坐
要、百、还、舌、点、块、非
往、瓜、进、空、病、医、别
干、奇、七、星、吓、怕、跟
家、象、都、捉、条、爬、姐

常用偏旁名称表
冫 两点水：冰、冷
冖 秃宝盖：写、军
力 力字旁：动、办
又 又字旁：欢、双
亅 竖钩：小、水
彳 双人旁：很、行
彡 三撇儿：彩、影
夂 折文旁：各、条
牜 牛字旁：物、特
疒 病字头：病、医
癶 登字头：登
钅 金字旁：铁、铜`

const titleWithoutNumber = (title: string): string =>
  title
    .replace(/^\d+\s*/u, '')
    .replace(/【[^】]+】.*$/u, '')
    .trim()

function titleWithBookMarks(title: string): string {
  return `《${titleWithoutNumber(title)}》`
}

function summaryFor(definition: LowerLessonDefinition): string {
  const title = titleWithBookMarks(definition.title)
  if (definition.title.startsWith('语文园地'))
    return `围绕${title}复习本单元的识字、朗读、词语和表达方法。`
  if (definition.title.startsWith('快乐读书吧')) return `围绕${title}建立课外阅读和分享习惯。`
  return `通过朗读和理解${title}，积累生字词语，练习从文字中发现信息并表达自己的想法。`
}

function goalsFor(definition: LowerLessonDefinition): string[] {
  const title = titleWithBookMarks(definition.title)
  if (definition.title.includes('汉语拼音'))
    return [`能按要求完成${title}中的拼读和书写练习。`, '能把拼音学习方法用到新的词语中。']
  if (definition.title.startsWith('语文园地'))
    return [`能完成${title}中的复习任务。`, '能用完整句子说出自己的学习发现。']
  return [`能正确朗读并理解${title}的主要内容。`, '能从课文中找出关键信息并用自己的话表达。']
}

function focusFor(definition: LowerLessonDefinition): string[] {
  if (definition.title.startsWith('语文园地')) return ['单元复习', '词语积累', '表达练习']
  if (definition.title.includes('古诗')) return ['朗读背诵', '画面想象', '词语积累']
  if (definition.title.includes('识字')) return ['识字方法', '词语积累', '生活表达']
  return ['朗读理解', '生字词语', '阅读表达']
}

function activityFor(definition: LowerLessonDefinition): string {
  const title = titleWithBookMarks(definition.title)
  return `朗读${title}，找出一个你喜欢的词语或句子，再用一句完整的话说说你的发现。`
}

const unitRecords: Unit[] = units.map((unit, index) => ({
  id: `G1_PEP_CHINESE_S2_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  textbookVersionId: G1_PEP_CHINESE_S2_TEXTBOOK_ID,
  code: `G1_PEP_CHINESE_S2_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  title: unit.title,
  subtitle: unit.subtitle,
  sortOrder: index + 1,
  sceneKey: `g1-chinese-lower-${unit.key}`,
  status: 'ACTIVE',
  sourceId: G1_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRows = units.flatMap((unit, unitIndex) => {
  const unitRecord = unitRecords[unitIndex]
  if (!unitRecord) throw new Error(`G1_CHINESE_LOWER_UNIT_MISSING:${unit.key}`)
  return unit.lessons.map((definition, lessonIndex) => ({
    definition,
    unitRecord,
    lessonIndex,
  }))
})

const lessonRecords: Lesson[] = lessonRows.map(
  ({ definition, unitRecord, lessonIndex }, index) => ({
    id: `G1_PEP_CHINESE_S2_LESSON_${String(index + 1).padStart(2, '0')}`,
    unitId: unitRecord.id,
    code: `G1_PEP_CHINESE_S2_LESSON_${String(index + 1).padStart(2, '0')}`,
    title: definition.title,
    sortOrder: lessonIndex + 1,
    status: 'ACTIVE',
    sourceId: G1_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    ...UNVERIFIED,
  }),
)

const knowledgePointRecords: KnowledgePoint[] = lessonRows.map(({ definition }, index) => ({
  id: `G1_PEP_CHINESE_S2_KP_${String(index + 1).padStart(2, '0')}`,
  code: `CN-G1-S2-${String(index + 1).padStart(2, '0')}`,
  name: `${definition.title} · 学习要点`,
  subjectId: G1_PEP_CHINESE_SUBJECT_ID,
  gradeScope: { minGrade: 1, maxGrade: 1, explicitGradeIds: [G1_PEP_CHINESE_GRADE_ID] },
  description: summaryFor(definition),
  learningObjective: goalsFor(definition),
  abilityTags: [
    definition.title.startsWith('语文园地') ? '复习迁移' : '阅读理解',
    '生字词语',
    'g1-chinese',
  ],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeOneChineseLowerLessons: Lesson[] = lessonRecords
export const gradeOneChineseLowerKnowledgePoints: KnowledgePoint[] = knowledgePointRecords

export const gradeOneChineseLowerLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G1_PEP_CHINESE_S2_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeOneChineseLowerKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G1_PEP_CHINESE_S2_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

export const gradeOneChineseLowerCourseContents: CourseContent[] = lessonRows.map(
  ({ definition }, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G1_CHINESE_LOWER_LESSON_CONTENT_MISSING:${index}`)

    const title = titleWithBookMarks(definition.title)
    const blocks = [
      { type: 'TEXT' as const, text: `${title}\n\n${definition.text}` },
      ...(definition.includeAppendix
        ? [{ type: 'TEXT' as const, text: gradeOneChineseLowerAppendix }]
        : []),
      { type: 'TEXT' as const, text: `课后练习：${activityFor(definition)}` },
    ]

    return {
      id: `G1_PEP_CHINESE_S2_CONTENT_${String(index + 1).padStart(2, '0')}`,
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
      sourceId: G1_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
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

export const gradeOneChineseLowerCurriculum: GradeOneChineseLowerCurriculumData = {
  grade: gradeOneChineseLowerGrade,
  semester: gradeOneChineseLowerSemester,
  subject: gradeOneChineseLowerSubject,
  sources: gradeOneChineseLowerSources,
  regions: gradeOneChineseLowerRegions,
  publishers: gradeOneChineseLowerPublishers,
  textbooks: gradeOneChineseLowerTextbooks,
  regionTextbookRelations: gradeOneChineseLowerRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeOneChineseLowerLessons,
  knowledgePoints: gradeOneChineseLowerKnowledgePoints,
  lessonKnowledgePointRelations: gradeOneChineseLowerLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeOneChineseLowerKnowledgePrerequisites,
  courseContents: gradeOneChineseLowerCourseContents,
}
