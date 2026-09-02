# 知识岛｜PHASE 3 页面规格

> 本文档是 Vue 3 工程的 UI / UX 页面设计依据。它定义页面目标、用户、信息层级、布局、CTA、组件、状态、响应式和跳转关系；其中 PHASE 7 LearningMap、PHASE 8 LessonPlayer、PHASE 9 Question Engine 与 PHASE 10 Mastery 展示已实现并验证，其余页面仍以设计规格为准。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 10.4：Mastery 展示验证（继承 PHASE 3 页面规格） |
| 状态 | PHASE 3 设计基线；PHASE 7 LearningMap、PHASE 8 LessonPlayer、PHASE 9 Question Engine / Assessment 与 PHASE 10 Mastery 结果展示已实现并验证，其他目标页面仍按设计状态管理 |
| 上游事实源 | `PRODUCT.md`、`CURRICULUM.md`、`DATA_MODEL.md`、`QUESTION_SCHEMA.md`、`CONTENT_REVIEW.md` |
| 相关设计文档 | `DESIGN_SYSTEM.md`、`RESPONSIVE_DESIGN.md`、`QUESTION_UI.md`、`UI_FLOW.md`、`ONBOARDING_DESIGN.md` |
| 页面数据原则 | 课程配置和教材信息只读取数据层；UI 不猜测地区、出版社或教材版本 |

---

## 1. 页面共用契约

每个页面进入工程前必须明确以下 9 项：

1. 页面目标。
2. 目标用户。
3. 信息优先级。
4. 布局与主要区域。
5. 唯一主 CTA 与次 CTA。
6. 业务组件与基础组件。
7. 正常、加载、空、错误、离线、锁定、完成、禁用、Hover、Focus、Active 等状态。
8. Desktop / Tablet / Mobile 的变化。
9. 进入、返回、保存和异常跳转。

页面不得把后台审核枚举直接呈现给儿童，也不得用前端固定字符串替代课程事实。所有教材名称、出版社、年级、学期和地区显示值来自 `Region`、`Publisher`、`TextbookVersion`、`Grade`、`Semester` 与 `StudentCurriculumProfile` 的读取结果。

### 1.1 共用状态字典

| 状态 | 学生端表达 |
| --- | --- |
| `loading` | 知识团子轻动作 + “正在准备内容” |
| `empty` | 原创插画 + 解释 + 下一步动作 |
| `error` | “内容没有加载出来” + “再试一次” |
| `offline` | “网络暂时不可用”；有缓存时允许继续已下载内容 |
| `locked` | `Lock` + 可理解解锁条件 |
| `completed` | `CheckCircle` + 完成文案 + 下一步 |
| `disabled` | 说明原因，如“即将开放” |
| `focus` | 清晰 Focus ring，不只改变颜色 |
| `active` | 当前页面、节点或卡片的图标、边框和文案状态 |

课程配置额外支持：`REGION_NOT_SUPPORTED`、`TEXTBOOK_NOT_FOUND`、`MULTIPLE_TEXTBOOKS`、`TEXTBOOK_NEEDS_CONFIRMATION`、`NO_DEFAULT_TEXTBOOK`、`GRADE_NOT_AVAILABLE`。禁止显示 `404`、`No Data`、`Null`、`Undefined`。

### 1.2 课程配置的事实边界

```text
Region：回答“在哪里学习？”
Publisher：回答“谁出版？”
TextbookVersion：回答“使用哪套课本？”
```

正确文案是“所在地区”“广东省”或“北京市”，然后进入“确认一下你的课本”。禁止写成“选择地区：人教版”。

- `resolveAvailableTextbooks(regionId, gradeId, semesterId)` 是确定性数据读取，不由 UI 推断。
- 语文、数学、英语分别显示和确认，三科可以使用不同版本。
- 一个地区可以返回多个教材版本；多版本必须让用户确认。
- 没有可核验关系时允许手动选择，禁止随机、默认猜测或 AI 推断。
- 课程主题如“计算工厂”是游戏世界名；真实教材单元名称必须单独展示并来自课程事实。

---

## 2. 页面总览

