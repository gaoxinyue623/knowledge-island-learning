# KnowledgeEnergy / Growth Data Flow

## Authority

```text
RewardEvent[]
    ↓ sum(reward.knowledgeEnergy)
KnowledgeEnergyBalance
    ↓ GROWTH_V1 thresholds
GrowthRecord / GrowthSummary
```

RewardEvent 是事实来源。Energy 与 Growth snapshot 删除后可以重新生成，不能反过来生成奖励事实。

## Energy contract

`KnowledgeEnergyBalance` 保存 `profileId`、`totalEarned`、`current`、`updatedAt`、`algorithmVersion` 和 provenance。第一版没有消费行为，所以 `current = totalEarned`。不存在 wallet、debit、purchase、inventory 或未来消费事务。

正式 profile 读取排除 SAMPLE；开发 demo 显式包含 SAMPLE 并显示样本来源。profile isolation 在 RewardEventRepository 和 GrowthService 两层都执行。

## Growth contract

`GROWTH_V1` 阈值为 `0 / 50 / 120 / 220 / 350`，level 为从 1 开始的反馈等级。进度是当前等级阈值到下一级阈值之间的百分比；最高等级固定为 100%。Growth 不改变 Curriculum、LearningMap、Mastery、Strategy 或 Review priority。

## Persistence and recovery

- `knowledge-island.knowledge-energy`：`{ schemaVersion: 1, balances: [] }`
- `knowledge-island.growth`：`{ schemaVersion: 1, records: [] }`

两个 storage 都使用 Zod、safe parse、损坏清理和 warning。`GrowthService.rebuildKnowledgeEnergy()` 每次从 RewardEventRepository 重算；即使 snapshot 损坏，Energy 仍可恢复。

## Store

`growthStore` 只负责读取、重建和展示 GrowthSummary。它没有消费方法，也不会调用地图解锁、Mastery 更新或 Strategy 生成。
