# Curriculum Release Review

## 1. 当前对象

| 项目 | 值 |
| --- | --- |
| Golden package | `GOLDEN_MATH_PEP_G3_S1_TEXTBOOK` |
| 目标 | 小学三年级数学上册 PEP Golden framework |
| 当前 verification | `UNVERIFIED` |
| 当前 review command | `REQUIRES_MANUAL_REVIEW` |
| Production Scope | 候选 `SZ-G3-MATH-UPPER-BNUP-CANDIDATE`，不是 Golden package 的自动发布结果 |

`npm run curriculum:review` 复用现有 `importCurriculumPackage` 和 `CurriculumIntegrityValidator`，结果已经写入根目录的生成报告。结构通过不代表教材事实、版权或地区映射已经通过。

## 2. 审核项

| 审核项 | 当前结论 |
| --- | --- |
| Publisher / publisher code | 待可靠来源与人工核对 |
| Textbook identity | PEP 候选框架，版次/ISBN 未确认 |
| Unit | 占位标题，未审核 |
| Lesson | 占位标题，未审核 |
| KnowledgePoint | 项目抽象占位，来源和语义映射未审核 |
| LessonKnowledgePoint | 结构存在，教材语义未审核 |
| KnowledgeRelation | 结构存在，事实来源未审核 |
| Region mapping | 没有当前学年官方闭环 |
| Copyright | 没有原书和正式内容版权闭环 |
| Manual review record | 不存在可发布的 `MANUAL_REVIEW` 记录 |

## 3. 防覆盖规则

`guardReviewedCurriculumOverwrite` 对同一 reviewed identity 的内容变化返回 `allowed = false`、`requiresNewIdentity = true`。正式包不会静默覆盖已经审核的教材；候选和审核版次需要通过新的 identity 或显式 review-needed 流程处理。

## 4. 决定

当前不能将 Golden package 标为 `REVIEWED`，不能将候选条目标为 `RELEASED`，不能把 `productionCurriculumData` 填入猜测的目录或 ISBN。此结论是故意的 fail-safe。

## 5. Batch 01 review boundary

Batch 01（深圳小学一年级语文、数学、英语上下册）已建立 6-slot matrix、公开证据角色清单和两个数学结构候选包。当前批次结果为 `CONFIRMED = 0`、`PARTIAL = 6`、`UNVERIFIED = 0`、`NOT_FOUND = 0`；候选实体和候选包均为 `UNVERIFIED`，既有 importer、integrity、prerequisite DAG 和 import diff 均通过，但最终报告仍为 `REQUIRES_MANUAL_REVIEW`。

没有真实人工 reviewer，因此没有任何 Batch 01 实体推进到 `REVIEWED`。本轮新增了人民教育出版社 2024 修订上册候选及候选 ISBN、BNUP 2024 修订体系候选及数学上册识别码、南山区沪教版课标本地资源线索；这些公开证据仍不能单独确认 2026—2027 深圳当前教材选用或实物版权页。历史深圳选用目录只能作为过期地区背景，国家目录和课程标准只能作为背景来源；Batch 01 不改变 MVP Production Index，详细待办见 `CURRICULUM_BATCH_01_REPORT.md`、`CURRICULUM_SOURCE_MANIFEST.md` 和 `BATCH_01_PHYSICAL_EVIDENCE_REQUEST.md`。

## 6. Review 01 evidence closure

`CURRICULUM_BATCH_01_MANUAL_REVIEW.md` 提供 6-slot Manual Review Matrix；`CURRICULUM_BATCH_01_EVIDENCE_REVIEW.md` 汇总 Source / Entity / Field / Claim / Evidence / Decision / Reviewer / Date；`MANUAL_REVIEW_CHECKLIST.md` 和 `BATCH_01_PHYSICAL_EVIDENCE_REQUEST.md` 是人工逐项入口。当前六个槽位均存在缺证据；三个槽位进入 evidence conflict 列表，英语上下册另保留 `EDITION_VARIANT_CONFLICT` 诊断。因而 Batch 01 没有 Production-eligible textbook，Production Index `UNCHANGED`。在收到明确人工确认前，不推进 `UNVERIFIED → VERIFIED`，不执行 `VERIFIED → REVIEWED`。
