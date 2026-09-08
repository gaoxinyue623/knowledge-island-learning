# 知识岛课程知识体系

> 本文档定义课程领域结构与关系规则，并记录 PHASE 6 的导入 / 核验边界、PHASE 7 的地图投影边界、PHASE 8 的 LessonPlayer 消费边界、PHASE 9 的题目关系消费边界、PHASE 10 的掌握度证据边界和 PHASE 11 的策略关系读取边界。它不包含已核验的教材目录，也不代表课程内容已经发布。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 12.4：Product Integration（继承 PHASE 2.2、PHASE 6～11） |
| 状态 | 课程关系、SAMPLE 解析管线、导入 Schema、完整性校验、Golden Sample Framework、Curriculum → LearningMap / LessonPlayer 适配边界、QuestionKnowledgePoint 关系消费边界、Mastery 证据输入边界、Strategy 关系读取边界和 PHASE 12 行为投影边界已实现并验证；真实教材仍未核验 |
| 上游事实源 | 项目根目录 `PRODUCT.md` |
| 下游消费者 | `DATA_MODEL.md`、`QUESTION_SCHEMA.md`、`CONTENT_REVIEW.md`、后续课程数据与前端服务 |
| 权威维护者 | 内容负责人 / 教研负责人（待确定） |
| 教材事实 | 当前没有可靠教材来源；MVP、PHASE 5 和 PHASE 6 Golden Sample 只允许使用明确标注的占位结构 |

---

## 1. 设计结论

知识岛采用以下课程层级：

```text
Grade
  → Semester
    → Subject
      → TextbookVersion
        → Unit
          → Lesson
            ↔ KnowledgePoint
              → CourseContent
                → Question
                  ↕ QuestionKnowledgePoint
```

其中 `Lesson` 与 `KnowledgePoint` 是多对多关系，不把 `lessonId` 作为知识点的唯一归属。学生端的学习地图是课程结构的体验投影，不是教材事实的替代品。

本阶段正式采用 `TextbookVersion` 作为教材版本实体。`PRODUCT.md` 中层级图使用的 `Textbook` 是概念名称；在数据和接口中应使用更具体的 `TextbookVersion`，以支持出版社、版次、年份和审核状态。地区不进入课程知识主链，地区与教材的可用性通过独立关系表达：

```text
Region
  → RegionTextbookRelation
    → TextbookVersion
```

`Region` 不是 `Grade`、`Subject`、`Unit` 或 `KnowledgePoint` 的父级。教材版本继续直接关联 `gradeId`、`semesterId` 和 `subjectId`；首次选课只是基于地区筛选教材的产品流程，不改变课程层级。

### 1.1 必须支持的范围

- 小学 1～6 年级。
- 语文、数学、英语。
- 上册、下册及未来新增学期。
- 同一学科的多个教材版本。
- 课本同步、课外拓展、复习和综合挑战四种内容类型。
- 一个课时对应多个知识点。
- 一个知识点跨多个课时、单元或教材版本复用，但每次使用必须有明确关系和范围。
- 知识点树与前置知识关系。
- 课程内容和题目的来源、版本与审核追踪。

### 1.2 明确不做的事情

- 不使用模型记忆生成真实教材目录、课文原文、教材页码或题目。
- 不把“人教版”“北师大版”“苏教版”“PEP”等名称当成已确认的当前 MVP 版本。
- 不把世界主题名称直接当作教材单元名称。
- 不用一张扁平课程表替代教材层级和知识点关系。

---

## 2. 术语与唯一事实源

