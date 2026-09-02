# 知识岛｜Question UI 题型交互规格

> 本文档定义统一 `QuestionShell`、题干内容、媒体、选项、提示、反馈、键盘 / 触控和题型的学生端交互。PHASE 9 已将六类题型落到 `QuestionRenderer` 与 Assessment 页面；其余题型仍是设计规格。它对应 `QUESTION_SCHEMA.md`，不替代判题与审核规则。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 9.4：Question Engine / Assessment（继承 PHASE 3 视觉与交互设计） |
| 状态 | 六类题型、提交锁定、反馈、结构化内容、媒体回退和响应式交互已实现并验证；其余题型仍为设计 |
| 上游事实源 | `QUESTION_SCHEMA.md`、`DATA_MODEL.md`、`PRODUCT.md` |
| 下游消费者 | `PAGE_SPEC.md`、`UI_FLOW.md`、`QUESTION_ENGINE.md` 与题目服务 |
| 题型范围 | 12 类 MVP / 后续题型 + `speaking` 接口占位 |
| 评分边界 | UI 不改答案、不推断 normalization、不计算教材归属 |

---

## 1. 统一 QuestionShell

### 1.1 结构

```text
QuestionShell
├─ QuestionHeader：退出 / 题号 / 总进度
├─ QuestionContent：stem ContentBlock[] / 媒体 / 阅读材料
├─ InteractionRegion：由 questionType 选择交互组件
├─ QuestionHint：提示入口与分级提示
├─ AnswerFeedback：正确 / 错误 / 解析 / 再试一次
└─ ActionBar：提交 / 下一题 / 返回关卡
```

题型差异只发生在 `InteractionRegion`。题干、媒体、提示和解析均可由 `ContentBlock[]` 组合；图片、音频、视频、动画和 SVG 只通过 `mediaAssetId` 读取 `MediaAsset`，不在 UI 里保存真实 URI。

### 1.2 信息优先级

1. 这道题要做什么。
2. 当前题号和完成进度。
3. 可操作区域。
4. 如何提交、查看提示或重新尝试。
5. 角色反馈和奖励。

角色和装饰不遮挡题干、选项、输入框或提交按钮。

### 1.3 通用状态

| 状态 | 行为 |
| --- | --- |
| `loading` | 题干骨架 + “正在准备这道题”；有媒体时单独显示媒体加载状态 |
| `normal` | 可操作，提交按钮按题型最小输入条件决定 |
| `selected` | 图标、边框、文案同时表达已选，不只改变颜色 |
| `disabled` | 显示原因；不可用选项不接受焦点或有明确禁用语义 |
| `submitting` | 保留布局，防止重复提交；提供进行中状态 |
| `correct` | `CheckCircle` + “答对啦”；角色轻微庆祝，CTA 变为“下一题” |
| `wrong` | `RefreshCcw` / `Lightbulb` + “差一点，再试一次”；保留题目和作答上下文 |
| `hint` | 显示当前级别提示；第一次不直接给答案 |
| `error` | “题目没有加载出来” + “再试一次”；不展示技术错误 |
| `offline` | 有缓存则允许继续；没有缓存则“重新连接” |

错误不自动跳题。第一次错误保留题目；再次错误可进入分步解析或重新学习；不使用 `Game Over`、倒地或羞辱性文案。

### 1.4 通用操作

- `提交`：只在题型满足最小输入条件时激活。
- `下一题`：反馈完成后由学生主动点击，不自动跳转。
- `看看这个提示`：按 `QuestionHint` 的 `trigger` 和顺序显示。
- `退出`：有作答进度时打开离开关卡 BottomSheet，选项为“继续学习”“稍后再来”“重新开始”。
- 触控目标至少 44×44px；低年级主要选项优先 48×48px。
- 所有题型可通过键盘导航；Focus 顺序与视觉顺序一致。

### 1.5 反馈与学习事件

