# 知识岛｜Assessment 设计与实现边界

## 1. AssessmentDefinition

Assessment 是一次固定题目集合，不是题库随机抽样器：

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

## 4. 明确不在本阶段

PHASE 9 不包含：

- 随机抽题、题目推荐或自适应难度。
- 通过分数自动解锁课程、改变地图状态或判定掌握。
- `MasteryEvent`、`MasteryScore`、`KnowledgeEnergy`、WrongBook、Reward 或 Streak 写入。
- AI Question Generation、AI Grading、开放题自动评分或正式考试规则。
- 真实教材题库、教材内容发布或人工审核工作台。

Assessment 结果只描述当前题目集合的作答证据。正式题库上线前必须完成教材版本、知识点、来源、版权、题目审核、关系核验和媒体审核。
