# Question Coverage Report

## 1. 统计范围

统计对象是 MVP Scope 下的正式 KnowledgePoint 和 `productionCurriculumIndex`。题目必须满足：`REVIEWED + PUBLISHED`、题干/选项/答案/解释结构合法、QuestionKnowledgePoint 关系有效、来源和媒体通过门禁。

## 2. 当前结果

| 指标 | 当前值 |
| --- | ---: |
| 发布 KnowledgePoint | 0 |
| 有题 KnowledgePoint | 0 |
| 题目总数 | 0 |
| `REVIEWED` 题目 | 0 |
| 题型分布 | 空（正式题库尚未发布） |
| 难度分布 | FOUNDATION 0 / STANDARD 0 / ADVANCED 0 |
| 缺失覆盖 | 0（因为发布 KnowledgePoint 为 0） |
| 来源问题 | 0（正式题目为 0） |
| 最低题量门槛 | 每个 KnowledgePoint 5 题 |
| Scope coverage | `FAIL`（发布范围为空） |

不要用现有 SAMPLE 题目凑正式覆盖，也不要为达到数量硬生成题目。`shortAnswer` 如果未来纳入，仍需人工审核流程；没有可靠批改能力时不进入正式 MVP 题库。

## 3. 实现与测试

- 实现：`src/services/production-readiness/coverage.ts`
- 题目/关系门禁：`src/services/production-readiness/productionGuard.ts`
- 回归：`tests/phase16.test.ts`，包含完整 reviewed fixture 的 2 个 KnowledgePoint × 每点 5 题验证
