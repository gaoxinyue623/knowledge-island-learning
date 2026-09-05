import {
  G1_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeOneChineseUpperCurriculum,
  gradeOneChineseUpperKnowledgePoints,
  gradeOneChineseUpperLessons,
} from '@/data/curriculum/grade-1/chinese-pep-upper'
import type {
  Challenge,
  ContentExpansionBundle,
  ExtensionActivity,
  LearningContent,
  LessonContentBlockRecord,
  LessonStep,
  StructuredContent,
} from '@/types'

/**
 * Candidate, self-authored practice for the Grade 1 Chinese local-PDF pilot.
 *
 * The prompts below are new practice copy. They refer to the lesson topic,
 * but do not duplicate the textbook body. They stay in the candidate dataset
 * until the content team has reviewed wording and answer expectations.
 */
export const G1_PEP_CHINESE_S1_ORIGINAL_EXERCISE_SOURCE_ID =
  'G1_PEP_CHINESE_S1_ORIGINAL_EXERCISES_V1'

const generatedAt = '2026-09-04T00:00:00.000Z'
const baseRecord = {
  sourceId: G1_PEP_CHINESE_S1_ORIGINAL_EXERCISE_SOURCE_ID,
  verificationStatus: 'UNVERIFIED' as const,
  isSample: false,
}

interface ExerciseDefinition {
  challengeTitle: string
  challengeInstruction: string
  challengeHint: string
  challengeAnswer: string
  extensionTitle: string
  extensionInstruction: string
  extensionHint: string
  extensionAnswer: string
}

function exercise(
  challengeTitle: string,
  challengeInstruction: string,
  challengeHint: string,
  challengeAnswer: string,
  extensionTitle: string,
  extensionInstruction: string,
  extensionHint: string,
  extensionAnswer: string,
): ExerciseDefinition {
  return {
    challengeTitle,
    challengeInstruction,
    challengeHint,
    challengeAnswer,
    extensionTitle,
    extensionInstruction,
    extensionHint,
    extensionAnswer,
  }
}