Question UI 只展示服务或评分返回的结果。结果到 `MasteryEvent` 的映射由学习行为域负责：`FIRST_CORRECT`、`CORRECT`、`CORRECT_AFTER_HINT`、`WRONG`、`REVIEW_CORRECT`、`REVIEW_WRONG`、`CHALLENGE_CORRECT`。UI 不直接修改 `masteryScore`；知识能量提醒也不等同于掌握度下降。

---

## 2. 题型总览

| 题型 | 主要交互 | Mobile 默认替代 |
| --- | --- | --- |
| `singleChoice` | 单选卡片 | 单列点选 |
| `multipleChoice` | 多选卡片 | 单列点选 + “可多选”说明 |
| `fillBlank` | 输入空位 | 逐空输入，软键盘不遮挡 |
| `trueFalse` | 两张判断卡 | 上下两张大卡 |
| `dragDrop` | 拖动项目到目标 | 点击项目 → 点击目标 |
| `matching` | 左右配对 | 点击 A → 点击 B |
| `sorting` | 拖动排序 | 上移 / 下移 |
| `typing` | TEXT / PINYIN / ENGLISH 输入 | 单列大输入框 |
| `listening` | 播放音频后作答 | 大播放按钮 + 文字替代 |
| `calculation` | 结构化公式 + 数值输入 | 系统数字键盘优先 |
| `reading` | 材料与子题关联 | 材料区 / 问题区可折叠 |
| `sentenceOrdering` | token 排序 | 点击或上移 / 下移 |
| `speaking` | 未来口语接口 | MVP 不录音、不评分 |

---

## 3. 各题型交互规格

以下每一节都定义 Desktop、Tablet、Mobile、Interaction、Keyboard、Touch、Correct、Wrong、Hint、Disabled 和 Loading 行为。

### 3.1 singleChoice

| 项目 | 规格 |
| --- | --- |
| Desktop | 题干居中，选项 1～2 列大卡片；阅读宽度不超过 `layout.questionMax` |
| Tablet | Landscape 可 2 列，Portrait 优先 1 列；卡片保持大触控区域 |
| Mobile | 单列卡片，选项全宽；选中后滚动位置不跳动 |
| Interaction | 点选一个 `QuestionOption`；再次点选可更换；提交后锁定选项直到反馈完成 |
| Keyboard | Tab / Shift+Tab 访问选项，方向键切换，Space / Enter 选择，Enter 提交 |
| Touch | 卡片全区域可点，最小 44×44px |
| Correct | `CheckCircle`、成功边框和“答对啦”；保留选项和解析 |
| Wrong | 柔和错误状态，显示“差一点，再试一次”；不自动换题 |
| Hint | 第一级方向提示，不高亮正确答案；再次错误可显示关键步骤 |
| Disabled | 已提交、加载中或不满足当前题目条件时禁用；说明原因 |
| Loading | 选项骨架与题干骨架保持原布局，不闪烁大量动画 |

### 3.2 multipleChoice

| 项目 | 规格 |
| --- | --- |
| Desktop | 1～2 列多选卡片；题干下明确“可以选择多个答案” |
| Tablet | 保留 1～2 列；Landscape 依据容器宽度调整 |
| Mobile | 单列；选中项使用 Check 状态和“已选”文字 |
| Interaction | 选择一个或多个选项；至少一项后提交激活；默认 `EXACT_SET` |
| Keyboard | Tab 访问，Space 切换选中，Enter 提交；不使用颜色作为唯一状态 |
| Touch | 卡片全区域点选，选中与取消有明确反馈 |
| Correct | 显示完整集合正确；不把部分选择误报为正确 |
| Wrong | 显示需要重新检查，不公开未配置的部分分规则 |
| Hint | 可以说明“再找一项”或方向，但不直接给完整集合 |
| Disabled | 提交中或反馈后锁定；未选择任何项时按钮禁用并说明“先选一个答案” |
| Loading | 题干和多张卡片使用骨架；保留多选说明位置 |

### 3.3 fillBlank

