# 知识岛｜PHASE 3 设计系统

> 本文档定义知识岛学生端、家长端和后续工程共用的视觉基础与基础组件契约。它是 PHASE 3 的设计文档，不代表已有组件、样式或前端工程已经实现。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 3：UI / UX + 游戏视觉系统 + 多端响应式设计 |
| 状态 | 仅设计；未实现 |
| 上游事实源 | `PRODUCT.md`、`CURRICULUM.md`、`DATA_MODEL.md`、`CONTENT_REVIEW.md` |
| 下游消费者 | `PAGE_SPEC.md`、`RESPONSIVE_DESIGN.md`、`QUESTION_UI.md`、后续 Vue 3 工程 |
| 适用范围 | 学生端、家长中心、课程配置与学习内容 |
| 资产原则 | 当前使用原创 Placeholder；正式资产必须关联 `MediaAsset` |

---

## 1. 设计原则

1. **学习优先**：视觉、游戏奖励和动效服务于理解、练习、反馈、复习与持续学习。
2. **开场像游戏，操作像学习产品**：课程配置和地图要有探索感，但不把学生带入复杂游戏菜单。
3. **圆润、清新、低压力**：使用柔和色彩、清晰层级和适度空间感；避免高饱和、过度幼儿化和后台管理风格。
4. **事实与主题分离**：游戏世界名称是 UI 配置；地区、出版社、教材版本、单元和课程目标只能来自课程数据层。
5. **状态不依赖颜色**：状态必须由颜色 + `AppIcon` + 文案，必要时再加形状或纹理表达。
6. **所有年龄共用组件骨架**：通过信息密度、插画比例和文字比例适配年龄，不为不同年龄建立完全不同的组件体系。
7. **无 Emoji、无商业 IP 临时素材**：图标统一走 `AppIcon`；角色、地图和装饰使用原创 SVG 或占位几何图形。
8. **触控与可访问性默认存在**：交互目标至少 44×44px，键盘、Focus、ARIA、Alt 和 Transcript 不是后置补丁。

## 2. 视觉层级

```text
Foundation
  ↓
Design Tokens
  ↓
Primitive Components
  ↓
Business Components
  ↓
Page Templates
  ↓
Learning Flows
```

页面只能组合已定义的基础和业务组件，不在单个页面重新发明 Button、Card、Modal、Icon 或状态表达。

### 2.1 学生端优先级

```text
主要学习动作
  > 今日任务 / 当前关卡
  > 学科与地图上下文
  > 进度与复习提醒
  > XP、星星、金币和装扮
```

成长资源不能压过“继续学习”或“开始练习”。

### 2.2 家长端优先级

家长端可以增加信息密度，但仍继承品牌色、圆角和知识团子元素。数据图表必须能追溯到学习记录，不能用游戏奖励替代学习结论。

---

## 3. Design Token

Token 名称是正式工程的唯一引用入口。下表的值是 PHASE 3 建议初值，后续可在视觉测试中微调；组件不应直接写死颜色、间距或阴影值。

### 3.1 Color

| Token | 建议值 | 用途 |
| --- | --- | --- |
| `color.primary` | `#4C7CF0` | 主 CTA、当前选中和全局品牌动作 |
| `color.primarySoft` | `#EAF0FF` | 主色浅底、选中容器 |
| `color.subject.chinese` | `#E98962` | 语文学科主题 |
| `color.subject.chineseSoft` | `#FFF0EA` | 语文浅底 |
| `color.subject.math` | `#4F9DDF` | 数学学科主题 |
| `color.subject.mathSoft` | `#EAF6FF` | 数学浅底 |
| `color.subject.english` | `#6BB98B` | 英语学科主题 |
| `color.subject.englishSoft` | `#EDFAF2` | 英语浅底 |
| `color.character.base` | `#75C7B7` | KnowledgeDango 默认主体色 |
| `color.character.shadow` | `#4F9C96` | KnowledgeDango 局部阴影 |
| `color.character.highlight` | `#DDF7EF` | KnowledgeDango 局部高光 |
| `color.character.ink` | `#294456` | KnowledgeDango 表情线与轮廓细节 |
| `color.success` | `#42AF78` | 正确、完成、可继续 |
| `color.successSoft` | `#E9F8EF` | 正确反馈浅底 |
| `color.warning` | `#D99A36` | 提示、需要确认、复习提醒 |
| `color.warningSoft` | `#FFF6E2` | 提示浅底 |
| `color.error` | `#D97872` | 可恢复的错误状态 |
| `color.errorSoft` | `#FFF0EF` | 错误浅底 |
| `color.info` | `#579FC0` | 信息说明 |
| `color.locked` | `#9BA8B8` | 锁定与不可用 |
| `color.lockedSoft` | `#F0F3F7` | 锁定浅底 |
| `color.background` | `#F5F8FC` | 页面背景 |
| `color.surface` | `#FFFFFF` | 卡片、弹层、输入区域 |
| `color.surfaceMuted` | `#F1F5F9` | 次级区域 |
| `color.text.primary` | `#24334B` | 主文字 |
| `color.text.secondary` | `#63728A` | 次级文字 |
| `color.text.tertiary` | `#8C99AA` | 辅助说明 |
| `color.text.inverse` | `#FFFFFF` | 深色主按钮文字 |
| `color.border` | `#DCE5F0` | 默认边框 |
| `color.borderStrong` | `#BBC9D9` | Focus 或强调边框 |

