# Achievement / Milestone Data Flow

## Fixed definitions

`ACHIEVEMENT_V1` 当前只包含七个确定性里程碑：

1. 第一次完成学习
2. 完成 5 次学习
3. 第一次完成练习
4. 掌握第一个知识点
5. 第一次完成巩固
6. 解决第一道错题
7. 累计获得 50 点 KnowledgeEnergy

条件只读取已完成 History、mastered MasteryRecord、resolved WrongBook、completed ReviewQueue 和 GrowthSummary。定义不读取页面访问、连续天数、时刻、答题连胜或随机状态。

## Evaluation

```text
LearningHistoryService ─┐
WrongBookService ───────┤
ReviewQueueService ─────┤
MasteryRepository ──────┤→ AchievementService.evaluate()
GrowthService ──────────┘              ↓
                             AchievementProgress[]
                             AchievementUnlock[]
```

已达成条件会写入一次 Unlock；重复 evaluate 返回已有 Unlock，不重复写入。Unlock ID 由 profile、achievement 和 formal/sample 来源确定性生成。

## Storage and isolation

`knowledge-island.achievements` 使用 schemaVersion 1。正式读取不包含 SAMPLE；开发 `/dev/reward` 可以显式读取固定 SAMPLE，并在页面显示来源警示。开发 Unlock 与正式 Unlock 分开保存，清理开发样本不会删除正式里程碑。

Achievement 只提供反馈。它不解锁课程 / 地图节点，不改 Mastery、Strategy、Review Queue、WrongBook 或 QuestionEngine。
