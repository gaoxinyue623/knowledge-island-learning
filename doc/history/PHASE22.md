# PHASE 22：个性化学习计划复盘

## 范围

在 PHASE 21 的 SAMPLE 隔离练习计划后增加可读的学习复盘。复盘只读取计划已提交的 AnswerAnalyzer / Evidence / Mastery 结果，不写正式学生档案、每日计划或浏览器存储。

## 实现

- 新增 `AdaptivePlanReport` 投影：统计完成组数、作答结果、新增证据、掌握度前后变化和错题。
- 掌握度变化使用已有 `MasteryRecord`，区分“暂无证据”和已有证据但掌握度为 0；报告只计入本次计划新增且去重后的 Evidence。
- 错题回顾展示题面、学生答案、确定性标准答案和题目解释；不根据最终答案臆测具体错误原因。
- 复盘会用更新后的内存快照运行既有 `LearningPlanner`，给出下一学习动作、目标知识点、原因和证据引用。建议失败不会撤销已提交结果，也不会暴露内部异常。
- 完成计划后可基于本次内存快照继续创建下一计划；父组件设置变更不会改写已开始计划。
- 修复直接练习在快照带有错题本时被错误按错题变式校验的问题：只有活动明确声明 `wrongQuestionVariation` 时才传递变式信号。

## 验证

```sh
npm run type-check
npm run lint
npx prettier --check src/services/learning-agent/adaptivePlanReport.ts tests/adaptive-plan-report.test.ts tests/adaptive-plan-report-ui.test.ts
npx --yes --package=node@24.20.0 node node_modules/vitest/vitest.mjs run tests/adaptive-plan-report.test.ts tests/adaptive-plan-report-ui.test.ts tests/adaptive-learning-plan.test.ts
```

复盘专项覆盖未提交答案、重复提交、错题跨组保留、掌握度快照隔离、建议失败脱敏、复习完成、阻断任务和页面继续练习。
