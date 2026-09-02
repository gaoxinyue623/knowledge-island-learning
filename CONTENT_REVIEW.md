# 知识岛内容来源、审核与版本机制

> 本文档定义课程内容、题目、教材版本和媒体资源的来源追踪、人工审核、版本发布及归档规则，并约束 LearningMap 与 PHASE 10 Mastery 的数据读取边界。它是流程设计，不代表已有审核后台或发布服务已经实现。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 10.4：Mastery Model（继承 PHASE 2.2、PHASE 6～9） |
| 状态 | 生命周期矩阵、来源策略、课程核验状态机、SAMPLE 闸门、自动 Review Report、地图读取保护、LessonPlayer 内容闸门、Question 独立审核闸门和 Mastery 生产证据闸门已实现；真实审核后台未实现 |
| 上游事实源 | `PRODUCT.md`、`CURRICULUM.md`、`DATA_MODEL.md` |
| 下游消费者 | 内容录入、教研审核、课程发布、题目服务、版本迁移 |
| 内容质量负责人 | 教研 / 内容负责人（待确定） |
| 发布负责人 | 产品或内容负责人（待确定） |
| 当前真实教材数据 | 不存在；MVP / PHASE 5 / PHASE 6 Golden Sample 仅允许使用占位或待核验框架 |

---

## 1. 核心结论

知识岛将“内容从哪里来”“谁审核过”“哪一版被发布”分开记录：

```text
ContentSource
  → CourseContent / Question
    → ContentVersion
      → ContentReviewRecord
        → PUBLISHED 版本
```

任何内容、媒体资源和地区教材关系都必须有可追溯的来源与适用状态。AI 只能作为一种生成方式，不能作为教材事实来源，也不能绕过人工核验直接发布。出版社身份由 `Publisher` 维护，教材版本与地区的适用性由 `RegionTextbookRelation` 独立维护。

### 1.1 发布硬门槛

内容或题目进入 `PUBLISHED` 前必须同时满足：

1. 已有可追溯的 `sourceId`。
2. 已明确 `contentType`，并与教材同步、拓展、复习或挑战的实际用途一致。
3. 已完成至少一次内容审核记录。
4. 教材同步内容具备版本、年级、学期、学科、单元和课次上下文。
5. 知识点关联、题型结构和答案规则通过完整性检查。
6. 当前 `ContentVersion` 的 `needsVerification` 为 `false`。
7. 内容版本的审核结果为 `VERIFIED`，并且发布审批已完成。
8. 版权状态不为 `UNKNOWN`、`PENDING` 或 `RESTRICTED`，除非另有明确授权决定。
9. 所有引用的 `MediaAsset` 均存在、版本明确、状态为 `ACTIVE`，并且来源、版权和授权字段已核验。
10. 若内容属于地区教材同步范围，相关 `RegionTextbookRelation` 必须存在、处于有效日期内、`status = ACTIVE` 且 `needsVerification = false`；教材版本已核验不能替代地区关系核验。
11. `TextbookVersion.publisherId` 指向已存在且满足核验要求的 `Publisher`，不能使用内嵌出版社字符串替代。
12. `Question` 的 `QuestionKnowledgePoint` 关系必须有来源、状态和核验记录；每题必须有且仅有一个 `PRIMARY`，不能只依赖旧 `knowledgePointId`。

---

## 2. ContentSource 来源模型

### 2.1 字段契约

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 来源稳定标识 |
| `sourceType` | 是 | 来源类型枚举 |
| `title` | 是 | 来源名称 |
| `publisher` | 否 | 出版社、机构或作者 |
| `edition` | 否 | 版次或版本说明 |
| `sourceRef` | 否 | 链接、档案号、扫描件编号或内部引用 |
| `sourceVersion` | 否 | 来源自身版本 |
| `copyrightStatus` | 是 | `UNKNOWN`、`PENDING`、`CLEARED`、`RESTRICTED` |
| `license` | 否 | 授权条款或许可说明 |
| `attribution` | 否 | 署名要求 |
| `verifiedAt` | 否 | 来源核验时间 |
| `notes` | 否 | 限制、范围和补充说明 |

