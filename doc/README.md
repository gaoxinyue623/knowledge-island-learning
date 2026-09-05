# 小学 1—6 年级教材目录与知识点资料

> 本目录用于收集和整理小学 1—6 年级语文、数学、英语教材的目录、知识点及其来源，供项目后续生成课程数据使用。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前状态 | 深圳地区版本已完成第一轮查询；已建立候选目录与知识点索引；二年级语文上册已根据附件完成目录录入；其余内容仍待版次、ISBN、目录和知识点逐项核验 |
| 覆盖范围 | 1—6 年级 × 语文、数学、英语；上册、下册 |
| 上游规范 | `CURRICULUM.md`、`DATA_MODEL.md`、`CURRICULUM_IMPORT.md`、`CURRICULUM_SOURCES.md` |
| 下游消费者 | `src/data/curriculum/verified/`、课程导入器、学习地图和 LessonPlayer |
| 权威维护者 | 内容负责人 / 教研负责人（待确定） |
| 更新日期 | 2026-09-02 |

## 深圳地区第一轮查询

- [深圳地区小学 1—6 年级语文、数学、英语教材版本调查](./shenzhen-textbook-research.md)
- [深圳 1—6 年级教材候选目录与知识点索引](./shenzhen-candidate-curriculum.md)
- [深圳英语教材附件证据记录](./shenzhen-english-attachment-evidence.md)
- [二年级语文上册附件证据记录](./grade-2/chinese-attachment-evidence.md)

调查结论只用于确定后续采集范围，不等同于生产数据中的 `REVIEWED` 教材版本。当前公开证据较稳定地指向：语文使用人民教育出版社统编系列，数学使用北京师范大学出版社系列，英语使用上海教育出版社系列；低年级英语按本次附件登记为上海教育出版社《英语口语交际》系列。具体年级、上下册、版次、ISBN 及 2026—2027 学年有效期仍需逐本核验。

当前文件不代表任何教材版本已经确认，也不包含教材正文、课文原文、教材页码或题目。未指定地区、出版社、版次和课程标准版本时，禁止根据模型记忆补全目录或知识点。

## 目录

每个年级有一组独立的学科资料文档。文件名使用英文 slug，正文使用中文，便于代码和后续导入脚本稳定引用。

### 一年级

- [一年级语文](./grade-1/chinese.md)
- [一年级数学](./grade-1/math.md)
- [一年级英语](./grade-1/english.md)

### 二年级

- [二年级语文（上册附件目录已录入）](./grade-2/chinese.md)
- [二年级数学](./grade-2/math.md)
- [二年级英语](./grade-2/english.md)

### 三年级

- [三年级语文](./grade-3/chinese.md)
- [三年级数学](./grade-3/math.md)
- [三年级英语](./grade-3/english.md)

### 四年级

- [四年级语文](./grade-4/chinese.md)
- [四年级数学](./grade-4/math.md)
- [四年级英语](./grade-4/english.md)

### 五年级

- [五年级语文](./grade-5/chinese.md)
- [五年级数学](./grade-5/math.md)
- [五年级英语](./grade-5/english.md)

### 六年级

- [六年级语文](./grade-6/chinese.md)
- [六年级数学](./grade-6/math.md)
- [六年级英语](./grade-6/english.md)

## 记录结构

每份学科文档都按下面的关系记录，之后可以转换为项目的 `CurriculumImportPackage`：

```text
TextbookVersion
  → Unit
    → Lesson
      ↔ KnowledgePoint
KnowledgePoint
  → KnowledgeRelation（前置、关联或进阶）
```

| 文档内容 | 导入对象 | 必须记录的关键信息 |
| --- | --- | --- |
| 教材版本 | `textbook` | 学科、年级、学期、出版社、系列、版次年份、ISBN、课程标准版本 |
| 单元目录 | `units` | `unitNo`、`sort`、标题、所属教材、来源 |
| 课次目录 | `lessons` | `lessonNo`、`sort`、标题、所属单元、来源 |
| 知识点 | `knowledgePoints` | code、名称、分类、描述、目标、年级范围、难度、重要性、认知层级、标签 |
| 课次映射 | `lessonKnowledgePoints` | 课次、知识点、`core / secondary / extended` 角色、权重、来源 |
| 知识关系 | `knowledgeRelations` | 前置 / 关联 / 进阶方向、来源；前置关系不得形成环 |
| 来源记录 | `sources` | 来源类型、标题、链接或书目信息、版次、页码 / 章节、获取和核验记录 |

## 填写规则

1. 一条教材事实必须绑定至少一个 `sourceReferenceId`；来源不明时保留“待采集”，不要猜测。
2. 教材版本必须先确认学科、年级、上 / 下册、出版社、系列和版次年份；不同版本不能混写。
3. 单元和课次的编号、顺序应以对应教材版本为准；不要把体验层的地图主题当成教材目录。
4. 知识点应描述可独立讲解、练习、测评或复习的学习对象；分类标签只是检索辅助，不替代教材事实。
5. “建议分类”只用于录入整理，必须在来源核验后才能落成正式知识点名称和范围。
6. 每个课次应有至少一个知识点映射；确实无法映射时，必须写明 `mappingSkipReason`。
7. 课次映射使用 `core`、`secondary`、`extended`；权重取大于 0 且不超过 1 的数值。
8. 前置关系必须保持有向无环；“父子分类”不能直接当作“学习前置”。
9. 不复制受版权保护的课文正文、练习原题、图片、音频或整页教材；只记录后续数据建模所需的最小结构化信息。
10. 文档中的 `待采集`、`待核验`、`已核验`分别表示工作状态，不等同于项目实体的 `status`。

## 状态约定

| 文档标记 | 对应含义 | 是否可进入正式数据 |
| --- | --- | --- |
| `待采集` | 尚未录入可靠教材事实 | 否 |
| `已录入待核验` | 已保存来源线索，但尚未完成逐项核对 | 否；导入状态为 `UNVERIFIED` |
| `已核验` | 已完成来源、版本和结构逐项核对 | 仍需按项目审核流程决定 |
| `已复核` | 已完成责任人复核并留存记录 | 可申请进入 `REVIEWED` |
| `不采用` | 来源无效、版本冲突或超出范围 | 否 |

## 后续数据流

```text
可靠来源
  → 填写本目录下的年级-学科文档
  → 转换为 CurriculumImportPackage
  → CurriculumImportPackageSchema
  → curriculum:validate
  → 人工复核与来源留档
  → src/data/curriculum/verified/
```

本目录是资料采集层，不是生产课程数据的第二事实源。正式数据仍须遵循 `CURRICULUM_IMPORT.md` 的 Schema、来源追踪、样例隔离和人工审核规则。
