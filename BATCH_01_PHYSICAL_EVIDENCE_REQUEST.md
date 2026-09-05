# BATCH 01 PHYSICAL EVIDENCE REQUEST

## 用途

本清单请求 Batch 01 六个槽位的原书和当前地区选用证据。它只补充人工审核输入，不会自动改变候选包、VerificationStatus 或 Production Index。

## Submission Rules

- 证据必须能追溯到具体文件、URL、页码和取得日期。
- 封面、版权页和目录页必须来自同一实际原书；无法确认的字段保持 `UNKNOWN`。
- 公开教材存在、国家目录、地方资源平台和历史深圳目录不能单独证明 2026—2027 深圳当前选用。
- 真实人工审核者填写 reviewer、reviewedAt 和 review note 后，才可考虑按状态机从 `UNVERIFIED` 推进到 `VERIFIED`；不得直接推进到 `REVIEWED`。

## Priority

1. B01-SZ-G1-MATH-S1（优先级 1）：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的数学教材选用/使用通知
1. B01-SZ-G1-MATH-S2（优先级 1）：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的数学教材选用/使用通知
1. B01-SZ-G1-CHI-S1（优先级 2）：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的语文教材选用/使用通知
1. B01-SZ-G1-CHI-S2（优先级 2）：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的语文教材选用/使用通知
1. B01-SZ-G1-ENG-S1（优先级 3）：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的英语教材选用/使用通知；如全市不统一，请明确适用区、学校和生效学年，不创建 city-wide DEFAULT。
1. B01-SZ-G1-ENG-S2（优先级 3）：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的英语教材选用/使用通知；如全市不统一，请明确适用区、学校和生效学年，不创建 city-wide DEFAULT。

## Slot Requests

### B01-SZ-G1-CHI-S1：语文上册

| 项目 | 当前候选记录 |
| --- | --- |
| 候选出版社 | 人民教育出版社 |
| 候选教材身份 | 义务教育教科书 语文 一年级上册（2024 修订版候选） |
| 候选系列 | 统编 / 国家统编语文教材 |
| 候选版本 | 2024 修订 |
| 候选出版标识 | 2024-07 |
| 候选 ISBN | 9787107383007 |
| 候选教材识别码 | UNKNOWN |
| 当前实体 VerificationStatus | `UNVERIFIED` |
| 版本诊断 | NONE |

需要提交：

- [ ] 原书封面照片或 PDF 首页
- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）
- [ ] 与封面和版权页属于同一版次的完整目录页
- [ ] 2026—2027 深圳市、区级教育局或学校的语文教材选用/使用证明
- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT

当前阻断：地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。 当前状态：EVIDENCE_MISSING。<br>尚未取得一年级语文上册的学期特定选用和版本身份证据。<br>尚未填写真实人工审核者、审核时间和逐项 review note。<br>当前没有可供 Unit、Lesson、KnowledgePoint、Mapping、Relation 逐项核对的候选包。<br>缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。<br>缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。 当前状态：EVIDENCE_MISSING。<br>缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。<br>需要 ISBN 证据：PUBLIC_CANDIDATE_AVAILABLE。<br>需要同一版次目录证据：PUBLIC_CANDIDATE_AVAILABLE。<br>需要当前地区选用证据：OFFICIAL_SELECTION_REQUIRED。<br>需要教材封面证据：PHYSICAL_BOOK_REQUIRED。<br>需要教材版权页证据：PHYSICAL_BOOK_REQUIRED。

### B01-SZ-G1-CHI-S2：语文下册

| 项目 | 当前候选记录 |
| --- | --- |
| 候选出版社 | 人民教育出版社 |
| 候选教材身份 | UNKNOWN |
| 候选系列 | 统编 / 人教体系 |
| 候选版本 | UNKNOWN |
| 候选出版标识 | UNKNOWN |
| 候选 ISBN | UNKNOWN |
| 候选教材识别码 | UNKNOWN |
| 当前实体 VerificationStatus | `UNVERIFIED` |
| 版本诊断 | NONE |

需要提交：

- [ ] 原书封面照片或 PDF 首页
- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）
- [ ] 与封面和版权页属于同一版次的完整目录页
- [ ] 2026—2027 深圳市、区级教育局或学校的语文教材选用/使用证明
- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT

当前阻断：地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。 当前状态：EVIDENCE_CONFLICT。<br>尚未取得可与候选目录对应的原书版权页和完整目录证据。<br>尚未填写真实人工审核者、审核时间和逐项 review note。<br>当前没有可供 Unit、Lesson、KnowledgePoint、Mapping、Relation 逐项核对的候选包。<br>缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。<br>缺少 ISBN；需要从版权页或封底核对，不能猜测。 当前状态：EVIDENCE_MISSING。<br>缺少与同一版次原书目录逐项对照的证据。 当前状态：EVIDENCE_MISSING。<br>缺少可与候选材料对应的正式教材身份和原书证据。 当前状态：EVIDENCE_MISSING。<br>缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。 当前状态：EVIDENCE_CONFLICT。<br>缺少同一原书版次/出版或修订年份的核对记录。 当前状态：EVIDENCE_MISSING。<br>缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。<br>需要 ISBN 证据：PHYSICAL_BOOK_REQUIRED。<br>需要同一版次目录证据：PHYSICAL_BOOK_REQUIRED。<br>需要当前地区选用证据：OFFICIAL_SELECTION_REQUIRED。<br>需要教材封面证据：PHYSICAL_BOOK_REQUIRED。<br>需要教材版权页证据：PHYSICAL_BOOK_REQUIRED。

### B01-SZ-G1-MATH-S1：数学上册

| 项目 | 当前候选记录 |
| --- | --- |
| 候选出版社 | 北京师范大学出版社 |
| 候选教材身份 | 小学数学北师大版（2024）一年级上册（候选） |
| 候选系列 | UNKNOWN |
| 候选版本 | 2024 修订体系 |
| 候选出版标识 | UNKNOWN |
| 候选 ISBN | UNKNOWN |
| 候选教材识别码 | 35524210031 |
| 当前实体 VerificationStatus | `UNVERIFIED` |
| 版本诊断 | NONE |

需要提交：

- [ ] 原书封面照片或 PDF 首页
- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）
- [ ] 与封面和版权页属于同一版次的完整目录页
- [ ] 2026—2027 深圳市、区级教育局或学校的数学教材选用/使用证明
- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT

当前阻断：地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。 当前状态：EVIDENCE_MISSING。<br>尚未取得可与候选目录对应的原书版权页和完整目录证据。<br>尚未填写真实人工审核者、审核时间和逐项 review note。<br>缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。<br>缺少 ISBN；需要从版权页或封底核对，不能猜测。 当前状态：EVIDENCE_MISSING。<br>缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。 当前状态：EVIDENCE_MISSING。<br>缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。<br>需要 ISBN 证据：PHYSICAL_BOOK_REQUIRED。<br>需要同一版次目录证据：PUBLIC_CANDIDATE_AVAILABLE。<br>需要当前地区选用证据：OFFICIAL_SELECTION_REQUIRED。<br>需要教材封面证据：PHYSICAL_BOOK_REQUIRED。<br>需要教材版权页证据：PHYSICAL_BOOK_REQUIRED。

### B01-SZ-G1-MATH-S2：数学下册

| 项目 | 当前候选记录 |
| --- | --- |
| 候选出版社 | 北京师范大学出版社 |
| 候选教材身份 | 小学数学北师大版（2024）一年级下册（候选） |
| 候选系列 | UNKNOWN |
| 候选版本 | 2024 修订体系 |
| 候选出版标识 | UNKNOWN |
| 候选 ISBN | UNKNOWN |
| 候选教材识别码 | UNKNOWN |
| 当前实体 VerificationStatus | `UNVERIFIED` |
| 版本诊断 | NONE |

需要提交：

- [ ] 原书封面照片或 PDF 首页
- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）
- [ ] 与封面和版权页属于同一版次的完整目录页
- [ ] 2026—2027 深圳市、区级教育局或学校的数学教材选用/使用证明
- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT

当前阻断：地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。 当前状态：EVIDENCE_CONFLICT。<br>尚未取得可与候选目录对应的原书版权页和完整目录证据。<br>尚未填写真实人工审核者、审核时间和逐项 review note。<br>缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。<br>缺少 ISBN；需要从版权页或封底核对，不能猜测。 当前状态：EVIDENCE_MISSING。<br>缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。 当前状态：EVIDENCE_CONFLICT。<br>缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。<br>需要 ISBN 证据：PHYSICAL_BOOK_REQUIRED。<br>需要同一版次目录证据：PUBLIC_CANDIDATE_AVAILABLE。<br>需要当前地区选用证据：OFFICIAL_SELECTION_REQUIRED。<br>需要教材封面证据：PHYSICAL_BOOK_REQUIRED。<br>需要教材版权页证据：PHYSICAL_BOOK_REQUIRED。