| 页面 ID | 用户任务 | 主 CTA | 进入方式 |
| --- | --- | --- | --- |
| `OnboardingWelcome` | 了解开场并开始课程配置 | 开始设置 | 首次进入 |
| `RegionSelect` | 选择所在地区 | 下一步 | Welcome 或学习设置 |
| `GradeSelect` | 选择当前年级 | 下一步 | RegionSelect 或学习设置 |
| `TextbookConfirm` | 确认三科教材 | 确认并继续 | GradeSelect 后解析 |
| `TextbookVersionSelector` | 选择某一科的完整教材版本 | 选择此版本 | TextbookConfirm / 设置 |
| `CharacterSetup` | 选择知识团子外观 | 出发去知识岛 | TextbookConfirm |
| `OnboardingComplete` | 检查配置并进入首页 | 进入知识岛 | CharacterSetup |
| `Home` | 找到今日学习入口 | 继续学习 | 已完成配置后默认入口 |
| `LearningMap` | 选择下一个地图节点 | 开始 / 继续关卡 | Home 或学科入口 |
| `Lesson` | 学习当前知识重点 | 继续 / 我会了 | MapNode |
| `Question` / `Assessment` | 完成固定题目集合 | 提交 / 下一题 / 完成本次练习 | Lesson / Practice |
| `Result` | 理解结果并决定下一步 | 继续下一关 | Question 完成 |
| `DailyTasks` | 完成当日任务组合 | 开始任务 | Home / 导航 |
| `WrongBook` | 找到需要复习的内容 | 重新挑战 | 导航 / 复习提醒 |
| `Profile` | 查看角色、成长和学习入口 | 查看学习设置 | 导航 |
| `Character` | 管理角色装扮 | 保存装扮 | Profile |
| `Achievements` | 查看成就与条件 | 查看成就 | Profile |
| `ParentDashboard` | 查看学习趋势 | 查看详情 | 账户区域 |
| `CurriculumSettings` | 查看或修改课程上下文 | 修改对应项 | Profile → 我的学习设置 |
| `Settings` | 管理通用偏好和帮助 | 保存设置 | Profile |

### 2.1 目标用户映射

| 页面范围 | 目标用户 |
| --- | --- |
| `OnboardingWelcome`、`RegionSelect`、`GradeSelect`、`TextbookConfirm`、`TextbookVersionSelector`、`OnboardingComplete`、`CurriculumSettings` | 学生；允许家长陪同确认 |
| `CharacterSetup`、`Home`、`LearningMap`、`Lesson`、`Question`、`Result`、`DailyTasks`、`WrongBook`、`Profile`、`Character`、`Achievements` | 学生 |
| `ParentDashboard` | 家长 |
| `Settings` | 学生；家长可协助通用设置 |

---

## 3. 首次课程配置页面

### 3.1 OnboardingWelcome

**目标**：以游戏开场的方式说明“先设置学习世界，再出发”，不让学生感觉正在填写后台表单。

**目标用户**：首次使用的学生；家长可以陪同。

**信息优先级**：

1. 知识岛和知识团子主视觉。
2. 一句简短欢迎语。
3. 需要完成的四步：地区、年级、教材、角色。
4. 开始动作和家长协助入口。

**布局**：居中主卡片，角色和抽象岛屿插画作为背景层；不使用大面积渐变。轻量进度显示 `1 / 4` 和“地区 · 年级 · 教材 · 角色”。

**主 CTA**：`开始设置`。

**次 CTA**：`请家长帮我设置`（只做入口，不实现家长账号联动）；若已有未完成草稿，显示 `继续上次设置`。

**组件**：`OnboardingProgress`、`CharacterAvatar`、`AppButton`、`AppIcon`、`AppCard`。

**状态**：`normal`、`draft-resume`、`offline`、`focus`。

**响应式**：Desktop / Tablet 使用居中大卡片；Mobile 一屏一主视觉和一个主 CTA，进度信息保持轻量。

**跳转**：主 CTA → `RegionSelect`；返回或关闭仅在存在草稿时保留草稿并给出恢复入口，不丢失已选地区或年级。

**异常**：如果课程配置读取失败，不阻塞欢迎内容；显示“稍后也可以继续设置”并允许重试，但未完成配置不能进入正式学习首页。

### 3.2 RegionSelect

**目标**：让学生回答“你在哪里学习？”，选择 `regionId`，不把地区和出版社混为一项。

**目标用户**：学生；家长可以帮助选择。

**信息优先级**：

1. 页面问题：“你在哪里学习？”
2. 当前搜索 / 选择路径。
3. 推荐或最近地区。
4. 省份列表；当数据支持时显示城市列表。
5. 选择状态与下一步。

**布局**：

- Desktop：搜索框 + 推荐 / 最近地区；双栏展示省份和城市。右栏只在真实数据提供城市时出现。
- Tablet：大尺寸 `RegionCard`，Landscape 可双栏，Portrait 单列或两列卡片。
- Mobile：逐级页面，省 → 城市 → 确认；MVP 只有省级时只展示省级数据和文案，不预告城市能力。

**主 CTA**：`下一步`，未选择时禁用并保留原因“先选一个所在地区”。

**次 CTA**：`返回`；`换个方式查找` 可以聚焦搜索框，不新增后台 Cascader。

**组件**：`OnboardingProgress`、`RegionSelector`、`RegionCard`、`UnsupportedRegionState`、`AppEmptyState`、`AppLoading`。

**状态**：`NORMAL`、`SEARCHING`、`NO_RESULT`、`REGION_NOT_SUPPORTED`、`LOADING`、`ERROR`、`OFFLINE`、`focus`。

**跳转**：

