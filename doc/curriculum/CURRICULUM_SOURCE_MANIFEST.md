# Curriculum Source Manifest

## 1. 使用规则

本清单是证据 inventory，不是自动审核结果。可靠来源也可能无法证明当前学年地区选用关系；AI 输出不能单独把任何记录推进到 `REVIEWED`。

生产 `SourceReference` 至少需要：可访问 URL、检索时间、人工核验时间、人工核验人；教材本身还需要版次、目录和版权证据按 scope 逐项闭环。

## 2. 当前来源

| ID | 级别 | 来源 | 能证明什么 | 当前状态 |
| --- | ---: | --- | --- | --- |
| `SZ-TEXTBOOK-SELECTION-2022-2024` | 1 | [深圳市 2022 春—2024 春义务教育阶段免费课本政府选用目录](https://www.sz.gov.cn/attachment/0/799/799233/8905786.pdf) | 深圳历史教材选用背景，覆盖 2022 春至 2024 春 | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| `SZ-SCHOOL-CALENDAR-2026-2027` | 1 | [深圳市教育局 2026—2027 学年校历通知](https://szeb.sz.gov.cn/gkmlpt/content/12/12783/post_12783896.html) | 当前学年时间背景 | `RELIABLE_CONTEXT_ONLY` |
| `MOE-NATIONAL-CATALOG-2024` | 1 | [教育部 2024 年义务教育国家课程教学用书目录](https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf) | 国家目录与出版单位背景 | `RELIABLE_CONTEXT_ONLY` |
| `MATH-G3-UPPER-PUBLIC-CANDIDATE` | 5 | [公开目录候选页](https://www.renjiaoshe.com/jiaocai/2428.html) | 候选目录采集和差异检测 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |

上述来源均登记为 `retrievedAt = 2026-09-03`。当前没有来源登记 `verifiedAt` / `verifiedBy`，因此它们不能独立构成发布证据。候选页的域名和页面内容也不被当作官方教材选用证明。

## 3. 尚缺证据

- 2026—2027 学年深圳地区当前教材选用关系的官方清单。
- 与目标教材 identity 一致的原书封面、版权页、目录页和版次信息。
- ISBN；如果原书没有可靠 ISBN，必须记录缺失原因而不是猜测。
- 人工审核者、审核时间、审核动作和逐项 review note。
- 正式原创/授权内容、图片、音频、视频、字体和插画的版权证明。

## 4. 数据使用边界

来源清单和 Golden package 只用于调查、结构验证、差异检测和开发展示。它们不会自动填充 `productionCurriculumData`，也不会使正式 Onboarding 显示候选教材。

## 5. CURRICULUM DATA BATCH 01：深圳小学一年级

Batch 01 的目标学年为 `2026-2027`，范围是深圳市（`CN-GD-SZ`）小学一年级语文、数学、英语上下册。批次固定维护 6 个槽位；每个槽位都有明确的 `CONFIRMED`、`PARTIAL`、`UNVERIFIED` 或 `NOT_FOUND` 状态。当前结果为：`CONFIRMED = 0`、`PARTIAL = 6`、`UNVERIFIED = 0`、`NOT_FOUND = 0`。这里的槽位调查状态与实体 `VerificationStatus` 分离；六个槽位的候选实体仍为 `UNVERIFIED`。

### 5.1 Six-slot evidence matrix

| 槽位 | 状态 | Textbook existence / structure source | Regional selection status | Regional selection source | 备注 |
| --- | --- | --- | --- | --- | --- |
| 语文上册 | `PARTIAL` | [`PEP-G1-CHINESE-S1-OFFICIAL-PRODUCT`](https://www.pep.com.cn/rjyc/kcjc/gjkc/tbjc/yw1s/)；[`PEP-G1-CHINESE-S1-2024-BIBLIOGRAPHIC`](https://www.hnxhp.cn/news_details/103.html)；候选 ISBN `9787107383007` | `NOT_CONFIRMED` | 无 2026—2027 深圳当前选用证明 | `统编 / 国家统编语文教材`、`2024 修订`、`2024-07` 仅为候选；ISBN 不能替代版权页或当前选用证明 |
| 语文下册 | `PARTIAL` | `MOE-NATIONAL-CATALOG-2024` 及历史 PEP 线索 | `NOT_CONFIRMED` | `SZ-TEXTBOOK-SELECTION-2022-2024`（历史） | `统编 / 人教体系`候选；当前版次、ISBN、同版次原书和当前选用仍缺失 |
| 数学上册 | `PARTIAL` | [`BNUP-G1-MATH-S1-2024-PUBLISHER-CATALOG`](https://bnupg.com/docs/2024-11/b736b96d48884a3391f45c8efd5a1290.pdf)；[`MATH-G1-UPPER-PUBLIC-CANDIDATE`](https://www.renjiaoshe.com/jiaocai/2424.html) | `NOT_CONFIRMED` | 历史材料仅作背景 | `2024 修订体系`候选；识别码 `35524210031` 不是 ISBN；仍需原书和当前选用证据 |
| 数学下册 | `PARTIAL` | [`BNUP-G1-MATH-S2-2024-GOV-CATALOG`](https://www.bnupg.com/docs/2025-01/1d9e44f707ba4f3389d077ef7af12cd4.pdf)；[`MATH-G1-LOWER-PUBLIC-CANDIDATE`](https://www.renjiaoshe.com/jiaocai/2426.html) | `NOT_CONFIRMED` | `SZ-TEXTBOOK-SELECTION-2022-2024`（历史） | `2024 修订体系`候选；ISBN 保持未知；历史选用不能证明 2026—2027 |
| 英语上册 | `PARTIAL` | 用户附件候选；[`SZNS-G1-ENGLISH-S1-HJ-RESOURCE`](https://ziyk.szns.edu.cn/rc/tags/?fid=252729) | `NOT_CONFIRMED` | 南山区本地资源线索，不等于全市当前选用 | 上海教育出版社、`沪教版（深圳）`和本地资源为候选线索；保留 `EDITION_VARIANT_CONFLICT`，不假设全市统一教材 |
| 英语下册 | `PARTIAL` | 用户附件候选；[`SZNS-G1-ENGLISH-S2-HJ-RESOURCE`](https://ziyk.szns.edu.cn/rc/tags/?fid=252729)；广东历史线索 | `NOT_CONFIRMED` | `SZ-TEXTBOOK-SELECTION-2022-2024`（历史） | 上海教育出版社、`沪教版（深圳）`为候选；保留 `EDITION_VARIANT_CONFLICT`，不能证明当前版本 |

### 5.2 Batch 01 source references

本批次六个槽位实际引用 14 条来源；现有历史/候选来源登记 `retrievedAt = 2026-09-03`，本轮补充的 PEP、BNUP、南山区资源和公开书目信息来源（包括 PEP 历史产品页）登记 `retrievedAt = 2026-09-04`；没有登记真实人工 `verifiedAt` / `verifiedBy`。

| ID | 证据等级 | 证据类型 / 角色 | 来源 | 状态 |
| --- | ---: | --- | --- | --- |
| `SZ-TEXTBOOK-SELECTION-2022-2024` | 1 | `REGIONAL_SELECTION` / 深圳历史地区选用 | [深圳市 2022 春—2024 春免费课本政府选用目录](https://www.sz.gov.cn/attachment/0/799/799233/8905786.pdf)，PDF 第 1 页（浏览器 viewer p. 0） | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| `MOE-NATIONAL-CATALOG-2024` | 1 | `NATIONAL_CATALOG` / 国家目录背景 | [教育部 2024 年义务教育国家课程教学用书目录](https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf)，PDF 首页 | `RELIABLE_CONTEXT_ONLY` |
| `PEP-G1-CHINESE-S1-OFFICIAL-PRODUCT` | 1 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` | [人民教育出版社 语文一年级上册官方产品页](https://www.pep.com.cn/rjyc/kcjc/gjkc/tbjc/yw1s/) | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `PEP-G1-CHINESE-S1-HISTORICAL-PRODUCT` | 1 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` / 旧版诊断 | [人民教育出版社历史产品页](https://www.pep.com.cn/products/jc/jks/201608/t20160823_1369629.shtml)；旧 ISBN 保留，带 `EDITION_MISMATCH_WARNING` | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| `PEP-G1-CHINESE-S1-2024-BIBLIOGRAPHIC` | 2 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / 公开书目候选 | [2024 秋季教材生产信息](https://www.hnxhp.cn/news_details/103.html)；候选 ISBN `9787107383007` | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `BNUP-G1-MATH-S1-2024-PUBLISHER-CATALOG` | 2 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` | [BNUP 2024 秋季出版集团价格/目录文件](https://bnupg.com/docs/2024-11/b736b96d48884a3391f45c8efd5a1290.pdf)；识别码候选 | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `BNUP-G1-MATH-S2-2024-GOV-CATALOG` | 2 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` | [BNUP 2025 春季价格/目录文件](https://www.bnupg.com/docs/2025-01/1d9e44f707ba4f3389d077ef7af12cd4.pdf) | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `MATH-G1-UPPER-PUBLIC-CANDIDATE` | 5 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` | [数学一年级上册公开目录候选页](https://www.renjiaoshe.com/jiaocai/2424.html) | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `MATH-G1-LOWER-PUBLIC-CANDIDATE` | 5 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` | [数学一年级下册公开目录候选页](https://www.renjiaoshe.com/jiaocai/2426.html) | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `MOE-MATH-STANDARD-2022` | 1 | `CURRICULUM_STANDARD` / 课程标准背景 | [义务教育数学课程标准（2022 年版）](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf)，PDF 首页 | `RELIABLE_CONTEXT_ONLY` |
| `SZNS-G1-ENGLISH-S1-HJ-RESOURCE` | 1 | `LOCAL_EDUCATION_RESOURCE` / `TEXTBOOK_CATALOG` | [南山区沪教版课标上册资源标签](https://ziyk.szns.edu.cn/rc/tags/?fid=252729)；带 `EDITION_VARIANT_CONFLICT` | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `SZNS-G1-ENGLISH-S2-HJ-RESOURCE` | 1 | `LOCAL_EDUCATION_RESOURCE` / `TEXTBOOK_CATALOG` | [南山区沪教版课标下册资源标签](https://ziyk.szns.edu.cn/rc/tags/?fid=252729)；带 `EDITION_VARIANT_CONFLICT` | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |
| `GD-LOCAL-ENGLISH-ORAL-2021` | 1 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / 广东历史线索 | [广东省地方课程教材审查结果公告（2021）](https://edu.gd.gov.cn/attachment/0/477/477361/3730754.pdf)，PDF 首页 | `RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE` |
| `USER-ATTACHMENT-SZ-ENGLISH-2025-2026` | 4 | `TEXTBOOK_EXISTENCE` / `TEXTBOOK_IDENTITY` / `TEXTBOOK_CATALOG` | 用户提供的深圳低年级英语图片候选线索；当前仓库无独立原始附件 URL | `CANDIDATE_REQUIRES_MANUAL_REVIEW` |

数学两个候选包分别使用 BNUP 公开价格/目录文件和数学公开目录作为结构候选来源，并将国家目录、数学课程标准作为背景来源；这些来源不能替代 2026—2027 深圳当前选用关系。语文和英语在证据没有闭环前不创建猜测教材包。

### 5.3 Batch boundary

Batch 01 的完整矩阵、来源角色、候选包和阻断项见 `CURRICULUM_BATCH_01_REPORT.md`。它们只用于调查、结构校验、diff 和开发诊断，不会自动改变 `MVP_CURRICULUM_SCOPE.md`、`productionCurriculumData` 或 `productionCurriculumIndex`。

## 6. CURRICULUM DATA REVIEW 01 审核准备

Batch 01 已生成 `CURRICULUM_BATCH_01_MANUAL_REVIEW.md`、`CURRICULUM_BATCH_01_EVIDENCE_REVIEW.md`、`MANUAL_REVIEW_CHECKLIST.md` 和 `BATCH_01_PHYSICAL_EVIDENCE_REQUEST.md`。当前没有人工 `verifiedAt` / `verifiedBy`，所有证据决定仍待人工确认；这些文件是 Source / Entity / Field / Claim / Evidence 的盘点，不是 `RELEASE_VERIFIED` 或 `REVIEWED` 结果。当前 Production Index 保持不变。