const exerciseDefinitions: readonly ExerciseDefinition[] = [
  exercise(
    '阅读理解：我们是谁',
    '读一读：“小雨说：‘我是中国人。’小明说：‘我们都是中国人。’”想一想：“我们”可能包括谁？',
    '先找出说话的人，再想“我们”是不是只指一个人。',
    '“我们”可以包括小雨、小明和其他中国人。',
    '词语练习：我、你、他、人',
    '用“我、你、他、人”任选两个组词，再用其中一个词说一句话。',
    '先说词语，再说句子；例如“我们”“他人”。',
    '示例：我们、他人。我是一年级学生。答案可以不同，只要搭配恰当、句子完整。',
  ),
  exercise(
    '阅读理解：操场上的发现',
    '小宁在操场上看见五星红旗，也看见同学们排着队唱歌。他说：“我爱我们的祖国。”小宁看见了什么？',
    '把人物看到的两样事物找出来，再说说他的感受。',
    '小宁看见了五星红旗和唱歌的同学，他感到亲切、骄傲或喜爱祖国。',
    '词语练习：国、旗、歌、中',
    '用“国、旗、歌、中”任选三个字组词，并把一个词语放进句子里。',
    '可以从“国旗、国歌、中国”里选词，再补充自己的句子。',
    '示例：国旗、国歌、中国。我爱中国。答案可以不同。',
  ),
  exercise(
    '阅读理解：我的上学准备',
    '铃声快响了，小乐把课本、作业本和铅笔放在桌上，坐好等老师。他做了哪两件准备？',
    '先找物品，再找动作；答案要说完整。',
    '他把学习用品准备好，并坐好等待老师上课。',
    '词语练习：学、校、书、包、早',
    '从“学、校、书、包、早”中任选三个字组词，再说一条上学时的好习惯。',
    '例如“学校、书包、早起”；习惯可以和按时、整理、认真有关。',
    '示例：学校、书包、早起。我每天早起，整理好书包再上学。',
  ),
  exercise(
    '阅读理解：语文学习伙伴',
    '小雨先听老师讲故事，再自己读一读，最后把故事讲给同桌听。她用到了哪些语文学习活动？',
    '按事情发生的先后顺序找出“听、读、讲”。',
    '她用到了听故事、读书和讲故事；这三项都属于语文学习。',
    '词语练习：读、写、说、听',
    '用“读、写、说、听”分别说一件学习时会做的事，至少写下两项。',
    '可以想想语文课上的动作：读书、写字、说话、听别人说。',
    '示例：读书、写字、说故事、听老师讲课。只要词语和活动对应即可。',
  ),
  exercise(
    '阅读理解：天、地、人',
    '早晨，天上飘着白云，地上长着小草，小朋友和家人一起散步。短话里写到了哪三类对象？',
    '从天空、地面和身边的人三个方向寻找答案。',
    '写到了天、地、人：白云在天上，小草在地上，小朋友和家人是人。',
    '词语练习：天、地、人、你、我、他',
    '任选三个字组成词语，再用“你、我、他”中的两个字说一句话。',
    '可以试试“天地、地上、他人”等词；句子要说清楚谁做什么。',
    '示例：天地、地上、他人。你和我是同学。答案可以不同。',
  ),
  exercise(
    '阅读理解：自然小分类',
    '小朋友观察到：木桌旁有一盆土，桌上放着金属小勺，旁边还有水杯和一盏灯。他找到了哪些“金木水火土”？',
    '把故事里的物品和五个字一一对应，灯可以联系到“火”。',
    '他找到了木、土、金、水、火这五个字。',
    '词语练习：金、木、水、火、土',
    '把“金、木、水、火、土”分别组一个词，至少完成三个。',
    '可以从身边找词：金色、木头、水杯、火花、土地。',
    '示例：金色、木头、水杯、火花、土地。答案可以换成其他恰当词语。',
  ),
  exercise(
    '阅读理解：身体会做什么',
    '小文用眼睛看图，用耳朵听声音，用手拿笔写字，还用脚走到窗边。请把身体部位和动作连起来。',
    '先圈出四个身体部位，再找每个部位后面的动作。',
    '目—看图，耳—听声音，手—写字，足（脚）—走路。',
    '词语练习：口、耳、目、手、足',
    '任选三个字组词，并用动作演一演其中一个词语的意思。',
    '例如“耳朵、目光、手心、口头、足下”；先组词，再做动作。',
    '示例：耳朵、目光、手心。可以指一指耳朵、眼睛或手来帮助记忆。',
  ),
  exercise(
    '阅读理解：窗外的景物',
    '窗外有一轮月亮，远处有一座山，山脚下有一条小河。请说一说短话里出现了哪些景物。',
    '按照“天上—远处—地面”的顺序找景物。',
    '出现了月、山和川（小河）这些景物。',
    '词语练习：日、月、山、川、水、火、田、禾',
    '从这些字中任选四个组词，再用两个词说一个自然景物短语。',
    '可以试试“日月、山川、水田、禾苗”；两个词放在一起更清楚。',
    '示例：日月、山川、水田、禾苗。我看见山川和水田。',
  ),
  exercise(
    '阅读理解：识字小侦探',
    '小芳在教室里看见“门、口、日”三个字。她发现有的字可以从熟悉的字形和生活中的对象联想到意思。她用了什么识字方法？',
    '想一想：先看字形，再联系真实物品，这就是把字和图景连起来。',
    '她用了看图识字、联系生活识字的方法。',
    '词语练习：已学汉字找朋友',
    '从本单元学过的字中选三个，各组一个词，并说出它们在教室或家里的位置。',
    '词语不必很难，重点是“字—词语—真实位置”三步都说清楚。',
    '示例：日—日历（墙上）；口—门口（教室门边）；水—水杯（桌上）。',
  ),
  exercise(
    '阅读理解：我和图画书',
    '小雨先看图画书的封面，再猜故事内容，读完后发现自己的猜想有一部分猜对了。她的阅读顺序是什么？',
    '按“先……再……读完后……”把过程说完整。',
    '她先看封面，再根据图画猜想，最后阅读并检查自己的猜想。',
    '词语练习：书、读、看、听',
    '用“书、读、看、听”任选三个字组词，再说一句你喜欢的阅读习惯。',
    '可以用“书本、读书、看图、听故事”等词语。',
    '示例：书本、读书、看图、听故事。我每天读一会儿书。',
  ),
  exercise(
    '拼音练习：四声小火车',
    '请依次读 a、o、e 的四声，再说一说读声调时声音有什么变化。',
    '先看清声调符号，再注意声音的高低和变化。',
    '四声读作阴平、阳平、上声、去声；读音时声调有高低变化。',
    '拼音练习：找韵母朋友',
    '从“a、o、e”中选韵母给 b、m、f 找朋友，写出或读出你会拼的两个音节。',
    '把声母放前面、韵母放后面，先慢拼，再连读。',
    '示例：ba、bo、me、fa 等，答案以声母和韵母能正确相拼为准。',
  ),
  exercise(
    '拼音练习：口形和声音',
    '面对镜子读 i、u、ü 的四声，观察嘴形有什么不同，再选一个音读给家人听。',
    '先看口形，再发音；ü 的嘴形像吹口哨，不能把它读成 u。',
    'i、u、ü 的口形和声音不同；练习时要看清字母并读准声调。',
    '拼音练习：声母韵母配对',
    '用 i、u、ü 和 b、m、f 试着拼两个音节，并圈出你最有把握的一个。',
    '可以先试试 bi、bu、mi、mu、fu；ü 与哪些声母相拼要特别看清规则。',
    '示例：bi、bu、mi、mu、fu。只要拼读关系正确即可。',
  ),
  exercise(
    '拼音练习：b 和 p 的小纸条',
    '把一小条纸放在嘴前，分别读 b 和 p，观察纸条的变化，再说说哪个音的气流更明显。',
    '轻轻读 b，再用力读 p，比较送气的感觉。',
    '通常读 p 时送出的气流更明显，b 的气流相对较弱；要以实际发音体验为准。',
    '拼音练习：拼出小音节',
    '用 b、p、m、f 和 a、o、i、u 任选声母、韵母，拼读三个音节。',
    '先分读声母和韵母，再把两个音连起来。',
    '示例：ba、pa、ma、fo、mi、fu 等，答案以能准确拼读为准。',
  ),
  exercise(
    '拼音练习：听一听 d 和 t',
    '请家人读两个以 d 或 t 开头的音节，你判断每个音节的第一个声母，并说出判断理由。',
    '注意开头的气流和舌位，不要只看字母。',
    '先听音节开头，再根据 d、t 的发音特点判断；能说清“我听到的是……”即可。',
    '拼音练习：声母接力',
    '用 d、t、n、l 分别和 a、i、u 试着拼读，选择两个读得最顺的音节。',
    '声母在前、韵母在后；读完一个再读下一个。',
    '示例：da、di、tu、na、li 等，答案以拼读准确为准。',
  ),
  exercise(
    '拼音练习：看清—慢拼—连读',
    '请任选三个已经学过的音节，按“看清声母和韵母—慢拼—连读”的步骤读一遍。',
    '可以把三步说出来，再开始读；读错时回到第一步。',
    '正确步骤是先看清，再慢慢拼读，最后连贯地读出完整音节。',
    '拼音练习：生活里的音节',
    '在姓名、课表或教室物品中找两个能用已学拼音帮助认读的词，写出音节或请家人帮你记录。',
    '先找熟悉的词，再听清每个音节；不会写的可以口头读。',
    '答案因孩子找到的词不同而不同，重点是能尝试用拼音帮助认读。',
  ),
  exercise(
    '拼音练习：g、k、h 来排队',
    '听家人读三个音节，判断它们开头是 g、k 还是 h，并把三个声母按听到的顺序写下来。',
    '关注音节最前面的声音，先听再写。',
    '答案取决于家人读的音节；判断时要只记录音节开头的 g、k 或 h。',
    '拼音练习：拼读小桥',
    '用 g、k、h 分别和 a、e、u 试着拼读三个音节，再选一个放进词语或短句中。',
    '例如先拼 ga、ke、hu，再想想哪个音节能帮助你认读熟悉的词。',
    '示例：ga、ke、hu；能准确拼读并尝试运用即可。',
  ),
  exercise(
    '拼音练习：j、q、x 和 ü',
    '把 j、q、x 分别和 ü 组合，读一读并观察书写时 ü 的两点有什么变化。',
    '先读音，再看字形；想一想“鱼”的 ü 音在拼写中怎样表示。',
    'j、q、x 与 ü 相拼时，ü 上面的两点要去掉，但仍读 ü 的音。',
    '拼音练习：规则小老师',
    '请你用一句话向同伴讲清楚 j、q、x 和 ü 相拼的规则，再举一个例子。',
    '可以用“遇到……，两点……”的句式。',
    '示例：j、q、x 遇到 ü，两点要去掉；如 ju、qu、xu。',
  ),
  exercise(
    '拼音练习：平舌音小听众',
    '把 z、c、s 放在三张卡片上，请家人读三个开头音，你把听到的音放到正确卡片旁。',
    '平舌音发音时舌头位置靠前，先听清开头再分类。',
    '每个音要根据实际听到的开头分别归入 z、c 或 s；能正确分类即可。',
    '拼音练习：声母组词卡',
    '用 z、c、s 各拼一个熟悉音节，读给家人听，并说说哪个音最容易混淆。',
    '可以从 za、ci、si 等简单音节开始，慢慢连读。',
    '答案因选择的音节不同而不同，重点是能准确区分并说明困难。',
  ),
  exercise(
    '拼音练习：平舌音和翘舌音',
    '轮流读 z—zh、c—ch、s—sh，听一听每组声音哪里不同，并选一组读给家人听。',
    '先听舌头位置和声音，再比较同一组的两个声母。',
    'z、c、s 是平舌音，zh、ch、sh 是翘舌音；两组发音位置不同。',
    '拼音练习：绕口令慢练',
    '把含有 z、c、s、zh、ch、sh 的音节分成两组，先慢读，再逐渐读连贯。',
    '准确比速度重要；读不清时把每个音节拆开重来。',
    '答案是能清楚读出两组音节，并能说出它们分别属于平舌音或翘舌音。',
  ),
  exercise(
    '拼音练习：y、w 小桥',
    '观察 y、w 放在音节前面的样子，任选两个音节读一读，并说说它们像什么作用。',
    '把 y、w 想成连接声音的小桥，关注它们怎样帮助开头发音。',
    'y、w 可以帮助连接或引出音节；具体读音要结合后面的韵母练习。',
    '拼音练习：音节接龙',
    '用 y 或 w 开头说出两个你会读的音节，再请家人接着说一个同类音节。',
    '先选自己有把握的音节，如 ya、yi、wu 等。',
    '示例：ya、yi、wu；答案可以不同，只要读音准确。',
  ),
  exercise(
    '拼音练习：声母分类站',
    '把 z、c、s、zh、ch、sh、r 分到“平舌音”和“翘舌音”两站，并读出每一站的卡片。',
    '先回忆舌头位置，再分类；r 和 zh、ch、sh 放在翘舌音一站。',
    '平舌音：z、c、s；翘舌音：zh、ch、sh、r。',
    '拼音练习：看图拼读三步法',
    '找一幅生活图片，选出三个物品名称，尝试用“看图—想词—拼音”三步读出来。',
    '先说出物品的汉语词，再找自己会读的音节，不会的可以请家人提示。',
    '答案随图片而变，重点是能从图画找到词语并尝试拼读。',
  ),
  exercise(
    '拼音练习：复韵母会滑行',
    '慢慢读 ai、ei、ui，注意口形和声音从前一个位置滑到后一个位置，再说出一个自己的感受。',
    '不要把两个字母读成两个分开的音，要把声音连起来。',
    '复韵母要连贯发音，口形和声音会从前一个音滑向后一个音。',
    '拼音练习：复韵母找朋友',
    '从生活词语中找一个含 ai、ei 或 ui 的音节，写下或读给家人听。',
    '可以先从自己熟悉的词语开始，找准韵母再拼读。',
    '答案因词语不同而不同，重点是能找出复韵母并准确读出。',
  ),
  exercise(
    '拼音练习：ao、ou、iu 听音',
    '请家人读 ai、ao、ou、iu 中的两个音，你听后指出是哪两个，并说说你依据的声音变化。',
    '注意声音滑动的方向，不要只凭字母外形猜。',
    '能根据声音变化听辨出复韵母，并说出自己听到的组合即可。',
    '拼音练习：拼读小词语',
    '用 ao、ou、iu 各找一个声母拼读，任选一个音节放进你知道的词语里。',
    '先拼读，再想词；不会组词时只读准确音节也可以。',
    '答案因选择的声母和词语不同而不同，重点是复韵母读得连贯。',
  ),
  exercise(
    '拼音练习：ie、üe、er 三兄弟',
    '读 ie、üe、er，给它们排成三张卡片，并说说哪一个韵母的发音或规则最特别。',
    'üe 要关注两点规则，er 要关注它的特殊发音。',
    'ie、üe 是复韵母，er 是特殊韵母；üe 与 j、q、x 相拼时两点要去掉。',
    '拼音练习：规则举例',
    '任选 ie、üe、er 中的一个，写出或读出一个相关音节，再把它读给家人听。',
    '先确认声母和韵母，再慢拼、连读；涉及 üe 时检查两点规则。',
    '答案因音节不同而不同，重点是读准韵母并正确使用规则。',
  ),
  exercise(
    '拼音练习：前鼻音辨一辨',
    '读 an、en、in、un、ün，注意声音结尾的鼻音，再从中选两个说出它们的共同点。',
    '把注意力放在韵母最后的 n 音上。',
    '它们都是前鼻韵母，结尾有 n 的鼻音；具体声母和声调还要分别读准。',
    '拼音练习：前鼻韵母拼读',
    '用 an、en、in、un、ün 中的两个韵母和熟悉声母拼读音节，读完说出韵母名称。',
    '先找出韵母，再读声母和韵母的合音。',
    '答案因选择不同而不同，重点是能认出并读准前鼻韵母。',
  ),
  exercise(
    '拼音练习：前鼻音和后鼻音',
    '把 an、en、in、un、ün 与 ang、eng、ing、ong 分成两组，再任选一组读一遍。',
    '看清韵母结尾是 n 还是 ng，再进行分类。',
    'an、en、in、un、ün 是前鼻韵母；ang、eng、ing、ong 是后鼻韵母。',
    '拼音练习：鼻韵母小调查',
    '在你会读的词语里找一个前鼻韵母和一个后鼻韵母，记录它们并比较结尾声音。',
    '不会写音节时，可以请家人写下来，你负责朗读和比较。',
    '答案因词语不同而不同，重点是能辨认 n、ng 两种结尾。',
  ),
  exercise(
    '拼音练习：韵母小岛',
    '把 a、ai、an、ang 分别送到“单韵母、复韵母、前鼻韵母、后鼻韵母”四座小岛。',
    '看字母数量和结尾音：一个元音、滑动发音、n 结尾、ng 结尾。',
    'a 是单韵母，ai 是复韵母，an 是前鼻韵母，ang 是后鼻韵母。',
    '拼音练习：综合拼读',
    '任选三个已经学过的韵母，分别找声母拼读，再给其中一个音节标上你听到的声调。',
    '按“找韵母—配声母—读声调”的顺序完成。',
    '答案因选择不同而不同，重点是分类正确、拼读清楚、声调读准。',
  ),
  exercise(
    '阅读理解：秋天的信号',
    '秋风吹来，树叶慢慢变黄并落下，大雁排着队向南飞。短文写了秋天的哪两个变化？',
    '从树叶和大雁两个对象分别找变化。',
    '树叶变黄、落下；大雁向南飞，还会变换队形。',
    '字词练习：秋、天、树、叶、飞',
    '给“秋、天、树、叶、飞”任选三个字组词，再用一个词说说秋天。',
    '可以试试“秋天、树叶、飞鸟”；句子要和秋天有关。',
    '示例：秋天、树叶、飞鸟。秋天到了，树叶变黄了。',
  ),
  exercise(
    '阅读理解：江南画面',
    '小船来到水面，荷叶一片挨着一片，小鱼在荷叶东边、西边游动。画面中有哪些景物和动物？',
    '先找静静的景物，再找会游动的动物。',
    '画面中有水面、荷叶、小船和小鱼；小鱼在荷叶周围游动。',
    '字词练习：江、南、莲、鱼、东、西',
    '从“江、南、莲、鱼、东、西”中选四个组词，再用“东”或“西”说一个位置。',
    '可以用“江南、莲花、小鱼、东西”；位置要说清楚谁在哪里。',
    '示例：江南、莲花、小鱼。小鱼游到荷叶东边。',
  ),
  exercise(
    '阅读理解：脚印找主人',
    '雪地上留下了几种不同的脚印：像竹叶的、像梅花的、像枫叶的、像月牙的。你能说出这些脚印可能是谁留下的吗？',
    '把脚印的样子和动物的脚联系起来，再逐一配对。',
    '可能是小鸡、小狗、小鸭和小马留下的；配对顺序要和脚印样子对应。',
    '字词练习：雪、地、画、笔、步',
    '用“雪、地、画、笔、步”任选三个字组词，再说一句你在雪地里会做什么。',
    '可以试试“雪地、画画、画笔、几步”；句子可以写游戏或观察。',
    '示例：雪地、画画、画笔。我会在雪地里观察脚印。',
  ),
  exercise(
    '阅读理解：四季小档案',
    '草芽、荷叶、谷穗和雪人分别来介绍自己。请把它们和春、夏、秋、冬连起来。',
    '先看每个景物最像哪个季节，再按一年中的顺序检查。',
    '草芽—春天，荷叶—夏天，谷穗—秋天，雪人—冬天。',
    '表达练习：我喜欢的季节',
    '选择一个季节，用“我是____，我喜欢____”说一句话，再补充一个这个季节的景物。',
    '先选季节，再想一个看得见、摸得着的景物。',
    '示例：我是夏天，我喜欢荷叶；夏天还有知了。答案可以不同。',
  ),
  exercise(
    '阅读理解：给季节找朋友',
    '小文把“花开、知了、落叶、雪人”四张卡片混在一起。请帮他按季节分组，并说说你最喜欢哪一组。',
    '想一想这些景物分别在什么季节常见，再按春夏秋冬整理。',
    '花开—春天，知了—夏天，落叶—秋天，雪人—冬天；喜欢哪一组可以自由表达。',
    '词语练习：反义词小发现',
    '从“南北、男女、开关、正反、先后、内外”中任选三组读一读，说说每组词语有什么共同特点。',
    '每一组都是意思相对或相反的词，先读清楚，再找关系。',
    '这些词语都是成对的对应词或反义词，如“开”和“关”意思相反。',
  ),
  exercise(
    '阅读理解：对韵找对应',
    '读一读“云对雨、花对树、鸟对虫”，想一想每一对词语有什么相同或相对的地方。',
    '观察词语所属的对象和它们在句子中的位置。',
    '每一对词语都能相互对应，读起来节奏整齐；有的属于相近场景或相对关系。',
    '词语练习：我来编一对',
    '仿照“山清对水秀”，从身边选两个景物词，试着说一组“____对____”。',
    '两个词最好都是景物或自然事物，读起来要顺口。',
    '示例：天高对云淡、花红对柳绿。答案可以不同，重点是词语类别相近、表达通顺。',
  ),
  exercise(
    '阅读理解：熟字合成新字',
    '“日”和“月”合在一起可以组成“明”，“小”和“大”合在一起可以组成“尖”。这种识字方法有什么特点？',
    '观察新字由哪些熟字组成，再想新字的意思。',
    '它把熟悉的字组合起来帮助认识新字，可以从字形和字义两方面猜想。',
    '字词练习：会意字小拼图',
    '用“木、木、木”和“人、人、人”分别拼一拼，写出你知道的新字或相关词语。',
    '可以回想“林、森、从、众”等字，再说说它们由什么组成。',
    '示例：两个木是“林”，三个木是“森”；两个或多个人还能组成“从、众”等字。',
  ),
  exercise(
    '阅读理解：书包里的顺序',
    '小安把课本、作业本、铅笔和转笔刀放进书包，第二天早上背好书包去学校。短话写了哪些学习用品？',
    '逐个找出物品名称，不要把“书包”这个总名称漏掉。',
    '写了书包、课本、作业本、铅笔和转笔刀等学习用品。',
    '字词练习：学习用品组词',
    '用“包、尺、作、业、笔、刀、早、课”任选五个字组词，再说一个整理书包的动作。',
    '可以试试“书包、尺子、作业、铅笔、转笔刀、早起、上课”。',
    '示例：书包、尺子、作业、铅笔、早起。我会把文具摆放整齐。',
  ),
  exercise(
    '阅读理解：升旗时的动作',
    '校园里开始升旗，同学们先面向国旗站好，再看着国旗升起，最后行礼。请按顺序说出三个动作。',
    '找出“先、再、最后”后面的动作，按时间顺序回答。',
    '先站好，再看国旗升起，最后行礼。',
    '词语练习：中、国、旗、声、起、立、正',
    '从这些字中任选四个组词，再用“立正”或“国旗”说一句完整的话。',
    '可以用“中国、国旗、声音、升起、立正”等词语。',
    '示例：中国、国旗、升起、立正。升旗时我们要立正。',
  ),
  exercise(
    '阅读理解：校园词语分类',
    '请把“学校、老师、同学、书包、国旗”分成“人物、地点、物品”三类，并说出你的分法。',
    '先问“谁、哪里、什么”，再把词语放到对应类别。',
    '人物：老师、同学；地点：学校；物品：书包、国旗。',
    '词语练习：谁、什么、哪里',
    '看一看教室，用“谁、什么、哪里”各提出一个问题，再回答其中一个。',
    '例如“谁在读书？什么在桌上？哪里是图书角？”',
    '示例：谁在读书？小华在读书。答案可以根据现场变化。',
  ),
  exercise(
    '阅读理解：月亮船上的景色',
    '小朋友坐在弯弯的月亮船里，抬头看见闪闪的星星和蓝蓝的天空。她看见了哪些景物？',
    '从“坐在哪里”和“抬头看见什么”两个位置找答案。',
    '她看见了弯弯的月亮（小船）、闪闪的星星和蓝蓝的天空。',
    '词语练习：照样子说一说',
    '仿照“弯弯的月儿”，用“____的____”说出两个身边的景物。',
    '先选一个表示样子的词，再配一个真实景物，如“长长的铅笔”。',
    '示例：圆圆的太阳、长长的小路。答案可以不同，搭配要合理。',
  ),
  exercise(
    '阅读理解：影子在哪里',
    '小乐在阳光下向前走，影子跟着他；他转身向左看，影子也换了位置。影子和谁一起出现？',
    '想一想影子要出现需要什么，再结合故事找答案。',
    '影子和小乐（以及光照下的物体）一起出现；影子会随光线和位置变化。',
    '词语练习：前、后、左、右',
    '请用“前、后、左、右”中的两个词介绍你身边的同学或物品位置。',
    '先站在一个固定位置，再观察四个方向，句子要说清楚参照物。',
    '示例：我的前面是黑板，右边是书包。答案会因位置不同而不同。',
  ),
  exercise(
    '阅读理解：两件宝的分工',
    '小刚先动脑想办法，再用双手把积木搭好。这个故事说明双手和大脑分别有什么用？',
    '把“想办法”和“搭积木”分别对应到大脑、双手。',
    '大脑会思考、想办法，双手会做工；动手又动脑才能把事情做好。',
    '表达练习：动手又动脑',
    '选择一件小任务，说说你要先用脑子想什么，再用双手做什么。',
    '可以选择整理书包、画画、搭积木等熟悉的任务。',
    '示例：整理书包时，我先想好分类，再用双手把文具放整齐。',
  ),
  exercise(
    '阅读理解：按顺序讲故事',
    '小雨先找到一本书，再坐到阅读角读书，最后把喜欢的地方讲给同学听。请用“先、再、最后”复述这件事。',
    '三个连接词后面各放一个动作，不能把顺序打乱。',
    '先找到书，再坐到阅读角读书，最后把喜欢的地方讲给同学听。',
    '词语练习：家人称呼',
    '从“爷爷、奶奶、爸爸、妈妈、哥哥、姐姐、弟弟、妹妹”中任选四个读一读，再说一句介绍家人的话。',
    '可以先按长辈和同辈分类，再选择人物介绍。',
    '示例：爷爷、奶奶、哥哥、妹妹。这是我的妹妹，她喜欢画画。',
  ),
  exercise(
    '阅读理解：动物尾巴大比拼',
    '猴子的尾巴长，兔子的尾巴短，松鼠的尾巴像一把伞。请说出三种动物尾巴的不同特点。',
    '答案要分别对应猴子、兔子和松鼠，不要只说“都不一样”。',
    '猴子的尾巴长，兔子的尾巴短，松鼠的尾巴像一把伞。',
    '词语练习：比一比',
    '选两种身边的物品，用“长、短、大、小、弯、直”中的词说一说它们的特点。',
    '先观察，再选择最准确的比较词；可以用“比……更……”的句式。',
    '示例：铅笔比橡皮长，书本比卡片大。答案因物品不同而不同。',
  ),
  exercise(
    '阅读理解：乌鸦的办法',
    '乌鸦发现瓶口小、水不多，开始喝不到水。后来它做了什么，水又发生了什么变化？',
    '按“遇到问题—想到办法—结果变化”三个部分回答。',
    '它把小石子一颗一颗放进瓶子里，水面渐渐升高，于是喝到了水。',
    '表达练习：我的小办法',
    '想一件生活中的小困难，用“我遇到……，我可以……”说出一个解决办法。',
    '困难可以是找不到文具、书本太乱或水杯够不着等安全的小事情。',
    '示例：我遇到书包很乱，我可以先分类，再把物品放回原位。',
  ),
  exercise(
    '阅读理解：雨点带来的变化',
    '雨点落下后，有花有草的地方变得更有生气，原来没有花草的地方也出现了新的绿色。雨点带来了什么变化？',
    '比较下雨前后的两个地方，分别说出变化。',
    '有花有草的地方花更红、草更绿；没有花草的地方开出红花、长出绿草。',
    '字词练习：花、草、雨、点、方、答',
    '用“花、草、雨、点、方、答”任选四个字组词，再用“因为……所以……”说一句话。',
    '可以用“雨点、花草、地方、回答”等词，先说原因再说结果。',
    '示例：雨点、花草、地方、回答。因为下雨了，所以花草更有生气。',
  ),
  exercise(
    '阅读理解：综合阅读小任务',
    '小朋友看到一幅校园图：树下有同学读书，桌上有书本，远处有一面旗。他先观察，再说了两句话。请你也说出图中的三个信息。',
    '可以从人物、物品、地点或颜色中各找一个信息。',
    '示例：同学在读书，桌上有书本，远处有一面旗；答案可以根据图片或自己的观察变化。',
    '词语练习：本册词语小花园',
    '从本册学过的词语中选六个，按“人物、景物、动作”分成三组，并读给家人听。',
    '每组至少放两个词，分类时说出你为什么这样分。',
    '示例：人物：同学、老师；景物：月亮、树叶；动作：读书、回答。答案可以不同。',
  ),
]

