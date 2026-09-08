# MANUAL REVIEW CHECKLIST

## 使用说明

这份清单供真实人工审核者逐项勾选。勾选本身不自动改变代码或数据状态；完成后请提供证据文件、审核者身份、时间和 review note，并明确回复“我已经核对”或等价确认。禁止直接把候选包标成 REVIEWED。

## Batch Scope

- [ ] Batch ID：`CURRICULUM_DATA_BATCH_01_SZ_G1_2026_2027`
- [ ] 范围确认为深圳市、小学一年级、2026—2027 学年
- [ ] 六个槽位均被单独处理，没有把历史信息跨学期外推
- [ ] 当前 Production Index 未被候选数据污染

## Slot-by-slot Review

### B01-SZ-G1-CHI-S1：语文上册

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED

### B01-SZ-G1-CHI-S2：语文下册

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED

### B01-SZ-G1-MATH-S1：数学上册

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED

### B01-SZ-G1-MATH-S2：数学下册

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED

### B01-SZ-G1-ENG-S1：英语上册

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED

### B01-SZ-G1-ENG-S2：英语下册

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED


## Final Gate

- [ ] 所有证据来源可追溯到文件/URL、页码和 retrievedAt
- [ ] 没有把历史来源当作当前地区选用证明
- [ ] 没有把 Schema PASS 当作教研审核 PASS
- [ ] 没有把 DAG PASS 当作 prerequisite 教育逻辑 PASS
- [ ] 没有伪造 reviewer 或 verifiedAt
- [ ] 如存在目录、ISBN、KP 或 relation 修正，已保留 before / after / source / reason / reviewStatus
- [ ] 只有真实人工确认后，才按状态机推进 Verification
- [ ] 如仅数学通过，Production Scope 只增加已 REVIEWED 数学，语文/英语仍排除

## Evidence Request Priority

1. B01-SZ-G1-MATH-S1：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的数学教材选用/使用通知
1. B01-SZ-G1-MATH-S2：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的数学教材选用/使用通知
1. B01-SZ-G1-CHI-S1：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的语文教材选用/使用通知
1. B01-SZ-G1-CHI-S2：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的语文教材选用/使用通知
1. B01-SZ-G1-ENG-S1：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的英语教材选用/使用通知；如全市不统一，请明确适用区、学校和生效学年，不创建 city-wide DEFAULT。
1. B01-SZ-G1-ENG-S2：教材封面照片或 PDF 首页；版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）；与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）；2026—2027 深圳市、区级教育局或学校的英语教材选用/使用通知；如全市不统一，请明确适用区、学校和生效学年，不创建 city-wide DEFAULT。
