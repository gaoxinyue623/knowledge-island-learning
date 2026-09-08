# 知识岛｜CONTENT SYSTEM EXPANSION 01

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | CONTENT SYSTEM EXPANSION 01.5：Golden Content Verification |
| 状态 | Activity Domain、六类互动渲染器、Exercise Template Engine、Practice / Extension / Challenge 数据契约、开发验证页面和 Golden G1 Math 夹具已实现；Golden 内容仍为 `SAMPLE + UNVERIFIED`，不具备生产发布资格 |
| 目的 | 为每个 KnowledgePoint 增加可验证的学习体验层，不改变 Curriculum、Mastery、Strategy 或 Daily Plan 的事实边界 |
| 事实来源 | `src/types/content-expansion.ts`、`src/data/content-expansion/`、`src/services/interactive-activity/`、`src/services/exercise-template/`、`src/services/content-expansion/` |
| 使用者 | 学生端体验开发、内容工程、教研审核和质量验证 |
| 下游消费者 | 开发活动页、Golden 内容页、未来经人工审核后的 LessonPlayer Hub / Question Engine 接入 |

## 1. 目标与边界

扩展系统回答“如何围绕一个知识点学习和练习”，而不是重新定义课程事实：

```text
Curriculum
  ↓ 事实与关系
KnowledgePoint
  ↓ 结构锚点
Content Expansion Bundle
  ├─ LearningContent
  ├─ InteractiveActivity
  ├─ ExerciseTemplate → ExerciseInstance → Question adapter
  ├─ PracticeSet
  ├─ ExtensionActivity
  └─ Challenge
```

必须保持以下职责：

- `Curriculum` 只保存教材、Unit、Lesson、KnowledgePoint、来源和审核事实。
- `KnowledgePoint` 只保存知识结构，不增加 UI、活动或题目字段。
- `LessonPlayer` 负责教学步骤呈现；体验层在 KnowledgePoint Hub 中按需读取。
- `QuestionEngine` 负责正式 QuestionSession、Attempt 和确定性判题。
- `InteractiveActivity` 负责非 Question Engine 的交互学习，不产生 Mastery 证据。
- `ExerciseTemplate` 只负责受约束的确定性生成；生成题必须经过 Question Engine 才能成为正式作答事实。

Activity completion、Practice completion 和 Challenge completion 都不等于 Mastery，也不会自动解锁地图节点、修改 `MASTERY_V1`、`STRATEGY_V1` 或 `DAILY_PLAN_V1`。

## 2. 阶段完成情况

### 2.1 Activity Domain & Registry

已实现 `InteractiveActivity`、12 类注册类型、Zod 配置校验、稳定 ID、来源 / 审核字段和生产门禁。注册表只由 `activityRegistry` 维护，不在页面中堆叠题型分支。

### 2.2 Interactive Activity Engine

已实现 `drag_match`、`drag_classify`、`sort_order`、`number_line`、`select_region`、`simulation` 六类渲染器。拖拽类使用 Pointer Events，并提供“先选内容、再选目标”的按钮与键盘替代方式；未实现的 `build_object`、`connect_pairs`、`fill_container`、`step_operation`、`observe_discover`、`timed_challenge` 显示安全占位。

### 2.3 Exercise Template Engine

已实现一年级数学的 8 类模板、字符串种子 PRNG、简单范围 / 非负 / 不进位 / 不重复约束、稳定 `templateId + seed + index` 实例 ID、1000 条临时样本校验和 `GENERATED_FROM_VERIFIED_TEMPLATE` Question 适配器。生成器没有无种子 `Math.random()`。

### 2.4 Practice / Extension / Challenge

已实现 `PracticeSet` 的 `basic`、`reinforce`、`application` 三种模式，以及独立的 `ExtensionActivity`、`Challenge` 记录。`PracticeService` 可以把模板生成的实例组装为新的 QuestionSession 起点；它不会覆盖原 Session / Attempt。

### 2.5 Golden Content Verification

已提供 4 个一年级数学候选 KnowledgePoint 的小规模 Golden 夹具。每个夹具包含 2 个 LearningContent blocks、2 个互动活动、3 组 PracticeSet、1 个拓展和 1 个挑战。它们只用于 `/dev/content-expansion` 与 `/dev/activity-engine`，等待人工内容审核后才能进入生产。

## 3. 数据与状态

### 3.1 InteractiveActivity

活动包含 `activityType`、`difficulty: L1～L5`、typed `config`、`learningGoal`、`completionPolicy`、`verificationStatus`、`isSample` 和 `sort`。首版支持的配置使用普通对象、逻辑坐标或 `templateKey + typed parameters`；不执行脚本，不使用 `eval`。

### 3.2 ActivityProgress

活动进度单独保存在 `knowledge-island.interactive-activity-progress`，载荷为 `schemaVersion: 1`。身份为 `profileId + activityId`，损坏 JSON 或不符合 Zod schema 时清除并回退为空记录，页面仍可继续。

```text
ActivityResult
  → InteractiveActivityService
  → ActivityProgressStorage
```

Activity progress 不是 `LearningEvidence`，也不写 `MasteryRecord`。

### 3.3 ExerciseInstance

实例保存结构化 prompt、`AnswerSpec`、解释、难度、知识点、派生算术信息和模板来源状态；不复制 Curriculum 或 Question 的完整事实。适配器只在需要接入正式作答时创建 `Question`，生成题仍必须经过现有 `QuestionSession`、`QuestionAttempt` 和 Validator。

## 4. 生产与样本保护

- Activity、ExerciseTemplate、PracticeSet、ExtensionActivity 和 Challenge 都要求 `isSample = false`、`verificationStatus = REVIEWED` 才能通过对应生产门禁。
- 当前 Golden 内容全部为 `isSample = true`、`verificationStatus = UNVERIFIED`，profile 数据集读取结果为空。
- 正式页面不会自动读取 Golden Bundle；开发页面明确标注 `DEVELOPMENT ONLY`。
- `select_region` 只保存 `assetKey` 和 normalized logical coordinates，不写浏览器像素值，也不写外部硬编码 URL。
- Golden Content 不自动改变教材审核结果，不把 Batch 01 候选数据改为 `REVIEWED`。

## 5. 页面与验证入口

- `/dev/activity-engine`：切换 6 类可用活动和未支持占位，验证 ActivityResult、触摸、键盘和样本提示。
- `/dev/content-expansion`：切换 4 个 Golden KnowledgePoint，查看 LearningContent、活动、练习模式、拓展、挑战和确定性实例预览。
- LessonPlayer 的开发入口通过 KnowledgePoint Hub 以摘要形式链接到体验层，不把所有活动塞进课程长页面。

## 6. 明确不在本扩展

不实现 Reward、Coins、XP、Achievement、Streak、家长 / 教师看板、AI Tutor、AI 总结 / 诊断 / 出题、AI 学习路径、Spaced Repetition、SM-2、FSRS、复习日历、通知、云同步、账号认证、CMS、游戏引擎或 Grade 2 数据。

本阶段明确不修改：

```text
MASTERY_V1: NO
STRATEGY_V1: NO
DAILY_PLAN_V1: NO
PHASE 17: NO
```

## 7. 相关文档

- `INTERACTIVE_ACTIVITY_ENGINE.md`
- `EXERCISE_TEMPLATE_ENGINE.md`
- `PRACTICE_SYSTEM.md`
- `GOLDEN_CONTENT_G1_MATH.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