| 项目 | 规格 |
| --- | --- |
| Desktop | 题干内嵌大输入框；多个空位可横向分组但保持阅读顺序 |
| Tablet | 空位按题干结构排列；Landscape 不把输入区挤到边缘 |
| Mobile | 逐空输入或上下排列；软键盘打开时当前空位和提交栏保持可见 |
| Interaction | 输入与 `blankId` 对应；支持清空、修改和切换空位 |
| Keyboard | Tab 在空位间移动，Enter 提交或移动由字段配置决定；Focus 清晰 |
| Touch | 输入框高度适合儿童触控，提供清除按钮 |
| Correct | 标记每个空位结果，并提供简短解析 |
| Wrong | 保留输入，指出需要再想想；不强制清空所有空位 |
| Hint | 可以按空位显示方向、首步或关键概念；不直接替换答案 |
| Disabled | 提交中或题目反馈阶段不可编辑；无效空位说明原因 |
| Loading | 输入框骨架与题干占位保持稳定，避免键盘误弹出 |

### 3.4 trueFalse

| 项目 | 规格 |
| --- | --- |
| Desktop | 两张横向大型判断卡；每张为 `AppCard + AppIcon + 文案` |
| Tablet | Landscape 横向，Portrait 上下排列 |
| Mobile | 上下两张大卡，卡片高度适合单手点击 |
| Interaction | 点选“正确”或“错误”；底层数据仍使用布尔值，不用字符串比较评分 |
| Keyboard | Tab 访问两张卡，方向键切换，Space / Enter 选择 |
| Touch | 整张卡可点；不使用 Emoji 对勾 / 叉 |
| Correct | 使用 `CheckCircle` 或 `Info` 等统一图标和文案 |
| Wrong | 显示温和的 `TRY_AGAIN` 角色反馈，保留陈述 |
| Hint | 指向陈述中的关键条件，不直接替学生选择 |
| Disabled | 反馈后锁定，显示已提交状态 |
| Loading | 陈述和两张卡片分别显示骨架 |

### 3.5 dragDrop

| 项目 | 规格 |
| --- | --- |
| Desktop | 左侧 draggable items，右侧 targets；拖动路径清晰，目标有悬停 / Focus 状态 |
| Tablet | 可左右分区；触控拖拽的项目与目标至少 48×48px |
| Mobile | 默认提供点击项目 → 点击目标的替代流程；拖动不是唯一操作 |
| Interaction | 拖动或点选完成 `itemKey → targetKey`；已放置项目可撤回或更换 |
| Keyboard | Focus 到项目后 Space 选择，再 Tab / 方向键到目标，Enter 放置；Escape 取消 |
| Touch | 支持长按拖动，但点击配对必须同等可发现 |
| Correct | 正确放置显示 `CheckCircle`；可继续其他项目 |
| Wrong | 错误目标轻微回弹并显示提示，不把项目永久丢失 |
| Hint | 高亮操作方向或剩余目标类型，不直接替换全部位置 |
| Disabled | 已确认的项目或提交后不可移动；若允许改动，提供“重新放置” |
| Loading | 项目和目标骨架分栏显示，避免先显示空目标造成误操作 |

### 3.6 matching

| 项目 | 规格 |
| --- | --- |
| Desktop | 左右两列项目；选择关系用状态卡或轻量连接，不依赖画线 |
| Tablet | 左右配对，横屏两列、竖屏可上下分组 |
| Mobile | 点击左侧 A → 点击右侧 B 完成配对；不把复杂画线作为唯一操作 |
| Interaction | 键值来自 `leftKey` / `rightKey`；已配对可取消或更换 |
| Keyboard | Tab / 方向键选择 A，Enter 暂存，再选择 B，Enter 配对 |
| Touch | 点击卡片即可配对，目标反馈清晰 |
| Correct | 每对关系给出成功状态；全部完成后再提交或按配置提交 |
| Wrong | 错误配对保留可重试，并说明“再看看它们的关系” |
| Hint | 可以提示一对的属性或方向，不直接连接全部项目 |
| Disabled | 已提交的配对锁定；错误时若允许修改，明确可操作项 |
| Loading | 两侧卡片骨架保持对应数量和层级 |

### 3.7 sorting

