# 知识岛｜PHASE 10 Mastery Model

> 本文档是 PHASE 10 掌握度领域的实现说明。它定义学生已有学习证据如何形成知识点掌握度读取模型，不扩展课程主链，也不实现复习排程、奖励或自适应学习。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 10.4：Verification / Migration / Regression |
| 状态 | LearningEvidence、MasteryRecord、确定性 MasteryEngine、独立存储、QuestionSession 后处理、地图 / 节点详情展示和 `/dev/mastery` 已实现并验证；PHASE 11 只读消费本领域输出 |
| 上游事实源 | `PRODUCT.md`、`DATA_MODEL.md`、`QUESTION_SCHEMA.md`、`ASSESSMENT.md` |
| 实现入口 | `src/services/mastery/`、`src/stores/masteryStore.ts`、`src/pages/DevMasteryPage.vue` |
| 当前数据 | Demo / SAMPLE 证据仅用于开发展示；真实教材题库和生产证据不存在 |

## 1. 领域结论

掌握度只回答“学生当前已有多少学习证据”。第一版的事实链是：

```text
QuestionSession（completed）
  + QuestionAttempt（submitted + correct / incorrect）
  + Question
  + QuestionKnowledgePoint（weight）
        ↓
LearningEvidence
        ↓
MasteryEngine
        ↓
MasteryRecord
```

`LessonSession`、`Lesson` 完成、地图节点完成和 Assessment 完成本身都不是直接掌握度证据。Question Engine 不直接改写 Mastery Store，完成后由显式 `MasteryProcessingService` 处理。

## 2. 核心模型

### LearningEvidence

`LearningEvidence` 保存一次可判定题目作答对某个知识点的证据。一个题目若通过多条 `QuestionKnowledgePoint` 关系覆盖多个知识点，则一次作答生成多条独立证据。稳定 ID 由学生档案、Session、Question 和 KnowledgePoint 组成，重复处理不会重复计数。

只有以下结果可以形成证据：

- Session 状态为 `completed`。
- Attempt 已提交，并且结果为 `correct` 或 `incorrect`。
- Question 与 QuestionKnowledgePoint 关系可解析，权重满足 `0 < weight <= 1`。
- 生产流程中的题目和关系通过集中审核闸门；开发流程可以显式允许 SAMPLE / UNVERIFIED，但必须留下来源标记。

`manual_review_required`、未提交题、缺失结果、孤儿题目和缺失关系只生成 diagnostic，不生成正确 / 错误证据。

### MasteryRecord

每个 `studentProfileId + knowledgePointId` 只有一个当前读取记录，包含：

- `masteryScore`：`0～100`，表示已有证据。
- `confidence`：`0～1`，表示证据充分程度，不是学生心理自信。
- `state`：`not_started`、`learning`、`weak`、`mastered`。
- 证据数量、正确 / 错误数量、最近证据时间、记录版本和 `algorithmVersion`。
- `isSampleDerived` 与 `evidenceSourceStatus`，避免开发样本伪装成正式学习记录。

## 3. 与其他状态的边界

`masteryScore` 不因为“几天没学习”自动下降，不使用 `recentDecay`、最近学习时间、连续天数或奖励状态。未来的 `KnowledgeEnergy` 只负责复习时机；即使出现 `masteryScore = 92`、`knowledgeEnergy = 30`，也应解释为“曾经掌握很好，但需要复习”，而不是“掌握能力自动下降”。

地图的 `completed` / `perfect` 是地图 Presentation 状态，地图解锁和完成度不由 Mastery 改写。`mastered` 只表示 MasteryRecord 的学习状态，不是地图的 `perfect`。

## 4. 已实现页面

- `/dev/mastery`：展示 `not_started`、`weak`、`learning`、`mastered`、高分低置信度和混合来源场景。
- `LearningMap`：可选读取 Mastery ViewModel，在节点和节点详情中显示掌握状态、分数、证据数及 SAMPLE 来源提示；不改变地图主状态或解锁。
- Assessment 完成页：显示掌握度后处理的 `processing / updated / error` 状态；处理失败不撤销 Assessment 完成。

## 5. 明确不在 PHASE 10

本阶段不实现 Adaptive Learning、按掌握度选题 / 调难度、AI 生成或判题、WrongBook、Review Scheduling、Spaced Repetition、KnowledgeEnergy、Reward / Coins / XP / Achievement / Streak / Leaderboard、家长 / 教师看板、AI Tutor、个性化学习路径或 ML / Bayesian 模型。`MasteryEvent` 七种事件枚举保留为兼容契约，但当前 QuestionSession 处理链直接产生 LearningEvidence，不隐式写入旧事件。

## 6. 验收结论

PHASE 10.1～10.4 已完成并停止：掌握度输入可追溯、算法可重放、存储独立、重复处理幂等、损坏载荷安全回退、SAMPLE 来源可见，且 Question / Lesson / Map / Curriculum 的责任边界保持独立。PHASE 11 只读消费本页定义的 `MasteryRecord`，不改变 Mastery 领域。

## 7. PHASE 11 下游边界

`LearningStrategyService` 使用 `MasteryRecord` 作为权威输入，按独立的 `STRATEGY_V1` 规则决定当前巩固、补充证据或下一知识点。Strategy 不重新计算 `masteryScore`，不修改记录，不读取时间衰减、KnowledgeEnergy、复习排程、错题本或奖励。详见 `LEARNING_STRATEGY.md`。

## 8. PHASE 12 下游边界

PHASE 12 的 Review Queue 只读取 `LearningRecommendation.reviewRecommendations`，把 `REINFORCE` / `GATHER_MORE_EVIDENCE` 建立为可主动处理的 Queue item。它不把 Queue 状态写回 `MasteryRecord`，也不改变 `MASTERY_V1` 的分数、置信度、证据计数或算法版本。WrongBook 只读取 QuestionAttempt 的确定性错误结果；它与 MasteryRecord 分离。详见 `PHASE12.md` 和 `REVIEW_QUEUE_DATA_FLOW.md`。

## 9. PHASE 13 下游边界

PHASE 13 只读取 Mastery transition：只有 `previous.state !== 'mastered'` 且 `next.state = 'mastered'` 时，独立 `RewardProjectionService` 才可以生成一次 `knowledge_mastered` RewardEvent。它不改变 `MASTERY_V1`、MasteryRecord、LearningEvidence、Strategy 或地图状态；重复 rebuild 由 RewardEvent 稳定 ID 去重。

MasteryScore、confidence、evidenceCount 与 KnowledgeEnergy 是不同读模型。Mastery 算法不读取奖励，Reward 也不把奖励写回掌握度。SAMPLE / UNVERIFIED 掌握记录只在开发数据集进入成长反馈，并保留 provenance。
