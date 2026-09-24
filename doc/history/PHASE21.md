# PHASE 21：个性化学习计划与任务执行

## 范围

在开发 Agent 实验室中增加隔离的计划执行闭环。它读取现有 Agent Context 和 Planner 决策，按组准备练习，逐题收集答案，提交后复用现有 AnswerAnalyzer、EvidenceExtractor 和 MasteryEngine，再安排下一组任务。

## 实现

- `AdaptiveLearningPlan` 管理 1–5 组内存任务，限制状态为准备、作答、提交、复盘、完成或阻断。
- 每组只接受完整的计算题答案；题目数量、题目身份、答案类型和数值格式在提交前校验。
- 提交结果写回模拟快照中的 Session、Evidence、Mastery、WrongBook / Review 投影，重复提交同一组保持幂等。
- 新增 `AdaptiveLearningPlanPanel`，展示计划进度、任务决策依据、逐题答题、判分反馈和下一任务入口。
- 仅接入开发页的 SAMPLE 模拟数据；不写正式档案、DailyLearningPlan、云端存储或生产学习流程。

## 验证

```sh
npm run type-check
npm run lint
npm test -- --run
npm run build
```

结果：78 个测试文件、894 项测试通过，类型检查、lint 和生产构建通过。
