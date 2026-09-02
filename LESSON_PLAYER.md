# 知识岛｜LessonPlayer 实现说明

> 本文档记录 PHASE 8.1～8.4 的 LessonPlayer / Knowledge Learning Flow 工程事实、边界和验证入口。它补充 `PRODUCT.md`、`DATA_MODEL.md` 与 `CONTENT_REVIEW.md`，不替代课程事实、题目协议或内容审核规则。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | PHASE 8.4：LessonPlayer / Knowledge Learning Flow |
| 状态 | LessonPlayer、内容块渲染、会话恢复、完成回链和开发 Showcase 已实现；完成后停止 |
| 正式入口 | `/lesson` |
| 开发入口 | `/dev/lesson-player`、`/dev/lesson-player/states` |
| 主要代码 | `src/types/lesson-player.ts`、`src/services/lesson-player/`、`src/stores/lessonPlayerStore.ts`、`src/components/lesson-player/`、`src/pages/LessonPlayerPage.vue` |
| 数据事实 | 当前正式课程仍受 `REVIEWED` 闸门保护；Demo Lesson 是原创 `SAMPLE` Fixture；Golden 内容为 `UNVERIFIED` 占位 |

## 1. 产品闭环

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
LearningMapCompletionService
  ↓
返回 LearningMap 并 focusNodeId
```

LessonPlayer 的目标是让学生围绕一个 KnowledgePoint 走完一段短学习步骤。它负责“看懂、互动、继续和完成”，不负责题目作答、评分或掌握度计算。

## 2. 领域边界

### 2.1 Launch Context

PHASE 7 已有的 `LessonLaunchContext` 被直接复用：

```ts
interface LessonLaunchContext {
  textbookId: string;
  unitId: string;
  lessonId: string;
  knowledgePointId: string;
}
```

进入正常学习状态前，`LessonPlayerRepository` 和 Adapter 必须确认：教材存在、Unit 属于教材、Lesson 属于 Unit、KnowledgePoint 存在，以及 LessonKnowledgePoint 映射属于当前 Lesson。失败时返回 `INVALID_CONTEXT` 或对应的不可用状态，不渲染正常内容。

### 2.2 课程内容与 ViewModel

课程域仍是事实来源：

```text
Textbook → Unit → Lesson → LessonKnowledgePoint → KnowledgePoint
                                              ↓
                                        LearningContent