| 术语 | 统一定义 | 权威来源 |
| --- | --- | --- |
| 年级 `Grade` | 学生学习阶段，如一年级至六年级 | 课程域 |
| 学期 `Semester` | 上册或下册等学习周期 | 课程域 |
| 学科 `Subject` | 语文、数学或英语 | 课程域 |
| 地区 `Region` | 行政或产品适用地区；不是教材版本或课程内容父级 | 地区词典 |
| 出版社 `Publisher` | 教材出版社身份，与内容来源分开维护 | 出版社词典与 `ContentSource` |
| 地区教材关系 `RegionTextbookRelation` | 某地区对某教材版本的默认、支持或可选适用关系 | 地区教材关系与 `ContentSource` |
| 教材版本 `TextbookVersion` | 某学科、年级、学期的一套可跨地区复用教材版本 | 教材元数据与 `ContentSource` |
| 单元 `Unit` | 教材版本中的有序教学单元 | 教材版本 |
| 课次 `Lesson` | 单元内的课次、课文或教学段落 | 单元 |
| 知识点 `KnowledgePoint` | 可独立教学、练习、掌握和复习的最小学习对象 | 知识点库 |
| 课程内容 `CourseContent` | 围绕知识点的讲解、示例、拓展、复习或挑战说明 | 内容版本 |
| 题目 `Question` | 由统一题型协议描述的可评测任务 | 题目版本；知识点关系由 `QuestionKnowledgePoint` 提供 |
| 题目知识点关系 `QuestionKnowledgePoint` | 题目覆盖的主 / 次知识点关系 | 题目关系记录与独立核验 |
| 学生课程档案 `StudentCurriculumProfile` | 学生选择的地区、年级、学期和三科教材版本 | 学生选择事实 |
| 课程范围 | 内容适用的教材、学科、年级、学期、单元或课次 | 关系表 / 快照 |

教材关系、知识点关系和发布状态分别由课程域、知识点域和内容审核域负责。页面显示名、地图标题和卡片文案只能引用这些域的数据，不能反向成为权威名称。

---

## 3. 课程层级与选课范围实体

### 3.1 Grade

`Grade` 是年级词典，不保存某一个学科或教材版本的内容。设计要求：

- 覆盖 `1` 至 `6` 年级。
- 使用稳定的 `id` 与 `code`，显示名称可本地化。
- 通过状态控制是否能被新内容引用。
- 不能用当前学生年级替代题目和内容上的年级范围字段。

### 3.2 Semester

`Semester` 是学期词典，至少支持 `UPPER`（上册）与 `LOWER`（下册）。学期本身不携带教材内容，通过 `TextbookVersion` 与年级、学科建立范围关系。

### 3.3 Subject

`Subject` 定义语文、数学和英语的稳定标识及其主题配置。语文世界、数学世界和英语世界中的“文字森林、数字王国、字母森林”等名称只属于体验层场景，不能未经审核写入教材单元字段。

### 3.4 TextbookVersion

教材版本至少记录以下信息：

| 字段 | 约束 |
| --- | --- |
| `id` | 稳定唯一标识 |
| `subjectId` | 必须关联一个学科 |
| `gradeId` | 必须关联一个年级 |
| `semesterId` | 必须关联一个学期 |
| `publisherId` | 必须关联 `Publisher`；出版社身份不再以内嵌字符串保存 |
| `versionName` | 教材正式名称或待核验名称 |
| `editionYear` | 版次年份；未知时为待核验 |
| `curriculumStandard` | 对应课程标准；来源不明时不得补全 |
| `status` | `DRAFT`、`ACTIVE`、`ARCHIVED`；核验状态由 `needsVerification` 与审核记录表达 |
| `source` / `sourceId` | 版本元数据的来源 |
| `needsVerification` | 信息是否仍需人工核验 |

教材版本不保存 `publisher: string` 或权威的 `regionScope: string`。地区适用范围必须通过 `RegionTextbookRelation` 记录；若展示需要返回 `regionScope`，只能从有效地区关系派生，不能用于筛选或审核。一个教材版本可以被多个地区复用，三科也不要求使用同一出版社或版本。

示例只能表达结构，不能表示事实：

```text
id: sample-textbook-math-g3-upper
subjectId: math
gradeId: grade-3
semesterId: upper
publisherId: SAMPLE_PUBLISHER_MATH
versionName: 示例数学教材版本（待核验）
editionYear: 待核验
needsVerification: true
isSample: true
```

### 3.5 Unit

