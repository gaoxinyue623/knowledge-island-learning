# Learning History Data Flow｜PHASE 12.1

## 文档状态

| 项目 | 状态 |
| --- | --- |
| LessonSession 投影 | 已实现 |
| QuestionSession 投影 | 已实现 |
| schemaVersion 1 本地存储 | 已实现 |
| Profile / Textbook 隔离与稳定排序 | 已实现 |
| UI `/history` 与开发入口 | 已实现 |

## 1. 事实流

```text
LessonPlayerStore
  ├─ startSession / load resumed session → lesson_started
  └─ completeLesson                     → lesson_completed

QuestionEngineStore
  ├─ startSession / load resumed session → assessment_started
  └─ completeAssessment                 → assessment_completed + summary
```

Projection 只接受 `LessonSession` 或 `QuestionSession`，不监听页面访问、点击、hover、scroll 或停留时长。相同 Session 的重复加载和完成事件由 deterministic ID 去重。

## 2. 查询与持久化

`LearningHistoryRepository` 提供按 Profile、KnowledgePoint、Lesson、Textbook 查询，以及 `clearDemoHistory()`。正式页面显式排除 SAMPLE；开发页面可以读取并显示 SAMPLE badge。存储载荷固定为：

```ts
{ schemaVersion: 1, records: LearningHistoryRecord[] }
```

Zod 校验失败或 JSON 损坏时清除坏载荷、返回空集合并保留 warning；任何恢复路径都不抛出导致页面白屏的异常。
