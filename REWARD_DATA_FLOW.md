# Reward Data Flow

## Ownership

Reward 是观察层。它读取完成的 LessonSession、QuestionSession、Mastery transition、ReviewQueue item 和 WrongBook record，不拥有这些事实，也不回写它们。

```text
completed learning fact
        ↓
RewardProjectionService
        ↓
RewardEventRepository
        ↓
rewardStore
```

## Eligibility

| 来源 | 可投影条件 | 固定奖励 |
| --- | --- | ---: |
| `LessonSession` | `status = completed` | 10 |
| `QuestionSession` | `status = completed` | 5 |
| `MasteryRecord` transition | previous 非 `mastered`，next 为 `mastered` | 15 |
| `ReviewQueueItem` | 已由 Store 确认 active → completed | 8 |
| `WrongQuestionRecord` | 已由 Store 确认 active → resolved | 6 |

未完成、草稿、答错、人工审核、页面浏览和点击都不产生 RewardEvent。

## Identity and source guard

业务 ID 为 `reward:{profileId}:{type}:{sourceId}`。Mastery source 使用 knowledge point 与 `algorithmVersion` 的稳定组合；同一 `MASTERY_V1` 重建不会重复奖励。

`dataset = profile` 时拒绝 SAMPLE、UNVERIFIED、REJECTED 和样本派生来源；`dataset = demo` 才允许 SAMPLE，并保留 `isSampleDerived = true`。Repository 还按 profile、type、knowledge point、textbook 过滤，正式 UI 通过 `includeSample: false` 读取正式数据。

## Persistence

`knowledge-island.reward-events` 使用：

```json
{ "schemaVersion": 1, "events": [] }
```

Zod strict schema 只允许 `reward.knowledgeEnergy`，不允许 coin、currency、item、loot 或 scheduler 字段。JSON 损坏、未知版本或读取异常会返回空集合并提供 warning，保留原记录且阻止后续覆盖；页面继续可用。写入失败提供 warning。

## Store integration

- `lessonPlayerStore` 在 completed Session 载入 / 完成时显式投影 `lesson_completed`。
- `questionEngineStore` 在 completed Session 载入 / 完成时显式投影 `assessment_completed`。
- `QuestionEnginePage` 在 Mastery 重算前保存旧记录，再对非 mastered → mastered 的结果投影 `knowledge_mastered`。
- `reviewQueueStore` 只在确认 active → completed 后投影 `review_completed`。
- `wrongBookStore` 只在确认 active → resolved 后投影 `wrong_question_resolved`。

所有入口都经过同一个 `RewardService`，没有页面直接执行 `energy +=`。

2026-09-07：保存成功后通知积分适配器读取已保存事实。宠物积分在内容去重和每日额度规则下独立结算，未改变上述原能量数额或 Mastery 来源门槛。课后闯关、思维与阅读参与奖励直接进入宠物账本，不伪装为正式 RewardEvent；详情见 [学习积分与宠物成长](PET_GROWTH.md)。
