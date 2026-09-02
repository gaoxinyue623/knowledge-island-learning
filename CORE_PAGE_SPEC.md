# 知识岛｜核心页面视觉规格

> 文档状态：PHASE 3.1 视觉定稿；PHASE 7 LearningMap 与 PHASE 8 LessonPlayer 已实现并验证，其余页面仍按设计规格保留  
> 事实来源：`VISUAL_DIRECTION.md`、`DESIGN_SYSTEM.md`、`RESPONSIVE_DESIGN.md`、`PAGE_SPEC.md`、`QUESTION_UI.md`、`MOTION_SYSTEM.md`、`ONBOARDING_DESIGN.md` 及 PHASE 2.1/2.2 数据契约  
> 参考视口：Desktop `1440 × 900`，Tablet `1024 × 768` / `1280 × 800`，Mobile `375 × 812` / `390 × 844` / `430 × 932`  
> 设计边界：本文件描述页面视觉、布局和交互状态；PHASE 7 / 8 的工程验收记录见 `LEARNING_MAP_VISUAL.md` 与 `LESSON_PLAYER.md`，不外推为其他页面已实现。

## 1. 使用方式

本文件把没有设计图时需要交给工程的高保真信息写成可执行规格：尺寸区间、位置、层级、文字优先级、角色和地图站位、组件状态、响应式变化及异常状态。

实现时必须先读取：

- `DESIGN_SYSTEM.md`：颜色、字体、圆角、阴影、间距、无障碍和通用组件。
- `VISUAL_DIRECTION.md`：世界观、视觉强度、KnowledgeDango、学科世界和背景策略。
- `COMPONENT_VISUAL_MATRIX.md`：组件状态矩阵。
- `MOTION_SYSTEM.md`：动效时长、减弱动效和性能边界。
- `DATA_MODEL.md`、`QUESTION_SCHEMA.md`、`CONTENT_REVIEW.md`：真实字段、媒体引用和内容状态。

文中的“完成”只表示用户完成当前界面动作；不能把 `masteryScore` 解释成随时间自动下降的能力值，也不能用 UI 猜测地区教材版本。

## 2. 共享页面骨架

### 2.1 基础容器

| 层级 | Desktop | Tablet | Mobile | 规则 |
| --- | --- | --- | --- | --- |
| 页面外框 | 最大宽度 `1200px`，左右 `48px` | 最大宽度 `960px`，左右 `32px` | 宽度减 `16px` 左右内边距 | 不做固定宽高页面 |
| 顶部栏 | 高 `72px` | 高 `64px` | 高 `56px` | 内容随页面强度收敛 |
| 主内容纵向间距 | `32px–40px` | `24px–32px` | `16px–24px` | 不让标题与 CTA 粘连 |
| 主按钮 | 高 `48px–52px`，最小宽 `160px` | 高 `52px` | 高 `52px–56px`，可满宽 | 触控目标至少 `44px` |
| 标准卡片内边距 | `24px` | `20px` | `16px` | 使用 `AppCard` |
| 页面底部安全区 | `24px` | `24px` | `16px + safe-area-inset-bottom` | 移动端 CTA 不贴屏底 |

页面主栏应保持 `8px` 基线节奏。区块间优先使用 `16/24/32px`，不要在页面中临时创造间距。

### 2.2 统一标题层级

| 层级 | 参考字号 | 用途 | 颜色 |
| --- | --- | --- | --- |
| `Display` | `32px–40px` | Welcome、Home 世界标题、Result 总结 | `text.primary` |
| `PageTitle` | `24px–28px` | 页面标题、地图标题、设置标题 | `text.primary` |
| `SectionTitle` | `18px–20px` | 今日任务、三科入口、知识点 | `text.primary` |
| `Body` | `16px–18px` | 题干、选项、说明 | `text.primary` |
| `Meta` | `13px–14px` | 出版社、学期、状态辅助信息 | `text.secondary` |
| `Caption` | `12px–13px` | 仅用于补充，不承载关键事实 | `text.secondary` |

移动端不通过极小字号解决拥挤；优先减少次要字段或折叠说明。

### 2.3 CTA 规则