- 选择地区 → 进入下一级或启用 `下一步`。
- 已有城市数据时省份 → 城市；城市确认 → `GradeSelect`。
- MVP 省级数据时直接 → `GradeSelect`。
- `REGION_NOT_SUPPORTED` → `选择其他地区`，不进入空课程。

**异常与文案**：

- 无结果：“没有找到这个地区，换个关键词试试。”
- 暂未支持：“这个地区的课程还在准备中。” CTA：`选择其他地区`。
- 网络异常：“地区列表没有加载出来。” CTA：`再试一次`。
- 不出现省 / 市 / 区后台级联器作为默认主交互。

### 3.3 GradeSelect

**目标**：选择当前 `gradeId`，让学生回答“你现在几年级？”。

**目标用户**：首次使用的学生。

**信息优先级**：问题文案、六个年级卡片、当前支持状态、下一步。

**布局**：六张大型 `GradeCard`，每张显示大号数字、年级名称和简单原创几何 / 插画。不得用 Select Dropdown 作为儿童端主要交互。

**主 CTA**：`下一步`。

**次 CTA**：`返回`。

**组件**：`GradeSelector`、`GradeCard`、`OnboardingProgress`、`AppButton`。

**状态**：`normal`、`selected`、`GRADE_NOT_AVAILABLE`、`loading`、`error`、`focus`。

**MVP 规则**：三年级卡片标记 `当前支持`；未实现的其他年级标记 `即将开放`，不可进入空页面。`GRADE_NOT_AVAILABLE` 状态提供“先看看支持的年级”或返回地区的路径。

**响应式**：Desktop 2～3 列；Tablet 保留大卡片和触控间距；Mobile 单列或两列但卡片高度足够单手点击，不缩小成下拉框。

**跳转**：选择有效年级 → 确定学期（MVP 默认上下册由数据层或配置提供）→ 调用 `resolveAvailableTextbooks` → `TextbookConfirm`。年级切换从设置进入时复用此页，但保留历史进度。

### 3.4 TextbookConfirm（TextbookConfirmPage）

**目标**：显示数据层解析出的三科教材，邀请学生 / 家长逐科确认。

**目标用户**：学生，家长可参与确认。

**信息优先级**：

1. “确认一下你的课本”。
2. 当前年级、学期和地区摘要。
3. 语文、数学、英语三张教材卡。
4. 需要确认的学科及“更换版本”。
5. 家长协助入口和主 CTA。

**布局**：Desktop 三列或两列 + 一列；Tablet 大卡片；Mobile 三张卡片纵向排列。页面不展示技术 ID。

**每张 `TextbookCard` 必须显示**：

- `Subject Icon` 与学科名称。
- `Publisher.officialName` 或数据层提供的显示名。
- `TextbookVersion.versionName` 完整名称；不能只显示“某某版”作为唯一名称。
- `Grade.name` 和 `Semester.name`，如“三年级 · 上册”。
- 版次 / 年份（有数据才显示）。
- `更换版本` 或 `选择教材`。
- `TEXTBOOK_NEEDS_CONFIRMATION`、`推荐` 等数据状态。

**主 CTA**：`确认并继续`。三科都必须有已确认版本；未确认学科时按钮解释原因。

**次 CTA**：`返回修改年级`、`请家长帮我确认`、`怎么看我的教材版本？`。

**组件**：`OnboardingProgress`、`TextbookCard`、`TextbookVersionSelector`、`CurriculumSummary`、`AppBottomSheet` / `AppModal`、`AppButton`。

**状态**：`loading`、`normal`、`MULTIPLE_TEXTBOOKS`、`NO_DEFAULT_TEXTBOOK`、`TEXTBOOK_NOT_FOUND`、`TEXTBOOK_NEEDS_CONFIRMATION`、`error`、`offline`、`focus`。

**数据边界**：页面只能展示 `resolveAvailableTextbooks` 返回的候选集和推荐依据。不得依据地区名称、出版社常识、地图主题或 UI 排序自行拼教材名。

**多版本行为**：

- 某学科多个 `SUPPORTED` / `OPTIONAL` 版本 → 显示“这里有几种课本版本，请确认你正在使用哪一本”，可打开选择器。
- 只有一个有效 `DEFAULT` → 可以展示“系统推荐”，但首次确认仍保留用户确认动作。
- 无 `DEFAULT` → 显示 `NO_DEFAULT_TEXTBOOK`，引导查看封面或出版社并手动选择。
- 没有可用候选 → `TEXTBOOK_NOT_FOUND`，保留手动确认入口，但不得随机选择或猜测。
- 某一科切换只更新该科的 profile 字段，不能覆盖另外两科。

**跳转**：三科确认 → 写入 `StudentCurriculumProfile` 草稿 → `CharacterSetup`；返回地区 / 年级会重新解析并刷新候选，不静默覆盖已保存档案。

### 3.5 TextbookVersionSelector