`ContentSource.publisher` 仅是来源记录中的出版者 / 机构元数据，不是教材版本的出版社关系；教材版本的规范出版社身份必须通过 `publisherId` 指向 `Publisher`。

### 2.2 sourceType

| 值 | 含义 | 可否单独证明教材事实 |
| --- | --- | --- |
| `TEXTBOOK` | 具体教材或教材版本来源 | 可以，但必须记录版本和授权核验 |
| `CURRICULUM_STANDARD` | 课程标准或官方教学要求 | 只能证明标准范围，不能替代教材正文 |
| `TEACHER_CREATED` | 教师或教研人员原创内容 | 可以证明原创来源，不能自动证明教材同步关系 |
| `AI_GENERATED` | AI 生成过程记录 | 不能证明教材事实、准确性或版权 |
| `PUBLIC_RESOURCE` | 可公开使用的资源 | 需核对具体许可范围 |
| `LICENSED_RESOURCE` | 已获得许可的资源 | 必须保存许可条款与有效范围 |

禁止填写“AI 知道”“模型记忆”或相似模糊表达作为来源。AI 生成内容仍需要真实的参考来源、人工审核和版权判断。

### 2.3 来源缺失处理

来源缺失、版本不明或版权状态未知时：

- 创建记录可以停留在 `DRAFT` 或 `AI_GENERATED`。
- 必须设置 `needsVerification: true`。
- 不得进入学生端，不得被标记为 `VERIFIED` 或 `PUBLISHED`。
- 审核队列显示缺失字段和补充责任人。

---

## 3. 生命周期矩阵与内容状态机

### 3.1 LIFECYCLE_MATRIX

`ACTIVE` 与 `PUBLISHED` 属于不同状态族，不能在同一个实体上表达同一含义：

| 实体 | 状态族 | 允许状态 | 状态含义 |
| --- | --- | --- | --- |
| `Region` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 地区词典是否可被教材关系引用 |
| `Semester` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 学期词典是否可被课程引用 |
| `Publisher` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 出版社词典是否可被教材版本引用；事实核验由 `verificationStatus`、来源和 `needsVerification` 表达 |
| `RegionTextbookRelation` | 地区映射生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 地区教材关系是否可被解析器使用；关系核验由独立 `verificationStatus`、来源和 `needsVerification` 表达 |
| `Grade` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 年级词典是否可被课程引用 |
| `Subject` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 学科词典是否可被课程引用 |
| `TextbookVersion` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 教材范围是否可被课程引用；事实核验由独立 `verificationStatus` 表达 |
| `Unit` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 单元结构是否可被课程路径使用；事实核验另由 `verificationStatus` 表达 |
| `Lesson` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 课次结构是否可被课程路径使用；事实核验另由 `verificationStatus` 表达 |
| `KnowledgePoint` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 知识点结构是否可被内容和题目引用；事实核验另由 `verificationStatus` 表达 |
| `QuestionKnowledgePoint` | 结构关系生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 题目与知识点的关系是否可被题目引擎读取；关系事实单独核验 |
| `MediaAsset` | 资源生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 媒体资源是否可被内容引用；版权由 `copyrightStatus`、授权和 `verificationStatus` 共同约束 |
| `MapNode` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 地图节点配置是否可被学习路径使用；事实核验另由 `verificationStatus` 表达 |
| `LearningMap` | 结构生命周期 | `DRAFT`、`ACTIVE`、`ARCHIVED` | 地图配置是否可被节点引用；事实核验另由 `verificationStatus` 表达 |
| `CourseContent` | 内容审核生命周期 | `DRAFT`、`AI_GENERATED`、`REVIEWED`、`VERIFIED`、`PUBLISHED`、`REJECTED`、`ARCHIVED` | 内容版本是否通过审核并可供学生端读取 |
| `Question` | 内容审核生命周期 | `DRAFT`、`AI_GENERATED`、`REVIEWED`、`VERIFIED`、`PUBLISHED`、`REJECTED`、`ARCHIVED` | 题目版本是否通过审核并可供题目引擎读取 |
| `LearningEvidence` | 学习行为事实 | 不使用内容审核生命周期 | 由已完成 QuestionSession 的有效作答派生；保存题目 / 关系来源核验状态，不可被内容审核状态替代 |
| `MasteryRecord` | 学习行为读取模型 | 不使用内容审核生命周期 | 由 LearningEvidence 确定性重算；`algorithmVersion`、证据统计和来源状态表达可解释性 |

