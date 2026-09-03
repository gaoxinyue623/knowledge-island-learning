# 知识岛｜SAMPLE Curriculum 数据

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 11.4（继承 PHASE 5～10 Mock 基线） |
| 状态 | 已实现并通过本地校验；包含地图、LessonPlayer、Question Engine、Mastery 与 Learning Strategy 开发夹具，不代表真实课程数据 |
| 唯一事实源 | `PRODUCT.md`、`DATA_MODEL.md`、`CURRICULUM.md`、`MVP_CURRICULUM.md` |
| 数据入口 | `src/data/curriculum/index.ts`、`src/data/learning-strategy/` |

## 1. 使用边界

`src/data/curriculum/` 只提供开发、测试和页面状态演示所需的 SAMPLE 记录。记录不代表真实地区、出版社、教材版本、教材目录、教材正文、题目答案或已取得版权。

所有内容、教材、地区教材关系、单元、课次、知识点、地图、课程内容、题目和媒体占位记录都必须：

- 使用 `SAMPLE_*` 标识或 sample 前缀。
- 使用 `isSample: true`。
- 使用 `needsVerification: true`。
- 使用 `verificationStatus: SAMPLE`。
- 不使用 `status: PUBLISHED`；结构实体保持 `DRAFT`，内容实体保持 `DRAFT`。
- 通过 `SAMPLE_SOURCE_UNVERIFIED` 追踪来源，版权状态不能被当作已清理。

年级、学期和学科是用于验证选择流程的课程字典；三年级上册是当前 Mock 课程骨架的唯一可继续组合。`Region` 只表示地区选择维度，不是课程知识层父级。

## 2. 目录

```text
src/data/curriculum/
├─ core/
├─ sample/
├─ verified/
├─ grades/
├─ semesters/
├─ subjects/
├─ regions/
├─ publishers/
├─ textbooks/
├─ region-textbooks/
├─ units/
├─ lessons/
├─ knowledge-points/
├─ relations/
├─ maps/
├─ contents/
├─ questions/
├─ sources/
├─ media/
├─ mock/
└─ index.ts
```

`index.ts` 提供聚合数据与按 ID 索引；Service 不在请求过程中反复扫描原始数组。

## 3. 地区教材解析场景

| 场景 | 记录 | 目的 | 预期结果 |
| --- | --- | --- | --- |
| 地区 A | 每科一个 `DEFAULT` | 唯一默认路径 | `AUTO_RESOLVED` |
| 地区 B | 数学一个 `DEFAULT` + 一个 `OPTIONAL`；英语多个 `SUPPORTED` | 多版本与三科独立确认 | `NEEDS_CONFIRMATION` |
| 地区 C | 无地区教材关系 | 未支持地区 / 无候选 | `NOT_AVAILABLE` |

教材版本被多个地区关系复用，说明教材版本事实与地区适用关系是两个独立概念。代码不包含广东、北京、上海或任何真实地区教材映射，也不调用位置 API。

## 4. 课程骨架

三科各有 1 个 SAMPLE 单元、3 个 SAMPLE 课次和 4 个 SAMPLE 知识点。`LessonKnowledgePointRelation` 刻意表达一课多点和一点多课；`KnowledgePrerequisite` 使用无环链条。课程内容只包含示例 `ContentBlock`，题目只包含少量结构夹具，媒体使用本地几何 SVG 占位。

真实课程录入前必须确认教材版本、MVP 单元、知识点、课程目标、来源、版权、地区映射和有效年份；正式发布前仍须完成内容审核和教材核验。

PHASE 6 的唯一 `verified/` 数据是一个 `UNVERIFIED` Golden Sample Framework，不属于本 SAMPLE 集合；生产解析只允许 `verificationStatus = REVIEWED`。

## 5. PHASE 7 LearningMap 数据集

地图开发页提供两个明确隔离的数据集：