颜色规则：

- PHASE 3 Light Theme 为默认主题；保留 Dark Theme 的 token 接口，但不在本阶段扩展完整暗色视觉。
- 禁止所有页面使用大面积渐变作为背景或组件默认样式；空间感通过插画、层次、阴影和局部色块建立。
- 学科色不承担成功、错误、锁定等通用状态含义。
- 建议对比度、Focus 和色盲可识别性须在工程验收中复核。

### 3.2 Typography

使用系统安全字体栈，不直接打包商业字体：

```text
font.family.sans = system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif
font.family.number = ui-rounded, system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif
```

| Token | 建议字号 | 行高 | 用途 |
| --- | ---: | ---: | --- |
| `font.display` | 40px | 1.15 | 首屏主标题、角色开场 |
| `font.heading1` | 32px | 1.2 | 页面主标题 |
| `font.heading2` | 26px | 1.25 | 世界、单元或结果标题 |
| `font.heading3` | 20px | 1.3 | 卡片标题、关卡标题 |
| `font.bodyLarge` | 18px | 1.55 | 儿童端关键说明 |
| `font.body` | 16px | 1.55 | 正文、按钮和表单辅助 |
| `font.bodySmall` | 14px | 1.5 | 次要信息；移动端不低于此值 |
| `font.caption` | 12px | 1.4 | 标签、时间、来源说明 |
| `font.button` | 16px | 1.2 | 主次按钮文字 |
| `font.numberLarge` | 40px | 1.0 | 年级数字、分数或进度数字 |

规则：移动端正文不小于约 14px，按钮不小于约 16px；避免大段全大写或超细字重。数字、百分比和时间要与说明文字保持清晰层级。

### 3.3 Spacing

| Token | 值 | 典型用途 |
| --- | ---: | --- |
| `space.1` | 4px | 图标与文字的微间距 |
| `space.2` | 8px | 紧凑标签、行内间距 |
| `space.3` | 12px | 小组件内边距 |
| `space.4` | 16px | 默认组件间距、按钮内边距 |
| `space.5` | 20px | 卡片内容分组 |
| `space.6` | 24px | 卡片内边距、主要分区 |
| `space.8` | 32px | 页面区块间距 |
| `space.10` | 40px | 大区块间距 |
| `space.12` | 48px | 页面顶部和主视觉留白 |
| `space.16` | 64px | 大场景安全留白 |

页面只使用 token，不出现大量 13px、17px、19px 这类未经定义的随机间距。

### 3.4 Radius

| Token | 值 | 典型用途 |
| --- | ---: | --- |
| `radius.xs` | 8px | 小标签、小输入框 |
| `radius.sm` | 12px | 小卡片、次级按钮 |
| `radius.md` | 16px | 默认按钮、卡片 |
| `radius.lg` | 20px | 主卡片、学科入口 |
| `radius.xl` | 28px | Modal、Onboarding 主容器 |
| `radius.full` | 999px | 胶囊标签、头像、进度条 |

### 3.5 Shadow

| Token | 建议值 | 典型用途 |
| --- | --- | --- |
| `shadow.sm` | `0 2px 8px rgba(36,51,75,.06)` | 浅浮起卡片 |
| `shadow.md` | `0 8px 24px rgba(36,51,75,.10)` | 可交互卡片、Dock |
| `shadow.lg` | `0 16px 40px rgba(36,51,75,.14)` | Modal、Drawer |
| `shadow.float` | `0 12px 28px rgba(76,124,240,.18)` | 当前任务、主 CTA |
| `shadow.reward` | `0 10px 28px rgba(217,154,54,.18)` | 奖励面板 |