- 每个页面只有一个主 CTA，使用 `AppButton` 的 `Primary`。
- 次 CTA 使用 `Secondary` 或文字按钮；返回使用统一 Back 图标和可读标签。
- 加载时主 CTA 进入 `Loading`，保留按钮尺寸，不能跳动。
- 需要家长确认的教材页可有“请家长帮我确认”，但它是辅助入口，不替代保存主 CTA。
- Question 页中“下一题”只在有结果状态时出现；作答前不显示可能误导的下一步。

### 2.4 页面状态命名

页面必须显式处理：`Loading`、`Empty`、`Error`、`Locked`、`Selected`、`Saved`、`NeedsConfirmation`。空状态文案使用产品化中文，不出现 `404`、`No Data`、`Null` 或 `Undefined`。

## 3. OnboardingWelcome

### 3.1 目标与优先级

- 目标：让首次用户理解这是一个可以探索的知识世界，并开始课程配置。
- 信息优先级：知识岛世界氛围 > 欢迎语 > 一句话价值说明 > 开始配置。
- 视觉强度：`Learn`，有开场感但不让用户先看大量动画。
- 主 CTA：`开始配置`。
- 次 CTA：无；若已有配置，显示 `继续上次学习`，但不与首次入口同时造成歧义。

### 3.2 Desktop / Tablet 布局

参考 `1440 × 900`：

- 页面以浅色天空/岛屿层为背景，背景插画只占中央 `720px × 420px`，四周留白。
- KnowledgeDango 位于视线中心偏左，canonical 显示尺寸 `160px–190px`；身体朝向右侧 CTA，不贴右下角。
- 右侧欢迎卡宽 `380px–440px`，顶部与角色眼睛约齐；卡内顺序为品牌、标题、短说明、主 CTA。
- 下方用三个极简小徽记暗示语文、数学、英语世界，不做可点击的功能卡。
- Tablet 改为上下结构：角色/岛屿上半区约 `42vh`，欢迎卡下半区，按钮宽度不少于 `280px`。

### 3.3 Mobile 布局与状态

- 单列一步一屏，背景视觉缩为顶部 `36vh`，角色显示尺寸 `128px–148px`。
- 标题距安全区 `24px`，说明不超过三行，CTA 固定在下方安全区内。
- `Loading`：角色使用 `Idle`，按钮保留宽度并显示进度语义。
- `Reduced motion`：不播放岛屿漂浮，只显示静态背景和角色。

## 4. RegionSelect

### 4.1 目标与事实边界

- 目标：回答“你在哪里学习？”，选择 `Region`，不是选择出版社或教材版本。
- 主 CTA：选择一个可用地区后 `继续`。
- 次 CTA：`返回`；辅助入口 `为什么要选择地区？` 可展开一行说明。
- 数据来源：`Region` 实体。界面不得由地区名称推断 `Publisher` 或 `TextbookVersion`。
- 视觉强度：`Learn`，地图/定位暗示可以有，但不是地图游戏页。

### 4.2 Desktop 布局

参考 `1440 × 900`，居中卡片最大宽 `900px–1100px`，顶部保留 `1 / 4` 轻进度：

- 左栏宽约 `34%`：`MapPin` 大图标、标题“你在哪里学习？”、一条简短解释。
- 右栏宽约 `66%`：搜索框高度 `48px`，下方依次为“推荐地区/最近选择”（如有）、省份列表和城市列表。
- 列表项高度至少 `52px`，整项可点击；当前项使用 `Selected` 的浅主题色和 Check 图标。
- 省份与城市两栏并列时，城市栏只在已选省份后出现；不显示空的城市能力。
- 选中省份后若产品仅支持省级，直接在省份项显示可继续状态，不制造虚假的城市二级步骤。

### 4.3 Tablet / Mobile