function structured(...blocks: StructuredContent['blocks']): StructuredContent {
  return { blocks }
}

function learningContent(
  lessonId: string,
  knowledgePointId: string,
  title: string,
  learningGoals: string[],
): LearningContent {
  const firstBlock: LessonContentBlockRecord = {
    id: `${knowledgePointId}:candidate-exercises:intro`,
    block: { type: 'TEXT', text: '先读上方的本地 PDF 课文原文，再用自己的话说一说发现。' },
    stepType: 'intro',
    title: '先读课文',
    sort: 1,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  }
  const secondBlock: LessonContentBlockRecord = {
    id: `${knowledgePointId}:candidate-exercises:practice`,
    block: { type: 'TEXT', text: '下面有两项项目原创练习：阅读理解和字词或拼音练习。' },
    stepType: 'practice',
    title: '再练一练',
    sort: 2,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
  }
  const steps: LessonStep[] = [
    {
      id: `${firstBlock.id}:step`,
      type: 'intro',
      title: firstBlock.title,
      contentBlockIds: [firstBlock.id],
      required: true,
      sort: 1,
    },
    {
      id: `${secondBlock.id}:step`,
      type: 'practice',
      title: secondBlock.title,
      contentBlockIds: [secondBlock.id],
      required: true,
      sort: 2,
    },
  ]
  return {
    id: `${knowledgePointId}:candidate-exercises:learning-content:v1`,
    lessonId,
    knowledgePointId,
    title,
    learningGoals: [...learningGoals],
    steps,
    blocks: [firstBlock, secondBlock],
    sourceId: G1_PEP_CHINESE_S1_ORIGINAL_EXERCISE_SOURCE_ID,
    status: 'AI_GENERATED',
    currentVersion: 1,
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    contentStatus: 'AI_GENERATED',
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }
}

