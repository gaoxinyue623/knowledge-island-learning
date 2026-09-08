# MVP Release Report

## Release Scope

| 项目 | 值 |
| --- | --- |
| Scope ID | `MVP_SCOPE_SZ_PRIMARY_2026_2027` |
| Scope status | 1 candidate / 0 released |
| Production index | 空 allow-list |
| Release decision | `NOT_READY` |

## Supported Region

目标调查范围是中国广东省深圳市（`CN-GD-SZ`），有效期为 2026-09-01 至 2027-08-31。当前没有可供生产选择的已发布地区教材关系。

## Supported Grades

候选调查目标为小学三年级。由于没有 `RELEASED` 条目，生产实际开放年级数量为 0。

## Supported Subjects

候选调查目标为数学。语文、数学、英语都没有被伪造为生产可用；正式入口不会把未发布学科回退到 Demo。

## Supported Textbooks

当前只有 `SZ-G3-MATH-UPPER-BNUP-CANDIDATE` 候选目标；它不能证明深圳当前选用关系，也不是已发布的 PEP Golden package。正式教材数量为 0。

## Curriculum Status

| 指标 | 数量/结果 |
| --- | ---: |
| REVIEWED Curriculum / Textbook | 0 |
| REVIEWED Unit | 0 |
| REVIEWED Lesson | 0 |
| REVIEWED KnowledgePoint | 0 |
| SourceReference manifest records | 4 |
| Production-index SourceReference | 0 |
| `npm run curriculum:review` | `REQUIRES_MANUAL_REVIEW` |

现有 Golden framework 仍为 `UNVERIFIED`，没有被擅自改成 `REVIEWED`。

## Content Coverage

正式发布教材为 0，正式 Lesson 为 0，正式 KnowledgePoint 为 0，正式 Content 为 0；coverage gate 为 `FAIL`，原因是 Scope 没有发布条目，不是把 SAMPLE 内容当作覆盖。

## Question Coverage

正式题目为 0，正式题目映射为 0；coverage gate 为 `FAIL`，原因是没有发布 KnowledgePoint。现有 SAMPLE 题目不计入正式数量，也不用于硬凑最低题量。

## Test Result

当前全量回归：161 tests / 14 files PASS。PHASE 16 专项测试覆盖配置 fail-safe、Scope、import diff、reviewed overwrite、地区映射、内容/题目覆盖、SAMPLE leak、正式 LessonPlayer/QuestionEngine 夹具链、迁移矩阵和孤儿恢复。

## Production Guard

`ProductionReadinessValidator`、`productionCurriculumIndex` 和 `MVPReleaseGate` 已实现。生产配置检查通过：所有 SAMPLE/未审核开关和 `devRoutes` 均为 false；Curriculum/Content/Question readiness 因正式范围为空而阻断。

## Responsive QA

生产预览已检查 10 个正式路由 × 6 个视口（375、390、430、768、1024、1440），共 60 组合：导航失败 0、页面级横向溢出 0、页面缺少 h1 0、控制台 warning/error 0。无 Profile 时受保护的孩子端路由按预期回到 `/onboarding`；`/parent` 在全部视口正常渲染。

## Accessibility

检查 heading hierarchy、表单 label、button/radio/checkbox 语义、focus-visible、ARIA、alt text、状态文字和颜色独立性；矩阵中未发现未标注控件或缺失 alt 的可见图片，正式页面无产品级新增无障碍阻断。

## Performance

`npm run build` PASS。主要构建观察：最大公共 JS 约 395.75 kB（gzip 122.63 kB），初始 CSS 约 111.14 kB（gzip 16.50 kB）；产品、家长和开发页面使用 route-level chunks。Vite 报告的 Zod 第三方 annotation 提示未阻断构建，详见 `PERFORMANCE_REPORT.md`。

## Storage Migration

当前各本地 Storage 为 schemaVersion 1，已建立 `STORAGE_MIGRATION_MATRIX.md`，并验证 safe fallback、诊断和 orphan recovery。未新增云端同步或远程迁移。

## Privacy

继续 local-first；没有新增 tracking、账号、认证、云端个人数据上传、消息或同步。ParentReport / Parent Dashboard 仍是只读聚合层，不创建学习事实。

## Copyright Review

当前只登记来源调查和候选目录，不复制教材全文、整页练习或受版权保护解析。由于没有同一版次原书版权页、正式内容/题目授权或逐项原创证明，未确认资源没有进入 production index；版权 gate 未通过。

来源清单见 `CURRICULUM_SOURCE_MANIFEST.md`： [深圳历史教材选用目录](https://www.sz.gov.cn/attachment/0/799/799233/8905786.pdf)、[深圳 2026—2027 学年校历](https://szeb.sz.gov.cn/gkmlpt/content/12/12783/post_12783896.html)、[教育部 2024 国家目录](https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf) 和待人工核验候选页。

## Known Limitations

- 当前没有任何真实 Curriculum `RELEASED` 条目，因此正式 Onboarding / Home / Map / Lesson / Assessment 没有可发布教材可走完整产品链。
- 深圳范围仍是候选调查范围，不代表当前学年全部教材；没有证据就不扩展到 1～6 年级、三学科和上下册。
- 正式 Lesson Content 和 Question 尚未达到生产覆盖。
- `shortAnswer` 仍需要人工审核，不在没有批改能力的正式路径中自动判分。
- 应用继续是 local-first，没有账号、云同步和多设备数据合并。
- SAMPLE / demo 仍保留给开发和测试，但不属于 Release Scope。

## Blocking Issues

1. 没有可证明 2026—2027 深圳地区选用关系的当前官方教材清单。
2. 没有原书版权页/目录页/版次/ISBN 的可靠证据闭环；缺失信息不能猜测。
3. Golden Curriculum、地区映射、Unit/Lesson/KnowledgePoint/Relation 没有人工 `REVIEWED` 记录。
4. 没有对应正式 Lesson Content、版权清理媒体和每个发布 KnowledgePoint 的题目覆盖。
5. 因上述原因 `productionCurriculumIndex` 为空，`MVPReleaseGate` 必须返回 `NOT_READY`。

## Release Decision

**NOT_READY**

PHASE 16 的工程准备工作已完成，但不能宣称 `MVP RELEASED`。完成本阶段后停止，不进入 PHASE 17；后续应先补齐可靠教材来源、人工审核和版权闭环，再重新运行本阶段发布门禁。
