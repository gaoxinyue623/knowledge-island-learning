# 知识岛｜小学语数英闯关学习 App

> 本文档是项目当前阶段的唯一产品架构事实源。本文同时区分目标产品、设计决策和已验证实现；未特别标注的目标能力不应被理解为已经实现。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 产品名称 | 知识岛（暂定） |
| 产品定位 | 课本同步 + 游戏闯关 + 课外拓展的小学语数英学习平台 |
| 当前阶段 | PHASE 16.4：MVP Release Gate / Final Verification |
| 文档状态 | 产品事实源；PHASE 7～15 与 PHASE 16 工程门禁已实现，Parent Dashboard 是只读报告层；当前没有可发布的真实 Curriculum Scope 条目，Golden Sample Framework、Demo Lesson、Demo Questions、Demo Mastery、Demo Strategy、PHASE 12～15 Demo records 仍受未核验 / SAMPLE 闸门保护 |
| 版本 | 0.1 |
| 日期 | 2026-09-03 |
| 当前事实源 | 用户提供的产品总 Prompt、PHASE 2.1 / 2.2 数据与课程文档、PHASE 3 / 3.1 设计文档，以及 PHASE 4 工程基础 |
| 产品负责人 | 待确定 |
| 工程状态 | Vue 3 + TypeScript + Vite 工程、课程 Mock 数据管线、教材解析、档案持久化、导入验证与审核闸门，以及 Knowledge Island / LearningMap 地图、LessonPlayer 步骤、Question Engine、Assessment Session、结构化题目渲染、确定性判题、会话恢复、地图回链、LearningEvidence、MasteryRecord、确定性 Mastery Engine、只读 Learning Strategy、Learning History、WrongBook、Review Queue、Reward / Growth / Achievement、Home / Daily Plan 本地投影、只读 ParentReport / Parent Dashboard、PHASE 16 生产 Scope / Source Manifest / production index / readiness validator / release gate 已创建；当前发布决定为 `NOT_READY`，AI Learning Path、复习排程与其他自适应算法仍未实现 |

---

## 1. 产品结论

知识岛是一款面向小学 1～6 年级学生的闯关式学习产品。它把课本知识组织成“世界 → 单元地图 → 关卡 → 知识点”，让学生在较短的学习 session 中完成：

> 进入地图 → 学习知识 → 互动练习 → 挑战关卡 → 获得反馈与奖励 → 解锁下一关或复习薄弱点

产品的核心不是题目数量或游戏时长，而是让学生在明确的学习目标下完成可理解、可反馈、可复习的学习闭环。游戏机制只用于帮助学生进入学习、保持注意、理解反馈和形成持续习惯。

### 1.1 产品目标

1. 让学生在打开产品后约 3 秒内知道今天要完成什么。
2. 让学生在约 10 秒内进入一个明确的学习关卡。
3. 让学生在约 30 秒内完成第一次互动，而不是先浏览复杂的功能入口。
4. 将课本内容、知识点、练习题和闯关进度建立稳定关联。
5. 用错题、知识掌握度和复习提醒形成学习后的强化闭环。
6. 让家长能看懂孩子的学习时间、学科进展和薄弱知识点。

### 1.2 非目标与明确排除

以下内容不属于本阶段，也不应被误写成已实现能力：

- 不一次性开发 1～6 年级的完整课程库。
- 不在 PHASE 1 创建 Vue、React 或其他前端代码。
- 不凭模型记忆批量生成或发布教材原文。
- 不把课外拓展内容与课本同步内容混为一类。
- 不建设面向全国学生的大型竞争排行榜。
- 不通过付费购买学习优势、题目答案或进度捷径。
- 不直接复制任何现有商业角色、游戏或教育平台的 IP、界面和素材。
- 不把“未来可扩展微信小程序 / App”当成当前已支持的平台。

---

## 2. 用户与使用场景

### 2.1 学生：主要使用者

| 维度 | 定义 |
| --- | --- |
| 年龄与年级 | 小学 1～6 年级；首个 MVP 聚焦三年级上册 |
| 主要任务 | 找到今天要学的内容，完成一段 5～10 分钟的学习与练习 |
| 关键需求 | 知道自己在哪、下一步是什么、答错后怎么改、完成后得到什么反馈 |
| 主要障碍 | 长文本、复杂导航、连续失败、任务不清楚、不同教材版本混淆 |
| 产品响应 | 地图节点化、单步互动、短 session、鼓励式反馈、可重复挑战 |

### 2.2 家长：陪伴与观察者

| 维度 | 定义 |
| --- | --- |
| 主要任务 | 查看学习时间、学科情况、掌握率、错题与本周趋势 |
| 关键需求 | 信息准确、结论易懂、能识别薄弱点，不被游戏化数据误导 |
| 产品响应 | 家长中心、周报、学科趋势、薄弱知识点和强项知识点摘要 |

### 2.3 内容审核者：内容质量责任人

内容审核者可以是教师、教研人员或经授权的内容运营人员。该角色不是学生端主导航的一部分，但对内容发布负责：

- 核对教材版本、单元、课文或知识点来源。
- 审核 AI 生成或人工编写的课程内容与题目。
- 记录 `reviewedBy`、`verifiedAt`、`source` 和审核结论。
- 只有通过人工核验的内容才能进入发布状态。

### 2.4 关键使用场景

1. 学生放学后打开首页，直接进入系统推荐的今日任务。
2. 学生从学科岛进入当前单元地图，完成一个教学关、练习关或挑战关。
3. 学生答错后查看提示、再次挑战，并在错题本中复习。
4. 学生通过星星、金币、装扮和宠物成长获得长期激励。
5. 家长周末查看本周报告，了解孩子真正掌握和需要加强的知识点。

---

## 3. 产品原则与设计约束

### 3.1 学习优先

所有游戏机制必须服务于理解、练习、反馈、复习或习惯养成。动画、奖励和竞争不能遮挡题目、延长不必要的使用时长，或替代知识讲解。

### 3.2 内容结构化

知识内容、题目、关卡和进度必须以结构化数据表达。页面只负责呈现和交互，不把大量课程文本或题目硬编码在组件中。

### 3.3 课本与拓展分层

每条学习内容必须明确 `contentType`：

| 值 | 含义 | 展示要求 |
| --- | --- | --- |
| `TEXTBOOK` | 与指定教材版本同步的内容 | 显示教材版本、年级、学期、单元和课次关联 |
| `EXTENSION` | 课外知识、生活应用或思维拓展 | 与课本内容视觉和数据上可区分 |
| `REVIEW` | 针对已学内容的复习 | 说明复习来源与关联知识点 |
| `CHALLENGE` | 在已学基础上的综合挑战 | 不伪装为教材原文，不降低内容来源透明度 |

### 3.4 内容可追溯与可核验

无法确认的教材原文、页码、题目或知识点归属必须标记 `needsVerification: true`，不能凭模型记忆填充为确定事实。AI 生成内容的默认状态为 `AI_GENERATED`，不能直接变为 `PUBLISHED`。

### 3.5 低压力与可恢复

错误反馈采用“差一点，再试一次”等鼓励式表达，并提供知识提示或重新讲解。连续错误时优先降低一次任务难度、展示分步提示或引导复习，不用羞辱性或惩罚性文案。

### 3.6 公平成长

学习获得的 XP、金币、星星和装扮不得改变学习难度、题目公平性或解锁知识的必要条件。金币只用于角色、宠物和地图装饰。

### 3.7 儿童友好交互

按钮使用大触达区域、清晰动词和单一主操作。界面禁止直接使用 Emoji 作为产品图标，统一通过 `AppIcon` 与 Lucide 或自定义 SVG 图标表达。

---

## 4. 信息架构

### 4.1 内容层级

课程内容的权威层级如下，层级之间必须保留明确关联，不能把年级或教材版本隐含在页面状态中：

```text
年级 Grade
  └─ 学期 Semester
      └─ 学科 Subject
          └─ 教材版本 TextbookVersion
              └─ 单元 Unit
                  └─ 课次 Lesson
                      └─ 知识点 KnowledgePoint
                          └─ 内容 CourseContent
                              └─ 题目 Question
```

说明：闯关地图是学习体验层的投影，不替代上面的课程内容层级。一个地图节点可以关联一个或多个教学内容，但不能通过节点名称推断教材事实。

地区不属于课程内容父级。地区与教材的适用关系单独表达为：

```text
Region
  └─ RegionTextbookRelation
      └─ TextbookVersion
```

教材版本继续关联 `gradeId`、`semesterId` 和 `subjectId`；禁止设计成 `Region → Grade → KnowledgePoint`。

### 4.2 学生端产品结构

```text
知识岛
├─ 首页 Home
│  ├─ 学生信息与当前年级
│  ├─ 今日学习目标
│  ├─ 语文岛 / 数学岛 / 英语岛
│  └─ 连续学习、星星、金币
├─ 学习地图 Map
│  ├─ 学科地图
│  ├─ 单元主题
│  ├─ 关卡节点
│  └─ 宝箱 / Boss 挑战
├─ 每日任务 Tasks
│  ├─ 学科任务
│  ├─ 错题复习任务
│  └─ 今日完成情况
├─ 错题本 Wrong Book
│  ├─ 按学科筛选
│  ├─ 按知识点筛选
│  ├─ 错题详情与解析
│  └─ 再次挑战
├─ 我的 Profile
│  ├─ 角色与装扮
│  ├─ 宠物
│  ├─ 成就
│  ├─ 学习记录
│  └─ 有限范围的个人 / 好友排行
└─ 家长中心 Parent
   ├─ 学习时间
   ├─ 三科趋势
   ├─ 掌握率
   ├─ 薄弱与强项知识点
   └─ 本周学习报告
```

### 4.3 导航策略

| 设备 | 主要导航 | 地图布局 |
| --- | --- | --- |
| Desktop（≥1200px） | 侧边栏 + 顶部学生信息栏 | 横向大地图，展示单元与节点关系 |
| Tablet（768～1199px） | 紧凑侧边栏或折叠菜单 + 顶部栏 | 可缩放地图，保持节点可触达 |
| Mobile（<768px） | 底部导航：首页、地图、任务、错题本、我的 | 纵向闯关地图，当前节点优先展示 |

页面不应让学生先进入传统后台式的课程列表。课程列表或筛选器只能作为地图的辅助浏览方式。

### 4.4 首次课程选择

