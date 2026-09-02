# 知识岛｜Mastery Model 与确定性算法

> 本文档记录 PHASE 10 的可复现掌握度算法。所有规则集中在 `src/services/mastery/masteryPolicy.ts` 与 `masteryEngine.ts`；它不是自适应学习或复习排程模型。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 10.2～10.4 |
| 状态 | 纯函数聚合、策略配置、状态解析、重算和算法确定性测试已实现并验证 |
| 当前算法版本 | `MASTERY_V1` |
| 结果范围 | `masteryScore: 0～100`；`confidence: 0～1` |

## 1. 输入

引擎只接受同一 `knowledgePointId` 的 `LearningEvidence[]`。每条证据必须包含：

- `outcome`：`correct` 或 `incorrect`。
- `knowledgeWeight`：`0 < weight <= 1`，来自 QuestionKnowledgePoint。
- `questionDifficulty`：证据层的数值难度。
- `evidenceWeight`：由知识点权重与难度权重得到的贡献权重。

现有题目难度枚举保持不变：`FOUNDATION → 1`、`STANDARD → 3`、`ADVANCED → 5`。策略同时为未来数值难度保留以下权重：

| difficulty | 1 | 2 | 3 | 4 | 5 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| difficultyWeight | 0.8 | 0.9 | 1.0 | 1.1 | 1.2 |

难度只是证据权重输入；难度 5 不等于“掌握度直接增加 50”。

## 2. 公式

对每条证据：

```text
evidenceWeight = knowledgeWeight × difficultyWeight
outcomeValue(correct) = 1
outcomeValue(incorrect) = 0
```

对某个知识点：

```text
masteryScore = clamp(
  sum(outcomeValue × evidenceWeight) / sum(evidenceWeight) × 100,
  0,
  100
)

confidence = clamp(sum(evidenceWeight) / 5, 0, 1)
```

实现会按证据稳定 ID 排序后计算，并重新计算理论权重；输入中的权重不一致会生成 diagnostic，不让错误的预计算值改变结果。空证据的分数和置信度均为 `0`。

## 3. MasteryPolicy

第一版集中配置：

```text
weakThreshold = 40
masteredThreshold = 80
minimumEvidenceForMastery = 3
minimumConfidenceForMastery = 0.5
confidenceEvidenceTarget = 5
algorithmVersion = MASTERY_V1
```

状态解析：

```text
evidenceCount = 0                              → not_started
evidenceCount > 0 AND score < 40              → weak
score >= 80 AND count >= 3 AND confidence >= 0.5 → mastered
otherwise                                     → learning
```

一题答对不能直接成为 `mastered`；必须同时满足最低证据数和置信度。`perfect` 不是 MasteryLearningState，`review` 也不在 PHASE 10 正式状态中。

## 4. 设计不变量

- 不读取当前时间、`lastEvidenceAt`、最近学习间隔、连续天数或历史记录的旧分数。
- 不执行 recentDecay；同一证据集合无论何时重算结果相同。
- 不使用 `Math.random()`；稳定 ID 和排序保证重复运行结果一致。
- 不把 Lesson / Map / Assessment completion 作为证据，不把地图 `perfect` 写入 MasteryRecord。
- 不调用 AI、ML、Bayesian 或自适应选题逻辑。
- 新算法必须使用新的 `algorithmVersion`，保留原始证据以支持历史重算与比较。

## 5. 示例

三条同等权重证据中两条正确、一条错误时，基础分数为约 `66.67`；如果有效权重总和为 `3`，置信度为 `0.6`，状态为 `learning`。一条正确证据即使分数是 `100`，也会因证据数不足保持 `learning`。

`masteryScore = 92` 仅说明当前保存的证据支持高掌握分数；未来的 `knowledgeEnergy = 30` 只说明需要复习，不能被解释为掌握能力已经自动下降。
