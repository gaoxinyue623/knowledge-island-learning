# 知识岛 MVP 课程占位结构

> 本文档定义三年级上册语文、数学、英语的 MVP 课程骨架及地区教材选择占位结构，并记录 PHASE 6 导入 / 核验、PHASE 7 LearningMap、PHASE 8 LessonPlayer、PHASE 9 Question Engine、PHASE 10 Mastery 与 PHASE 11 Learning Strategy 消费边界。当前没有可靠教材来源，因此本文不提供真实地区、出版社、单元名、课文、教材正文、例题或生产题目答案；所有课程记录均为演示占位，不能进入学生端发布集合。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 11.4：Learning Strategy（继承 PHASE 2.2、PHASE 6～10） |
| 状态 | 占位结构、导入验证边界、Golden Sample Framework、地图 / LessonPlayer / Question Engine 消费边界、LearningEvidence、Mastery Demo 与 Strategy Demo 边界已实现并验证；真实课程仍未核验 |
| 上游事实源 | `PRODUCT.md`、`CURRICULUM.md`、`DATA_MODEL.md` |
| MVP 范围 | 三年级上册；语文、数学、英语；每科 1 个单元 |
| 课程内容状态 | 未建立真实教材内容 |
| 示例约束 | 所有 `SAMPLE_*` 记录均为 `isSample: true`、`needsVerification: true` |
| 数据目录 | `src/data/curriculum/sample/` 与 `src/data/curriculum/verified/`（物理隔离；legacy 实体目录为兼容入口） |

---

## 1. MVP 范围与禁止推断

### 1.1 已继承的范围

- 每个学科选择三年级上册的一个单元。
- 每个单元规划 3～5 个知识点；本结构示例使用 4 个占位知识点。
- 每个知识点预留 1 个教学关、1 个练习关、1 个挑战关。
- 课程结构使用 `Grade → Semester → Subject → TextbookVersion → Unit → Lesson ↔ KnowledgePoint`。
- 题目、内容、地图节点和审核记录通过 ID 与关系表连接。

### 1.2 当前禁止的推断

- `SAMPLE_CHINESE_UNIT`、`SAMPLE_MATH_UNIT` 和 `SAMPLE_ENGLISH_UNIT` 不是任何真实教材单元。
- “示例知识点 01”至“示例知识点 04”不代表真实课程目录。
- `publisherId`、`editionYear: 待核验` 和地区教材关系不能被替换成模型记忆中的值；地区适用性不得写入教材版本的字符串字段。
- 占位结构中的 `TEXTBOOK` 计划槽位不能被理解为已取得教材授权或已完成教材核验。
- 不在本阶段生成教材原文、课文、教材页码、真实例题或答案。

---

## 2. 占位教材版本

每个学科暂设两个独立的教材版本占位记录，用来覆盖唯一默认、多版本和需要人工确认的分支。三科版本不默认相同，具体出版社、版本名、年份、课程标准和地区适用关系均待核验。

| 学科 | `id` | `publisherId` | `subjectId` | `gradeId` | `semesterId` | `versionName` |
| --- | --- | --- | --- | --- | --- | --- |
| 语文 | `SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A` | `SAMPLE_PUBLISHER_A` | `SAMPLE_SUBJECT_CHINESE` | `SAMPLE_GRADE_3` | `SAMPLE_SEMESTER_UPPER` | 示例语文版本 A（待核验） |
| 语文 | `SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_B` | `SAMPLE_PUBLISHER_B` | `SAMPLE_SUBJECT_CHINESE` | `SAMPLE_GRADE_3` | `SAMPLE_SEMESTER_UPPER` | 示例语文版本 B（待核验） |
| 数学 | `SAMPLE_MATH_TEXTBOOK_G3_UPPER_A` | `SAMPLE_PUBLISHER_A` | `SAMPLE_SUBJECT_MATH` | `SAMPLE_GRADE_3` | `SAMPLE_SEMESTER_UPPER` | 示例数学版本 A（待核验） |
| 数学 | `SAMPLE_MATH_TEXTBOOK_G3_UPPER_B` | `SAMPLE_PUBLISHER_B` | `SAMPLE_SUBJECT_MATH` | `SAMPLE_GRADE_3` | `SAMPLE_SEMESTER_UPPER` | 示例数学版本 B（待核验） |
| 英语 | `SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A` | `SAMPLE_PUBLISHER_C` | `SAMPLE_SUBJECT_ENGLISH` | `SAMPLE_GRADE_3` | `SAMPLE_SEMESTER_UPPER` | 示例英语版本 A（待核验） |
| 英语 | `SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_B` | `SAMPLE_PUBLISHER_A` | `SAMPLE_SUBJECT_ENGLISH` | `SAMPLE_GRADE_3` | `SAMPLE_SEMESTER_UPPER` | 示例英语版本 B（待核验） |