**目标**：让用户在单一学科范围内从多个数据层候选中选择完整教材版本。

**信息优先级**：学科上下文、完整教材名称、出版社、年级 / 学期、适用范围、版次 / 年份、版本说明、推荐状态。

**布局**：Desktop 使用 Modal 或右侧 Drawer；Tablet 使用大 Modal；Mobile 使用 BottomSheet 或全屏选择页，每项可单手点选。

**主 CTA**：`选择此版本`。

**次 CTA**：`取消`、`怎么看我的教材版本？`。

**组件**：`TextbookVersionSelector`、`TextbookCard`、`AppModal`、`AppBottomSheet`、`AppIcon(BookOpen / Library / BookMarked)`。

**状态**：`loading`、`normal`、`selected`、`empty`、`TEXTBOOK_NOT_FOUND`、`error`、`focus`。

**约束**：选择器必须接收 `subjectId` 和候选版本，不允许自己请求或推断另一个学科；完整名称从 `TextbookVersion` 和 `Publisher` 数据读取。

选择器中的“适用范围”如果需要展示，只能是当前 `RegionTextbookRelation` 的派生读取结果，不是 `TextbookVersion` 上的权威 `regionScope` 字段。

### 3.6 CharacterSetup

**目标**：选择知识团子基础外观，让配置流程从“课本确认”转为“出发探险”。

**目标用户**：学生。

**信息优先级**：知识团子预览、少量装扮选择、角色名称（若产品决定开放）、出发 CTA。

**主 CTA**：`出发去知识岛`。

**次 CTA**：`稍后再选`（采用默认原创占位外观，不影响课程配置）。

**组件**：`CharacterAvatar`、`AppCard`、`AppButton`、`OnboardingProgress`。

**状态**：`normal`、`loading`、`selected`、`offline`、`focus`。

**响应式**：Desktop / Tablet 角色预览与选项双栏；Mobile 角色预览在上、装扮选项在下，选项横向不超过可读宽度。

**跳转**：主 CTA → `OnboardingComplete`；角色装扮只影响视觉，不影响题目、难度、答案、解锁和公平性。

### 3.7 OnboardingComplete

**目标**：在进入首页前给出一次轻量回顾，并确保 profile 已保存。

**信息优先级**：知识团子、所在地区、年级 / 学期、语文 / 数学 / 英语教材摘要、出发 CTA。

**主 CTA**：`进入知识岛`。

**次 CTA**：`返回修改教材`。

**组件**：`CurriculumSummary`、`CurriculumProfileCard`、`CharacterAvatar`、`AppButton`。

**状态**：`normal`、`saving`、`save-error`、`offline`。

**保存规则**：在进入 Home 前确认三科教材字段均已确认并写入 `StudentCurriculumProfile`；保存失败时保留草稿并提供重试，不进入缺少课程上下文的学习首页。

**跳转**：成功保存 → `Home`；返回 → `TextbookConfirm`；关闭不丢草稿。

---

## 4. 核心学习页面

### 4.1 Home

**目标**：约 3 秒知道今天学什么，约 10 秒进入学习。

**目标用户**：已完成课程配置的学生。

**信息优先级**：`继续学习` > `今日任务` > 三个学科世界 > XP / 星星 / 金币。

**布局**：知识岛主场景 + `StudentHeader` + 主任务卡 + 今日任务 + 三个 `SubjectIsland` / `SubjectCard`。不使用左侧后台菜单、右侧数据表或八张白卡片。

**主 CTA**：`继续学习`。

**次 CTA**：`查看今日任务`、`进入地图`。

**组件**：`StudentHeader`、`CharacterAvatar`、`DailyMissionCard`、`SubjectCard`、`AppProgress`、`AppIcon`。

**状态**：`normal`、`loading`、`empty`（暂无任务时给出可开始的学科入口）、`offline`（有缓存时继续）、`error`。

**响应式**：Desktop 大场景和主任务并列；Tablet Landscape 场景 + 任务双栏，Portrait 主任务 + 两列学科；Mobile 单列，顶部只显示头像、昵称、`三年级 · 上册`，底部导航固定。

**教材上下文**：SubjectCard 可显示小型教材版本标签，但不能比“继续学习”更突出；点击 StudentHeader 的年级 / 学期进入 `CurriculumSettings`。

**跳转**：继续学习 → 当前 `LearningMap` / `Lesson`；学科 → `LearningMap`；任务 → `DailyTasks`；底部导航 → 对应主页面。

### 4.2 LearningMap

**目标**：用路径式地图表达“我在哪里、下一步是什么”，不替代教材事实。

**信息优先级**：学科世界 + 游戏主题、当前位置、可用节点、锁定原因、当前教材摘要、主 CTA。

**布局**：地图场景占主区域；顶部区分“数学世界 / 计算工厂”和“三年级 · 上册 · [数据层教材名]”；底部或侧边显示当前节点说明。