学生首次使用时，必须先选择所在地区，再结合年级和学期，通过已核验的地区教材关系确定或推荐教材版本。首次配置是一段轻量游戏开场，不是后台表单或传统三级 Cascader：

```text
WelcomeOnboarding
  ↓
RegionSelect：你在哪里学习？
  ↓
GradeSelect：你现在几年级？
  ↓
resolveAvailableTextbooks(regionId, gradeId, semesterId)
  ↓
TextbookConfirm：分别确认语文 / 数学 / 英语
  ↓
CharacterSetup：选择你的知识团子
  ↓
OnboardingComplete
  ↓
StudentCurriculumProfile
  ↓
进入 Knowledge Island
```

地区回答“在哪里学习”，出版社表示“谁出版”，教材版本表示“使用哪套课本”。页面文案必须使用“所在地区”“确认一下你的课本”，禁止写成“选择地区：人教版”。RegionSelect 推荐搜索、最近 / 推荐地区、省份列表和真实存在时的城市列表；MVP 只支持省级时不显示城市能力。Desktop 可双栏，Mobile 采用逐级选择。

语文、数学和英语必须分别保存教材版本，不能用一个 `textbookVersionId` 代表三科。某学科只有一个有效 `DEFAULT` 时可以自动推荐，但仍保留用户确认动作；存在多个 `SUPPORTED` / `OPTIONAL` 版本时必须让学生或家长确认；没有 `DEFAULT` 或没有候选时允许手动选择，禁止随机选择、默认猜测或模型推断。

### 4.5 首次配置后的进入与修改

完成 `StudentCurriculumProfile` 后，学生再次打开应用直接进入 `Home`，不重复选择地区和教材。首页默认只显示“年级 · 学期”，完整地区和三科教材放在“我的 → 我的学习设置”。

修改地区时先提示“更换地区后，可使用的课本版本可能发生变化”，再重新解析并确认三科；取消或保存失败不能静默覆盖旧档案。修改年级时重新解析三科教材，但历史学习记录保留。修改单科教材时只更新对应字段，例如“更换数学课本”只影响数学，不覆盖语文和英语。

---

## 5. 核心学习闭环

### 5.1 主流程

```text
首页今日任务
  ↓
选择学科岛
  ↓
进入单元地图
  ↓
选择可用关卡
  ↓
场景引导
  ↓
知识讲解
  ↓
互动示例
  ↓
基础练习 → 进阶练习
  ↓
学科小游戏
  ↓
关卡测试
  ↓
结果反馈与奖励结算
  ├─ 达标：更新进度，解锁下一节点
  ├─ 部分掌握：推荐巩固练习
  └─ 未掌握：提示、重讲或进入错题复习
```

### 5.2 单个关卡结构

一个关卡目标时长为 5～10 分钟，具体时长由内容量与年级决定，不由动画或奖励强行拉长。

| 阶段 | 学习目的 | 必须具备的交互 |
| --- | --- | --- |
| 场景引导 | 说明关卡任务与情境 | 跳过或重新播放，不阻塞学习 |
| 知识讲解 | 建立一个清晰的知识概念 | 一句知识点 + 插画 / 动画 + 播放讲解 |
| 互动示例 | 让学生操作一次正确示例 | 下一步、重做、重新讲解 |
| 基础练习 | 检查基本理解 | 即时反馈、解析或提示 |
| 进阶练习 | 检查迁移与应用 | 根据掌握度调整难度 |
| 学科小游戏 | 在目标能力上做一次轻量应用 | 交互必须对应知识点 |
| 关卡测试 | 形成可记录的结果 | 题目进度、作答状态和提交结果 |
| 奖励结算 | 反馈完成与下一步 | XP、金币、星星、解锁状态 |

### 5.3 错误与恢复路径

- 首次错误：保留题目上下文，给出简短提示。
- 再次错误：展示分步解析或重新播放相关知识讲解。
- 连续错误：推荐回到基础练习或关联知识点复习。
- 关卡未达标：允许再次挑战，不把失败永久写成锁定状态。
- 错题记录：保存题目、知识点、错误次数、最近错误时间与复习次数。

---

## 6. 三个学科世界

三个学科共享学习闭环，但拥有独立的主题色、地图场景和交互语境。世界名称是产品体验命名，不代表教材单元的真实名称；正式映射必须由内容审核者依据教材版本确认。

| 学科 | 世界主题 | 可用区域示例 | 体验方向 |
| --- | --- | --- | --- |
| 语文 | 语文世界 | 文字森林、拼音山谷、词语小镇、阅读湖、古诗山、作文城堡 | 识字、词语、阅读、表达与积累 |
| 数学 | 数学世界 | 数字王国、计算工厂、几何岛、时间小镇、测量峡谷、逻辑实验室 | 计算、空间、量感、逻辑与应用 |
| 英语 | 英语世界 | 字母森林、单词小镇、句型车站、听力海湾、阅读城堡、口语广场 | 词汇、句型、听力、阅读与表达 |

### 6.1 角色 IP：知识团子

“知识团子”是原创主角的暂定名称。角色应具有圆润、软萌、有弹性和玩具感，但不得参考或复刻现有商业角色的外形、动作、服装或世界观。

角色设计方向：

- 圆滚滚身体、短手短脚、大眼睛和丰富表情。
- 头顶小装饰，可通过学习解锁变化。
- 支持走路、跑步、跳跃、庆祝、思考、鼓励、再试一次、开心和困惑等状态；答错时不使用失败倒地、哭泣或 Game Over 表现。
- 可更换服装、帽子、背包、鞋子和主题皮肤。

### 6.2 宠物与成长

知识宠物可以包括“书灵、数字精灵、字母精灵”等原创概念。宠物升级和进化只作为陪伴与收集反馈，不能改变题目答案、学习难度或学习公平性。

---

## 7. 学习地图与关卡状态

### 7.1 地图节点类型

| 节点类型 | 作用 |
| --- | --- |
| `START` | 单元或地图的起点 |
| `LESSON` | 知识教学关 |
| `PRACTICE` | 基础或进阶练习关 |
| `CHALLENGE` | 综合挑战关 |
| `CHEST` | 完成前置节点后的奖励节点 |
| `BOSS` | 单元阶段性综合挑战 |

### 7.2 节点状态

| 状态 | 解释 | 学生可执行操作 |
| --- | --- | --- |
| `locked` | 前置条件未满足 | 查看解锁条件；不能进入答题 |
| `available` | 已满足进入条件 | 开始关卡 |
| `inProgress` | 已开始但尚未完成 | 继续学习或重新开始 |
| `completed` | 已完成当前关卡 | 重做、复习或进入已解锁节点 |
| `perfect` | 达到该关卡配置的完美条件 | 重播、复习或领取额外装饰奖励 |

完美条件必须由关卡配置决定，不能在前端页面中写死。首个 MVP 是否要求“首次作答全对”或其他条件，列为待确认决策。

### 7.3 解锁逻辑

1. 地图始终显示当前单元的整体方向，但锁定未满足条件的节点。
2. 默认按节点前置关系解锁，不要求学生浏览或完成无关学科内容。
3. 挑战、宝箱和 Boss 节点可以要求前置知识点达到指定掌握度。
4. 复习和重做不会抹除已完成记录；新结果按进度规则更新。
5. 任何“锁定”都必须能解释原因，例如“先完成第 2 关”，不能显示无原因的禁用按钮。

---

## 8. 题型系统与互动模型

### 8.1 统一题目引擎

题目使用统一的 Question Engine 渲染。题型差异应由 `questionType` 和题目数据驱动，而不是为每种题型创建一套互不共享的页面。

每道题必须至少关联以下维度；题目与知识点的权威关系由 `QuestionKnowledgePoint` 提供，题目上的同名字段只能作为兼容快照：

| 维度 | 约束 |
| --- | --- |
| 年级 | `grade`，不能从当前页面默认推断 |
| 学科 | `subject` |
| 学期 | `semester` |
| 教材版本 | `textbookVersion` 或 `textbookVersionId` |
| 单元 | `unit` 或 `unitId` |
| 课次 | `lesson` 或 `lessonId` |
| 知识点 | `QuestionKnowledgePoint` 的 `PRIMARY` / `SECONDARY` 关系；旧 `knowledgePointId` 仅作迁移兼容 |
| 难度 | `difficulty` |
| 题型 | `questionType` |

### 8.2 题目内容字段

以下字段构成题目模型的设计契约；名称可在 PHASE 2 的数据设计中进一步确定类型，但不能删除内容归属与审核字段。

| 字段 | 含义 |
| --- | --- |
| `id` | 题目稳定标识 |
| `grade` | 年级标识 |
| `subject` | 学科标识 |
| `semester` | 学期标识 |
| `textbookVersionId` | 教材版本标识 |
| `unitId` | 单元标识 |
| `lessonId` | 课次标识 |
| `QuestionKnowledgePoint` | 题目与知识点的主 / 次关系；旧 `knowledgePointId` 仅作兼容快照 |
| `questionType` | 统一题型枚举 |
| `stem` | 题干或操作指令 |
| `media` | 图片、音频或动画资源引用 |
| `options` | 选项、拖拽项或可排序项 |
| `answer` | 标准答案或答案规则 |
| `explanation` | 解析、提示或分步说明 |
| `difficulty` | 难度等级 |
| `contentType` | `TEXTBOOK`、`EXTENSION`、`REVIEW`、`CHALLENGE` |
| `tags` | 检索与分析标签 |
| `needsVerification` | 是否仍需人工核验 |
| `source` | 内容来源或依据 |
| `status` | 内容审核与发布状态 |

### 8.3 题型范围

首期设计允许以下题型，是否全部进入 MVP 由 PHASE 2 的课程内容规模决定：

`singleChoice`、`multipleChoice`、`fillBlank`、`trueFalse`、`dragDrop`、`matching`、`sorting`、`typing`、`listening`、`speaking`、`calculation`、`reading`、`sentenceOrdering`。

其中 `speaking` 需要额外的语音能力与隐私设计，首个 MVP 只保留产品接口位置，不默认承诺接入语音识别。PHASE 9 仅实现 `singleChoice`、`multipleChoice`、`trueFalse`、`fillBlank`、`calculation` 和 `shortAnswer` 六类题型。

### 8.4 学科小游戏与能力绑定

小游戏必须绑定目标知识点，并记录结果；不能只记录“玩过”。