以上每条记录的 `editionYear`、`curriculumStandard` 均为待核验，`sourceId` 为 `SAMPLE_SOURCE_UNVERIFIED`，`status` 为 `DRAFT`，并带 `needsVerification: true`、`isSample: true`。

### 2.1 占位地区

`SAMPLE_REGION_A`、`SAMPLE_REGION_B` 和 `SAMPLE_REGION_C` 只用于验证地区选择字段，不表示任何真实行政地区或真实教材适用范围。C 没有关系记录，用于验证地区暂未支持状态：

```text
id: SAMPLE_REGION_A | SAMPLE_REGION_B | SAMPLE_REGION_C
code: SAMPLE_A | SAMPLE_B | SAMPLE_C
name: 示例地区 A | 示例地区 B | 示例地区 C（暂未支持）
parentRegionId: null
level: PROVINCE
status: ACTIVE
isSample: true
needsVerification: true
```

这里的 `isSample` 和 `needsVerification` 是本文件的占位夹具标记；`Region` 的正式持久化字段仍以 `DATA_MODEL.md` 为准，地区本身不承载教材关系。

### 2.2 占位出版社

以下出版社记录只用于验证三科可以分别引用不同出版社；名称均为占位值：

| `id` | `name` | `shortName` | `officialName` | `status` | `sourceId` | `needsVerification` | `isSample` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SAMPLE_PUBLISHER_A` | 示例出版社 A | 示例 A | 示例出版社 A（待核验） | `DRAFT` | `SAMPLE_SOURCE_UNVERIFIED` | `true` | `true` |
| `SAMPLE_PUBLISHER_B` | 示例出版社 B | 示例 B | 示例出版社 B（待核验） | `DRAFT` | `SAMPLE_SOURCE_UNVERIFIED` | `true` | `true` |
| `SAMPLE_PUBLISHER_C` | 示例出版社 C | 示例 C | 示例出版社 C（待核验） | `DRAFT` | `SAMPLE_SOURCE_UNVERIFIED` | `true` | `true` |

### 2.3 占位地区教材关系

以下关系只验证 `RegionTextbookRelation` 的字段形状，不表示任何真实地区对应这些教材。PHASE 5 Mock Adapter 可以在开发模式读取等价 SAMPLE fixtures 验证解析分支；这些关系不能进入生产解析器：

| `id` | `regionId` | `textbookVersionId` | `usageType` | `effectiveFrom` | `effectiveTo` | `sourceId` | `status` | `needsVerification` | `isSample` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SAMPLE_REGION_TEXTBOOK_RELATION_A_CHINESE` | `SAMPLE_REGION_A` | `SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A` | `DEFAULT` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_A_MATH` | `SAMPLE_REGION_A` | `SAMPLE_MATH_TEXTBOOK_G3_UPPER_A` | `DEFAULT` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_A_ENGLISH` | `SAMPLE_REGION_A` | `SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A` | `DEFAULT` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_B_CHINESE` | `SAMPLE_REGION_B` | `SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_B` | `DEFAULT` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_B_MATH_DEFAULT` | `SAMPLE_REGION_B` | `SAMPLE_MATH_TEXTBOOK_G3_UPPER_A` | `DEFAULT` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_B_MATH_OPTIONAL` | `SAMPLE_REGION_B` | `SAMPLE_MATH_TEXTBOOK_G3_UPPER_B` | `OPTIONAL` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_B_ENGLISH_SUPPORTED_A` | `SAMPLE_REGION_B` | `SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A` | `SUPPORTED` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |
| `SAMPLE_REGION_TEXTBOOK_RELATION_B_ENGLISH_SUPPORTED_B` | `SAMPLE_REGION_B` | `SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_B` | `SUPPORTED` | 2020-01-01 | null | `SAMPLE_SOURCE_UNVERIFIED` | `DRAFT` | `true` | `true` |

关系中的 `DEFAULT` 只是协议占位值，不是对真实地区默认教材的判断。所有关系都必须保持 `DRAFT`，不得被当作生产映射。

### 2.4 占位来源

`SAMPLE_SOURCE_UNVERIFIED` 只能表示“该条记录需要真实来源补充”，不是一个可证明教材事实的来源。它不能填写成“AI 知道”，也不能通过它满足发布门槛。