```

`LearningContentRepository` 读取现有 `CourseContent` 并复用 `ContentBlock`；`LessonPlayerAdapter` 负责把课程事实、内容、媒体和会话转换为 `LessonPlayerViewModel`。页面不直接调用多个 Repository，也不把 LessonPlayer 专用字段写回课程实体。

`LessonPlayerViewModel` 至少包含课程上下文、教材 / Unit / Lesson / KnowledgePoint 摘要、学习目标、排序后的步骤、当前步骤、会话进度、`isSample`、`isUnverified`、`isDemo` 和内容可用状态。

### 2.3 LessonStep

最小导航单位是 `LessonStep`，类型为 `intro`、`concept`、`explanation`、`example`、`media`、`interactive`、`practice` 或 `summary`。步骤通过 `contentBlockIds` 引用结构化内容块；`practice` 在本阶段只是 Practice Placeholder，不是题目。

## 3. 审核与数据集

正式 LessonPlayer 同时检查 Curriculum 与 LearningContent：课程结构已 `REVIEWED` 但 LearningContent 未 `REVIEWED` 时仍返回“该学习内容暂未开放”。不能因为教材或映射已核验，就跳过内容审核。

| 数据集 | 可用入口 | 目的 | 规则 |
| --- | --- | --- | --- |
| `profile` | 正式 `/lesson` | 读取学生当前课程 | 生产只允许审核通过的课程与内容 |
| `demo` | `/dev/lesson-player` | 验证步骤、会话和交互 | Demo / SAMPLE 必须显示开发样本提示 |
| `golden` | 开发验证 | 验证未核验课程形状 | UNVERIFIED 只读，不进入正式入口 |

Demo Lesson 使用原创、虚构、通用内容，不复制教材正文、练习册或受版权保护的完整例题。所有 Demo 记录保持 `isSample: true`、`verificationStatus: SAMPLE`。

## 4. 页面与状态

正式 `/lesson` 通过显式 query 传入四个上下文 ID，并支持 `returnTo`、`mapNodeId` 和数据集参数的受控回链。开发页还提供 `full`、`resume`、`completed`、`empty`、`not_available`、`error`、`sample` 和 `unverified` 状态 Showcase。

页面状态含义：

- `loading`：读取课程内容与会话。
- `ready`：存在可读内容，学生可以开始或继续。
- `completed`：本次会话的必需步骤已完成。
- `empty`：知识点存在，但没有可渲染步骤。
- `not_available`：内容或审核状态不允许正式读取。
- `error`：上下文、仓储或读取发生错误，提供重试和返回地图。

内容卡显示学习目标、步骤序号、当前内容块、上一步 / 下一步和完成操作。完成文案明确说明“完成学习不等于掌握度”。

## 5. Store、持久化与地图回链

`lessonPlayerStore` 只管理当前学习上下文、ViewModel、LessonSession、步骤指针、加载 / 错误 / 警示和开发数据集。`lessonSessionStorage` 使用独立 key `knowledge-island.lesson-sessions` 与载荷 `{ schemaVersion: 1, sessions }`；地图状态仍由 `learningMapStore` / 地图存储负责。

完成最后一个必需步骤后，Store 调用独立的 `LearningMapCompletionService`。该服务依据教材和 LessonKnowledgePoint 映射写入地图完成度，服务本身不依赖 `learningMapStore`；页面随后回到地图并用 `focusNodeId` 恢复原节点。

## 6. 无障碍与响应式

步骤导航是可聚焦的真实按钮，当前步骤使用 `aria-current="step"`；媒体使用显式尺寸、替代文本和失败回退；装饰图标不承载唯一语义。Desktop 使用居中学习卡片，Tablet 保持大触控目标，Mobile 使用单列内容和底部操作区；样式覆盖 375、390、430、768、1024 和 1440 视口，并遵守 `prefers-reduced-motion`。

## 7. 明确不在 PHASE 8

本阶段不实现 `Question Engine`、正式答题、自动判题、题目随机抽取 / 推荐 / 难度算法、`QuestionSession`、答案提交、正确 / 错误引擎、`MasteryScore`、`KnowledgeEnergy`、Adaptive Learning、AI Learning Path、WrongBook、Reward、Coins、Achievement、Streak、Parent Dashboard、AI Tutor 或正式考试系统。

`PracticeBlock` 只用于展示非评分内容或观察互动；Lesson completion 只表示本次会话走完步骤，不写入掌握度、错题或奖励记录。

## 8. PHASE 8 验证记录

截至 2026-09-02，`npm install`、`npm run type-check`、`npm run lint`、`npm run format:check`、`npm run test:run` 和 `npm run build` 均通过；测试为 6 个文件、60 项，既有 PHASE 7 测试未删除。`npm run curriculum:review` 保持预期结论 `REQUIRES_MANUAL_REVIEW`，没有擅自把 Golden Framework 提升为已审核数据。

浏览器已检查 `/`、`/learning-map`、`/lesson` 的正式入口保护，以及 `/dev/learning-map` → Node Detail → `/dev/lesson-player` → 完成 → 地图焦点恢复的闭环。开发页的 full、resume、completed、empty、not_available、error、sample、unverified 状态均可显示；LessonPlayer 在 `375`、`390`、`430`、`768`、`1024` 和 `1440` 视口无横向溢出，当前步骤、首步禁用上一步、标题、进度语义和 Reduced Motion 规则均已检查。最终浏览器 `error` / `warning` 日志为空。
