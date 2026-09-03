# 知识岛｜LearningMap 领域与实现说明

> 本文档记录 PHASE 7.1～7.4 的 LearningMap 实现事实、PHASE 8 LessonPlayer / PHASE 9 Question Engine 回链、PHASE 10 掌握度展示边界，以及 PHASE 11 策略辅助展示。它描述地图展示层，不替代 `CURRICULUM.md`、`DATA_MODEL.md`、`MASTERY.md` 和 `LEARNING_STRATEGY.md` 的课程与学习事实。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | PHASE 11.4：确定性策略辅助展示验证 |
| 状态 | PHASE 7 地图、PHASE 8 LessonPlayer、PHASE 9 Question Engine 回链、PHASE 10 掌握度辅助展示与 PHASE 11 策略提示已实现并验证；PHASE 11 完成后停止 |
| 正式入口 | `/learning-map` |
| 开发入口 | `/dev/learning-map`、`/dev/learning-map/states` |
| 主要模块 | `src/services/learning-map/`、`src/stores/learningMapStore.ts`、`src/components/learning-map/` |
| 数据事实 | Golden Framework 为 `UNVERIFIED`；Demo Fixture 为 `SAMPLE`；没有真实教材目录进入地图 |

## 1. Knowledge Island 是什么

Knowledge Island 是课程事实在学生学习体验中的地图投影。它帮助学生理解“我在哪里、完成了什么、正在探索什么、下一步是什么”，但不替代教材目录、课程内容或正式掌握度系统。

地图映射保持如下边界：

| Curriculum Domain | LearningMap Presentation |
| --- | --- |
| `TextbookVersion` | 地图 Header 的教材上下文 |
| `Unit` | `UnitIsland`，一座知识岛 |
| `Lesson` | `LessonMapSection`，岛上的学习区域 |
| `KnowledgePoint` + 课次映射 | `KnowledgeMapNode`，可点击的知识点节点 |
| `KnowledgePrerequisite` | 节点解锁依据与 SVG 路径连接 |

`position`、`size`、`theme`、`visual`、连接线状态和完成度只属于地图 ViewModel。它们不写回 `Unit`、`Lesson`、`KnowledgePoint` 或其他 Curriculum Dataset。

## 2. ViewModel 与状态

页面只消费 `buildLearningMapViewModel()` 的结果。ViewModel 包含教材展示快照、Unit 岛屿、Lesson 区域、Knowledge 节点、连接线、总体完成度、当前节点、诊断和数据集标识。

节点状态是：

| 状态 | 含义 | PHASE 7 允许的行为 |
| --- | --- | --- |
| `locked` | 尚有前置知识未完成 | 查看锁定原因；不能开始演示 |
| `available` | 前置条件满足 | 查看详情、开始演示 |
| `learning` | 已开始地图演示 | 查看详情、完成演示 |
| `completed` | 地图节点已完成 | 查看详情、继续探索 |
| `mastered` | 开发 fixture 的完成状态 | 仅展示，不由分数推导 |
| `perfect` | 开发 fixture 的完成状态 | 仅展示，不由分数推导 |

`mastered` 在 PHASE 10 的掌握度 ViewModel 中可以表示 KnowledgeLearningState；地图自身的 `perfect` 仍只是 Presentation fixture。地图的“完成度”不能称为“掌握率”，掌握度也不反向修改地图状态。

## 3. 解锁规则

解锁逻辑在 `learningMapUnlock.ts` 中作为纯函数执行，使用稳定的 KnowledgePoint ID，不使用数组位置：

1. 没有 `prerequisites` 的节点为 `available`。
2. 所有前置 KnowledgePoint 都有 `completed`、`mastered` 或 `perfect` 的地图进度时，节点为 `available`。
3. 任一前置未完成时，节点为 `locked`。
4. 进度记录为 `learning` 时保留 `learning`。
5. 进度记录为完成状态时保留记录状态和完成度。
6. 无效或孤儿进度不阻断地图，只生成 `ORPHAN_PROGRESS` 诊断。

规则支持跨 Lesson、跨 Unit 的前置关系；PHASE 7 不引入 AI 路径规划、DAG 可视化编辑器或复杂路径搜索。

当前节点定位顺序为：第一个 `learning` → 第一个 `available` → 最后一个已完成节点。地图“开始学习”携带显式 `LessonLaunchContext` 打开 LessonPlayer；返回地图时通过 `focusNodeId` 恢复节点焦点。

## 4. 地图进度

PHASE 7 使用独立的轻量地图记录：

```ts
interface LearningMapProgressRecord {
  nodeId: string;
  status: LearningNodeStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
}
```

它只表示地图演示完成度，不替代 `StudentProgress`、`MasteryEvent`、`LearningEvidence`、`MasteryRecord`、`KnowledgeEnergy` 或 `QuestionAttempt`。地图进度存储与掌握度存储保持独立。

- KnowledgePoint 完成度 = 已完成节点 / 节点总数。
- Lesson 完成度 = 已完成 KnowledgePoint 节点 / 该 Lesson 节点总数。
- Unit 完成度 = 已完成 Lesson / 该 Unit Lesson 总数。
- 总体地图完成度 = 已完成 KnowledgePoint 节点 / 地图节点总数。

