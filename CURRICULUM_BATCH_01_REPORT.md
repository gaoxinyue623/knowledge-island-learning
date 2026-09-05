# CURRICULUM DATA BATCH 01 Report

## 文档状态

| 项目 | 值 |
| --- | --- |
| Batch ID | `CURRICULUM_DATA_BATCH_01_SZ_G1_2026_2027` |
| 目标学年 | `2026-2027` |
| 目标范围 | 深圳市 / 小学一年级 / 语文、数学、英语 / 上册、下册 |
| 批次状态 | `REQUIRES_MANUAL_REVIEW` |
| 数据快照日期 | `2026-09-04` |
| Production Index 变化 | `NO` |

本报告只记录 Batch 01 的证据清单、候选结构数据、自动校验结果和人工审核待办。候选数据不等于教材事实；没有任何记录因为本批次而自动进入 `REVIEWED`、`RELEASED` 或 Production Index。

## Scope

本批次严格限定为 `CN-GD-SZ`、小学一年级、2026—2027 学年。目标矩阵固定为 6 个槽位：语文上册、语文下册、数学上册、数学下册、英语上册、英语下册。未将二年级、其他年级或其他地区加入本批次。

## 6-slot Matrix

| 槽位 | 调查状态 | 出版社/教材身份 | 教材存在或目录来源 | 地区选用状态 | 地区选用来源 | Import Package |
| --- | --- | --- | --- | --- | --- | --- |
| 语文上册 | `PARTIAL` | 人民教育出版社；统编/国家统编语文教材；2024 修订候选 | [`PEP-G1-CHINESE-S1-OFFICIAL-PRODUCT`](https://www.pep.com.cn/rjyc/kcjc/gjkc/tbjc/yw1s/)；[`PEP-G1-CHINESE-S1-2024-BIBLIOGRAPHIC`](https://www.hnxhp.cn/news_details/103.html)；候选 ISBN `9787107383007` | `NOT_CONFIRMED` | 无 2026—2027 深圳当前选用证明 | 无 |
| 语文下册 | `PARTIAL` | 人民教育出版社；统编/人教体系；当前版次、ISBN 未知 | `MOE-NATIONAL-CATALOG-2024` 及历史来源；缺同版次原书证据 | `NOT_CONFIRMED` | `SZ-TEXTBOOK-SELECTION-2022-2024`（历史，非当前证明） | 无 |
| 数学上册 | `PARTIAL` | 北京师范大学出版社；2024 修订体系候选；教材识别码 `35524210031`（不是 ISBN） | [`BNUP-G1-MATH-S1-2024-PUBLISHER-CATALOG`](https://bnupg.com/docs/2024-11/b736b96d48884a3391f45c8efd5a1290.pdf)；[`MATH-G1-UPPER-PUBLIC-CANDIDATE`](https://www.renjiaoshe.com/jiaocai/2424.html) | `NOT_CONFIRMED` | 历史材料仅作背景 | `B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE` |
| 数学下册 | `PARTIAL` | 北京师范大学出版社；2024 修订体系候选；ISBN 未知 | [`BNUP-G1-MATH-S2-2024-GOV-CATALOG`](https://www.bnupg.com/docs/2025-01/1d9e44f707ba4f3389d077ef7af12cd4.pdf)；[`MATH-G1-LOWER-PUBLIC-CANDIDATE`](https://www.renjiaoshe.com/jiaocai/2426.html) | `NOT_CONFIRMED` | `SZ-TEXTBOOK-SELECTION-2022-2024`（历史，非当前证明） | `B01_SZ_G1_MATH_S2_BNUP_2024_CANDIDATE` |
| 英语上册 | `PARTIAL` | 上海教育出版社；沪教版（深圳）候选；存在版本变体冲突 | 用户附件候选 + [`SZNS-G1-ENGLISH-S1-HJ-RESOURCE`](https://ziyk.szns.edu.cn/rc/tags/?fid=252729) 本地资源线索 | `NOT_CONFIRMED` | 南山区资源不等于全市当前选用 | 无 |
| 英语下册 | `PARTIAL` | 上海教育出版社；沪教版（深圳）候选；存在版本变体冲突 | 用户附件候选 + [`SZNS-G1-ENGLISH-S2-HJ-RESOURCE`](https://ziyk.szns.edu.cn/rc/tags/?fid=252729) 本地资源线索 | `NOT_CONFIRMED` | `SZ-TEXTBOOK-SELECTION-2022-2024`（历史，非当前证明） | 无 |

### Confirmed Textbooks

无。6 个槽位中没有一个达到 `CONFIRMED`，也没有可进入生产发布的教材身份。

### Partial Textbooks

六个槽位均为 `PARTIAL`。本轮公开证据补充了候选出版社、教材身份、目录/本地资源线索、候选 ISBN 或识别码，但所有槽位仍缺少 2026—2027 深圳当前地区选用与同一原书证据闭环。

### Entity Verification Status

槽位调查状态不是实体生命周期状态。六个槽位虽然均为 `PARTIAL`，所有候选教材实体和两个数学候选包仍保持 `UNVERIFIED`；没有任何实体写入 `VERIFIED`、`REVIEWED` 或 `RELEASED`。英语版本线索尤其不能由“语数英六槽位”反推存在统一正式教材。

### Not Found Slots

无。`NOT_FOUND` 表示当前已完成调查并确认未找到目标教材，而不是暂时缺证据；本批次没有把“未确认”误写成 `NOT_FOUND`。

## Source Summary

Batch 01 六个槽位实际引用的 `SourceReference` 共 **14** 条。教材存在、教材身份、教材目录、本地教育资源、地区选用、国家目录和课程标准分开登记：出版社或公开目录最多证明教材候选存在或目录结构，不能替代深圳当前学年地区选用证明；国家目录和课程标准只作背景依据。

| SourceReference | 证据类型与作用 | 当前状态 |
| --- | --- | --- |
| [`SZ-TEXTBOOK-SELECTION-2022-2024`](https://www.sz.gov.cn/attachment/0/799/799233/8905786.pdf) | `REGIONAL_SELECTION`；深圳历史地区教材选用目录，PDF 第 1 页 | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| [`MOE-NATIONAL-CATALOG-2024`](https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf) | `NATIONAL_CATALOG`；教育部国家课程教材目录，PDF 首页 | `RELIABLE_CONTEXT_ONLY` |
| [`PEP-G1-CHINESE-S1-OFFICIAL-PRODUCT`](https://www.pep.com.cn/rjyc/kcjc/gjkc/tbjc/yw1s/) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；人民教育出版社 2024 修订上册候选产品页 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`PEP-G1-CHINESE-S1-HISTORICAL-PRODUCT`](https://www.pep.com.cn/products/jc/jks/201608/t20160823_1369629.shtml) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；旧版身份和旧 ISBN，带 `EDITION_MISMATCH_WARNING` | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| [`PEP-G1-CHINESE-S1-2024-BIBLIOGRAPHIC`](https://www.hnxhp.cn/news_details/103.html) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY`；2024 秋季公开书目信息，候选 ISBN `9787107383007` | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`BNUP-G1-MATH-S1-2024-PUBLISHER-CATALOG`](https://bnupg.com/docs/2024-11/b736b96d48884a3391f45c8efd5a1290.pdf) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；2024 秋季出版集团价格/目录文件和识别码候选 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`BNUP-G1-MATH-S2-2024-GOV-CATALOG`](https://www.bnupg.com/docs/2025-01/1d9e44f707ba4f3389d077ef7af12cd4.pdf) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；2025 春季公开价格/目录文件 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`MATH-G1-UPPER-PUBLIC-CANDIDATE`](https://www.renjiaoshe.com/jiaocai/2424.html) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；数学上册结构候选 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`MATH-G1-LOWER-PUBLIC-CANDIDATE`](https://www.renjiaoshe.com/jiaocai/2426.html) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；数学下册结构候选 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`MOE-MATH-STANDARD-2022`](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf) | `CURRICULUM_STANDARD`；数学课程标准背景，PDF 首页 | `RELIABLE_CONTEXT_ONLY` |
| [`SZNS-G1-ENGLISH-S1-HJ-RESOURCE`](https://ziyk.szns.edu.cn/rc/tags/?fid=252729) | `LOCAL_EDUCATION_RESOURCE` / `TEXTBOOK_CATALOG`；南山区沪教版课标上册资源线索，带 `EDITION_VARIANT_CONFLICT` | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`SZNS-G1-ENGLISH-S2-HJ-RESOURCE`](https://ziyk.szns.edu.cn/rc/tags/?fid=252729) | `LOCAL_EDUCATION_RESOURCE` / `TEXTBOOK_CATALOG`；南山区沪教版课标下册资源线索，带 `EDITION_VARIANT_CONFLICT` | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| [`GD-LOCAL-ENGLISH-ORAL-2021`](https://edu.gd.gov.cn/attachment/0/477/477361/3730754.pdf) | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY`；广东历史英语口语交际教材线索 | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| `USER-ATTACHMENT-SZ-ENGLISH-2025-2026` | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG`；用户提供的图片候选线索 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |

现有历史/候选来源的 `retrievedAt` 为 `2026-09-03`；本轮补充的 PEP、BNUP、南山区资源和公开书目信息来源（包括 PEP 历史产品页）的 `retrievedAt` 为 `2026-09-04`。没有真实人工 reviewer，因此没有 `verifiedAt`、`verifiedBy` 或 `REVIEWED` 决定。深圳 2026—2027 校历只确认学年时间背景，不构成教材选用关系来源。

### Public Evidence Data Entry

- 语文上册登记人民教育出版社、`统编 / 国家统编语文教材`、`2024 修订`、`2024-07` 和候选 ISBN `9787107383007`。该 ISBN 只由公开书目信息支持，仍需原书版权页核对；历史 PEP 页面中的旧 ISBN `9787107312403` 保留为 `EDITION_MISMATCH_WARNING`，不得覆盖候选 ISBN。
- 数学上下册登记北京师范大学出版社和 `2024 修订体系`候选。数学上册的 `35524210031` 是候选教材识别码，不是 ISBN；数学上下册的 ISBN 均保持未知，不能猜测。
- 英语上下册登记上海教育出版社、`沪教版（深圳）`候选及南山区教育资源平台线索；平台线索不是深圳全市当前选用证明，原书版权页和完整目录仍需核对，并保留 `EDITION_VARIANT_CONFLICT`。
- 所有六个槽位的地区选用证据均保持 `OFFICIAL_SELECTION_REQUIRED`；没有任何候选被写入 `PHYSICAL_BOOK` 已核验状态。

## Candidate Dataset Counts

| 指标 | 数量 |
| --- | ---: |
| Confirmed textbook | 0 |
| Textbook candidate package | 2 |
| Unit | 19 |
| Lesson | 91 |
| KnowledgePoint candidate（去重后） | 11 |
| Reused KnowledgePoint candidate | 3 |
| New KnowledgePoint candidate | 8 |
| LessonKnowledgePoint | 173 |
| KnowledgeRelation | 6 |
| Batch slots | 6 |

数学上册候选包包含 10 个 Unit、43 个 Lesson、7 个 KnowledgePoint、84 条 LessonKnowledgePoint 和 3 条 KnowledgeRelation；数学下册候选包包含 9 个 Unit、48 个 Lesson、7 个 KnowledgePoint、89 条 LessonKnowledgePoint 和 3 条 KnowledgeRelation。复用候选点为跨上下册使用的“比较数量”“辨认常见图形并描述可观察特征”“用数量、图示或算式表达生活问题”；复用不代表已经通过教研去重审核。

本批次没有批量生成 `LearningContent` 或 `Question`，也没有保存教材完整正文、图片或练习册全文。

## Import Packages

| Package | 槽位 | 初始状态 | Import report | Unit | Lesson | KnowledgePoint | Mapping | Relation | Release eligible |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE` | 数学上册 | `UNVERIFIED` | `REQUIRES_MANUAL_REVIEW` | 10 | 43 | 7 | 84 | 3 | `NO` |
| `B01_SZ_G1_MATH_S2_BNUP_2024_CANDIDATE` | 数学下册 | `UNVERIFIED` | `REQUIRES_MANUAL_REVIEW` | 9 | 48 | 7 | 89 | 3 | `NO` |

语文和英语没有在缺少教材身份/目录证据时创建猜测包；这不是把槽位遗漏，而是保留其真实的未闭环状态。两个数学包只包含候选教材结构和原创、去教材化的 KnowledgePoint 定义，不包含正式课程内容或题库。

## Validation

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| Batch manifest / 6-slot matrix | `PASS` | 6 个目标槽位、范围和来源引用完整 |
| CurriculumImportPackage schema | `PASS` | 两个候选包均通过现有 importer schema |
| Import validation | `PASS` | 既有 importer 返回 `success = true` |
| Integrity validation | `PASS` | 层级引用、排序、映射、来源和权重通过 |
| prerequisite DAG | `PASS` | 候选 prerequisite 无循环 |
| Existing import diff | `PASS` | dry-run 报告均为新增候选记录；未执行生产写入 |
| Reviewed overwrite guard | `PASS` | 未覆盖任何 `REVIEWED` 包；候选保持重新审核边界 |
| SAMPLE leak | `PASS` | 候选包不是 SAMPLE，且未进入生产读取索引 |
| Production reviewed-only filter | `PASS` | `productionCurriculumIndex` 仍为空 allow-list |

稳定 fingerprint 复用 PHASE 16 的 `buildCurriculumPackageFingerprint`，包 ID、SourceReference ID 和实体 ID 均为确定性值，没有使用 `Math.random()`。`npm run curriculum:batch -- --dry-run` 与 `npm run curriculum:import -- src/data/curriculum/batch-01/packages/g1-math-s1.ts --dry-run` 均只输出校验/差异结果，脚本明确跳过写入。

## Manual Review Items

### 全部六个槽位

- 核对教材正式名称、出版社、年级、学期、版本/年份和 ISBN（若有）。
- 获取并核对原书封面、版权页、目录页；记录页码、版次和可追溯来源。
- 获取 2026—2027 深圳当前教材选用关系；如全市不统一，进一步记录区级或学校级适用范围。
- 逐项确认 SourceReference 的角色：教材存在/目录来源、地区选用来源、国家目录或课程标准背景。
- 由真实教研 reviewer 核对 Unit、Lesson 顺序和标题，补充 `CurriculumReviewRecord`、`verifiedAt`、`verifiedBy` 和 review note。
- 核对 KnowledgePoint 定义、去重结果、LessonKnowledgePoint 的 `core` / `secondary` / `extended` 角色与权重。
- 核对 KnowledgeRelation 方向、`prerequisite` 语义和 DAG 结果。

### 语文与英语当前阻断

- 语文上册已有 2024 修订版和候选 ISBN 的公开线索，但缺少学期特定的当前版本、原书版权页和深圳选用证据；语文下册仍只有历史地区线索。
- 英语上册尚未确认深圳是否存在统一正式教材；不能从用户图片、历史材料或模型记忆推断。
- 英语下册的上海教育出版社线索来自历史目录、用户候选材料和南山区资源平台，仍缺当前学年、正式版次、ISBN 和地区适用闭环；上下册都保留版本变体冲突。

### 数学候选包

- 将出版集团公开价格/目录文件和公开目录候选逐项与同一版次原书目录比对；数学上册识别码 `35524210031` 不得当作 ISBN，发现目录差异时用新 fingerprint/diff 记录，不覆盖已审核版本。
- 对 11 个候选 KnowledgePoint 完成教研定义和跨上下册复用决策，再决定哪些候选能进入正式知识点 registry。
- 由 reviewer 确认 6 条 KnowledgeRelation 的方向和语义；自动 DAG `PASS` 不等于教研事实已确认。

## Blocking Source Gaps

1. 缺少可证明 2026—2027 学年深圳当前教材选用关系的可靠官方清单。
2. 缺少数学候选对应的原书封面、版权页、目录页、版次和 ISBN 人工核对记录。
3. 缺少一年级语文上册的学期特定选用和版本身份证据。
4. 尚未确认深圳一年级是否存在统一的正式英语教材及对应上册身份。
5. 缺少英语候选的当前学年地区关系、原书身份和版本证据。
6. 缺少真实人工 reviewer、审核时间和逐条审核记录。

## Production Scope Protection

Batch 01 的 manifest、候选包和 SourceReference 仅用于调查、结构验证、dry-run、diff 和开发诊断。`src/data/curriculum/production/mvp-scope.ts` 未增加 Batch 01 条目；`productionCurriculumData` 和 `productionCurriculumIndex` 未增加任何教材、单元、课次或知识点。正式 Onboarding 不会显示这些未审核候选教材。

本批次未修改 `MASTERY_V1`、`STRATEGY_V1`、`DAILY_PLAN_V1` 或 `PARENT_REPORT_V1` 的算法/语义，也未增加新的产品模块。

## Batch Decision

### Batch 01 是否全部 REVIEWED？

**NO。** 0 个槽位 `CONFIRMED`，6 个槽位为 `PARTIAL`，0 个槽位为 `UNVERIFIED`，0 个槽位为 `NOT_FOUND`；0 个教材包 `REVIEWED`。下一步必须补齐当前地区选用、原书身份、目录和人工教研审核，不能把公开候选或自动校验结果当作 `REVIEWED`。

### Production Index 是否增加？

**NO。** 没有真实 `REVIEWED` 且满足发布条件的教材数据，因此 Production Index 继续为空 allow-list。这是预期的 fail-safe 结果，不视为 Batch 01 工程失败。

### Next Boundary

下一动作是完成 Batch 01 人工证据审核；本次不生成 `CURRICULUM DATA BATCH 02 / Shenzhen Grade 2`，不扩展年级/地区，也不进入 PHASE 17。

## Completion Boundary

本批次已完成 6-slot 调查矩阵、证据角色区分、两个数学候选 Import Package、既有 Schema/Integrity/DAG/Diff/Overwrite Guard 接入、候选 KnowledgePoint 审核清单和报告；最终状态保持 `REQUIRES_MANUAL_REVIEW`，到此停止。

## Review 01 Preparation

已生成 `CURRICULUM_BATCH_01_MANUAL_REVIEW.md`、`CURRICULUM_BATCH_01_EVIDENCE_REVIEW.md`、`MANUAL_REVIEW_CHECKLIST.md` 和 `BATCH_01_PHYSICAL_EVIDENCE_REQUEST.md`。它们把六个槽位、公开证据录入、教材身份、地区选用、数学目录 diff、KnowledgePoint、Mapping、Relation、ReviewRecord draft 和原书证据请求拆成可逐项核对的材料；没有填写真实 reviewer / reviewedAt，也没有改变任何 Verification 状态或 Production Index。
