# 知识岛｜PHASE 14 Home Productization / Daily Learning Loop

> 本文档记录 PHASE 14 的实现边界、首页读取模型和 Daily Plan 投影。Home 是应用聚合层，不是新的掌握度或学习策略算法。

## 1. 阶段状态

| 项目 | 内容 |
| --- | --- |
| 阶段 | PHASE 14：Home Productization / Daily Learning Loop |
| 当前实现 | Home Domain、Daily Plan V1、首页、今日任务回链、完成状态刷新、本地持久化、开发样本与正式来源闸门 |
| 停止点 | PHASE 14.4：Persistence / Responsive / Regression / Verification；完成后不进入 PHASE 15 |
| 版本 | `DAILY_PLAN_V1` |
| 数据边界 | Home 只读聚合 Curriculum、LearningMap、LessonSession、Strategy、History、WrongBook、Review Queue、Growth、Achievement |
| 禁止改动 | `MASTERY_V1`、`STRATEGY_V1`、Reward / Growth / Achievement 规则、地图解锁和题目判定 |

PHASE 14 消费 PHASE 5～13 已有能力，把“我今天应该学什么”投影成 1～3 个可执行任务。它不拥有任何上游领域事实，也不把每日任务进度解释为掌握度。

## 2. Home 读取模型

```text
curriculumStore / profile
        ↓
HomeStore
        ↓
HomeService
        ├─ Curriculum + LearningMap + Progress
        ├─ LessonSession / QuestionSession readers
        ├─ LearningStrategyService（STRATEGY_V1，只读）
        ├─ LearningHistory / WrongBook / ReviewQueue
        └─ Reward / Growth / Achievement
        ↓
HomeViewModel
        ↓
HomePage.vue
```

`HomePage.vue` 不直接访问 `localStorage`、Mastery storage、Reward storage 或任何底层 Repository。页面只消费 `HomeStore` 返回的 ViewModel，并通过显式路由上下文进入课程、练习、错题本、巩固队列或学习地图。

## 3. HomeViewModel 区域

首页 ViewModel 包含以下稳定区域：

| 区域 | 内容 | 权威来源 |
| --- | --- | --- |
| Hero / greeting | 学生称呼、年级学期、日期和来源提示 | StudentCurriculumProfile / HomeService |
| Today | DailyLearningPlan、任务状态、今日进度 | DailyPlanProjection |
| Continue | 当前仍在进行的 LessonSession | LessonSession |
| Subjects | 语文、数学、英语教材与地图进度 | Curriculum / LearningMap |
| Recent learning | 最近课程 / 练习历史和摘要 | LearningHistory |
| Growth | KnowledgeEnergy、成长等级和下一等级进度 | GrowthService |
| Achievement | 已解锁数量和下一项里程碑 | AchievementService |
| Quick actions | 地图、历史、错题本、巩固队列、课程设置 | 既有页面路由与读取服务 |

`今日进度`只计算 Daily Plan 中可用任务的完成比例，不能写成“今日掌握度”，也不能代替 `MasteryRecord`。

## 4. Daily Plan V1

### 4.1 任务协议

第一版只允许五种任务：

| 类型 | 输入事实 | 完成事实 | 动作 |
| --- | --- | --- | --- |
| `continue_learning` | `LessonSession.status = in_progress` | 对应 LessonSession completed | 新的 / 恢复的 LessonSession |
| `review` | active `ReviewQueueItem` | ReviewQueueItem completed | `/review-queue` |
| `reinforce` | `STRATEGY_V1` 的 reinforce recommendation | 对应巩固流程完成 | Strategy 提供的 Lesson / Assessment action |
| `wrong_question` | active `WrongQuestionRecord` | 错题重练完成并按 PHASE 12 语义 resolve | `/wrong-book`，再创建新的 QuestionSession |
| `next_learning` | `STRATEGY_V1` 的 next recommendation | 对应新学习流程完成 | Lesson / Assessment / LearningMap action |

任务 action 复用已有 `LessonLaunchContext` 与 `AssessmentLaunchContext`，不复制上下文协议。

### 4.2 Policy、优先级和去重

`DEFAULT_DAILY_PLAN_POLICY` 固定 `maxTasks = 3`，每一类默认最多 1 个。候选选择顺序集中配置为：

```text
continue_learning > review > reinforce > wrong_question > next_learning
```

候选先稳定排序，再应用类别上限和总数上限；数据不足时只展示合法候选，不虚构任务。相同教材内的同一 KnowledgePoint 只保留 `review > reinforce > next_learning` 中优先级更高的一项；`wrong_question` 是题目级事实，可与知识点任务共存，但仍受 `maxTasks` 限制。Continue 对应的同一教材 / Lesson / KnowledgePoint 会抑制 Next。