- Tablet：保留左侧说明，但内容区收窄；两个列表列宽至少 `280px`。
- Mobile：隐藏左栏为顶部简短说明；搜索框后显示推荐/省份列表，点击省份后进入独立城市列表；顶部显示“广东省”面包屑和返回。
- Mobile 列表单项高度 `56px`，底部 `继续` 满宽；手指单手可完成。
- 未选地区：`继续` Disabled，说明“先选一个学习地区”。
- 无匹配：`TEXTBOOK_NOT_FOUND` 不适用本页；这里使用“暂时没有找到这个地区，请换个关键词试试”。
- `REGION_NOT_SUPPORTED`：标题“这个地区的课程正在准备中”，CTA `选择其他地区`，不能让用户进入空 Home。

## 5. GradeSelect

### 5.1 目标与布局

- 目标：回答“你现在几年级？”。
- 主 CTA：选中年级后 `继续`。
- 视觉强度：`Learn`。
- 禁止：Select Dropdown 作为儿童主交互。

Desktop/Tablet：

- 标题区位于顶部中间，`2 / 4` 轻进度在标题上方。
- 六张 `GradeCard` 采用 `3 × 2` 或 Tablet `2 × 3` 网格；单卡最小宽 `180px`、高 `144px`。
- 卡片上方为大数字 `1–6`，下方为“一年级”等完整文案；每张卡有简单几何图形，不使用 Emoji。
- 三年级卡使用当前支持色和小标签“当前支持”；其余未实现年级显示“即将开放”，整体仍可读但不可进入。

Mobile：

- 单列或 `2 × 3` 大卡片，单卡高度 `112px–132px`；每次只需要点击卡片，不需要小下拉框。
- 未实现年级为 `Locked`，点击后出现轻量说明“这个年级即将开放”，不跳空页面。
- 选中后卡片保留边框、勾选和轻微抬升；主 CTA 文案为 `继续确认课本`。

### 5.2 边界状态

- 年级列表加载：显示六个骨架卡，不能显示空白。
- 所选年级没有任何课程数据：显示 `GRADE_NOT_AVAILABLE`，解释“这个年级的课程正在准备中”，提供返回修改地区/年级的 CTA。
- 年级只影响后续教材解析，不删除历史学习记录；设置页需要另行展示“历史学习”。

## 6. TextbookConfirmPage

### 6.1 目标与信息层级

- 目标：确认数据层为当前 `regionId + gradeId + semesterId` 返回的三科教材。
- 主 CTA：`确认并继续`。
- 次 CTA：每科卡片 `修改版本`；辅助入口 `请家长帮我确认`、`怎么看我的教材版本？`。
- 视觉强度：`Learn`，准确性优先于游戏装饰。
- 主题文案：

```text
确认一下你的课本
根据你选择的地区和年级，我们找到了这些学习版本。
```

### 6.2 Desktop 布局

参考 `1440 × 900`：

- 进度 `3 / 4`；标题卡上方不显示出版社或地区混合文案。
- 三张 `TextbookCard` 横向排列，宽 `260px–320px`、高 `260px–300px`，间距 `16px–24px`。
- 每张卡顺序固定：`Subject Icon` → 学科名 → 出版社完整名 → 教材完整版本名 → 年级/学期 → `修改版本`。
- 卡片顶部使用语文/数学/英语学科色小标记；出版社和教材用 `BookOpen/Library/BookMarked` `AppIcon`。
- 页面底部主 CTA 居右；若三科有待确认状态，按钮文案改为 `确认教材并继续`，并在按钮上方提示需要确认的科目。

### 6.3 Tablet / Mobile

- Tablet：三卡可横向滚动但第一屏至少完整展示两张；主 CTA 保持可见。
- Mobile：单列三卡，卡片宽度为容器宽度，高度约 `220px–250px`；每张卡的完整版本名称最多两行，其余细节可展开。
- Mobile 主 CTA 固定在底部安全区，滚动时不覆盖卡片；选择器从卡片底部打开 BottomSheet。
- 不使用地图背景、不显示复杂角色动作；KnowledgeDango 只在顶部小幅鼓励，避免信息竞争。

### 6.4 多版本与无法确定