### 2.5 占位首次选课

占位流程只用于验证三科独立字段：

```text
SAMPLE_REGION_A
  ↓ SAMPLE_GRADE_3 + SAMPLE_SEMESTER_UPPER
resolveAvailableTextbooks（当前因关系为 DRAFT，不产生生产候选）
  ↓
语文：SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A
数学：SAMPLE_MATH_TEXTBOOK_G3_UPPER_A
英语：SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A
  ↓
StudentCurriculumProfile（每科单独保存，待学生确认）
```

该流程不表示系统已经实现，也不表示三个样例版本真的适用于同一地区。

---

## 3. 占位单元

| 学科 | `unitId` | 占位标题 | `textbookVersionId` | 状态 |
| --- | --- | --- | --- | --- |
| 语文 | `SAMPLE_CHINESE_UNIT` | 示例语文单元 01（待教材确认） | `SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A` | `DRAFT` |
| 数学 | `SAMPLE_MATH_UNIT` | 示例数学单元 01（待教材确认） | `SAMPLE_MATH_TEXTBOOK_G3_UPPER_A` | `DRAFT` |
| 英语 | `SAMPLE_ENGLISH_UNIT` | 示例英语单元 01（待教材确认） | `SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A` | `DRAFT` |

每条占位单元记录必须包含：

```text
isSample: true
needsVerification: true
sourceId: SAMPLE_SOURCE_UNVERIFIED
status: DRAFT
```

地图可以为占位单元配置场景键，但场景键只是 UI 主题，如 `sample-math-world`，不能被当作真实教材单元名称。

---

## 4. 占位课次与知识点

每个学科使用 3 个占位课次和 4 个占位知识点，用于验证多对多关系。名称中的“待命名”表示没有经过教材核验。

### 4.1 语文

课次：

| `lessonId` | `title` | `sortOrder` |
| --- | --- | --- |
| `SAMPLE_CHINESE_LESSON_01` | 示例语文课次 01（待命名） | 1 |
| `SAMPLE_CHINESE_LESSON_02` | 示例语文课次 02（待命名） | 2 |
| `SAMPLE_CHINESE_LESSON_03` | 示例语文课次 03（待命名） | 3 |

知识点：

| `knowledgePointId` | `code` | `name` | `abilityTags` |
| --- | --- | --- | --- |
| `SAMPLE_CHINESE_KP_01` | `SAMPLE_CHINESE_KP_01` | 示例语文知识点 01（待命名） | `reading`, `sample` |
| `SAMPLE_CHINESE_KP_02` | `SAMPLE_CHINESE_KP_02` | 示例语文知识点 02（待命名） | `language`, `sample` |
| `SAMPLE_CHINESE_KP_03` | `SAMPLE_CHINESE_KP_03` | 示例语文知识点 03（待命名） | `expression`, `sample` |
| `SAMPLE_CHINESE_KP_04` | `SAMPLE_CHINESE_KP_04` | 示例语文知识点 04（待命名） | `accumulation`, `sample` |

### 4.2 数学

课次：

| `lessonId` | `title` | `sortOrder` |
| --- | --- | --- |
| `SAMPLE_MATH_LESSON_01` | 示例数学课次 01（待命名） | 1 |
| `SAMPLE_MATH_LESSON_02` | 示例数学课次 02（待命名） | 2 |
| `SAMPLE_MATH_LESSON_03` | 示例数学课次 03（待命名） | 3 |

知识点：

| `knowledgePointId` | `code` | `name` | `abilityTags` |
| --- | --- | --- | --- |
| `SAMPLE_MATH_KP_01` | `SAMPLE_MATH_KP_01` | 示例数学知识点 01（待命名） | `number`, `sample` |
| `SAMPLE_MATH_KP_02` | `SAMPLE_MATH_KP_02` | 示例数学知识点 02（待命名） | `calculation`, `sample` |
| `SAMPLE_MATH_KP_03` | `SAMPLE_MATH_KP_03` | 示例数学知识点 03（待命名） | `reasoning`, `sample` |
| `SAMPLE_MATH_KP_04` | `SAMPLE_MATH_KP_04` | 示例数学知识点 04（待命名） | `application`, `sample` |

### 4.3 英语

课次：

| `lessonId` | `title` | `sortOrder` |
| --- | --- | --- |
| `SAMPLE_ENGLISH_LESSON_01` | 示例英语课次 01（待命名） | 1 |
| `SAMPLE_ENGLISH_LESSON_02` | 示例英语课次 02（待命名） | 2 |
| `SAMPLE_ENGLISH_LESSON_03` | 示例英语课次 03（待命名） | 3 |