矩阵规则：

- 结构实体不使用 `PUBLISHED`；`ACTIVE` 表示结构可被其他已发布内容引用。
- `CourseContent` 和 `Question` 不使用 `ACTIVE` 表达学生可见，学生可见统一使用 `PUBLISHED`。
- `MediaAsset` 不使用 `PUBLISHED`；媒体可引用状态是 `ACTIVE`，且必须同时满足版权和来源检查。
- `RegionTextbookRelation` 不使用 `PUBLISHED`；`ACTIVE` 只表示该地区教材映射可被解析器读取，不表示课程内容对学生发布。
- `StudentCurriculumProfile` 是学生的选课事实，不属于内容审核状态族；`confirmedAt` 和 `source` 表达是否完成选择及选择来源。
- `ContentReviewRecord` 是审核事实记录，不使用上述资源生命周期状态；它通过 `reviewStatus` 记录 `REVIEWED`、`VERIFIED` 或 `REJECTED`。
- `LearningEvidence` 和 `MasteryRecord` 不使用 `ACTIVE` 或 `PUBLISHED`；它们不是可发布内容，也不接受 `ContentReviewRecord` 代替行为证据或算法版本。
- `needsVerification`、`copyrightStatus` 和生命周期状态分别表达核验、版权和可用性，不能互相替代。

### 3.1.1 VerificationStatus

课程事实使用独立的 `VerificationStatus`：

| 值 | 含义 | 是否可进入生产课程解析 |
| --- | --- | --- |
| `SAMPLE` | 开发占位或测试夹具 | 否 |
| `UNVERIFIED` | 已有结构但来源 / 事实未完成核验 | 否 |
| `VERIFIED` | 已依据可靠来源完成事实核验，等待发布级人工审核 | 否 |
| `REVIEWED` | 已完成责任人审核，满足生产课程事实门槛 | 是，仍需满足结构生命周期与内容发布条件 |
| `REJECTED` | 被审核拒绝或待修订 | 否 |

`SAMPLE` 永远不能升级到 `VERIFIED` 或 `REVIEWED`。`UNVERIFIED → VERIFIED → REVIEWED` 是课程事实核验顺序；`REJECTED` 只能先通过修订请求回到 `UNVERIFIED`，不能直接进入 `REVIEWED`。`ACTIVE` 只表示结构可用，`PUBLISHED` 只表示内容已发布，二者都不替代 `VerificationStatus`。

### 3.2 状态定义

| 状态 | 含义 | 学生端可见 |
| --- | --- | --- |
| `DRAFT` | 新建或正在编辑，尚未完成初审 | 否 |
| `AI_GENERATED` | 由 AI 生成或辅助生成，未完成足够人工审核 | 否 |
| `REVIEWED` | 已完成初审，问题已记录或已通过内容审查 | 否 |
| `VERIFIED` | 教材关系、来源、答案和内容已由有责任的人核验 | 否，等待发布 |
| `PUBLISHED` | 当前版本已获准供学生端读取 | 是 |
| `ARCHIVED` | 历史版本或旧内容，不再进入新学习路径 | 否；历史记录可引用 |
| `REJECTED` | 因准确性、来源、版权或设计原因被拒绝 | 否 |

