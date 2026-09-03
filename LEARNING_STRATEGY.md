# Learning Strategy｜PHASE 11 确定性学习策略

> 本文档是 PHASE 11 策略领域的技术事实源；产品范围仍以 `PRODUCT.md` 为准，掌握度字段与算法仍以 `MASTERY.md` / `MASTERY_MODEL.md` 为准。

## 文档状态

| 项目 | 状态 |
| --- | --- |
| PHASE 11.1～11.4 | 已实现 |
| 确定性规则、来源闸门、档案隔离 | 已实现 |
| 自动化测试 | 已验证：`tests/learning-strategy.test.ts` |
| 浏览器视口验证 | 待本阶段最终工程校验完成后更新 |
| AI Learning Path、复习排程、KnowledgeEnergy、WrongBook、Reward | 不在范围内 |

## 1. 目标与边界

PHASE 11 只回答三个当前问题：

1. 现在更应该巩固哪个已有知识点。
2. 当前掌握度是否缺少足够证据。
3. 当前节点完成后是否存在一个已经由地图解锁结果确认的下一知识点。

策略是只读的确定性投影。它不修改 `MasteryRecord`、`LearningEvidence`、`QuestionSession`、`MapNode.status`、`MapNode.progress`、`LearningMapProgressRecord` 或 prerequisite 关系。

## 2. 输入与输出

入口使用 `LearningStrategyInput`：

```ts
studentProfileId
currentTextbookId?
currentMapNodeId?
currentKnowledgePointId?
masteryRecords
mapNodes
knowledgeRelations
learningMapProgress?
learningEvidence?
questionHistory?
dataset
strategyVersion?
```

`MasteryRecord` 是掌握度权威输入；`LearningEvidence` 与 `QuestionAttempt` 只用于来源说明和 diagnostic。`KnowledgeRelation` 由课程关系或地图关系 adapter 提供，页面标题和数组顺序不是关系事实源。

输出为 `LearningRecommendation`，版本固定为独立的 `STRATEGY_V1`。它可以是：

- `CONTINUE_CURRENT`
- `REINFORCE`
- `GATHER_MORE_EVIDENCE`
- `PROCEED_TO_NEXT`
- `NO_RECOMMENDATION`

Review 输出为 `ReviewRecommendation[]`，下一知识点输出为 `NextKnowledgePoint`。所有输出保留 `studentProfileId`、来源状态、`isSampleDerived`、稳定诊断和开发警示。

## 3. 决策规则

策略复用 PHASE 10 的 `MasteryPolicy`：`weakThreshold = 40`、`masteredThreshold = 80`、`minimumConfidenceForMastery = 0.5`、`minimumEvidenceForMastery = 3`。

| 条件 | 输出 | 原因 |
| --- | --- | --- |
| `state = weak` 或分数低于 40 | `REINFORCE` | `WEAK_MASTERY` |
| 置信度低于 0.5 | `GATHER_MORE_EVIDENCE` | `LOW_CONFIDENCE` |
| 分数达到 80 但证据少于 3 条 | `GATHER_MORE_EVIDENCE` | `INSUFFICIENT_EVIDENCE` |
| 当前节点可用 / 学习中且未掌握 | `CONTINUE_CURRENT` | `NOT_STARTED` / `IN_PROGRESS` |
| 当前节点已完成或掌握，且存在可用后续节点 | `PROCEED_TO_NEXT` | `NEXT_AVAILABLE_KNOWLEDGE_POINT` |
| 所有可用节点均已满足掌握条件，或关系 / 节点无效 | `NO_RECOMMENDATION` | `NO_AVAILABLE_KNOWLEDGE_POINT` 或 diagnostic |

没有记录的知识点是 `not_started`，不会伪造为 `weak`。地图 `locked` 节点永远不能成为 `NextKnowledgePoint`，策略不调用解锁算法，也不自动解锁。

## 4. 来源闸门与隔离

正式 `profile` 输入遇到 `SAMPLE`、`UNVERIFIED`、`REJECTED` 或样本派生掌握度时，返回安全空状态和 `SOURCE_NOT_ALLOWED`。`golden` / `demo` 仅用于开发验证，保留 `UNVERIFIED` / `SAMPLE` 警示，不代表正式建议。

记录只接受当前 `studentProfileId`；地图节点和关系按 `currentTextbookId` 过滤。`MasteryRecord` 的身份仍是 `studentProfileId + knowledgePointId`，不会为了不同教材复制记录；同一个知识点可以被不同教材上下文引用。

## 5. 确定性保证

策略不读取当前时间、日期间隔、连续学习天数、随机数、奖励、能量或复习日期。Review 默认最多 3 条，也可以传稳定的 `limit`；排序依次使用优先级、分数升序、置信度升序、地图排序、知识点 ID、地图节点 ID。

## 6. 实现位置

- `src/types/learning-strategy.ts`：协议与输入类型。
- `src/services/learning-strategy/`：`LearningStrategyService`、`StrategyEngine`、`ReviewStrategy`、`NextLearningResolver` 和 map adapter。
- `src/stores/learningStrategyStore.ts`：只读推荐状态，不拥有其他领域写入权限。
- `src/components/learning-strategy/`：首页、Assessment、地图和开发页共用的推荐卡片。
- `src/pages/DevStrategyPage.vue`：`/dev/strategy` 固定夹具验证页。

本阶段停止在确定性策略层，不进入 PHASE 12。
