# 知识岛｜Assessment 设计与实现边界

> PHASE 11 只在 Assessment 完成且掌握度刷新成功后读取 `LearningRecommendation`；它不改变 `QuestionSession`、题目集合或本次 Assessment 的完成语义。策略详情见 `LEARNING_STRATEGY.md`。

## 1. AssessmentDefinition

Assessment 是一次固定题目集合，不是题库随机抽样器。PHASE 10 在完成后增加独立的掌握度后处理，但不改变 Assessment 本身的完成语义：

```ts
interface AssessmentDefinition {
  id: string;
  knowledgePointId: string;
  questionIds: string[];
  mode: "practice";
}
```

启动时还必须携带：

```ts
interface AssessmentLaunchContext {
  textbookId: string;
  unitId: string;
  lessonId: string;
  knowledgePointId: string;
  source: "lesson_practice" | "dev";
}
```

Adapter 会验证课程上下文和 `QuestionKnowledgePoint` 关系，不能从页面名称、地区或题目文本推断教材与知识点。

## 2. PHASE 9 Demo Assessment

Demo Assessment：`DEMO_ASSESSMENT_MATH_KP_01`。

固定顺序：

1. `DEMO_QUESTION_SINGLE_CHOICE`
2. `DEMO_QUESTION_MULTIPLE_CHOICE`
3. `DEMO_QUESTION_TRUE_FALSE`
4. `DEMO_QUESTION_FILL_BLANK`
5. `DEMO_QUESTION_CALCULATION`
6. `DEMO_QUESTION_SHORT_ANSWER`

Demo 使用 6 道原创 SAMPLE 题和 7 条 `QuestionKnowledgePoint` 关系（计算题同时覆盖 PRIMARY 与 SECONDARY），仅用于验证题型、判题、反馈、恢复和回链。

## 3. 完成语义

Assessment 必须提交全部题目才可完成；完成页展示本次结果，短答题仍标记待人工判断。完成后通过 `assessmentCompleted=true` 返回 LessonPlayer Summary；它不代表课程完成，也不代表 KnowledgePoint 已掌握。

## 4. PHASE 10 掌握度后处理

已完成的 `QuestionSession` 可以由页面 / Store 显式调用 `MasteryProcessingService`。服务读取 `QuestionAttempt`、对应 `Question` 和 `QuestionKnowledgePoint` 关系，按权重与题目难度派生 `LearningEvidence`，再由确定性 `MasteryEngine` 重算独立的 `MasteryRecord`。

- 未完成 Session、未提交题、孤儿题目、缺少知识点关系和 `manual_review_required` 只产生 diagnostic，不产生正确 / 错误掌握证据。
- 一道题的多个知识点关系可以生成多条证据；同一稳定证据 ID 重放幂等。
- Assessment 仍然保持 `completed`，即使 Mastery 后处理失败；错误只在结果页显示可恢复提示。
- Question Engine Store 不直接修改 Mastery Store；地图完成度、节点解锁、Lesson completion 和课程主链也不被掌握度改写。
- `masteryScore` 表示已有学习证据，不使用时间衰减；`KnowledgeEnergy`、复习排程和 Spaced Repetition 不在 PHASE 10 实现。

## 5. 明确不在 PHASE 9 / 10

PHASE 9 / 10 不包含：

- 随机抽题、题目推荐或自适应难度。
- 通过分数自动解锁课程、改变地图状态或把完成度替代为掌握度。
- `KnowledgeEnergy`、WrongBook、Reward、Coins、XP、Achievement、Streak、Leaderboard 或复习排程写入。
- AI Question Generation、AI Grading、开放题自动评分或正式考试规则。
- 真实教材题库、教材内容发布或人工审核工作台。

PHASE 10 保留 `MasteryEvent` 七种事件枚举作为兼容契约，但实际掌握度输入由 `LearningEvidence` 派生；不实现 Adaptive Learning、按掌握度自适应选题、AI Grading、AI Tutor、个性化学习路径或 ML / Bayesian 模型。

Assessment 结果只描述当前题目集合的作答证据。正式题库上线前必须完成教材版本、知识点、来源、版权、题目审核、关系核验和媒体审核。

## 6. PHASE 11 完成后策略提示

完成的 `QuestionSession` 仍先经过 `MasteryProcessingService`。只有掌握度刷新成功、当前课程地图和关系通过策略来源闸门时，Assessment 完成页才读取 `LearningRecommendation`。策略卡片可以告诉学生继续当前知识点、巩固、补充证据或进入下一步，但不生成任务日期、复习时间、能量、错题本或奖励。

如果 Mastery 后处理失败，Assessment 仍保持 `completed`，页面显示可恢复诊断，策略不根据未知数据推断推荐。`QuestionEngineStore`、`MasteryStore` 和 `LearningMapStore` 不直接写 StrategyStore。