### 3.3 允许的状态迁移

```text
DRAFT ───────────────→ AI_GENERATED
  │                         │
  └──────────────────────→ REVIEWED
                              │
                 ┌────────────┴────────────┐
                 ↓                         ↓
             VERIFIED                  REJECTED
                 │
                 ↓
             PUBLISHED ─────────────→ ARCHIVED
```

规则：

- `AI_GENERATED` 可以进入 `REVIEWED`，不能直接进入 `VERIFIED` 或 `PUBLISHED`。
- 人工原创的 `DRAFT` 可以进入 `REVIEWED`，但仍需要完成核验才能发布。
- `REVIEWED` 只有在所有关键问题关闭、来源与范围确认后才能进入 `VERIFIED`。
- `VERIFIED` 只有在发布审批完成后才能进入 `PUBLISHED`。
- `PUBLISHED` 不直接覆盖编辑；修改必须创建新的 `ContentVersion`，旧版本保持可追溯。
- 发现已发布内容有错误时，新版本进入 `DRAFT` 或 `REVIEWED`，旧的已发布版本可以先保留或转 `ARCHIVED`，取决于风险处理决定。
- `REJECTED` 内容不能通过改状态绕过审核；若要重新提交，应创建修订版本并记录原因。
- `ARCHIVED` 只能恢复到重新审核流程，不能直接恢复为 `PUBLISHED`。

### 3.4 内容与版本状态的关系

`CourseContent.status` / `Question.status` 表示资源当前对外的聚合状态；`ContentVersion.reviewStatus` 表示具体版本的审核结果。历史版本的审核状态不能被当前版本的状态覆盖。

### 3.5 地区教材关系审核

`RegionTextbookRelation` 本身也是需要审核的内容关系，必须同时拥有 `sourceId`、`needsVerification` 和 `status`。审核者必须核对地区、教材版本、出版社、适用学科、有效日期和 `usageType`，并将依据写入审核记录或关系来源。

以下规则适用于教材解析和首次选课：

- 只有 `status = ACTIVE`、`needsVerification = false` 且当前日期落在 `effectiveFrom` / `effectiveTo` 范围内的关系，才能进入可用教材集合。
- `TextbookVersion` 已核验，只能证明教材版本自身的事实，不证明它一定适用于当前地区。
- `DEFAULT`、`SUPPORTED` 和 `OPTIONAL` 的含义必须来自已核验关系；不能从出版社名称、模型记忆或页面排序推断默认版本。
- 同一地区、年级、学期和学科存在多个可用版本时，解析器返回候选集合并要求学生确认；没有可核验关系时允许手动选择。

`Publisher` 也必须有 `sourceId` 和 `needsVerification`。出版社实体与 `ContentSource` 的来源记录分开维护；已存在的出版社名称不能替代具体教材版本或地区关系的来源核验。

---

## 4. ContentReviewRecord 审核记录

### 4.1 记录字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 审核记录标识 |
| `contentVersionId` | 是 | 被审核的具体版本 |
| `reviewerId` | 是 | 审核人或审核角色 |
| `reviewStatus` | 是 | `REVIEWED`、`VERIFIED` 或 `REJECTED` |
| `decision` | 是 | `APPROVE`、`REQUEST_CHANGES`、`REJECT` |
| `evidence` | 是 | 来源、教材、标准或测试依据摘要 |
| `issues` | 否 | 发现的问题及严重程度 |
| `reviewedAt` | 是 | 审核时间 |
| `notes` | 否 | 处理建议或例外说明 |

### 4.2 审核检查项

审核者应按内容类型执行对应检查：

通用检查：