| 学科 | 游戏示例 | 绑定能力 |
| --- | --- | --- |
| 数学 | 数字气球、计算跑酷、数字桥、几何拼图 | 数字识别、计算、数量关系、空间组合 |
| 语文 | 汉字拼装、词语列车、古诗拼图、阅读侦探 | 字形、词语搭配、诗句排序、阅读信息提取 |
| 英语 | 单词配图、听音选词、句子拼装、语音跟读 | 词义、听辨、句型排序、口语练习 |

---

## 9. 学习进度、掌握度与复习

### 9.1 知识掌握度

每个知识点维护 `masteryScore`，范围为 0～100。它是根据作答结果、练习完成、复习结果和错误情况计算的学习投影，不是学生的永久标签。

| 分数区间 | 产品解释 | 推荐行为 |
| --- | --- | --- |
| 0～40 | 需要加强 | 回到讲解或基础练习，增加提示 |
| 40～70 | 基本掌握 | 保留基础题并加入少量变式 |
| 70～90 | 掌握良好 | 进入进阶题或综合应用 |
| 90～100 | 熟练 | 减少重复基础题，安排间隔复习或挑战 |

具体分数计算、每次作答的权重与上下限调整在 PHASE 2 数据和规则设计中确定。

### 9.2 知识能量

知识能量是面向学生的可理解复习信号，范围为 0～100。完成练习可以提高能量，长时间未复习可以逐步下降；能量下降只用于提醒和安排复习，不应造成惩罚性锁关。

当能量接近需要复习的区间时，学生看到“这个知识点快忘记啦！”等明确提示，重新完成复习即可恢复。

`masteryScore` 用于学习判断，`knowledgeEnergy` 用于复习提醒；两者不能在数据层面混成一个字段。

### 9.3 错题本

错题本至少保留：

- `wrongCount`：累计错误次数。
- `lastWrongTime`：最近一次错误时间。
- `reviewCount`：已复习次数。
- `mastered`：是否通过复习达到掌握条件。
- 题目与知识点关联。
- 最近一次错误原因或可用的解析入口。

错题复习任务应从错题数据生成，并能回到原题、解析和关联知识点，而不是只展示一个错误数字。

### 9.4 每日任务

每日任务总时长目标约 30 分钟，但应根据年级、掌握度和当天状态动态调整。任务示例：

- 语文晨读或阅读任务约 10 分钟。
- 数学计算挑战约 8 分钟。
- 英语单词或听力训练约 7 分钟。
- 错题复习约 5 分钟。

这些时长是产品规划参考，不是首期固定承诺；具体推荐规则待数据设计和儿童使用测试后确认。

---

## 10. 成长、奖励与社交边界

### 10.1 成长资源

| 资源 | 来源 | 用途 | 公平约束 |
| --- | --- | --- | --- |
| XP | 完成学习内容、练习和复习 | 提升角色等级 | 不购买、不兑换答案 |
| 星星 | 完成节点或达成学习目标 | 展示学科与地图进度 | 不作为付费捷径 |
| 金币 | 学习行为与成就 | 装扮、宠物、地图装饰 | 不购买学习优势 |
| 装扮 | 金币、成就或节点奖励 | 角色个性化 | 不改变题目或难度 |

### 10.2 成就

成就示例：第一次完成课程、数学连续答对、连续学习 7 天、掌握指定数量单词、完成指定数量阅读、连续学习 30 天。成就必须通过统一图标组件表达，禁止 Emoji。

### 10.3 排行榜

排行榜仅作为可选的轻量社交反馈，优先呈现个人成长。默认只允许查看本人、附近排名和已授权好友；不展示全国大型排名，不把排名作为首页首要目标。

### 10.4 家长中心

家长中心应提供：学习时间、语文 / 数学 / 英语情况、知识点掌握率、错题数量、连续学习天数、薄弱知识点、强项知识点和本周趋势。系统可以生成“本周学习报告”，但报告结论必须能追溯到学习记录，不能凭空生成评价。

家长身份验证、儿童隐私、数据保留期限和监护人授权属于后续工程与合规设计，当前阶段列为待确认，不视为已支持。

---

## 11. 页面结构与核心组件职责

### 11.1 页面结构

| 页面 | 学生主要任务 | 首屏必须回答的问题 |
| --- | --- | --- |
| 首次配置 | 完成地区、年级、教材和角色选择 | 我在哪里学习、几年级、使用哪套课本、怎样出发？ |
| 首页 | 选择今天的学习目标 | 我是谁、今天学什么、从哪里开始？ |
| 学习地图 | 选择下一个节点 | 我在本单元哪里、哪一关可以进入？ |
| 学习关卡 | 学知识并完成互动 | 这一步要学什么、我做得对不对？ |
| 结果页 | 理解结果并继续 | 我掌握了什么、下一步是挑战还是复习？ |
| 每日任务 | 完成短任务组合 | 今天还差什么、预计要多久？ |
| 错题本 | 找到并复习薄弱题目 | 我哪里容易错、怎么重新练？ |
| 我的 | 管理角色和成长记录 | 我的角色成长到哪里、有哪些成就？ |
| 家长中心 | 查看学习报告 | 孩子的学习进展和薄弱点是什么？ |
| 我的学习设置 | 查看或修改地区、年级、学期和三科教材 | 我当前使用的课程上下文是什么？ |

### 11.2 核心组件清单

这些组件是后续工程的产品级组件契约，本阶段只定义职责，不创建实现：

| 组件 | 职责 |
| --- | --- |
| `AppIcon` | 统一图标名称、尺寸、状态和无障碍标签 |
| `StudentHeader` | 学生头像、昵称、年级、连续学习、星星和金币 |
| `SubjectCard` | 学科主题、进度、当前章节和今日任务入口 |
| `LearningMap` | 单元主题地图、缩放和节点布局 |
| `MapNode` | 节点图标、类型、状态、解锁条件和点击行为 |
| `CharacterAvatar` | 角色动作、装扮和情绪状态 |
| `KnowledgeCard` | 一条知识点的讲解、插画与互动入口 |
| `LessonPlayer` | 讲解播放、重播、下一步和进度 |
| `QuestionRenderer` | 根据题型渲染题目与收集作答 |
| `QuestionProgress` | 当前题号、总题数和完成进度 |
| `AnswerFeedback` | 正确、错误、提示、解析和再次尝试 |
| `RewardModal` | XP、金币、星星、解锁和鼓励反馈 |
| `DailyTaskCard` | 任务说明、预计时长、完成状态和入口 |
| `MasteryChart` | 学科、知识点掌握趋势的可理解展示 |
| `WrongQuestionCard` | 错题摘要、知识点、错误次数和复习入口 |
| `AchievementCard` | 成就条件、完成状态和获得时间 |
| `OnboardingProgress` | 显示“地区 · 年级 · 教材 · 角色”和 `1 / 4` 等轻量进度 |
| `RegionCard` / `RegionSelector` | 搜索、推荐、省份 / 城市逐级选择所在地区 |
| `GradeCard` / `GradeSelector` | 以大型卡片选择年级并表达“当前支持 / 即将开放” |
| `TextbookCard` | 显示单科教材完整名称、出版社、年级、学期和版本状态 |
| `TextbookVersionSelector` | 在同一学科候选集中手动确认完整教材版本 |
| `CurriculumProfileCard` / `CurriculumSummary` | 摘要展示 StudentCurriculumProfile 的地区、年级、学期和三科教材 |
| `CurriculumSwitchDialog` | 说明地区、年级或单科教材切换的影响，避免静默覆盖 |
| `UnsupportedRegionState` | 表达地区未支持并提供选择其他地区的动作 |

---

## 12. 核心数据模型设计

### 12.1 数据模型边界

课程内容是内容域的权威事实；学生进度、掌握度、错题与任务是学习行为域的记录；地图节点、首页卡片和图表是面向体验的读取投影。前端展示名称不能反过来成为教材或知识点的唯一事实源。

### 12.2 实体清单

| 实体 | 关键字段 / 关系 | 责任边界 |
| --- | --- | --- |
| `Student` | 学生标识、昵称、头像、当前年级、角色标识 | 保存学生身份与当前学习上下文 |
| `Grade` | 年级标识、显示名称、排序 | 定义 1～6 年级范围，不混合课程 |
| `Subject` | 学科标识、名称、主题配置 | 语文、数学、英语及其视觉主题 |
| `Region` | 地区标识、层级、上下级关系、状态 | 保存行政或产品适用地区，不成为课程知识父级 |
| `Publisher` | 出版社标识、名称、来源、核验状态 | 保存出版社身份，不替代教材来源 |
| `TextbookVersion` | 版本标识、学科、年级、学期、`publisherId`、状态 | 定义可跨地区复用的教材版本，不将版本写死在页面 |
| `RegionTextbookRelation` | 地区、教材版本、默认 / 支持 / 可选关系、有效期、来源、状态 | 决定地区教材可用性，不被教材版本核验替代 |
| `Semester` | 学期标识、名称、排序 | 关联年级与教材版本 |
| `Unit` | 单元标识、名称、顺序、主题场景 | 组织课程与地图段落 |
| `Lesson` | 课次标识、名称、顺序、单元关联 | 连接教材内容与知识点 |
| `KnowledgePoint` | 知识点标识、名称、能力描述、前置知识点 | 作为练习、掌握度和复习的最小学习单位 |
| `CourseContent` | 内容标识、知识点关联、正文 / 媒体、内容类型、来源、审核状态 | 保存讲解、示例、拓展与复习内容 |
| `Question` | 题目字段、题型、答案规则、解析与查询快照 | 供统一题目引擎使用；知识点权威关系由 `QuestionKnowledgePoint` 管理 |
| `QuestionKnowledgePoint` | 题目、知识点、主 / 次关系、顺序、来源和核验状态 | 表达一题多知识点，供题目引擎确定目标知识点 |
| `AssessmentDefinition` | Assessment 标识、目标知识点、固定题目 ID 顺序、模式 | 定义一次可重复读取的练习集合 |
| `QuestionSession` / `QuestionAttempt` | 学生、Assessment、草稿、提交状态、结果、题目版本 | 保存一次练习的可恢复作答过程 |
| `StudentCurriculumProfile` | 学生、地区、年级、学期、三科教材版本、确认时间、来源 | 保存学生当前选课结果，三科版本分别维护 |
| `LearningMap` | 地图标识、年级、学期、学科、单元、主题配置 | 组织学生端学习路径 |
| `MapNode` | 节点类型、顺序、前置节点、关联内容、解锁规则 | 保存地图上的体验节点 |
| `StudentProgress` | 学生、地图 / 节点、完成状态、最近学习时间 | 记录学生完成路径 |
| `KnowledgeMastery` | 学生、知识点、`masteryScore`、最近练习时间 | 记录掌握度判断所需的学习行为投影 |
| `WrongQuestion` | 学生、题目、错误次数、最近错误时间、复习次数、掌握状态 | 管理错题与复习入口 |
| `DailyTask` | 学生、日期、任务类型、目标内容、预计时长、完成状态 | 生成和追踪每日学习安排 |
| `Achievement` | 成就定义、条件、图标、奖励 | 管理非付费的成长反馈 |
| `Character` | 学生、等级、XP、装扮槽位、情绪状态 | 管理主角成长与外观 |
| `Pet` | 学生、宠物类型、等级、进化状态、装饰 | 管理陪伴型知识宠物 |
| `Reward` | 奖励类型、来源、数量、关联事件 | 记录奖励发放与用途 |