知识点：

| `knowledgePointId` | `code` | `name` | `abilityTags` |
| --- | --- | --- | --- |
| `SAMPLE_ENGLISH_KP_01` | `SAMPLE_ENGLISH_KP_01` | 示例英语知识点 01（待命名） | `vocabulary`, `sample` |
| `SAMPLE_ENGLISH_KP_02` | `SAMPLE_ENGLISH_KP_02` | 示例英语知识点 02（待命名） | `listening`, `sample` |
| `SAMPLE_ENGLISH_KP_03` | `SAMPLE_ENGLISH_KP_03` | 示例英语知识点 03（待命名） | `sentence`, `sample` |
| `SAMPLE_ENGLISH_KP_04` | `SAMPLE_ENGLISH_KP_04` | 示例英语知识点 04（待命名） | `reading`, `sample` |

上述知识点只用于验证字段和关系，不代表三科真实课程内容。每条知识点记录还必须携带 `subjectId`、`gradeScope: { minGrade: 3, maxGrade: 3, explicitGradeIds: ["SAMPLE_GRADE_3"] }`、占位学习目标、`status: DRAFT`、`sourceId: SAMPLE_SOURCE_UNVERIFIED`、`needsVerification: true` 和 `isSample: true`。

---

## 5. LessonKnowledgePointRelation 占位关系

以下关系刻意让同一个知识点跨多个课次，证明模型不是一对一或死板的一对多。所有行均为样例关系。

### 5.1 语文关系

| `lessonId` | `knowledgePointId` | `relationType` | `order` | `isPrimary` |
| --- | --- | --- | ---: | --- |
| `SAMPLE_CHINESE_LESSON_01` | `SAMPLE_CHINESE_KP_01` | `CORE` | 1 | `true` |
| `SAMPLE_CHINESE_LESSON_01` | `SAMPLE_CHINESE_KP_02` | `CORE` | 2 | `false` |
| `SAMPLE_CHINESE_LESSON_02` | `SAMPLE_CHINESE_KP_02` | `CORE` | 1 | `true` |
| `SAMPLE_CHINESE_LESSON_02` | `SAMPLE_CHINESE_KP_03` | `RELATED` | 2 | `false` |
| `SAMPLE_CHINESE_LESSON_02` | `SAMPLE_CHINESE_KP_01` | `REVIEW` | 3 | `false` |
| `SAMPLE_CHINESE_LESSON_03` | `SAMPLE_CHINESE_KP_03` | `CORE` | 1 | `true` |
| `SAMPLE_CHINESE_LESSON_03` | `SAMPLE_CHINESE_KP_04` | `EXTENSION` | 2 | `false` |
| `SAMPLE_CHINESE_LESSON_03` | `SAMPLE_CHINESE_KP_02` | `REVIEW` | 3 | `false` |

### 5.2 数学关系

| `lessonId` | `knowledgePointId` | `relationType` | `order` | `isPrimary` |
| --- | --- | --- | ---: | --- |
| `SAMPLE_MATH_LESSON_01` | `SAMPLE_MATH_KP_01` | `CORE` | 1 | `true` |
| `SAMPLE_MATH_LESSON_01` | `SAMPLE_MATH_KP_02` | `CORE` | 2 | `false` |
| `SAMPLE_MATH_LESSON_02` | `SAMPLE_MATH_KP_02` | `CORE` | 1 | `true` |
| `SAMPLE_MATH_LESSON_02` | `SAMPLE_MATH_KP_03` | `RELATED` | 2 | `false` |
| `SAMPLE_MATH_LESSON_02` | `SAMPLE_MATH_KP_01` | `REVIEW` | 3 | `false` |
| `SAMPLE_MATH_LESSON_03` | `SAMPLE_MATH_KP_03` | `CORE` | 1 | `true` |
| `SAMPLE_MATH_LESSON_03` | `SAMPLE_MATH_KP_04` | `EXTENSION` | 2 | `false` |
| `SAMPLE_MATH_LESSON_03` | `SAMPLE_MATH_KP_02` | `REVIEW` | 3 | `false` |

### 5.3 英语关系