阴影保持柔和、低透明度，不使用厚重黑色边缘或拟真高光。

### 3.6 Z-index

| Token | 值 | 用途 |
| --- | ---: | --- |
| `z.base` | 0 | 页面内容 |
| `z.sticky` | 10 | Sticky Header、学习进度 |
| `z.dock` | 20 | 导航 Dock、Mobile Bottom Navigation |
| `z.popover` | 30 | Tooltip、Popover |
| `z.drawer` | 40 | Drawer、BottomSheet |
| `z.modal` | 50 | Modal、离开确认 |
| `z.toast` | 60 | Toast、全局反馈 |

### 3.7 Breakpoint 与 Layout

| Token | 范围 | 主要策略 |
| --- | --- | --- |
| `breakpoint.mobile` | `<768px` | 单列、一步一屏、底部导航 |
| `breakpoint.tablet` | `768–1199px` | 触控优先，区分横屏与竖屏 |
| `breakpoint.desktop` | `≥1200px` | 大场景、双栏或多栏、轻量 Dock |
| `layout.contentMax` | 1440–1600px | 普通内容最大宽度 |
| `layout.onboardingMax` | 900–1100px | 首次配置居中主卡片 |
| `layout.questionMax` | 760–920px | 题目阅读与作答宽度 |

布局同时采用 Container Query 思想：组件根据自身容器可用宽度调整，而不是只读取 window width。

### 3.8 Touch 与 Icon

| Token | 建议值 | 说明 |
| --- | ---: | --- |
| `touchTarget.min` | 44×44px | 所有触控、键盘可聚焦的交互目标 |
| `touchTarget.comfortable` | 48×48px | 低年级主按钮、题型选项优先 |
| `icon.size.sm` | 16px | 辅助信息 |
| `icon.size.md` | 20px | 行内图标 |
| `icon.size.lg` | 24px | 默认操作图标 |
| `icon.size.xl` | 32px | 卡片、导航 |
| `icon.size.display` | 40–48px | 空状态、地图节点、主视觉 |

`AppIcon` Props：`name`、`size`、`strokeWidth`、`color`、`ariaLabel`、`decorative`。图标来源为 Lucide 或原创 SVG，分类包含 `navigation`、`learning`、`subject`、`reward`、`status`、`character`、`map`、`question`、`system`、`region`、`textbook`。

---

## 4. 基础组件契约

### 4.1 AppIcon

- 统一承载导航、学习、学科、奖励、状态、地图、地区和教材图标。
- 有语义的图标必须有 `ariaLabel`；装饰图标标记 `decorative`。
- 不允许页面直接写 Emoji 或直接混用未经登记的 SVG。

### 4.2 AppButton

| Variant | 用途 | 视觉优先级 |
| --- | --- | --- |
| `primary` | 页面唯一主 CTA，如“开始学习”“确认教材” | 最高 |
| `secondary` | 次要但明确的动作，如“更换版本” | 中 |
| `quiet` | 返回、跳过、查看详情 | 低 |
| `outline` | 选择、筛选和辅助操作 | 低至中 |
| `text` | 轻量链接动作 | 最低 |
| `destructive` | 删除或不可逆操作，仅家长/设置场景 | 受控使用 |

每个页面原则上只保留一个 `primary` CTA。按钮支持 `default`、`hover`、`focus-visible`、`pressed`、`disabled`、`loading`；`loading` 时保留按钮宽度并提供文字或状态变化。

### 4.3 AppCard

| Variant | 用途 |
| --- | --- |
| `surface` | 普通内容容器 |
| `interactive` | 可进入课程或任务 |
| `selected` | 当前地区、年级或教材已选 |
| `subject` | 语文、数学、英语入口 |
| `status` | 空状态、错误或复习提示 |
| `disabled` | 即将开放、暂不可用；必须有原因 |
| `parent` | 家长端数据摘要 |

卡片不可只靠阴影区分交互状态；至少配合边框、图标、文字或 Focus。

### 4.4 AppModal / AppDrawer / AppBottomSheet

- `AppModal`：确认、教材辅助说明、不可逆选择；Desktop 居中，Mobile 适配可读宽度。
- `AppDrawer`：Desktop / Tablet 的辅助设置或导航；不承载复杂后台表格。
- `AppBottomSheet`：Mobile 上的教材帮助、离开关卡、版本选择摘要；支持拖动关闭与明确关闭按钮。
- 所有弹层必须锁定背景焦点、支持 Escape、保留可读标题和返回路径。