`Unit` 只属于一个 `TextbookVersion`，并在该版本内拥有稳定顺序。单元可以配置地图主题，但地图主题名称不能覆盖或冒充教材正式名称。若单元名称未经来源核验，应使用占位名称并标记 `needsVerification: true`。

### 3.6 Lesson

`Lesson` 属于一个 `Unit`，保存课次顺序、显示标题和可选教学摘要。`Lesson` 是教材组织单位，不是知识点的唯一容器；知识点关联必须通过 `LessonKnowledgePointRelation`。

### 3.7 Region

`Region` 表示行政或产品适用地区，支持 `COUNTRY`、`PROVINCE`、`CITY`、`DISTRICT` 四级。MVP 主要使用 `PROVINCE`、`CITY`；`parentRegionId` 只表达地区自身的上下级关系。

地区不是课程内容父级，也不直接决定知识点。地区筛选教材时必须经过 `RegionTextbookRelation`，不得建立 `Region → Grade → KnowledgePoint` 的课程主链。

### 3.8 Publisher

`Publisher` 是出版社词典。`TextbookVersion` 通过 `publisherId` 引用出版社；出版社的来源和核验状态独立维护，不能继续使用 `TextbookVersion.publisher: string`。

### 3.9 RegionTextbookRelation

`RegionTextbookRelation` 表达地区与教材版本的适用关系，字段包括 `regionId`、`textbookVersionId`、`usageType`、`effectiveFrom`、`effectiveTo`、`sourceId`、`status` 和 `needsVerification`。

`usageType` 只有以下三种：

- `DEFAULT`：该地区当前默认推荐版本。
- `SUPPORTED`：该地区确认存在使用的版本。
- `OPTIONAL`：可以选择，但不是默认推荐版本。

教材版本已核验不等于它已经适用于某个地区；地区关系本身也必须有来源并完成核验。一个地区可以支持多个版本，一个版本也可以跨多个地区复用。

### 3.10 StudentCurriculumProfile

`StudentCurriculumProfile` 保存学生首次选择地区后的课程上下文，必须分别记录 `chineseTextbookVersionId`、`mathTextbookVersionId` 和 `englishTextbookVersionId`。它不允许使用一个 `textbookVersionId` 代表全部学科。

档案来源可以是 `USER_CONFIRMED`、`SYSTEM_RECOMMENDED` 或 `MANUAL_OVERRIDE`。系统推荐必须来自已核验的地区教材关系；地区没有确定映射时允许手动选择，但禁止模型根据记忆补全教材版本。

---

## 4. KnowledgePoint 知识点体系

### 4.1 知识点定位

`KnowledgePoint` 是可被讲解、练习、测评、掌握度计算和复习系统引用的最小学习对象。知识点可以在多个课次中出现，也可以跨教材版本复用，但必须满足以下约束：

1. `subjectId` 是知识点的主学科归属。
2. `gradeScope` 使用正式的 `GradeScope` 结构表示适用年级范围，不把知识点固定成只有一个年级。
3. 课程或题目使用知识点时，必须通过课次关系、课程范围或地图关系确认具体上下文。
4. 知识点名称、描述和学习目标缺少可靠来源时，必须标记 `needsVerification: true`。
5. 知识点树允许父子层级，但父子关系不等于教材课次关系。

`GradeScope` 的正式结构为：

```ts
interface GradeScope {
  minGrade: number;
  maxGrade: number;
  explicitGradeIds?: Id[];
}
```

`minGrade` 与 `maxGrade` 必须为 1～6 的整数，且 `minGrade <= maxGrade`。`explicitGradeIds` 可用于精确列举适用年级，但不能超出最小 / 最大范围；正式工程必须使用上述明确接口，不能继续使用未确定的数组或区间类型。

### 4.2 知识树

知识点可以形成树状结构，例如：

```text
计算（示例分类，非教材事实）
├─ 加法
├─ 减法
├─ 乘法
└─ 除法
```