去重只是 UI 任务组合，不是第二套 Strategy。Home 不根据 `masteryScore` 重新写阈值或生成 recommendation。

### 4.3 稳定身份与快照

日期键使用用户本地日历 `YYYY-MM-DD`，不经过 UTC 转换。计划和任务使用确定性 ID：

```text
daily-plan:<profileId>:<dateKey>:<dataset>:<textbookContextKey>
daily-task:<profileId>:<dateKey>:<type>:<sourceId>
```

同一 Profile、日期、教材上下文、数据集、输入事实和 Policy 会得到稳定结果。计划首次生成后当天保持任务 identity、顺序和数量；刷新只更新状态、进度和可用性。只有新日期、Profile / 教材上下文变化、存储无效或开发 Reset 才重新生成候选列表。

## 5. 完成状态与数据流

```text
Home CTA
  ↓ 显式 launch context / focus query
LessonPlayer / QuestionEngine / WrongBook / ReviewQueue / LearningMap
  ↓ 写入各自既有领域事实
HomeService refresh
  ↓ 读取事实并重新投影同一份 Daily Plan snapshot
今日进度、任务状态、Recent Learning、Growth / Achievement
```

Home 不把“点击 CTA”保存为完成。课程完成来自 `LessonSession`，巩固来自 `ReviewQueueItem`，错题完成来自 WrongBook review flow；缺失上游事实时任务变为 `unavailable`，而不是伪造完成。

## 6. 本地持久化与安全边界

Daily Plan 使用独立 key：`knowledge-island.daily-learning-plans`，载荷 `schemaVersion: 1`。Zod 校验失败、未知版本、JSON 损坏或 Storage 异常会安全回退为空计划并提供 warning，不导致白屏。计划按 `profileId`、本地日期、三科教材上下文和 `dataset` 隔离；开发样本只能在显式 `demo` 路由展示，正式 `profile` 会过滤 SAMPLE / UNVERIFIED / REJECTED 及样本派生事实。

`/home` 是正式首页，`/tasks` 是今日学习入口，`/dev/home` 是开发样本 Showcase。`/dev/home` 的样本 Reset 只清理 Daily Plan snapshot，不删除 `doc/` 或其他领域事实。

## 7. 产品与技术排除项

本阶段不实现新的 Mastery / Strategy / Adaptive Engine、AI 推荐、AI Tutor、AI 生成题目或学习路径、Spaced Repetition、SM-2、FSRS、Review Calendar、Notification / Push、Cloud Sync、Backend、Authentication、Parent / Teacher Dashboard、Reward V2、Coins、XP、Streak、Leaderboard、商城、支付或广告奖励。

## 8. 主要实现文件

- `src/types/home.ts`：HomeViewModel、Daily Plan、Policy 和投影输入类型。
- `src/services/home/dailyPlanProjection.ts`：候选生成、优先级、去重、快照刷新和完成状态解析。
- `src/services/home/dailyPlanStorage.ts`：schemaVersion 1、Zod 校验和损坏回退。
- `src/services/home/dailyPlanService.ts`：按 Profile / 日期 / 教材上下文读取或创建快照。
- `src/services/home/homeService.ts`：只读聚合上游服务，生成 HomeViewModel，并提供开发样本初始化。
- `src/stores/homeStore.ts`：页面读取边界和刷新入口。
- `src/pages/HomePage.vue`、`src/styles/phase14.css`：正式 / 开发首页、状态、CTA、响应式和 Reduced Motion。
- `tests/phase14.test.ts`：稳定 ID、组合规则、快照、来源闸门、损坏存储、Profile 隔离和 Home 聚合回归。

## 9. 验收记录

PHASE 14 的既有测试基线为 127 tests；加入 PHASE 14 回归后当前全量测试为 134 tests。最终验证结果：

- `npm run type-check`：PASS。
- `npm run lint`：PASS。
- `npm run format:check`：PASS。
- `npm run test`：12 files / 134 tests PASS。
- `npm run build`：PASS。
- `npm run curriculum:review`：保持预期的 `REQUIRES_MANUAL_REVIEW`。
- `git diff --check`：PASS。
- 浏览器验证：`/dev/home`、`/dev/lesson-player`、`/dev/question-engine`、`/dev/wrong-book`、`/dev/review-queue` × 375、390、430、768、1024、1440 均无横向溢出；控制台无 warn / error。Lesson、Review、WrongBook 完成后回到 Home，今日进度已验证为 1/3 → 2/3 → 3/3。
- `doc/`：保持原有未跟踪状态，未修改、未删除、未移动、未格式化、未提交。

完成 PHASE 14.4 后在此停止，不进入 PHASE 15。
