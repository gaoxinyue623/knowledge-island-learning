# 知识岛｜LearningEvidence 契约

> 本文档定义 PHASE 10 如何从 QuestionSession 派生学习证据。它不创建新题型、不进行 AI 判题，也不把课程完成当作掌握度事实。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 10.1～10.4 |
| 状态 | 证据类型、来源、稳定 ID、权重、多知识点拆分、生产闸门、diagnostic 和测试已实现并验证 |
| 实现入口 | `src/services/mastery/evidenceExtractor.ts` |
| 上游 | `QuestionSession`、`QuestionAttempt`、`Question`、`QuestionKnowledgePoint` |
| 下游 | `MasteryEngine`、`MasteryRepository`、`MasteryRecord` |

## 1. 证据来源资格

证据必须同时满足：

1. `QuestionSession.status = completed`。
2. Attempt 已提交，且结果为 `correct` 或 `incorrect`。
3. Attempt 的 Question 存在，且 Question 有可用的 QuestionKnowledgePoint 关系。
4. 关系权重满足 `0 < weight <= 1`；同题全部关系权重总和约等于 `1`。
5. 生产环境中 Question 与关系均通过集中 `CurriculumAccessPolicy`；开发环境若显式允许 SAMPLE / UNVERIFIED，必须保留警示与来源状态。

LessonSession completion、MapNode completion、Assessment completion、Question 难度本身和题目数量都不是独立证据。

## 2. 证据结构

```ts
interface LearningEvidence {
  id: string
  type: 'question_attempt'
  studentProfileId: string
  knowledgePointId: string
  source: {
    questionId: string
    questionAttemptId?: string
    assessmentId?: string
    questionSessionId?: string
  }
  outcome: 'correct' | 'incorrect'
  questionDifficulty: number
  knowledgeWeight: number
  evidenceWeight: number
  occurredAt: string
  metadata?: {
    sourceVerificationStatus?: string
    isSample?: boolean
    questionVersion?: number
  }
}
```

## 3. 稳定 ID 与幂等

证据 ID 使用以下事实生成：

```text
learning-evidence:{studentProfileId}:{questionSessionId}:{questionId}:{knowledgePointId}
```

Attempt ID 使用 `question-attempt:{questionSessionId}:{questionId}`。禁止使用 `Math.random()` 或仅使用当前时间作为业务身份。Repository 按证据 ID 去重；重复处理同一 Session 不增加证据数量或版本。

## 4. 多知识点题目

如果同一题有：

```text
KnowledgePoint A: weight 0.7
KnowledgePoint B: weight 0.3
```

一次有效作答会生成两条 Evidence，分别指向 A、B。每条证据的 `evidenceWeight` 为对应 `knowledgeWeight × difficultyWeight`，不能把一次作答的结果只归到一个默认知识点。

## 5. 结果与诊断

以下情况不产生 `LearningEvidence`，但会返回可观察的 diagnostic：

| 情况 | 处理 |
| --- | --- |
| Session 未完成 | `MASTERY_SESSION_NOT_COMPLETED` |
| Attempt 未提交 | `MASTERY_ATTEMPT_NOT_SUBMITTED` |
| 结果缺失或不在允许枚举 | `MASTERY_ATTEMPT_RESULT_MISSING` / invalid |
| `manual_review_required` | `MASTERY_MANUAL_REVIEW_IGNORED` |
| 题目孤儿 | `MASTERY_QUESTION_ORPHAN` |
| 关系缺失或来源不可读 | `MASTERY_MAPPING_MISSING` / source diagnostic |
| Session 外的孤儿 Attempt | `MASTERY_ATTEMPT_ORPHAN` |
| 缺少 Session 题目 Attempt | `MASTERY_ATTEMPT_MISSING` |

`manual_review_required` 不得被转换成 `correct` 或 `incorrect`，也不进入掌握度分母。

## 6. 难度与来源

现有题目 `FOUNDATION`、`STANDARD`、`ADVANCED` 分别归一化为 `1`、`3`、`5`。难度只影响证据权重，不直接修改掌握度。每条证据保留题目 / 关系的核验状态、SAMPLE 标记和题目版本，便于解释和后续审核。

正式题目和关系已核验，不表示该地区教材关系或媒体版权自动已核验；来源链仍由课程与内容审核域独立负责。