树关系由 `parentKnowledgePointId` 表达。一个知识点最多有一个直接父节点；若需要表达“学习 A 之前必须掌握 B”，使用独立的 `KnowledgePrerequisite`，不能把父子关系当作前置关系。

### 4.3 KnowledgePrerequisite

`KnowledgePrerequisite` 表达知识学习顺序或掌握前提：

| 字段 | 含义 |
| --- | --- |
| `id` | 关系标识 |
| `prerequisiteKnowledgePointId` | 前置知识点 |
| `dependentKnowledgePointId` | 依赖前置知识点的目标知识点 |
| `relationType` | `REQUIRED` 或 `RECOMMENDED` |
| `sourceId` | 关系依据 |
| `status` | 关系状态 |
| `needsVerification` | 是否需要核验 |

知识前置关系必须形成有向无环图。导入或发布前应检查自依赖、反向循环和跨学科错误关系；发现循环时，保留导入记录但禁止进入发布状态。

---

## 5. LessonKnowledgePointRelation

这是 `Lesson` 与 `KnowledgePoint` 的唯一课程关系事实源。

| 字段 | 说明 |
| --- | --- |
| `lessonId` | 课次标识 |
| `knowledgePointId` | 知识点标识 |
| `relationType` | `CORE`、`RELATED`、`REVIEW`、`EXTENSION` |
| `order` | 知识点在课次中的展示或教学顺序 |
| `isPrimary` | 是否为该课次的主要知识点 |
| `sourceId` | 关系来源或审核依据 |
| `needsVerification` | 是否需要核验 |

约束：

- 一个课次可以有多个 `CORE`、`RELATED`、`REVIEW` 或 `EXTENSION` 知识点。
- 一个知识点可以通过多条关系出现在多个课次。
- 同一课次至少应有一个 `isPrimary = true` 的核心关系才能进入可发布课程路径。
- `order` 只表达该课次内的顺序，不代表知识点的全局难度。
- `REVIEW` 与 `EXTENSION` 关系不能被自动标记为教材核心内容。

---

## 6. CourseContent 内容层

### 6.1 内容与知识点的关系

`CourseContent` 至少有一个主要 `knowledgePointId`。它可以是：

- 知识讲解。
- 互动示例。
- 课外拓展。
- 错题或知识复习。
- 综合挑战说明。

内容通过 `contentType` 明确用途：`TEXTBOOK`、`EXTENSION`、`REVIEW`、`CHALLENGE`。教材内容必须有教材版本上下文和可靠来源；复习内容必须指向已学知识点或错题来源；挑战内容不能被误标为教材原文。内容中的图片、音频、视频、动画和 SVG 统一通过 `MediaAsset` 引用，`CourseContent.media` 只保存 `mediaAssetId`、用途和顺序，不保存真实 URI、版权说明或媒体版本副本。

### 6.2 内容格式

`contentFormat` 支持：

`TEXT`、`RICH_TEXT`、`IMAGE`、`AUDIO`、`ANIMATION`、`INTERACTIVE`。

格式只说明呈现载体，不能代替 `contentType`、来源或审核状态。媒体资源也必须有独立来源和版权信息。

课程内容中的媒体统一引用 `MediaAsset`。`CourseContent.media` 只保存 `mediaAssetId`、`usageType` 和 `order`；媒体的 URL、存储键、尺寸、时长、文字替代、来源、版权和版本由 `MediaAsset` 作为唯一事实源维护。

---

## 7. 课程范围解析规则

### 7.1 权威关系

以下关系决定课程事实：

1. `TextbookVersion.subjectId / gradeId / semesterId` 决定教材版本的基本范围。
2. `RegionTextbookRelation` 决定某地区是否默认、支持或可选使用该教材版本；关系必须独立核验。
3. `Unit.textbookVersionId` 决定单元属于哪个教材版本。
4. `Lesson.unitId` 决定课次属于哪个单元。
5. `LessonKnowledgePointRelation` 决定课次与知识点的多对多关联。
6. `KnowledgePrerequisite` 决定知识点之间的前置关系。
7. `CourseContent.knowledgePointId` 决定内容的主要学习归属；教材范围由内容的版本范围与来源共同确认。
8. `QuestionKnowledgePoint` 的 `PRIMARY` 关系决定题目在目标上下文中的主要知识归属；`Question.knowledgePointId` 只作旧数据兼容，题目教材放置关系由题目课程范围关系或已核验的内容上下文确认。

