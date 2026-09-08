# 知识岛｜LessonSession 会话协议

## 1. 目标

`LessonSession` 记录学生在一个具体教材、Unit、Lesson 和 KnowledgePoint 上的学习步骤位置。它支持开始、继续、退出后恢复和完成；它不是作答会话、掌握度记录或地图节点记录。

## 2. 数据结构

```ts
interface LessonSession {
  id: string;
  textbookId: string;
  unitId: string;
  lessonId: string;
  knowledgePointId: string;
  status: "not_started" | "in_progress" | "completed";
  currentStepIndex: number;
  completedStepIds: string[];
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
}
```

版本化存储载荷：

```ts
interface LessonSessionStoragePayload {
  schemaVersion: 1;
  sessions: LessonSession[];
}
```

存储 key：

```text
knowledge-island.lesson-sessions
```

## 3. 稳定身份

会话 ID 由本地学生档案标识和完整 `LessonLaunchContext` 确定性生成：

```text
lesson-session:
  studentId:
  textbookId:
  unitId:
  lessonId:
  knowledgePointId
```

在没有正式账号系统时使用 `local-profile`。不得使用 `Math.random()` 或 `Date.now()` 作为业务身份；时间戳只记录开始、更新时间和完成时间。

## 4. 状态与动作

| 动作 | 前置 | 结果 |
| --- | --- | --- |
| `loadLesson` | 有效 LaunchContext、可读内容 | 恢复已有会话或创建 `not_started` |
| `startSession` | 已加载且未完成 | 变为 `in_progress`，记录 `startedAt` |
| `resumeSession` | 存在当前会话 | 回到保存的步骤和完成步骤 |
| `completeStep` | 当前步骤存在 | 写入 `completedStepIds`，保持 `in_progress` |
| `goNext` | 当前会话未完成 | 完成当前步骤并移动到下一步 |
| `goPrevious` | 不是第一步且未完成 | 回到上一步，不删除已完成步骤 |
| `goToStep` | 合法步骤索引；开发态可查看未来步骤 | 更新当前指针 |
| `completeLesson` | 最后一步、所有必需步骤已完成 | 变为 `completed` 并触发地图完成接口 |
| `resetDemoSession` | 开发 Demo | 删除当前 Demo 会话并回到第一步 |

完成状态只由 `completeLesson` 产生。完成步骤和地图节点完成不等于学生已经掌握知识。

## 5. 多会话与恢复

存储载荷可以保留多个学生 / 教材 / Lesson / KnowledgePoint 会话。读取当前会话时按稳定 ID 定位，不覆盖其他上下文。离开页面、刷新或再次从地图进入时，Store 重新读取 `currentStepIndex`、`completedStepIds` 和状态。

## 6. 迁移与异常

- `schemaVersion` 不是 `1`、JSON 损坏或会话字段非法时，安全清除该存储并从空白会话开始，同时给出非阻断警示。
- 内容版本变化导致已保存步骤 ID 不存在时，丢弃孤儿 `completedStepIds`，并把步骤指针限制在当前内容范围内。
- 已完成会话重新读取时，指针归一到最后一个当前步骤，不回退为未完成。
- localStorage 不可用或写入失败时，页面可以继续学习，并显示“本次学习仍可继续”的提示。

这些处理只修复运行时会话，不改变课程、LearningContent、审核记录或地图事实。

## 7. Store 边界

`lessonPlayerStore` 拥有当前 LessonPlayer 的会话状态；`learningMapStore` 拥有地图加载、节点选择和地图进度。两者通过 `LearningMapCompletionService` 的显式接口连接，不能把 LessonSession 直接塞入地图进度，也不能在 LessonPlayer 中直接修改 `learningMapStore`。

## 8. PHASE 8 禁止事项

LessonSession 不保存答案、作答结果、分数、题目 ID、正确 / 错误状态、MasteryScore、KnowledgeEnergy、错题、奖励或连续学习天数。PHASE 8 完成后停止，不进入 Question Engine 或 PHASE 9。