function extensionActivity(
  id: string,
  knowledgePointId: string,
  definition: ExerciseDefinition,
): ExtensionActivity {
  return {
    id,
    knowledgePointId,
    title: definition.extensionTitle,
    instruction: definition.extensionInstruction,
    content: structured({ type: 'hint', value: definition.extensionHint }),
    referenceAnswer: definition.extensionAnswer,
    ...baseRecord,
  }
}

function challenge(
  id: string,
  knowledgePointId: string,
  definition: ExerciseDefinition,
): Challenge {
  return {
    id,
    knowledgePointId,
    title: definition.challengeTitle,
    instruction: definition.challengeInstruction,
    content: structured({ type: 'hint', value: definition.challengeHint }),
    referenceAnswer: definition.challengeAnswer,
    ...baseRecord,
  }
}

if (exerciseDefinitions.length !== 45) {
  throw new Error(`G1_CHINESE_EXERCISE_DEFINITION_COUNT:${exerciseDefinitions.length}`)
}

export const candidateContentExpansionBundles: readonly ContentExpansionBundle[] =
  gradeOneChineseUpperLessons.map((lesson, index) => {
    const knowledgePoint = gradeOneChineseUpperKnowledgePoints[index]
    const definition = exerciseDefinitions[index]
    if (!knowledgePoint || !definition) {
      throw new Error(`G1_CHINESE_EXERCISE_CONTEXT_MISSING:${index + 1}`)
    }
    const unit = gradeOneChineseUpperCurriculum.units.find((item) => item.id === lesson.unitId)
    if (!unit) throw new Error(`G1_CHINESE_EXERCISE_UNIT_MISSING:${lesson.unitId}`)

    return {
      knowledgePointId: knowledgePoint.id,
      textbookId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
      unitId: unit.id,
      lessonId: lesson.id,
      learningContent: learningContent(
        lesson.id,
        knowledgePoint.id,
        lesson.title,
        knowledgePoint.learningObjective,
      ),
      activities: [],
      exerciseTemplates: [],
      practiceSets: [],
      extensionActivities: [
        extensionActivity(
          `${knowledgePoint.id}:CANDIDATE_EXTENSION_01`,
          knowledgePoint.id,
          definition,
        ),
      ],
      challenges: [
        challenge(`${knowledgePoint.id}:CANDIDATE_CHALLENGE_01`, knowledgePoint.id, definition),
      ],
    }
  })