| 项目 | 规格 |
| --- | --- |
| Desktop | 纵向排序列表；支持拖动和上移 / 下移按钮 |
| Tablet | 纵向大卡片，拖动手柄与按钮并存 |
| Mobile | 单列；每项配 `上移` / `下移`，保证不用拖动也能完成 |
| Interaction | 以稳定 `itemKey` 记录当前顺序；支持撤销或重新开始 |
| Keyboard | Tab 到项目，Space 开始移动，方向键调整，Enter 确认；也可直接使用上移 / 下移 |
| Touch | 拖动手柄触控区域足够大；按钮操作同等可发现 |
| Correct | 显示顺序完成和解析，不只显示颜色 |
| Wrong | 保留当前顺序，提示检查相邻关系，不随机打乱 |
| Hint | 提示第一步或邻接关系；不直接重排全部项目 |
| Disabled | 提交中或反馈后锁定；不可移动项解释原因 |
| Loading | 列表骨架与按钮占位保持稳定 |

### 3.8 typing

| 项目 | 规格 |
| --- | --- |
| Desktop | 大输入框 + `inputMode` 提示；可显示 TEXT / PINYIN / ENGLISH |
| Tablet | 输入框宽度适合触控键盘，错误提示贴近当前输入 |
| Mobile | 单列大输入框，软键盘出现时自动保持输入和提交可见 |
| Interaction | 输入内容由数据配置的规范化规则处理；组件不自行猜测大小写、空格或拼音规则 |
| Keyboard | 原生输入顺序、Enter 提交；支持清除和重新编辑 |
| Touch | 光标、清除和提交区域适合单手；不强制自定义键盘 |
| Correct | 显示正确反馈；必要时展示标准答案的结构化解释 |
| Wrong | 保留输入，给方向提示或重试，不使用“答案错误”作为唯一文案 |
| Hint | 根据题目配置显示线索，不直接替换输入 |
| Disabled | 提交中、未加载完成或反馈后禁用输入 |
| Loading | 只显示输入骨架，不自动弹出软键盘 |

### 3.9 listening

| 项目 | 规格 |
| --- | --- |
| Desktop | 大型播放区 + 播放次数 / 状态 + 选项或输入区；音频状态清晰 |
| Tablet | 播放区保持大按钮；选项可在下方或侧栏 |
| Mobile | 播放按钮优先居中，文本说明紧随其后；支持重播状态 |
| Interaction | 点击播放、暂停或重播；`maxReplays` 由数据配置；答案仍由选项或文本规则处理 |
| Keyboard | Space 播放 / 暂停，Tab 进入重播和答案；音频状态可读 |
| Touch | 播放按钮至少 48×48px；不要用 Emoji 播放符号 |
| Correct | 显示 `CheckCircle` 和解释；可再次听取但不阻塞下一题 |
| Wrong | 提供再听一次、提示或解析，不羞辱学生 |
| Hint | 可以给出听辨方向或关键词；不直接给答案 |
| Disabled | 音频未加载或达到重播上限时说明原因；答案区仍按配置处理 |
| Loading | 显示音频加载；播放失败时显示“音频没有加载出来” + 重试；若有 `transcript` 提供文字替代 |

### 3.10 calculation

| 项目 | 规格 |
| --- | --- |
| Desktop | 结构化 Formula / expression 区 + 数值输入区；单位和格式紧邻输入 |
| Tablet | 公式和输入上下排列；Landscape 可并列但不降低字号 |
| Mobile | 公式上方，输入下方；优先系统数字键盘，未来可接儿童数字键盘 |
| Interaction | 输入数值或单位值；容差、分数、格式由 `CalculationAnswerRule` 决定 |
| Keyboard | 数字、退格、Enter 提交；Focus 顺序先表达式说明再输入 |
| Touch | 数字输入框足够大；自定义数字键盘若未来启用也需支持退格和清除 |
| Correct | 反馈计算结果与关键步骤，使用结构化公式 |
| Wrong | 指出可重新检查哪一步；不直接把错误答案变成失败标签 |
| Hint | 按步骤提示运算方向，不直接代入最终答案 |
| Disabled | 表达式加载失败或提交中禁用；说明“正在准备计算题” |
| Loading | Formula 和输入区骨架；不把公式降级为未经结构化的长字符串展示 |