### 7.2 查询快照

题目可以复制 `gradeId`、`semesterId`、`subjectId` 和 `textbookVersionId` 作为查询快照，以便按年级、学科和教材版本快速筛选。快照不是唯一事实源：

- 快照必须记录生成时间和来源版本。
- 修改知识点或课程范围后，后台应重新生成快照。
- 快照与权威关系不一致时，内容不得自动发布，并应进入数据修复队列。
- 学生端查询可以使用快照，但详情、审核和迁移必须回到权威关系。

### 7.3 版本切换

不同教材版本不能通过覆盖旧单元来切换。切换版本时：

1. 新建或启用新的 `TextbookVersion`。
2. 新建属于新版本的 `Unit`、`Lesson` 和课程范围关系。
3. 能复用的 `KnowledgePoint` 通过关系重新挂载，不能复用的知识点建立新记录。
4. 课程内容和题目通过 `ContentVersion` 保存差异。
5. 旧版本可以归档，但不能删除仍被学习记录或审核记录引用的实体。

### 7.4 首次课程选择与教材解析

学生首次使用时，必须先选择 `Region`，再确定年级和学期。课程选择流程为：

```text
Region
  ↓
Grade + Semester
  ↓
resolveAvailableTextbooks
  ↓
分别确认 Chinese / Math / English
  ↓
StudentCurriculumProfile
  ↓
进入 Knowledge Island
```

`resolveAvailableTextbooks` 的筛选条件是 `regionId`、`gradeId`、`semesterId` 和各学科的 `subjectId`。生产解析只读取当前有效、未归档且 `verificationStatus = REVIEWED` 的 `Region`、`RegionTextbookRelation`、`TextbookVersion` 和 `Publisher`；PHASE 5 Mock Adapter 仅在开发模式显式读取 SAMPLE 占位关系，用来验证 UI 分支，不构成生产候选：

1. 某学科只有一个可用的 `DEFAULT` 版本时，可以自动推荐。
2. 某学科存在多个可用版本时，必须让学生确认；不能因其中一个是 `DEFAULT` 就静默替代确认。
3. 地区教材关系无法确定时，允许手动选择；禁止模型猜测该地区教材。
4. 三科独立解析和确认，允许使用不同出版社或不同教材版本。

确认结果写入 `StudentCurriculumProfile`，而不是覆盖 `TextbookVersion` 或把地区写入课程主链。地区变更后的学习进度迁移策略仍是待确认事项。

---

## 8. 学习地图与课程结构的映射

学习地图由 `LearningMap`、`MapNode` 以及三类关系构成：

- `MapNodeKnowledgeRelation`：节点涉及哪些知识点。
- `MapNodeContentRelation`：节点展示或使用哪些课程内容。
- `MapNodeQuestionRelation`：节点从哪些题目池或固定题目中取题。

地图节点不固定绑定一个知识点。一个节点可以关联多个知识点、多个内容和多道题；一个知识点也可以在多个教学、练习、复习或挑战节点中出现。

节点类型包括：

`START`、`LESSON`、`PRACTICE`、`CHALLENGE`、`REVIEW`、`CHEST`、`BOSS`。

`REVIEW` 是专门用于错题和知识复习的节点类型，不应被混入正常新授课节点。地图节点的解锁、达标和完美规则由配置驱动，不在页面或节点名称中写死分数。

---

## 9. 未来课程数据目录

以下目录是 SAMPLE、共享课程字典和后续真实内容导入的边界。目录之间物理隔离，不复制同一批课程记录：

