# 知识岛｜PHASE 12 学习记录、错题本与待巩固

> 本文档是 PHASE 12 的实现事实源。它把 `LessonSession`、`QuestionSession`、`QuestionAttempt` 和 `LearningRecommendation` 投影为可回看的学习记录、错题本与主动待巩固入口；不改变 Curriculum、LearningMap、Mastery 或 Strategy 的权威事实。

## 文档状态

| 项目 | 状态 |
| --- | --- |
| PHASE 12.1 Learning History Domain | 已实现 |
| PHASE 12.2 WrongBook Domain & Retry | 已实现 |
| PHASE 12.3 Review Queue & Strategy Projection | 已实现 |
| PHASE 12.4 Product Integration | 已实现；最终工程与浏览器回归见本阶段验收记录 |
| 正式入口 | `/history`、`/wrong-book`、`/review-queue` |
| 开发入口 | `/dev/history`、`/dev/wrong-book`、`/dev/review-queue` |
| 当前验证数据 | SAMPLE / UNVERIFIED 仍带来源标记；Curriculum Review 继续保持 `REQUIRES_MANUAL_REVIEW` |

## 1. 三个领域的职责

| 领域 | 回答的问题 | 权威输入 | 允许的写入 |
| --- | --- | --- | --- |
| Learning History | 我学过什么？ | `LessonSession`、`QuestionSession` | 追加事实记录；同一事件幂等 |
| WrongBook | 我哪些题做错过？ | 已提交且确定性判为 `incorrect` 的 `QuestionAttempt` | 按 `profileId + questionId` 聚合错误次数和来源 |
| Review Queue | 现在有哪些内容值得主动巩固？ | `LearningRecommendation.reviewRecommendations` | 保存建议快照；用户可标记完成或重新加入 |

三个领域互相投影，但不互相冒充：

```text
LessonSession ───────────────→ LearningHistory
QuestionSession ─────────────→ LearningHistory
QuestionAttempt ──────────────→ WrongBook
MasteryRecord ─→ STRATEGY_V1 ─→ ReviewQueue

History ≠ Mastery
WrongBook ≠ Mastery
ReviewQueue ≠ Strategy
ReviewQueue ≠ Spaced Repetition Scheduler
```

## 2. Learning History

### 2.1 记录模型

`LearningHistoryRecord` 位于 `src/types/learning-history.ts`，记录：

- `profileId`、`textbookId`、`unitId`、`lessonId`、`knowledgePointId`：用于档案与教材隔离。
- `type`：`lesson_started`、`lesson_completed`、`assessment_started`、`assessment_completed`。
- `sourceId`：来源 `LessonSession.id` 或 `QuestionSession.id`，不复制 `QuestionAttempt[]`。
- `occurredAt`：来源会话的开始 / 完成时间；缺失时保留诊断并使用安全 fallback。
- Assessment completed 摘要：题量、自动判定答对 / 答错、人工判断数量和本次自动评分正确率。该百分比不是 `masteryScore`。
- `provenance.isSampleDerived` 与 `verificationStatus`：SAMPLE 记录在任何展示中都不能伪装成正式学习记录。

记录 ID 为 `learning-history:{profileId}:{type}:{sourceId}`。Repository 按 ID append-idempotent，列表默认按 `occurredAt DESC`，再按事件类型和 ID 稳定排序。

### 2.2 存储与投影

- 存储 key：`knowledge-island.learning-history`。
- 载荷：`{ schemaVersion: 1, records }`。
- `LearningHistoryService` 负责 `LessonSession` / `QuestionSession` 投影；`learningHistoryStore` 是独立 Pinia 边界。
- JSON 损坏、未知 schema 或校验失败会安全回退为空列表并保留可展示 warning，不让页面白屏。
- `clearDemoHistory(profileId)` 只清理指定档案的 SAMPLE 记录；不删除正式历史。

## 3. WrongBook

### 3.1 进入规则与身份

只有同时满足以下条件的 Attempt 才进入错题本：

1. 属于当前 `QuestionSession.questionIds`。
2. `submitted === true`。
3. 有确定性 `result`，且 `result.status === 'incorrect'`。
4. 题目处于 Question Engine 当前支持集合中，且知识点关系可用；否则只记录 diagnostic。

`correct`、`manual_review_required`、draft、未提交、孤儿、无结果、unsupported 或损坏 Attempt 不会生成错题记录。`WrongQuestionRecord` 只保存 `questionId`、知识点关系、会话来源和状态，不复制题干、选项、答案或解析；展示时通过 `QuestionRepository` 读取题目。