| `lessonId` | `knowledgePointId` | `relationType` | `order` | `isPrimary` |
| --- | --- | --- | ---: | --- |
| `SAMPLE_ENGLISH_LESSON_01` | `SAMPLE_ENGLISH_KP_01` | `CORE` | 1 | `true` |
| `SAMPLE_ENGLISH_LESSON_01` | `SAMPLE_ENGLISH_KP_02` | `CORE` | 2 | `false` |
| `SAMPLE_ENGLISH_LESSON_02` | `SAMPLE_ENGLISH_KP_02` | `CORE` | 1 | `true` |
| `SAMPLE_ENGLISH_LESSON_02` | `SAMPLE_ENGLISH_KP_03` | `RELATED` | 2 | `false` |
| `SAMPLE_ENGLISH_LESSON_02` | `SAMPLE_ENGLISH_KP_01` | `REVIEW` | 3 | `false` |
| `SAMPLE_ENGLISH_LESSON_03` | `SAMPLE_ENGLISH_KP_03` | `CORE` | 1 | `true` |
| `SAMPLE_ENGLISH_LESSON_03` | `SAMPLE_ENGLISH_KP_04` | `EXTENSION` | 2 | `false` |
| `SAMPLE_ENGLISH_LESSON_03` | `SAMPLE_ENGLISH_KP_02` | `REVIEW` | 3 | `false` |

关系类型仍然遵循 `CORE`、`RELATED`、`REVIEW`、`EXTENSION`。这些关系没有教材事实效力，待真实来源确认后才能替换或删除。

---

## 6. 知识前置关系占位

每科暂用相同的结构化前置链，仅用于验证 `KnowledgePrerequisite` 的字段和无环校验：

```text
SAMPLE_*_KP_01
  ↓ REQUIRED
SAMPLE_*_KP_02
  ↓ REQUIRED
SAMPLE_*_KP_03
  ↓ RECOMMENDED
SAMPLE_*_KP_04
```

这里的星号表示语文、数学或英语对应前缀。该链不是任何真实学科的教学结论；所有记录必须是 `DRAFT`、`isSample: true`、`needsVerification: true`。发布前必须由教研负责人重新确认，且导入校验不能接受任何循环。

---

## 7. 每个知识点的关卡槽位

每个知识点预留三类节点。以数学知识点 01 为例，其他学科和知识点按同一结构生成占位 ID：

| 节点 | 占位 ID | `nodeType` | 关联知识点 | 状态 |
| --- | --- | --- | --- | --- |
| 教学关 | `SAMPLE_MATH_NODE_KP_01_LESSON` | `LESSON` | `SAMPLE_MATH_KP_01` | `DRAFT` |
| 练习关 | `SAMPLE_MATH_NODE_KP_01_PRACTICE` | `PRACTICE` | `SAMPLE_MATH_KP_01` | `DRAFT` |
| 挑战关 | `SAMPLE_MATH_NODE_KP_01_CHALLENGE` | `CHALLENGE` | `SAMPLE_MATH_KP_01` | `DRAFT` |

### 7.1 三科完整槽位矩阵

