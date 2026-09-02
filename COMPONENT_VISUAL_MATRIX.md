# 知识岛｜组件视觉状态矩阵

> 文档状态：PHASE 3.1 组件视觉定稿（设计规范，非工程实现）  
> 事实来源：`DESIGN_SYSTEM.md`、`VISUAL_DIRECTION.md`、`CORE_PAGE_SPEC.md`、`QUESTION_UI.md`、`MOTION_SYSTEM.md`、`ONBOARDING_DESIGN.md`  
> 统一原则：组件状态由通用组件实现；页面不能为某一个页面复制一套同名但不同含义的按钮、卡片、图标或状态颜色。

## 1. 状态词典

| 状态 | 视觉表达 | 交互含义 | 必须避免 |
| --- | --- | --- | --- |
| `Default` | 基础表面、边框、文字层级 | 可看到、可操作或可阅读 | 不必要的发光 |
| `Hover` | 轻微抬升/边框加深 | 仅 Desktop 指针悬停 | 移动端依赖 hover |
| `Pressed` | 轻微缩放或表面加深 | 已按下但尚未完成 | 大幅跳动 |
| `Focus` | 2px 高对比焦点环，保留组件边界 | 键盘/辅助技术焦点 | 只用颜色表示 |
| `Disabled` | 降低对比度但保留形状，附原因文案 | 当前不可操作 | 隐藏原因、灰到不可读 |
| `Loading` | 保留原尺寸的骨架/进度，防止布局跳动 | 正在读取或提交 | 无限闪烁、重复请求 |
| `Success` | 成功色局部边框/浅表面 + CheckCircle | 学习动作已完成/正确 | 把成功变成抽奖 |
| `Error` | 局部错误色边框/文案 + 可修复动作 | 输入或加载有问题 | 红屏、震动、羞辱性文案 |
| `Locked` | 低对比但可读，锁图标 + 解锁条件 | 内容存在但暂不可进入 | 做成不可理解的灰块 |
| `Selected` | 主题色边框/浅主题表面 + 勾选/选中标记 | 当前选择 | 只用颜色区分 |

Hover、Pressed、Focus、Selected 可以叠加，但必须保持文字和图标对比度。Success/Error 不能取代可访问的文字说明。`Locked` 与 `Disabled` 不同：Locked 仍可以打开说明；Disabled 是当前动作不可执行。

## 2. 统一矩阵

单元格使用“外观；动作/文案”的格式。`—` 表示该组件不使用该状态，不能随意添加有冲突的视觉。

