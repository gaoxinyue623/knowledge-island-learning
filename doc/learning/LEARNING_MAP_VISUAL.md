# 知识岛｜LearningMap 视觉与响应式实现

> 本文档记录 PHASE 7 的地图视觉实现与工程验证。视觉方向继承 `VISUAL_DIRECTION.md`、`DESIGN_SYSTEM.md`、`CORE_PAGE_SPEC.md` 和 `MOTION_SYSTEM.md`；本阶段使用 CSS / SVG 占位，不引入游戏引擎或大规模正式美术资产。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | PHASE 7.4 |
| 状态 | 已实现并完成浏览器视口验证 |
| 视觉入口 | `src/components/learning-map/`、`src/styles/learning-map.css` |
| 资源策略 | CSS Shape、SVG Path、AppIcon 和 Visual Registry；不在 Curriculum 中保存视觉 URL |
| 图标规则 | 使用 `AppIcon` / Lucide 注册图标；不使用 Emoji |

## 1. 视觉原则

地图应让儿童感到“正在探索一片知识海域”，而不是查看后台课程表：

- `Textbook` 提供真实教材上下文，但不替代游戏世界主题。
- `Unit` 是一座知识岛，`Lesson` 是岛上的学习区域，`KnowledgePoint` 是可探索节点。
- 路径、当前节点和状态比装饰更突出；装饰只建立空间层次，不承载课程事实。
- 主题名如雾林、晴港、星光山谷属于地图 Presentation，不得替换真实 Unit 标题。
- 文案保持轻量、可解释，数据标识使用“开发样本”“未审核数据”，不把完成度写成掌握度。

## 2. 视觉层级

### 2.1 Unit Island

`UnitIsland` 展示 Unit title、subtitle、区域数量、Unit 完成度和路径状态。每座岛使用 `visualRegistry.ts` 根据 subject + unit index 稳定分配 biome、landmark 和 decorationSet：

| 数学主题键 | 地图表现 |
| --- | --- |
| `mist-forest` | 雾林 / treehouse / leafy path |
| `sunny-port` | 晴港 / lighthouse / paper sails |
| `starlight-valley` | 星光山谷 / observatory / star dots |
| `mechanical-city` | 机械城 / clock tower / gear garden |
| `cloud-garden` | 云朵花园 / sky bridge / soft clouds |

这些只是稳定的视觉配置键，不是教材名称或课程事实。

### 2.2 Lesson Region

`LessonRegion` 使用轻量区域标题、学习区域标签和区域完成度承载 Lesson。区域内部的节点位置由逻辑坐标换算，节点和文字不得重叠；关系线位于背景 SVG 层，不能覆盖按钮的可点击区域。

### 2.3 Knowledge Node

`KnowledgeNode` 是真实的 `<button>`，至少表达：标题、状态、完成度和选中态。状态使用图标、颜色、文字和边框共同表达：

| 状态 | 主要视觉 / 交互 |
| --- | --- |
| `locked` | Lock 图标、低对比度、仍可打开详情查看前置条件；详情主操作禁用 |
| `available` | Sparkles 图标、主色强调、可以开始演示 |
| `learning` | Lightbulb 图标、暖色进行中强调、可以完成演示 |
| `completed` | Check 图标、成功色、完成度 100% |
| `mastered` | CheckCircle 图标、仅状态 fixture 展示 |
| `perfect` | Star 图标、仅状态 fixture 展示 |

节点可点击区域由按钮盒承担，不依赖小图标。`aria-label` 会包含标题、状态和完成度。

## 3. 连接线

`MapConnection` 使用 SVG cubic path 表达 KnowledgePoint 之间的关系。前置关系状态为：

- `locked`：前置尚未完成。
- `available`：源节点已完成、目标尚未完成，或非前置关系。
- `completed`：前置关系两端均已完成。

连接线是方向提示，不是复杂 Pathfinding 或地图编辑器。缺少端点的关系不会绘制，并由 Adapter 记录诊断。

## 4. 确定性布局

`buildLearningMapLayout()` 使用逻辑坐标，不保存 viewport 像素，也不调用 `Math.random()`：

- Canvas logical width：`1000`。
- Unit 横向内边距：`40`，Unit 间距：`42`。
- Unit 最小高度：`220`，高度随 Lesson 数量确定。
- Unit 按 `unit.sort` / `id` 排序，Lesson 按 `lesson.sort` / `id` 排序。
- Lesson 区域与节点按稳定顺序布置，节点使用有限步长和轻微交错 y 偏移。
- 相同 Curriculum source 必须产生相同 Unit、Lesson 和 Node 坐标。

容器根据 Canvas ratio 缩放到页面宽度；课程数据不储存 `x`、`y`、颜色、图片或主题字段。测试使用 `samePosition` 和 ViewModel 两次构建结果验证稳定性。

## 5. 响应式规则

| 视口 | 地图表现 |
| --- | --- |
| Mobile `<768px` | 单列纵向滚动、减少装饰、节点保持大触控区域；Node Detail 为底部面板 |
| Tablet `768–1199px` | 保留较大场景和触控尺寸，地图容器自适应；不把桌面表单简单缩小 |
| Desktop `≥1200px` | 更宽的场景和完整岛屿关系；Node Detail 使用侧边面板 |

PHASE 7 浏览器验证视口：`375×812`、`390×844`、`430×932`、`768×1024`、`1024×768`、`1440×900`。各视口均显示 18 个 Demo 节点且没有横向溢出；移动端打开节点详情后仍可看到开始动作，未遮挡或超出视口。

## 6. 动效与可访问性

- 仅使用轻量 CSS transition / scene decoration；不引入 Three.js、PixiJS、Phaser、Cocos、WebGL 或大型游戏引擎。
- 地图装饰、节点 focus / selected 和进度变化可以有轻微动效；动效不阻塞 CTA。
- `prefers-reduced-motion: reduce` 时关闭循环漂浮、过渡和装饰动画，保留静态状态、焦点和文案反馈。
- 节点使用 `<button type="button">`，关闭面板使用带 `aria-label` 的按钮，地图连接 SVG 提供可理解的区域标签。
- 使用 `:focus-visible` 保留键盘焦点轮廓；状态不只依赖颜色。
- 交互组件的触控目标遵循至少 `44px` 的设计底线。

## 7. 当前限制

当前地图视觉使用可维护的 CSS / SVG 占位地标，没有正式角色行走、自由拖拽、无限画布、双指缩放、复杂摄像机、正式媒体资产或地图编辑器。正式美术资产仍需经过原创性、来源和版权审核；不能把 Demo 主题解释为真实教材故事。