**主 CTA**：`开始关卡` 或 `继续学习`。

**次 CTA**：`查看节点说明`、`返回首页`。

**组件**：`LearningMap`、`MapPath`、`MapNode`、`MapNodeTooltip`、`CharacterAvatar`、`AppIcon`。

**状态**：`loading`、`normal`、`locked`、`inProgress`、`completed`、`perfect`、`empty`、`error`、`offline`、`focus`。

**响应式**：Desktop 横向大地图，支持拖动、滚轮平移和缩放；Tablet 支持触控拖动和缩放；Mobile 使用纵向地图，当前节点优先居中，不强制双指操作。

**事实边界**：游戏场景名、角色路径和节点文案属于 UI 配置；真实教材单元名称、知识点和教材版本必须来自课程事实。

### 4.3 Lesson

**目标**：每屏聚焦一个学习重点，完成知识讲解、互动示例和练习入口。

**目标用户**：当前关卡学生。

**信息优先级**：返回 / 关卡标题 / 进度、当前知识点、内容块、一个例子、主操作。

**布局**：`LessonPlayer` 中央内容；可有角色和媒体。避免复杂课程树和整页教材正文。

**主 CTA**：`继续`、`下一步` 或 `我会了`，由步骤配置提供。

**次 CTA**：`再讲一次`、`返回地图`。

**组件**：`LessonPlayer`、`LessonStep`、`KnowledgeCard`、`CharacterAvatar`、`AppProgress`、`AppButton`。

**状态**：`loading`、`normal`、`completed`、`empty`、`not_available`、`error`、`resume`、`sample`、`unverified`、`focus`。

**响应式**：Desktop 中央阅读区 + 可选侧边进度；Tablet Landscape 双栏，Portrait 上下布局；Mobile 单列，底部 CTA 避开 Safe Area。

### 4.4 Question

**目标**：在统一 `QuestionShell` 中完成不同题型互动，确保题干、媒体、作答、提示和提交顺序一致。

**信息优先级**：退出 / 题号 / 进度、结构化题干、交互区、反馈与提示、提交 / 下一题。

**布局**：题干和媒体区在上，题型交互区居中，提示与提交在下；题型差异只发生在交互区。

**主 CTA**：`提交`；反馈后变为 `下一题`。

**次 CTA**：`看看这个提示`、`退出`。

**组件**：`QuestionShell`、`QuestionHeader`、`QuestionProgress`、`QuestionRenderer`、`QuestionHint`、`AnswerFeedback`、`AppButton`。

**状态**：`loading`、`normal`、`selected`、`disabled`、`submitting`、`correct`、`wrong`、`manual_review_required`、`hint`、`empty`、`not_available`、`error`、`completed`、`focus`。

**数据边界**：渲染器只依据 `QUESTION_SCHEMA.md` 的 `questionType`、`ContentBlock[]` 和 `QuestionAnswerRule` 展示与收集作答；不修改正确答案、不推断 normalization、不计算教材归属。具体题型见 `QUESTION_UI.md`，运行时 Assessment 事实见 `QUESTION_ENGINE.md`。

### 4.4.1 Assessment / QuestionEnginePage

**目标**：在一次固定 Assessment 中完成六类已支持题型，并让学生看懂本次作答结果。

**信息优先级**：返回课程、题目来源状态、题号 / 进度、结构化题干、作答区、反馈 / 解析、提交与下一步。

**主 CTA**：未提交时为“提交答案”；已提交后为“下一题”或“完成本次练习”。

**次 CTA**：上一题、返回课程；开发路由额外提供状态 Showcase 和会话清理。

**状态**：`loading`、`ready`、`resume`、`empty`、`not_available`、`invalid_context`、`unsupported_question`、`error`、`completed`、`sample`、`unverified`。

**数据边界**：页面只接收显式 `AssessmentLaunchContext` 和 `QuestionEngineViewModel`；题目顺序来自 `AssessmentDefinition.questionIds`，题目关系来自 `QuestionKnowledgePoint`，不随机抽题、不猜教材、不触发掌握度或奖励。

**响应式**：Desktop 使用居中练习卡片，Tablet 保持可触控题目区，Mobile 使用单列题干 / 输入区和底部固定操作区；375、390、430、768、1024、1440 视口均不得横向溢出。

**跳转**：LessonPlayer Practice → `/assessment`（正式）或 `/dev/question-engine`（开发）；完成后携带 `assessmentCompleted=true`、`focusStep=summary` 返回 LessonPlayer。

### 4.5 Result

**目标**：让学生知道学到了什么、获得了什么、下一步是继续还是复习。

**信息优先级**：关卡完成、知识点、作答表现、奖励、掌握表达、下一步。

**主 CTA**：`继续下一关`。

**次 CTA**：`再练一次`、`去复习`。

**组件**：`RewardPanel`、`MasteryIndicator`、`CharacterAvatar`、`AppButton`、`AppIcon`。

