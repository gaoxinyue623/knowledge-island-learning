# 知识岛｜Practice / Extension / Challenge

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 状态 | CONTENT SYSTEM EXPANSION 01.4 已实现为独立读取与生成服务 |
| 类型 | `src/types/content-expansion.ts` |
| 服务 | `src/services/content-expansion/contentExpansionRepository.ts`、`practiceService.ts` |
| 开发页面 | `/dev/content-expansion` |

## 1. 三种练习模式

`PracticeSet.mode` 只有：

- `basic`：基础理解和直接练习。
- `reinforce`：围绕同一知识点的巩固变化。
- `application`：把知识点放到简单生活情境中。

每组保存 `templateIds`、`targetCount` 和 `difficultyRange`。Golden 夹具使用目标数量 12～16、应用 6；目标数量是内容配置，不代表已经持久化了这么多题。

标准练习题的完整路径仍然是：

```text
PracticeSet
  → ExerciseTemplate
  → ExerciseInstance
  → GeneratedQuestionAdapter
  → QuestionSession / QuestionAttempt / Validator
```

Practice 完成不自动写 Mastery、不自动解锁地图，也不改变 Strategy 或 Daily Plan。只有 formal QuestionAttempt 才能进入既有证据链；如果生成题未经审核，仍受 Question access policy 保护。

## 2. ExtensionActivity

拓展活动必须回到真实生活、跨场景观察或开放表达，例如整理玩具、比较家中物品、寻找教室图形。它不把更高年级知识提前塞入当前 KnowledgePoint，也不伪装成标准题。

它使用 `StructuredContent`，没有 Question answer rule，不产生自动分数。

## 3. Challenge

Challenge 是少量更深思考的开放任务，例如凑成 10、按数量排序并说明方法、用图形拼图。它用于鼓励解释和迁移，不是排名、竞速、连续签到或惩罚机制。

## 4. KnowledgePoint Hub

LessonPlayer 只展示体验层摘要和入口，不把互动活动、练习题、拓展和挑战全部展开成一张长页面。`KnowledgePointExperienceHub.vue` 展示数量并链接到体验层页面；当前开发入口读取 Golden dataset，正式 profile 入口不会自动读取样本内容。

## 5. 审核与隔离

PracticeSet、ExtensionActivity 和 Challenge 都需要 `REVIEWED + isSample=false` 才能进入生产；当前 Golden Bundle 全部为 `UNVERIFIED + isSample=true`。仓储按 `profile` / `golden` 数据集隔离，profile 对当前夹具返回空结果。

以下能力不属于本系统：Reward、XP、Coins、Achievement、Streak、AI 诊断、AI 出题、AI 学习路径、Spaced Repetition、通知、云同步、账号认证和 Grade 2 内容。