### 12.3 关系约束

1. `Question` 必须至少存在一个有效的 `QuestionKnowledgePoint` 关系，并有且仅有一个目标上下文中的 `PRIMARY` 关系；旧 `knowledgePointId` 仅为迁移兼容字段。
2. `Question` 必须携带年级、学期、学科和教材版本维度；不能只依赖 `unitId` 推断。
3. `CourseContent` 必须明确 `contentType`、`status`、`source` 和 `needsVerification`。
4. `Unit`、`Lesson` 和 `KnowledgePoint` 必须属于同一个已确认的教材版本或明确标记为拓展内容。
5. `StudentProgress` 的节点状态不能覆盖课程内容的审核状态；内容未发布时不能进入学生学习路径。
6. `KnowledgeMastery` 与 `knowledgeEnergy` 是不同概念，不能使用一个数值字段替代两者。
7. `Reward` 必须记录触发学习事件，不能因打开页面或付费直接获得学习优势。
8. `TextbookVersion` 通过 `publisherId` 引用 `Publisher`；地区适用性必须通过 `RegionTextbookRelation` 表达，不能使用 `publisher: string` 或权威 `regionScope`。
9. `RegionTextbookRelation` 必须独立记录来源、有效期、状态和核验标识；教材版本已核验不代表地区关系已核验。
10. `StudentCurriculumProfile` 必须分别保存语文、数学和英语教材版本，不能只保存一个 `textbookVersionId`。

### 12.4 UI 与课程档案映射

课程配置页面只显示数据层返回的名称与状态：`RegionCard` 显示 `Region.name`，`TextbookCard` 从 `TextbookVersion` 与 `Publisher` 读取完整教材名和出版社，`CurriculumSummary` 读取 `StudentCurriculumProfile` 的三科字段。页面不得根据地区名称拼接教材，不得把出版社当作地区，不得因一科已经确定就推断另外两科。

课程设置的正式学生端名称为“我的学习设置”，至少展示：学习地区、年级、学期、语文教材、数学教材、英语教材。教材选择相关的 `REGION_NOT_SUPPORTED`、`TEXTBOOK_NOT_FOUND`、`MULTIPLE_TEXTBOOKS`、`TEXTBOOK_NEEDS_CONFIRMATION`、`NO_DEFAULT_TEXTBOOK` 和 `GRADE_NOT_AVAILABLE` 状态必须有儿童友好的文案和恢复动作。

---

## 13. 内容准确性与教材版本机制

### 13.1 内容状态

内容状态按以下流程管理：

```text
DRAFT
  ↓
AI_GENERATED
  ↓ 人工检查
REVIEWED
  ↓ 教材与内容核验
VERIFIED
  ↓ 发布审批
PUBLISHED
```

约束：

- 新建内容默认为 `DRAFT`；AI 生成后为 `AI_GENERATED`。
- `AI_GENERATED` 不得直接进入 `PUBLISHED`。
- `VERIFIED` 表示已经有人依据可靠来源核验；必须记录 `reviewedBy` 与 `verifiedAt`。
- `PUBLISHED` 只表示该内容已获准进入学生端，不等同于永远正确；教材改版或发现问题时必须可下架与追溯。
- 内容被发现有问题时，应回退到修订状态，保留原版本、问题原因和处理记录。

### 13.2 教材版本

产品必须通过 `textbookVersionId` 支持教材版本，不允许把“人教版”“北师大版”“苏教版”或 “PEP” 直接硬编码到页面逻辑。语文、数学、英语可以分别使用不同版本，版本选择不能默认假设三科一致。

`TextbookVersion` 通过 `publisherId` 关联 `Publisher`，不再以内嵌 `publisher: string` 保存出版社。地区适用性通过 `RegionTextbookRelation` 表达，不把权威 `regionScope` 放进教材版本；如需展示地区范围，只能使用由有效关系派生的结果。

首次使用时，学生选择 `Region` 后，系统按 `regionId`、`gradeId`、`semesterId` 和 `subjectId` 查询可用教材。`resolveAvailableTextbooks` 只使用已核验关系：单个有效 `DEFAULT` 可以自动推荐，多个可用版本必须让学生确认，无法确定时允许手动选择，禁止模型猜测。

首期正式建库前必须确认：

- 目标地区或使用范围。
- 三年级上册各学科采用的具体教材版本。
- 版本对应的出版社 / 课程标准信息。
- 单元、课次和知识点的审核责任人。
- 教材原文、图片、音频和例题的授权或来源记录。

### 13.3 内容流水线责任

| 阶段 | 责任人 | 输出 |
| --- | --- | --- |
| 采集 / 建档 | 内容运营或教研 | 教材版本、单元、课次元数据 |
| 编写 | 教研或 AI 辅助人员 | 结构化知识点、内容、题目 |
| 初审 | 内容审核者 | 纠错、来源补充、内容类型确认 |
| 核验 | 教材负责人 | 教材对应关系与准确性结论 |
| 发布 | 产品 / 内容负责人 | 可供学生端读取的发布版本 |

失败路径：来源不清、版本不明、题目答案有争议或审核信息缺失时，内容保留在未发布状态，并标记待处理原因；不能通过删除标记来掩盖不确定性。

---

## 14. MVP 边界与首期验证目标

### 14.1 MVP 范围

首个可验证产品切片聚焦：

- 三年级上册。
- 语文、数学、英语三科。
- 每个学科先选择 1 个已确认版本的单元。
- 首次使用先选择地区；语文、数学、英语分别确认教材版本后进入各自学习岛。
- 每个单元 3～5 个知识点。
- 每个知识点包含 1 个教学关、1 个练习关、1 个挑战关。
- 学生端最小闭环：首页 → 学科岛 → 单元地图 → 关卡 → 结果 → 进度 / 复习入口。

PHASE 3 的 UI / UX 设计不以前置录入真实教材数据为条件，可以使用 `SAMPLE_*` 结构验证页面层级、候选状态和交互布局。样例不能被当作真实地区教材映射或发布内容。

MVP 先验证“一个学期、三个学科、三种关卡是否能形成可理解的学习体验”，不以课程数量作为第一成功指标。

### 14.2 MVP 暂不承诺

- 1～6 年级全部课程。
- 全教材版本覆盖。
- 复杂 3D 场景、实时多人游戏或完整动作系统。
- 语音识别、口语评分和外部 AI 服务。
- 复杂家长账号体系、支付、社交关系和消息系统。
- 微信小程序、原生 App 的正式发布。

上述能力可以保留接口设计，但在没有明确需求、内容和合规条件前不进入首期实现。

### 14.3 MVP 的学习价值验证

首期应重点验证：

1. 学生能否从首页理解今日任务并进入正确关卡。
2. 地图节点是否比课程列表更容易表达“当前在哪里、下一步是什么”。
3. 讲解、互动和练习是否围绕同一个知识点形成连贯体验。
4. 错误反馈是否能促使学生再次尝试，而非直接退出。
5. 学习结果、错题和掌握度是否能为下一次复习提供可解释依据。
6. 家长是否能从报告中识别真实的学习趋势，而不是只看到游戏奖励。

---

## 15. 视觉与交互方向

### 15.1 视觉基调

儿童教育 + 轻 3D + 柔和游戏化。整体感觉应当清新、圆润、明亮、低压力、有场景感，但避免过度幼儿化和高刺激的持续动画。

- 按钮圆角建议 14～20px。
- 卡片圆角建议 16～24px。
- 使用柔和阴影和足够留白，保证触控目标清晰。
- 语文使用暖橙 / 红色调，数学使用蓝 / 青色调，英语使用绿 / 紫色调。
- 学科色可以随地图场景变化，但状态色（成功、提示、错误、锁定）必须保持可理解的一致性。
- 所有图标通过统一的 `AppIcon` 表达，不在页面中直接写 Emoji。

### 15.2 动效边界

动效应帮助学生理解状态变化，例如节点解锁、答题反馈、奖励结算和角色情绪。动效必须可跳过、可降低或不阻塞下一步操作；错误反馈不使用夸张的失败惩罚。

### 15.3 可访问性底线

- 文字与背景保持足够对比度。
- 颜色不是表达状态的唯一方式，同时使用图标、文案或形状。
- 触控操作提供足够点击面积。
- 音频内容提供文字替代或重新播放入口。
- 关卡进度、题目状态和错误提示对键盘与辅助技术可识别。

---

## 16. 后续技术边界（仅设计）

技术栈是后续工程阶段的建议，不是当前实现事实：

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router。
- 样式：自定义儿童 UI 组件，避免以 Element Plus 的后台风格作为产品主题。
- 图标：Lucide 或自定义 SVG，通过 `AppIcon` 统一封装。
- 动画：GSAP 或 Motion One，按关卡与设备性能按需使用。
- 内容与行为：内容数据、题目数据、学习记录、进度和奖励逻辑分层管理。

建议的前端模块边界：

```text
src/
├─ components/     # common、game、learning、question、character、layout
├─ pages/          # onboarding、home、map、learn、question、result、wrongbook、task、profile、parent、settings
├─ stores/         # 学习进度、学生状态、任务、角色成长等状态
├─ services/       # 内容读取、答题提交、进度与奖励服务
├─ data/           # 经审核可读取的结构化内容入口
├─ types/          # 数据模型与题型契约
├─ utils/          # 掌握度、复习、地图解锁等纯规则
└─ assets/         # icons、characters、maps、subjects
```

