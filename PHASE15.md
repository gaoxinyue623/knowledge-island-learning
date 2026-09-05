# 知识岛｜PHASE 15 Parent Dashboard / Learning Report

## 阶段状态

| 项目 | 内容 |
| --- | --- |
| 阶段 | PHASE 15：Parent Dashboard / Learning Report |
| 实现范围 | PHASE 15.1～15.4 已完成 |
| 报告版本 | `PARENT_REPORT_V1` |
| 正式入口 | `/parent` |
| 开发入口 | `/dev/parent-dashboard` |
| 停止点 | PHASE 15.4：Privacy / Responsive / Regression / Verification |
| 生产审核状态 | `CURRICULUM_REVIEW` 继续为 `REQUIRES_MANUAL_REVIEW` |

PHASE 15 在孩子端主闭环和 PHASE 13～14 反馈聚合之上增加家长侧只读报告。它只回答已经发生了什么，不改变孩子下一步怎么学。

## Goal

让家长能够在一个克制、可理解的页面中查看：

- 最近完成的课程和练习，以及 Assessment 摘要。
- 学习天数、课程 / 练习完成数量、计划任务和待处理错题。
- 学科进展、Mastery 四档分布和来自现有 Strategy / Review Queue 的待巩固知识。
- 错题、复习、Daily Plan completion、最近学习活动、Growth 和已获得 Achievement。
- 最近 7 天、最近 30 天或全部记录，并按学科筛选。

## Scope

### PHASE 15.1：Parent Report Domain & Aggregation

- 创建 `ParentReport`、`PARENT_REPORT_V1`、稳定 Report ID 和 `ParentReportService`。
- 通过既有 Repository / Service / public selector 读取 History、Mastery、Strategy、WrongBook、Review Queue、Daily Plan、Reward / Growth 和 Achievement。
- 创建独立 `parentReportStore`，负责 Profile、range、subject、loading、error、warning 和 report。
- 使用本地日历日期范围；报告读取不会产生新学习事实。

### PHASE 15.2：Summary Projection

- Overview、Subject、Mastery、Weak Knowledge、WrongBook、Review、Daily Plan、Activity、Growth、Achievement 和轻量 Trend。
- Assessment 摘要复用 LearningHistory 的事实摘要。
- Weak Knowledge 消费已有 `MasteryRecord.state`、`STRATEGY_V1` recommendation 和活动 Review Queue，不新增分数阈值。
- 不产生综合学科分、不伪造学习时长、不预测成绩或能力。

### PHASE 15.3：Dashboard UI

- 正式 `/parent` 与开发 `/dev/parent-dashboard`。
- range / subject filter、Overview、最近学习、Trend、学科、掌握度、待巩固、错题、复习、成长、Achievement、Empty、Error、Partial、Sample / Unverified 状态。
- CTA 只导航到孩子端知识岛、错题本和待巩固列表。
- 开发 Full / Empty / Sample / Unverified / Weak-heavy / No WrongBook / No Review / Partial / Error 场景使用内存夹具，不向事实 Storage 写入演示记录。

### PHASE 15.4：Privacy / Responsive / Regression / Verification

- 正式报告过滤 SAMPLE / UNVERIFIED / REJECTED 与样本派生事实。
- 报告偏好使用 schemaVersion 1、Zod 校验和损坏回退；只保存 range / subject。
- 真实 button、heading hierarchy、label、progressbar、trend 文字替代、focus-visible 和 Reduced Motion。
- 验证 375、390、430、768、1024、1440 视口无页面横向溢出，并检查控制台。
- 保留 PHASE 5～14 测试和既有算法语义。

## Domain Boundaries

```text
History       = 发生过什么
WrongBook     = 哪些题答错过
ReviewQueue   = 现在值得主动巩固什么
ParentReport  = 把已有事实整理给家长看
```

Parent Dashboard 是 `Read-only Reporting / Aggregation Layer`，不是 Learning Decision Layer 或 Parental Control System。它不得：

- 修改 `MASTERY_V1`、`STRATEGY_V1`、`DAILY_PLAN_V1`、Reward Policy、Growth Algorithm 或 Achievement Rules。
- 修改 / Resolve WrongBook、完成 Review、完成 Lesson / Assessment、解锁地图或课程。
- 创建 `QuestionAttempt`、`LearningEvidence`、`MasteryRecord`、`RewardEvent`、`AchievementUnlock` 或 History。
- 创建第二套 Mastery、Strategy、综合分、排程、预测、AI 分析、排名、云端账号或外部追踪。

## Implemented

主要实现文件：

- `src/types/parent-report.ts`
- `src/services/parent-report/parentReportService.ts`
- `src/services/parent-report/parentReportPreferencesStorage.ts`
- `src/stores/parentReportStore.ts`
- `src/pages/ParentDashboardPage.vue`
- `src/styles/phase15.css`
- `src/data/parent-report/demo/`
- `tests/phase15.test.ts`

相关领域仍由各自模块负责：History、WrongBook、Review Queue、Reward、Growth、Achievement、Home 和 Daily Plan 不被 ParentReport 取代。

## Not Implemented

PHASE 15 不实现：AI Parent Summary、AI Diagnosis、AI Parenting Advice、AI Learning Plan、Teacher Dashboard、Parent Account / Authentication、Backend / Cloud Sync、Messaging、Push / Reminder、Export / Share、Paid Report、广告、商城、Streak、Leaderboard、Peer Comparison、Prediction、Spaced Repetition、SM-2、FSRS 或真实大规模教材导入。

## Verification

最终命令与结果以本文件验收记录及交付报告为准：

```text
npm install
npm run type-check
npm run lint
npm run format:check
npm run test:run
npm run build
npm run curriculum:review
git diff --check
```

预期 `curriculum:review` 继续输出 `REQUIRES_MANUAL_REVIEW`。Browser Smoke 覆盖正式 / 开发家长页、既有学习链、六种目标视口、console warning / error 和页面横向溢出；`doc/` 目录保持用户原有状态。

## Known Limitations

- 当前报告依赖本地 Profile 和既有本地事实存储；没有账号、云同步或多孩子系统。
- Growth / Achievement 是 Profile 级反馈，学科筛选不把它们解释为学科成绩。
- Mastery 只显示具体知识点和状态分布，不计算总体平均掌握度。
- Trend 只显示真实完成日期，不补零制造完整曲线，也不做未来预测。
- 报告没有可信 duration，因此不显示实际学习时长。
- 未审核教材或演示夹具只适合开发验证；正式生产发布仍需真实人工审核。

PHASE 15.4 完成后停止。未进入 PHASE 16。