```text
src/data/
├─ curriculum/
│  ├─ core/                 # Grade / Semester / Subject 等共享字典
│  ├─ sample/               # 显式 SAMPLE 命名空间；兼容旧实体目录
│  ├─ verified/             # 真实来源导入入口；当前只有未核验 Golden Framework
│  ├─ grades/
│  ├─ semesters/
│  ├─ subjects/
│  ├─ regions/
│  ├─ publishers/
│  ├─ textbooks/
│  ├─ region-textbooks/
│  ├─ units/
│  ├─ lessons/
│  ├─ knowledge-points/
│  ├─ relations/
│  ├─ questions/
│  ├─ maps/
│  ├─ contents/
│  ├─ sources/
│  ├─ media/
│  ├─ mock/
│  └─ index.ts
```

`sample/` 与既有实体目录只允许存放演示结构或测试夹具；所有演示记录必须有 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE`，并且不能进入生产发布目录。`verified/` 只接收通过导入 Schema、引用、重复、来源、DAG 和样本污染检查的数据；当前 Golden Framework 仍是 `UNVERIFIED`，不会被生产解析。

---

## 10. 课程域验收标准

- 已明确 `TextbookVersion` 的学科、年级、学期、出版社、版次年份、课程标准和来源字段；地区适用性由独立关系表达。
- 已明确 `Region`、`Publisher` 和 `RegionTextbookRelation` 的独立边界；地区不是课程知识层父级。
- 已明确地区、年级、学期和学科的教材解析条件，以及三科可以分别选择不同版本。
- 已明确 `StudentCurriculumProfile` 不使用单一 `textbookVersionId` 代表三科。
- 已明确 `Lesson` 与 `KnowledgePoint` 的多对多关系及四种关系类型。
- 已明确知识树与前置知识是两种不同关系。
- 已明确课程内容类型、内容格式和审核边界。
- 已明确地图节点可以关联多个知识点、内容和题目。
- 已明确权威关系和查询快照的区别。
- 已明确教材版本迁移不覆盖旧数据。
- 当前未建立真实教材目录、课文正文或生产题库；代码已建立三科 `SAMPLE_*` 课程骨架，以及独立的六题 Question Engine Demo，仍只能用于开发和测试。

## 11. 待确认事项

1. MVP 目标地区（至少明确使用省级或市级地区）。
2. 地区教材映射的可靠来源，以及地区与教材关系的审核责任人。
3. 地区教材关系的有效年份 / `effectiveFrom` / `effectiveTo`。
4. 三年级上册语文、数学、英语实际使用的教材版本和出版社。
5. 学校是否允许覆盖地区默认版本，以及覆盖后的审核规则。
6. 学生更换地区后课程进度、教材版本和历史作答的迁移策略。
7. 教材元数据、原文、图片、音频和题目的授权来源。
8. 课程负责人和知识点审核负责人。
9. 知识点跨版本复用的审核标准。

以上事项确认前，任何真实课程记录都只能保持未发布状态。

## 12. PHASE 5 Mock 课程管线状态

- 已实现三年级上册三科的每科 1 个 SAMPLE 单元、3 个 SAMPLE 课次、4 个 SAMPLE 知识点；`LessonKnowledgePointRelation` 实现一课多点和一点多课。
- 已实现 `KnowledgePrerequisite` 的无环校验、课程内容与题目引用校验、媒体引用校验和 SAMPLE 不得 `PUBLISHED` 的发布闸门。
- 已实现地区 A 的单一默认、地区 B 的多版本确认、地区 C 的无候选分支；教材版本可被多个地区关系复用。
- 已实现 `StudentCurriculumProfile` 的三科独立保存、localStorage 恢复和损坏载荷回退。
- 这些记录都不代表真实地区教材关系、真实教材内容或版权已清理；真实录入前必须完成本文件第 11 节的待确认事项。

## 13. PHASE 6 导入与核验边界

PHASE 6 保留既有课程主链，不把地区提升为课程内容父级，也不把教材版本、出版社和地区关系合并。真实教材导入必须通过 `CurriculumImportPackageSchema`，并由 `importCurriculumPackage` 检查：

- `TextbookIdentity` 与稳定 `textbookIdentityKey`；缺少年份时使用 `UNKNOWN`，ISBN 不是唯一身份。
- Textbook → Unit → Lesson → LessonKnowledgePoint → KnowledgePoint → KnowledgeRelation 的引用、重复、排序、完整性和 prerequisite DAG。
- 每个实体的 `sourceReferenceIds`、`verificationStatus` 和人工审核所需的时间 / 审核人元数据。
- `SAMPLE_*` ID、`isSample` 和 `verificationStatus` 不得污染非 SAMPLE 数据集。

当前唯一 Golden Sample Framework 位于 `src/data/curriculum/verified/math/pep/g3-s1/`，仅有三年级数学上册 PEP 的最小框架，所有显示名称和关系语义均标记待核验；它不构成真实教材事实。生产课程解析只允许 `verificationStatus = REVIEWED`，而非仅凭教材版本或地区关系已存在就放行。

## 14. PHASE 7 地图投影边界

PHASE 7 的 LearningMap 是课程事实的展示投影，不是新的课程层级。地图读取已经确认的 `Textbook → Unit → Lesson → KnowledgePoint → KnowledgeRelation`，生成 Unit Island、Lesson 区域、KnowledgePoint 节点、路径连接和完成度；`position`、`visual`、岛屿主题和逻辑坐标只存在于 `LearningMap ViewModel`，不得回写 `Unit`、`Lesson` 或 `KnowledgePoint`。

地图完成度只回答“已经完成了多少地图节点”，不等同于掌握度。`mastered` 与 `perfect` 在 PHASE 7 只能由演示 fixture / mock progress 提供，不能由 `masteryScore` 或任何分数条件推导。正式掌握度与复习算法仍按 `DATA_MODEL.md` 约束留给后续阶段。

当前数据集边界：

- 正式 `/learning-map` 依据 `StudentCurriculumProfile.mathTextbookVersionId` 请求课程；没有档案、教材或 `REVIEWED` 数据时显示可恢复的未开放 / 设置状态。
- 开发 `/dev/learning-map` 可以显式查看 Golden Framework 和 Map Demo Fixture。Golden 为 `UNVERIFIED`，Demo 为 `SAMPLE`，页面必须显示对应警示，不能冒充正式教材。
- 前置关系按稳定 KnowledgePoint ID 计算，支持跨 Lesson / Unit 关系；缺失关系引用记录诊断并忽略，不让整个页面白屏。
- `LearningMapStore` 只拥有地图选择、定位、加载和演示进度；教材、地区和三科版本仍由 Curriculum / Student Curriculum 域维护。

PHASE 7 已完成地图适配、视觉壳、基础解锁、演示进度、响应式和质量验证。PHASE 8 已在地图节点与 LessonPlayer 之间接入稳定 `LessonLaunchContext`、结构化学习内容、可恢复 LessonSession 和完成回链；PHASE 9 再通过独立 `AssessmentLaunchContext` 接入题目引擎，不改变课程主链。

## 15. PHASE 8 LessonPlayer 消费边界

LessonPlayer 读取既有的 `Textbook → Unit → Lesson → LessonKnowledgePoint → KnowledgePoint` 事实链，并通过独立 `LearningContentRepository` 取得呈现内容。它不会把学习步骤、媒体、互动或会话字段写回课程实体，也不会把 `Region` 提升为知识层父级。

正式 LessonPlayer 必须同时满足课程事实与 LearningContent 的生产审核门槛；课程结构已 `REVIEWED` 但学习内容未 `REVIEWED` 时仍不可读。开发页可以在显式配置下使用 SAMPLE / UNVERIFIED Demo Fixture，但不能改变课程核验状态或冒充真实教材正文。

PHASE 8 的 Lesson completion 只更新独立地图演示完成度，不等于 KnowledgePoint 掌握，不触发 `MasteryEvent`、`KnowledgeEnergy`、Reward 或 Question 逻辑。PHASE 9 的 Practice 入口只发出显式 `AssessmentLaunchContext`，Question Engine 返回的分数不回写课程或掌握度。具体步骤、内容块、会话和验证记录见 `LESSON_PLAYER.md`、`LESSON_CONTENT.md`、`LESSON_SESSION.md` 和 `QUESTION_ENGINE.md`。

## 16. PHASE 9 Question 关系消费边界

题目属于课程内容的可评测资源，但题目与知识点不是简单的一对一嵌套字段。`QuestionKnowledgePoint` 是题目的权威关系表；每道题至少有一个关系，且在发布前必须有且仅有一个 `PRIMARY`，可有多个 `SECONDARY`。关系来源、状态和核验独立于 Question 本体，题目引擎只在显式目标 `knowledgePointId` 上读取匹配关系。

PHASE 9 Demo 只提供六道原创 SAMPLE 题和七条题目-知识点关系，用于验证固定 Assessment、结构化题型、确定性判题、提交锁定和会话恢复。它不构成三科真实教材题库，不改变课程教材、Lesson 或知识点事实。PHASE 10 可在显式开发流程中消费其 QuestionAttempt，产生带 SAMPLE 标记的 LearningEvidence；这不代表真实教材证据。

## 17. PHASE 10 Mastery 证据消费边界

PHASE 10 只消费课程域提供的题目事实、知识点关系、关系权重、题目难度和来源核验状态；它不改变课程层级，也不把 Lesson / Map completion 当作掌握度证据：

```text
Question + QuestionKnowledgePoint + QuestionAttempt
  ↓（仅限 completed QuestionSession）
