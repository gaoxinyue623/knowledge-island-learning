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
  gradeOneChineseUpperSubject,
} from '../grade-1/chinese-pep-upper'
import { gradeOneChineseLowerSemester } from '../grade-1/chinese-pep-lower'
import {
  G2_PEP_CHINESE_GRADE_ID,
  G2_PEP_CHINESE_SUBJECT_ID,
  gradeTwoChineseUpperGrade,
} from './chinese-pep-upper'

/**
 * Grade 2 Chinese lower-volume curriculum entered from the text supplied in
 * the current conversation. The complete reading text stays in course
 * content, while the map keeps stable lesson and knowledge-point identities.
 */
export const G2_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID = 'G2_PEP_CHINESE_S2_DIRECTORY_TEXT'
export const G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID = 'G2_PEP_CHINESE_S2_TEXTBOOK_CONTENT'
export const G2_PEP_CHINESE_S2_TEXTBOOK_ID = 'G2_PEP_CHINESE_S2_2024_CANDIDATE'
export const G2_PEP_CHINESE_S2_SEMESTER_ID = 'SEMESTER_LOWER'

const TIMESTAMP = '2026-09-04T00:00:00+08:00'
const UNVERIFIED = {
  needsVerification: true,
  verificationStatus: 'UNVERIFIED' as const,
}

