# 知识岛｜课程审核操作边界

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 6.3 |
| 状态 | 审核记录结构、状态迁移和自动报告已实现；审核后台未实现 |
| 上游事实源 | `CONTENT_REVIEW.md`、`DATA_MODEL.md`、`CURRICULUM_VERIFICATION.md` |

## 1. 课程审核记录

课程结构事实使用 `CurriculumReviewRecord`：

```ts
interface CurriculumReviewRecord {
  id: Id;
  entityType: string;
  entityId: Id;
  action: "verify" | "review" | "reject" | "request_change";
  reviewer: "SYSTEM" | "MANUAL_REVIEW";
  reviewedAt: string;
  note?: string;
}
```

`SYSTEM` 只能记录自动校验结果；`MANUAL_REVIEW` 才能确认教材事实、知识点语义、地区适用性、版权和发布前人工结论。不能使用虚构姓名或把 AI 作为审核人。

## 2. 审核动作与状态

| action | 目标状态 | 说明 |
| --- | --- | --- |
| `verify` | `VERIFIED` | 依据可靠来源完成事实核验 |
| `review` | `REVIEWED` | 在已 VERIFIED 基础上完成责任人审核 |
| `reject` | `REJECTED` | 记录事实、来源、版权或结构问题 |
| `request_change` | `UNVERIFIED` | 允许 REJECTED 经过修订重新进入核验流程 |

`SAMPLE` 不能进入 `VERIFIED` / `REVIEWED`；`UNVERIFIED` 不能直接 `REVIEWED`；`REJECTED` 不能跳过修订直接 `REVIEWED`。修订已审核数据时保留历史记录，不覆盖原证据。

## 3. 自动 Review Report

运行 `npm run curriculum:review`，报告会检查：

- Schema 与稳定教材身份 key。
- Textbook → Unit → Lesson → LessonKnowledgePoint → KnowledgePoint → KnowledgeRelation 的引用和完整性。
- 重复 ID、重复知识点 code、重复课次映射、合法权重和排序。
- 来源引用、SAMPLE 污染和 prerequisite DAG。
- 当前验证状态、待人工审核项和最终 `PASS` / `FAIL` / `REQUIRES_MANUAL_REVIEW`。

当前 Golden Sample Framework 结构检查通过，但无可靠教材来源、人工审核和版权证据，最终为 `REQUIRES_MANUAL_REVIEW`。

## 4. 与 ContentReview 的区别

`ContentReviewRecord` 面向 `CourseContent` / `Question` 的具体内容版本和发布审批；`CurriculumReviewRecord` 面向教材、单元、课次、知识点及关系的课程事实。两者都必须保留来源、时间和证据，不能通过一个记录替代另一个。

