# 知识岛｜PHASE 6 数据校验

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 6：Curriculum Import + Verification |
| 状态 | Mock / Service / Storage / Import 边界校验已实现；人工审核后台未实现 |
| 实现入口 | `src/services/validation/`、`src/services/curriculum/` |

## 1. 校验层

Zod schema 用于跨边界载荷：

- `studentCurriculumProfileSchema`：三科独立字段、确认时间和来源。
- `storagePayloadSchema`：`schemaVersion: 1` 与档案包装结构。
- `regionTextbookRelationSchema`：地区教材关系字段和生命周期。
- `contentBlockSchema`：结构化题干、选项、提示、解析和内容正文。
- `questionSchema`：题型、答案规则、媒体、题型专有字段和 SAMPLE 标识。
- `CurriculumImportPackageSchema`：教材身份、单元、课次、知识点、映射、知识关系、来源和导入元数据。
- `CurriculumReviewRecordSchema`：课程事实核验动作、审核角色和审核时间。

## 2. 内容块规则

| 类型 | 最小规则 |
| --- | --- |
| `TEXT` | 必须有非空 `text` |
| `RICH_TEXT` | 至少有 `text` 或 `mediaAssetId` |
| `IMAGE` | 必须有 `mediaAssetId` |
| `AUDIO` | 必须有 `mediaAssetId` |
| `FORMULA` | 必须有非空 `text` |

媒体真实地址不进入 ContentBlock、QuestionMedia 或 CourseContent.media；它们只引用 `MediaAsset`。

## 3. 课程完整性

`validateCurriculumData` 检查：

- 教材的出版社、年级、学期、学科和来源引用。
- 地区教材关系的地区、教材和来源引用。
- 单元 → 教材、课次 → 单元、课次知识点关系和内容 → 知识点引用。
- `GradeScope` 范围、知识点来源和前置关系图。
- 课程内容 `body.blocks` 的 ContentBlock、课程媒体引用。
- 题目的知识点、来源、媒体、答案规则和题型字段。
- 地图 → 单元、节点 → 知识点 / 内容引用。
- 所有 SAMPLE 记录的 `isSample`、`needsVerification`、`verificationStatus = SAMPLE` 与 `status != PUBLISHED`。

`validateKnowledgePrerequisiteGraph` 会报告失效引用、自依赖和有向环。发现问题时保留数据以便开发工具观察，但不得进入发布路径。

## 4. 题目完整性

`validateQuestion` 进一步检查 `questionType` 与答案规则映射、选项归属、单选正确键、拖拽项目与目标、阅读子题和媒体 ID。它只验证数据结构和引用，不执行真实作答或评分。

## 5. 发布边界

`validateSamplePublishGuard` 是最小发布闸门：`isSample: true` 且 `status: PUBLISHED`、`verificationStatus = VERIFIED` 或 `verificationStatus = REVIEWED` 都必须失败。它与 `CONTENT_REVIEW.md` 的人工审核、版权确认、教材核验和发布审批相互补充，不会把 Mock 数据提升为生产内容。

## 6. PHASE 6 导入完整性与生产读取

`importCurriculumPackage()` 先运行 Zod Schema，再运行 `curriculumIntegrity`：

- 检查 `TextbookIdentity` key、一致性与重复身份；缺少年份使用 `UNKNOWN`，不猜测版次或 ISBN。
- 检查 Unit / Lesson 的父级引用、标题、`unitNo` / `lessonNo` / `sort` 唯一性。
- 检查知识点 code、年级范围、合法重要性权重、LessonKnowledgePoint 引用和重复映射；正式课次没有映射时必须给出 `mappingSkipReason`。
- 检查 KnowledgeRelation 的目标、自引用和 prerequisite 有向无环图。
- 检查每个导入实体的 `sourceReferenceIds`、来源存在性、`verificationStatus` 和 SAMPLE ID 污染。

结果写入 `CurriculumImportResult` 与 `CurriculumReviewReport`，不会在有结构错误时静默写入。`npm run curriculum:review` 是当前 Golden Sample Framework 的可重复入口，报告文件为 `CURRICULUM_VERIFICATION_REPORT.md` 和 `curriculum-verification-report.json`。

生产课程解析使用集中访问策略：只有 `verificationStatus = REVIEWED` 且未归档的记录默认可读；SAMPLE、UNVERIFIED、VERIFIED 和 REJECTED 不能作为生产候选。开发 Mock 可由显式环境开关读取 SAMPLE，但不改变生产规则。
