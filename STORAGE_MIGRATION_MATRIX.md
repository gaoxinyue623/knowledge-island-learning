# Storage Migration Matrix

所有当前本地 Storage 都必须有 schemaVersion、safe parse、Zod/结构验证或等价校验、损坏回退和诊断。当前版本均为 v1；本阶段没有引入云端迁移或账号数据迁移。

| Storage | Key | 当前版本 | 迁移路径 | 损坏回退 | 数据损失风险 |
| --- | --- | ---: | --- | --- | --- |
| StudentCurriculumProfile | `knowledge-island.curriculum-profile` | 1 | v1 读取；未知版本按空档案恢复 | 回到 onboarding，保留诊断 | LOW |
| LearningMap Progress | `knowledge-island.learning-map-progress` | 1 | v1 读取；丢弃不可解析记录 | 以空进度从 Curriculum 重建 | LOW |
| LessonSession | `knowledge-island.lesson-sessions` | 1 | v1 读取；非法会话回退 | 允许重新开始，不白屏 | LOW |
| QuestionSession | `knowledge-island.question-sessions` | 1 | v1 读取；过滤非法作答 | 清除损坏会话，不改题目事实 | LOW |
| Mastery / Evidence | `knowledge-island.mastery-records`; `knowledge-island.learning-evidence` | 1 | v1 读取；Evidence 可重建 | 空记录，算法版本不变 | MEDIUM |
| LearningHistory | `knowledge-island.learning-history` | 1 | v1 读取；非法事实不 append | 空历史并显示诊断 | MEDIUM |
| WrongBook | `knowledge-island.wrong-book` | 1 | v1 读取；校验 profile + question identity | 空错题本，不改 Attempt | MEDIUM |
| ReviewQueue | `knowledge-island.review-queue` | 1 | v1 读取；从 Strategy snapshot 可重投影 | 空队列，Strategy 仍只读 | LOW |
| Reward Events | `knowledge-island.reward-events` | 1 | v1 读取；按 sourceId 去重 | 空事件，禁止重复奖励 | MEDIUM |
| Growth / KnowledgeEnergy | `knowledge-island.growth`; `knowledge-island.knowledge-energy` | 1 | v1 读取；可从 Reward Events 重建 | 空快照，不改 Reward 事实 | LOW |
| Achievement | `knowledge-island.achievements` | 1 | v1 读取；按 profile 校验 | 空里程碑记录 | LOW |
| DailyPlan | `knowledge-island.daily-learning-plans` | 1 | v1 读取；按 `DAILY_PLAN_V1` 重建 | 空计划，不改 Strategy/Mastery | LOW |
| ParentReport Preferences | `knowledge-island.parent-report-preferences` | 1 | v1 读取；只保留 range/subject | 默认 7d / ALL | LOW |

## 1. 孤儿数据

`recoverOrphanRecords` 只保留外键存在的记录，丢弃孤儿 ID 并返回排序后的诊断；不修改输入数组、不猜测替代 ID、不写入其他 Domain。适用于 LessonSession、QuestionSession、Mastery、WrongBook、ReviewQueue 和 DailyPlan 等引用型载荷。

## 2. 验证

- `validateStorageMigrationMatrix` 检查版本、重复 storage name/key 和回退说明。
- `tests/phase16.test.ts` 覆盖旧矩阵、字段/关系回退契约和孤儿恢复。
- 各领域既有 Storage 测试继续保留并纳入全量回归。