- 内容是否关联正确的知识点。
- 题目是否通过 `QuestionKnowledgePoint` 关系关联目标知识点，是否存在唯一 `PRIMARY`；关系来源、状态和核验是否独立完整。
- 字段是否完整，题型与答案规则是否匹配。
- 来源是否可追溯，版权状态是否明确。
- 文案是否适合目标年级，反馈是否鼓励且可理解。
- 媒体是否通过 `mediaAssetId` 引用、资源是否存在且版本明确，并有文字替代或文字稿。
- 简答题是否明确标记为人工审核，不得把开放答案伪装成自动评分题。

教材同步检查：

- 教材版本、年级、学期、学科是否明确。
- 单元、课次和知识点关联是否来自可靠依据。
- 是否误把拓展、改写或示例写成教材原文。
- 教材正文、图片、音频或例题是否有可用授权。
- 教材图片、音频、视频、动画和 SVG 是否引用已核验的 `MediaAsset`，且没有在内容或题目中保存未经追踪的真实 URI。

复习与挑战检查：

- 是否标记为 `REVIEW` 或 `CHALLENGE`，没有混淆为教材内容。
- 是否指向已学知识点或明确的前置关系。
- 难度和题目数量是否符合节点配置，不靠奖励诱导过度使用。

### 4.3 审核失败路径

当审核发现问题时，必须：

1. 在 `issues` 记录问题类型、影响范围和责任人。
2. 将版本保留在 `REVIEWED` 的修订请求或 `REJECTED`，不能删除记录。
3. 需要改文案或结构时创建新的 `ContentVersion`。
4. 来源不明或教材关系冲突时，保持 `needsVerification: true`。
5. 已发布内容若存在事实错误，触发下架 / 归档评估，并保留受影响学习记录的版本指针。

---

## 5. ContentVersion 版本机制

### 5.1 版本字段

| 字段 | 说明 |
| --- | --- |
| `id` | 版本记录标识 |
| `resourceType` | `COURSE_CONTENT` 或 `QUESTION` |
| `resourceId` | 被版本化的内容或题目 |
| `version` | 同一资源内单调递增的版本号 |
| `previousVersionId` | 上一版本；首版为空 |
| `payload` | 该版本完整内容快照 |
| `changeReason` | 修改原因，如教材改版、纠错、题型调整 |
| `changedBy` | 修改人或生成任务标识 |
| `changedAt` | 修改时间 |
| `reviewStatus` | 当前版本审核状态 |
| `isCurrent` | 是否为资源当前版本 |

### 5.2 不覆盖原则

- 已发布版本禁止直接编辑正文、答案、解析、媒体和教材关联。
- 任何修改都创建新版本，并指向 `previousVersionId`。
- 新版本未通过审核时，旧版本的发布状态不自动改变，除非存在必须下架的准确性或版权风险。
- 题目历史作答必须保留 `questionId + version`，以便解释学生当时看到的内容。
- 教材版本改版时，旧 `TextbookVersion` 与关联内容可以归档，但不能用新教材覆盖旧版名称和范围。

### 5.3 版本发布检查

发布某个版本前，检查：

- 版本链完整，没有自指、断链或重复当前版本。
- 新旧版本的修改原因存在。
- 结构化题型协议仍然有效。
- 来源、教材范围、知识点和媒体引用均可解析。
- 媒体引用的 `MediaAsset` 均为 `ACTIVE`，且 `copyrightStatus` 与 `license` 满足发布要求。
- 新版本通过 `VERIFIED`，且没有未关闭的高严重度问题。

---

## 6. 不同内容类型的审核策略

| `contentType` | 最低来源要求 | 最低审核要求 |
| --- | --- | --- |
| `TEXTBOOK` | 具体教材版本或可核验的官方资料 | 教材关系、内容准确性与版权均需核验 |
| `EXTENSION` | 原创、公开资源或已授权资源 | 来源、版权、年龄适宜性和知识关系需核验 |
| `REVIEW` | 对应已学知识点、错题或历史学习记录 | 复习关系、答案和难度需核验 |
| `CHALLENGE` | 原创、公开资源或已授权资源 | 挑战目标、前置知识和公平性需核验 |

