# 知识岛｜PHASE 16 Real Curriculum Data / Production Readiness / MVP Release

> 本文档记录 PHASE 16 的最终工程边界与验证结论。PHASE 16 是当前 MVP 主线的最后阶段；完成后停止，不自动进入 PHASE 17。未来新增能力必须重新规划为 V2。

## 1. 阶段结论

| 项目 | 结论 |
| --- | --- |
| 阶段 | PHASE 16：Real Curriculum Data / Production Readiness / MVP Release |
| 工程状态 | 已实现 16.1～16.4 所需的来源清单、显式 MVP Scope、生产索引、内容/题目覆盖校验、运行时门禁、迁移矩阵、QA 证据和发布门禁 |
| Curriculum 状态 | Golden framework 仍为 `UNVERIFIED`；`npm run curriculum:review` 仍为 `REQUIRES_MANUAL_REVIEW` |
| 生产 Scope | 1 条候选调查项，0 条 `RELEASED` |
| 最终发布决定 | `NOT_READY` |
| 停止点 | PHASE 16.4 完成；不进入 PHASE 17 |

`NOT_READY` 的原因不是把工程校验跳过，而是当前没有可靠地闭环真实教材版次、深圳当学年选用关系、原书版权/目录证据、人工审核记录和正式内容/题目覆盖。工程完成与 MVP 可发布是两个不同结论。

## 2. 阶段拆分

### PHASE 16.1：Real Curriculum Verification & Import

- 建立 `MVP_SCOPE_SZ_PRIMARY_2026_2027`，候选范围仅记录深圳小学三年级数学上册北师大版调查目标；候选不进入正式选择器。
- 建立 `curriculumSourceManifest`，区分历史官方材料、学年上下文、国家目录和待人工核验候选目录。
- 复用 `CurriculumImportPackage`、`importCurriculumPackage`、`CurriculumIntegrityValidator` 和既有 verification state machine。
- 增加稳定 fingerprint、实体级 import diff、重复导入等价性和已审核身份覆盖保护。
- `productionCurriculumIndex` 只从 `RELEASED + REVIEWED + ACTIVE` 记录构建；当前为空。

### PHASE 16.2：Production Learning Content & Question Readiness

- 继续使用既有 `CourseContent`、`ContentBlock`、`Question`、`QuestionKnowledgePoint`、LessonPlayer 和 QuestionEngine，不创建 V2 平行 Domain。
- 内容要求 `REVIEWED + PUBLISHED`，来源要求 `REVIEWED + CLEARED`；题目要求 `REVIEWED + PUBLISHED`、结构合法、映射合法且有覆盖。
- 增加 `ContentCoverageReport`、`QuestionCoverageReport`、媒体版权门禁和 SAMPLE leak scanner。
- 当前正式内容与题目数量均为 0，因为正式 Curriculum Scope 没有 `RELEASED` 条目；SAMPLE / demo 仍仅供开发和测试。

### PHASE 16.3：Full-system QA / Performance / Migration

- 生产模式显式注入 `productionCurriculumIndex`；正式 Curriculum、Lesson Content、Question Repository 和媒体读取不会从全量 SAMPLE 数据回退。
- 生产配置缺失时 fail safe：SAMPLE、未审核内容/题目和 `/dev/*` 均关闭。
- 建立所有当前本地 Storage 的 schemaVersion / 校验 / 损坏回退迁移矩阵，并提供孤儿记录安全恢复 helper。
- Router 对产品和开发页面进行 route-level lazy loading；完成构建、静态检查、回归、响应式、无障碍、Reduced Motion、Console 和安全扫描。

### PHASE 16.4：MVP Release Gate / Final Verification

- `MVPReleaseGate` 汇总 Curriculum、Content、Question、Production Config、Engineering、QA、Regression 和文档检查。
- 门禁只有 `READY`、`READY_WITH_LIMITATIONS`、`NOT_READY` 三种决定；当前为 `NOT_READY`。
- 发布清单和发布报告保留阻断项、版权/隐私边界和后续人工工作，不把候选数据宣称为正式发布。

## 3. 领域边界

```text
Curriculum / Source / Review
        ↓
Production Curriculum Index
        ↓
Lesson Content / Question readiness
        ↓
既有 LessonPlayer / QuestionEngine / MASTERY_V1 / STRATEGY_V1
```

本阶段没有修改 `MASTERY_V1`、`STRATEGY_V1`、`DAILY_PLAN_V1` 或 `PARENT_REPORT_V1` 的语义；没有新增云端、账号、同步、AI 生成、复习排程、Teacher Dashboard 或商业化能力。

## 4. 主要实现

- `src/types/production-readiness.ts`
- `src/config/production.ts`
- `src/data/curriculum/production/`
- `src/services/production-readiness/`
- `scripts/mvp-release.ts`
- `tests/phase16.test.ts`

## 5. 验证命令

最终命令结果以 `MVP_RELEASE_REPORT.md` 为准。`curriculum:review` 预期继续保持 `REQUIRES_MANUAL_REVIEW`，因为 Golden package 仍是待核验框架；发布 Scope 独立由 `release:check` 校验。

```text
npm install
npm run type-check
npm run lint
npm run format:check
npm run test:run
npm run build
npm run curriculum:review
git diff --check
```

## 6. 停止点

PHASE 16 完成后停止。`NOT_READY` 只表示真实课程/版权/人工审核尚未达到发布条件，不授权继续自动扩展产品功能，也不授权进入 PHASE 17。