**状态**：`normal`、`saving`、`error`、`offline`。

**反馈规则**：学生端使用“正在学习 / 基本掌握 / 掌握良好 / 已经熟练”；`masteryScore` 不作为首要视觉，不因时间自动下降。知识能量只显示“充足 / 需要复习 / 快来充能”。

---

## 5. 任务、个人与家长页面

### 5.1 DailyTasks

**目标**：让学生理解今天还要做什么和预计剩余时间，不做成成人 ToDo。

**信息优先级**：今日完成度、预计时间、任务卡、继续入口、复习提醒。

**主 CTA**：`开始下一个任务`。

**次 CTA**：按学科筛选、`查看地图`。

**组件**：`DailyMission`、`DailyMissionCard`、`AppProgress`、`CharacterAvatar`。

**状态**：`loading`、`normal`、`empty`、`completed`、`offline`、`error`。

**空状态**：“今天的任务完成啦，想再挑战一关吗？”提供回到地图或复习入口；不显示“没有数据”。

### 5.2 WrongBook

**目标**：以“需要复习”替代“你错了多少道题”，帮助学生重新挑战。

**信息优先级**：需要复习的学科、知识点、复习状态、最近错误、重新挑战。

**主 CTA**：`重新挑战`。

**次 CTA**：学科 / 知识点筛选、查看解析。

**组件**：`WrongQuestionCard`、`KnowledgeEnergy` 状态提示、`AppTabs`、`AppEmptyState`。

**状态**：`loading`、`normal`、`empty`、`completed`、`offline`、`error`。

**空状态**：知识团子 + “这里暂时没有需要复习的题目”。

### 5.3 Profile

**目标**：管理角色、成就、学习记录和学习设置入口。

**信息优先级**：头像 / 角色、当前年级、学习设置、成长摘要、成就和其他入口。

**主 CTA**：`我的学习设置`。

**次 CTA**：`角色装扮`、`成就`、`家长中心`。

**组件**：`StudentHeader`、`CurriculumProfileCard`、`CurriculumSummary`、`CharacterAvatar`、`AchievementCard`。

**状态**：`normal`、`loading`、`error`、`offline`。

**响应式**：Mobile 单列；Desktop / Tablet 可使用两栏，但“我的学习设置”保持清晰入口而不隐藏在技术菜单。

### 5.4 Character

**目标**：查看和更换知识团子装扮。

**信息优先级**：角色预览、当前装扮、可用槽位、保存动作。

**主 CTA**：`保存装扮`。

**次 CTA**：`返回我的`。

**组件**：`CharacterAvatar`、装扮槽位卡、`AppButton`、`AppDrawer` / `AppBottomSheet`。

**状态**：`loading`、`normal`、`selected`、`locked`、`error`、`focus`。

**边界**：装扮只改变视觉，不改变正确率、难度、答案、内容和解锁条件。

### 5.5 Achievements

**目标**：展示个人成长成就，避免全国排行压力。

**信息优先级**：已完成成就、下一项可达成成就、奖励和条件。

**主 CTA**：`查看成就` 或 `去完成`。

**次 CTA**：`返回我的`。

**组件**：`AchievementCard`、`AppProgress`、`AppIcon`。

**状态**：`loading`、`normal`、`empty`、`completed`、`error`。

### 5.6 ParentDashboard

**目标**：让家长查看可解释的学习趋势和薄弱知识点。

**信息优先级**：本周学习时间、三科进展、掌握趋势、薄弱知识点、复习情况、错题情况。

**主 CTA**：`查看详情`。

**次 CTA**：时间范围、学科筛选、教材设置入口。

**组件**：`ProgressBar`、`LineChart`、`BarChart`、`WrongQuestionCard`、`CurriculumSummary`。

**状态**：`loading`、`normal`、`empty`、`error`、`offline`。

**约束**：可显示具体 `masteryScore`，但需同时说明学习证据和复习信号；不把知识能量写成“记忆衰减率”，不使用大型全国排行。

### 5.7 Settings

**目标**：管理通用偏好、动效、音频和帮助，不承载课程配置主流程。

**信息优先级**：动效偏好、音频 / Transcript、通知、帮助与隐私说明。

**主 CTA**：`保存设置`（若设置即时生效则不显示多余保存）。

**次 CTA**：`帮助`、`返回我的`。

**组件**：`AppTabs`、`AppButton`、`AppModal`、`AppIcon`。

**状态**：`normal`、`saving`、`error`、`offline`。

---

## 6. CurriculumSettings：我的学习设置

**目标**：展示并维护学生当前课程上下文，页面名称固定为“我的学习设置”，不使用“系统参数”或“教材配置管理”。

**目标用户**：学生和家长。

**信息优先级**：

1. 所在地区。
2. 当前年级。
3. 当前学期。
4. 语文教材。
5. 数学教材。
6. 英语教材。