`EXTENSION`、`REVIEW` 和 `CHALLENGE` 即使内容正确，也不能自动获得 `TEXTBOOK` 身份。

---

## 7. MVP 占位数据规则

当前没有可靠教材来源，MVP 的示例记录必须满足：

- 标识使用 `SAMPLE_*` 或等价的 sample 前缀。
- `isSample: true`。
- `needsVerification: true`。
- `status` 不得为 `PUBLISHED`。
- `sourceId` 指向明确标注“示例、未核验”的 `ContentSource`，不能缺失。
- 示例标题必须明确是占位结构，不能使用模型记忆中的真实教材单元或课文名称。
- 示例不得复制受版权保护的教材正文。
- `SAMPLE_REGION`、`SAMPLE_PUBLISHER_*` 和 `SAMPLE_REGION_TEXTBOOK_RELATION_*` 只能验证字段和关系形状；不得表示真实地区对应真实教材关系。
- 所有地区教材关系占位记录都必须是 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE`、`status: DRAFT`，不能进入 `resolveAvailableTextbooks` 的生产候选集合。PHASE 5 Mock Adapter 仅在显式 SAMPLE 开发模式读取它们验证分支，不改变生产门槛。

---

## 8. 责任与边界

| 角色 | 负责事实 | 不负责替代的事实 |
| --- | --- | --- |
| 内容编写者 | 结构化内容与题目草稿 | 不自行决定教材已核验或可发布 |
| AI 辅助生成任务 | 生成候选内容并记录生成来源 | 不证明教材准确性、版权或发布资格 |
| 教研审核者 | 知识点、教材关系、答案和教学适切性 | 不替代发布审批 |
| 版权 / 来源负责人 | 来源真实性与授权范围 | 不替代教学内容审核 |
| 发布负责人 | 确认版本达到发布门槛 | 不修改历史审核证据 |

跨角色冲突时，内容保持未发布，直到责任人和依据明确。

---

## 9. 本阶段验收与待确认

### 已形成的设计

- 已定义 7 个内容状态及允许迁移。
- 已定义 AI 生成内容不能直接发布的状态机。
- 已定义 `ContentSource` 字段和来源类型。
- 已定义 `ContentReviewRecord` 的证据、问题和审核人记录。
- 已定义 `ContentVersion` 的版本链与不可覆盖原则。
- 已定义教材改版、题目纠错和已发布内容风险处理路径。
- 已定义 `Publisher` 的来源与核验边界，以及 `RegionTextbookRelation` 的独立审核门槛。
- 已定义地区关系不能由已核验教材版本或模型记忆推断的规则。

### 待确认事项

1. 教材版权、媒体版权和区域使用权限由谁最终确认。
2. `reviewerId` 是否对接组织账号，还是先使用角色标识。
3. 发布审批是否需要两人复核，教材正文是否需要专门审核角色。
4. `REVIEWED` 与 `VERIFIED` 的最低审核清单和阻断级别。
5. 版本发布后发现严重错误时的下架时限与通知方式。
6. MVP 目标地区、地区教材映射的来源和地区教材有效年份。
7. 学校是否允许覆盖地区默认版本，以及覆盖后的审核与发布规则。
8. 学生更换地区后课程进度、教材版本和历史作答的迁移策略。

在这些事项确认前，任何真实课程内容仍然只能处于非发布状态。

## 10. PHASE 5 工程校验边界

本阶段已实现 `validateCurriculumData`、`validateQuestion`、`validateContentBlock`、`validateKnowledgePrerequisiteGraph` 和 SAMPLE 发布闸门。它们负责在 Mock 数据、Service、Store 和 localStorage 边界发现引用、题型、ContentBlock、媒体、前置图和发布状态问题；它们不是人工审核记录，也不把任何 SAMPLE 记录提升为 `VERIFIED` 或 `PUBLISHED`。

地区教材关系继续独立审核：教材版本有来源和核验状态，不代表其适用于某地区；`RegionTextbookRelation` 的 `sourceId`、有效日期、`status` 和 `needsVerification` 必须单独确认。

## 11. PHASE 6 课程核验记录与自动报告

课程结构实体的核验记录使用独立的 `CurriculumReviewRecord`，不复用内容版本的 `ContentReviewRecord`：

```ts
interface CurriculumReviewRecord {
  id: Id;
  entityType: string;
  entityId: Id;
  action: "verify" | "review" | "reject" | "request_change";
  reviewer: "SYSTEM" | "MANUAL_REVIEW";
  reviewedAt: string;
  note?: string;
}
```

`SYSTEM` 只能记录 Schema、引用、重复、来源、完整性和 DAG 等自动检查；`MANUAL_REVIEW` 才能记录责任人对教材事实、知识点语义、版权与适用范围的人工确认。AI 生成或 AI 记忆本身不能产生 `REVIEWED`。

`npm run curriculum:review` 会读取 `src/data/curriculum/verified/` 下的导入数据，输出完整性统计、问题列表、SAMPLE 污染结果、知识关系 DAG 结果和最终 `PASS` / `FAIL` / `REQUIRES_MANUAL_REVIEW`。当前 Golden Sample Framework 的结构校验通过，但仍为 `UNVERIFIED`，因此最终结果为 `REQUIRES_MANUAL_REVIEW`。

生产保护由 `src/services/curriculum/accessPolicy.ts` 集中执行：生产默认只允许 `verificationStatus = REVIEWED`；开发环境通过 `VITE_ALLOW_SAMPLE_CURRICULUM` 和 `VITE_ALLOW_UNREVIEWED_CURRICULUM` 控制是否读取占位或未核验数据，不能在各页面分散绕过。

## 12. PHASE 7 LearningMap 读取与审核边界

LearningMap 只能把课程事实作为只读输入投影到地图，不改变任何实体的 `status`、`verificationStatus`、来源或版权字段。正式 `/learning-map` 使用 profile 数据集时，课程 Service 继续执行集中访问策略；`REVIEWED` 是生产课程读取的必要核验状态，教材本身已核验不能替代地区教材关系、出版社、媒体或下游关系的独立核验。

开发 `/dev/learning-map` 的 Golden Curriculum 是 `UNVERIFIED`，Map Demo Fixture 是 `SAMPLE`。开发页面必须显示 `UNVERIFIED DATA` 或 `SAMPLE DATA` / “开发样本”，且只用于适配器、布局、状态和交互验证。开发预览不能把 `UNVERIFIED` 变成 `REVIEWED`，也不能把 Demo 节点当作真实教材内容。

PHASE 7 地图节点不展示教材正文、完整课文、题目答案或未发布媒体；节点详情只展示知识点名称、所属 Lesson / Unit、地图状态、完成度和前置知识。正式课程发布仍须满足本文件的教材来源、版权、内容审核、地区关系审核和教材核验门槛。

## 13. PHASE 8 LessonPlayer 内容审核边界

LessonPlayer 将 Curriculum 事实与 LearningContent 呈现内容分开审核。即使 Textbook、Unit、Lesson、KnowledgePoint 和 LessonKnowledgePoint 映射都已 `REVIEWED`，只要对应 LearningContent 不是 `REVIEWED`，正式 `/lesson` 就必须返回“该学习内容暂未开放”，不得仅凭课程结构已核验而放行。

```text
Curriculum chain: REVIEWED
        +
