# Storage Migration Matrix

所有当前本地 Storage 都必须有 schemaVersion、safe parse、Zod/结构验证或等价校验、损坏回退和诊断。宠物 IndexedDB 已升级到 v2，地图键命名升级到 v2（payload 保持 schemaVersion 1），新增学生活动记录 v1；其余本地版本仍为 v1。第二阶段另有 Node.js/SQLite 账号与宠物备份，不迁移全站学习档案。

| Storage | Key | 当前版本 | 迁移路径 | 损坏回退 | 数据损失风险 |
| --- | --- | ---: | --- | --- | --- |
| StudentCurriculumProfile | `knowledge-island.curriculum-profile` | 1 | v1 读取；未知版本按空档案恢复 | 回到 onboarding，保留诊断 | LOW |
| LearningMap Progress | `knowledge-island.learning-map-progress.v2:[profile,dataset,textbook]` | 1 | 旧单教材键按需迁移，保留备份；可由完成会话恢复 | 保留损坏数据并提示，禁止静默覆盖 | MEDIUM |
| LearningActivity | `knowledge-island.activities.v1:{profileId}` | 1 | 新增记录；旧无时间戳活动不回填 | 保留损坏数据，提示写入失败 | MEDIUM |
| LessonSession | `knowledge-island.lesson-sessions` | 1 | v1 读取；非法会话回退 | 允许重新开始，不白屏 | LOW |
| QuestionSession | `knowledge-island.question-sessions` | 1 | v1 读取；过滤非法作答 | 清除损坏会话，不改题目事实 | LOW |
| Mastery / Evidence | `knowledge-island.mastery-records`; `knowledge-island.learning-evidence` | 1 | v1 读取；Evidence 可重建 | 空记录，算法版本不变 | MEDIUM |
| LearningHistory | `knowledge-island.learning-history` | 1 | v1 读取；非法事实不 append | 空历史并显示诊断 | MEDIUM |
| WrongBook | `knowledge-island.wrong-book` | 1 | v1 读取；校验 profile + question identity | 空错题本，不改 Attempt | MEDIUM |
| ReviewQueue | `knowledge-island.review-queue` | 1 | v1 读取；从 Strategy snapshot 可重投影 | 空队列，Strategy 仍只读 | LOW |
| Reward Events | `knowledge-island.reward-events` | 1 | v1 读取；按 sourceId 去重 | 保留原记录，空视图并阻止覆盖写入 | MEDIUM |
| Growth / KnowledgeEnergy | `knowledge-island.growth`; `knowledge-island.knowledge-energy` | 1 | v1 读取；可从 Reward Events 重建 | 空快照，不改 Reward 事实 | LOW |
| Achievement | `knowledge-island.achievements` | 1 | v1 读取；按 profile 校验 | 空里程碑记录 | LOW |
| DailyPlan | `knowledge-island.daily-learning-plans` | 1 | v1 读取；按 `DAILY_PLAN_V1` 重建 | 空计划，不改 Strategy/Mastery | LOW |
| ParentReport Preferences | `knowledge-island.parent-report-preferences` | 1 | v1 读取；只保留 range/subject | 默认 7d / ALL | LOW |
| Pet account ledger（IndexedDB） | `knowledge-island.pet.v1` 数据库，`accounts` 表 | 2 | v1 原事件保留，原伙伴归属 mint；PET_V1 金额不变 | 保留原账本，阻止消费，事务失败整体回滚 | MEDIUM |

后端 SQLite 使用 user_version 1，表结构和账号隔离见 [后端说明](../operations/PET_BACKEND.md)，不属于浏览器 Storage 自动修复范围。

宠物积分、背包、独立伙伴经验和家园装饰由同一事件账本重放，详情见 [学习积分与宠物成长](../learning/PET_GROWTH.md)。

## 1. 孤儿数据

`recoverOrphanRecords` 只保留外键存在的记录，丢弃孤儿 ID 并返回排序后的诊断；不修改输入数组、不猜测替代 ID、不写入其他 Domain。适用于 LessonSession、QuestionSession、Mastery、WrongBook、ReviewQueue 和 DailyPlan 等引用型载荷。

## 2. 验证

- `validateStorageMigrationMatrix` 检查版本、重复 storage name/key 和回退说明。
- `tests/phase16.test.ts` 覆盖旧矩阵、字段/关系回退契约和孤儿恢复。
- 各领域既有 Storage 测试继续保留并纳入全量回归。
