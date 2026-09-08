# Content Coverage Report

## 1. 统计范围

统计对象是 `MVP_SCOPE_SZ_PRIMARY_2026_2027` 的 `productionCurriculumIndex`，不是全量 SAMPLE fixtures。内容必须同时满足：KnowledgePoint 属于发布范围、`REVIEWED + PUBLISHED`、ContentBlock 结构合法、来源已审核且版权 `CLEARED`、媒体引用可用。

## 2. 当前结果

| 指标 | 当前值 |
| --- | ---: |
| 发布教材 | 0 |
| Lesson 总数 | 0 |
| KnowledgePoint 总数 | 0 |
| Content block | 0 |
| `REVIEWED` 内容记录 | 0 |
| 缺失 Lesson | 0 |
| 缺失 KnowledgePoint | 0 |
| 不支持媒体 | 0 |
| 来源问题 | 0 |
| Scope coverage | `FAIL`（发布范围为空） |

这里的 0 表示正式 allow-list 为空，不表示已经完成了真实课程内容。SAMPLE 内容继续由开发页和既有回归测试使用，但不会被统计为正式覆盖。

## 3. 发布条件

每个发布 Lesson 至少需要一个可渲染的正式内容链；每个发布 KnowledgePoint 至少需要一个最新有效版本的正式内容；每个媒体资源都必须有可用 URL、alt text、版权清理和非 SAMPLE 来源。

## 4. 实现与测试

- 实现：`src/services/production-readiness/coverage.ts`
- 门禁：`src/services/production-readiness/productionReadinessValidator.ts`
- 回归：`tests/phase16.test.ts`