### 3.11 reading

| 项目 | 规格 |
| --- | --- |
| Desktop | 阅读材料与问题左右布局；材料可滚动，问题保持可见 |
| Tablet | Landscape 左右、Portrait 上下；材料和问题都保留标题 |
| Mobile | 材料区 + 问题区纵向；材料支持展开 / 收起，不反复跳页面 |
| Interaction | 子题通过 `subQuestionIds` 关联；材料状态和题目进度独立但不丢上下文 |
| Keyboard | Tab 在材料控制、题目和提交间顺序移动；展开 / 收起可键盘操作 |
| Touch | 材料展开、收起按钮至少 44×44px；长材料支持触控滚动 |
| Correct | 子题反馈和整体阅读目标分开表达 |
| Wrong | 保留材料位置和题目答案，提示回看相关段落 |
| Hint | 指向段落或信息关系，不直接给出答案 |
| Disabled | 材料未加载时题目不可误提交；显示重试或文字替代 |
| Loading | 材料和问题分别显示骨架；材料加载失败可显示已审核的文字替代 |

### 3.12 sentenceOrdering

| 项目 | 规格 |
| --- | --- |
| Desktop | token 卡片横向或多行排列；提供拖动和上移 / 下移 |
| Tablet | token 可换行；操作区不超出可读宽度 |
| Mobile | 纵向或可换行 token；点击排序和上移 / 下移与拖动并列 |
| Interaction | `tokenKey` 稳定，`text` 为纯文字结构；标点 token 按数据规则处理 |
| Keyboard | Tab 进入 token，Space 选中，方向键移动，Enter 确认；也可使用上移 / 下移 |
| Touch | token 卡片全区域可点或拖动，提供撤销 |
| Correct | 显示排列完成和句意 / 规则解析 |
| Wrong | 保留当前排列，提示检查句子关系，不强制重置 |
| Hint | 指向首词、连接关系或标点位置，不直接完成排列 |
| Disabled | 提交后或题目状态锁定时不可编辑 |
| Loading | token 骨架按数量显示，避免位置突然重排 |

### 3.13 speaking（未来接口，占位）

| 项目 | 规格 |
| --- | --- |
| Desktop / Tablet / Mobile | 只设计 `Speaking Placeholder`：题干、参考音频入口、未来录音区域位置 |
| Interaction | MVP 不实现录音上传、语音识别、自动评分或音频保留 |
| Keyboard / Touch | 占位说明和返回可访问；不制造假的录音按钮行为 |
| Correct / Wrong / Hint | 只展示“该能力将在后续版本开放”，不产生虚假评分 |
| Disabled | `mvpIncluded: false`，使用“即将开放” |
| Loading | 不进入实际加载流程 |

---

## 4. Question Wireframe

以下 Wireframe 只表达布局变化，不代表最终插画、颜色或工程代码。

### 4.1 singleChoice

```text
Desktop                         Tablet                         Mobile
┌──────────────────┐            ┌────────────────────┐         ┌──────────────┐
│ 退出  3 / 10      │            │ 退出  3 / 10        │         │退出 3/10      │
│ 题干 ContentBlock │            │ 题干 ContentBlock   │         │题干            │
│                  │            │                    │         │[选项 A]        │
│ [A]       [B]     │            │ [A]                │         │[选项 B]        │
│ [C]       [D]     │            │ [B]                │         │[选项 C]        │
│      [提交]       │            │ [C] [D]             │         │[选项 D]        │
└──────────────────┘            │ [提交]              │         │[看看提示][提交]│
                                └────────────────────┘         └──────────────┘
```

### 4.2 dragDrop