| 学科 | 知识点 | 教学关 | 练习关 | 挑战关 |
| --- | --- | --- | --- | --- |
| 语文 | `SAMPLE_CHINESE_KP_01` | `SAMPLE_CHINESE_NODE_KP_01_LESSON` | `SAMPLE_CHINESE_NODE_KP_01_PRACTICE` | `SAMPLE_CHINESE_NODE_KP_01_CHALLENGE` |
| 语文 | `SAMPLE_CHINESE_KP_02` | `SAMPLE_CHINESE_NODE_KP_02_LESSON` | `SAMPLE_CHINESE_NODE_KP_02_PRACTICE` | `SAMPLE_CHINESE_NODE_KP_02_CHALLENGE` |
| 语文 | `SAMPLE_CHINESE_KP_03` | `SAMPLE_CHINESE_NODE_KP_03_LESSON` | `SAMPLE_CHINESE_NODE_KP_03_PRACTICE` | `SAMPLE_CHINESE_NODE_KP_03_CHALLENGE` |
| 语文 | `SAMPLE_CHINESE_KP_04` | `SAMPLE_CHINESE_NODE_KP_04_LESSON` | `SAMPLE_CHINESE_NODE_KP_04_PRACTICE` | `SAMPLE_CHINESE_NODE_KP_04_CHALLENGE` |
| 数学 | `SAMPLE_MATH_KP_01` | `SAMPLE_MATH_NODE_KP_01_LESSON` | `SAMPLE_MATH_NODE_KP_01_PRACTICE` | `SAMPLE_MATH_NODE_KP_01_CHALLENGE` |
| 数学 | `SAMPLE_MATH_KP_02` | `SAMPLE_MATH_NODE_KP_02_LESSON` | `SAMPLE_MATH_NODE_KP_02_PRACTICE` | `SAMPLE_MATH_NODE_KP_02_CHALLENGE` |
| 数学 | `SAMPLE_MATH_KP_03` | `SAMPLE_MATH_NODE_KP_03_LESSON` | `SAMPLE_MATH_NODE_KP_03_PRACTICE` | `SAMPLE_MATH_NODE_KP_03_CHALLENGE` |
| 数学 | `SAMPLE_MATH_KP_04` | `SAMPLE_MATH_NODE_KP_04_LESSON` | `SAMPLE_MATH_NODE_KP_04_PRACTICE` | `SAMPLE_MATH_NODE_KP_04_CHALLENGE` |
| 英语 | `SAMPLE_ENGLISH_KP_01` | `SAMPLE_ENGLISH_NODE_KP_01_LESSON` | `SAMPLE_ENGLISH_NODE_KP_01_PRACTICE` | `SAMPLE_ENGLISH_NODE_KP_01_CHALLENGE` |
| 英语 | `SAMPLE_ENGLISH_KP_02` | `SAMPLE_ENGLISH_NODE_KP_02_LESSON` | `SAMPLE_ENGLISH_NODE_KP_02_PRACTICE` | `SAMPLE_ENGLISH_NODE_KP_02_CHALLENGE` |
| 英语 | `SAMPLE_ENGLISH_KP_03` | `SAMPLE_ENGLISH_NODE_KP_03_LESSON` | `SAMPLE_ENGLISH_NODE_KP_03_PRACTICE` | `SAMPLE_ENGLISH_NODE_KP_03_CHALLENGE` |
| 英语 | `SAMPLE_ENGLISH_KP_04` | `SAMPLE_ENGLISH_NODE_KP_04_LESSON` | `SAMPLE_ENGLISH_NODE_KP_04_PRACTICE` | `SAMPLE_ENGLISH_NODE_KP_04_CHALLENGE` |

每个节点均需通过 `MapNodeKnowledgeRelation` 关联至少一个知识点；节点内容、题目和规则均留空或指向未发布的占位版本，不能使用虚构正文。

### 7.2 可选节点

在三类核心节点之外，后续可以为单元增加 `START`、`REVIEW`、`CHEST` 和 `BOSS` 节点。它们不改变每个知识点三类核心关卡的 MVP 约束：

- `REVIEW` 只用于错题或知识复习。
- `CHEST` 不能绕过学习内容发放学习优势。
- `BOSS` 只能引用已核验、已学过的知识点。
- `START` 不承载教材正文，只负责进入单元地图。

---

## 8. 内容与题目槽位

当前课程文件只定义真实内容槽位，不生成生产内容。PHASE 9 另有独立的六题原创 Demo Assessment，用于验证题目引擎，不属于本 MVP 教材题库：

| 知识点 | 教学关内容 | 练习关内容 / 题目 | 挑战关内容 / 题目 |
| --- | --- | --- | --- |
| 每个 `SAMPLE_*_KP_*` | 1 个 `CourseContent` 槽位，预计 `TEXTBOOK`，待版本和来源确认 | 1 个内容说明 + 题目池槽位，类型待内容审核确认 | 1 个 `CHALLENGE` 内容说明 + 题目池槽位 |

每个内容或题目槽位都必须预留：

```text
sourceId: SAMPLE_SOURCE_UNVERIFIED
status: DRAFT
needsVerification: true
isSample: true
```

若内容槽位需要图片、音频、视频、动画或 SVG，只能通过 `mediaAssetId` 引用 `MediaAsset`。占位课程不创建真实媒体地址；媒体来源、版权和版本在 `MediaAsset` 中独立核验。

`QUESTION_SCHEMA.md` 中的 JSON 和 `src/data/question-engine/demo/` 中的题目仅用于协议 / UI / 判题流程演示，不能直接作为本 MVP 的教材题库。真实题目必须在教材版本、知识点、课程目标和来源确认后单独录入并审核。

---

## 9. MVP 地图范围

每个学科配置一张对应占位单元的 `LearningMap`：

| 学科 | `mapId` | `unitId` | `themeKey` | 状态 |
| --- | --- | --- | --- | --- |
| 语文 | `SAMPLE_CHINESE_MAP` | `SAMPLE_CHINESE_UNIT` | `sample-chinese-world` | `DRAFT` |
| 数学 | `SAMPLE_MATH_MAP` | `SAMPLE_MATH_UNIT` | `sample-math-world` | `DRAFT` |
| 英语 | `SAMPLE_ENGLISH_MAP` | `SAMPLE_ENGLISH_UNIT` | `sample-english-world` | `DRAFT` |

