# PHASE 13 — Reward / KnowledgeEnergy / Achievement Growth System

## 状态与停止点

PHASE 13.1～13.4 已完成。当前实现停在成长反馈层，禁止进入 PHASE 14。

验证基线：

- `npm run type-check`：PASS
- `npm run lint`：PASS
- `npm run format:check`：PASS
- `npm run test:run`：PASS
- `npm run build`：PASS
- `npm run curriculum:review`：保持 `REQUIRES_MANUAL_REVIEW`
- `git diff --check`：PASS

## 产品定位

PHASE 13 是 Motivation / Feedback Layer。它只观察已经发生的学习事实，为孩子提供可回看的成长反馈；它不是 Learning Decision Layer。

```text
Reward             ≠ Mastery
KnowledgeEnergy    ≠ MasteryScore
Achievement        ≠ LearningStrategy
Growth             ≠ Curriculum Progress
Reward             ≠ LearningMap Unlock
```

Reward、Growth 和 Achievement 不修改 `LessonSession`、`QuestionSession`、`QuestionAttempt`、`LearningEvidence`、`MasteryRecord`、`LearningRecommendation`、`ReviewQueueItem` 或 `WrongQuestionRecord`。它们也不解锁课程 / 节点、不改变题目难度、不改变 Review priority。

## 事实链

```text
LessonSession completed ─────────────┐
QuestionSession completed ───────────┤
Mastery state transition → mastered ─┤
ReviewQueue active → completed ───────┤
WrongBook active → resolved ──────────┘
                  ↓
        RewardProjectionService
                  ↓
             RewardEvent
                  ↓
      KnowledgeEnergy / Growth rebuild
                  ↓
          Achievement evaluation
                  ↓
       /achievements growth feedback
```

打开 App、打开页面、浏览地图 / History / WrongBook、点击按钮、刷新和开始学习不会产生 Reward。只有明确完成的学习行为可以产生奖励；答错本身不产生奖励，解决错题才可以产生奖励。

## RewardEvent

`RewardEvent` 的稳定身份是 `profileId + type + sourceId`，实现 ID 为 `reward:{profileId}:{type}:{sourceId}`。同一来源重复投影只返回已有事件，不增加 Energy。Reward 事件只包含：

```ts
{
  id,
  profileId,
  type,
  sourceId,
  textbookId?,
  knowledgePointId?,
  occurredAt,
  reward: { knowledgeEnergy: number },
  provenance: { isSampleDerived, verificationStatus? }
}
```

第一版事件类型为 `lesson_completed`、`assessment_completed`、`knowledge_mastered`、`review_completed`、`wrong_question_resolved`。固定策略集中在 `REWARD_V1`：课程 `10`、练习 `5`、掌握知识点 `15`、完成巩固 `8`、解决错题 `6` 点 KnowledgeEnergy。奖励不按正确率制造惩罚或巨大差异。

存储 key 为 `knowledge-island.reward-events`，载荷为 `{ schemaVersion: 1, events }`。Zod 严格校验、损坏清理和 warning 均在 `rewardEventStorage` 边界完成。

## KnowledgeEnergy / Growth

KnowledgeEnergy 只能从 RewardEvent 求和得到；第一版不消费 Energy，因此 `current === totalEarned`。Energy snapshot key 为 `knowledge-island.knowledge-energy`，Growth snapshot key 为 `knowledge-island.growth`，两者均为 schemaVersion 1，并且都可以从 RewardEvent 重建。snapshot 不是唯一事实。

`GROWTH_V1` 的阈值为 `[0, 50, 120, 220, 350]`。Growth level 只用于反馈，不参与地图、教材、题目、Mastery 或 Strategy 决策；达到最高阈值后进度固定为 `100%`。

正式读取默认排除 `isSampleDerived`；开发页可显式读取 SAMPLE，并在 Energy、事件和里程碑处显示“开发样本”。不同 `profileId` 的事件、Energy、Growth 和 Achievement 始终隔离。

## Achievement

Achievement 定义位于 `src/data/achievement/`，版本为 `ACHIEVEMENT_V1`，当前固定 7 个：第一次完成学习、完成 5 次学习、第一次完成练习、掌握第一个知识点、第一次完成巩固、解决第一道错题、累计 50 点 KnowledgeEnergy。

条件只能读取完成计数、掌握状态计数、已解决错题计数、已完成巩固计数和 KnowledgeEnergy。没有连续登录、连续答对、凌晨学习、随机奖励、Leaderboard 或通知调度。Unlock ID 区分 `formal` / `sample`，避免开发样本阻塞正式里程碑。

存储 key 为 `knowledge-island.achievements`，载荷为 `{ schemaVersion: 1, unlocks }`。正式页面 `/achievements` 只读取正式事实；开发页 `/dev/reward` 使用固定 SAMPLE 夹具并提供清理入口。

## 页面与入口

- `/achievements`：正式成长反馈，显示 KnowledgeEnergy、Growth level、Achievement progress 和 Reward history。
- `/dev/reward`：开发 Showcase，显示固定 SAMPLE 数据、来源警示、Reward history、成长进度和里程碑。
- `/learning-map`：提供“查看成长反馈”入口，但不会因为成长改变地图状态或解锁。
- Lesson 完成页、Assessment 完成页、Review Queue 完成反馈显示本次固定 KnowledgeEnergy；错题重练完成后由 Assessment 完成页显示完成反馈。

页面不使用金币、货币、商城或随机宝箱隐喻；图标只作装饰并保留可见文字、`role="status"`、语义进度条和 Reduced Motion 支持。

## 模块责任

```text
rewardStore       → RewardEvent 读取 / 投影状态
growthStore       → Energy / Growth 可恢复读模型
achievementStore  → Achievement progress / unlock 状态
```

`masteryStore`、`learningStrategyStore`、`learningMapStore` 仍由各自领域拥有写权限。Reward service 通过显式 projection 被上游完成链调用，不反向注入这些 Store。

## 排除项

本阶段不实现 Shop、Inventory、付费货币、充值、兑换、抽卡、Loot Box、随机奖励、Leaderboard、PvP、社交竞争、分享 / 广告奖励、Streak、Daily Check-in、强制每日任务、AI Tutor、AI Reward、云同步、Backend、Authentication、Spaced Repetition、SM-2、FSRS、Review Calendar、Push Notification 或 Reminder。

## 相关实现与数据流

- `REWARD_DATA_FLOW.md`
- `GROWTH_DATA_FLOW.md`
- `ACHIEVEMENT_DATA_FLOW.md`
- `src/services/reward/`
- `src/services/growth/`
- `src/services/achievement/`
- `tests/phase13.test.ts`
