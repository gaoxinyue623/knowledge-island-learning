# PHASE 23：隔离学习计划会话恢复

## 范围

为 PHASE 21–22 的 SAMPLE 学习计划增加页面刷新后的会话恢复。恢复使用浏览器 `sessionStorage`，只保存当前开发会话的隔离快照，不写正式学生档案、Mastery、DailyLearningPlan 或云端数据。

## 实现

- `AdaptivePlanCheckpoint` 保存 schema 版本、任务状态、当前题组、已完成任务、计划基线和当前内存快照。
- `AdaptiveLearningPlan.restore` 校验版本、任务数量、模式、时间、状态和 demo 数据集；损坏或非 demo 检查点失败关闭并清除。
- 存储按 dataset、profile、教材、场景和生成模式隔离；浏览器存储不可用或超额时，计划继续运行但不阻断学习。
- 开发页在发现未结束的 SAMPLE 计划时提供“恢复计划”和“丢弃检查点”；恢复后保留题组、复盘、掌握度变化和后续建议。
- 忙碌中的准备或提交不会写入检查点，避免保存半完成状态；结束计划会主动清理检查点。

## 验证

```sh
npm run type-check
npm run lint
npx --yes --package=node@24.20.0 node node_modules/vitest/vitest.mjs run tests/adaptive-plan-checkpoint.test.ts tests/adaptive-plan-report-ui.test.ts
```

专项测试覆盖刷新恢复、完成计划恢复后继续练习、损坏 JSON、非 demo 快照、忙碌状态、存储失败和页面恢复交互。