export interface GradeTwoChineseLowerCurriculumData {
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

export const gradeTwoChineseLowerGrade = gradeTwoChineseUpperGrade
export const gradeTwoChineseLowerSemester = gradeOneChineseLowerSemester
export const gradeTwoChineseLowerSubject = gradeOneChineseUpperSubject
export const gradeTwoChineseLowerRegions = gradeOneChineseUpperRegions
export const gradeTwoChineseLowerPublishers = gradeOneChineseUpperPublishers

export const gradeTwoChineseLowerSources: ContentSource[] = [
  {
    id: G2_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的统编（人教版）语文二年级下册目录与课程结构文本',
    publisher: '人民教育出版社',
    edition: '统编版 / 二年级下册（用户提供文本）',
    sourceRef: 'user-provided://g2-chinese-lower-table-of-contents',
    sourceVersion: 'USER_PROVIDED_LOWER_DIRECTORY_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户提供内容，仅用于本地个人开发；未提供公开再分发授权。',
    attribution: '用户在本轮提供的二年级下册课程文本',
    notes: '用于建立广东省、湖北省的二年级语文下册课程结构，不代表已完成出版物授权或外部版权核验。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的统编（人教版）语文二年级下册完整课本文本',
    publisher: '人民教育出版社',
    edition: '统编版 / 二年级下册（用户提供文本）',
    sourceRef: 'user-provided://g2-chinese-lower-full-text',
    sourceVersion: 'USER_PROVIDED_FULL_TEXT_2026-09-04',
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: '用户在本轮提供的二年级下册完整课本文本',
    notes: '课文、语文园地、口语交际和附录作为本地开发数据进入课程内容层；内部审计字段继续保留。',
    verificationStatus: 'UNVERIFIED',
  },
]

export const gradeTwoChineseLowerTextbooks: TextbookVersion[] = [
  {
    id: G2_PEP_CHINESE_S2_TEXTBOOK_ID,
    subjectId: G2_PEP_CHINESE_SUBJECT_ID,
    gradeId: G2_PEP_CHINESE_GRADE_ID,
    semesterId: G2_PEP_CHINESE_S2_SEMESTER_ID,
    publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
    versionName: '人教版（统编版）语文二年级下册',
    curriculumStandard: '义务教育语文课程标准（2022 年版）',
    sourceId: G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
]

export const gradeTwoChineseLowerRegionTextbookRelations: RegionTextbookRelation[] = [
  {
    id: 'G2_PEP_CHINESE_S2_REGION_GUANGDONG',
    regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID,
    textbookVersionId: G2_PEP_CHINESE_S2_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-04',
    sourceId: G2_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  },
  {
    id: 'G2_PEP_CHINESE_S2_REGION_HUBEI',
    regionId: G1_PEP_CHINESE_HUBEI_REGION_ID,
    textbookVersionId: G2_PEP_CHINESE_S2_TEXTBOOK_ID,
    usageType: 'SUPPORTED',
    effectiveFrom: '2026-09-04',
    sourceId: G2_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
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
    title: '第一单元·课文',
    subtitle: '在春天的诗歌、故事和植树活动中感受自然与成长。',
    lessons: [
      lesson(
        '1 古诗二首',
        String.raw`
村居【清】高鼎
草长莺飞二月天，拂堤杨柳醉春烟。
儿童散学归来早，忙趁东风放纸鸢。

咏柳【唐】贺知章
碧玉妆成一树高，万条垂下绿丝绦。
不知细叶谁裁出，二月春风似剪刀。`,
      ),
      lesson(
        '2 找春天',
        String.raw`
春天来了！春天来了！

我们几个孩子脱掉棉袄，冲出家门，奔向田野，去寻找春天。

春天像个害羞的小姑娘，遮遮掩掩，躲躲藏藏。我们仔细地找哇，找哇。

小草从地下探出头来，那是春天的眉毛吧？
早开的野花一朵两朵，那是春天的眼睛吧？
树木吐出点点嫩芽，那是春天的音符吧？
解冻的小溪叮叮咚咚，那是春天的琴声吧？

春天来了！我们看到了她，我们听到了她，我们闻到了她，我们触到了她。她在柳枝上荡秋千，在风筝尾巴上摇哇摇；她在喜鹊、杜鹃嘴里叫，在桃花、杏花枝头笑……`,
      ),
      lesson(
        '3 开满鲜花的小路',
        String.raw`
邮递员黄狗在门口喊：“鼹鼠先生，您的包裹单！”

原来，长颈鹿大叔给鼹鼠先生寄来了一个包裹。

鼹鼠先生赶紧骑着摩托车，到邮局去领包裹。他回家后打开包裹，看见一堆小颗粒，可认不出是什么东西。

鼹鼠先生拿着包裹，来到松鼠太太家。他问松鼠太太：“长颈鹿大叔寄来一个包裹，请您看看是什么东西？”

松鼠太太拿过来一看，里面空空的，什么也没有。原来，包裹破了，里面的东西不见了。看来都漏在来时的路上啦！鼹鼠先生很懊丧。

春天来了，鼹鼠先生要去松鼠太太家做客。啊，通往松鼠太太家的路，成了一条开满鲜花的小路。

鼹鼠先生路过刺猬太太家，正巧，刺猬太太走出门。看到门前开着一大片绚丽多彩的鲜花，她惊奇地说：“这是谁在我家门前种的花？多美啊！”

鼹鼠先生回答：“我不知道！”

鼹鼠先生经过狐狸太太家，正巧，狐狸太太走出门。看到门前开着一大片五颜六色的鲜花，她奇怪地问：“这是谁在我家门前种的花？真美啊！”

鼹鼠先生回答：“我不知道！”

鼹鼠先生来到松鼠太太门前。松鼠太太走出门，看见门前的小路上花朵簇簇，小松鼠、小刺猬和小狐狸在那里快活地蹦啊跳啊。

松鼠太太对鼹鼠先生说：“我知道了，去年长颈鹿大叔寄给你的是花籽。这是多么美好的礼物啊！”`,
      ),
      lesson(
        '4 邓小平爷爷植树',
        String.raw`
1987年4月5日，是个令人难忘的日子。

这一天，碧空如洗，万里无云。在北京天坛公园植树的人群里，83岁高龄的邓小平爷爷格外引人注目。只见他手握铁锹，兴致勃勃地挖着树坑，额头已经满是汗珠，仍不肯休息。

一个树坑挖好了。邓爷爷精心地挑选了一棵茁壮的柏树苗，小心地移入树坑，又挥锹填了几锹土。他站到几步之外仔细看看，觉得不很直，连声说：“不行，不行！”他又走上前把树苗扶正。

一棵绿油油的小柏树栽好了，就像战士一样笔直地站在那里。邓爷爷的脸上露出了满意的笑容。

今天，邓小平爷爷亲手栽种的柏树已经长大了，成了天坛公园一处美丽的风景。

口语交际：注意说话的语气`,
      ),
      lesson(
        '语文园地一',
        String.raw`
识字加油站：亭、咨、询、剧、管、理、宝、塔、餐、厅

字词句运用：形容词填空（____的天空、____的阳光）

书写提示：底、原（左上包围）；局、居（左上包围）

日积月累
赋得古原草送别（节选）【唐】白居易
离离原上草，一岁一枯荣。
野火烧不尽，春风吹又生。

快乐读书吧：读读儿童故事`,
      ),
      lesson(
        '快乐读书吧：读读儿童故事',
        String.raw`
快乐读书吧：读读儿童故事`,
      ),
    ],
  },
  {
    key: 'unit-02',
    title: '第二单元·课文',
    subtitle: '从雷锋、劳动和家庭生活中理解关爱与付出。',
    lessons: [
      lesson(
        '5 雷锋叔叔，你在哪里',
        String.raw`
沿着长长的小溪，
寻找雷锋的足迹。
雷锋叔叔，你在哪里，
你在哪里？

小溪说：
昨天，他曾路过这里，
抱着迷路的孩子，
冒着蒙蒙的细雨。
瞧，那泥泞路上的脚窝，
就是他留下的足迹。

顺着弯弯的小路，
寻找雷锋的足迹。
雷锋叔叔，你在哪里，
你在哪里？

小路说：
昨天，他曾路过这里，
背着年迈的大娘，
踏着路上的荆棘。
瞧，那花瓣上晶莹的露珠，
就是他洒下的汗滴。

乘着温暖的春风，
我们四处寻觅。
啊，终于找到了——
哪里需要献出爱心，
雷锋叔叔就出现在哪里。`,
      ),
      lesson(
        '6 千人糕',
        String.raw`
一天，爸爸对孩子说：“今天我们来吃千人糕吧。”

“爸爸，什么是千人糕？”孩子好奇地问。

“需要很多很多人才能做成的糕。”爸爸回答。

孩子想：这糕要很多很多人才能做成，一定特别大，也许比桌子还大吧？

爸爸端来一块糕，那糕看上去跟平时吃的糕没什么两样。难道它的味道很特别吗？孩子急忙尝了尝，笑了：“这就是平常吃过的米糕嘛！您给我买过。”

爸爸说：“是的，就是平常吃的米糕。你知道这糕是怎么做成的吗？”

孩子说：“是把大米磨成粉做的，还加了糖。”

爸爸说：“是啊，大米是农民种的稻子加工出来的。农民种稻子需要种子、农具、肥料、水……”

爸爸接着说：“糖呢，是用甘蔗汁、甜菜汁熬出来的。甘蔗、甜菜也要有人种。熬糖的时候，要有工具，还得有火……就算米糕做好了，还得要人包装、送货、销售，这些又需要很多人的劳动。”

爸爸拿起面前的糕，说：“你看，一块平平常常的糕，经过很多很多人的劳动，才能摆在我们面前。”

孩子听了爸爸的话，仔细想了想，说：“爸爸，这糕的确应该叫‘千人糕’啊！”`,
      ),
      lesson(
        '7 一匹出色的马',
        String.raw`
一个春天的傍晚，妈妈牵着妹妹，爸爸牵着我，一起到郊外去散步。我们沿着一条小河走。河水碧绿碧绿的，微风吹过，泛起层层波纹。河岸上垂下来的柳叶，拂过妈妈和爸爸的头发，我和妹妹看着都笑了。

路的一边是田野，葱葱绿绿的，非常可爱，像一片柔软的绿毯。

春天的郊外，景色异常美丽。我们一边看，一边走，路已经走了不少，却还恋恋不舍，不想回去。

当我们往回走的时候，妹妹求妈妈抱她：“我很累，走不动了，抱抱我。”

妈妈摇摇头，回答说：“不行啊，我也很累，抱不动你了。”

妹妹转过头求爸爸。爸爸不作声，他松开我的手，从路旁一株柳树下，拾起一根又长又细的枝条，把它递给了妹妹，说：“这是一匹出色的马，你走不动了，就骑着它回家吧。”

妹妹高兴地跨上“马”，蹦蹦跳跳地奔向前去。等我们回到家时，她已经在门口迎接我们，笑着说：“我早回来啦！”`,
      ),
      lesson(
        '语文园地二',
        String.raw`
识字加油站：工、农、商、学、兵

字词句运用：“____，好像____”比喻句

书写提示：劝、堆（左右宽窄）；转、特

日积月累
予人玫瑰，手有余香。
平时肯帮人，急时有人帮。
与其锦上添花，不如雪中送炭。`,
      ),
    ],
  },
  {
    key: 'unit-03',
    title: '第三单元·识字',
    subtitle: '在神州、节日、汉字故事和中国美食中积累文化词语。',
    lessons: [
      lesson(
        '1 神州谣',
        String.raw`
我神州，称中华，
山川美，可入画。
黄河奔，长江涌，
长城长，珠峰耸。

台湾岛，隔海峡，
与大陆，是一家。

各民族，情谊浓，
齐奋发，共繁荣。`,
      ),
      lesson(
        '2 传统节日',
        String.raw`
春节到，人欢笑，贴窗花，放鞭炮。
元宵节，看花灯，大街小巷人如潮。
清明节，雨纷纷，先人墓前去祭扫。
过端午，赛龙舟，粽香艾香满堂飘。
七月七，来乞巧，牛郎织女会鹊桥。
过中秋，吃月饼，十五圆月当空照。
重阳节，要敬老，踏秋赏菊去登高。
转眼又是新春到，全家团圆真热闹。`,
      ),
      lesson(
        '3 “贝”的故事',
        String.raw`
一些生活在水里的动物，用贝壳保护自己的身体。甲骨文中的“贝”字，画的就是贝壳的两扇壳张开的样子。

古时候，人们觉得贝壳很漂亮，很珍贵，喜欢把它们当作饰品戴在身上。而且贝壳可以随身携带，不容易损坏，于是古人还把贝壳当作钱币。所以，用“贝”作偏旁的字大多与钱财有关，比如，赚、赔、购、贫、货。`,
      ),
      lesson(
        '4 中国美食',
        String.raw`
凉拌菠菜  香煎豆腐  红烧茄子
烤鸭      水煮鱼    葱爆羊肉
小鸡炖蘑菇  蒸饺    炸酱面  小米粥  蛋炒饭

口语交际：长大以后做什么`,
      ),
      lesson(
        '语文园地三',
        String.raw`
识字加油站：饰品、钱财相关字词

字词句运用：形近字辨析（宵/霄，赔/陪）

书写提示：彩、梦、森、团

日积月累
子鼠 丑牛 寅虎 卯兔
辰龙 巳蛇 午马 未羊
申猴 酉鸡 戌狗 亥猪`,
      ),
    ],
  },
  {
    key: 'unit-04',
    title: '第四单元·课文',
    subtitle: '在彩色想象、童话和虫子世界中练习想象与表达。',
    lessons: [
      lesson(
        '8 彩色的梦',
        String.raw`
我有一大把彩色的梦，
有的长，有的圆，有的硬。
他们躺在铅笔盒里聊天，
一打开，就在白纸上跳蹦。

脚尖滑过的地方，
大块的草坪，绿了；
大朵的野花，红了；
大片的天空，蓝了，
蓝——得——透——明！

在葱郁的森林里，
雪松们拉着手，
请小鸟留下歌声。
小屋的烟囱上，
结一个苹果般的太阳，
又大——又红！

我的彩色铅笔，
是大森林的精灵。
我的彩色梦境，
有水果香，有季节风，
还有紫葡萄的叮咛，
在溪水里流动……`,
      ),
      lesson(
        '9 枫树上的喜鹊',
        String.raw`
我们村的渡口旁有一棵枫树，我很喜欢它。它好像一把很大又很高的绿色太阳伞，一直打开着。它的绿荫遮蔽了村里的渡口。枫树上有一个喜鹊的窝，我喜欢极了。

是的，我喜欢站在枫树下，抬头看喜鹊的窝。我常常觉得喜鹊会跟我说话，我像童话书里那样，在心中称呼她喜鹊阿姨。

我真是喜欢极了。上个星期天早上，我正要撑着渡船到对岸的树林里去打柴，发现喜鹊阿姨的窝里有六只小喜鹊了。

我真是像童话书里那样，在心中称呼小喜鹊是喜鹊弟弟。

喜鹊阿姨一会儿教喜鹊弟弟唱歌，一会儿教他们做游戏，一会儿教他们学自己发明的拼音字母……

“鹊！鹊！鹊！”喜鹊阿姨教道。
我知道，这便是a、o、e。

喜鹊弟弟也跟着学：“鹊，鹊，鹊……”

今天早上，太阳从渡口对岸山冈后面升上来了，我看见喜鹊阿姨站在窝边，指着上升的太阳，问喜鹊弟弟：“鹊！鹊鹊鹊？”

我懂得，她问话的意思是：“看！那是什么？”

喜鹊弟弟一齐快乐地回答：“鹊！鹊鹊！鹊鹊鹊！”

我懂得，喜鹊弟弟很快给出了答案：“妈妈，那是太阳！太阳升上来了！”

我真高兴啊！`,
      ),
      lesson(
        '10 沙滩上的童话',
        String.raw`
海边的沙滩是我们的快乐天地。

在沙滩上，我们垒起城堡，城堡周围筑起围墙，围墙外再插上干树枝，那就是我们的树。

不知道谁说了一句：“这城堡里住着一个凶狠的魔王。”

有人接着补充：“他抢去了美丽的公主！”

第三个小伙伴说：“你们快听，公主在城堡里哭呢！”

就这样，我们编织着童话。

转眼间，我们亲手建造的城堡成了一座魔窟，我们也成了攻打魔窟的勇士。

我们一起商量怎样攻下那座城堡。

一个小伙伴说：“我驾驶飞机去轰炸。”
有人反驳：“那时候还没有飞机呢！”

我说：“挖地道，从地下装上火药，把城堡炸平。”

我的办法得到了大家的赞赏。于是我们趴在沙滩上，从四面八方挖着地道。

挖呀，挖呀，我们终于挖到了城堡下面，然后合力用手往上一抬，就把城堡给轰塌了。

我们欢呼着胜利，欢呼着炸死了魔王，欢呼着救出了公主。

但公主在哪儿？

忽然，我发现妈妈就站在我们身后，微笑着望着我们。

我大声说：“公主被我们救出来啦！救出来啦！”接着，我抱住了妈妈。

大家跟着一起叫喊着，欢呼着。

真的，那时候，连我也忘记了她就是我的妈妈！`,
      ),
      lesson(
        '11 我是一只小虫子',
        String.raw`
当一只小虫子好不好？我的伙伴们都说：“当一只小虫子，一点儿都不好。”

我们蹦蹦跳跳的时候，一定要看准地方，不然屁股会被苍耳刺痛的。一不留神，我们会蹦进很深很深的水里，被淹得昏头昏脑。其实，那深水只是小狗撒的一泡尿。孩子们都觉得毛茸茸的小鸟很可爱，但我们小虫子没有谁会喜欢小鸟。

不过，我觉得当一只小虫子还真不错。

早上醒来，我在摇摇晃晃的草叶上伸懒腰，用一颗露珠把脸洗干净，把细长的触须擦得亮亮的。如果能小心地跳到狗的身上，我们就可以到很远的地方去旅行。这可是免费的特快列车呀！

我有很多小伙伴，每一个都特别有意思。

走在外面一定要小心，别被屎壳郎撞伤，因为他们搬运食物的时候，从来不看路。螳螂很贪吃，总想把我吃掉，但真幸运，他不会像我一样跳。有些虫子脾气不太好，比如天牛，每次我说“天牛大婶，早上好”，她总是想顶我一下。

我喜欢当一只小虫子。当我很快乐的时候，会使劲叫哇叫，所以，如果你在夜晚听见草地里的歌声——你就一定能找到我！`,
      ),
      lesson(
        '语文园地四',
        String.raw`
识字加油站：陀螺、毽子、不倒翁、玩具枪等游戏词语

字词句运用：比喻句积累

书写提示：全包围字：圆、国；半包围：匹、巨

日积月累
轻诺必寡信。——《老子》
民无信不立。——《论语》
不精不诚，不能动人。——《庄子》`,
      ),
    ],
  },
  {
    key: 'unit-05',
    title: '第五单元·课文',
    subtitle: '通过寓言、画画和过河的故事学习思考与实践。',
    lessons: [
      lesson(
        '12 寓言二则',
        String.raw`
亡羊补牢
从前有个人，养了几只羊。一天早上，他去放羊，发现少了一只。原来羊圈破了个窟窿，夜里狼从窟窿钻进去，把羊叼走了。

街坊劝他说：“赶紧把羊圈修一修，堵上那个窟窿吧！”

他说：“羊已经丢了，还修羊圈干什么？”

第二天早上，他去放羊，发现羊又少了一只。原来狼又从窟窿钻进去，叼走了羊。

他很后悔没有听街坊的劝告，于是赶紧堵上那个窟窿，把羊圈修得结结实实的。从此，他的羊再也没有丢过。

揠苗助长
古时候有个人，他巴望自己田里的禾苗长得快些，天天到田边去看。可是，一天，两天，三天，禾苗好像一点儿也没有长高。他在田边焦急地转来转去，自言自语地说：“我得想个办法帮它们长。”

一天，他终于想出了办法，就急忙跑到田里，把禾苗一棵一棵往高里拔。从中午一直忙到太阳落山，弄得筋疲力尽。

他回到家里，一边喘气一边说：“今天可把我累坏了！力气总算没白费，禾苗都长高了一大截。”

他的儿子不明白是怎么回事，第二天跑到田里一看，禾苗都枯死了。`,
      ),
      lesson(
        '13 画杨桃',
        String.raw`
有一次上图画课，老师把两个杨桃摆在讲桌上，要同学们画。我的座位在前排靠边的地方，讲桌上那两个杨桃的一端正对着我。我看到的杨桃根本不像平时看到的那样，而像是五个角的什么东西。我认认真真地看，老老实实地画，自己觉得画得很准确。

当我把这幅画交出去的时候，班里几个同学看见了，哈哈大笑起来。

“杨桃是这个样子的吗？”
“倒不如说是五角星吧！”

老师看了看这幅画，到我的座位上坐下来，审视了一下讲桌上的杨桃，然后回到讲桌前，举起我的那页画纸，问大家：

“这幅画画得像不像？”
“不像！”
“它像什么？”
“像五角星！”

老师的神情变得严肃了。半晌，他又问道：“画杨桃画成了五角星，好笑吗？”

“好笑！”有几个同学抢着答道，同时发出嘻嘻的笑声。

于是，老师请这几个同学轮流坐到我的座位上。他对第一个坐下的同学说：“现在你看看那杨桃，像你平时看到的杨桃吗？”

“不……不像。”
“那么，像什么呢？”
“像……五……五角星。”

“好，下一个。”

老师让这几个同学回到自己的座位上，然后和颜悦色地说：“大家发现了吗？看的角度不同，杨桃的样子也就不一样。当我们看见别人把杨桃画成五角星的时候，不要忙着发笑，要看看人家是从什么角度看的。”

老师的教诲让我终生难忘。`,
      ),
      lesson(
        '14 小马过河',
        String.raw`
马棚里住着一匹老马和一匹小马。

有一天，老马对小马说：“你已经长大了，能帮妈妈做点事吗？”小马连蹦带跳地说：“怎么不能？我很愿意帮您做事。”老马高兴地说：“那你就把这半口袋麦子驮到磨坊去吧。”

小马驮起口袋，飞快地往磨坊跑去。跑着跑着，一条小河挡住了去路，河水哗哗地流着。小马为难了，心想：我能不能过去呢？如果妈妈在身边，问问她该怎么办，那多好啊！可是他离家已经很远了。

小马向四周望望，看见一头老牛在河边吃草。小马哒哒哒跑过去，问道：“牛伯伯，请您告诉我，这条河，我能蹚过去吗？”老牛说：“水很浅，刚没小腿，能蹚过去。”

小马听了老牛的话，立刻跑到河边，准备蹚过去。突然，从树上跳下一只松鼠，拦住他大叫：“小马！别过河，别过河，你会淹死的！”

小马吃惊地问：“水很深吗？”松鼠认真地说：“深得很哩！昨天，我的一个伙伴就是掉在这条河里淹死的！”

小马连忙收住脚步，不知道怎么办才好。他叹了口气，说：“唉，还是回家问问妈妈吧！”

小马甩甩尾巴，跑回家去。妈妈问他：“怎么回来啦？”小马难为情地说：“一条河挡住了去路，我……我过不去。”

妈妈说：“那条河不是很浅吗？”小马说：“是啊！牛伯伯也这么说。可是松鼠说河水很深，还淹死过他的伙伴呢！”

妈妈说：“那么河水到底是深还是浅呢？你仔细想过他们的话吗？”小马低下了头，说：“没……没想过。”

妈妈亲切地对小马说：“孩子，光听别人说，自己不动脑筋，不去试试，是不行的。河水是深是浅，你去试一试就知道了。”

小马跑到河边，刚刚抬起前蹄，松鼠又大叫起来：“怎么，你不要命啦！”小马说：“让我试试吧。”他下了河，小心地蹚到了对岸。原来河水既不像老牛说的那样浅，也不像松鼠说的那样深。

口语交际：图书借阅公约`,
      ),
      lesson(
        '语文园地五',
        String.raw`
识字加油站：愿、意、该、刻、疲等心情、神态词语

字词句运用：“一会儿……一会儿……一会儿……”

书写提示：含“心”字底、“忄”的字

日积月累
《弟子规》选段
冠必正，纽必结，袜与履，俱紧切。
置官服，有定位，勿乱顿，致污秽。`,
      ),
    ],
  },
  {
    key: 'unit-06',
    title: '第六单元·课文',
    subtitle: '在山水、天气、方向和太空生活中观察自然与科技。',
    lessons: [
      lesson(
        '15 古诗二首',
        String.raw`
晓出净慈寺送林子方【宋】杨万里
毕竟西湖六月中，风光不与四时同。
接天莲叶无穷碧，映日荷花别样红。

绝句【唐】杜甫
两个黄鹂鸣翠柳，一行白鹭上青天。
窗含西岭千秋雪，门泊东吴万里船。`,
      ),
      lesson(
        '16 雷雨',
        String.raw`
满天的乌云，黑沉沉地压下来。树上的叶子一动不动，蝉一声也不出。

忽然一阵大风，吹得树枝乱摆。一只蜘蛛从网上垂下来，逃走了。

闪电越来越亮，雷声越来越响。

哗，哗，哗，雨下起来了。

雨越下越大。往窗外望去，树啊，房子啊，都看不清了。

渐渐地，渐渐地，雷声小了，雨声也小了。

天亮起来了。打开窗户，清新的空气迎面扑来。

雨停了。太阳出来了。一条彩虹挂在天空。蝉叫了。蜘蛛又坐在网上。池塘里水满了，青蛙也叫起来了。`,
      ),
      lesson(
        '17 要是你在野外迷了路',
        String.raw`
要是你在野外迷了路，
可千万别慌张。
大自然有很多天然的指南针，
会帮助你辨别方向。

太阳是个忠实的向导，
它在天空给你指点方向：
中午的时候它在南边，
地上的树影正指着北方。

北极星是盏指路灯，
它永远高挂在北方。
要是你能认出它，
就不会在黑夜里乱闯。

要是碰上阴雨天，
大树也会来帮忙。
枝叶稠的一面是南方，
枝叶稀的一面是北方。

雪特别怕太阳，
沟渠里的积雪会给你指点方向。
看看哪边雪化得快，哪边化得慢，
就可以分辨北方和南方。

要是你在野外迷了路，
可千万别慌张。
大自然有很多天然的指南针，
需要你细细观察，多多去想。`,
      ),
      lesson(
        '18 太空生活趣事多',
        String.raw`
你知道航天员在太空中怎样生活吗？说起来还挺有趣呢！

在宇宙飞船里，站着睡觉和躺着睡觉一样舒服。不过，要想睡个安稳觉，航天员必须钻入固定在舱壁上的睡袋里。不然，一不小心就会飘到别处去。

在宇宙飞船里活动也需要技巧。跟在地面上用脚走路不同，在宇宙飞船里是用手移动身体。航天员把双脚固定起来，如果不用固定，身体就会飘起来。

喝水的时候，如果用普通的杯子，即使把杯子倒过来，水也不会往下流。因为在宇宙飞船里，水失去了重量。航天员要想喝到水，得使用一种带吸管的饮水袋。

在宇宙飞船里洗澡可不是一件容易的事，从喷头喷出的水总是飘浮在空中。为了解决这个难题，科学家把淋浴室做成一个密封浴桶，或是一个密封浴罩，在淋浴室下边安装吸管，它可以把喷头喷出来的水朝一个方向吸。另外，航天员还需要把双脚固定起来，否则水一冲，就得翻跟头。

你看，在太空中生活，是不是很有趣？`,
      ),
      lesson(
        '语文园地六',
        String.raw`
识字加油站：博物馆、展览馆、科技馆、研究所

字词句运用：“越……越……”

书写提示：含“雨”字头的字：雷、雪、雾、露

日积月累
二十四节气歌
春雨惊春清谷天，夏满芒夏暑相连。
秋处露秋寒霜降，冬雪雪冬小大寒。`,
      ),
    ],
  },
  {
    key: 'unit-07',
    title: '第七单元·课文',
    subtitle: '在动物故事中理解尊重差异、坚持和改变。',
    lessons: [
      lesson(
        '19 大象的耳朵',
        String.raw`
大象有一对大耳朵，像扇子似的，耷拉着。

这一天，大象正在路上慢慢地散步，遇到了小兔子。

小兔子说：“咦，大象啊，你的耳朵怎么耷拉下来了？”

大象说：“我生来就是这样啊。”

小兔子说：“你看，我的耳朵是竖着的，你的耳朵一定是出毛病了。”

后来，大象又遇到了小羊。小羊也说：“大象啊，你的耳朵怎么是耷拉着的呢？”

小鹿、小马，还有小老鼠，见到了大象，都要说他的耳朵。

大象也不安起来，他自言自语地说：“他们都这么说，是不是我的耳朵真的有毛病啦？我得让我的耳朵竖起来。”

怎么才能让耳朵竖起来呢？

每天，大象站着睡觉的时候，就用两根竹竿，把耳朵撑起来。

可是，大象的耳朵眼儿里，经常有小虫子飞进去，还在里面跳舞，吵得他又头痛，又心烦。

最后，大象还是把他的耳朵放了下来。这样，虫子飞不进去了。有虫子来的话，大象只要把他的大耳朵一扇，就能把它们赶跑。

大象说：“我还是让耳朵耷拉着吧。人家是人家，我是我。”`,
      ),
      lesson(
        '20 蜘蛛开店',
        String.raw`
有一只蜘蛛，每天蹲在网上很无聊，决定开一家商店。

卖什么呢？就卖口罩吧，因为口罩织起来很简单。

于是，蜘蛛在一间小木屋外面挂了一个招牌，上面写着：“口罩编织店，每位顾客只需付一元钱。”

顾客来了，是一只河马。河马嘴巴那么大，口罩好难织啊，蜘蛛用了一整天的工夫，终于织完了。

晚上，蜘蛛想：还是卖围巾吧，围巾织起来很简单。

第二天，蜘蛛的招牌换了，上面写着：“围巾编织店，每位顾客只需付一元钱。”

顾客来了，只见身子不见头。蜘蛛向上一看，原来是一只长颈鹿，他的脖子和大树一样高，脑袋从树叶间露出来，正对着蜘蛛笑呢。

蜘蛛织啊织，足足忙了一个星期，才织完那条长长的围巾。

蜘蛛累得趴倒在地上，心里想：还是卖袜子吧，袜子织起来很简单。

第二天，蜘蛛的招牌又换了，上面写着：“袜子编织店，每位顾客只需付一元钱。”

可是，顾客来了，看到顾客之后，蜘蛛吓得匆忙跑回网上。原来那位顾客竟是一条四十二只脚的蜈蚣！`,
      ),
      lesson(
        '21 青蛙卖泥塘',
        String.raw`
青蛙住在烂泥塘里。他觉得这儿不怎么样，想把泥塘卖掉，换一些钱搬到城里住。

于是青蛙在泥塘边竖起一块牌子，上面写着“卖泥塘”三个字。

“卖泥塘喽，卖泥塘！”青蛙站在牌子边大声吆喝起来。一头老牛走过来，看了看泥塘，说：“这个水坑坑嘛，在里边打打滚倒挺舒服。不过，要是周围有些草就更好了。”

老牛不想买泥塘，走了。

青蛙想，要是在泥塘周围种些草，就能卖出去了。于是他就去采集草籽，播撒在泥塘周围的地上。到了春天，泥塘周围长出了绿茵茵的小草。

青蛙又站在牌子旁边，大声吆喝起来：“卖泥塘喽，卖泥塘！”

一只野鸭飞来了，看了看泥塘，说：“这地方好是好，就是塘里的水太少了。”

野鸭没有买泥塘，飞走了。

青蛙想，要是能往泥塘里引些水，就能卖出去了。于是他跑到周围的山里找到泉水，又砍了些竹子，把竹子破开，一根一根接起来，把水引到泥塘里来。

等泥塘灌足了水以后，青蛙又站在牌子下，大声吆喝起来：“卖泥塘喽，卖泥塘！”可是泥塘还是没有卖出去。

小鸟飞来说，这里缺点儿树；蝴蝶飞来说，这里缺点儿花；小兔跑来说，这里还缺条路；小猴跑来说，这儿应该盖所房子；小狐狸说……每次听了小动物的话，青蛙都想：对！对！要是那样的话，泥塘准能卖出去。于是青蛙就照着他们的话去做，栽了树，种了花，修了路，还在泥塘旁边盖了房子。

“卖泥塘喽，卖泥塘！有树，有花，有草，有水塘。你可以看蝴蝶在花丛中飞舞，听小鸟在树上唱歌。你可以在水里尽情游泳，躺在草地上晒太阳。这儿还有道路通到城里……”青蛙说到这里，突然愣住了，他想：这么好的地方，自己住挺好的，为什么要卖掉呢？

于是青蛙不再卖泥塘了。`,
      ),
      lesson(
        '22 小毛虫',
        String.raw`
一只小毛虫趴在一片叶子上，用新奇的目光打量着周围的一切：大大小小的昆虫又是唱，又是跳，跑的跑，飞的飞……到处生机勃勃。只有它，这个可怜的小毛虫，既不会唱，也不会跑，更不会飞。

小毛虫费了九牛二虎之力，才挪动了一点点。当它笨拙地从一片叶子爬到另一片叶子上时，它觉得自己仿佛周游了整个世界。

尽管如此，它并不悲观失望，也不羡慕任何人。它懂得：每个人都有自己该做的事情。它，一条小小的毛虫，眼前最要紧的是学会抽丝纺织，为自己编织一间牢固的茧屋。

小毛虫一刻也没有迟疑，尽心竭力地工作着。它织啊织啊，最后把自己从头到脚裹进了温暖的茧屋里。

“以后会怎么样呢？”它在茧屋里问自己。

万事万物都有自己的规律！小毛虫听到一个声音在回答，你要耐心等待，以后会明白的。

时辰到了，它清醒了过来，再也不是以前那条笨手笨脚的小毛虫。它灵巧地从茧子里挣脱出来，惊奇地发现自己身上生出了一对轻盈的翅膀，上面布满色彩斑斓的花纹。它愉快地舞动了一下双翅，如绒毛一般，从叶子上飘然而起。它飞啊飞，渐渐地消失在蓝色的雾霭之中。`,
      ),
      lesson(
        '语文园地七',
        String.raw`
识字加油站：扫帚、抹布、拖把、水桶等家务工具

字词句运用：“好像”造句，把事物写生动

书写提示：上下结构字：含“宀”的字

日积月累
悯农（其一）【唐】李绅
春种一粒粟，秋收万颗子。
四海无闲田，农夫犹饿死。`,
      ),
    ],
  },
  {
    key: 'unit-08',
    title: '第八单元·课文',
    subtitle: '从祖先、世界和神话故事中展开想象，理解规律与责任。',
    lessons: [
      lesson(
        '23 祖先的摇篮',
        String.raw`
爷爷说，
那原始森林，
是我们祖先的摇篮。

那浓绿的树荫，
一望无边，
遮住了蓝天。

我想——
我们的祖先，
可曾在这些大树上
摘野果，掏鹊蛋？

可曾在那片草地上
和野兔赛跑，看蘑菇打伞？

那时候，
孩子们也在这里
逗小松鼠，采野蔷薇吗？

也在这里
捉红蜻蜓，逮绿蝈蝈吗？

风儿吹动树叶，
“沙沙，沙沙！”

那回忆
多么美好，
又那么遥远……

啊！
苍苍茫茫的原始森林，
是我们祖先的摇篮！`,
      ),
      lesson(
        '24 当世界年纪还小的时候',
        String.raw`
当世界年纪还小的时候，每样东西都必须学习怎么生活。

太阳开始学发光，学着怎么上山下山。它也试过做别的事，但是都没有成功。譬如说唱歌，它粗糙的声音，把这个敏感的新世界吓坏了。

月亮不知道自己该学些什么。学发光吗？白天它觉得这主意不好，晚上它又觉得这主意不错。它一直无法决定，只好反反复复，一阵子这样，一阵子那样，所以看起来有时圆有时缺。它学会的是不断变化。

水开始学习流动。它很快就学会了，因为只有一种方式，那就是：一直往低处流，往低处流，往低处流……

那时候，生活就是这么简单。每样东西只要弄明白自己做什么最容易就行了。

世界在慢慢变化，万物在自由生长。雨从云里落下，滴进泥土里；人睁开眼睛，就可以看到一切有多美好……只要万物都做它最容易做的事，这世界就很有秩序了。

这世界还相当有秩序……

哦！不要往下讲了，最好再从头开始。这个故事没有结局，却有很多开头，很多很多开头。`,
      ),
      lesson(
        '25 羿射九日',
        String.raw`
很久很久以前，在世界最东边的海上，生长着一棵大树叫扶桑。扶桑的枝头站着一个太阳，底下还有九个太阳。每天天快亮时，扶桑枝头的太阳就坐上两轮车，开始从东往西穿过天空。十个太阳每天轮换，给大地万物带来光明和温暖。

可是，有一天，这十个太阳觉得轮流值日太没意思啦，于是，他们一齐跑了出来，出现在天空。

十个太阳像十个大火球，炙烤着大地。

禾苗被晒枯了，土地被烤焦了，江河里的水被蒸干了，连地上的沙石好像都要被熔化了。人类的日子非常艰难。

神箭手羿决心帮助人们脱离苦海。他翻过九十九座高山，蹚过九十九条大河，来到东海边。他登上一座大山，搭上神箭，拉开神弓，对准天上的一个太阳，嗖地就是一箭。那个太阳一下子爆裂开，一团团火球到处乱窜，接着，噗噗地掉在地上。

羿一口气射下了九个太阳，炎热渐渐退去。羿又伸手拔箭，准备射下最后一个太阳。这个太阳害怕极了，慌慌张张地躲进了大海里。

天上没有了太阳，整个世界一片黑暗。羿想，没有了太阳，就没有了光明和温暖，庄稼不能生长，人类和动物也没法活下去。于是，羿留下了最后一个太阳。

从此，太阳每天从东方升起，到西方落下。土地渐渐滋润起来，花草树木渐渐繁茂起来，江河奔腾欢唱，大地上重新现出了勃勃生机。

口语交际：推荐一部动画片`,
      ),
      lesson(
        '语文园地八',
        String.raw`
识字加油站：神、祖、礼、福等示字旁；补、袜、衫、被等衣字旁

字词句运用：读句子，想象画面

书写提示：左右宽窄不同的字

日积月累
舟夜书所见【清】查慎行
月黑见渔灯，孤光一点萤。
微微风簇浪，散作满河星。

和大人一起读：《李时珍》`,
        true,
      ),
    ],
  },
]

const gradeTwoChineseLowerAppendix = String.raw`
附录一 识字表（会认450字，不带拼音）

第一单元
脱 袄 寻 羞 姑 遮 掩 嫩 符 触 鹃 杜 鹃
邮 递 裹 局 破 漏 懊 丧 啊 猬 绚 籽
邓 植 格 引 注 满 休 息

第二单元
锋 昨 冒 留 弯 背 暖 洒 温 晶 泞
糕 特 嘛 粉 糖 劳 的 确
郊 泛 波 纹 葱 软 毯 异 恋 舍 求 株

第三单元
州 华 山 川 长 涌 峰 隔 峡 与 陆 谊 浓 齐 奋
宵 巷 祭 堂 乞 巧 宵 饼 赏 菊
甲 骨 财 币 与 钱 财 购 贫 货
菠 煎 腐 茄 烤 煮 爆 炖 蘑 菇 饺 粥 蛋

第四单元
盒 聊 坪 郁 囱 般 精 叮 咛
渡 荫 蔽 鹊 窝 渡 冈
堡 垒 狠 攻 互 商 量 驾 轰 驳 药 赞
昆 怜 挪 仿 佛 尽 绒 竭 规 挣 愉 绒

第五单元
寓 则 亡 牢 圈 钻 劝 丢 告 疲
图 课 摆 座 交 哈 页 抢 嘻 悦 诲
棚 驮 磨 坊 既 试 蹄 唉 哩

第六单元
湖 莲 穷 荷 绝 含 岭 泊
压 蝉 垂 户
指 针 帮 助 导 永 碰 特 积
宇 宙 杯 失 板 容 易 浴 桶 罩

第七单元
扇 慢 遇 兔 安 根 痛 最
店 蹲 寂 罩 编 顾 付 颈 袜 蜈 蚣
烂 泥 塘 吆 喝 坑 劲 茵 灌 缺 播 挪 伐 锯 牌
昆 怜 挪 仿 佛 尽 绒 竭 规 挣 愉 绒

第八单元
篮 望 摘 掏 赛 蔷 薇 逮 忆
纪 必 须 功 譬 糙 敏 式 简
射 箭 猎 雁 弦 惨 裂 痛 愈 属

附录二 写字表（会写250字）

第一单元
诗 村 童 碧 妆 绿 丝 剪
冲 寻 姑 娘 吐 柳 荡
鲜 邮 递 員 原 叔 局 堆 礼
邓 植 格 引 注 满 休 息

第二单元
锋 昨 冒 留 弯 背 暖 洒 温
能 桌 味 买 具 甘 甜 菜 劳
匹 妹 波 纹 像 景 恋 舍

第三单元
州 华 山 川 长 涌 峰
贴 街 舟 艾 敬 转 团 热
贝 壳 甲 骨 钱 币 财 关
烧 茄 烤 鸭 肉 鸡 蛋

第四单元
彩 梦 森 拉 结 苹 般 精
伞 母 姨 弟 戏 便 游
周 围 句 补 充 药 死 记
屁 股 尿 净 屎 幸

第五单元
亡 牢 钻 劝 丢 告
图 课 摆 座 交 哈
愿 意 麦 该 伯 刻 突

第六单元
湖 莲 穷 荷 绝 含 岭 泊
雷 乌 黑 压 垂 户
指 针 帮 助 导 永
宇 宙 杯 失 板 容 易

第七单元
扇 慢 遇 兔 安 根 痛 最
店 决 定 商 夫 终
蛙 卖 搬 倒 籽 泉 破
整 抽 纺 织 编

第八单元
祖 啊 浓 望 蓝 摘 掏 赛
世 界 功 反 复 式
觉 值 类 艰 弓 此 炎

附录三 词语表

第一单元
古诗 村居 儿童 碧绿 丝线 剪刀
寻找 姑娘 野花 柳枝 桃花 杏花
鲜花 邮递员 原来 大叔 邮局 礼物
植树 格外 休息 树苗 小心 笔直 满意

第二单元
雷锋 昨天 冒雨 留下 弯弯 温暖 爱心
劳动 才能 桌子 味道 买卖 甘甜 青菜
郊外 波纹 景色 恋恋不舍 好像

第三单元
神州 中华 山川 长城 民族 情谊
春节 花灯 先人 龙舟 中秋 转眼 团圆
贝壳 钱币 钱财 有关 美食 烤鸭 鸡蛋

第四单元
彩色 梦想 森林 苹果 一般 精灵
枫树 喜鹊 阿姨 弟弟 游戏
周围 补充 火药 合力 欢呼
屁股 干净 幸运 使劲

第五单元
亡羊补牢 劝告 禾苗 筋疲力尽
图画 上课 座位 哈哈大笑 图画 老师
愿意 麦子 为难 身边 立刻 吃惊 认真

第六单元
西湖 莲叶 荷花 绝句 黄鹂 白鹭
雷雨 乌云 闪电 窗户 清新 彩虹
指南针 帮助 永远 碰到 特别 积雪
宇宙 杯子 失去 容易 洗澡 浴室

第七单元
扇子 慢慢 遇到 兔子 不安 头痛 最后
商店 决定 围巾 星期 工夫
青蛙 泥塘 搬家 泉水 应该 花草
毛虫 叶子 目光 周围 纺织 编织 怎样

第八单元
祖先 原始 意思 浓绿 一望无边 回忆
世界 年纪 必须 简单 变化 自由
觉得 人类 艰难 弓箭 从此 重新`

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
  if (definition.title.startsWith('语文园地'))
    return [`能完成${title}中的复习任务。`, '能用完整句子说出自己的学习发现。']
  if (definition.title.startsWith('快乐读书吧'))
    return [`能围绕${title}选择儿童故事进行阅读和分享。`, '能说出故事中的一个人物或情节。']
  return [`能正确朗读并理解${title}的主要内容。`, '能从课文中找出关键信息并用自己的话表达。']
}

function focusFor(definition: LowerLessonDefinition): string[] {
  if (definition.title.startsWith('语文园地')) return ['单元复习', '词语积累', '表达练习']
  if (definition.title.startsWith('快乐读书吧')) return ['课外阅读', '故事分享', '阅读习惯']
  if (definition.title.includes('古诗')) return ['朗读背诵', '画面想象', '词语积累']
  if (definition.title.includes('识字')) return ['识字方法', '词语积累', '生活表达']
  return ['朗读理解', '生字词语', '阅读表达']
}

function activityFor(definition: LowerLessonDefinition): string {
  return `朗读${titleWithBookMarks(definition.title)}，找出一个你喜欢的词语或句子，再用一句完整的话说说你的发现。`
}

const unitRecords: Unit[] = units.map((unit, index) => ({
  id: `G2_PEP_CHINESE_S2_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  textbookVersionId: G2_PEP_CHINESE_S2_TEXTBOOK_ID,
  code: `G2_PEP_CHINESE_S2_${unit.key.toUpperCase().replaceAll('-', '_')}`,
  title: unit.title,
  subtitle: unit.subtitle,
  sortOrder: index + 1,
  sceneKey: `g2-chinese-lower-${unit.key}`,
  status: 'ACTIVE',
  sourceId: G2_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
  ...UNVERIFIED,
}))

const lessonRows = units.flatMap((unit, unitIndex) => {
  const unitRecord = unitRecords[unitIndex]
  if (!unitRecord) throw new Error(`G2_CHINESE_LOWER_UNIT_MISSING:${unit.key}`)
  return unit.lessons.map((definition, lessonIndex) => ({
    definition,
    unitRecord,
    lessonIndex,
  }))
})

const lessonRecords: Lesson[] = lessonRows.map(
  ({ definition, unitRecord, lessonIndex }, index) => ({
    id: `G2_PEP_CHINESE_S2_LESSON_${String(index + 1).padStart(2, '0')}`,
    unitId: unitRecord.id,
    code: `G2_PEP_CHINESE_S2_LESSON_${String(index + 1).padStart(2, '0')}`,
    title: definition.title,
    sortOrder: lessonIndex + 1,
    status: 'ACTIVE',
    sourceId: G2_PEP_CHINESE_S2_DIRECTORY_SOURCE_ID,
    ...UNVERIFIED,
  }),
)

const knowledgePointRecords: KnowledgePoint[] = lessonRows.map(({ definition }, index) => ({
  id: `G2_PEP_CHINESE_S2_KP_${String(index + 1).padStart(2, '0')}`,
  code: `CN-G2-S2-${String(index + 1).padStart(2, '0')}`,
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
  sourceId: G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
  ...UNVERIFIED,
}))

export const gradeTwoChineseLowerLessons: Lesson[] = lessonRecords
export const gradeTwoChineseLowerKnowledgePoints: KnowledgePoint[] = knowledgePointRecords

export const gradeTwoChineseLowerLessonKnowledgePointRelations: LessonKnowledgePointRelation[] =
  lessonRecords.map((lessonRecord, index) => ({
    id: `G2_PEP_CHINESE_S2_LKP_${String(index + 1).padStart(2, '0')}`,
    lessonId: lessonRecord.id,
    knowledgePointId: knowledgePointRecords[index]?.id ?? '',
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...UNVERIFIED,
  }))

export const gradeTwoChineseLowerKnowledgePrerequisites: KnowledgePrerequisite[] =
  knowledgePointRecords.slice(1).map((knowledgePointRecord, index) => ({
    id: `G2_PEP_CHINESE_S2_PREREQUISITE_${String(index + 1).padStart(2, '0')}`,
    prerequisiteKnowledgePointId: knowledgePointRecords[index]?.id ?? '',
    dependentKnowledgePointId: knowledgePointRecord.id,
    relationType: 'RECOMMENDED',
    sourceId: G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
    status: 'DRAFT',
    ...UNVERIFIED,
  }))

export const gradeTwoChineseLowerCourseContents: CourseContent[] = lessonRows.map(
  ({ definition }, index) => {
    const knowledgePointId = knowledgePointRecords[index]?.id
    const lessonId = lessonRecords[index]?.id
    if (!knowledgePointId || !lessonId)
      throw new Error(`G2_CHINESE_LOWER_LESSON_CONTENT_MISSING:${index}`)

    const title = titleWithBookMarks(definition.title)
    const blocks = [
      { type: 'TEXT' as const, text: `${title}\n\n${definition.text}` },
      ...(definition.includeAppendix
        ? [{ type: 'TEXT' as const, text: gradeTwoChineseLowerAppendix }]
        : []),
      { type: 'TEXT' as const, text: `课后练习：${activityFor(definition)}` },
    ]

    return {
      id: `G2_PEP_CHINESE_S2_CONTENT_${String(index + 1).padStart(2, '0')}`,
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
      sourceId: G2_PEP_CHINESE_S2_CONTENT_SOURCE_ID,
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

export const gradeTwoChineseLowerCurriculum: GradeTwoChineseLowerCurriculumData = {
  grade: gradeTwoChineseLowerGrade,
  semester: gradeTwoChineseLowerSemester,
  subject: gradeTwoChineseLowerSubject,
  sources: gradeTwoChineseLowerSources,
  regions: gradeTwoChineseLowerRegions,
  publishers: gradeTwoChineseLowerPublishers,
  textbooks: gradeTwoChineseLowerTextbooks,
  regionTextbookRelations: gradeTwoChineseLowerRegionTextbookRelations,
  units: unitRecords,
  lessons: gradeTwoChineseLowerLessons,
  knowledgePoints: gradeTwoChineseLowerKnowledgePoints,
  lessonKnowledgePointRelations: gradeTwoChineseLowerLessonKnowledgePointRelations,
  knowledgePrerequisites: gradeTwoChineseLowerKnowledgePrerequisites,
  courseContents: gradeTwoChineseLowerCourseContents,
}
