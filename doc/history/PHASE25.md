# PHASE 25：正式运行时只读决策边界

## 范围

为正式学生数据建立 Agent 的第一条接入边界：读取现有 Profile、教材、课程、Mastery、Evidence、作答记录、错题本和复习队列，返回可解释的下一步学习决策。该阶段只读，不生成题目、不写学习事实、不改变正式页面。

## 实现

- 新增 `RuntimeLearningAgentDecisionService`，复用现有 `RuntimeLearningAgentSource`、ContextBuilder 和 Planner。
- 正式运行时只接受 `profile` 数据集；SAMPLE 快照在进入 Planner 前阻断。
- 返回独立的 `LearningAgentDecisionResult`，明确表示“决策已就绪”不代表题目资源已生成。
- 只输出结构化 action、目标知识点、Activity Plan、原因、证据引用和 Trace；不输出模型内容，也不写入 Repository。
- 运行时错误使用白名单错误码，未知异常统一为 `AGENT_RUNTIME_DEPENDENCY_FAILED`，避免数据库或供应商细节泄漏。

## 尚未接入

本阶段没有把决策接入学生首页、DailyLearningPlan、LessonPlayer 或正式答题页；也没有提交答案、写入 Evidence / Mastery、生成生产题目或开启真实模型生成。这些属于后续流程。

## 验证

```sh
npm run type-check
npm run lint
npx --yes --package=node@24.20.0 node node_modules/vitest/vitest.mjs run tests/runtime-decision-service.test.ts
npm run agent:evaluate
```

测试覆盖已审核 Profile 决策、SAMPLE 阻断、无效输入、依赖错误脱敏和“只读、不生成”约束。