### 4.5 AppProgress / AppBadge

- `AppProgress` 用于任务、学习进度和知识能量；提供文字或 `aria-valuenow`，不能只显示颜色。
- `AppBadge` 用于“当前支持”“即将开放”“需要确认”“推荐”等短状态，不用于堆叠技术字段。

### 4.6 AppToast / AppSkeleton / AppEmptyState / AppLoading

- Toast 只反馈短暂结果，不承载必须阅读的错误解释。
- Skeleton 按真实布局占位；加载教材解析时显示“正在准备你的课本”。
- Empty State 必须有知识团子 / 原创插画、可理解文案和下一步动作；禁止空白、`No Data`、`Null`、`Undefined`。
- Loading 需考虑 Reduced Motion；默认使用轻量知识团子动作和“正在准备关卡”等文案。

---

## 5. 状态表达规则

### 5.1 状态组合

| 状态 | 图标示例 | 文案示例 | 形状 / 颜色 |
| --- | --- | --- | --- |
| 成功 | `CheckCircle` | “答对啦” | `success` + 实心或勾形容器 |
| 提示 | `Lightbulb` / `Info` | “看看这个提示” | `warning` + 浅底 |
| 错误 | `MessageCircle` / `RefreshCcw` | “差一点，再试一次” | `error` + 柔和边框 |
| 锁定 | `Lock` | “完成上一关后解锁” | 灰阶 + 锁形容器 |
| 复习 | `RotateCcw` | “需要复习” | `warning` + 复习标记 |
| 即将开放 | `Clock3` | “即将开放” | 中性灰 + 禁用卡片 |
| 需要确认 | `CircleHelp` | “请确认你的课本” | `info` / `warning` + 提示容器 |

### 5.2 内容审核状态在学生端的边界

学生端不展示 `DRAFT`、`AI_GENERATED`、`REVIEWED`、`VERIFIED`、`REJECTED` 等后台审核枚举。未达 `PUBLISHED` 的课程内容不进入学习路径；教材候选是否可显示由已核验的 `RegionTextbookRelation`、`TextbookVersion` 和 `Publisher` 数据决定。

### 5.3 掌握度与知识能量

- 学生端使用“正在学习”“基本掌握”“掌握良好”“已经熟练”等可理解文案。
- `masteryScore` 是当前学习证据，不因时间流逝自动下降；它不在学生端默认显示具体百分比。
- `KnowledgeEnergy` 只表达复习时机，使用“充足”“需要复习”“快来充能”等文案；不能显示“记忆衰减率”。

---

## 6. 资产与图标边界

当前设计阶段使用 `KnowledgeDangoPlaceholder`、基础几何原创占位或抽象 SVG，不导入真实商业角色、教育 App 截图或未经授权的教材图片。

正式资产分类：

```text
icons / illustrations / characters / character-outfits / pets
maps / backgrounds / effects / question-media / subject-assets / onboarding-assets
```

正式资产必须由 `MediaAsset` 记录来源、版权状态、许可、版本、尺寸、时长、替代文字和文字稿（如适用）。课程内容与题目只保存 `mediaAssetId`，不保存真实 URI。

---

## 7. 可访问性底线

- 键盘可以完成导航、选择、排序、提交和返回。
- 所有可聚焦元素有清晰的 `focus-visible` 表现。
- 互动图标有可访问名称；装饰图标不重复朗读。
- 图片有 `altText`；音频有 `transcript` 或明确文字替代。
- 状态不只通过颜色表达；错误和成功有图标与文案。
- 触控目标至少 44×44px，移动端主要题目选项优先 48×48px。
- DragDrop、Matching、Sorting 都有非拖拽或非画线替代操作。
- 支持 `prefers-reduced-motion`，关闭漂浮、循环装饰和大粒子动画。

## 8. 设计验收

1. 任何页面都能追溯到本系统的颜色、字体、间距、圆角和状态 Token。
2. 页面没有 Emoji、商业 IP 临时素材、Element Plus 后台视觉或大量纯白 Dashboard 卡片。
3. 主 CTA 明确，状态不只靠颜色，错误可恢复。
4. 教材卡片显示数据层提供的地区、出版社和教材版本信息，不能由 UI 猜测。
5. 组件在 Desktop、Tablet、Mobile 下不依赖缩小整页解决布局问题。
6. 动效遵守 `MOTION_SYSTEM.md`，减少运动模式下仍可理解。
