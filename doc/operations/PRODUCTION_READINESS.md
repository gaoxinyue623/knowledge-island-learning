# Production Readiness

## 1. 门禁定义

`validateProductionReadiness` 是集中式 release-scope validator，不由页面临时判断。它检查：

- Scope 是否有 `RELEASED` 条目，且教材、地区、出版社、学期、学科、年级和有效关系一致。
- 所有进入 index 的 Curriculum record 是否 `REVIEWED + ACTIVE`。
- Content 是否 `REVIEWED + PUBLISHED`、有可清理来源并达到 Lesson/KnowledgePoint 覆盖。
- Question 是否 `REVIEWED + PUBLISHED`、结构/答案/映射/覆盖和来源通过。
- SourceReference 是否有 URL、检索/人工核验字段且不是 SAMPLE。
- Production index 是否泄漏 `SAMPLE_*`、`isSample` 或 `verificationStatus = SAMPLE`。
- Scope 外的 reviewed 内容/题目不被悄悄当作本 Scope 的正式数据。

## 2. 历史初始运行结果

以下为 PHASE16 初始空发布范围的历史结果，不代表当前版本。2026-09-24 最新工程检查为 `READY_WITH_LIMITATIONS`：11 本教材、357 节课、1694 道题，86 个测试文件、959 项测试通过。具体范围和未完成的公网/真机/学生验收见 [PHASE28](../history/PHASE28.md)。

| 项目 | 结果 |
| --- | --- |
| `productionCurriculumData` | 显式空 allow-list |
| `productionCurriculumIndex` | 空 |
| Candidate count | 1 |
| Released count | 0 |
| Curriculum readiness | `FAIL` |
| Content coverage | `FAIL`，没有发布 Lesson |
| Question coverage | `FAIL`，没有发布 KnowledgePoint |
| Sample leak scan | 空 index 无泄漏；SAMPLE fixture 在独立测试中被拦截 |
| `release:check` | `NOT_READY` |

## 3. 生产配置

`resolveProductionConfig({ isProduction: true })` 无论环境变量是否缺失，都返回：

```text
allowSampleCurriculum = false
allowUnreviewedCurriculum = false
allowSampleLearningContent = false
allowUnreviewedLearningContent = false
allowSampleQuestions = false
allowUnreviewedQuestions = false
devRoutes = false
```

开发默认值只用于已有开发 fixtures，不能改变生产配置。生产 Router 将 `/dev/*` 重定向到安全入口；正式 runtime 的 Curriculum、Content、Question 读取使用 production index。

## 4. 代码入口

- `src/config/production.ts`
- `src/services/production-readiness/productionReadinessValidator.ts`
- `src/services/production-readiness/productionIndex.ts`
- `src/services/production-readiness/mvpReleaseGate.ts`
- `scripts/mvp-release.ts`