本阶段不初始化工程、不安装依赖、不创建上述目录；这些属于后续开发阶段的实现任务。

---

## 17. PHASE 1 验收标准

本阶段文档完成的判定标准：

- 已定义产品目标、主要用户和核心使用场景。
- 已定义“世界 → 单元地图 → 关卡 → 知识点”的信息架构。
- 已定义首页、地图、关卡、结果、错题本、每日任务、我的和家长中心的页面职责。
- 已定义学习闭环、关卡流程、地图节点类型与节点状态。
- 已定义统一题目引擎的必需内容维度与题型范围。
- 已定义学生进度、掌握度、错题、任务、角色、宠物、成就和奖励的实体边界。
- 已定义课本内容、拓展内容和复习内容的区分方式。
- 已定义教材版本、出版社、地区适用关系、来源、审核状态和发布边界。
- 已定义 MVP 范围、排除项、待确认事项和 PHASE 2 的输入。

当前验收结论：以上内容已形成设计文档；产品、课程、技术和合规实现尚未开始，不能宣称已运行或已验证。

---

## 18. 待确认事项与后续输入

以下事项不会阻止当前设计文档成立，但在进入真实课程数据与工程实现前必须确认：

1. 产品正式名称是否继续使用“知识岛”。
2. MVP 三个学科分别采用哪一套教材版本。
3. MVP 选择的具体单元、课次和知识点清单。
4. 内容审核者、教材负责人和发布负责人的具体身份。
5. 学生登录、家长绑定、监护人授权和隐私策略。
6. 地图的完美通关条件和关卡达标线；PHASE 10 的 `MasteryEngine` 已固定为带 `algorithmVersion` 的 `MASTERY_V1`，后续变更必须版本化。
7. 知识能量的衰减周期、提醒阈值和复习恢复规则；`KnowledgeEnergy` 不属于 PHASE 10 运行范围。
8. 音频、图片、动画和教材原文的版权与存储来源。
9. 是否在 MVP 中加入听力题，以及是否保留口语题接口。
10. 角色、宠物与奖励的视觉资产制作方式和资源版权。
11. MVP 目标地区。
12. 地区教材映射来源。
13. 地区教材有效年份，以及 `effectiveFrom` / `effectiveTo` 的维护方式。
14. 学校是否允许覆盖地区默认版本。
15. 学生更换地区后课程进度、教材版本和历史作答的迁移策略。

### 后续课程与工程输入

在确认上述关键项后，真实课程与生产题库录入前仍应输出并核验：

- 三年级上册三科的教材版本元数据。
- 每科一个单元的 3～5 个知识点清单。
- 知识点与教学关、练习关、挑战关的映射。
- 真实题库的题型数据样例、答案规则与 `QuestionKnowledgePoint` 关系。
- 内容审核状态、来源和版本的可执行数据约束。
- MVP 地图节点、解锁规则与学习进度状态表。

## 19. PHASE 3 UI / UX 设计输入与边界

PHASE 3 只完成视觉设计、交互设计、页面规范、组件规范、响应式设计、游戏化视觉、角色、地图、题型交互和课程选择流程。以下 13 份文档共同构成后续 Vue 3 工程的 UI / UX 设计依据：

| 文档 | 责任范围 |
| --- | --- |
| `DESIGN_SYSTEM.md` | Design Token、基础组件、状态表达和可访问性底线 |
| `CHARACTER_DESIGN.md` | 知识团子原创轮廓、表情、状态、动作和装扮公平性 |
| `RESPONSIVE_DESIGN.md` | Desktop、Tablet Landscape / Portrait、Mobile、Safe Area 和 Wireframe |
| `PAGE_SPEC.md` | 页面目标、信息优先级、CTA、组件、状态、响应式和跳转 |
| `QUESTION_UI.md` | 统一 QuestionShell、题型交互、键盘 / 触控和题型 Wireframe |
| `MOTION_SYSTEM.md` | 角色、地图、解锁、反馈、奖励、转场、加载和 Reduced Motion |
| `UI_FLOW.md` | 首次进入、已有配置、学习、复习、地区 / 年级 / 教材切换和家长流程 |
| `ONBOARDING_DESIGN.md` | 地区、年级、教材、角色的游戏开场式课程配置体验 |
| `VISUAL_DIRECTION.md` | 视觉定位、世界层级、KnowledgeDango 定稿、视觉强度和背景策略 |
| `CORE_PAGE_SPEC.md` | 核心页面高保真布局、尺寸、层级、站位、状态和响应式规格 |
| `ASSET_LIST.md` | 角色、地图、插图、图标、奖励、占位媒体和 MediaAsset 资产需求 |
| `COMPONENT_VISUAL_MATRIX.md` | 基础组件和核心交互组件的统一视觉状态矩阵 |
| `VISUAL_QA.md` | 3 秒 / 10 秒、设备、可访问性、动效、原创性和内容事实 QA 闸门 |

### 19.1 PHASE 3 设计硬约束

- 不初始化 Vue 工程，不执行 `npm install`，不创建正式页面或组件实现。
- 不推翻 PHASE 2.1 / 2.2 已确认的数据模型、课程层级、地区教材关系、题型协议、审核规则和 MVP 边界。
- 不使用 Emoji、商业 IP 临时素材、Element Plus 后台视觉、大量白色 Dashboard 卡片或全页面渐变。
- 不把地区、出版社和教材版本混为一项；不把单一教材版本代表三科。
- 不让 UI 自行猜测教材版本；教材信息只能来自解析器和课程数据层。
- 不以真实教材数据录入作为 PHASE 3 设计前置条件；真实数据仍须按 `MVP_CURRICULUM.md` 的 PHASE 6 导入、核验与发布审核门槛处理。

### 19.2 PHASE 3 验收重点

1. 首次用户可以完成地区 → 年级 → 教材 → 角色并进入知识岛。
2. 多教材、无默认、无候选、地区未支持和未开放年级均可理解、可恢复。
3. 三科教材可以不同；修改数学不会影响语文和英语；切换地区会重新确认教材。
4. 首页突出“继续学习”，不堆积地区、出版社和版本年份元数据。
5. Desktop、Tablet 和 Mobile 有实质布局差异；Mobile 可单手完成课程配置和题目互动。
6. 地图明确区分游戏主题与教材事实；Question 使用统一 Shell 和非拖拽替代操作。
7. 状态不只靠颜色，动效可跳过并支持 Reduced Motion；页面无后台错误词和羞辱性反馈。

PHASE 3 设计文档完成后停止，不进入 PHASE 4 工程初始化，不创建正式前端页面。

## 20. PHASE 3.1 核心页面视觉定稿与 UX 验证

PHASE 3.1 在 PHASE 3 的设计基础上锁定核心页面的视觉方向和实现输入，范围仅包括：

- Home / Knowledge Island：知识岛与 KnowledgeDango 为视觉中心，今日任务为唯一强 CTA，三个学科世界作为第二层探索入口。
- Math Learning Map：`计算工厂` 等是游戏世界主题；真实教材、单元和知识点是独立事实层，使用路径和 MapNode 表达探索。
- Lesson / Knowledge Teaching：安静的知识中心，ContentBlock、媒体和 KnowledgeCard 优先，角色仅辅助解释。
- Question：统一 QuestionShell，题干和作答区优先，游戏感来自角色反馈、轻动效和进度，不来自背景噪声。
- Level Complete / Reward、WrongBook、ParentDashboard：学习结果和复习建议优先，奖励不引入概率、盲盒、强竞争或无限使用机制。
- OnboardingWelcome、RegionSelect、GradeSelect、TextbookConfirm：保留游戏开场式体验，同时清楚区分 Region、Grade、Publisher 和 TextbookVersion；教材只能展示数据层返回结果。

PHASE 3.1 的新增设计事实源为：

| 文档 | 责任范围 |
| --- | --- |
| `VISUAL_DIRECTION.md` | 最终视觉方向、材质、角色、世界、视觉强度和背景策略 |
| `CORE_PAGE_SPEC.md` | 14 类核心页面的高保真页面规格和 Desktop / Tablet / Mobile 差异 |
| `ASSET_LIST.md` | P0/P1/P2 资产需求、尺寸、格式、状态、动画和版权登记边界 |
| `COMPONENT_VISUAL_MATRIX.md` | Button、Card、Icon、Header、MapNode、Question、教材选择等组件状态 |
| `VISUAL_QA.md` | 设计级结论及 PHASE 4 工程实现后必须完成的设备、可访问性、性能和原创性验证 |

### 20.1 PHASE 3.1 硬约束

- 不初始化 Vue，不执行 `npm install`，不创建正式页面、组件实现或真实媒体资产。
- 不修改 PHASE 2.1/2.2 已冻结的数据、课程、审核和教材关系事实；样例数据仍只能作为布局和状态占位。
- 不以真实教材数据录入作为 PHASE 3.1 或 PHASE 3 UI 设计前置条件；真实数据、来源、版权和教材核验仍服从 `MVP_CURRICULUM.md`、`CONTENT_REVIEW.md` 的门槛。
- KnowledgeDango 必须保持原创的非对称软方团轮廓和独立面部/四肢比例；正式资产仍需单独完成原创性与版权审核。
- 所有页面必须遵守 Explore / Learn / Focus / Report 视觉强度分级，Question 和 ParentDashboard 不得被高强度游戏装饰覆盖。
- Desktop、Tablet、Mobile 必须有实质布局差异；Tablet 不能是缩小的桌面版，Mobile 不能是缩小的桌面表单。
- Question 的结构化 ContentBlock、MediaAsset 引用、`masteryScore` 与 KnowledgeEnergy 解释必须保持既有数据契约，不得在 UI 层简化或误读。

### 20.2 PHASE 3.1 停止条件

完成 `VISUAL_DIRECTION.md`、`CORE_PAGE_SPEC.md`、`ASSET_LIST.md`、`COMPONENT_VISUAL_MATRIX.md`、`VISUAL_QA.md`，并将其纳入本产品文档索引后，PHASE 3.1 即停止。该阶段当时不自动进入 PHASE 4；PHASE 4 仅在获得明确任务后启动。`VISUAL_QA.md` 中标为“待工程验证”的真实设备、页面渲染和用户测试仍不得在设计阶段宣称完成。

## 21. PHASE 4 工程初始化 + Design Token + 基础组件体系

