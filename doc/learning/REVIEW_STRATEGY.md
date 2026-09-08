# Review Strategy｜当前巩固建议

## 文档状态

| 项目 | 状态 |
| --- | --- |
| Review / Reinforcement 纯规则 | 已实现 |
| Review 稳定排序与 limit | 已验证：`tests/learning-strategy.test.ts` |
| 复习日期、间隔、记忆衰减 | 不在范围内 |

## 1. Review 的含义

`ReviewRecommendation` 只表示现在可以进行的学习动作，不是任务、提醒或日程。它不表达“已经遗忘”“复习到期”“今日必须复习”“距离上次复习多少天”或能量状态。

策略只读取 `MasteryRecord.masteryScore`、`confidence`、`state` 和 `evidenceCount`，不从 `QuestionAttempt` 重新计算掌握度。作答历史和证据数量不一致时只产生 diagnostic，不覆盖掌握度记录。

## 2. 规则与文案

| 优先级 | 条件 | 类型 | 文案方向 |
| --- | --- | --- | --- |
| 1 | `state = weak` 或分数 `< 40` | `REINFORCE` | 建议巩固这个知识点 |
| 2 | 置信度 `< 0.5` | `GATHER_MORE_EVIDENCE` | 再练几题，补充一些证据 |
| 3 | 分数 `>= 80` 且证据 `< 3` | `GATHER_MORE_EVIDENCE` | 分数不错，但还需要更多作答证据 |

`not_started`、普通 `learning` 和满足当前掌握条件的 `mastered` 不进入优先巩固列表。没有 `MasteryRecord` 的知识点保持 `not_started`，由下一知识点解析决定是否开始。

## 3. 排序

Review 排序不依赖输入数组顺序：

1. 弱掌握。
2. 高分但置信度不足。
3. 证据数量不足。
4. 同类按 `masteryScore` 升序、`confidence` 升序、地图 `sort` 升序。
5. 最后按 `knowledgePointId` 和 `mapNodeId` 字典序稳定打破平局。

默认返回前 3 条；调用方可以传入非负整数 `limit`。不会随机抽样，也不会按最近学习时间、连续天数、奖励或能量排序。

## 4. 来源与显示边界

生产 `profile` 遇到 SAMPLE、UNVERIFIED、REJECTED 或样本派生记录时不生成正式 Review。开发 `demo` / `golden` 可以展示夹具，但必须保留来源状态和警示。Review 卡片只展示知识点、当前动作与原因，不展示复习日程。
