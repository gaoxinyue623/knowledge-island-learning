# Parent Report 隐私与只读边界

## 1. Local-first

PHASE 15 的 Parent Dashboard 运行在现有本地应用上下文中。报告从本地已有的 Profile、LearningHistory、Mastery、WrongBook、Review Queue、Daily Plan、Reward、Growth 和 Achievement 读取并实时聚合；没有新增 Backend、Cloud Sync、Authentication、Parent Account 或外部 Report API。

报告本身不作为事实缓存持久化。唯一新增的持久化是家长查看偏好：

```text
knowledge-island.parent-report-preferences
{ schemaVersion: 1, selectedRange, selectedSubject }
```

Zod 校验失败、JSON 损坏或 Storage 不可用时安全回退默认筛选并给出 warning，不白屏，也不删除任何孩子端学习事实。

## 2. 不新增个人信息

本阶段不采集或上传真实姓名、学校、电话、邮箱、精确位置或家庭信息。报告只复用当前本地 Profile 的显示名称和教材上下文；如果没有可用名称，使用通用显示名“同学”。

未实现家长身份验证、监护人授权、多孩子切换和跨设备同步；这些是未来独立的产品与合规设计，不应从当前页面推断出已支持。

## 3. No external analysis

PHASE 15 不接入：

- Analytics SDK、第三方 Tracking、广告或外部行为分析。
- AI Parent Summary、AI Child Evaluation、AI Diagnosis、AI Parenting Advice、AI Learning Plan 或 AI API。
- Ranking、Leaderboard、班级 / 同龄比较、预测成绩、预测能力或升学表现。

页面文案只陈述事实，例如“最近有 3 个知识点需要继续巩固”，不输出“基础差”“粗心”“注意力不足”“建议增加训练时长”等未被数据定义支持的标签和建议。

## 4. Source guard 与环境隔离

正式 `/parent`：

- 仅读取 `dataset = profile`。
- 过滤 `isSampleDerived = true`、`SAMPLE`、`UNVERIFIED` 和 `REJECTED` 的事实。
- 不把 SAMPLE-only、未审核或被拒绝的教材映射为正式报告结论。

开发 `/dev/parent-dashboard`：

- 允许 Full、Empty、Sample、Unverified、Weak-heavy、No WrongBook、No Review、Partial 和 Error 场景。
- SAMPLE / 未审核数据必须显示明确来源提示。
- Full fixture 是内存数据，进入、刷新、切换范围或切换学科不会向孩子端事实 Storage 写入演示数据。

`CURRICULUM_REVIEW` 仍保持 `REQUIRES_MANUAL_REVIEW`；PHASE 15 不将内容审核状态擅自改为 `REVIEWED`。

## 5. Read-only Contract

ParentReport 读取不允许：

```text
修改 MasteryScore / MasteryState
修改 Strategy
修改 DailyPlan 或 Review priority
Resolve WrongBook
Complete Lesson / Assessment / Review
增加 Reward / KnowledgeEnergy
解锁 Achievement / Curriculum / LearningMap
创建 LearningEvidence / QuestionAttempt / History
```

家长页的 CTA 只进行 Router navigation。返回孩子端后，Mastery、Strategy、WrongBook、ReviewQueue、DailyPlan、Reward 和 Achievement 状态应保持不变；真正的状态变化仍由孩子端既有完成流程产生。

## 6. 数据最小化与展示边界

- History 只展示完成事件和 Assessment 摘要，不复制完整 `QuestionAttempt[]`。
- WrongBook 只展示 Question ID、状态、错误次数和必要的 KnowledgePoint / Subject 索引，不复制题目正文、答案或解析。
- Mastery 只展示具体 KnowledgePoint 的状态 / 分数和四档分布，不生成综合掌握度。
- Growth / Achievement 只作正向反馈，不代表学习质量，也不列出未获得里程碑形成压力。
- Trend 只显示真实完成日期，不补造数据，不做未来预测。
- 没有可信 duration 时不显示学习时长，不使用 Lesson estimatedMinutes 伪装实际时长。

## 7. Storage Corruption 与部分失败

报告偏好 Storage 采用版本化 schema 和安全解析。任何可选读取源失败时，`ParentReportService` 尽量返回剩余可用报告，并把诊断放入 diagnostics；页面继续展示可用区块，而不是因为 Achievement 或某个地图读取失败而白屏。

## 8. 明确不做的输出能力

PHASE 15 默认不提供 PDF / Excel Export、Email Report、分享链接、Push、Reminder、消息、付费报告或云端留存。未来如果实现，必须单独完成权限、同意、保留期限、传输与审计设计。