核心身份为 `wrong-question:{profileId}:{questionId}`。同一道题再次答错只更新：

```text
wrongCount += 1
lastWrongAt
source.questionSessionIds
```

新的错误会把 `resolved` 记录重新激活；成功重练才把记录标记为 `resolved` 并保存 `resolvedAt`。Attempt 投影 key 为 `wrong-attempt:{profileId}:{questionSessionId}:{questionId}`，重复处理不会重复增加 `wrongCount`。

### 3.2 重练边界

错题重练通过 `AssessmentLaunchContext.source = 'wrong_book'` 进入 Question Engine。它使用新的 `sessionScope` 生成新的 `QuestionSession.id`，原 Session 和 Attempt 保持不变；重练失败会产生新的错误来源，重练成功才解决原错题。

## 4. Review Queue

Review Queue 只接收 Strategy 已经给出的 `REINFORCE` 与 `GATHER_MORE_EVIDENCE` 建议。它保存 Strategy 版本、建议原因、优先级、知识点、可选地图节点和来源标记，不重新计算掌握度，也不拥有策略规则。

- item ID：`review-queue:{profileId}:{textbookId}:{knowledgePointId}:{mapNodeId-or-kp}:{recommendationType}`。
- 存储 key：`knowledge-island.review-queue`。
- 载荷：`{ schemaVersion: 1, items }`。
- 用户可以把 item 标记为 `completed` 或重新打开；投影同一建议时保留已完成状态。
- CTA 只定位到已有地图节点；没有生成题目 ID、复习日期或题目集合。
- 不包含 `scheduledAt`、`nextReviewAt`、`reviewInterval`、`decayScore`、`reward`、XP、连续天数等字段。

Strategy 的 `SAMPLE`、`UNVERIFIED`、`REJECTED` 或带安全 warning 的结果，在 `profile` 数据集不会物化为正式 Queue；显式开发 / Golden 数据集可以展示，但必须带来源警示。

## 5. 应用接线

```text
LessonPlayerStore.start / complete
        ↓
LearningHistoryService

QuestionEngineStore.start / submit / complete
        ├─→ LearningHistoryService
        └─→ WrongBookProjectionService

MasteryProcessingService
        ↓
LearningStrategyService（STRATEGY_V1）
        ↓
ReviewQueueProjectionService
```

投影失败只显示可恢复 warning，不回滚原学习、作答、Mastery 或地图完成状态。页面不监听访问、点击、hover、scroll 或停留时长，因此本阶段不是 Analytics 系统。

## 6. 不在 PHASE 12

本阶段不实现 Reward、Coins、XP、Achievement、Badge、Streak、Daily Check-in、Leaderboard、KnowledgeEnergy、Parent / Teacher Dashboard、AI Tutor、AI 错题总结 / 诊断 / 出题 / 复习计划、AI Learning Path、Spaced Repetition、SM-2、FSRS、Review Calendar、Push Notification、Cloud Sync、Backend Database 或 User Authentication。

## 7. 验收要求

最终验收需要同时通过：

- `npm install`
- `npm run type-check`
- `npm run lint`
- `npm run format:check`
- `npm run test:run`
- `npm run build`
- `npm run curriculum:review`，结果仍为 `REQUIRES_MANUAL_REVIEW`
- `git diff --check`
- `/history`、`/wrong-book`、`/review-queue` 与既有主链路的多视口浏览器回归，无横向溢出、无控制台错误

完成 PHASE 12 后停止，不进入 PHASE 13。

## 8. 最终验收记录

验收日期：2026-09-03。

- `npm install`、`npm run type-check`、`npm run lint`、`npm run format:check`、`npm run test:run`、`npm run build`、`npm run curriculum:review` 和 `git diff --check` 均通过。
- Vitest：10 个测试文件，117 个测试通过。
- Curriculum Review 仍为 `REQUIRES_MANUAL_REVIEW`；没有把 SAMPLE / UNVERIFIED 内容升级为正式核验状态。
- 本地浏览器回归覆盖 6 个入口 × 6 个视口，共 36 个组合；无横向溢出，无 `warn/error` 控制台日志。
- 正式 `/history`、`/wrong-book`、`/review-queue` 均隐藏开发样本并通过空状态检查；开发入口保留显式样本 / 来源警示。
- 错题重练已验证为新的单题 `QuestionSession`，答对后原错题进入 resolved；原始 `QuestionAttempt` 未被覆盖。
- 构建输出包含既有 Zod Rollup 注释提示和 chunk 大小提示，但构建退出码为 0。

PHASE 12 到此停止，不进入 PHASE 13。