LearningEvidence
  ↓
MasteryRecord（按 studentProfileId + knowledgePointId）
```

- 每个 `QuestionKnowledgePoint.weight` 必须满足 `0 < weight <= 1`；同一题关系权重总和约等于 `1`。一道题覆盖多个知识点时，一次作答为每个关系生成独立证据。
- 题目 `difficulty` 仍是 `FOUNDATION / STANDARD / ADVANCED`，在证据层归一化为 `1 / 3 / 5`，只作为权重输入，不等于掌握度。
- 只有已提交且结果为 `correct` / `incorrect` 的作答进入证据；未完成 Session、未提交题、孤儿题目、缺失映射和 `manual_review_required` 只记录诊断。
- 题目和关系必须通过集中访问闸门才能进入生产掌握度；SAMPLE / UNVERIFIED 只能在开发页显式展示并保留来源标记。
- `MasteryRecord` 的 `masteryScore` 表示已有学习证据，不做时间衰减；`KnowledgeEnergy`、复习排程、错题本、奖励和自适应路径不属于当前课程域实现。

## 18. PHASE 11 Strategy 关系消费边界

PHASE 11 只读取已经通过当前课程 / 地图闸门的 `KnowledgeRelation`，不新增第二套课程关系，也不从页面标题或数组位置推断前置条件。`LearningMapCurriculumKnowledgeRelation` 可以通过 adapter 进入策略层，但 Curriculum 关系和地图展示关系仍分别保留各自事实边界。

策略使用地图服务已经解析的 `locked / available / learning / completed / mastered / perfect` 状态；它不能自动解锁知识点、改变 prerequisite 关系或生成课程内容。缺少有效节点 / 关系时只返回安全空状态与 diagnostic。生产遇到 SAMPLE、UNVERIFIED、REJECTED 来源不生成正式策略建议，开发夹具保留来源警示。

## 19. PHASE 12 学习行为投影边界

PHASE 12 不新增课程实体或第二套知识关系。`LearningHistoryRecord` 只保存 `LessonSession` / `QuestionSession` 的稳定来源 ID；`WrongQuestionRecord` 只保存 `QuestionAttempt` 的题目 ID、知识点关系和 Session 来源；`ReviewQueueItem` 只保存 `LearningRecommendation` 的当前建议快照。三者都不能回写课程、地图解锁、Mastery 或 Strategy 规则。详细实现见 `PHASE12.md`。