PHASE 4 已完成工程基础范围，当前状态为“基础工程已实现并已验证，业务页面待实现”。本阶段只建立可运行、可扩展、可测试的 Vue 3 基础，不实现完整知识岛、地图、LessonPlayer、Question Engine、奖励、错题或家长中心。

### 21.1 已实现的工程基础

- Vue 3 + TypeScript + Vite 工程，TypeScript `strict` 开启，并配置 `@/` 路径别名。
- Pinia、Vue Router、TailwindCSS、`lucide-vue-next`、Vitest、ESLint 和 Prettier。
- `src/design-tokens/` 与 CSS Variables：颜色、间距、圆角、阴影、字体、动效、断点、布局和触控目标。
- 全局 reset、base、utilities、transitions 和 reduced-motion 样式。
- `AppIcon`、`AppButton`、`AppCard`、`AppProgress`、`AppModal`、`AppBottomSheet`、`AppToast`、`AppLoading`、`AppEmptyState`、`AppErrorState`、`AppAvatar` 等通用组件。
- 原创几何 `KnowledgeDangoPlaceholder`，仅作为 PHASE 4 基础占位，不代表正式角色资产。
- PHASE 2 数据契约对应的 TypeScript 基础类型：Region、Publisher、TextbookVersion、StudentCurriculumProfile、Grade、Semester、Subject、LearningMap、MapNode、KnowledgePoint、QuestionBase、QuestionOption、ContentBlock、MediaAsset，以及结构化答案规则。
- `curriculumService`、`studentService`、`contentService` 的 Service / Mock Adapter 边界；当前 Mock 不填入真实地区教材映射或大量课程数据。
- `appStore`、`studentStore`、`curriculumStore`、`uiStore` 四个最小 Store；三科教材版本在课程 Store 中分别保存。
- Vue Router 页面占位和路由 Metadata，包括 `requiresOnboarding`、`studentOnly`、`parentOnly`、`hideBottomNav`、`immersiveMode`；`/dev/ui` 仅用于开发组件检查。
- `.env.example`、ESLint、Prettier、npm scripts 和最小组件/配置测试。

### 21.2 已执行验证

以下命令已实际执行并通过：

- `npm install`
- `npm run dev`（本地 Vite 服务启动，并探活 `/` 与 `/dev/ui`）
- `npm run type-check`
- `npm run lint`
- `npm run format:check`
- `npm run test`
- `npm run test:run`
- `npm run build`

PHASE 4 当时的基础测试为 2 个测试文件、5 个断言；当前全套测试结果见 PHASE 6 章节。上述结果不代表业务页面或真实课程数据已经实现。

### 21.3 明确未实现

- Home Knowledge Island、LearningMap 业务地图、角色移动、关卡解锁、LessonPlayer、QuestionRenderer/答题逻辑、Mastery 算法、KnowledgeEnergy 算法、Reward、WrongBook、ParentDashboard。
- 真实教材、真实地区教材关系、正式媒体资产、版权录入和正式内容发布。

PHASE 4 的工程初始化在本节完成；本节原本的停止点不代表后续阶段未获授权。PHASE 5 在获得明确任务后继续，并继续遵守 PHASE 2.1/2.2 数据契约和 PHASE 3/3.1 视觉事实源。

## 22. PHASE 5 Mock Curriculum + Curriculum Data Pipeline

PHASE 5 已完成“地区 → 年级 → 学期 → 教材版本 → StudentCurriculumProfile → 课程骨架”的本地 Mock 闭环。所有课程、地区教材关系、出版社、媒体、内容和题目均为 `SAMPLE_*` 占位数据，带有 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE`，且不使用 `PUBLISHED`。它们不能被解释为真实教材、真实地区映射或已取得授权。

### 22.1 已实现

- `src/data/curriculum/` 按实体目录提供年级、学期、学科、地区、出版社、教材版本、地区教材关系、单元、课次、知识点、关系、地图、内容、题目、来源和媒体 Mock 数据，并通过 `index.ts` 建立索引。
- `resolveAvailableTextbooks` 按 `regionId + gradeId + semesterId + subjectId` 确定性解析三科教材，区分 `AUTO_RESOLVED`、`NEEDS_CONFIRMATION` 和 `NOT_AVAILABLE`，重复 `DEFAULT` 会报告异常，不使用数组首项猜测。
- `curriculumProfileRepository` 使用 Zod 校验 `schemaVersion: 1` 的 localStorage 载荷；损坏数据会安全清除并回到 Onboarding。
- `curriculumStore` 暴露地区、年级、学期、三科教材、解析状态、加载和错误状态，以及选择、解析、确认、重置和读取档案动作。
- `/onboarding`、`/onboarding/region`、`/onboarding/grade`、`/onboarding/textbooks`、`/onboarding/character`、`/home`、`/curriculum-settings` 和 `/dev/curriculum` 已接入最小可运行流程；地区、年级和教材页面不把 Region、Publisher、TextbookVersion 混为一项。
- 课程结构支持一个课次多个知识点、一个知识点跨多个课次；前置关系图和题目、ContentBlock、课程数据、SAMPLE 发布闸门均有校验函数和测试。

### 22.2 本阶段明确未实现

- 真实教材录入、真实地区映射、真实媒体、OCR、正式内容审核后台、API / 数据库和生产发布。
- Knowledge Island、正式 LearningMap、LessonPlayer、QuestionRenderer、真实答题、Mastery / KnowledgeEnergy 运行服务、奖励、错题本和家长中心。

PHASE 5 是 PHASE 6 的 Mock 与兼容基线。真实教材事实、地区映射来源、版权和教材核验仍必须在后续数据录入前完成。

## 23. PHASE 6 课程数据导入、验证与审核

PHASE 6 已完成 6.1～6.3 的工程基础，并为 PHASE 7 提供课程导入、核验、来源和生产访问闸门。`VerificationStatus` 是课程数据的主核验状态，保留 `isSample` 与 `needsVerification`；`ACTIVE` / `DRAFT` 等结构生命周期和 `PUBLISHED` 等内容生命周期仍由各实体自己的 `status` 表达，不能混用。

### 23.1 PHASE 6.1：导入与验证基础设施

- 已加入 `SourceReference`、`EntitySourceReference`、`ProvenanceMetadata` 和稳定 `TextbookIdentity` / `textbookIdentityKey`；缺少版次年份时使用 `UNKNOWN`，不凭记忆补值。
- 已加入 `CurriculumImportPackageSchema`、`importCurriculumPackage`、引用/重复/完整性/前置关系 DAG 校验和 `CurriculumImportResult` / `CurriculumReviewReport`。
- `src/data/curriculum/sample/` 只是既有 SAMPLE 目录的明确命名空间；`src/data/curriculum/verified/` 是独立的正式数据入口，禁止 `SAMPLE_*` 污染。
- 集中访问策略规定生产解析只允许 `verificationStatus = REVIEWED`；开发 Mock 必须通过集中配置显式允许 SAMPLE 或未核验记录。

### 23.2 PHASE 6.2：Golden Sample Framework

当前只建立一个三年级数学上册 PEP Golden Sample Framework：1 个教材、1 个单元、3 个课次、4 个知识点、6 个课次-知识点映射、3 条知识关系、1 个待补来源。所有记录为 `UNVERIFIED`，不是真实教材目录，不代表 PEP 的真实单元、课文、页码或版权已确认。

### 23.3 PHASE 6.3：审核记录与生产保护

- `CurriculumReviewRecord` 只允许 `SYSTEM` 或 `MANUAL_REVIEW` 审核者标识；状态迁移禁止 SAMPLE 进入 VERIFIED / REVIEWED，也禁止未恢复的 REJECTED 直接进入 REVIEWED。
- `npm run curriculum:review` 生成 `CURRICULUM_VERIFICATION_REPORT.md` 和 `curriculum-verification-report.json`。当前结构校验无错误，但结果为 `REQUIRES_MANUAL_REVIEW`。
- 在 PHASE 6 结束时尚未实现 LessonPlayer、Question Engine、Mastery / KnowledgeEnergy 运行服务、奖励、错题本、家长中心或 Knowledge Island 业务地图；当前状态由下一节 PHASE 7 记录。

## 24. PHASE 7 Knowledge Island / LearningMap

PHASE 7.1～7.4 已完成。本阶段把已有 Curriculum Domain 投影为可探索的 Knowledge Island / LearningMap，不修改课程事实，不生成正式课程内容，不实现 Question Engine、MasteryScore、KnowledgeEnergy、Adaptive Learning、WrongBook、Reward 或 Parent Dashboard。

### 24.1 已实现范围

- `Curriculum → LearningMap ViewModel` 适配层：读取 `Textbook → Unit → Lesson → KnowledgePoint → KnowledgeRelation`，页面不直接拼装课程关系。
- `KnowledgeMapNode`、`LessonMapSection`、`UnitIsland`、`LearningMapConnection`、进度摘要和诊断信息等独立地图展示模型。
- 稳定的逻辑坐标布局、Unit 岛屿、Lesson 区域、KnowledgePoint 节点、SVG 连接线、视觉注册表和响应式地图壳。
- `locked`、`available`、`learning`、`completed`、`mastered`、`perfect` 六种地图状态；后两种在本阶段仅为 fixture / mock UI 状态，绝不从 `masteryScore` 推导。
- 独立 `learningMapStore`、版本化 `localStorage` 地图进度、当前节点定位、节点详情和 Start / Complete 演示动作。
- 正式 `/learning-map`、开发 `/dev/learning-map` 和状态展示 `/dev/learning-map/states`；开发页可切换 Golden Curriculum 与 Map Demo Fixture。

### 24.2 数据与发布边界

当前 Golden Framework 仍为 `UNVERIFIED`：1 个教材、1 个单元、3 个课次、4 个知识点、6 个课次-知识点映射、3 条知识关系、1 个来源引用，结构错误为 0，自动报告结论为 `REQUIRES_MANUAL_REVIEW`。它只能在开发预览显示，并必须展示未审核提示。

Map Demo Fixture 是明确的 `SAMPLE` 开发夹具：3 个虚构知识岛、6 个区域、18 个节点和 17 条前置关系，用于验证多岛布局、跨区域解锁和状态展示；不能冒充任何真实教材或地区映射。

正式地图只允许读取 `verificationStatus = REVIEWED` 且满足结构生命周期、来源和版权约束的课程数据。没有可用教材时，正式入口返回课程未开放 / 引导设置等可恢复状态，不偷偷回退到 Golden 或 Demo 数据。

### 24.3 阶段验收与停止点

- 已验证 Golden / Demo 适配、稳定布局、跨 Lesson / Unit 前置关系、进度持久化、空态、unsupported、孤儿进度诊断、Sample / Unverified 标识和生产访问保护。
- 已验证 375、390、430 移动端，768 平板，以及 1024、1440 桌面视口；节点详情在移动端使用底部面板，桌面端使用侧边面板。
- 节点使用真实 `button`、可读 `aria-label`、`focus-visible`，地图装饰和状态动效支持 `prefers-reduced-motion`；正式 UI 不使用 Emoji 图标。
- 当前验证命令和浏览器结果记录在 `LEARNING_MAP.md`、`LEARNING_MAP_VISUAL.md` 与 `LEARNING_MAP_PROGRESS.md`。

PHASE 7 完成后进入 PHASE 8；`LessonLaunchContext` 作为地图到学习步骤的稳定导航 contract 使用。题目流程仍不在 PHASE 8 范围内。

## 25. PHASE 8 LessonPlayer / Knowledge Learning Flow

PHASE 8.1～8.4 已完成并停止。本阶段只建立从 KnowledgeMapNode 到结构化学习步骤的可恢复学习闭环：

```text
KnowledgeMapNode
  ↓
