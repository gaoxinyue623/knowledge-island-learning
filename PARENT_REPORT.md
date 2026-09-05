# ParentReport Domain

## 1. 定位

`ParentReport` 是家长侧的只读 Reporting / Aggregation Layer。它整理已有学习事实，不拥有新的学习决策，也不拥有孩子的行为事实。

```text
LearningHistory
MasteryRecord
STRATEGY_V1 read result
WrongBook
ReviewQueue
DailyLearningPlan
Reward / Growth
Achievement
        ↓
ParentReportService
        ↓
ParentReport (PARENT_REPORT_V1)
```

ParentReport 不写入上游领域，不因为家长打开、刷新或筛选报告而产生 History、QuestionAttempt、LearningEvidence、MasteryRecord、RewardEvent、AchievementUnlock、WrongBook 或 Review completion。

## 2. Report Version 与身份

```ts
export const PARENT_REPORT_VERSION = 'PARENT_REPORT_V1'
```

报告 ID 使用确定性构造：

```text
parent-report:<profileId>:<range.startDate>:<range.endDate>:PARENT_REPORT_V1
```

业务身份不使用 `Math.random()`、`randomUUID()` 或 `Date.now()`。`generatedAt` 是读取时钟的展示字段；测试和聚合可以注入 `now`，因此相同输入和相同 `now` 会得到相同报告。

## 3. 范围与筛选

第一版支持：

| preset | 规则 |
| --- | --- |
| `7d` | 当前用户本地日期及向前 6 天 |
| `30d` | 当前用户本地日期及向前 29 天 |
| `all` | 从已有事实最早日期到当前用户本地日期 |

也支持显式合法的 `{ preset, startDate, endDate }`。日期键使用本地 `YYYY-MM-DD`，避免 UTC 转换造成跨日偏移。学科筛选为 `ALL`、`CHINESE`、`MATH` 或 `ENGLISH`。

Mastery、当前 active WrongBook、当前 pending Review Queue 和累计 Growth / Achievement 是当前 Profile 状态；完成活动、范围内完成复习、范围内解决错题、Daily Plan completion、最近 Achievement 和 Trend 使用选定日期范围。这样切换范围不会把“当前待处理”误读成历史事件。

## 4. Summary Types

`ParentReport` 包含以下派生区域：

- `ParentOverviewSummary`：学习天数、完成课程 / 练习、Daily Plan completed / total、active / resolved wrong、完成复习和已掌握知识点。
- `SubjectProgressSummary[]`：语文、数学、英语各自的完成课程 / 练习、掌握、学习中、需要巩固、active 错题和完成复习；无事实的学科保留 `hasData = false`。
- `MasteryReportSummary`：`not_started`、`weak`、`learning`、`mastered` 四档数量。
- `WeakKnowledgeSummary`：最多 5 个值得回看的 KnowledgePoint；包含状态、现有掌握度、置信度、错题数量、已有 Review recommendation 和 strategy priority。
- `WrongBookReportSummary`：当前 active / resolved、`wrongCount > 1` 的 repeated count，以及最多 5 个近期错题索引。
- `ReviewReportSummary`：当前 pending、累计 completed 和范围内 recent completed。
- `DailyPlanCompletionSummary`：每个真实存在的本地日期的 completed / total / percentage。
- `LearningActivitySummary`：真实完成的课程、练习、复习、解决错题和最近活动条目。
- `ParentGrowthSummary`：当前 KnowledgeEnergy、Growth level、到下一等级的进度和范围内新增 Energy。
- `ParentAchievementSummary`：已解锁数量、定义总数和范围内最近解锁的 Achievement；不展示未获得成就压力列表。
- `ParentTrendSummary`：真实日期的完成记录轻量柱状趋势和文字描述。
- `flags` / `diagnostics`：SAMPLE、未审核和部分来源失败提示。

## 5. Aggregation Rules

### 5.1 History 与 Activity

History 是完成事实的主要来源。`lesson_started` 和 `assessment_started` 只属于历史事件，不计入完成数量；`lesson_completed` / `assessment_completed` 进入 Overview、Subject 和 Activity。Assessment 的题数、答对、答错、人工判断和百分比直接使用 History 摘要，`assessmentPercentage` 不等于 `masteryScore`。

### 5.2 Mastery 与 Weak Knowledge

Mastery 只读取现有 `MasteryRecord`。报告可以展示单个 KnowledgePoint 的 `masteryScore`，也可以展示四档数量，但不平均所有知识点生成“综合掌握度”。

Weak Knowledge 只来自以下已有结果：

1. `MasteryRecord.state = 'weak'`。
2. active `ReviewQueueItem`。
3. `STRATEGY_V1` 的 `reviewRecommendations`。

报告不写 `if score < 60` 之类的第二套阈值。已有 Strategy priority 用于优先展示；在没有 Strategy priority 时，状态、分数和 KnowledgePoint ID 只是稳定的 presentation ordering，不是新的学习策略。

### 5.3 WrongBook 与 Review

WrongBook 只引用题目 ID 和现有聚合字段，不复制 stem、options、answer 或 explanation。`repeatedWrongCount` 只统计真实记录中 `wrongCount > 1`。active / resolved 是 WrongBook 的当前状态，报告读取不会 Resolve。

Review pending / completed 直接读取 Review Queue；报告不会创建 Review item、改变 priority 或完成 item。Review 仍然是当前巩固建议，不是 spaced repetition schedule。

### 5.4 Daily Plan、Growth、Achievement 与 Trend

Daily Plan 只显示已有 snapshot 中可用任务的 completed / total，不能称为学习质量。Growth 从已有 RewardEvent 的 KnowledgeEnergy 聚合并使用既有 `GROWTH_V1` 计算，不因报告读取重复投影。Achievement 只读取已解锁记录和定义，不调用会写入 unlock 的 evaluate 流程。

Growth 是正向反馈，不等于学习质量；Trend 只使用实际活动和实际 Daily Plan completion 的日期点，不补零制造完整趋势，不预测成绩、掌握度、能力或升学表现。

## 6. Source Guard

正式 `dataset = 'profile'`：

- 排除 `isSampleDerived = true`、`SAMPLE`、`UNVERIFIED` 和 `REJECTED` 的 History、WrongBook、Review、Reward、Achievement 和 Mastery 来源。
- 对教材、Unit、Lesson、KnowledgePoint、映射和关系做来源闸门；不合格的地图不参与正式知识点解析。
- 保留 partial result 和 diagnostics，不因为某一个可选来源失败而让整页白屏。

开发 `dataset = 'demo'`：

- 可以显示 SAMPLE / UNVERIFIED 夹具。
- `flags.isSampleDerived` / `flags.containsUnverifiedContent` 必须可见地反映来源。
- 开发页使用内存演示事实，不把打开报告转化为孩子端持久事实。

## 7. Persistence Boundary

ParentReport 本身优先实时聚合，不建立缓存事实。唯一的本地持久化是报告视图偏好：

```text
key: knowledge-island.parent-report-preferences
payload: { schemaVersion: 1, selectedRange, selectedSubject }
```

Zod 校验失败、JSON 损坏或 Storage 异常时安全回退默认值并提供 warning。禁止建立 `parentMastery.json`、`parentWrongBook.json` 或其他复制上游事实的存储。

## 8. Related Implementation

- `src/types/parent-report.ts`
- `src/services/parent-report/parentReportService.ts`
- `src/services/parent-report/parentReportPreferencesStorage.ts`
- `src/stores/parentReportStore.ts`
- `tests/phase15.test.ts`