- `MULTIPLE_TEXTBOOKS`：卡片显示“这里有几种课本版本，请确认你正在使用哪一本”，显示 `更换版本`。
- `NO_DEFAULT_TEXTBOOK`：不自动填入版本；显示“这个地区有多个教材版本，看看你的课本封面或出版社”，用户必须选择后才可保存。
- `TEXTBOOK_NEEDS_CONFIRMATION`：使用黄色/暖色提示条和 `needsVerification` 事实说明，不把未核验内容伪装成官方推荐。
- `TEXTBOOK_NOT_FOUND`：卡片显示“暂时没有找到匹配课本”，CTA `手动选择` 或 `修改地区/年级`；不随机选择、不 AI 推断。

## 7. Home / Knowledge Island

### 7.1 页面目标和优先级

Home 需要让用户在 3 秒内看见“我在知识岛”，在 10 秒内完成“继续今天的学习”。优先级严格为：

1. Knowledge Island + KnowledgeDango。
2. 今日任务和 `继续学习`。
3. 语文、数学、英语三个世界。
4. 成长资源、复习提醒和次级数据。

### 7.2 Desktop 高保真布局

参考 `1440 × 900`：

```text
┌──────────────────────────────────────────────────────────────┐
│ Brand / 问候       三年级 · 上册                 Avatar / Menu │ 72
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [Knowledge Island + Dango]       [Today Mission Card]      │ 340–380
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ [语文 SubjectIsland] [数学 SubjectIsland] [英语 SubjectIsland] │ 200
├──────────────────────────────────────────────────────────────┤
│ 复习提醒 / 成长资源 / 小型进度摘要（合并为 2–4 个模块）        │
└──────────────────────────────────────────────────────────────┘
```

- 页面最大宽度 `1200px`，主视觉区约 `340px–380px`。
- 知识岛占主视觉区宽度约 `55%–62%`；岛屿可用分层 SVG/PNG/WebP，不要求 WebGL。
- KnowledgeDango 位于岛屿中心偏下，尺寸 `150px–190px`；默认 `Idle`，点击当前任务时转 `Happy`。
- 今日任务卡宽 `320px–380px`，位于主视觉区右下，卡内顺序为“今天的任务/短目标/进度/继续学习”。
- 三个 `SubjectIsland` 高度 `180px–210px`，同构布局；教材版本只是底部小标签，不超过卡片信息的 `10%` 视觉面积。
- 统计信息不做等权大卡片；`masteryScore` 可在成长详情表达“已有学习证据”，`KnowledgeEnergy` 表达“需要复习”，不能写成能力衰减。

### 7.3 Tablet / Mobile

- Tablet 横屏：知识岛和任务卡可二栏；岛屿最小宽 `460px`，任务卡最小宽 `300px`。竖屏改为岛屿、任务、三科世界纵向排列。
- Mobile：顶栏只显示头像/问候和“三年级 · 上册”；知识岛作为完整视觉块，高度约 `230px–280px`；今日任务立即跟随；三科世界以单列或横向轻滚动呈现。
- Mobile 不将地区和三个出版社放在首页；点击年级标签进入“我的学习设置”。
- Bottom Navigation 只显示 Home、地图、任务、我的等主页面；Home 中保留。

### 7.4 Home 状态

- 首次配置完成：显示完整岛屿与角色，今日任务可用。
- 今日无任务：使用“今天也可以从一个小知识开始”，CTA `去探索`，不显示空白。
- `KnowledgeEnergy` 较低：只显示温和提醒“有一段时间没复习这个知识点了”，CTA `去复习`，不显示“能力下降”。
- 课程加载：岛屿静态占位、任务骨架和三科骨架；角色使用 Idle，不重复闪烁。
- 课程配置缺失：显示 `CurriculumSummary` 的设置引导，CTA `完成学习设置`，不进入无课程 Home。

## 8. Math Learning Map

### 8.1 页面目标

这是核心探索页。目标是让用户知道当前位置、下一步和已经掌握/完成的知识路径；不是把所有题目堆成卡片。

视觉强度：`Explore`。游戏主题和教材事实分层：

```text
数学世界
计算工厂
三年级上册 · [教材完整名称]
```

### 8.2 Desktop 布局

参考 `1440 × 900`：

