# 知识岛｜课程导入协议

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 6.1 |
| 状态 | Schema、规范化导入器和完整性校验已实现 |
| 类型入口 | `src/types/curriculum-verification.ts` |
| 实现入口 | `src/services/curriculum/curriculumImportSchema.ts`、`curriculumImporter.ts`、`curriculumIntegrity.ts` |

## 1. 导入包

`CurriculumImportPackage` 是单个教材版本的导入边界，包含：

- `schemaVersion` 与 `metadata`（生成时间、导入类型、核验状态）。
- 一个 `textbook` 及其 `TextbookIdentity`。
- `units`、`lessons`、`knowledgePoints`、`lessonKnowledgePoints`、`knowledgeRelations`。
- 去重的 `sources: SourceReference[]`。

每个课程实体通过 `sourceReferenceIds` 关联来源，不在每个实体内复制完整来源对象。需要多角色复用时使用 `EntitySourceReference`。

## 2. 导入流程

```text
unknown input
  → CurriculumImportPackageSchema
  → normalize stable ordering + textbookIdentityKey
  → reference / duplicate / completeness checks
  → prerequisite DAG + provenance + SAMPLE checks
  → CurriculumImportResult + CurriculumReviewReport
```

Schema 会检查字段类型、枚举、年级范围、排序值、权重和来源数组。完整性校验会检查：

- Textbook / Unit / Lesson 的层级引用、标题、编号和排序唯一性。
- KnowledgePoint code 唯一、年级范围合法、重要性 1～5。
- 每个 Lesson 至少有一个知识点映射，除非填写 `mappingSkipReason`。
- LessonKnowledgePoint 不重复，`weight` 大于 0 且不超过 1。
- KnowledgeRelation 目标存在、不能自引用，prerequisite 图无环。
- 来源存在、身份 key 正确、SAMPLE 不污染非 SAMPLE 数据集。

有错误时 `success = false`，不会静默写入生产数据；规范化结果只在结构校验成功后返回。

## 3. 数据隔离

- `src/data/curriculum/sample/`：现有 SAMPLE fixtures 的明确命名空间，所有记录必须是 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE`。
- `src/data/curriculum/verified/`：正式来源导入入口；当前只有三年级数学上册 PEP 的 `UNVERIFIED` Golden Sample Framework，不包含真实教材目录。
- `src/data/curriculum/core/`：共享年级、学期、学科字典，不承载教材事实。

`SAMPLE_*` ID 不能进入 VERIFIED / REVIEWED 数据集；`textbookIdentityKey` 缺少年份时使用 `UNKNOWN`，不能凭记忆填充。

## 4. 当前边界

当前只导入一个 Golden Sample Framework，用于验证数据链路。PHASE 6 不批量复制教材正文、不扩展其他年级 / 学科 / 出版社，也不初始化数据库或导入真实教材事实。

