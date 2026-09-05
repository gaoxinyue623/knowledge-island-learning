# Review Queue Data Flow｜PHASE 12.3

## 文档状态

| 项目 | 状态 |
| --- | --- |
| Strategy → Queue projection | 已实现 |
| Active / Completed / Reopen 状态 | 已实现 |
| Profile / Textbook / Source guard | 已实现 |
| 非 Scheduler 边界 | 已实现 |
| UI `/review-queue` 与地图 CTA | 已实现 |

## 1. 投影流

```text
MasteryRecord + LearningMap + KnowledgeRelation
  ↓
LearningStrategyService（STRATEGY_V1，只读）
  ↓ LearningRecommendation.reviewRecommendations
ReviewQueueProjectionService
  ↓
ReviewQueueRepository / schemaVersion 1 storage
  ↓
ReviewQueueItem
```

只有 `REINFORCE` 和 `GATHER_MORE_EVIDENCE` 会进入 Queue。投影重复执行使用稳定 item ID，并保留用户已经标记的 `completed` 状态。

## 2. 明确不是排程

Queue 只表达“当前可以主动做的事”。它不读取时钟，不计算复习间隔，不生成未来日期，不包含 `nextReviewAt`、`scheduledAt`、`reviewInterval`、`decayScore`、通知或奖励。item 的“去巩固” CTA 定位到已有地图节点；题目重练由 WrongBook 独立负责。