节点配置必须使用 `unlockRule`、`completionRule`、`perfectRule` 和 `rewardConfig`，不写死 80 分、100 分或固定星级。当前占位地图不配置可发布的得分规则；待题目与评测规则确认后再补充。

---

## 10. MVP 结构验收

- 三个学科都具备一个独立的三年级上册教材版本占位。
- 每个学科具备一个单元、三个课次和四个知识点占位。
- 每个单元满足 3～5 个知识点的 MVP 范围。
- `LessonKnowledgePointRelation` 明确表达一课多点与一点多课。
- 每个知识点预留教学、练习和挑战三类节点。
- `REVIEW` 节点和内容类型保留给错题与知识复习。
- 已提供 `SAMPLE_REGION_A/B/C`、`SAMPLE_PUBLISHER_A/B/C` 和 `SAMPLE_REGION_TEXTBOOK_RELATION_*` 占位结构，均未形成真实地区教材映射。
- 已保留按 `regionId`、`gradeId`、`semesterId` 和 `subjectId` 分科解析教材的流程，不使用单一教材版本代表三科。
- 所有教材与课程内容字段都保留来源、审核状态和核验标识。
- 没有真实教材单元、教材正文、题目或答案被写入。
- 没有任何占位记录被标记为 `PUBLISHED`。

当前结论：MVP 课程骨架已完成设计并已在本地 SAMPLE 数据中实现，教材事实未核验，不能用于正式学习或生产发布。

---

## 11. PHASE 3 与真实课程数据的边界

真实教材数据不是进入 PHASE 3 UI 设计的前置条件。PHASE 3 可以继续使用本文件中的 `SAMPLE_*` 数据设计首页、学习地图、课程页和答题页；这些数据只用于验证信息层级、状态展示和交互布局，不得作为正式课程内容。

### 11.1 进入真实课程数据录入前

在 PHASE 6 / PHASE 5 建立真实课程数据前，必须确认：

1. 三科教材版本、适用地区和课程标准。
2. MVP 的真实单元、课次和知识点。
3. 每个知识点的课程目标、能力标签和前置关系。
4. 教研负责人、内容审核者和数据发布责任人。

### 11.2 正式 PUBLISHED 前

任何教材同步内容、题目或媒体资源正式 `PUBLISHED` 前，必须确认：

1. 教材来源可追溯。
2. 教材正文、图片、音频和动画的版权或授权状态明确。
3. 内容审核记录完整，题目结构和答案规则通过校验。
4. 教材版本、单元、课次和知识点关系已由责任人核验。
5. 对应 `ContentVersion` 已完成发布审批。

在上述条件满足前，真实内容应保持非发布状态；但不阻止 PHASE 3 使用占位结构进行 UI 设计。

### 11.3 地区与教材待确认事项

1. MVP 目标地区。
2. 地区教材映射来源。
3. 地区教材关系的有效年份，以及 `effectiveFrom` / `effectiveTo`。
4. 学校是否允许覆盖地区默认版本。
5. 学生更换地区后课程进度、教材版本和历史作答的迁移策略。

## 12. PHASE 5 Mock 实现映射

PHASE 5 已将本文件的占位结构落到 `src/data/curriculum/`，并通过 `curriculumService`、`curriculumStore` 和 `curriculumProfileRepository` 串成可运行的本地闭环。地区 A 验证唯一 `DEFAULT` 自动推荐，地区 B 验证多个版本必须确认，地区 C 验证无候选；三科教材版本分开保存，所有 SAMPLE 记录仍为 `DRAFT` / `verificationStatus = SAMPLE`。

Mock 数据不是 PHASE 5 的真实课程录入。真实课程录入前仍需完成三科教材版本、MVP 真实单元、知识点、课程目标、地区映射来源和有效年份确认；正式 `PUBLISHED` 前还需完成教材来源、版权、内容审核和教材核验。

## 13. PHASE 6 Golden Sample 与导入边界

PHASE 6 只增加一个三年级数学上册 PEP Golden Sample Framework，位于 `src/data/curriculum/verified/math/pep/g3-s1/`。它包含 1 个教材、1 个单元、3 个课次、4 个去教材化知识点、6 个课次-知识点映射、3 条知识关系和 1 个待补 `SourceReference`，用于验证完整数据链，不是批量真实教材录入。