- 顶部 `72px`：左侧返回/页面名，中间是三行标题，右侧为轻量进度/复习入口。
- 地图画布占剩余高度约 `650px–700px`，最大宽 `1280px`，背景为轻 2.5D 数字工厂分层场景。
- 路径从左下向右上或以轻弧线推进，不能使用表格直线；当前节点位于视线中心偏右，下一节点位于前进方向 `120px–200px` 处。
- 当前 `MapNode` 直径 `72px–88px`，下一节点 `60px–72px`，已完成 `52px–64px`，锁定 `48px–60px`；节点间使用路径而不是空白卡片。
- KnowledgeDango 站在当前节点左下约 `24px–40px`，`Walk` 到下一节点时沿路径移动；不能与节点重叠。
- `Boss`/宝箱用于知识里程碑，显示关卡目标和知识点，不显示随机掉落概率。
- 装饰层只占地图对比度的 `15%–20%`，路径和当前节点对比度最高。

### 8.3 Tablet / Mobile

- Tablet：画布仍是主要空间，节点尺寸不减小；支持拖拽浏览和明显的当前视口边界。横屏可显示当前+下一+前一个节点，竖屏至少显示当前+下一。
- Mobile：地图改为纵向探索路径，一屏一个主节点；顶部保留标题和教材小标签，底部只保留当前节点 CTA。装饰减少，路径宽度增大，禁止依赖精确拖拽。
- Mobile 当前节点直径 `72px–84px`，点击目标含至少 `12px` 外扩触控区域；Bottom Navigation 可显示，但打开节点详情后进入专注底部动作。

### 8.4 节点状态

- `COMPLETED`：完成标记、低幅度稳定高亮，可查看知识点。
- `CURRENT`：最大尺寸、主题色外环、角色站位、主 CTA `继续学习`。
- `AVAILABLE`：次强调，CTA `开始`，不抢当前节点。
- `LOCKED`：低对比度但保留锁定原因，如“完成前一个知识点后解锁”。
- `BOSS`：里程碑外形不同但仍遵循 `MapNode` 状态，标题聚焦知识目标。
- 加载/定位：显示地图骨架和角色位置占位；定位后只做一次轻微路径/角色过渡。

## 9. Lesson / Knowledge Teaching

### 9.1 目标与结构

- 目标：理解一个知识点，准备进入练习。
- 视觉强度：`Learn`，比地图安静。
- 主 CTA：`学会了，开始练习` 或数据层定义的下一步。
- 次 CTA：返回地图、查看媒体/提示；不能在底部堆奖励指标。

### 9.2 Desktop / Tablet

参考 `1440 × 900`：

- 顶部显示返回、知识点标题和进度；不显示整张地图。
- 中央内容宽 `960px–1100px`，左侧 `KnowledgeCard`/正文约 `56%–62%`，右侧插图或媒体约 `38%–44%`。
- 如果角色提供解释，KnowledgeDango 位于右侧媒体下方或卡片旁，尺寸 `96px–128px`，状态 `Think`/`Encourage`；不盖住正文。
- `ContentBlock[]` 按顺序渲染文字、富文本、图片、音频、公式；媒体只能通过 `mediaAssetId` 解析，显示 alt/transcript 入口。
- 底部主 CTA 宽 `240px–300px`，距内容至少 `24px`；滚动时不遮挡正文。
- Tablet 允许双栏但将每列最小宽控制在 `320px`；如果空间不足，媒体移至知识卡下方而不是缩小文字。

### 9.3 Mobile

- 单列：知识标题/进度 → KnowledgeCard → 媒体/插图 → 角色提示 → CTA。
- 题外装饰全部隐藏；媒体最大宽度 `100%`，音频显示大触控播放条和 transcript。
- CTA 在内容底部，滚动到末尾后固定在安全区；角色不固定悬浮。
- `Loading` 显示知识卡骨架；`Error` 说明“这段内容暂时打不开”，提供重试和返回地图。

## 10. Question 统一外壳

### 10.1 目标与通用布局

Question 以集中注意力为第一目标。题干、主要交互、反馈/动作的面积参考为 `20%–30% / 40%–60% / 20%`。地图、角色、教材和成长资源全部降级。

Desktop：

