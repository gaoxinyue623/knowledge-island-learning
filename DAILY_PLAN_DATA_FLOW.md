# Daily Plan V1 数据流

## 1. 定位

Daily Plan 是 Home 对已有学习状态的确定性投影。它负责把当前可执行内容组合成少量今日任务，不重新计算 Mastery，也不创造第二套 Strategy。

```text
LessonSession / Strategy / ReviewQueue / WrongBook / LearningMap / History
                              ↓
                    DailyPlanProjection
                              ↓
                     DailyLearningPlan
                              ↓
                         HomePage
```

## 2. 候选输入

| 候选 | 读取规则 | 生成的动作 |
| --- | --- | --- |
| Continue | 当前 Profile / 教材下的 `in_progress` LessonSession | 恢复 LessonPlayer |
| Review | active ReviewQueueItem | 打开 Review Queue，并聚焦对应项目 |
| Reinforce | 直接读取 `STRATEGY_V1` 的 reinforce recommendation | 使用 Strategy 已给出的 Lesson / Assessment context |
| Wrong | active WrongQuestionRecord | 打开 WrongBook，并聚焦 question；由错题本启动新 Session |
| Next | 直接读取 `STRATEGY_V1` 的 next recommendation | 进入 Strategy 指定的学习 context 或地图 |

History 用于识别完成后的摘要和状态；它不会单独创造任务。地图用于补齐 lesson、unit、node 和教材上下文，并拒绝不可用地图。

## 3. 选择顺序

Policy 版本为 `DAILY_PLAN_V1`，默认 `maxTasks = 3`，类别上限均为 1。候选按以下顺序选择：

```text
continue_learning
  → review
  → reinforce
  → wrong_question
  → next_learning
```

每类内部按固定字段稳定排序，不能使用随机数。相同教材的相同 KnowledgePoint 在 review / reinforce / next 中按 `review > reinforce > next` 去重；wrong question 以 question 为身份，可与 KnowledgePoint 任务同时存在。Continue 会抑制同一教材、Lesson、KnowledgePoint 的 Next。

## 4. 身份、日期和隔离

用户本地日期通过 `getLocalDateKey()` 生成 `YYYY-MM-DD`，避免 UTC 跨日。计划 identity 包含 Profile、日期、数据集和三科教材上下文；任务 identity 包含 Profile、日期、类型和 source ID：

```text
daily-plan:<profileId>:<dateKey>:<dataset>:<textbookContextKey>
daily-task:<profileId>:<dateKey>:<type>:<sourceId>
```

同一个孩子同一天同一教材上下文不会因数组顺序变化而得到不同任务。不同 Profile、教材上下文和 `profile` / `demo` 数据集互不混用。

## 5. Snapshot 语义

首次生成的当天任务列表被冻结。刷新时保留已有 task ID、顺序和数量，只从当前领域事实刷新：

- Continue：LessonSession 是否 completed。
- Review：ReviewQueueItem 是否 completed。
- Wrong：WrongBook 是否 resolved。
- Reinforce / Next：对应历史完成事实或 ReviewQueue 完成事实。
- 上游来源消失或不再可用：`unavailable`。

完成条件来自对应领域，不由 Home CTA 点击直接写入。新出现的候选不会在当天突然插入，避免学生看到的任务列表跳变。新日期、Profile / 教材变化、存储无效或开发 Reset 才重新生成列表。

## 6. 存储和损坏回退

本地 key 为 `knowledge-island.daily-learning-plans`，载荷包含 `schemaVersion: 1`。存取前后使用 Zod 校验；JSON 解析失败、版本不支持、字段不完整或 Storage 抛错时，返回空计划并保留可展示 warning，页面继续可用。`clearDemoPlans()` 只清理 demo 计划。

## 7. 来源闸门

正式 `profile` 投影排除 `isSampleDerived`、`SAMPLE`、`UNVERIFIED`、`REJECTED` 事实；没有合法正式来源时不生成看似正式的任务。开发 `demo` 允许显式 SAMPLE 夹具，但 UI 必须保留开发 / 样本提示。此闸门不会把 Curriculum Review 状态改成 `REVIEWED`。

## 8. 明确不在此数据流

Daily Plan 不包含时间间隔、`nextReviewAt`、衰减、排程日历、通知、推送、AI 生成、Mastery / Strategy 重算、地图自动解锁、奖励发放或云端同步。
