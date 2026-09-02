# 知识岛｜QuestionSession 会话协议

## 1. 会话用途

`QuestionSession` 保存一次 Assessment 的本地可恢复状态。它与 LessonPlayer 的 `LessonSession` 分开存储，也不属于课程事实。会话不保存教材推断结果；它只保存启动时已经确认的上下文、固定题目 ID、当前位置和作答记录。

## 2. 核心结构

```ts
interface QuestionSession {
  id: string;
  assessmentId: string;
  textbookId: string;
  unitId: string;
  lessonId: string;
  knowledgePointId: string;
  questionIds: string[];
  currentQuestionIndex: number;
  status: "not_started" | "in_progress" | "completed";
  attempts: QuestionAttempt[];
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

interface QuestionAttempt {
  questionId: string;
  answer: QuestionAnswerDraft;
  submitted: boolean;
  result?: QuestionAttemptResult;
  questionVersion?: number;
  submittedAt?: string;
}
```

`QuestionAnswerDraft` 是六类已支持题型的判别联合：单选选项 ID、多选选项 ID 集合、布尔值、填空值数组、计算文本和简答文本。

## 3. 生命周期

```text
not_started
    ↓ 首次输入或开始
in_progress
    ↓ 所有题目 submitted = true 且完成
completed
```

草稿可以覆盖同一题的未提交 Attempt；已提交 Attempt 不能被替换，也不能重新判题或修改。上一题只能回到已提交题目，下一题只能从已提交当前题目继续，完成必须满足 Assessment 中全部题目都已提交。

## 4. 稳定身份与存储

- 存储 key：`knowledge-island.question-sessions`。
- 载荷：`{ schemaVersion: 1, sessions: QuestionSession[] }`。
- Session ID 由 `studentId + assessmentId + textbookId + unitId + lessonId + knowledgePointId` 确定性生成，不使用随机数或当前时间作为身份。
- 同一学生可以同时保留不同 Assessment / 课程上下文的会话。
- Attempt 保存 `questionVersion`，确保题目修改后仍能解释历史作答。

## 5. 安全恢复

读取时通过 Schema 校验载荷。JSON 损坏或版本不识别时清理当前 key、显示可理解警示并返回空会话；`localStorage` 读写异常不会阻断页面。加载 Assessment 时重新以当前固定 `questionIds` 归一化会话：越界游标会被限制，已经不在题目集合中的孤儿 Attempt 会被忽略，未完成会话不会保留错误的 `completedAt`。

## 6. 与结果的关系

`QuestionAttemptResult` 只属于当前 Assessment，包含 `correct`、`incorrect` 或 `manual_review_required`、`score`、`maxScore` 和可选反馈。结果汇总只统计当前 Assessment 的有效 Attempt；简答题不进入自动评分分母。

Session 完成或恢复不会由 QuestionSession Store 自动写入 `MasteryEvent`、`MasteryRecord`、`KnowledgeEnergy`、`WrongQuestion` 或 `Reward`。完成后由页面显式调用 `MasteryProcessingService`，从已提交且可判定的 Attempt 派生 `LearningEvidence` 并重算 MasteryRecord；处理失败不回滚已完成 Session。
