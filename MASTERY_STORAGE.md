# 知识岛｜Mastery Storage 与迁移边界

> 本文档定义 PHASE 10 掌握度数据的独立本地存储、schemaVersion 1、损坏处理和重算边界。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 10.1～10.4 |
| 状态 | 独立 key、Zod safe parse、schemaVersion 1、迁移边界、损坏回退、warning、幂等仓储和 profile 隔离已实现并验证 |
| 实现入口 | `src/services/mastery/masteryStorage.ts`、`src/services/mastery/masteryRepository.ts` |

## 1. 存储隔离

掌握度不写入课程、Lesson、地图或 Question Session 的载荷：

```text
knowledge-island.learning-evidence
knowledge-island.mastery-records
```

当前 schemaVersion 为 `1`。每个 LearningEvidence 包含 `studentProfileId`、知识点、题目 Session、Attempt、结果、权重、时间和来源状态；每个 MasteryRecord 包含证据统计、分数、置信度、状态、版本、`algorithmVersion` 和来源状态。

## 2. 读取与迁移

读取流程为：

```text
localStorage JSON
  ↓
JSON parse
  ↓
schemaVersion 识别
  ↓
migration boundary
  ↓
Zod safeParse
  ↓
repository / store
```

当前只接受明确的 `schemaVersion: 1`。未知版本、未来版本、载荷类型错误、字段范围错误或 JSON 损坏时：

1. 不让应用崩溃。
2. 返回空的当前数据集。
3. 清理无法安全使用的载荷。
4. 保留可读 warning 供 Dev Mastery / 调试读取。

迁移函数是显式边界；不能把旧的 `KnowledgeMastery` 或地图进度载荷静默解释成新的 MasteryRecord。

## 3. 写入与幂等

Repository 以稳定 ID 去重 LearningEvidence，以 `studentProfileId + knowledgePointId` 定位 MasteryRecord。重复写入同一 Session：

- 不增加 evidenceCount。
- 不重复计算同一证据。
- 不产生随机版本或随机 ID。
- 只有新证据真正进入时才更新受影响知识点的 Record；纯重放返回现有结果。

全量 rebuild 以原始 evidence 为唯一输入，按稳定 ID 排序后重新得到同样的 Record；不依赖本地存储中已有的旧分数。

## 4. Profile isolation

所有读取、追加、清理和重建操作都带有 `studentProfileId` 语义。一个档案的证据不会出现在另一个档案的记录中；切换当前开发学生只读取对应前缀 / 过滤后的数据。跨教材聚合只在同一档案、相同 `knowledgePointId` 下发生。

## 5. 安全与来源

Storage 不提升审核状态，也不把 SAMPLE 变成生产数据。`isSampleDerived` 和 `evidenceSourceStatus` 从证据来源计算并保留；生产证据仍需 Question 与 QuestionKnowledgePoint 同时通过集中审核闸门。存储中不存在 KnowledgeEnergy、Review Scheduling、Reward 或 Adaptive Learning 字段。

## 6. 迁移后的重建

若未来算法版本变化，保留原始 evidence，使用新的 `algorithmVersion` 重建新 Record；不得覆盖或伪造历史证据。迁移完成前，读取层应展示 warning，而不是把旧分数当成新算法结果。PHASE 10 不实现跨教材进度迁移 UI、KnowledgePoint 合并或拆分。