**布局**：

- Desktop：左侧 `CurriculumProfileCard` 总览，右侧设置项；教材按学科独立成卡。
- Tablet：大卡片列表，保持每科独立修改动作。
- Mobile：单列摘要卡 + 地区 / 年级 / 学期 / 三科教材列表；每项按钮不小于 44×44px。

**主 CTA**：根据上下文为 `修改地区`、`修改年级` 或某科 `更换版本`；页面本身不设置一个会覆盖全部教材的“统一修改”。

**次 CTA**：`返回我的`、`查看课程说明`。

**组件**：`CurriculumProfileCard`、`CurriculumSummary`、`TextbookCard`、`CurriculumSwitchDialog`、`RegionCard`、`GradeCard`、`AppButton`。

**状态**：`loading`、`normal`、`draft`、`save-error`、`offline`、`error`。

**修改地区**：点击后先显示“更换地区后，可使用的课本版本可能发生变化”，再进入 `RegionSelect` → 解析 → `TextbookConfirm`。取消或返回时保留旧档案，不静默覆盖。

**修改年级**：重新查询语文、数学、英语教材；历史学习记录不删除。页面可预留“当前学习 / 历史学习”的位置，MVP 不要求完整迁移。

**修改单科教材**：例如点击数学只进入数学 `TextbookVersionSelector`；确认弹窗标题为“你正在更换数学课本”，展示当前版本、新版本和影响学科“仅数学”，保存后不改语文和英语。

**跳转**：

```text
Profile → 我的学习设置
  ├─ 修改地区 → RegionSelect → Resolve → TextbookConfirm → Save
  ├─ 修改年级 → GradeSelect → Resolve → TextbookConfirm → Save
  └─ 更换某科 → TextbookVersionSelector → CurriculumSwitchDialog → Save
```

---

## 7. 页面文案与图标规则

### 7.1 推荐文案

| 场景 | 文案 |
| --- | --- |
| 地区 | “你在哪里学习？”、“所在地区” |
| 年级 | “你现在几年级？” |
| 教材 | “确认一下你的课本” |
| 角色 | “选择你的知识团子” |
| 出发 | “出发去知识岛” |
| 正确 | “答对啦” / “你发现规律了” |
| 错误 | “差一点，再试一次” |
| 复习 | “需要复习” / “快来充能” |
| 多教材 | “这里有几种课本版本，请确认你正在使用哪一本” |
| 无地区 | “这个地区的课程还在准备中” |

### 7.2 禁止文案与视觉

- 不出现“选择地区：人教版”。
- 不出现“操作失败”“非法参数”“未满足业务规则”“Game Over”“你太粗心了”。
- 不出现 `404`、`No Data`、`Null`、`Undefined`、`Network Error` 或 Stack Trace。
- 不使用 Emoji；地区使用 `MapPin` / `Map` / `Navigation`，教材使用 `BookOpen` / `Library` / `BookMarked`。
- 不使用商业 IP、复制附件界面、Element Plus 后台视觉或大量白色 Dashboard 卡片。

## 8. 页面验收

1. 首次用户能完成地区 → 年级 → 教材 → 角色并进入知识岛。
2. 地区、出版社、教材版本在每个页面都保持概念分离。
3. 多教材、无默认、无候选和未支持年级都有可恢复状态。
4. 三科教材可以不同；切换数学不改变语文和英语。
5. 切换地区或年级会重新解析并让用户确认，不静默覆盖旧配置。
6. 首页不会堆满地区、出版社、版本年份等元数据。
7. 所有页面具备 Desktop、Tablet、Mobile 设计差异和 Focus / 触控规则。
8. 页面使用统一 `QuestionShell`、`AppButton`、`AppCard`、`AppIcon` 和状态表达。
9. 教材相关页面只展示数据层返回的信息，不自行拼接或猜测教材事实。
10. 未进入 PHASE 7～9 范围的页面规格仍停留在设计阶段；LearningMap、LessonPlayer 与 Question Engine 的工程实现状态分别见 `LEARNING_MAP.md`、`LESSON_PLAYER.md` 与 `QUESTION_ENGINE.md`。

## 9. PHASE 7 LearningMap 实现映射

`LearningMap` 设计规格已由 `/learning-map` 和 `/dev/learning-map` 的地图壳实现：`MapHeader`、`LearningProgressBar`、`KnowledgeIslandMap`、`UnitIsland`、`LessonRegion`、`KnowledgeNode`、`MapConnection`、`MapLegend` 和 `NodeDetailPanel`。正式页面读取 `StudentCurriculumProfile` 对应教材，开发页面可切换 Golden Curriculum / Map Demo Fixture。

