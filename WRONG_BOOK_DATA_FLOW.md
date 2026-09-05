# WrongBook Data Flow｜PHASE 12.2

## 文档状态

| 项目 | 状态 |
| --- | --- |
| Incorrect Attempt 投影 | 已实现 |
| 幂等处理与错误聚合 | 已实现 |
| Resolve / Reopen 状态 | 已实现 |
| 新 Session 错题重练 | 已实现 |
| QuestionRepository 延迟读取题目 | 已实现 |

## 1. 进入错题本

```text
QuestionSession
  ↓ submitted QuestionAttempt
deterministic result.status === incorrect
  ↓
WrongBookProjectionService
  ↓
WrongBookRepository / schemaVersion 1 storage
  ↓
WrongQuestionRecord（profileId + questionId）
```

correct、manual review、draft、未提交、无结果、孤儿、unsupported 和 corruption 都不会进入。处理 key 为 `profileId + sessionId + questionId`，重复投影不增加错误次数。

## 2. 重练

```text
WrongBookPage
  ↓ AssessmentLaunchContext.source = wrong_book
QuestionEngine（新的 sessionScope）
  ↓
新的 QuestionSession / immutable 原 Attempt
  ↓ correct → resolved
  ↓ incorrect → active + wrongCount / source 更新
```

错题记录只保存题目 ID 和来源，不复制题面、选项、答案或解析；页面通过 QuestionRepository 读取题目显示。