- 内容最大宽 `860px–960px`，顶部进度约 `56px`，题目容器居中。
- 题干卡/题干区约占首屏高度 `180px–240px`，主作答区至少 `320px` 高；底部反馈区预留 `96px–140px`。
- 顶部只显示返回/题号进度/必要的提示入口；不显示完整地图和多余统计。
- KnowledgeDango 可位于题目容器右上或反馈条左侧，宽 `64px–88px`，仅在提示/结果状态出现。

Tablet：

- 内容宽 `min(820px, calc(100% - 64px))`，选项和输入控件放大。
- 复杂交互保留足够空白；不要用两侧装饰填满空白。

Mobile：

- 内容使用单列，题干位于上半屏，主作答区位于下半屏可触达位置。
- 主 CTA/反馈固定在底部安全区，但不能遮挡输入；题目页隐藏 Bottom Navigation。
- 选项最小高 `56px`，选项间距 `12px`；手指无需精确点击小图标。

### 10.2 通用状态和反馈

#### 作答前

- 题干和交互清晰，主 CTA 可以为 `提交答案`；未完成时 Disabled 并说明需要完成作答。
- 不显示奖励动画、不显示错误红色。

#### 首次正确

- 选项使用成功边框/浅表面，出现 CheckCircle。
- KnowledgeDango 转 `Success`，轻抬或短点头；反馈文案“答对啦”，加一条简短学习反馈。
- 在不到 `1 秒` 内完成状态反馈，显示 `下一题`。

#### 首次错误

- 不出现红屏、摇晃、哭泣或“游戏结束”。
- 文案“差一点，再试一次”，角色转 `Think` 或 `Encourage`。
- 显示 `再试一次`、`看提示`；保留用户可理解的错误位置，但不直接暴露完整答案。

#### 重复错误

- 展开 `QuestionHint`，必要时进入 `Explanation`；保持语气支持性。
- 不重复播放强动效；允许用户返回题目。

### 10.3 Question 数据边界

- `QuestionBase.stem` 必须按 `ContentBlock[]` 渲染；不能因为某题只有文字就把协议降成 string-only。
- `QuestionOption.content`、hint、explanation、dragDrop/matching/sorting item 可为 `ContentBlock[]`；sentence token 保持纯文字结构。
- 图片/音频/动画由 `mediaAssetId` 解析为 MediaAsset；QuestionMedia 只保留引用、用法和顺序，不保存真实 URI。

## 11. Single Choice Question

- 目标：快速、清晰地从多个结构化选项中选择一个。
- Desktop：题干下方 `2 × 2` 选项网格，单项最小宽 `320px`、高 `72px`；长内容自动转单列。
- Tablet：默认 `2 × 2`，触控目标至少 `64px` 高；选择后保留明显选中态。
- Mobile：单列选项，主作答区放在下半屏；选项最小高 `56px`，字数多则自动增高。
- 每个选项左侧可显示 A/B/C/D 的 `AppIcon`/字母容器，不能只靠颜色区分。
- 状态：`Default` 白卡、`Hover` 仅 Desktop 轻抬、`Pressed` 轻缩、`Selected` 主题色边框、`Correct` 成功边框、`Wrong` 局部错误边框后允许重试、`Disabled` 锁定输入。
- 若选项包含图片/公式，`ContentBlock[]` 内容按统一内边距对齐；图片有 altText，公式不依赖截图。

## 12. DragDrop Question

- 目标：通过拖放/点击排序完成关系或分类。
- Desktop：左侧可拖动 item 区约 `35%`，右侧目标槽区约 `65%`；每个槽高 `64px–80px`，连接线/占位状态清晰。
- Tablet：保留左右分栏，但扩大拖动卡和目标槽；支持拖拽和“点击 item → 点击槽位”的替代操作。
- Mobile：改为单列“待放置项 → 当前目标槽”，一次只突出一个槽；底部提供 `放入这里` 或上下移动按钮，避免小屏横向拖拽。
- 拖动中的 item 使用阴影和主题色外框，不使用抖动；拖到可放位置显示高亮占位。
- 错误放置显示局部提示并允许撤回；不把 item 变红后锁死。
- 必须支持键盘焦点和非拖拽操作，屏幕阅读器需读出 item、目标和顺序。