实现保持本文件的设计边界：地图标题区分游戏世界主题与教材事实；节点详情不展示教材正文；完成度不称为掌握度；教材信息只来自数据层；节点是可访问的 `button`，锁定原因可解释。PHASE 7 的地图入口携带显式 `LessonLaunchContext` 进入 PHASE 8 LessonPlayer；Practice 再携带显式 `AssessmentLaunchContext` 进入 PHASE 9 Question Engine，地图完成度、Lesson completion 和 Assessment 分数仍不等于掌握度。

## 10. PHASE 8 LessonPlayer 页面实现映射

### 10.1 LessonPlayerPage / `/lesson`

| 页面契约 | 实现事实 |
| --- | --- |
| 目标 | 围绕一个 KnowledgePoint，以短步骤完成结构化学习内容 |
| 信息优先级 | 返回地图、Lesson 标题 / KnowledgePoint、学习目标、步骤进度、当前内容块、步骤操作 |
| 主 CTA | `下一步`；最后一步为 `完成这次学习` |
| 次 CTA | `上一步`、返回地图；完成后可返回地图 |
| 状态 | loading、ready、resume、completed、empty、not_available、error、sample、unverified |
| 数据边界 | 只消费 `LessonPlayerViewModel`；不直接读取 Curriculum 数组，不渲染题目或评分 |

页面在正式入口只接受显式 `textbookId`、`unitId`、`lessonId`、`knowledgePointId`，上下文无效时不进入正常学习状态。`LessonPlayerStore` 负责恢复已有会话；完成只调用独立地图完成服务并返回原节点焦点。

### 10.2 `/dev/lesson-player`

开发页使用独立 Demo Lesson Fixture，可切换 `full`、`resume`、`completed`、`empty`、`not_available`、`error`、`sample` 和 `unverified`。页面提供重置会话、完成当前会话和清理会话存储等调试动作，并明确显示开发 / SAMPLE / UNVERIFIED 警示。它不创建正式答题、掌握度或奖励记录。

### 10.3 响应式与无障碍

Desktop 使用中央学习卡片与步骤导航，Tablet 保持大触控目标，Mobile 使用单列内容和底部操作区；375、390、430、768、1024、1440 视口均需保持无横向溢出。步骤导航使用真实按钮和 `aria-current`，媒体失败有文本回退，装饰图标不承担语义，过渡遵守 `prefers-reduced-motion`。

## 11. PHASE 9 Question Engine 页面实现映射

### 11.1 `/assessment` 与 `/dev/question-engine`

| 页面契约 | 实现事实 |
| --- | --- |
| 目标 | 完成固定 Assessment 并查看本次结果 |
| 主 CTA | 提交答案 → 下一题 / 完成本次练习 |
| 次 CTA | 上一题、返回课程；开发页提供状态 Showcase |
| 数据边界 | 只消费 `QuestionEngineViewModel`，不直接扫描 Curriculum；题目与知识点关系由 Adapter 提供 |
| 结果 | 展示答对、答错、待人工判断和自动评分正确率；简答不进入自动评分分母 |
| 回链 | 完成后返回 LessonPlayer Summary；由独立 Service 可更新 MasteryRecord，但不写入 KnowledgeEnergy、WrongBook 或 Reward |

页面使用真实 radio / checkbox / text input / textarea，提交后禁用当前题控件并显示 `role="status"` 反馈；结果统计为 `role="region"`，题目导航使用 `aria-current="step"`。开发页显式标记 SAMPLE / UNVERIFIED，异常、空态和未开放状态使用儿童可理解文案。

## 12. PHASE 10 Mastery 页面与展示映射

### 12.1 `/dev/mastery`

| 页面契约 | 实现事实 |
| --- | --- |
| 目标 | 查看 LearningEvidence、MasteryRecord 和确定性重算结果 |
| 信息优先级 | 知识点、掌握状态 / 分数、置信度、证据数量、来源状态、算法版本 |
| 主 CTA | 从证据重算（仅对当前开发档案） |
| 次 CTA | 读取已保存记录、重置开发样本、清理当前学生 |
| 状态 | `not_started`、`weak`、`learning`、`mastered`、高分低置信度、混合来源、空、存储 warning |
| 数据边界 | 只消费 Mastery Store / Showcase；不创建课程、题目、地图完成度或奖励记录 |
| 响应式 | Desktop 双栏；Tablet 保持大触控目标；Mobile 单列，证据列表可纵向阅读 |

### 12.2 地图节点掌握度辅助显示

Node Detail 可以显示“知识掌握”状态、分数和证据数，但必须与“地图学习进度 / 完成度”分组。掌握度不改变节点 `locked / available / learning / completed`、前置解锁或地图进度；`perfect` 不由掌握度推导。儿童端优先使用“正在掌握 / 需要巩固 / 已掌握”等文字与图标，不强制展示 confidence 的内部含义。

Mastery 展示使用 `aria-label`、可见状态文字、`focus-visible` 和进度语义；状态不能只依赖颜色。进度过渡遵守 `prefers-reduced-motion`，不使用金币、XP、宝箱或成就弹窗表达掌握度。
