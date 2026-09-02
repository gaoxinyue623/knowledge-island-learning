# 知识岛｜LearningMap 进度与解锁规则

> 本文档定义 PHASE 7 地图展示进度、持久化和基础解锁规则，并记录 PHASE 8 LessonPlayer 完成回链。它不是正式学习记录、MasteryScore、KnowledgeEnergy 或答题完成算法。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | PHASE 8.4（地图完成回链） |
| 状态 | 已实现并通过单元、组件和浏览器验证 |
| Store | `src/stores/learningMapStore.ts` |
| 规则模块 | `learningMapProgress.ts`、`learningMapUnlock.ts` |
| 存储模块 | `learningMapStorage.ts` |
| 当前能力 | 地图 Demo Start / Complete、解锁更新、完成度、重置 |

## 1. 记录模型

```ts
interface LearningMapProgressRecord {
  nodeId: string;
  status: LearningNodeStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
}
```

`nodeId` 是由 `textbookId + lessonKnowledgePointMappingId` 组成的稳定地图节点 ID；前置判断另使用稳定 `knowledgePointId`。绝不使用数组索引作为身份。

这份记录只服务于 PHASE 7 地图展示：

- `learning` 表示地图演示已开始。
- `completed` 表示地图演示已完成。
- `mastered` / `perfect` 只能由 fixture / mock 记录提供，是 UI 状态，不由分数计算。
- 它不产生 `MasteryEvent`，不写入 `KnowledgeMastery` 或 `KnowledgeEnergy`，也不替代正式 `StudentProgress`。

## 2. 状态解析

`resolveNodeStates(nodes, progressRecords)` 是纯函数，先建立进度索引，再按知识点 ID 判断前置：

```text
无 prerequisite                                  → available
所有 prerequisite 对应节点已 completed/mastered/perfect → available
任一 prerequisite 未完成                         → locked
记录 status = learning                          → learning
记录 status = completed/mastered/perfect         → 保留对应完成状态
```

节点自身的显式完成记录优先于重新解锁；完成状态会作为其 KnowledgePoint 的完成证据，支持跨 Lesson 和跨 Unit 的依赖。规则不会读取 `masteryScore`，不会因为日期变化或没有学习而修改地图状态。

## 3. 当前节点与导航

`findCurrentNodeId()` 的优先级：

1. 第一个 `learning` 节点。
2. 没有进行中节点时的第一个 `available` 节点。
3. 所有节点都完成时的最后一个完成节点。

地图 Header 的“继续探索”调用 store 的 `focusNode()`，只选中 / 聚焦当前节点；节点的“开始学习”另行携带显式 `LessonLaunchContext` 进入 LessonPlayer。

## 4. 完成度计算

| 层级 | 计算方式 | 页面称呼 |
| --- | --- | --- |
| KnowledgePoint / 地图 | 完成节点数 / 节点总数 | 地图完成度 |
| Lesson | 完成 KnowledgePoint 节点数 / Lesson 节点总数 | 区域完成度 |
| Unit | 完成 Lesson 数 / Unit Lesson 总数 | 知识岛完成度 |

总数为 0 时百分比为 0，不产生 NaN；百分比经过 clamp，显示为整数。页面禁止把这些值叫“掌握度”或“掌握率”。

## 5. Store 动作

`useLearningMapStore` 独立拥有地图 UI 与 Demo Progress：

| 动作 | 作用 | 限制 |
| --- | --- | --- |
| `loadMap()` | 读取 source、加载进度、构建 ViewModel、选择第一座岛 | 异常进入 `error`，无 source 进入 `not_available` |
| `selectUnit()` | 切换当前岛屿 | 只接受当前 ViewModel 中存在的 Unit |
| `selectNode()` | 打开节点详情并聚焦 | 锁定节点仍可查看详情 |
| `focusNode()` | 聚焦指定节点 | 不替代 LessonPlayer 会话；可由返回回链恢复焦点 |
| `markNodeStarted()` | 写入 `learning`、进度至少为 1 | 只允许 `available` / `learning`，只读地图拒绝写入 |
| `markNodeCompleted()` | 写入 `completed`、进度 100 | 只允许 `available` / `learning`，只读地图拒绝写入 |
| `resetDemoProgress()` | 清理当前教材的地图演示记录并重算 | 只对可写的 Demo / 本地地图状态生效 |

每次写入后 store 重新构建 ViewModel，因此下一个满足前置关系的节点会立即变为 `available`。

## 6. 持久化协议

唯一 localStorage key：

```text
knowledge-island.learning-map-progress
```

载荷：

```json
{
  "schemaVersion": 1,
  "textbookId": "...",
  "records": []
}
```

`createLearningMapProgressStorage()` 负责：

- 校验 schema version、教材 ID、记录状态和有限数字。
- 将进度 clamp 到 `0..100`。
- 当前教材不匹配时返回空数组，避免串用其他教材进度。
- JSON 损坏或载荷非法时安全返回空数组。
- 只清理当前教材对应的载荷，不散落额外 key。

后续真实学习记录迁移时，应保留现有地图记录的版本和教材上下文，不能把它直接当作 Mastery 或题目作答历史。

## 7. 异常与诊断

Adapter 遇到孤儿进度、缺少 Lesson、缺少 KnowledgePoint 或关系端点时：

- 保留可渲染的有效岛屿和节点。
- 忽略无法建立引用的项。
- 写入 `LearningMapDiagnostic`，开发页可展开查看。
- 正式页面显示可理解的空 / 错误 / 未开放状态，不显示 `404`、`Null`、`Undefined` 或技术堆栈。

## 8. 明确不做

PHASE 7 不实现：正式答题、题目完成条件、正式掌握度、知识能量衰减、适应性路径、奖励、错题或家长报告。PHASE 8 通过独立 `LearningMapCompletionService` 接入 LessonPlayer 完成回链；`markNodeCompleted()` 仍是地图演示状态动作，不能作为正式学习业务完成接口。