## 13. Calculation Question

- 目标：让算式和输入成为绝对视觉中心。
- Desktop/Tablet：算式或公式置于上方中央，字号 `32px–48px`；数字输入区/键盘在下方居中，按钮边长不小于 `56px`。
- Mobile：算式字号 `28px–36px`，输入框宽度至少 `180px`；数字键盘位于屏幕下半部，删除和确认键固定在易触达区域。
- 角色只在提示/结果时出现于输入框旁；背景不放齿轮动画，避免干扰计算。
- 空输入主 CTA Disabled；输入中显示光标、焦点环和清除操作。
- 正确：显示“算对啦”+ 一条过程反馈；错误：保留输入，显示“检查一下计算步骤”，提供提示，不清空用户内容、不红屏。
- 公式/单位使用 `FORMULA` 或结构化 ContentBlock；禁止把公式仅做成无法访问的图片。

## 14. Reading Question

- 目标：支持阅读理解，不让游戏装饰和题目竞争。
- Desktop：阅读文章/媒体约 `55%`，问题和选项约 `45%`，两栏可独立滚动；文章标题、段落间距和引用层级清楚。
- Tablet：仍保留两栏，宽度不足时文章在上、问题在下，但保持“阅读 → 作答”顺序。
- Mobile：单列，顶部阅读材料，可折叠“回到文章”；问题区位于下方，底部 CTA 不遮挡文章。
- 文章、插图、音频和 transcript 使用 ContentBlock/MediaAsset；阅读材料不被裁切成装饰图。
- 角色不在文章内部悬浮；仅在用户需要提示或完成后出现于反馈条。
- 若材料加载失败，显示“阅读材料暂时打不开”，提供重试；不显示空白题目。

## 15. Level Complete / Reward

### 15.1 目标与布局

- 目标：确认完成、回顾今天学会的内容、给出下一步。
- 视觉强度：`Report` 偏低，允许 `Success` 的短庆祝。
- 首屏中心为完成状态和 KnowledgeDango `Success`，角色显示尺寸 `120px–160px`。
- 主标题“完成啦”，紧接“今天学会了什么”知识点列表；知识点列表比 XP/星星/金币更优先。
- XP/星星/金币只做一行轻量成长摘要；不放随机宝箱概率、抽奖按钮或竞争排名。
- 主 CTA `继续探索`，次 CTA `去复习`/`查看错题`，最多两个次级选择。

### 15.2 响应式与动效

- Desktop：完成卡宽 `520px–640px`，知识点区和成长摘要分层。
- Tablet：卡片宽 `min(560px, 100% - 48px)`。
- Mobile：单列，知识点列表先于资源；主 CTA 满宽，底部安全区固定。
- 完成动画 `1–2 秒` 内结束；支持跳过；reduced motion 仅显示状态和数值，不播放粒子。
- 如果答题完成但有待复习点，文案温和提示“这些知识点可以稍后再复习”，不把失败扩大化。

## 16. WrongBook

### 16.1 目标与结构

- 目标：把错题转化为可复习的知识证据，而不是错误陈列。
- 视觉强度：`Report`/`Focus` 低。
- 顶部：页面标题、筛选入口、复习能量提醒；不显示羞辱性统计。
- 列表项显示学科、知识点、题型、最近一次结果和 `去复习`；教材版本为辅助事实。
- 错题详情使用 QuestionShell 的只读/再练习变体，仍支持 ContentBlock 和 MediaAsset。

### 16.2 响应式

- Desktop：左侧筛选列、右侧列表；列表宽度 `720px+`。
- Tablet：筛选变为顶部横向控件，列表保持大卡。
- Mobile：筛选从 BottomSheet 打开，错题卡单列；`去复习` 为每张卡的明确 CTA。
- 空状态：“还没有需要复习的错题，继续学习会遇到新的挑战”，不显示 No Data。

## 17. ParentDashboard

### 17.1 目标和语气