LessonLaunchContext
  ↓
LessonPlayerViewModel
  ↓
LessonSession + ContentBlock Renderer
  ↓
Step Navigation / Resume
  ↓
Lesson Completion
  ↓
LearningMap Demo Completion Integration
```

### 25.1 已实现范围

- 复用 `LessonLaunchContext`，在 LessonPlayer 入口验证 Textbook → Unit → Lesson → KnowledgePoint → LessonKnowledgePoint 映射的完整关系。
- 新增 `LessonStep`、`LessonSession`、`LessonPlayerViewModel`、独立 `lessonPlayerStore` 和版本化 `lessonSessionStorage`；会话身份按学生与完整课程上下文确定性生成，支持多个会话、恢复、完成和安全清理。
- 新增独立 `LessonPlayerAdapter`、`LessonPlayerRepository` 与 `LearningContentRepository`。页面只消费 ViewModel，不直接拼接 Curriculum 数据。
- 新增 Intro、Concept、Explanation、Example、Media、Interactive、Practice Placeholder、Summary 内容块渲染器。Interactive / Practice 只展示非评分互动，不提交答案、不判题、不产生掌握度。
- 正式 `/lesson` 从地图上下文进入；开发 `/dev/lesson-player` 提供 full、resume、completed、empty、not available、error、sample、unverified 状态 Showcase。完成学习后通过独立完成服务更新地图演示节点，不直接由 LessonPlayer 操作 `learningMapStore`。
- 正式课程与学习内容继续分别执行 Curriculum 与 LearningContent 的审核闸门；SAMPLE / UNVERIFIED 数据始终显示警示，Demo Lesson 不代表真实教材正文。

### 25.2 本阶段明确不实现

PHASE 8 不实现 `Question Engine`、正式答题、自动判题、题目抽取 / 推荐 / 难度算法、`QuestionSession`、`MasteryScore`、`KnowledgeEnergy`、Adaptive Learning、AI Learning Path、WrongBook、Reward、Coins、Achievement、Streak、Parent Dashboard、AI Tutor 或正式考试系统。`Practice` 只是内容与互动占位块；Lesson completion 不等于掌握度。

### 25.3 验收与停止点

已验证 LessonPlayer 的上下文校验、步骤导航、稳定会话、恢复与完成、内容块渲染、媒体失败回退、审核状态、地图回链、响应式视口、键盘可访问性和 Reduced Motion。文档与验证记录见 `LESSON_PLAYER.md`、`LESSON_PLAYER_DATA_FLOW.md`、`LESSON_CONTENT.md` 与 `LESSON_SESSION.md`。

PHASE 8 的停止点已经完成；PHASE 9 在其后作为独立题目与 Assessment 阶段执行。

## 26. PHASE 9 Question Engine / Assessment

PHASE 9.1～9.4 已完成并验证。它把 LessonPlayer 的 Practice 入口接入一个独立、固定、可恢复的练习闭环：

```text
LessonPlayer Practice
  ↓
AssessmentLaunchContext
  ↓
QuestionEngineStore
  ↓
QuestionEngineAdapter
  ↓
QuestionRepository + QuestionSessionStorage
  ↓
QuestionEngineViewModel
  ↓
QuestionRenderer
  ↓
确定性 Answer Validator
  ↓
QuestionAttemptResult / AssessmentResultSummary
  ↓
返回 LessonPlayer
```

### 26.1 已实现范围

- Question 通过 `QuestionKnowledgePoint` 关系关联知识点；`QuestionBase.stem`、`QuestionOption.content`、提示、解析和媒体继续使用结构化 `ContentBlock[]` / `mediaAssetId`。
- 支持 `singleChoice`、`multipleChoice`、`trueFalse`、`fillBlank`、`calculation` 和 `shortAnswer` 六类题型；Demo Assessment 使用六道原创 SAMPLE 题并保持固定顺序，不随机抽题、不按难度动态改题。
- `QuestionSession` 独立保存草稿、提交状态、`QuestionAttempt`、题目版本和结果；本地存储可恢复，损坏或孤儿数据安全清理 / 归一化。
- 判题是纯确定性规则：选择题精确匹配、多选集合无序匹配、填空按题目规则规范化、计算题支持精确值 / 容差；简答题只标记 `manual_review_required`，不做 AI 评分。
- LessonPlayer 只负责发出显式 `AssessmentLaunchContext`、接收完成回链和展示练习摘要；Assessment 分数不会写入 `MasteryEvent`、`KnowledgeMastery`、`KnowledgeEnergy`、`WrongQuestion` 或 `Reward`。
- 正式入口继续执行独立 Question 审核闸门；SAMPLE / UNVERIFIED 只能在开发路由显式展示，并带有来源状态警示。

### 26.2 本阶段明确不实现

PHASE 9 当时不实现 `MasteryScore`、`KnowledgeEnergy`、Adaptive Learning、AI Learning Path、WrongBook、Reward、AI Question Generation、AI Grading、题目随机抽取、难度自适应或正式考试系统。PHASE 9 的停止点已在后续明确授权后进入 PHASE 10；本节不改变 PHASE 9 的历史边界。

### 26.3 验收与停止点

已验证六类题型输入、提交锁定、结果反馈、结构化内容与媒体回退、Session 恢复、错误 / 空态 / 未开放 / Sample / Unverified Showcase、LessonPlayer → Assessment → LessonPlayer → LearningMap 闭环、键盘与语义化无障碍、Reduced Motion 和 `375`、`390`、`430`、`768`、`1024`、`1440` 视口。实现与测试记录见 `QUESTION_ENGINE.md`、`QUESTION_SESSION.md`、`QUESTION_VALIDATION.md`、`ASSESSMENT.md`、`LESSON_PLAYER.md` 和 `ARCHITECTURE.md`。

## 27. PHASE 10 Mastery Model / Knowledge Learning State

PHASE 10.1～10.4 已完成并停止。它只把已完成 QuestionSession 中的可判定作答转成可追溯的 `LearningEvidence`，再通过确定性 `MasteryEngine` 重算独立 `MasteryRecord`：

```text
QuestionSession completed
  ↓
MasteryProcessingService
  ↓
LearningEvidence extraction
  ↓
MasteryRepository / evidence storage
  ↓
Deterministic MasteryEngine
  ↓
MasteryRecord
  ↓
