# PHASE 27：正式 Agent 学生路径接入

## 范围

把正式运行时决策、已审核题目和正式执行服务接入学生页面。开发模拟入口继续保留，正式入口从个人主页进入 `/learning-agent`，练习继续复用 `/assessment`。

## 实现

- 新增正式 Agent 学习建议页 `FormalLearningAgentPage`，只调用运行时决策服务读取当前 Profile 的下一步建议。
- 通过 `formalAgentLaunchStorage` 保存一次练习的决策、学生和教材绑定，进入题目页时恢复绑定。
- Question Engine 以同一 `sessionScope` 创建或恢复会话；正式执行服务会接管尚未开始的旧会话壳，避免重复会话。
- 每道题提交和整组完成都交给 `RuntimeLearningAgentExecutionService`，页面不再对正式 Agent 会话重复调用旧掌握度投影。
- 执行服务重新读取并校验题目、知识点映射和审核状态；SAMPLE、未审核、人工审核题和跨学生/教材数据会在提交前阻断。
- 正式完成后由执行服务写入 Evidence、Mastery、错题本、学习记录和复习队列，重复提交保持幂等。

## 学生入口

- 个人主页提供“今日 Agent 建议”。
- `/learning-agent` 是正式学生路径。
- `/agent` 仍指向开发模拟页，不参与正式学习记录。

## 验证

```sh
npm run type-check
npm run lint -- --no-warn-ignored
npx vitest run tests/runtime-execution-service.test.ts tests/runtime-decision-service.test.ts tests/learning-agent-entry.test.ts
npm run build
```

覆盖正式路由、启动绑定存储、Question Engine 会话接管、审核题目边界、分步提交、完成投影、恢复和重复提交。