- 目标：家长看懂学习进展、知识证据、复习建议和课程配置，不把孩子变成排名数字。
- 视觉强度：`Report` 低；背景简单、少角色、少插画。
- 数据表达：`masteryScore` 说明“当前已有学习证据”；`KnowledgeEnergy` 说明“距上次复习/建议复习”，不得表示掌握能力自动下降。
- 教材配置区显示地区、年级、学期以及三科教材；教材来源、版权/审核状态按权限显示，不把 `ACTIVE` 与 `PUBLISHED` 混用。

### 17.2 Desktop / Tablet / Mobile

- Desktop：顶部摘要卡（学习天数/完成任务/待复习），中部知识点趋势和建议，右侧课程配置摘要；图表颜色使用语义状态，不依赖颜色单独传达。
- Tablet：摘要先行，图表和建议纵向排列，三科教材使用可展开卡片。
- Mobile：一屏只放摘要和一个主建议；复杂图表后置到“查看详情”；不在首页堆出版社长文本。
- 无数据状态：“还没有足够的学习记录，完成一次学习后这里会出现报告”；不能显示空图表。
- 数据加载失败提供重试和更新时间；敏感信息和家长入口遵循既有权限边界。

## 18. 跨页面组件映射

| 页面 | 必用组件 | 页面特有视觉 |
| --- | --- | --- |
| OnboardingWelcome | `OnboardingProgress`、`AppButton`、KnowledgeDango | 世界开场、角色朝向 CTA |
| RegionSelect | `RegionSelector`、`RegionCard`、`AppIcon` | 搜索/推荐/省市逐级选择 |
| GradeSelect | `GradeSelector`、`GradeCard` | 大数字卡、当前支持/即将开放 |
| TextbookConfirm | `TextbookCard`、`TextbookVersionSelector`、`CurriculumSummary` | 三科分卡、确认状态 |
| Home | `StudentHeader`、`SubjectIsland`、`DailyMission`、`CurriculumSummary` | 知识岛、今日任务、三世界 |
| LearningMap | `MapNode`、`StudentHeader`、KnowledgeDango | 路径、节点、工厂世界 |
| Lesson | `KnowledgeCard`、`QuestionHint`、媒体渲染 | 安静知识中心 |
| Question | `QuestionOption`、`QuestionHint`、`AnswerFeedback` | Focus shell、作答区 |
| Result | `RewardPanel`、`CurriculumSummary` | 学会内容优先、短庆祝 |
| WrongBook | `AppCard`、`AnswerFeedback`、`KnowledgeCard` | 复习语气、筛选 |
| ParentDashboard | `AppCard`、`CurriculumProfileCard`、`CurriculumSummary` | 报告、解释、权限 |

## 19. 跳转和保存边界

- 首次流程：`Welcome → RegionSelect → GradeSelect → ResolveTextbooks → TextbookConfirm → CharacterSetup → Home`。
- 更换地区：`我的学习设置 → RegionSelect → ResolveTextbooks → TextbookConfirm → 保存`；地区变化不得静默覆盖旧三科配置。
- 更换单科：`我的学习设置 → 选择学科 → TextbookVersionSelector → 确认 → 保存`；只改所选学科。
- 更换年级：重新查询三科教材，但保留历史学习记录，设置页可显示当前/历史学习。
- 任何教材卡展示均依赖数据层返回的 `textbookVersionId`、`publisherId` 和关系状态；UI 不从地区名称拼接版本名称。
- 未保存返回时，使用 `CurriculumSwitchDialog` 说明“还有未保存的教材选择”，让用户保存或继续离开。

## 20. PHASE 3.1 输出判定

以下页面已经具备进入工程实现评审所需的视觉规格：OnboardingWelcome、RegionSelect、GradeSelect、TextbookConfirm、Home、Math Learning Map、Lesson、四种 Question、Level Complete/Reward、WrongBook、ParentDashboard。

LearningMap 的 PHASE 7 工程验证已单独记录在 `LEARNING_MAP_VISUAL.md`，LessonPlayer 的 PHASE 8 工程验证见 `LESSON_PLAYER.md`；本文件中 Question、Result、WrongBook 和 ParentDashboard 等页面仍未实现。其他页面实现前仍必须完成 `VISUAL_QA.md` 中对应的媒体加载、可访问性、性能和原创性检查。