Golden Framework 的教材、单元、课次、知识点和关系全部为 `UNVERIFIED`、`needsVerification: true`，显示名称明确标记“待核验”，没有凭记忆填写真实单元名、年份、ISBN、目录或教材正文。进入 `VERIFIED` / `REVIEWED` 前必须补充可靠来源、版权证据、教材核验、知识点审核和人工审核记录。

`npm run curriculum:review` 对该框架执行 Schema、引用、重复、完整性、来源、SAMPLE 污染和 prerequisite DAG 检查；当前结构无错误，但报告结果是 `REQUIRES_MANUAL_REVIEW`。

## 14. PHASE 7 地图消费边界

PHASE 7 只消费本文件定义的课程骨架关系，不新增真实教材内容。正式地图根据学生当前数学教材版本读取课程快照并生成 LearningMap ViewModel；没有 `REVIEWED` 课程数据时，生产入口保持未开放或可恢复的设置状态。开发地图可使用独立 `Map Demo Fixture` 验证多岛视觉，但 Demo 不属于本 MVP 教材事实集合。

地图完成度只表示已完成的地图节点比例，不是掌握率；`mastered` / `perfect` 只作为开发 fixture 状态。地图不会生成 `CourseContent`、`Question`、答案、教材原文或正式学习记录。

## 15. PHASE 8 LessonPlayer 占位边界

PHASE 8 允许使用独立原创 Demo Lesson Fixture 验证 `Intro → Concept → Explanation → Example → Media → Interactive → Practice Placeholder → Summary` 步骤和会话恢复。该 Fixture 全部为 `SAMPLE`，不属于本文件的真实 MVP 教材事实集合，也不代表任何地区、出版社或教材正文。

LessonPlayer 的 `Practice Placeholder` 在 PHASE 9 通过显式上下文进入独立 Question Engine；LessonPlayer 不拥有题目、答案或判题。正式课程内容 / 题目录入前仍需完成三科教材版本、MVP 真实单元、知识点、课程目标、教材来源、版权、内容审核和教材核验；生产入口只允许审核通过的课程、学习内容和题目。

## 16. PHASE 9 Question Engine Demo 边界

`src/data/question-engine/demo/` 提供 6 道原创 SAMPLE 题，覆盖 `singleChoice`、`multipleChoice`、`trueFalse`、`fillBlank`、`calculation` 和 `shortAnswer`，并提供 7 条 `QuestionKnowledgePoint` 关系。题目使用固定 Assessment 顺序，支持草稿恢复、提交锁定、确定性判题和结果汇总；所有记录仍为 `isSample: true`、`needsVerification: true`，不代表任何地区、出版社或真实教材。

Question Engine Demo 不改变本文件的真实课程骨架。PHASE 10 可在显式开发入口消费其完成 QuestionSession，产生带 SAMPLE 标识的 `LearningEvidence` 和 `MasteryRecord` Showcase；它们不代表真实教材学习证据。真实题库仍需在待确认事项完成后独立录入、审核和发布。

## 17. PHASE 10 Mastery 占位边界

PHASE 10 不扩充课程骨架、不凭掌握度生成知识点、不把 Lesson / Map completion 作为学习证据。Mastery 只消费 Question Engine 已产生的、可判定的 `QuestionAttempt`：

- 只有完成的 `QuestionSession`、已提交题目和 `correct` / `incorrect` 结果才可派生证据。
- `manual_review_required`、未提交题、孤儿题目和缺少 `QuestionKnowledgePoint` 关系只产生 diagnostic。
- `QuestionKnowledgePoint.weight` 必须满足 `0 < weight <= 1`，同题关系权重总和约等于 `1`；多知识点题目分别为每个知识点产生证据。
- SAMPLE / UNVERIFIED 证据只能在开发流程使用并显式显示，不得混入正式课程或生产掌握度。
- `masteryScore` 表示已有证据，不做时间衰减；`KnowledgeEnergy`、复习排程、错题本、奖励和自适应路径不属于本阶段。

## 18. PHASE 11 Strategy 占位边界

`src/data/learning-strategy/demo/` 的固定夹具只用于验证确定性策略规则，不扩充本 MVP 的真实课程骨架。Strategy 可以读取当前数学教材的地图节点、课程关系和 `MasteryRecord`，但不会凭掌握度创建知识点、改变地图解锁或把占位数据升级为真实教材事实。

正式 profile 不能自动加载 SAMPLE / UNVERIFIED 策略上下文；开发 `/dev/strategy` 必须显示来源警示。真实课程、教材版本、知识点关系、题目和学习内容仍需完成来源、版权与人工审核后才能进入正式链路。