| 组件 | Default | Hover | Pressed | Focus | Disabled | Loading | Success | Error | Locked | Selected |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AppButton` | 主/次表面；可点击 | 阴影 +1；不移位 | 轻缩 `0.98` | 2px 焦点环 | 低对比；保留原因 | 原尺寸 spinner/文字保留 | 成功图标；短暂 | 错误文案在按钮外 | — | 选中时保留主题边框 |
| `AppCard` | 白表面；内容卡 | 仅可点击卡轻抬 | 表面轻加深 | 整卡焦点环 | 禁止点击但可读 | 骨架保留卡高 | 成功边框/徽记 | 局部提示条 | 低对比 + 锁图标 | 主题边框 + 勾选 |
| `AppIcon` | 统一尺寸/语义色 | 颜色轻加深 | 轻缩 | 2px 焦点环 | disabled 语义色 | 替换为小 spinner | CheckCircle 等语义图标 | Alert 等语义图标 | Lock 图标 | Filled/outline 变化 |
| `StudentHeader` | 问候 + 年级/学期 | 年级标签可抬 | 标签轻压 | 标签/头像焦点环 | — | 文字骨架，不跳位 | 保存提示 | 设置失败提示 | — | 设置入口选中 |
| `SubjectIsland` | 世界插画 + 进度 + CTA | 世界层轻抬 | 卡片轻压 | 整卡焦点环 | 未开学科说明 | 主题骨架 | 完成标记/路径亮 | 课程加载失败条 | 学科未开放锁定 | 当前学科主题边框 |
| `DailyMission` | 今日目标 + 进度 | 卡片轻抬 | CTA 轻压 | 整卡焦点环 | 今日暂无任务说明 | 任务骨架 | 完成勾选/一句反馈 | 获取任务失败 + 重试 | — | 当前任务边框 |
| `MapNode` | 节点图形 + 标签 | 节点轻抬 | 节点轻缩 | 外环 + 标签焦点 | — | 节点骨架 | Check/完成路径 | 仅节点提示条 | Lock + 解锁条件 | 当前主题环/角色站位 |
| `KnowledgeCard` | 标题、ContentBlock、媒体 | 可翻阅区域轻抬 | 互动媒体轻压 | 卡/媒体焦点环 | 内容仍可读 | 内容骨架 + 媒体占位 | 已理解标记 | 内容加载错误 + 重试 | — | 当前知识点边框 |
| `QuestionOption` | 白卡 + 序号/ContentBlock | 边框加深 | 轻缩 | 选项焦点环 | 已提交后只读 | 选项骨架 | 成功边框 + Check | 局部错误边框 + 再试 | — | 主题边框 + 勾选 |
| `QuestionHint` | 提示入口/灯泡图标 | 入口轻抬 | 轻压 | 焦点环 | 本题无提示说明 | 内容骨架 | 提示已使用 | 提示加载失败 + 重试 | — | 已展开主题边框 |
| `AnswerFeedback` | 不占位或中性区 | — | CTA 可压 | CTA 焦点环 | — | 反馈骨架 | “答对啦” + Check | “差一点，再试一次” | — | 当前反馈选项 |
| `RewardPanel` | 学会内容优先 + 资源摘要 | 卡片轻抬 | CTA 轻压 | 卡/CTA 焦点环 | — | 结果骨架 | 完成状态 + 知识徽章 | 结果保存失败 + 重试 | — | 选择复习/探索 |
| `TextbookCard` | 学科、出版社、版本、年级/学期 | 可修改卡轻抬 | 轻压 | 卡焦点环 | 版本不可用说明 | 卡片骨架 | 已确认勾选 | 需要确认提示 | 版本锁定说明 | 主题边框 + 已选 |
| `GradeCard` | 大数字 + 年级 | 可用卡轻抬 | 轻压 | 卡焦点环 | — | 骨架卡 | 当前支持 + 勾选 | 读取失败条 | 即将开放 + Lock | 主题边框 + 勾选 |
| `RegionCard` | 地区名 + MapPin/层级 | 可用项轻抬 | 轻压 | 卡/列表焦点环 | 不可用说明 | 列表骨架 | 已选 Check | 搜索/读取错误 | 暂未支持 + 说明 | 主题边框 + 勾选 |

## 3. 核心组件视觉规则

### 3.1 AppButton

- `Primary` 使用于页面唯一主 CTA，背景使用主色/主题色，文字字号至少 `16px`。
- `Secondary` 适合修改、返回、查看详情；不能在同一首屏出现多个同权重主按钮。
- `Destructive` 仅用于确实会丢失未保存配置的确认，不用于错误答题。
- Loading 时按钮宽度、高度、圆角不变；禁止把文本替换为空白 spinner。
- Mobile 最小高度 `52px`，桌面最小高度 `48px`；触控区域不小于 `44×44px`。

### 3.2 AppCard

- 默认圆角、阴影和边框只由 `DESIGN_SYSTEM.md` token 提供。
- 可点击卡片必须有 hover/pressed/focus 反馈；纯展示卡片不要伪装成按钮。
- 卡片状态不能通过整块红/绿底传达，局部状态条、图标和文字优先。
- 不把统计、任务、教材、奖励都做成视觉相同的白卡；使用标题层级和页面分区表达优先级。

### 3.3 AppIcon

- 图标尺寸、描边、填充、语义色由 `AppIcon` 管理。
- 地区使用 `MapPin`、`Map`、`Navigation`；教材/出版社使用 `BookOpen`、`Library`、`BookMarked`。
- 禁止 Emoji、未经授权的出版社 logo 或页面私有 SVG 形状。
- 图标旁的关键状态必须有可读文本或无障碍 label。

### 3.4 StudentHeader

- Home 显示“姓名/问候 + 三年级 · 上册”轻上下文；不显示三科出版社长文本。
- 点击年级/学期标签进入“我的学习设置”，是可见的次级入口。
- Question/Lesson 可收敛为返回、进度和必要提示，隐藏地区与教材元数据。

### 3.5 SubjectIsland、DailyMission

- `SubjectIsland` 重点顺序：学科 → 当前单元/任务 → 继续学习 → 教材版本小标签。
- `DailyMission` 重点顺序：今天要做什么 → 进度 → 继续学习；成长资源不能置于 CTA 前。
- 两者不重复展示同一组长教材信息；数据由课程上下文传入，不由组件猜测。

### 3.6 MapNode

- 节点尺寸规则：Current > Available > Completed > Locked；当前节点最多一个。
- Current 必须有角色站位和可读标题；地图缩放/移动不能让当前节点失去定位。
- Locked 必须能打开说明“完成什么后解锁”；不能让用户误以为数据加载失败。
- Boss/Chest 只是知识里程碑和固定奖励的视觉变体，不引入随机概率。

### 3.7 KnowledgeCard

- `ContentBlock[]` 的文字、富文本、图片、音频和公式共享内边距与基线；不将结构化内容强转为一个字符串。
- 图片显示 altText；音频显示播放状态和 transcript；公式需有可访问文本或等价说明。
- Lesson 中 KnowledgeCard 最大；Question 中只显示题目必要内容，不复用地图装饰。

### 3.8 QuestionOption、QuestionHint、AnswerFeedback

- QuestionOption 先保证阅读和选择，再添加轻微主题色；选项不可因复杂背景失去边界。
- QuestionHint 初始为次要入口；展开后只提供一条可执行提示，不直接盖答案。
- AnswerFeedback 预留固定高度，避免答对/错误时页面跳动；首次错误支持再次尝试，重复错误再展开解释。
- Success 在 `1 秒` 内完成；Error 不摇晃、不红屏、不播放负面音效。

### 3.9 RewardPanel

- 固定顺序为“完成 → 今天学会了什么 → 知识点 → XP/星星/金币 → 下一步”。
- 资源摘要不大于知识点区域的视觉权重；没有概率、盲盒、竞争排名。
- 主 CTA 只给一个方向：继续探索或去复习；查看错题可以是次级动作。

### 3.10 TextbookCard、GradeCard、RegionCard

- 三种选择卡都支持整卡点击、键盘焦点和明确选中反馈，不能仅依赖小复选框。
- `RegionCard` 只表达 Region（在哪里学习），`GradeCard` 只表达年级，`TextbookCard` 才表达 Publisher/TextbookVersion。
- TextbookCard 必须显示数据层返回的完整教材名称；简称只能作为辅助，不得把地区写成人教版等出版社文案。
- 多版本使用 `TextbookVersionSelector`；无默认使用 `NO_DEFAULT_TEXTBOOK`；不得随机选或 AI 猜测。
- 未实现年级使用 `即将开放`，未支持地区使用 `这个地区的课程正在准备中`，不能进入空页面。

## 4. 复合状态和响应式约束

### 4.1 状态组合优先级

1. `Loading` 覆盖一般 Default/Selected，但不覆盖页面标题和返回。
2. `Error` 覆盖交互反馈，但必须保留重试/返回路径。
3. `Success` 是短暂结果；保存后应转为 Default/Selected，而不是永久播放。
4. `Locked` 与 `Disabled` 同时存在时，显示 Locked 的原因；不能只显示灰色 Disabled。
5. Focus 始终可见，不能被 Hover、Success 或主题背景抹掉。

### 4.2 断点行为

| 组件族 | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| 选择卡 | 2–3 列，hover 可用 | 大卡、触控扩大 | 单列/2 列，最小高 `56px` |
| 地图节点 | 自由场景，当前/下一同屏 | 大画布，拖拽和可视区清楚 | 纵向路径，一屏一个主节点 |
| QuestionOption | 网格或双栏 | 大控件，保留留白 | 单列，下半屏易触达 |
| RewardPanel | 中央卡 + 分层摘要 | 卡片栈叠 | 知识点先于成长资源 |
| TextbookCard | 三卡横排 | 可横向查看 | 三卡纵向，BottomSheet 选择 |

### 4.3 页面专属样式禁止项

- 不得在 Home 单独定义一套“任务按钮”来绕过 AppButton。
- 不得在地图单独定义一个与 `MapNode` 状态不一致的“关卡卡片”。
- 不得在 Question 为错误状态新增震动、红屏和哭脸组件。
- 不得在教材页用出版社 logo、Emoji 或地区旗帜替代 `Publisher`/`Region` 的事实字段。
- 不得为了填满 Tablet 空间把装饰密度提高到超过 Desktop；优先扩大内容和触控目标。

## 5. 视觉一致性验收

工程实现后逐页比对以下项目：

- Button：高度、圆角、主次层级、Loading 不跳位、Focus 可见。
- Card：表面、边框、阴影、内边距统一，没有页面私有圆角。
- Icon：尺寸、描边、语义色和无障碍 label 统一，无 Emoji。
- 字体：标题、正文、Meta 层级符合 `DESIGN_SYSTEM.md`，关键事实不使用 Caption。
- 学科色：只用于识别和局部状态，不能作为唯一信息通道。
- 状态色：Success/Error/Warning/Locked 含文字和图标，错误不惩罚。
- 角色：同一 canonical 比例；页面只改变尺寸、站位和状态，不改变身体语法。
- MapNode：Current/Available/Completed/Locked 的层级和路径语义一致。
- 视觉强度：Home/Map 高，Lesson 中，Question/Parent 低；没有每页都爆发动画。
- 数据事实：地区、Publisher、TextbookVersion 和 `mediaAssetId` 来自数据层，不由视觉组件推断。
