# 知识岛｜Question Engine 实现说明

> 本文档记录 PHASE 9.1～9.4 已实现的题目引擎、Assessment 和 LessonPlayer 接入，以及 PHASE 10 掌握度后处理和 PHASE 11 策略消费边界。它不把 Demo 题目当作真实教材题库，也不替代 `QUESTION_SCHEMA.md`、`DATA_MODEL.md`、`CONTENT_REVIEW.md`、`MASTERY.md` 或 `LEARNING_STRATEGY.md`。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 当前阶段 | PHASE 11.4：Learning Strategy（Question Engine 作为上游） |
| 状态 | 六类题型、固定 Assessment、确定性判题、反馈、会话恢复、审核闸门、LessonPlayer 回链、完成 Session 的掌握度后处理和完成页策略提示已实现；Question Engine 仍不直接拥有掌握度或策略 |
| 正式入口 | `/assessment`；需要显式 `AssessmentLaunchContext` |
| 开发入口 | `/dev/question-engine`、`/dev/question-engine/states` |
| 题目数据 | 6 道原创 Demo SAMPLE 题；不代表真实教材内容 |

## 1. 目标与边界

Question Engine 负责把一组确定的 `Question` 转成可交互的题目界面，保存草稿、提交结果和恢复位置。它不负责课程事实、教材推断、掌握度、遗忘、奖励或自适应出题。

```text
LessonPlayer Practice
  ↓
AssessmentLaunchContext
  ↓
QuestionEngineStore
  ↓
QuestionEngineAdapter
  ↓
QuestionRepository + QuestionSessionStorage
  ↓
QuestionEngineViewModel
  ↓
QuestionRenderer
  ↓
Answer Validator
  ↓
QuestionAttemptResult / AssessmentResultSummary
```

题目与知识点通过 `QuestionKnowledgePoint` 关系读取；旧 `Question.knowledgePointId` 只保留为迁移兼容字段。`AssessmentDefinition.questionIds` 是固定顺序，PHASE 9 不随机抽题、不按实时难度调整题目，也不调用模型猜测教材版本。

## 2. 已实现题型

| 题型 | 输入 | 结果 |
| --- | --- | --- |
| `singleChoice` | 单选 radio | 与正确选项键精确匹配 |
| `multipleChoice` | 多选 checkbox | 正确集合精确匹配，顺序不影响结果 |
| `trueFalse` | 布尔 radio | 与布尔答案严格匹配 |
| `fillBlank` | 一个或多个文本输入 | 按每个空位的接受答案和规范化规则匹配 |
| `calculation` | 文本计算结果输入 | 精确数值或题目声明的容差匹配 |
| `shortAnswer` | 多行文本输入 | 提交后标记 `manual_review_required`，不自动评分 |

题干、选项、提示、解析和媒体继续使用结构化 `ContentBlock[]` / `mediaAssetId`。QuestionRenderer 使用注册表选择题型组件；未知题型不会导致页面白屏，而是显示可理解的不可用状态。

## 3. 交互与结果

学生可以在当前题目保存草稿；未完成输入时不能提交。提交后答案、结果和输入控件锁定，页面显示正确 / 错误 / 待人工判断、参考答案和结构化解析。只有当前题目已提交后才能进入下一题；全部题目提交后才能完成 Assessment。

结果页展示答对、答错、待人工判断和自动评分正确率。简答题的 `maxScore = 0`，不会进入自动评分分母；没有可评分题目时正确率显示为 `—`。

## 4. 审核闸门与数据集

正式题目必须同时满足题目生命周期、`verificationStatus`、来源、`QuestionKnowledgePoint` 关系、答案规则、题目版本和媒体资源审核条件。`Question` 本体已核验不代表其知识点关系或媒体已经核验。

开发路由可显式查看 `SAMPLE` / `UNVERIFIED`、空内容、暂未开放、加载错误、恢复和已完成状态，并显示来源警示。Demo 题目全部为原创、虚构、`isSample: true`、`needsVerification: true`，不会进入正式题目集合。

## 5. 与学习行为域的隔离

`QuestionAttemptResult` 只描述本次作答。Question Engine 不直接创建或更新 `MasteryEvent`、`MasteryRecord`、`KnowledgeEnergy`、`WrongQuestion` 或 `Reward`；完成 Session 后，页面显式调用独立 `MasteryProcessingService`，由它读取 Attempt 并派生 LearningEvidence / MasteryRecord。`masteryScore` 不因日期流逝自动下降；KnowledgeEnergy 仍是未实现的独立复习信号域。

## 6. 主要实现文件

- `src/types/question-engine.ts`：Assessment、Session、Attempt、ViewModel 和结果类型。
- `src/services/question-engine/questionRepository.ts`：固定题目与关系读取边界。
- `src/services/question-engine/questionEngineAdapter.ts`：上下文校验、审核闸门和 ViewModel 适配。
- `src/services/question-engine/answerValidator.ts`：纯确定性答案校验。
- `src/services/question-engine/questionSessionStorage.ts`：版本化、安全的本地会话存储。
- `src/stores/questionEngineStore.ts`：草稿、提交、导航、完成和恢复状态。
- `src/components/question-engine/`：六类题型、内容、媒体、反馈和未知题型组件。
- `src/pages/QuestionEnginePage.vue`：正式与开发入口。

## 7. 当前限制与后续边界

当前运行时实现 PHASE 9 明确的六类题型和本地 Demo；拖拽、匹配、排序、听力、阅读、口语等题型仍为协议或后续接口。简答需要人工审核，当前没有审核工作台。正式题库、真实教材关联、题目推荐、自适应难度、AI 出题、AI 评分、知识能量、错题本和奖励仍留待后续阶段；Mastery 已由 PHASE 10 的独立服务接入。

## 8. PHASE 10 后处理边界

已完成的 `QuestionSession` 通过 `MasteryProcessingService` 进入 `LearningEvidence` → `MasteryEngine` → `MasteryRecord`。未提交题、未完成 Session、孤儿题目、缺少关系和 `manual_review_required` 只产生诊断。掌握度处理失败不回滚已完成的 Assessment，也不修改 QuestionAttempt；生产证据仍要求 Question 与 QuestionKnowledgePoint 关系通过审核闸门，SAMPLE / UNVERIFIED 只在开发入口显式使用。

## 9. PHASE 11 策略消费

当 Assessment 完成且 Mastery 刷新成功时，页面可以把当前 `LearningMapViewModel`、`MasteryRecord[]` 和已有证据交给 `LearningStrategyService`。完成页只展示“继续学习 / 建议巩固 / 补充证据 / 下一步”等当前动作，不改变 QuestionSession、题目集合或答题结果。Mastery 后处理失败时不生成强策略建议。

Question Engine 不直接写 StrategyStore；Strategy 也不重新计算 `masteryScore`、调题目难度、改变题目集合、创建错题本或复习日程。详细策略协议见 `LEARNING_STRATEGY.md`。