LearningContent: REVIEWED
        +
媒体引用、来源、版权与有效状态满足门槛
        ↓
正式 LessonPlayer 可读
```

PHASE 8 的 `LessonPlayerRepository` 集中执行该闸门，页面不得自行判断发布资格。`SAMPLE` / `UNVERIFIED` 内容只能在显式开发配置和开发路由显示，并必须带有开发样本或未审核警示；Demo Lesson 使用原创、虚构内容，不代表真实教材正文。

`LessonContentRenderer` 只能渲染结构化 ContentBlock 及安全文本属性，不使用 `v-html`。Interactive 与 Practice Placeholder 只允许展示非评分过程、揭示或观察互动，不接收答案、不自动判题、不产生 `MasteryEvent`、`KnowledgeMastery` 或 `KnowledgeEnergy`。

媒体仍由独立 `MediaAsset` 引用；读取前必须保留 `sourceId`、`copyrightStatus`、`license`、`status`、`version` 和 `needsVerification` 等审核信息。媒体加载失败只能显示回退提示，不能把缺失媒体伪装成已发布内容。

PHASE 8 已实现的是读取保护与开发验证，不等于真实审核后台、人工审核工作台或发布流水线已经完成。正式内容录入前仍需补齐教材来源、版权证据、内容审核和教材核验。

## 14. PHASE 9 Question Engine 审核边界

PHASE 9 新增的 Question 读取闸门与 CourseContent 闸门独立执行：

```text
Question.status / verificationStatus / sourceId
        +