### 4.1 存储

开发阶段使用唯一的版本化 localStorage key：

```text
knowledge-island.learning-map-progress
```

载荷为：

```ts
interface LearningMapProgressStoragePayload {
  schemaVersion: 1;
  textbookId: string;
  records: LearningMapProgressRecord[];
}
```

读写由 `createLearningMapProgressStorage()` 集中负责。版本错误、JSON 损坏、非法状态或教材 ID 不匹配时返回空记录；不会让应用崩溃。`Reset Demo Progress` 只清理当前教材对应的地图演示进度。

## 5. 数据集与访问保护

| 数据集 | 入口 | 状态 | 目的 |
| --- | --- | --- | --- |
| `profile` | 正式 `/learning-map` | 受 CurriculumAccessPolicy 保护 | 从学生当前数学教材生成地图 |
| `golden` | 仅开发页 | `UNVERIFIED`、只读预览 | 验证真实 Curriculum 形状到 ViewModel 的适配 |
| `demo` | 仅开发页 | `SAMPLE`、可演示进度 | 验证多岛布局、连接线、解锁和状态 |

生产课程解析只允许 `verificationStatus = REVIEWED`。当前没有 `REVIEWED` 教材，因此正式地图不会回退到 Golden 或 Demo；无 profile、无教材或无可用课程时返回 Onboarding、未开放或空态等可恢复结果。

开发页必须明确展示 `UNVERIFIED DATA`、`SAMPLE DATA` 或“开发样本”。开发预览不改变数据核验状态，也不把演示完成写成正式学习记录。

## 6. 页面与交互边界

- 点击 KnowledgePoint 打开 Node Detail；桌面为侧边面板，移动端为底部面板。
- Node Detail 只展示知识点名称、所属 Unit / Lesson、地图状态、完成度和前置知识，不展示教材正文、题目答案或完整课文。
- 开发地图上的“开始学习”携带 `textbookId`、`unitId`、`lessonId`、`knowledgePointId` 和 `mapNodeId`，不由页面猜测课程关系。
- LessonPlayer 完成步骤后调用独立 `LearningMapCompletionService`，服务写入版本化地图进度并返回原节点；不直接操作 `learningMapStore`。
- 地图完成度仍只表示地图节点完成，不是学习掌握度；Lesson completion 不产生 `MasteryEvent` 或 `KnowledgeEnergy`。
- PHASE 10 可以把 `MasteryRecord` 转成可选的节点掌握度展示投影，展示分数、状态、证据数量和 SAMPLE / 来源提示；该投影不参与地图完成、节点 `status` 或前置解锁。
- `masteryScore` 不使用时间衰减；KnowledgeEnergy、复习排程和 Spaced Repetition 不在当前地图实现范围。
- 正式地图使用 `StudentCurriculumProfile.mathTextbookVersionId`；语文、数学、英语的选课事实仍由 Curriculum / Profile 域分别维护。

## 7. PHASE 8 回链与当前限制

PHASE 8 已将开发地图节点接入 LessonPlayer：地图 → `LessonLaunchContext` → LessonPlayer 步骤 → 独立会话 → 完成服务 → 地图进度。PHASE 9 再通过 `AssessmentLaunchContext` 接入 Question Engine；PHASE 10 的完成 Session 由独立 `MasteryProcessingService` 处理，地图仅读取掌握度展示投影。正式 `/lesson` 仍执行 profile 与内容审核保护；开发 `/dev/lesson-player` 使用独立 Demo Lesson Fixture，并明确显示 SAMPLE / UNVERIFIED 状态。

当前已实现结构化内容步骤、媒体回退、非评分互动、会话恢复和完成状态；Question Engine、正式答题、自动判题、LearningEvidence、MasteryScore 和 MasteryRecord 已由后续阶段接入。仍没有 KnowledgeEnergy、复习排程、奖励、错题本、家长中心、真实题库或正式课程生成。

## 8. PHASE 11 策略辅助展示

PHASE 11 的 `LearningStrategyService` 可以读取当前 `LearningMapViewModel` 的节点状态、完成度和已解析 connection，结合 `MasteryRecord` 生成轻量提示。它不改变地图标题、主题、完成度、`locked / available / learning / completed / mastered / perfect` 状态、前置关系或进度存储。

- `LearningRecommendationCard` 只聚焦一个当前动作；CTA 只定位到已有节点，不执行解锁。
- `locked` 节点不会成为 `NextKnowledgePoint`；掌握度 `mastered` 不等于地图 `completed`，地图 `completed` 也不等于掌握度 `mastered`。
- 正式 profile 需通过课程关系、教材上下文、地图节点和来源闸门；开发 `demo` / `golden` 只显示带警示的结果。

PHASE 11 已完成并停止；策略是地图的只读辅助投影，不进入 PHASE 12。规则与数据流见 `LEARNING_STRATEGY.md`、`STRATEGY_DATA_FLOW.md`。