| 数据集 | 规模 | 标识 / 用途 | 生产可用性 |
| --- | --- | --- | --- |
| Golden Curriculum | 1 个教材、1 个单元、3 个课次、4 个知识点、6 个映射、3 条关系 | `UNVERIFIED`；验证真实 Curriculum → Map Adapter | 不可用，必须人工审核 |
| Map Demo Fixture | 3 个虚构 Unit、6 个 Lesson、18 个节点、17 条前置关系 | `SAMPLE`；验证多岛布局、状态和跨区解锁 | 不可用 |

Map Demo Fixture 位于 `src/data/learning-map/demo/`，所有教材 / 单元 / 课次 / 知识点 / 关系语义都服务于地图视觉验证，不对应任何真实地区、出版社或教材目录。开发页面必须显示数据集警示；正式路由不会自动加载 Demo。

## 6. PHASE 8 LessonPlayer Demo

`src/data/lesson-player/demo/` 提供 1 个虚构知识点的 8 步 LessonPlayer Fixture：Intro、Concept、Explanation、Example、Media、Interactive、Practice Placeholder 和 Summary。内容为原创通用文本，所有内容块标记 `isSample: true`、`verificationStatus: SAMPLE`；媒体只引用现有 SAMPLE `MediaAsset`，不代表任何真实教材或版权已清理。

LessonPlayer 开发页只用于验证步骤、内容块、会话恢复、完成回链和状态 Showcase。PHASE 8 的 Practice Placeholder 不生成 Question；PHASE 9 的 Assessment 入口使用下方独立 Demo 数据。PHASE 10 可以在显式开发流程中消费完成 Session，生成带 SAMPLE 标识的 Mastery Demo；Lesson completion 不生成掌握度，任何 Demo 也不代表真实课程或正式学生证据。

## 7. PHASE 9 Question Engine Demo

`src/data/question-engine/demo/` 是与 Curriculum SAMPLE 数据分离的题目引擎开发夹具：

| 数据 | 规模 | 用途 | 生产可用性 |
| --- | ---: | --- | --- |
| Demo Assessment | 1 组固定练习、6 道原创题 | 覆盖单选、多选、判断、填空、计算、简答 | 不可用，全部为 SAMPLE |
| QuestionKnowledgePoint | 7 条关系 | 验证 1 个 PRIMARY 与 1 个 SECONDARY 覆盖关系 | 不可用，必须人工核验 |

题目固定顺序为 `singleChoice → multipleChoice → trueFalse → fillBlank → calculation → shortAnswer`。题目、答案规则、解析和媒体仍使用结构化协议；简答只返回人工审核状态。Demo 不代表任何真实教材或地区出版社，不直接生成 `MasteryEvent`、`KnowledgeEnergy`、`WrongQuestion` 或 `Reward`；完成 Session 的掌握度处理必须通过独立 `MasteryProcessingService`，并保留 SAMPLE 来源标识。

## 8. PHASE 10 Mastery Demo

`src/data/mastery/demo/` 提供 `not_started`、`weak`、`learning`、`mastered`、高分低置信度和混合来源等状态夹具。它们只用于 `/dev/mastery` 和自动化测试，不能写入真实教材数据或绕过 Question / QuestionKnowledgePoint 审核闸门。开发样本掌握度必须可重置，正式生产读取不会自动加载这些夹具。

## 9. PHASE 11 Strategy Demo

`src/data/learning-strategy/demo/` 提供 `SAMPLE_STRATEGY_WEAK`、`SAMPLE_STRATEGY_MASTERED`、`SAMPLE_STRATEGY_LOW_CONFIDENCE`、`SAMPLE_STRATEGY_IN_PROGRESS`、`SAMPLE_STRATEGY_LOCKED` 和 `SAMPLE_STRATEGY_NO_AVAILABLE`。所有夹具均为 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE`，只用于 `/dev/strategy` 与自动化测试，不代表真实学生记录。

策略开发页另提供 `UNVERIFIED` 情境，用于确认来源警示和开发数据集边界。正式 profile 不自动加载 Strategy Demo；策略只读 MasteryRecord 与地图状态，不写入地图完成度、解锁、QuestionSession、WrongBook、KnowledgeEnergy 或 Reward。