QuestionKnowledgePoint 关系与核验
        +
题型结构、答案规则、题目版本和 MediaAsset 引用
        ↓
Question Engine 可读取
```

生产题目必须满足 `status = PUBLISHED`、`needsVerification = false`、来源存在、题目版本可解释、关系至少有一个有效 `PRIMARY`，且所有关键媒体满足 `MediaAsset` 的状态、版权和来源门槛。题目本体已核验不能替代知识点关系或媒体的独立核验。

开发路由可在显式配置下展示 `SAMPLE` / `UNVERIFIED` 题目，但必须显示“开发样本”或“未审核题目”警示；开发夹具不能进入正式题目集合，也不能被题目引擎自动升级为 `REVIEWED` 或 `PUBLISHED`。

PHASE 9 的 Validator 只产生 `QuestionAttemptResult`，简答题返回 `manual_review_required`。它不写入 `MasteryEvent`、`KnowledgeMastery`、`KnowledgeEnergy`、`WrongQuestion` 或 `Reward`。题目审核仍需人工确认答案、解析、目标年级、教材范围、版权和适龄性。

## 15. PHASE 10 Mastery 证据审核边界

PHASE 10 不把 `LearningEvidence` 或 `MasteryRecord` 当成待发布内容。它们是学习行为事实与读取模型，但每条证据仍保留题目和 `QuestionKnowledgePoint` 的来源核验状态：

```text
Question + QuestionKnowledgePoint
        ↓（集中访问闸门）
completed QuestionSession / valid QuestionAttempt
        ↓
LearningEvidence
        ↓
MasteryRecord（algorithmVersion）
```

- 生产证据要求 Question 与 QuestionKnowledgePoint 关系同时满足生产读取条件；题目本体已核验不能替代关系本身的来源、状态和核验。
- SAMPLE / UNVERIFIED 数据只允许在显式开发配置中使用，必须保存 `isSample` / `evidenceSourceStatus`，并在 `/dev/mastery` 明确展示。它们不能混入正式用户的生产掌握度数据。
- 未提交题、未完成 Session、缺少题目或关系、重复 / 孤儿尝试以及 `manual_review_required` 只记录 diagnostic，不生成 `correct` / `incorrect` 证据。
- `masteryScore` 只表示已有证据；PHASE 10 不实现时间衰减、KnowledgeEnergy、Review Scheduling、Spaced Repetition 或任何内容发布状态的自动升级。
- `MasteryRecord` 不使用 `DRAFT`、`ACTIVE` 或 `PUBLISHED`；其算法版本和证据来源状态不能由 `ContentReviewRecord` 代填。
