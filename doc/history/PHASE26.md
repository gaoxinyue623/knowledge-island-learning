# PHASE 26：正式学习闭环写入

## 范围

在 PHASE 25 的只读决策边界之后，增加正式答题执行服务。服务只消费已经审核的 Profile、决策、题目和知识点映射；不生成题目，不修改学习地图解锁、DailyLearningPlan 或学生教材选择。

## 实现

- 新增 `RuntimeLearningAgentExecutionService`。
- 开始练习时创建或恢复带学生、决策、题目和映射绑定的 `QuestionSession`。
- 提交答案时重新从 profile 题库读取题目和映射，校验学生、教材、课程上下文、题目版本、审核状态和知识点关系。
- 支持分步提交；只有会话内所有题目都提交后才写入 Evidence 和 Mastery。
- 调用 `AnswerAnalyzer`，拒绝开放题、人工审核题、SAMPLE 题目、未审核题目和跨学生/跨教材会话。
- 复用 `MasteryEngine`、正式 Mastery Repository、WrongBook Projection、Learning History Projection 和 Review Queue Projection。
- Evidence、QuestionSession、错题本和各投影均按稳定 ID 幂等；重复提交不会重复增加证据或错题次数。
- Evidence 投影检查来源会话的学生和教材边界；存储失败会返回可重试状态，不伪报提交成功。
- 修正正式映射 `ACTIVE + REVIEWED` 的可读性判断，使已审核结构映射可以进入 Evidence 提取。

## 尚未接入

本阶段提供服务和测试，尚未把它接入正式学生答题页面，也没有开放真实模型自动出题。正式页面接入仍需复用已审核题目，并将 UI 的提交、恢复和结果展示绑定到本服务。

## 验证

```sh
npm run type-check
npm run lint
npx vitest run tests/runtime-execution-service.test.ts
```

测试覆盖分步完成、Evidence 延迟写入、掌握度重建、重复提交幂等、错题本去重、SAMPLE/未审核题目阻断和跨会话身份阻断。
