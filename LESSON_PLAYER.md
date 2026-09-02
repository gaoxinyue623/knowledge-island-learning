# 知识岛｜LessonPlayer 实现说明

> 本文档记录 PHASE 8.1～8.4 的 LessonPlayer / Knowledge Learning Flow、PHASE 9.4 的 Practice → Assessment 接入事实，以及 PHASE 10 的掌握度后处理边界。它补充 `PRODUCT.md`、`DATA_MODEL.md`、`CONTENT_REVIEW.md` 与 `MASTERY.md`，不替代课程事实、题目协议或内容审核规则。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | PHASE 10.4：Mastery Model（LessonPlayer 作为上游） |
| 状态 | LessonPlayer、内容块渲染、会话恢复、Practice 可用性检查、Assessment 入口、完成回链、开发 Showcase 和完成 Session 后的掌握度后处理边界已实现并验证 |
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

LessonPlayer 的目标是让学生围绕一个 KnowledgePoint 走完一段短学习步骤，并在 Practice 步骤把显式上下文交给 Question Engine。它负责“看懂、互动、继续和完成”，不拥有题目作答、评分或掌握度计算；Assessment 完成后只接收摘要并回到课程。

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

最小导航单位是 `LessonStep`，类型为 `intro`、`concept`、`explanation`、`example`、`media`、`interactive`、`practice` 或 `summary`。步骤通过 `contentBlockIds` 引用结构化内容块；`practice` 的说明与提示仍属于 LessonPlayer，`开始练习` CTA 只发出 `AssessmentLaunchContext`，不把题目嵌入课程内容。

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

Practice 入口会先通过 Question Engine Adapter 检查当前上下文是否有可读题目；检查中显示准备状态，题目为空或审核未通过时显示可理解的准备中 / 暂未开放状态，不由页面猜测教材或题型。

内容卡显示学习目标、步骤序号、当前内容块、上一步 / 下一步和完成操作。完成文案明确说明“完成学习不等于掌握度”。

## 5. Store、持久化与地图回链

`lessonPlayerStore` 只管理当前学习上下文、ViewModel、LessonSession、步骤指针、加载 / 错误 / 警示和开发数据集。`lessonSessionStorage` 使用独立 key `knowledge-island.lesson-sessions` 与载荷 `{ schemaVersion: 1, sessions }`；地图状态仍由 `learningMapStore` / 地图存储负责。

完成最后一个必需步骤后，Store 调用独立的 `LearningMapCompletionService`。该服务依据教材和 LessonKnowledgePoint 映射写入地图完成度，服务本身不依赖 `learningMapStore`；页面随后回到地图并用 `focusNodeId` 恢复原节点。

## 6. 无障碍与响应式

步骤导航是可聚焦的真实按钮，当前步骤使用 `aria-current="step"`；媒体使用显式尺寸、替代文本和失败回退；装饰图标不承载唯一语义。Desktop 使用居中学习卡片，Tablet 保持大触控目标，Mobile 使用单列内容和底部操作区；样式覆盖 375、390、430、768、1024 和 1440 视口，并遵守 `prefers-reduced-motion`。

## 7. PHASE 9 接入边界

LessonPlayer 使用显式的 `AssessmentLaunchContext` 进入 `/assessment` 或开发 `/dev/question-engine`：

```text
Practice
  ↓ start-assessment
AssessmentLaunchContext
  ↓
Question Engine
  ↓
AssessmentResultSummary
  ↓ assessmentCompleted=true
LessonPlayer Summary / LearningMap
```

返回的结果只用于本次练习摘要和课程回链。Question Engine 的题目关系、会话、判题和审核闸门见 `QUESTION_ENGINE.md`；LessonPlayer 不直接读取 Question Repository，也不修改 `Question`、`MasteryEvent`、`MasteryRecord` 或地图事实。完成 Session 后的掌握度处理由页面显式调用独立 `MasteryProcessingService`。

## 8. 明确不在 PHASE 8 / 9；PHASE 10 仍不扩展课程完成

PHASE 8 不实现 Question Engine；PHASE 9 只实现六类题型的固定 Demo Assessment、确定性判题、人工审核简答标记和会话恢复。PHASE 10 只在完成 QuestionSession 后独立派生 LearningEvidence / MasteryRecord，不把掌握度写回 LessonSession，也不阻止 Lesson completion。各阶段都不实现题目随机抽取 / 推荐 / 难度算法、`KnowledgeEnergy`、Adaptive Learning、AI Learning Path、WrongBook、Reward、Coins、Achievement、Streak、Parent Dashboard、AI Tutor、AI Question Generation、AI Grading 或正式考试系统。

`PracticeBlock` 仍只展示非评分内容或观察互动；它的 Assessment CTA 由数据层可用性控制。Assessment completion 只表示本组题目已提交；完成 Session 后的掌握度处理不修改题目答案、Lesson completion、地图解锁、错题或奖励记录。

## 9. PHASE 8 / 9 验证记录

截至 2026-09-02，PHASE 10 目标验证包含 `npm install`、`npm run type-check`、`npm run lint`、`npm run format:check`、`npm run test:run`、`npm run build` 和 `npm run curriculum:review`；测试保留既有 PHASE 7 / 8 / 9 覆盖，并新增 Mastery 领域、证据抽取、确定性重算、存储和后处理测试。`curriculum:review` 仍保持 `REQUIRES_MANUAL_REVIEW`，没有擅自把 Golden Framework、题目 Demo 或 Mastery Demo 提升为已审核数据。

浏览器已检查 `/`、`/learning-map`、`/lesson` 的正式入口保护，以及 `/dev/learning-map` → Node Detail → `/dev/lesson-player` → Practice → `/dev/question-engine` → 完成 → LessonPlayer → 地图焦点恢复的闭环。开发页的 full、resume、completed、empty、not_available、error、sample、unverified 状态均可显示；LessonPlayer、Question Engine 和 `/dev/mastery` 在 `375`、`390`、`430`、`768`、`1024` 和 `1440` 视口无横向溢出，当前步骤、题目进度、提交锁定、结果 region、掌握状态、标题、进度语义和 Reduced Motion 规则均已检查。最终浏览器 `error` / `warning` 日志为空。
