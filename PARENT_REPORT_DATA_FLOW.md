# ParentReport 数据流

## 1. 总体链路

```text
StudentCurriculumProfile
        │
        ├─ LearningHistoryRepository / Service ───────┐
        ├─ MasteryRepository ──────────────────────────┤
        ├─ LearningStrategyService (STRATEGY_V1 read) ──┤
        ├─ WrongBookService ───────────────────────────┤
        ├─ ReviewQueueService ──────────────────────────┤
        ├─ DailyPlanStorage ────────────────────────────┤
        ├─ RewardService / Growth read ──────────────────┤
        └─ Achievement read ────────────────────────────┘
                           ↓
                  ParentReportService
                           ↓
                    ParentReport
                 (PARENT_REPORT_V1)
                           ↓
                  ParentReportStore
                           ↓
               ParentDashboardPage.vue
```

页面只消费 Store 返回的报告，不直接读取 `localStorage`、底层 Repository 或组件临时状态。

## 2. 读取顺序与降级

`ParentReportService.buildReport(profileId, options)`：

1. 解析 dataset、Profile、本地日期、range preset 和 subject filter。
2. 从 History、WrongBook、Review Queue、Mastery / Evidence、Reward、Achievement 和 Daily Plan 读取数据。
3. 对每个来源捕获异常并追加 diagnostics；单个来源失败时使用空数组继续聚合。
4. 按 Profile、来源闸门和教材上下文过滤事实。
5. 读取允许的 LearningMap source，构建只读 map ViewModel，向 `STRATEGY_V1` 请求已有的 review result。
6. 一次性生成 Overview、Subject、Mastery、Weak Knowledge、WrongBook、Review、Daily Plan、Activity、Growth、Achievement 和 Trend。
7. 返回 `ParentReport`；`ParentReportStore` 保存 status / warning / error，并把 report 交给页面。

因此 History 可用而 Achievement 读取失败时，页面仍能显示 History、Mastery、WrongBook 等可用区域，并在 diagnostics 中说明失败来源。

## 3. 各输入的用途

| 输入 | 报告用途 | 写权限 |
| --- | --- | --- |
| LearningHistory | 完成课程 / 练习、Assessment 摘要、Recent Activity | 无 |
| MasteryRecord | 四档掌握分布、具体知识点状态 / 分数 | 无 |
| LearningEvidence | 给现有 Strategy 读取 context | 无 |
| LearningStrategy | Weak Knowledge 的现有 recommendation 与 priority | 无；不会重新计算策略 |
| WrongBook | active / resolved / repeated wrong 摘要 | 无；不会 Resolve |
| ReviewQueue | pending / completed 与 Review recommendation | 无；不会 complete 或改 priority |
| DailyLearningPlan | 实际 snapshot 的 completed / total 与日期趋势 | 只读；不生成新计划 |
| Reward / Growth | KnowledgeEnergy、Growth level、范围内奖励反馈 | 无；不重复投影 Reward |
| Achievement | 已解锁数量、定义总数、最近里程碑 | 无；不调用会写 unlock 的 evaluate |
| Map / Curriculum | KnowledgePoint 名称、Subject、教材映射和来源检查 | 无 |

## 4. 关键派生关系

```text
LearningHistory completed
        ├─ Overview.completedLessons / completedAssessments
        ├─ SubjectProgressSummary
        ├─ LearningActivitySummary
        └─ Assessment summary display

MasteryRecord + existing Strategy / ReviewQueue
        ├─ MasteryReportSummary
        └─ WeakKnowledgeSummary (max 5 display items)

WrongBook + ReviewQueue
        ├─ current pending counts
        └─ recent / completed activity

DailyPlan snapshot
        ├─ completed / total by local date
        └─ real trend point

RewardEvent → existing Growth read
        └─ ParentGrowthSummary

AchievementUnlock + definitions
        └─ ParentAchievementSummary
```

## 5. Range 与 Subject

用户本地日期决定 `startDate` / `endDate`；ISO 时间先转换为本地日期再比较，日期字符串 `YYYY-MM-DD` 保持原始业务日期。当前 active WrongBook、pending Review、Mastery 分布和累计 Growth / Achievement 是当前状态；活动记录、范围内解决 / 完成和 Trend 使用选定范围。

Subject filter 对 History、Mastery、Weak Knowledge、WrongBook、Review 和 Daily Plan task 生效。Growth / Achievement 没有可靠的学科归属，保持 Profile 级展示，不伪装成学科成绩。

## 6. Determinism 与只读契约

- Report ID、范围、Subject 顺序、Weak Knowledge 排序、WrongBook 排序、Activity 排序和 Trend 日期顺序均稳定。
- `now` 可注入；`generatedAt` 是展示元数据，不是业务身份。
- 报告构建只调用公开读取接口；不会调用 `record*`、`save*`、`project*`、`complete`、`markResolved`、`evaluate` 等写入动作。
- 开发 Full 数据通过 `ParentReportDemoFacts` 内存夹具提供，打开 `/dev/parent-dashboard` 不写入孩子端历史、错题、Review、Reward 或 Achievement 存储。

## 7. 页面回链

```text
Parent Dashboard
      ├─ 查看知识岛 → /learning-map 或 /dev/learning-map
      ├─ 查看错题本 → /wrong-book 或 /dev/wrong-book
      ├─ 查看待巩固 → /review-queue 或 /dev/review-queue
      └─ 返回孩子端 → /home 或 /dev/home
```

以上操作只改变 Router 页面，不把家长点击当成孩子完成学习的事实。