```text
Desktop                         Tablet                         Mobile
┌──────────────────┐            ┌────────────────────┐         ┌──────────────┐
│题干 / 媒体       │            │题干 / 媒体          │         │题干 / 媒体    │
│项目列   目标列    │            │项目列              │         │选择项目       │
│[项目 A] [目标 1] │            │[项目 A]            │         │[项目 A]       │
│[项目 B] [目标 2] │            │目标 1              │         │选择目标       │
│[提交]            │            │目标 2              │         │[目标 1]       │
└──────────────────┘            │[点击配对][提交]     │         │[目标 2][提交]  │
                                └────────────────────┘         └──────────────┘
```

### 4.3 calculation

```text
Desktop                         Tablet                         Mobile
┌──────────────────┐            ┌────────────────────┐         ┌──────────────┐
│题号 / 进度       │            │题号 / 进度          │         │题号 / 进度    │
│ Formula           │            │ Formula             │         │Formula        │
│ [数值输入] [单位]│            │ [数值输入]          │         │[数值输入]     │
│ [提示] [提交]    │            │ [单位]              │         │[单位]         │
└──────────────────┘            │ [提示] [提交]       │         │[看看提示][提交]│
                                └────────────────────┘         └──────────────┘
```

### 4.4 reading

```text
Desktop                         Tablet                         Mobile
┌──────────────────┐            ┌────────────────────┐         ┌──────────────┐
│题号 / 进度       │            │题号 / 进度          │         │题号 / 进度    │
│ 阅读材料         │            │ 阅读材料            │         │[展开材料]     │
│                  │            │                    │         │材料区         │
│ 问题 + 选项      │            │ 问题 + 选项         │         │问题区         │
│ [提交]           │            │ [提交]              │         │[提交]         │
└──────────────────┘            └────────────────────┘         └──────────────┘
```

## 5. 可访问性与媒体

- 题干中的 `TEXT` / `RICH_TEXT` 需要可读顺序；`IMAGE` 需要 `altText`。
- `AUDIO` 需要播放状态、重播入口和 `transcript` 或明确文字替代。
- `FORMULA` 不用一串普通文本替代结构化表达；辅助技术需要可读的公式说明。
- `IMAGE`、`AUDIO`、`VIDEO`、`ANIMATION`、`SVG` 的真实资源只从 `MediaAsset` 读取。
- Focus、选中、错误、正确和禁用状态都不能只靠颜色。
- DragDrop、Matching、Sorting、SentenceOrdering 均提供非拖动替代。
- 移动端软键盘、Safe Area 和滚动位置不得遮挡输入或提交。

## 6. Question UI 验收

1. 所有题型使用同一 `QuestionShell`，题干、提示、反馈和提交位置稳定。
2. `QuestionRenderer` 只依据协议渲染，不修改答案规则、normalization 或教材归属。
3. 所有结构化内容支持 `ContentBlock[]`；选项、提示、解析和拖拽 / 匹配 / 排序项目不被简化成 string-only。
4. Mobile 可单手完成主要操作，拖拽、画线和输入都有替代方案。
5. 正确、错误、提示、加载、禁用、离线和网络错误均可理解且可恢复。
6. 错误不自动跳题，不出现 `Game Over`、Emoji 或羞辱性文案。
7. `speaking` 仅为接口占位，MVP 不录音、不上传、不自动评分。
8. 题目媒体具备 `MediaAsset` 的来源、版权、版本和无障碍信息。

## 7. PHASE 9 工程实现映射

PHASE 9 实现了本文件中六类题型的核心交互：统一 `QuestionRenderer` 注册表、结构化题干与媒体、radio / checkbox / 文本输入、提交锁定、`AnswerFeedback`、解析展示和可恢复 `QuestionSession`。正式页面为 `/assessment`，开发页面 `/dev/question-engine` 提供完整、恢复、完成、空、错误、未开放、Sample 和 Unverified 状态 Showcase。

题型组件只发出 `QuestionAnswerDraft`，判题由独立确定性 Validator 完成。PHASE 9 不实现拖拽、匹配、排序、听力、阅读、口语的运行时题型，不实现 AI 评分、掌握度、知识能量、错题本或奖励。