MasteryStore / optional map and node-detail presentation
```

### 27.1 已实现与已验证

- `masteryScore` 只表示当前已有学习证据；删除时间型 `recentDecay`，日期流逝、遗忘与复习提醒不修改该分数。
- 保留 `MasteryEvent` 七种事件模型作为兼容契约；PHASE 10 的实际输入链来自 `QuestionAttempt`、`Question`、`QuestionKnowledgePoint` 和难度，不由 Lesson / Map / Assessment completion 直接产生。
- 题目知识点权重必须满足 `0 < weight <= 1`，同题关系权重总和约等于 `1`；一道题可以为多个知识点分别产生证据。
- `manual_review_required`、未提交题、未完成 Session、孤儿题目和缺少映射只产生诊断，不产生正确 / 错误掌握证据。
- `MasteryRecord` 按 `studentProfileId + knowledgePointId` 隔离，保存 `masteryScore`、`confidence`、`state`、证据统计、`algorithmVersion` 和 SAMPLE / 来源状态。
- 解析、聚合、重算、存储和重复 Session 处理均为确定性、幂等流程；`masteryStorage` 与 Question / Lesson / Map 存储独立。
- 地图继续独立维护完成度、节点状态、前置解锁和主题；掌握度仅作为可选展示投影，不改变地图主链。
- `/dev/mastery` 提供 `not_started`、`weak`、`learning`、`mastered`、低置信度高分和混合来源的开发 Showcase，并明确 SAMPLE / UNVERIFIED 警示。

### 27.2 明确不在 PHASE 10

PHASE 10 不实现 Adaptive Learning、按掌握度自适应选题或难度、AI 生成 / 判题、WrongBook、Review Scheduling、Spaced Repetition、KnowledgeEnergy、Reward / Coins / XP / Achievement / Streak / Leaderboard、家长 / 教师看板、AI Tutor、个性化学习路径或 ML / Bayesian 模型。`perfect` 和 `review` 不是本阶段的正式 `KnowledgeLearningState`。

`masteryScore = 92` 与未来 `knowledgeEnergy = 30` 的解释应为“曾经掌握很好，但需要复习”，而不是“掌握能力自动下降”。KnowledgeEnergy 仍属于后续独立设计域。

### 27.3 PHASE 10 停止条件

PHASE 10 已完成并停止；PHASE 11 作为独立的只读策略阶段执行，不改变本阶段的掌握度事实、算法版本或存储边界。

## 28. PHASE 11 Learning Strategy

PHASE 11.1～11.4 已实现并验证。它使用 `MasteryRecord`、已审核的课程 / 地图关系和已有地图状态，生成当前学习动作：继续当前知识点、建议巩固、补充证据、进入下一知识点或安全空状态。策略版本独立为 `STRATEGY_V1`，不与 `MASTERY_V1` 混用。

- Home、Assessment 完成页和 LearningMap 只展示轻量 `LearningRecommendationCard`；`/dev/strategy` 展示固定 SAMPLE / UNVERIFIED 情境。
- Strategy 不修改 `MasteryRecord`、`LearningEvidence`、`QuestionSession`、地图完成度、节点解锁或前置关系；`locked` 节点不能成为下一知识点。
- 生产 `profile` 遇到 `SAMPLE`、`UNVERIFIED`、`REJECTED` 或样本派生来源时返回安全空状态；开发数据保留警示，不代表正式建议。
- Review 仅表示当前巩固动作，不是复习日程；不读取当前时间、复习间隔、记忆衰减、KnowledgeEnergy、奖励或连续学习状态。

PHASE 11 已完成并停止；PHASE 12 在不改变 Strategy 规则的前提下接入 History、WrongBook 和 Review Queue。实现与策略事实见 `LEARNING_STRATEGY.md`、`REVIEW_STRATEGY.md`、`STRATEGY_DATA_FLOW.md` 和 `PHASE12.md`。

## 29. PHASE 13 Reward / KnowledgeEnergy / Achievement Growth

PHASE 13 已完成并停止。孩子完成课程、练习、主动巩固、错题解决，或首次达到 mastered 状态后，系统会生成确定性的 `RewardEvent`，再聚合为 KnowledgeEnergy、Growth progress 和 Achievement progress。它回答“完成学习以后获得了什么成长反馈”，不回答“下一步学什么”。

- Reward 只读取完成学习事实；打开页面、浏览 History / WrongBook、点击、刷新和开始学习不产生奖励。
- `REWARD_V1` 只发放 KnowledgeEnergy：课程 10、练习 5、掌握知识点 15、巩固 8、解决错题 6；不按正确率制造惩罚。
- KnowledgeEnergy 只能从 RewardEvent 重建，第一版不消费；Growth 使用 `GROWTH_V1` 阈值 `0 / 50 / 120 / 220 / 350`，不参与课程解锁或掌握度计算。
- `ACHIEVEMENT_V1` 只包含完成学习 / 练习、掌握知识点、完成巩固、解决错题和累计能量等固定里程碑，不包含 Streak、签到、连胜、时间段或随机条件。
- 正式 `/achievements` 过滤 SAMPLE；`/dev/reward` 使用固定 SAMPLE 夹具并显示来源警示。Reward、Growth、Achievement 不修改 Mastery、Strategy、LearningMap、Review Queue、WrongBook 或 QuestionEngine。

实现和停止点见 `PHASE13.md`、`REWARD_DATA_FLOW.md`、`GROWTH_DATA_FLOW.md` 和 `ACHIEVEMENT_DATA_FLOW.md`。PHASE 13 完成后进入 PHASE 14；PHASE 14 完成后进入当前 PHASE 15。

## 30. PHASE 14 Home Productization / Daily Learning Loop

PHASE 14 把已有学习事实汇聚成孩子打开应用后能立即理解的首页：先看到“今天学什么”，再通过 1～3 个 Daily Plan 任务进入 Continue、Review、Reinforce、Wrong Question 或 Next Learning。任务完成后回到 Home，首页从各自领域事实刷新状态、今日进度和成长反馈。

- Home 是 Application / Product Aggregation Layer，不拥有 Curriculum、LearningMap、Mastery、Strategy、WrongBook、Review Queue、Reward 或 Achievement 事实。
- Daily Plan 使用 `DAILY_PLAN_V1`，默认最多 3 项；任务选择、优先级、KnowledgePoint 去重和 snapshot identity 是确定性的，不创建第二套 Strategy。
- Lesson、Assessment、WrongBook 和 Review Queue 的 CTA 都带显式上下文 / focus query；Home 不把点击本身当成完成，也不覆盖原始 Session / Attempt。
- `/home` 是正式首页，`/tasks` 是今日学习入口，`/dev/home` 是固定样本 Showcase。正式首页过滤 SAMPLE / UNVERIFIED / REJECTED，开发首页保留来源提示。
- Home、Daily Plan 和既有领域存储保持独立；Daily Plan 损坏时安全回退并提示，不影响课程、作答、掌握度或成长事实。

PHASE 14 的页面与数据流实现见 `PHASE14.md`、`DAILY_PLAN_DATA_FLOW.md` 和 `HOME_DATA_FLOW.md`。本阶段完成后进入当前 PHASE 15；历史阶段文档 `PHASE14.md` 保留当时的验收记录。

## 31. PHASE 15 Parent Dashboard / Learning Report

PHASE 15 在孩子端闭环之上增加家长侧只读报告。`ParentReportService` 从 LearningHistory、MasteryRecord、`STRATEGY_V1` 读取结果、WrongBook、Review Queue、Daily Plan、Reward / Growth 和 Achievement 聚合出 `PARENT_REPORT_V1`，再由 `ParentReportStore` 提供筛选状态和 `ParentDashboardPage` 呈现。

家长报告回答“最近学了什么、哪些知识需要继续巩固、错题和复习情况如何、有哪些已发生的成长反馈”，不回答“应该怎样改变孩子的学习”。它不拥有也不写入 Mastery、Strategy、Daily Plan、WrongBook、Review Queue、Reward、Achievement、Question 或 Curriculum 事实；报告读取不会产生新的 History、Evidence、Attempt 或完成事件。

- 正式入口为 `/parent`，开发 Showcase 为 `/dev/parent-dashboard`；开发页的 Full / Empty / Sample / Unverified / Weak-heavy / No WrongBook / No Review / Error / Partial 场景只用于验证页面状态。
- 支持最近 7 天、最近 30 天和全部记录，以及学科筛选。日期范围使用用户本地日历，报告 ID 按 Profile、范围和 `PARENT_REPORT_V1` 确定性生成。
- 报告显示掌握状态分布和具体知识点掌握度，不生成语文学科 / 数学学科综合分，不伪造学习时长，不把成长等级解释成学习质量，也不做成绩、能力或升学预测。
- 正式入口过滤 SAMPLE / UNVERIFIED / REJECTED 与样本派生事实；开发数据显式显示来源提示。开发完整报告使用内存夹具，不通过打开家长页写入孩子端事实存储。
- 本地只持久化报告范围和学科筛选偏好，载荷使用 schemaVersion 1、Zod 校验和损坏回退；不新增账号、云端、外部追踪、导出、分享、AI 总结或同龄比较。

实现与数据流见 `PHASE15.md`、`PARENT_REPORT.md`、`PARENT_DASHBOARD.md`、`PARENT_REPORT_DATA_FLOW.md` 和 `REPORT_PRIVACY.md`。PHASE 15.4 完成后停止，不进入 PHASE 16。

## 32. PHASE 16 Real Curriculum Data / Production Readiness / MVP Release

PHASE 16 是当前 MVP 主线的最终阶段，目标是让“可运行”与“可发布”有清晰边界。产品正式范围由 `MVP Curriculum Scope` 显式定义，不因为仓库里存在 SAMPLE fixtures 就扩大范围。

- 当前 Scope 目标为深圳小学 2026—2027 学年；已登记 1 条候选调查项，正式 `RELEASED` 条目为 0。
- Golden 三年级数学上册 PEP framework 仍为 `UNVERIFIED`；没有可靠当前选用关系、原书版次/版权证据和人工审核记录时，不进入生产。
- 正式 Curriculum 只允许 `REVIEWED + ACTIVE`，正式 Lesson Content / Question 只允许 `REVIEWED + PUBLISHED`，来源和版权必须独立通过。
- Onboarding 只读取已发布 Scope；没有已发布教材时显示安全的不可用/空状态，不向生产用户展示候选教材再让其进入死路。
- SAMPLE、UNVERIFIED、VERIFIED 和候选数据继续用于开发、导入、差异检测和回归，但不计入正式覆盖和发布数量。

PHASE 16 不改变 `MASTERY_V1`、`STRATEGY_V1`、`DAILY_PLAN_V1` 或 `PARENT_REPORT_V1`，不新增 AI 生成/审核、复习排程、账号、云同步、Teacher Dashboard、商业化或社交功能。当前 Release Decision 为 `NOT_READY`；阻断项和人工后续工作见 `MVP_RELEASE_REPORT.md`。PHASE 16 完成后停止，不进入 PHASE 17。

## 33. CONTENT SYSTEM EXPANSION 01 Experience Layer

CONTENT SYSTEM EXPANSION 01 为 KnowledgePoint 增加可验证的体验层：学习内容、互动活动、受约束练习模板、拓展活动和挑战。它是内容系统扩展，不是新的课程层级，也不把活动配置写回 Textbook、Unit、Lesson 或 KnowledgePoint。

已实现：

- 12 类 InteractiveActivity registry，其中 `drag_match`、`drag_classify`、`sort_order`、`number_line`、`select_region`、`simulation` 首批可用，其余类型安全占位。
- 触摸 / 鼠标 Pointer Events、按钮和键盘替代、明确文字反馈、响应式和 Reduced Motion。
- G1 Math 的 8 类确定性 ExerciseTemplate，以及 `GENERATED_FROM_VERIFIED_TEMPLATE` Question adapter。
- PracticeSet 的基础 / 巩固 / 应用模式，独立 ExtensionActivity、Challenge 和 KnowledgePoint Hub。
- 4 个 G1 Math Golden 知识点夹具：每个有 2 个 LearningContent blocks、2 个活动、3 组练习、1 个拓展和 1 个挑战。

当前 Golden 内容全部为 `SAMPLE + UNVERIFIED`，只在 `/dev/activity-engine` 和 `/dev/content-expansion` 显式展示；正式 profile 不读取。互动完成不等于掌握度，模板生成不等于正式答题，Practice 也不自动修改地图解锁、Mastery、Strategy、Daily Plan、Reward 或 ParentReport。

本阶段明确不进入 Grade 2 或 PHASE 17，也不修改：

```text
MASTERY_V1: NO
STRATEGY_V1: NO
DAILY_PLAN_V1: NO
PHASE 17: NO
```

扩展契约、Golden 清单和审核前置条件见 `CONTENT_SYSTEM_EXPANSION_01.md`、`INTERACTIVE_ACTIVITY_ENGINE.md`、`EXERCISE_TEMPLATE_ENGINE.md`、`PRACTICE_SYSTEM.md` 和 `GOLDEN_CONTENT_G1_MATH.md`。