### B01-SZ-G1-ENG-S1：英语上册

| 项目 | 当前候选记录 |
| --- | --- |
| 候选出版社 | 上海教育出版社 |
| 候选教材身份 | 英语口语交际 一年级上册（沪教版深圳候选） |
| 候选系列 | 沪教版（深圳） |
| 候选版本 | 2025 秋深圳版候选 |
| 候选出版标识 | 2025 秋（图片标识） |
| 候选 ISBN | UNKNOWN |
| 候选教材识别码 | UNKNOWN |
| 当前实体 VerificationStatus | `UNVERIFIED` |
| 版本诊断 | EDITION_VARIANT_CONFLICT |

需要提交：

- [ ] 原书封面照片或 PDF 首页
- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）
- [ ] 与封面和版权页属于同一版次的完整目录页
- [ ] 2026—2027 深圳市、区级教育局或学校的英语教材选用/使用证明
- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT

当前阻断：地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。 当前状态：EVIDENCE_MISSING。<br>尚未填写真实人工审核者、审核时间和逐项 review note。<br>尚未确认深圳一年级是否存在统一的正式英语教材及对应上册身份。<br>当前没有可供 Unit、Lesson、KnowledgePoint、Mapping、Relation 逐项核对的候选包。<br>缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。<br>缺少 ISBN；需要从版权页或封底核对，不能猜测。 当前状态：EVIDENCE_MISSING。<br>缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。 当前状态：EVIDENCE_MISSING。<br>缺少同一原书版次/出版或修订年份的核对记录。 当前状态：EVIDENCE_MISSING。<br>缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。<br>需要 ISBN 证据：PHYSICAL_BOOK_REQUIRED。<br>需要同一版次目录证据：PUBLIC_CANDIDATE_AVAILABLE。<br>需要当前地区选用证据：OFFICIAL_SELECTION_REQUIRED。<br>需要教材封面证据：PHYSICAL_BOOK_REQUIRED。<br>需要教材版权页证据：PHYSICAL_BOOK_REQUIRED。

### B01-SZ-G1-ENG-S2：英语下册

| 项目 | 当前候选记录 |
| --- | --- |
| 候选出版社 | 上海教育出版社 |
| 候选教材身份 | 英语口语交际 一年级下册（沪教版深圳候选） |
| 候选系列 | 沪教版（深圳） |
| 候选版本 | 2026 新版候选 |
| 候选出版标识 | 2026 春（图片标识） |
| 候选 ISBN | UNKNOWN |
| 候选教材识别码 | UNKNOWN |
| 当前实体 VerificationStatus | `UNVERIFIED` |
| 版本诊断 | EDITION_VARIANT_CONFLICT |

需要提交：

- [ ] 原书封面照片或 PDF 首页
- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）
- [ ] 与封面和版权页属于同一版次的完整目录页
- [ ] 2026—2027 深圳市、区级教育局或学校的英语教材选用/使用证明
- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT

当前阻断：地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。 当前状态：EVIDENCE_CONFLICT。<br>尚未取得可与候选目录对应的原书版权页和完整目录证据。<br>尚未填写真实人工审核者、审核时间和逐项 review note。<br>当前没有可供 Unit、Lesson、KnowledgePoint、Mapping、Relation 逐项核对的候选包。<br>缺少 2026—2027 学年深圳当前教材选用关系的可靠官方清单。<br>缺少 ISBN；需要从版权页或封底核对，不能猜测。 当前状态：EVIDENCE_MISSING。<br>缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。 当前状态：EVIDENCE_CONFLICT。<br>缺少同一原书版次/出版或修订年份的核对记录。 当前状态：EVIDENCE_MISSING。<br>缺少对应原书封面、版权页、目录页、版次和 ISBN 的人工核对记录。<br>需要 ISBN 证据：PHYSICAL_BOOK_REQUIRED。<br>需要同一版次目录证据：PUBLIC_CANDIDATE_AVAILABLE。<br>需要当前地区选用证据：OFFICIAL_SELECTION_REQUIRED。<br>需要教材封面证据：PHYSICAL_BOOK_REQUIRED。<br>需要教材版权页证据：PHYSICAL_BOOK_REQUIRED。

## Production Boundary

- Production eligible textbooks：NONE
- Production Index：`UNCHANGED`
- Grade 2 / PHASE 17：NO
